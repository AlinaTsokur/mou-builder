// Полный перебор вариантов сделки по шаблону off-plan:
//   node scripts/check-combinations.mjs <documentId>
//
// Для каждой комбинации рендерит договор целиком и проверяет две вещи:
//   1. текст — нет запрещённых слов, маркеров, оборванных фраз, пустых строк;
//   2. арифметику — суммы в договоре пересчитаны здесь заново, из условий сделки,
//      а не взяты из lib/mou/core.js. Иначе проверка повторяла бы ошибку кода.
import { getBotClients } from "./google-bot.mjs";
import { buildIndex } from "./docs-edit.mjs";
import { renderLocal } from "./render-local.mjs";
import { ARTICLE_DEFS_OFFPLAN_V2 } from "../lib/mou/articles.js";

// ───────── условия сделки, общие для всех комбинаций
const SELLING = 1670000;
const ORIGINAL = 1494050;
const THRESHOLD_PCT = 30;
const ADM_ADMIN = 575;
const TRANSFER_FEE = 4000;
const AMOUNT_TO_SELLER = 900000;
const AGENCY_FEE_SELLER = 33400;
const AGENCY_FEE_BUYER = 33400;
const PENALTY_BUYER = 167000;
const PENALTY_SELLER = 167000;
const DEPOSIT_PCT = 10;
const DEPOSIT_FIXED_BUYER = 150000;
const DEPOSIT_FIXED_SELLER = 120000;
// «порог не добран» — застройщику заплачено меньше 30% от Original Price,
// «порог закрыт» — больше; во втором случае строка добора из таблицы уходит
const PAID_UNDER = 300000;
const PAID_MET = 500000;

const BASE = {
  agreementDate: "28/01/2026", reservationDeadline: "28/02/2026",
  sellingPrice: String(SELLING), originalPrice: String(ORIGINAL),
  transferThresholdPercent: String(THRESHOLD_PCT), admAdminFee: String(ADM_ADMIN),
  transferFee: String(TRANSFER_FEE), transferFeeLabel: "Transfer Fee / NOC Fee",
  amountToSeller: String(AMOUNT_TO_SELLER), unitStatus: "Off-plan",
  developerName: "ALDAR DEVELOPMENT L.L.C – O.P.C", developerLegalName: "ALDAR PROPERTIES PJSC",
  escrowAccountName: "THE SOURCE ESCROW", propertyLocation: "Saadiyat Island",
  projectName: "The Source", unitNumber: "R18-212", bedrooms: "3BHK", areaM2: "153.50",
  propertyType: "Apartment", titleDeedNumber: "N/A", parkingSpaces: "1",
  agencyFeeSeller: String(AGENCY_FEE_SELLER), agencyFeeBuyer: String(AGENCY_FEE_BUYER),
  buyerDefaultPenaltyAmount: String(PENALTY_BUYER), sellerDefaultPenaltyAmount: String(PENALTY_SELLER),
  sellers: [{ salutation: "Mr.", name: "Ivan Petrov", nationality: "Russia", passport: "222", eid: "784-1", ownershipPercent: "100" }],
  buyers: [{ salutation: "Mrs.", name: "Anna Ivanova", nationality: "Russia", passport: "333", eid: "784-2", ownershipPercent: "100" }],
  sellerAgentName: "PRIME BRIDGE", buyerAgentName: "SQF REALTY",
  sellerAgentRepresentative: "Mikhail S.", sellerAgentLicense: "CN-1", sellerAgentAddress: "Office 6",
  buyerAgentRepresentative: "Irina M.", buyerAgentLicense: "CN-2", buyerAgentAddress: "Office 9",
  buyerChequeNumber: "174369", buyerChequeDate: "14.04.2026", buyerChequeBank: "FAB",
  buyerChequeDrawnBy: "Anna Ivanova", buyerChequeInFavourOf: "Ivan Petrov",
  sellerChequeNumber: "000020", sellerChequeDate: "20.04.2026", sellerChequeBank: "Emirates NBD",
  sellerChequeDrawnBy: "Ivan Petrov", sellerChequeInFavourOf: "Anna Ivanova",
};

const AXES = {
  buyerDeposit: [true, false],
  sellerDeposit: [true, false],
  sellerAgent: [true, false],
  buyerAgent: [true, false],
  paidThreshold: ["не добран", "закрыт"],
  depositCalc: ["процент", "сумма"],
  buyerChequeKnown: [true, false],
};

