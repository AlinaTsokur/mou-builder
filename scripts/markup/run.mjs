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

export async function runMarkup({ sourceId, draftName, edits, toOriginal }) {
  const { drive, docs } = getBotClients();
  let id = sourceId;

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
  console.log(await addStampRow(docs, id));
  console.log(`\nприменено: ${res.done.length} из ${edits.length}`);
  if (res.failed.length) {
    console.log("не найдено:");
    res.failed.forEach((f) => console.log("   ——", f));
  }
  return { id, ...res };
}
