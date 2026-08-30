// Прогон шаблона через движок по сценариям: node scripts/check-scenarios.mjs <documentId>
// Рендерит весь документ целиком и ищет запрещённые для сценария упоминания —
// чтобы не полагаться на выборочный просмотр кусков.
import { getBotClients } from "./google-bot.mjs";
import { buildIndex } from "./docs-edit.mjs";
import { buildConditionalPlan, buildRowPlan } from "../lib/google/template-engine.js";
import { normalizeForm, calculate, buildFlags, buildReplacementsV2 } from "../lib/mou/core.js";
import { buildArticleNumbers, ARTICLE_DEFS_OFFPLAN_V2 } from "../lib/mou/articles.js";

const BASE = {
  agreementDate: "28/01/2026", sellingPrice: "1,670,000", originalPrice: "1,494,050",
  paidAmountToDeveloper: "300,000", transferThresholdPercent: "30", admAdminFee: "575",
  transferFee: "4,000", transferFeeLabel: "Transfer Fee / NOC Fee", unitStatus: "Off-plan",
  developerName: "ALDAR DEVELOPMENT L.L.C – O.P.C", developerLegalName: "ALDAR PROPERTIES PJSC", escrowAccountName: "THE SOURCE ESCROW",
  propertyLocation: "Saadiyat Island", projectName: "The Source", unitNumber: "R18-212",
  buyerDefaultPenaltyAmount: "167,000", sellerDefaultPenaltyAmount: "167,000",
  sellers: [{ salutation: "Mr.", name: "Ivan Petrov", nationality: "Russia", passport: "222", eid: "784-1", ownershipPercent: "100" }],
  buyers: [{ salutation: "Mrs.", name: "Anna Ivanova", nationality: "Russia", passport: "333", eid: "784-2", ownershipPercent: "100" }],
  sellerAgentEnabled: "Yes", buyerAgentEnabled: "Yes",
  sellerAgentName: "PRIME BRIDGE", buyerAgentName: "SQF REALTY",
  sellerAgentRepresentative: "Mikhail S.", sellerAgentLicense: "CN-1", sellerAgentAddress: "Office 6",
  buyerAgentRepresentative: "Irina M.", buyerAgentLicense: "CN-2", buyerAgentAddress: "Office 9",
  buyerDepositEnabled: "Yes", buyerDepositCalcType: "% of Selling Price", buyerDepositPercent: "10",
  sellerDepositEnabled: "Yes", sellerDepositCalcType: "% of Selling Price", sellerDepositPercent: "10",
  buyerChequeNumber: "174369", buyerChequeDate: "14.04.2026", buyerChequeBank: "FAB",
  buyerChequeDrawnBy: "Anna Ivanova", buyerChequeInFavourOf: "Ivan Petrov",
  sellerChequeNumber: "000020", sellerChequeDate: "20.04.2026", sellerChequeBank: "Emirates NBD",
  sellerChequeDrawnBy: "Ivan Petrov", sellerChequeInFavourOf: "Anna Ivanova",
};

// forbidden — чего в тексте быть НЕ должно при этих настройках
const SCENARIOS = [
  { name: "всё включено", over: {}, forbidden: [] },
  { name: "депозитов нет", over: { buyerDepositEnabled: "No", sellerDepositEnabled: "No" },
    forbidden: [/\bdeposits?\b/i] },
  { name: "агентств нет", over: { sellerAgentEnabled: "No", buyerAgentEnabled: "No" },
    forbidden: [/\bAgents?\b/, /\bAgenc(y|ies)\b/, /agents’/] },
  { name: "только агентство Продавца", over: { buyerAgentEnabled: "No" },
    forbidden: [/Buyer’s Agent/i, /Buyer’s Agency/i] },
  { name: "только агентство Покупателя", over: { sellerAgentEnabled: "No" },
    forbidden: [/Seller’s Agent/i, /Seller’s Agency/i] },
  { name: "чек Покупателя без реквизитов", over: { buyerChequeTiming: "Delayed (within X days)", buyerChequeDays: "5" },
    forbidden: [] },
  { name: "депозит только у Покупателя", over: { sellerDepositEnabled: "No" }, forbidden: [] },
  { name: "депозит только у Продавца", over: { buyerDepositEnabled: "No" }, forbidden: [] },
  { name: "депозитов нет и агентств нет", over: { buyerDepositEnabled: "No", sellerDepositEnabled: "No", sellerAgentEnabled: "No", buyerAgentEnabled: "No" },
    forbidden: [/\bdeposits?\b/i, /\bAgents?\b/, /\bAgenc(y|ies)\b/] },
];

