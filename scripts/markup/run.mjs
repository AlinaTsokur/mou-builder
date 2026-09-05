// Общий запуск разметки: копия шаблона (или сам оригинал), правки, строка печатей.
import { getBotClients } from "../google-bot.mjs";
import { applyEdits } from "../docs-edit.mjs";

const FOLDER = "1wAOozC2ofCV3Hsm16wdJoywK6_jvjZpm";

// В подвале таблица подписей: под строкой подписей агентств идёт отдельная строка
// с печатями. Добавляем её строкой таблицы, а не абзацем в ячейке — абзац налезает
// на линию подписи.
async function addStampRow(docs, documentId) {
  const findFooterTable = (doc) => {
    for (const [segmentId, footer] of Object.entries(doc.footers || {})) {
      for (const el of footer.content || []) {
        if (el.table && JSON.stringify(el.table).includes("Agent signature")) {
          return { segmentId, table: el.table, startIndex: el.startIndex };
        }
      }
    }
    return null;
  };

  let doc = (await docs.documents.get({ documentId })).data;
  let found = findFooterTable(doc);
  if (!found) return "таблица подписей в подвале не найдена";
  if (found.table.tableRows.length > 2) return "строка печатей уже есть";

  await docs.documents.batchUpdate({ documentId, requestBody: { requests: [{
    insertTableRow: {
      tableCellLocation: {
        tableStartLocation: { segmentId: found.segmentId, index: found.startIndex },
        rowIndex: found.table.tableRows.length - 1,
      },
      insertBelow: true,
    },
  }] } });

  doc = (await docs.documents.get({ documentId })).data;
  found = findFooterTable(doc);
  const row = found.table.tableRows[found.table.tableRows.length - 1];
  const cells = row.tableCells.map((cell) => cell.content[0].startIndex);
  const texts = [
    "{{#row any_agent}}{{#if seller_agent}}Company Stamp{{/if}}",
    "{{#if buyer_agent}}Company Stamp{{/if}}",
  ];
  // пишем справа налево, чтобы индексы левой ячейки не сдвинулись
  const requests = cells.map((index, i) => ({
    insertText: { location: { segmentId: found.segmentId, index }, text: texts[i] },
  })).reverse();
  await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
  return "строка печатей добавлена";
}

// Строка таблицы в теле документа — вставляется после строки с текстом afterCell,
// сразу с разметкой. cells: на каждую ячейку список кусков [текст, жирный?].
// Кегль, гарнитура и параметры абзаца копируются из строки-якоря: у новой строки
// Google ставит стиль по умолчанию, и она выбивалась бы из таблицы.
async function addBodyRow(docs, documentId, { afterCell, cells }) {
  const cellText = (cell) => (cell.content || [])
    .flatMap((p) => (p.paragraph?.elements || []).map((e) => e.textRun?.content || "")).join("");
  const findRow = (doc) => {
    for (const el of doc.body.content || []) {
      if (!el.table) continue;
      const rowIndex = el.table.tableRows.findIndex((r) => r.tableCells.some((c) => cellText(c).includes(afterCell)));
      if (rowIndex !== -1) return { table: el.table, startIndex: el.startIndex, rowIndex };
    }
    return null;
  };

  let doc = (await docs.documents.get({ documentId })).data;
  let found = findRow(doc);
  if (!found) return `строка-якорь «${afterCell}» не найдена`;
  const anchorRow = found.table.tableRows[found.rowIndex];
  const nextRow = found.table.tableRows[found.rowIndex + 1];
  if (nextRow && cellText(nextRow.tableCells[0]).includes(cells[0][0][0].slice(0, 40))) return "строка уже есть";

  await docs.documents.batchUpdate({ documentId, requestBody: { requests: [{
    insertTableRow: {
      tableCellLocation: { tableStartLocation: { index: found.startIndex }, rowIndex: found.rowIndex },
      insertBelow: true,
    },
  }] } });

  doc = (await docs.documents.get({ documentId })).data;
  found = findRow(doc);
  const row = found.table.tableRows[found.rowIndex + 1];
  const starts = row.tableCells.map((cell) => cell.content[0].startIndex);
  const insertRequests = starts.map((index, i) => ({
    insertText: { location: { index }, text: cells[i].map(([t]) => t).join("") },
  })).reverse(); // справа налево, чтобы индексы левых ячеек не сдвинулись
  await docs.documents.batchUpdate({ documentId, requestBody: { requests: insertRequests } });

  // стиль — как у строки-якоря; жирный по кускам
  const styleRequests = [];
  doc = (await docs.documents.get({ documentId })).data;
  found = findRow(doc);
  const fresh = found.table.tableRows[found.rowIndex + 1];
  fresh.tableCells.forEach((cell, i) => {
    const anchorCell = anchorRow.tableCells[i];
    const anchorPara = anchorCell.content[0].paragraph;
    const anchorRun = anchorPara.elements.find((e) => e.textRun)?.textRun.textStyle || {};
    const para = cell.content[0];
    const start = para.startIndex;
    const end = para.endIndex - 1; // без завершающего перевода строки
    if (end <= start) return;
    styleRequests.push({ updateTextStyle: {
      range: { startIndex: start, endIndex: end },
      textStyle: { fontSize: anchorRun.fontSize, weightedFontFamily: anchorRun.weightedFontFamily },
      fields: "fontSize,weightedFontFamily",
    } });
    let cursor = start;
    for (const [text, bold] of cells[i]) {
      styleRequests.push({ updateTextStyle: {
        range: { startIndex: cursor, endIndex: cursor + text.length }, textStyle: { bold: !!bold }, fields: "bold",
      } });
      cursor += text.length;
    }
    const ps = anchorPara.paragraphStyle || {};
    styleRequests.push({ updateParagraphStyle: {
      range: { startIndex: start, endIndex: para.endIndex },
      paragraphStyle: {
        alignment: ps.alignment, lineSpacing: ps.lineSpacing, spaceAbove: ps.spaceAbove, spaceBelow: ps.spaceBelow,
        indentFirstLine: ps.indentFirstLine, indentStart: ps.indentStart, indentEnd: ps.indentEnd,
      },
      fields: "alignment,lineSpacing,spaceAbove,spaceBelow,indentFirstLine,indentStart,indentEnd",
    } });
  });
  await docs.documents.batchUpdate({ documentId, requestBody: { requests: styleRequests } });
  return `строка «${afterCell.slice(0, 30)}…» добавлена`;
}

