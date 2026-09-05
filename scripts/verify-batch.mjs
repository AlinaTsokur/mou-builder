// Сверка готовых договоров из папки тестов с локальным рендером:
//   node scripts/verify-batch.mjs <folderId> [templateId] [--mortgage]
// Для каждого сценария из batch-scenarios.mjs:
//   1) в документе не осталось маркеров ({{ }} << >>);
//   2) текст документа совпадает с локальным рендером слово в слово (все сегменты);
//   3) всё, что в шаблоне помечено <<жирным>>, в документе действительно жирное.
import { getBotClients } from "./google-bot.mjs";
import { buildIndex } from "./docs-edit.mjs";
import { renderLocal } from "./render-local.mjs";
import { baseFor, SCENARIOS } from "./batch-scenarios.mjs";
import { ARTICLE_DEFS_OFFPLAN_V2, ARTICLE_DEFS_OFFPLAN_MORTGAGE_V2 } from "../lib/mou/articles.js";

const MORTGAGE = process.argv.includes("--mortgage");
const DEFS = MORTGAGE ? ARTICLE_DEFS_OFFPLAN_MORTGAGE_V2 : ARTICLE_DEFS_OFFPLAN_V2;
const BASE = baseFor(MORTGAGE);
const positional = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const folderId = positional[0];
const templateId = positional[1] || (MORTGAGE
  ? "1RjrVeLZG65Fyzc5h0TFR0sks8D--jJocEXyF2H9fg9g"
  : "1LLMqzZ1xeSPzVOhVahG4B8l9bQx0KggFBvZUynOY8bU");
if (!folderId) throw new Error("укажи ID папки с тестовыми договорами");

const { docs, drive } = getBotClients();

const templateDoc = (await docs.documents.get({ documentId: templateId })).data;
const templateIdx = buildIndex(templateDoc);

const { data: listing } = await drive.files.list({
  q: `'${folderId}' in parents and trashed = false`,
  fields: "files(id,name)",
  pageSize: 100,
});
const files = listing.files || [];

const norm = (s) => s.replace(/\s+/g, " ").trim();

// первое расхождение двух строк с контекстом вокруг
function firstDiff(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  const cut = (s) => s.slice(Math.max(0, i - 60), i + 60).replace(/\n/g, "¶");
  return `…${cut(a)}…\n  против\n  …${cut(b)}…`;
}

let bad = 0;
for (const [name, over] of SCENARIOS) {
  const file = files.find((f) => f.name === name);
  const problems = [];
  if (!file) {
    console.log(`✗ ${name}: документа нет в папке`);
    bad += 1;
    continue;
  }
  const doc = (await docs.documents.get({ documentId: file.id })).data;
  const idx = buildIndex(doc);
  const got = idx.text;

  const leftovers = got.match(/\{\{[^}]*\}\}|\{\{|\}\}|<<|>>/g);
  if (leftovers) problems.push(`остались маркеры: ${[...new Set(leftovers)].join(" ")}`);

  const local = renderLocal(templateDoc, templateIdx, { ...BASE, ...over }, DEFS);

  if (norm(got) !== norm(local.text)) {
    problems.push(`текст расходится с рендером:\n  ${firstDiff(norm(got), norm(local.text))}`);
  } else if (got === local.text) {
    // тексты совпали посимвольно — позиции сопоставимы один в один,
    // проверяем жирный на местах, помеченных <<…>> в шаблоне
    const mustBold = [];
    let boldOn = false;
    for (let i = 0; i < local.textMarked.length; i += 1) {
      const two = local.textMarked.slice(i, i + 2);
      if (two === "<<") { boldOn = true; i += 1; continue; }
      if (two === ">>") { boldOn = false; i += 1; continue; }
      mustBold.push(boldOn);
    }
    const chars = idx.chars;
    const misses = new Set();
    for (let i = 0; i < chars.length; i += 1) {
      if (mustBold[i] && !chars[i].bold && /\S/.test(chars[i].c)) {
        // покажем слово целиком, а не букву
        let a = i; let b = i;
        while (a > 0 && /\S/.test(got[a - 1])) a -= 1;
        while (b < got.length && /\S/.test(got[b])) b += 1;
        misses.add(got.slice(a, b));
      }
    }
    if (misses.size) problems.push(`не жирные: ${[...misses].slice(0, 8).join(", ")}`);
  } else {
    problems.push("тексты равны по словам, но не посимвольно — жирный не проверен");
  }

  if (problems.length) {
    console.log(`✗ ${name}\n  ${problems.join("\n  ")}`);
    bad += 1;
  } else {
    console.log(`✓ ${name}`);
  }
}

console.log(bad === 0 ? "\nвсе документы совпадают с рендером" : `\nс замечаниями: ${bad}`);
process.exitCode = bad === 0 ? 0 : 1;
