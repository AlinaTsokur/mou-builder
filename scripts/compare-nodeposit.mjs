// Сверка: размеченный шаблон №1 без депозитов против фактического №1.2.
//   node scripts/compare-nodeposit.mjs <id размеченного №1>
// Данные сделки (суммы, даты, имена, проект) нормализуются, сравнивается текст.
import { getBotClients } from "./google-bot.mjs";
import { buildIndex } from "./docs-edit.mjs";
import { buildConditionalPlan, buildRowPlan } from "../lib/google/template-engine.js";
import { normalizeForm, calculate, buildFlags, buildReplacementsV2 } from "../lib/mou/core.js";
import { buildArticleNumbers, ARTICLE_DEFS_OFFPLAN_V2 } from "../lib/mou/articles.js";

const NO_DEPOSIT_TEMPLATE = "1vftXIyFV32PKyFoCg-2J5b_58V94e5TFXJgXSIbIvWM";
// абзацы, которые заказчик удаляет из №1.2 — воспроизводить их не нужно
const CLIENT_REMOVES = [/financing bank/i, /Late Payment Charges/i];

const FORM = {
  agreementDate: "16/07/2026", sellingPrice: "1,670,000", originalPrice: "1,494,050",
  paidAmountToDeveloper: "373,512.50", transferThresholdPercent: "25", admAdminFee: "575",
  transferFee: "4,000", transferFeeLabel: "Transfer Fee", unitStatus: "Off-plan",
  developerLegalName: "ALDAR PROPERTIES PJSC", developerName: "ALDAR DEVELOPMENT L.L.C – O.P.C",
  reservationDeadline: "16/08/2026", escrowAccountName: "GARDENIA ESCROW ACCOUNT",
  buyerDefaultPenaltyAmount: "167,000", sellerDefaultPenaltyAmount: "167,000",
  sellers: [{ salutation: "Mr(s).", name: "Name Surname", nationality: "Russian Federation", passport: "222222222", eid: "784-1990-2222222-2", ownershipPercent: "100" }],
  buyers: [{ salutation: "Mr(s).", name: "Name Surname", nationality: "Russian Federation", passport: "222222222", eid: "784-1990-2222222-2", ownershipPercent: "100" }],
  sellerAgentEnabled: "Yes", buyerAgentEnabled: "Yes",
  sellerAgentName: "PRIME BRIDGE REAL ESTATE BROKERAGE - L.L.C - S.P.C",
  buyerAgentName: "S Q F REALTY REAL ESTATE MANAGEMENT - L.L.C - S.P.C",
  sellerAgentRepresentative: "Mikhail Slobodchikov", sellerAgentLicense: "CN-6410679",
  sellerAgentAddress: "Office 6, Ar Raha 8 St, MUSAFFAH, Abu Dhabi, 20335",
  buyerAgentRepresentative: "Irina Germanovna Meidman", buyerAgentLicense: "CN-0000000",
  buyerAgentAddress: "Office 6, Ar Raha 8 St, MUSAFFAH, Abu Dhabi, 20335",
  buyerDepositEnabled: "No", sellerDepositEnabled: "No",
};

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID размеченного шаблона");
const { docs } = getBotClients();

const doc = (await docs.documents.get({ documentId })).data;
const idx = buildIndex(doc);
const data = normalizeForm(FORM);
const calc = calculate(data);
const flags = buildFlags(data, calc);
const numbers = buildArticleNumbers(data, undefined, ARTICLE_DEFS_OFFPLAN_V2);
const repl = { ...buildReplacementsV2(data, calc, numbers), ...numbers };
const cond = buildConditionalPlan(doc, flags);
const rows = buildRowPlan(doc, flags);

const key = (seg, i) => `${seg || ""}:${i}`;
const deleted = new Set();
for (const r of cond.requests) {
  const g = r.deleteContentRange?.range;
  if (g) for (let i = g.startIndex; i < g.endIndex; i += 1) deleted.add(key(g.segmentId, i));
}
const findTable = (content, startIndex) => {
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
};
for (const r of rows.requests) {
  const loc = r.deleteTableRow?.tableCellLocation;
  if (!loc) continue;
  const row = findTable(doc.body?.content || [], loc.tableStartLocation.index)?.tableRows?.[loc.rowIndex];
  for (const cell of row?.tableCells || []) {
    for (let i = cell.startIndex; i < cell.endIndex; i += 1) deleted.add(key("", i));
  }
}

const rendered = idx.chars.filter((c) => !deleted.has(key(c.seg, c.i))).map((c) => c.c).join("")
  .replace(/\{\{([a-z0-9_]+)\}\}/g, (m, k) => (k in repl ? String(repl[k] ?? "") : m))
  .replace(/<<|>>/g, "");
const reference = buildIndex((await docs.documents.get({ documentId: NO_DEPOSIT_TEMPLATE })).data).text;

// нормализация: убираем данные сделки, оставляем формулировки
const norm = (t) => t.split("\n")
  .map((line) => line.replace(/\s+/g, " ").trim())
  .filter((line) => line.length > 45)
  .map((line) => line
    .replace(/AED\s*[\d,.]+/g, "AED X")
    .replace(/\b\d[\d,.]*\b/g, "N")
    .replace(/\s+/g, " "));

const ours = new Set(norm(rendered));
const theirs = norm(reference).filter((line) => !CLIENT_REMOVES.some((re) => re.test(line)));

const missing = theirs.filter((line) => !ours.has(line));
console.log(missing.length
  ? `РАСХОЖДЕНИЯ (${missing.length}) — есть в №1.2, наш шаблон не даёт:`
  : "Расхождений нет: размеченный №1 без депозитов воспроизводит №1.2");
missing.forEach((line) => console.log("  • " + line.slice(0, 160)));