// Маркеры ищем во всём документе: тело, колонтитулы и вкладки. Документ,
// где разметка осталась только в подвале, тоже размечен.
function alreadyMarked(doc) {
  const holders = doc.tabs?.length ? doc.tabs.map((t) => t.documentTab || {}) : [doc];
  const parts = [];
  for (const h of holders) {
    parts.push(h.body || {});
    for (const kind of ["headers", "footers"]) parts.push(h[kind] || {});
  }
  const text = JSON.stringify(parts);
  return text.includes("{{#if") || text.includes("{{#row");
}

export async function runMarkup({ sourceId, draftName, edits, rows = [], toOriginal }) {
  const { drive, docs } = getBotClients();
  let id = sourceId;

  // Разметка не идемпотентна: повторный прогон по размеченному документу дублирует
  // маркеры и ломает вложенность условий. Проверяем источник до любой записи —
  // и для черновика тоже: копия размеченного исходника даст ту же поломку.
  const source = (await docs.documents.get({ documentId: sourceId })).data;
  if (alreadyMarked(source)) {
    throw new Error(
      "шаблон уже размечен — повторный прогон продублирует маркеры.\n"
      + "Сначала верни документ к состоянию до разметки (бэкап), потом запускай."
    );
  }

  if (toOriginal) {
    const doc = source;
    // Бэкап до первой же записи: если что-то пойдёт не так, откатываться будет к чему
    const stamp = new Date().toISOString().slice(0, 10);
    const backup = await drive.files.copy({
      fileId: sourceId,
      requestBody: { name: `БЭКАП ${stamp} — ${doc.title} (до разметки)`, parents: [FOLDER] },
      fields: "id,webViewLink",
    });
    console.log("бэкап до разметки:", backup.data.webViewLink);
  }

  if (!toOriginal) {
    // прошлый черновик удаляем: разметка не идемпотентна, каждый прогон — свежая копия
    const stale = await drive.files.list({
      q: `'${FOLDER}' in parents and name = '${draftName}' and trashed = false`,
      fields: "files(id)",
    });
    for (const f of stale.data.files || []) {
      await drive.files.update({ fileId: f.id, requestBody: { trashed: true } });
    }
    const copy = await drive.files.copy({
      fileId: sourceId,
      requestBody: { name: draftName, parents: [FOLDER] },
      fields: "id,webViewLink",
    });
    id = copy.data.id;
    console.log("копия:", copy.data.webViewLink);
  }

  const res = await applyEdits(docs, id, edits);
  for (const row of rows) console.log(await addBodyRow(docs, id, row));
  console.log(await addStampRow(docs, id));
  console.log(`\nприменено: ${res.done.length} из ${edits.length}`);
  if (res.failed.length) {
    console.log("не найдено:");
    res.failed.forEach((f) => console.log("   ——", f));
  }
  return { id, ...res };
}
