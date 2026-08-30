// Template engine v2: обработка условных маркеров прямо в Google Doc шаблоне.
//
//   {{#if flag}} ... {{/if}}  — блок остаётся при flag=true (маркеры стираются),
//                               целиком удаляется при flag=false. Поддерживается
//                               инлайн внутри абзаца, блок на несколько абзацев
//                               и вложенность. Отрицание: {{#if !flag}}.
//   {{#row flag}}             — ставится внутри строки таблицы: при true маркер
//                               стирается, при false удаляется вся строка.
//
// Ограничение: пара {{#if}}...{{/if}} не должна пересекать границу таблицы
// (внутри одной ячейки — можно). Неизвестный флаг трактуется как true
// (текст сохраняется), а имя флага возвращается в unknownFlags.

const IF_MARKER_RE = /\{\{#if\s+(!?)([a-z0-9_]+)\}\}|\{\{\/if\}\}/g;
const ROW_MARKER_RE = /\{\{#row\s+(!?)([a-z0-9_]+)\}\}/g;
const ANY_MARKER_RE = /\{\{#(?:if|row)\s+!?[a-z0-9_]+\}\}|\{\{\/if\}\}/g;

// ---------- flattening ----------

// Сегменты документа: тело плюс колонтитулы — у каждого своя нумерация индексов,
// поэтому вместе с содержимым несём segmentId для запросов на удаление.
function tabContents(doc) {
  const segments = doc.tabs?.length
    ? doc.tabs.map((tab) => ({ content: tab.documentTab?.body?.content || [], segmentId: "" }))
    : [{ content: doc.body?.content || [], segmentId: "" }];
  for (const part of ["headers", "footers"]) {
    for (const [segmentId, obj] of Object.entries(doc[part] || {})) {
      segments.push({ content: obj.content || [], segmentId });
    }
  }
  return segments;
}

function segmentEnd(content) {
  return content.length ? content[content.length - 1].endIndex : 0;
}

function collectParagraphs(doc) {
  const out = [];
  for (const { content, segmentId } of tabContents(doc)) {
    walkParagraphs(content, segmentEnd(content), out, segmentId);
  }
  return out;
}

function walkParagraphs(content, segmentEndIndex, out, segmentId = "") {
  for (const item of content) {
    if (item.paragraph) {
      const elements = (item.paragraph.elements || [])
        .filter((el) => el.textRun)
        .map((el) => ({ text: el.textRun.content || "", startIndex: el.startIndex }));
      out.push({
        text: elements.map((e) => e.text).join(""),
        elements,
        startIndex: item.startIndex,
        endIndex: item.endIndex,
        segmentEndIndex,
        segmentId,
      });
    } else if (item.table) {
      for (const row of item.table.tableRows || []) {
        for (const cell of row.tableCells || []) {
          // segmentEndIndex ячейки — конец её собственного контента: последний
          // перевод строки ячейки удалять нельзя, как и у body.
          walkParagraphs(cell.content || [], segmentEnd(cell.content || []), out, segmentId);
        }
      }
    }
  }
}

function collectTables(doc) {
  const out = [];
  // строки таблиц удаляем только в теле: в колонтитулах таблиц не бывает
  for (const { content, segmentId } of tabContents(doc)) if (!segmentId) walkTables(content, out);
  return out;
}

function walkTables(content, out) {
  for (const item of content) {
    if (item.table) {
      out.push({ table: item.table, startIndex: item.startIndex });
      for (const row of item.table.tableRows || []) {
        for (const cell of row.tableCells || []) walkTables(cell.content || [], out);
      }
    }
  }
}

// Абсолютный диапазон [start, end) для совпадения regex внутри текста абзаца.
function absRange(paragraph, offset, length) {
  let consumed = 0;
  let start = null;
  for (const el of paragraph.elements) {
    const elLen = el.text.length;
    if (start === null && offset < consumed + elLen) {
      start = el.startIndex + (offset - consumed);
    }
    if (start !== null && offset + length <= consumed + elLen) {
      return { start, end: el.startIndex + (offset + length - consumed) };
    }
    consumed += elLen;
  }
  return null;
}

function paragraphTextStart(paragraph) {
  return paragraph.elements.length ? paragraph.elements[0].startIndex : paragraph.startIndex;
}

// Смещение абсолютного индекса внутрь текста абзаца.
function offsetInParagraph(paragraph, absIndex) {
  let consumed = 0;
  for (const el of paragraph.elements) {
    if (absIndex <= el.startIndex + el.text.length) {
      return consumed + Math.max(0, absIndex - el.startIndex);
    }
    consumed += el.text.length;
  }
  return consumed;
}

function resolveFlag(flags, name, negated, unknown) {
  const raw = flags ? flags[name] : undefined;
  if (raw === undefined || raw === null) {
    unknown.add(name);
    return true; // неизвестный флаг: текст не трогаем, маркеры стираем
  }
  return negated ? !raw : !!raw;
}

// ---------- {{#if}} ----------

export function buildConditionalPlan(doc, flags) {
  const allParagraphs = collectParagraphs(doc);
  const paragraphs = allParagraphs;
  const unknown = new Set();
  const errors = [];
  const markers = [];

  for (const p of paragraphs) {
    IF_MARKER_RE.lastIndex = 0;
    let m;
    while ((m = IF_MARKER_RE.exec(p.text))) {
      const range = absRange(p, m.index, m[0].length);
      if (!range) continue;
      if (m[0].startsWith("{{#if")) {
        markers.push({ kind: "open", negated: m[1] === "!", flag: m[2], para: p, ...range });
      } else {
        markers.push({ kind: "close", para: p, ...range });
      }
    }
  }

  markers.sort((a, b) => a.start - b.start);

  const ranges = [];
  const stack = [];
  for (const mk of markers) {
    if (mk.kind === "open") {
      const ancestorFalse = stack.some((s) => s.value === false) ;
      const value = resolveFlag(flags, mk.flag, mk.negated, unknown);
      stack.push({ open: mk, value, ancestorFalse });
      continue;
    }
    const top = stack.pop();
    if (!top) {
      errors.push(`Лишний {{/if}} на позиции ${mk.start}`);
      continue;
    }
    if (top.ancestorFalse) continue; // покроется диапазоном предка
    if (top.value === false) {
      ranges.push({ start: top.open.start, end: mk.end, startPara: top.open.para, endPara: mk.para });
    } else {
      ranges.push({ start: top.open.start, end: top.open.end, startPara: top.open.para, endPara: top.open.para });
      ranges.push({ start: mk.start, end: mk.end, startPara: mk.para, endPara: mk.para });
    }
  }
  for (const rest of stack) {
    errors.push(`Незакрытый {{#if ${rest.open.negated ? "!" : ""}${rest.open.flag}}}`);
  }

  // Склейка стыкующихся диапазонов (например, «{{/if}}{{#if x}}» в одном абзаце).
  ranges.sort((a, b) => a.start - b.start);
  const merged = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r.start <= last.end) {
      if (r.end > last.end) {
        last.end = r.end;
        last.endPara = r.endPara;
      }
    } else {
      merged.push({ ...r });
    }
  }

  // Если диапазон занимает абзац(ы) целиком (кроме пробелов) — расширяем его,
  // чтобы удалить и сами абзацы, не оставляя пустых строк.
  const requests = merged
    .map((r) => {
      const startPara = r.startPara;
      const endPara = r.endPara;
      const prefix = startPara.text.slice(0, offsetInParagraph(startPara, r.start));
      const suffix = endPara.text.slice(offsetInParagraph(endPara, r.end));
      let { start, end } = r;
      if (!prefix.trim() && !suffix.trim()) {
        start = startPara.startIndex;
        end = endPara.endIndex;
        // абзац уходит целиком — забираем и соседний пустой абзац-разделитель,
        // иначе на месте удалённого текста остаётся пустая строка
        const same = allParagraphs.filter((p) => p.segmentId === startPara.segmentId);
        const after = same.find((p) => p.startIndex === end);
        if (after && !after.text.trim()) {
          end = after.endIndex;
        } else {
          const before = same.filter((p) => p.endIndex === start).pop();
          if (before && !before.text.trim()) start = before.startIndex;
        }
      }
      end = Math.min(end, endPara.segmentEndIndex - 1);
      if (!(Number.isFinite(start) && Number.isFinite(end)) || end <= start) return null;
      if (startPara.segmentId !== endPara.segmentId) return null;
      return { start, end, segmentId: startPara.segmentId || "" };
    })
    .filter(Boolean)
    .sort((a, b) => b.start - a.start)
    .map(({ start, end, segmentId }) => ({
      deleteContentRange: {
        range: segmentId ? { segmentId, startIndex: start, endIndex: end } : { startIndex: start, endIndex: end },
      },
    }));

  return { requests, unknownFlags: Array.from(unknown), errors };
}

// ---------- {{#row}} ----------

export function buildRowPlan(doc, flags) {
  const unknown = new Set();
  const deletions = [];
  const cleanups = new Set();

  for (const { table, startIndex } of collectTables(doc)) {
    (table.tableRows || []).forEach((row, rowIndex) => {
      const text = rowText(row);
      ROW_MARKER_RE.lastIndex = 0;
      let m;
      while ((m = ROW_MARKER_RE.exec(text))) {
        const value = resolveFlag(flags, m[2], m[1] === "!", unknown);
        if (value) {
          cleanups.add(m[0]);
        } else {
          deletions.push({ tableStartIndex: startIndex, rowIndex });
        }
      }
    });
  }

  // Удаляем снизу вверх: сначала более поздние таблицы, внутри таблицы — нижние
  // строки, чтобы индексы не сдвигались под ещё не выполненными запросами.
  const requests = deletions
    .filter((d, i) => deletions.findIndex((x) => x.tableStartIndex === d.tableStartIndex && x.rowIndex === d.rowIndex) === i)
    .sort((a, b) => b.tableStartIndex - a.tableStartIndex || b.rowIndex - a.rowIndex)
    .map((d) => ({
      deleteTableRow: {
        tableCellLocation: {
          tableStartLocation: { index: d.tableStartIndex },
          rowIndex: d.rowIndex,
          columnIndex: 0,
        },
      },
    }));

  for (const marker of cleanups) {
    requests.push({
      replaceAllText: {
        containsText: { text: marker, matchCase: true },
        replaceText: "",
      },
    });
  }

  return { requests, unknownFlags: Array.from(unknown) };
}

function rowText(row) {
  return (row.tableCells || [])
    .flatMap((cell) => cell.content || [])
    .map(function extract(item) {
      if (item.paragraph) {
        return (item.paragraph.elements || []).map((el) => el.textRun?.content || "").join("");
      }
      if (item.table) {
        return (item.table.tableRows || [])
          .flatMap((r) => r.tableCells || [])
          .flatMap((c) => c.content || [])
          .map(extract)
          .join("");
      }
      return "";
    })
    .join("");
}

// ---------- residual scan ----------

export function findResidualMarkers(doc) {
  const found = new Set();
  for (const p of collectParagraphs(doc)) {
    ANY_MARKER_RE.lastIndex = 0;
    let m;
    while ((m = ANY_MARKER_RE.exec(p.text))) found.add(m[0]);
  }
  return Array.from(found);
}
