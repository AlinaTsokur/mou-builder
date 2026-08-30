// Локальный рендер шаблона: тот же движок, что на сервере, но без записи в Google.
// Возвращает готовый текст договора — по нему и проверяем.
import { buildConditionalPlan, buildRowPlan } from "../lib/google/template-engine.js";
import { normalizeForm, calculate, buildFlags, buildReplacementsV2 } from "../lib/mou/core.js";
import { buildArticleNumbers } from "../lib/mou/articles.js";

const key = (seg, i) => `${seg || ""}:${i}`;

function findTable(content, startIndex) {
  for (const el of content) {
    if (el.table && el.startIndex === startIndex) return el.table;
    if (el.table) {
      for (const r of el.table.tableRows || []) {
        for (const c of r.tableCells || []) {
          const found = findTable(c.content || [], startIndex);
          if (found) return found;
        }
      }
    }
  }
  return null;
}

// Таблица подписей живёт в подвале, и индексы там свои. Ищем в том сегменте,
// который назвал сам запрос: иначе проверка не увидит удаление строк колонтитула.
function findTableInSegment(doc, segmentId, startIndex) {
  if (!segmentId) return findTable(doc.body?.content || [], startIndex);
  for (const part of ["headers", "footers"]) {
    const obj = doc[part]?.[segmentId];
    if (obj) {
      const found = findTable(obj.content || [], startIndex);
      if (found) return found;
    }
  }
  return null;
}

export function renderLocal(doc, idx, form, articleDefs) {
  const data = normalizeForm(form);
  const calc = calculate(data);
  const flags = buildFlags(data, calc);
  const numbers = buildArticleNumbers(data, undefined, articleDefs);
  const repl = { ...buildReplacementsV2(data, calc, numbers), ...numbers };
  const cond = buildConditionalPlan(doc, flags);
  const rows = buildRowPlan(doc, flags);

  // у тела и каждого колонтитула своя нумерация индексов — ключ обязан
  // включать сегмент, иначе удаления из колонтитула рвут текст тела
  const deleted = new Set();
  for (const r of cond.requests) {
    const g = r.deleteContentRange?.range;
    if (g) for (let i = g.startIndex; i < g.endIndex; i += 1) deleted.add(key(g.segmentId, i));
  }
  for (const r of rows.requests) {
    const loc = r.deleteTableRow?.tableCellLocation;
    if (!loc) continue;
    const seg = loc.tableStartLocation.segmentId || "";
    const table = findTableInSegment(doc, seg, loc.tableStartLocation.index);
    const row = table?.tableRows?.[loc.rowIndex];
    for (const cell of row?.tableCells || []) {
      for (let i = cell.startIndex; i < cell.endIndex; i += 1) deleted.add(key(seg, i));
    }
  }

  const substitute = (s) => s
    .replace(/\{\{#row\s+!?[a-z0-9_]+\}\}/g, "")
    .replace(/\{\{([a-z0-9_]+)\}\}/g, (m, k) => (k in repl ? String(repl[k] ?? "") : m))
    .replace(/<<|>>/g, "");

  const text = substitute(idx.chars.filter((c) => !deleted.has(key(c.seg, c.i))).map((c) => c.c).join(""));
  // пустые строки ищем только в теле и вне таблиц: в плоском тексте каждая ячейка
  // заканчивается переводом строки, и пустая ячейка шапки даёт ложное срабатывание
  const outsideTables = substitute(idx.chars
    .filter((c) => c.seg === "" && !c.inTable && !deleted.has(key(c.seg, c.i)))
    .map((c) => c.c).join(""));

  return { text, outsideTables, data, calc, flags, repl, numbers, cond, rows };
}