function combinations(axes) {
  const keys = Object.keys(axes);
  let out = [{}];
  for (const k of keys) {
    const next = [];
    for (const acc of out) for (const v of axes[k]) next.push({ ...acc, [k]: v });
    out = next;
  }
  return out;
}

function formFor(c) {
  return {
    ...BASE,
    paidAmountToDeveloper: String(c.paidThreshold === "не добран" ? PAID_UNDER : PAID_MET),
    sellerAgentEnabled: c.sellerAgent ? "Yes" : "No",
    buyerAgentEnabled: c.buyerAgent ? "Yes" : "No",
    buyerDepositEnabled: c.buyerDeposit ? "Yes" : "No",
    sellerDepositEnabled: c.sellerDeposit ? "Yes" : "No",
    buyerDepositCalcType: c.depositCalc === "процент" ? "% of Selling Price" : "Fixed amount",
    buyerDepositPercent: String(DEPOSIT_PCT), buyerDepositFixedAmount: String(DEPOSIT_FIXED_BUYER),
    sellerDepositCalcType: c.depositCalc === "процент" ? "% of Selling Price" : "Fixed amount",
    sellerDepositPercent: String(DEPOSIT_PCT), sellerDepositFixedAmount: String(DEPOSIT_FIXED_SELLER),
    ...(c.buyerChequeKnown ? {} : { buyerChequeTiming: "Delayed (within X days)", buyerChequeDays: "5" }),
  };
}

// ───────── независимый пересчёт: как должно быть по условиям договора
function expected(c) {
  const paid = c.paidThreshold === "не добран" ? PAID_UNDER : PAID_MET;
  const required = (ORIGINAL * THRESHOLD_PCT) / 100;
  const topUp = Math.max(required - paid, 0);
  const remaining = Math.max(ORIGINAL - paid - topUp, 0);

  const dep = (on, fixed) => (on ? (c.depositCalc === "процент" ? (SELLING * DEPOSIT_PCT) / 100 : fixed) : "");
  const buyerDep = dep(c.buyerDeposit, DEPOSIT_FIXED_BUYER);
  const sellerDep = dep(c.sellerDeposit, DEPOSIT_FIXED_SELLER);

  // liquidated damages: свой депозит, иначе депозит другой стороны, иначе штраф из формы
  const buyerLd = buyerDep !== "" ? buyerDep : sellerDep !== "" ? sellerDep : PENALTY_BUYER;
  const sellerLd = sellerDep !== "" ? sellerDep : buyerDep !== "" ? buyerDep : PENALTY_SELLER;
  // без агента другой стороны его 20% никому не идут — Продавцу/Покупателю достаётся всё
  const buyerLd80 = c.sellerAgent ? buyerLd * 0.8 : buyerLd;
  const buyerLd20 = c.sellerAgent ? buyerLd * 0.2 : null;
  const sellerLd80 = c.buyerAgent ? sellerLd * 0.8 : sellerLd;
  const sellerLd20 = c.buyerAgent ? sellerLd * 0.2 : null;

  const amounts = [
    ORIGINAL, SELLING, AMOUNT_TO_SELLER, remaining, TRANSFER_FEE,
    SELLING * 0.02 + ADM_ADMIN, ADM_ADMIN,
    buyerLd, sellerLd, buyerLd80, sellerLd80,
  ];
  if (topUp > 0) amounts.push(topUp);
  if (buyerDep !== "") amounts.push(buyerDep);
  if (sellerDep !== "") amounts.push(sellerDep);
  if (buyerLd20 !== null) amounts.push(buyerLd20);
  if (sellerLd20 !== null) amounts.push(sellerLd20);
  if (c.sellerAgent) amounts.push(AGENCY_FEE_SELLER);
  if (c.buyerAgent) amounts.push(AGENCY_FEE_BUYER);

  return {
    topUp, remaining, buyerDep, sellerDep,
    buyerLd, sellerLd, buyerLd80, buyerLd20, sellerLd80, sellerLd20,
    money: new Set(amounts.map(fmt)),
    articleCount: ARTICLE_DEFS_OFFPLAN_V2.length - (buyerDep === "" && sellerDep === "" ? 2 : 0),
  };
}

