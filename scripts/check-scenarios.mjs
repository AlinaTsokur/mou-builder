// Прогон шаблона через движок по сценариям: node scripts/check-scenarios.mjs <documentId> [--mortgage]
// Рендерит весь документ целиком и ищет запрещённые для сценария упоминания —
// чтобы не полагаться на выборочный просмотр кусков.
import { getBotClients } from "./google-bot.mjs";
import { buildIndex } from "./docs-edit.mjs";
import { renderLocal } from "./render-local.mjs";
import { ARTICLE_DEFS_OFFPLAN_V2, ARTICLE_DEFS_OFFPLAN_MORTGAGE_V2 } from "../lib/mou/articles.js";

const MORTGAGE = process.argv.includes("--mortgage");
const DEFS = MORTGAGE ? ARTICLE_DEFS_OFFPLAN_MORTGAGE_V2 : ARTICLE_DEFS_OFFPLAN_V2;

const BASE = {
  agreementDate: "28/01/2026", sellingPrice: "1,670,000", originalPrice: "1,494,050",
  paidAmountToDeveloper: "300,000", transferThresholdPercent: "30",
  ...(MORTGAGE ? { admAdminFee: "", admElectronicFee: "1,392", admValuationFee: "925.75" } : { admAdminFee: "575" }),
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
  // «; and» в конце пункта списка — не висящее, даже если дальше пустая строка
  [/(?<!;\s?)\band\s*\n\s*\n/, "висящее «and»"],
  [/\(\s*\)/, "пустые скобки"],
  [/\n[ \t]*\v[ \t\v]*\n/, "строка из одного мягкого переноса"],
  [/(?<!\{\{[a-z0-9_]{0,40})\}\}/, "обрывок маркера «}}»"],
  [/\bby\s*\.\s/, "оборванная фраза «by .»"],
];

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const doc = (await docs.documents.get({ documentId })).data;
const idx = buildIndex(doc);

let problems = 0;
for (const { name, over, forbidden } of SCENARIOS) {
  // общий рендер с комбинаторным прогоном: он умеет удалять строки таблиц
  // в колонтитулах, а прежняя копия здесь искала таблицы только в теле
  const { text, outsideTables, cond, rows } = renderLocal(doc, idx, { ...BASE, ...over }, DEFS);

  // пустые строки ищем только в теле и вне таблиц: в плоском тексте каждая ячейка
  // заканчивается переводом строки, и пустая ячейка шапки даёт ложное срабатывание
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
  problems += found.length;
  console.log(`\n${found.length ? "✘" : "✔"} ${name}`);
  found.forEach((f) => console.log("   " + f));
}
console.log(`\nитого замечаний: ${problems}`);
process.exitCode = problems ? 1 : 0;