// общие дефекты текста, которые ищем всегда
const DEFECTS = [
  [/,\s*,/, "двойная запятая"],
  [/\s+,/, "пробел перед запятой"],
  [/AED(?!\s*[\d{])/, "AED без суммы"],
  [/\{\{[a-z0-9_#/]/, "неподставленный маркер"],
  [/[^;]\band\s*\n\s*\n/, "висящее «and»"],
  [/\(\s*\)/, "пустые скобки"],
  [/(?<!\{\{[a-z0-9_]{0,40})\}\}/, "обрывок маркера «}}»"],
  [/\bby\s*\.\s/, "оборванная фраза «by .»"],
];

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

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const doc = (await docs.documents.get({ documentId })).data;
const idx = buildIndex(doc);

let problems = 0;
let baseline = null; // дефекты, которые есть и в полном варианте — это исходная вёрстка, а не разметка
for (const { name, over, forbidden } of SCENARIOS) {
  const data = normalizeForm({ ...BASE, ...over });
  const calc = calculate(data);
  const flags = buildFlags(data, calc);
  const numbers = buildArticleNumbers(data, undefined, ARTICLE_DEFS_OFFPLAN_V2);
  const repl = { ...buildReplacementsV2(data, calc, numbers), ...numbers };
  const cond = buildConditionalPlan(doc, flags);
  const rows = buildRowPlan(doc, flags);

  // у тела и каждого колонтитула своя нумерация индексов — ключ обязан
  // включать сегмент, иначе удаления из колонтитула рвут текст тела
  const deleted = new Set();
  const key = (seg, i) => `${seg || ""}:${i}`;
  for (const r of cond.requests) {
    const g = r.deleteContentRange?.range;
    if (g) for (let i = g.startIndex; i < g.endIndex; i += 1) deleted.add(key(g.segmentId, i));
  }
  // строки таблиц движок удаляет отдельным запросом — повторяем это на тексте
  for (const r of rows.requests) {
    const loc = r.deleteTableRow?.tableCellLocation;
    if (!loc) continue;
    const table = findTable(doc.body?.content || [], loc.tableStartLocation.index);
    const row = table?.tableRows?.[loc.rowIndex];
    for (const cell of row?.tableCells || []) {
      for (let i = cell.startIndex; i < cell.endIndex; i += 1) deleted.add(key("", i));
    }
  }
  const text = idx.chars.filter((c) => !deleted.has(key(c.seg, c.i))).map((c) => c.c).join("")
    .replace(/\{\{#row\s+!?[a-z0-9_]+\}\}/g, "")
    .replace(/\{\{([a-z0-9_]+)\}\}/g, (m, k) => (k in repl ? String(repl[k] ?? "") : m))
    .replace(/<<|>>/g, "");

  // пустые строки ищем только в теле и вне таблиц: в плоском тексте каждая ячейка
  // заканчивается переводом строки, и пустая ячейка шапки даёт ложное срабатывание
  const outsideTables = idx.chars.filter((c) => c.seg === "" && !c.inTable && !deleted.has(key(c.seg, c.i))).map((c) => c.c).join("");
  let found = [];
  if (/\n[ \t]*\n[ \t]*\n/.test(outsideTables)) {
    const m = outsideTables.match(/.{0,60}\n[ \t]*\n[ \t]*\n.{0,60}/);
    found.push("две пустые строки подряд → …" + m[0].replace(/\n/g, " ⏎ ") + "…");
  }
  if (cond.errors.length) found.push("ошибки движка: " + cond.errors.join("; "));
  if (cond.unknownFlags.length) found.push("неизвестные флаги: " + cond.unknownFlags.join(", "));
  if (rows.unknownFlags?.length) found.push("неизвестные флаги строк: " + rows.unknownFlags.join(", "));
  for (const [re, msg] of [...DEFECTS, ...forbidden.map((re) => [re, `запрещено в сценарии: ${re}`])]) {
    const m = text.match(new RegExp(`.{0,60}${re.source}.{0,60}`, re.flags.replace("g", "")));
    if (m) found.push(`${msg} → …${m[0].replace(/\n/g, " ⏎ ")}…`);
  }
  if (baseline === null) baseline = new Set(found.map((f) => f.split(" → ")[0]));
  else found = found.filter((f) => !baseline.has(f.split(" → ")[0]));
  problems += found.length;
  console.log(`\n${found.length ? "✘" : "✔"} ${name}`);
  found.forEach((f) => console.log("   " + f));
}
console.log(`\nитого замечаний: ${problems}`);