const fmt = (n) => new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const DEFECTS = [
  [/\{\{/, "неподставленный маркер"],
  [/,\s*,/, "двойная запятая"],
  [/\s+,/, "пробел перед запятой"],
  [/AED(?!\s*[\d{])/, "AED без суммы"],
  [/\(\s*\)/, "пустые скобки"],
  [/\bby\s*\.\s/, "оборванная фраза «by .»"],
  [/\.\./, "двойная точка"],
];

// ───────── прогон
const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const doc = (await docs.documents.get({ documentId })).data;
const idx = buildIndex(doc);

const combos = combinations(AXES);
let baseline = null;
const failures = [];

for (const c of combos) {
  const name = Object.entries(c).map(([k, v]) => `${k}=${v}`).join(" ");
  const { text, outsideTables, cond, rows } = renderLocal(doc, idx, formFor(c), ARTICLE_DEFS_OFFPLAN_V2);
  const e = expected(c);
  let found = [];

  if (cond.errors.length) found.push("ошибки движка: " + cond.errors.join("; "));
  if (cond.unknownFlags.length) found.push("неизвестные флаги: " + cond.unknownFlags.join(", "));
  if (rows.unknownFlags?.length) found.push("неизвестные флаги строк: " + rows.unknownFlags.join(", "));

  for (const [re, msg] of DEFECTS) {
    const m = text.match(new RegExp(`.{0,50}${re.source}.{0,50}`));
    if (m) found.push(`${msg} → …${m[0].replace(/\n/g, " ⏎ ")}…`);
  }
  if (/\n[ \t]*\n[ \t]*\n/.test(outsideTables)) found.push("две пустые строки подряд");

  // запрещённые упоминания
  if (e.buyerDep === "" && e.sellerDep === "" && /\bdeposits?\b/i.test(text)) {
    found.push("депозитов нет, а слово deposit в тексте есть");
  }
  if (!c.sellerAgent && !c.buyerAgent && /\bAgents?\b|\bAgenc(y|ies)\b/i.test(text)) {
    found.push("агентств нет, а Agent/Agency в тексте есть");
  }
  if (!c.buyerAgent && /Buyer’s Agen/.test(text)) found.push("нет агентства Покупателя, а «Buyer’s Agent» есть");
  if (!c.sellerAgent && /Seller’s Agen/.test(text)) found.push("нет агентства Продавца, а «Seller’s Agent» есть");

  // строка добора порога — только когда порог не закрыт
  const hasTopUpRow = /Remaining balance to complete/.test(text);
  if (hasTopUpRow !== (e.topUp > 0)) {
    found.push(`строка добора порога ${hasTopUpRow ? "есть" : "отсутствует"}, а должна быть ${e.topUp > 0 ? "есть" : "отсутствовать"}`);
  }

  // все суммы в тексте — только ожидаемые
  const seen = new Set(Array.from(text.matchAll(/AED\s([\d,]+\.\d{2})/g), (m) => m[1]));
  for (const v of seen) if (!e.money.has(v)) found.push(`сумма AED ${v} не из этой сделки`);
  // и наоборот: ключевые суммы обязаны быть
  const must = [["liquidated damages Покупателя", e.buyerLd], ["liquidated damages Продавца", e.sellerLd]];
  for (const [label, v] of must) if (!seen.has(fmt(v))) found.push(`нет суммы: ${label} = AED ${fmt(v)}`);

  // нумерация статей: подряд, без дыр и повторов
  const nums = Array.from(text.matchAll(/^Article (\d+)$/gm), (m) => Number(m[1]));
  const expectSeq = Array.from({ length: e.articleCount }, (_, i) => i + 1);
  if (nums.join(",") !== expectSeq.join(",")) {
    found.push(`нумерация статей: ${nums.join(",")} вместо ${expectSeq.join(",")}`);
  }

  // дефекты исходной вёрстки есть во всех вариантах — вычитаем их
  if (baseline === null) baseline = new Set(found.map((f) => f.split(" → ")[0]));
  else found = found.filter((f) => !baseline.has(f.split(" → ")[0]));
  if (found.length) failures.push({ name, found });
}

console.log(`комбинаций: ${combos.length}, с замечаниями: ${failures.length}`);
for (const f of failures.slice(0, 12)) {
  console.log(`\n✘ ${f.name}`);
  f.found.forEach((x) => console.log("   " + x));
}
if (failures.length > 12) console.log(`\n…и ещё ${failures.length - 12}`);
if (!failures.length) console.log("замечаний нет");
process.exitCode = failures.length ? 1 : 0;
