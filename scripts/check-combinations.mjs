// Полный перебор вариантов сделки по шаблону off-plan:
//   node scripts/check-combinations.mjs <documentId> [--mortgage]
// --mortgage — шаблон №2 (ипотека Покупателя): 18 статей, три строки ADM-сборов,
// ссылки на статьи про банк в ст.7–8.
//
// Для каждой комбинации рендерит договор целиком и проверяет две вещи:
//   1. текст — нет запрещённых слов, маркеров, оборванных фраз, пустых строк;
//   2. арифметику — суммы в договоре пересчитаны здесь заново, из условий сделки,
//      а не взяты из lib/mou/core.js. Иначе проверка повторяла бы ошибку кода.
import { getBotClients } from "./google-bot.mjs";
import { buildIndex } from "./docs-edit.mjs";
import { renderLocal } from "./render-local.mjs";
import { ARTICLE_DEFS_OFFPLAN_V2, ARTICLE_DEFS_OFFPLAN_MORTGAGE_V2 } from "../lib/mou/articles.js";

const MORTGAGE = process.argv.includes("--mortgage");
const DEFS = MORTGAGE ? ARTICLE_DEFS_OFFPLAN_MORTGAGE_V2 : ARTICLE_DEFS_OFFPLAN_V2;

// ───────── условия сделки, общие для всех комбинаций
const SELLING = 1670000;
const ORIGINAL = 1494050;
const THRESHOLD_PCT = 30;
const ADM_ADMIN = 575;
// ипотечный шаблон: ADM Fee — чистые 2%, плюс две фиксированные строки
const ADM_ELECTRONIC = 1392;
const ADM_VALUATION = 925.75;
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
const PAID_UNDER = 300000;               // меньше порога — нужен добор
const PAID_EXACT = (1494050 * 30) / 100; // ровно порог — добор ноль
const PAID_OVER = 700000;                // больше порога — добор тоже ноль

const BASE = {
  agreementDate: "28/01/2026", reservationDeadline: "28/02/2026",
  sellingPrice: String(SELLING), originalPrice: String(ORIGINAL),
  transferThresholdPercent: String(THRESHOLD_PCT),
  ...(MORTGAGE
    ? { admAdminFee: "", admElectronicFee: String(ADM_ELECTRONIC), admValuationFee: String(ADM_VALUATION) }
    : { admAdminFee: String(ADM_ADMIN) }),
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
  // «ровно» — застройщику заплачено ровно столько, сколько требует порог:
  // добор равен нулю, строка из таблицы должна уйти. «сверх» — переплата.
  paidThreshold: ["не добран", "ровно", "сверх"],
  // способ расчёта у сторон независимый: у одного процент, у другого сумма
  buyerDepositCalc: ["процент", "сумма"],
  sellerDepositCalc: ["процент", "сумма"],
  buyerChequeKnown: [true, false],
  sellerChequeKnown: [true, false],
  thirdPartyCheque: [false, true],
  agentFees: ["есть", "выключены"],
  // состав сторон: один собственник, двое с долями, представитель по доверенности
  parties: ["один", "двое", "доверенность"],
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

const PAID_FOR = { "не добран": PAID_UNDER, "ровно": PAID_EXACT, "сверх": PAID_OVER };
const DELAYED = { ChequeTiming: "Delayed (within X days)", ChequeDays: "5" };

const PARTY_SETS = {
  "один": {
    sellers: [{ salutation: "Mr.", name: "Ivan Petrov", nationality: "Russia", passport: "222", eid: "784-1", ownershipPercent: "100" }],
    buyers: [{ salutation: "Mrs.", name: "Anna Ivanova", nationality: "Russia", passport: "333", eid: "784-2", ownershipPercent: "100" }],
  },
  "двое": {
    sellers: [
      { salutation: "Mr.", name: "Ivan Petrov", nationality: "Russia", passport: "222", eid: "784-1", ownershipPercent: "50" },
      { salutation: "Mrs.", name: "Maria Petrova", nationality: "Russia", passport: "223", eid: "784-3", ownershipPercent: "50" },
    ],
    buyers: [
      { salutation: "Mrs.", name: "Anna Ivanova", nationality: "Russia", passport: "333", eid: "784-2", ownershipPercent: "50" },
      { salutation: "Mr.", name: "Oleg Ivanov", nationality: "Russia", passport: "334", eid: "784-4", ownershipPercent: "50" },
    ],
  },
  "доверенность": {
    sellers: [{ salutation: "Mr.", name: "Ivan Petrov", nationality: "Russia", passport: "222", eid: "784-1", ownershipPercent: "100",
      hasPoa: true, poaName: "Petr Sidorov", poaNationality: "Russia", poaPassport: "555", poaEid: "784-9" }],
    buyers: [{ salutation: "Mrs.", name: "Anna Ivanova", nationality: "Russia", passport: "333", eid: "784-2", ownershipPercent: "100" }],
  },
};

function formFor(c) {
  const feesOn = c.agentFees === "есть";
  return {
    ...BASE,
    ...PARTY_SETS[c.parties],
    paidAmountToDeveloper: String(PAID_FOR[c.paidThreshold]),
    sellerAgentEnabled: c.sellerAgent ? "Yes" : "No",
    buyerAgentEnabled: c.buyerAgent ? "Yes" : "No",
    sellerAgentFeeEnabled: feesOn ? "Yes" : "No",
    buyerAgentFeeEnabled: feesOn ? "Yes" : "No",
    buyerDepositEnabled: c.buyerDeposit ? "Yes" : "No",
    sellerDepositEnabled: c.sellerDeposit ? "Yes" : "No",
    buyerDepositCalcType: c.buyerDepositCalc === "процент" ? "% of Selling Price" : "Fixed amount",
    buyerDepositPercent: String(DEPOSIT_PCT), buyerDepositFixedAmount: String(DEPOSIT_FIXED_BUYER),
    sellerDepositCalcType: c.sellerDepositCalc === "процент" ? "% of Selling Price" : "Fixed amount",
    sellerDepositPercent: String(DEPOSIT_PCT), sellerDepositFixedAmount: String(DEPOSIT_FIXED_SELLER),
    buyerChequeThirdParty: c.thirdPartyCheque ? "Yes" : "No",
    sellerChequeThirdParty: c.thirdPartyCheque ? "Yes" : "No",
    ...(c.buyerChequeKnown ? {} : { buyerChequeTiming: DELAYED.ChequeTiming, buyerChequeDays: DELAYED.ChequeDays }),
    ...(c.sellerChequeKnown ? {} : { sellerChequeTiming: DELAYED.ChequeTiming, sellerChequeDays: DELAYED.ChequeDays }),
  };
}

// ───────── независимый пересчёт: как должно быть по условиям договора
function expected(c) {
  const paid = PAID_FOR[c.paidThreshold];
  const required = (ORIGINAL * THRESHOLD_PCT) / 100;
  const topUp = Math.max(required - paid, 0);
  const remaining = Math.max(ORIGINAL - paid - topUp, 0);
  // Продавцу достаётся то, что осталось от цены после выплат застройщику:
  // добор порога и остаток по SPA идут не ему. Поле формы здесь перекрывается расчётом.
  const toSeller = SELLING - topUp - remaining;

  const dep = (on, calc, fixed) => (on ? (calc === "процент" ? (SELLING * DEPOSIT_PCT) / 100 : fixed) : "");
  const buyerDep = dep(c.buyerDeposit, c.buyerDepositCalc, DEPOSIT_FIXED_BUYER);
  const sellerDep = dep(c.sellerDeposit, c.sellerDepositCalc, DEPOSIT_FIXED_SELLER);

  // liquidated damages: свой депозит, иначе депозит другой стороны, иначе штраф из формы
  const buyerLd = buyerDep !== "" ? buyerDep : sellerDep !== "" ? sellerDep : PENALTY_BUYER;
  const sellerLd = sellerDep !== "" ? sellerDep : buyerDep !== "" ? buyerDep : PENALTY_SELLER;
  // без агента другой стороны его 20% никому не идут — Продавцу/Покупателю достаётся всё
  const buyerLd80 = c.sellerAgent ? buyerLd * 0.8 : buyerLd;
  const buyerLd20 = c.sellerAgent ? buyerLd * 0.2 : null;
  const sellerLd80 = c.buyerAgent ? sellerLd * 0.8 : sellerLd;
  const sellerLd20 = c.buyerAgent ? sellerLd * 0.2 : null;

  const admFee = MORTGAGE ? SELLING * 0.02 : SELLING * 0.02 + ADM_ADMIN;
  const amounts = [
    ORIGINAL, SELLING, toSeller, remaining, TRANSFER_FEE, admFee,
    ...(MORTGAGE ? [ADM_ELECTRONIC, ADM_VALUATION] : [ADM_ADMIN]),
    buyerLd, sellerLd, buyerLd80, sellerLd80,
  ];
  if (topUp > 0) amounts.push(topUp);
  if (buyerDep !== "") amounts.push(buyerDep);
  if (sellerDep !== "") amounts.push(sellerDep);
  if (buyerLd20 !== null) amounts.push(buyerLd20);
  if (sellerLd20 !== null) amounts.push(sellerLd20);
  const feesOn = c.agentFees === "есть";
  if (c.sellerAgent && feesOn) amounts.push(AGENCY_FEE_SELLER);
  if (c.buyerAgent && feesOn) amounts.push(AGENCY_FEE_BUYER);

  const remainingPct = ORIGINAL > 0 ? (remaining / ORIGINAL) * 100 : "";

  return {
    topUp, remaining, toSeller, remainingPct, buyerDep, sellerDep,
    buyerLd, sellerLd, buyerLd80, buyerLd20, sellerLd80, sellerLd20,
    feesOn, admFee,
    money: new Set(amounts.map(fmt)),
    articleCount: DEFS.length - (buyerDep === "" && sellerDep === "" ? 2 : 0),
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
const failures = [];

for (const c of combos) {
  const name = Object.entries(c).map(([k, v]) => `${k}=${v}`).join(" ");
  const { text, outsideTables, cond, rows, numbers } = renderLocal(doc, idx, formFor(c), DEFS);
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
  if (!c.sellerAgent && !c.buyerAgent) {
    // «through any other real estate agency» — известное место, слово other там
    // лишнее без агентств; разбирается отдельно, чтобы не глушить остальные находки
    const cleaned = text.replace(/through any other real estate agency/gi, "");
    if (/\bAgents?\b|\bAgenc(y|ies)\b/i.test(cleaned)) {
      const m = cleaned.match(/.{0,60}(\bAgents?\b|\bAgenc(y|ies)\b).{0,60}/i);
      found.push(`агентств нет, а Agent/Agency в тексте есть → …${m[0].replace(/\n/g, " ⏎ ")}…`);
    }
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

  // каждая обязательная сумма — на своём месте, а не просто «где-то в тексте»
  const lines = text.split("\n");
  const lineWith = (anchor) => lines.find((l) => l.includes(anchor));
  // В плоском тексте подпись строки таблицы и её значение — разные строки:
  // «Selling Price:» и следом «AED 1,670,000.00 / as agreed…». Ищем сумму
  // в самой строке с якорем, а если её там нет — в следующей непустой.
  // anchor — подстрока или список подстрок, которые должны быть в одной строке
  const inRow = (label, anchor, value) => {
    const parts = Array.isArray(anchor) ? anchor : [anchor];
    const i = lines.findIndex((l) => parts.every((x) => l.includes(x)));
    if (i === -1) { found.push(`нет строки: ${label} (искал «${anchor}»)`); return; }
    let next = i + 1;
    while (next < lines.length && !lines[next].trim()) next += 1;
    const where = [lines[i], lines[next] || ""].join(" ");
    if (!where.includes(`AED ${fmt(value)}`)) {
      found.push(`${label}: ожидал AED ${fmt(value)}, а в строке «${where.trim().slice(0, 90)}»`);
    }
  };
  inRow("Original Price", "as per the SPA issued by", ORIGINAL);
  inRow("Selling Price", "as agreed by the Parties", SELLING);
  inRow("Amount to Seller", "to be paid by the Buyer to the Seller on the Transfer Date", e.toSeller);
  inRow("остаток застройщику", "of the Original Price to be paid to the Developer", e.remaining);
  inRow("ADM Fee", "2% from the Selling Price", e.admFee);
  if (MORTGAGE) {
    inRow("ADM Electronic Fee", "ADM Electronic Fee:", ADM_ELECTRONIC);
    inRow("ADM Valuation Certificate", "ADM Valuation Certificate:", ADM_VALUATION);
  }
  inRow("Transfer Fee", "Transfer Fee", TRANSFER_FEE);
  if (e.topUp > 0) inRow("добор порога", "Remaining balance to complete", e.topUp);
  if (e.buyerDep !== "") inRow("депозит Покупателя", "provided by the Buyer to the Seller", e.buyerDep);
  if (e.sellerDep !== "") inRow("депозит Продавца", "provided by the Seller to the Buyer", e.sellerDep);
  if (c.sellerAgent && e.feesOn) inRow("агентские Продавца", "to The Seller’s Agent on the Transfer Date", AGENCY_FEE_SELLER);
  if (c.buyerAgent && e.feesOn) inRow("агентские Покупателя", "to The Buyer’s Agent on the Transfer Date", AGENCY_FEE_BUYER);
  // Фраза «Upon Buyer Default … shall pay AED … as liquidated damages» стоит в шаблоне
  // под {{#if !buyer_deposit}}: когда депозит есть, вместо неё идёт распределение
  // удержанного депозита. Поэтому сумму LD проверяем только у стороны без депозита.
  if (e.buyerDep === "") inRow("liquidated damages Покупателя", "Upon Buyer Default", e.buyerLd);
  if (e.sellerDep === "") inRow("liquidated damages Продавца", "Upon Seller Default", e.sellerLd);
  if (e.buyerDep !== "" && e.sellerDep !== "") {
    // с агентством — «a) 80% (…) to the Seller; and», без него — «a) 100% (…) to the Seller»
    inRow("доля Продавцу при дефолте Покупателя",
      c.sellerAgent ? "to the Seller; and" : ["a) 100%", "to the Seller"], e.buyerLd80);
    inRow("доля Покупателю при дефолте Продавца",
      c.buyerAgent ? "to the Buyer; and" : ["a) 100%", "to the Buyer"], e.sellerLd80);
    if (c.sellerAgent) inRow("доля агенту Продавца", "to the Seller’s Agent", e.buyerLd20);
    // в №1 «Buyer’s agent», в №2 «Buyer’s Agent» — ищем без учёта последней буквы
    if (c.buyerAgent) inRow("доля агенту Покупателя", ["b) 20%", "to the Buyer’s"], e.sellerLd20);
  }

  // процент остатка застройщику — в подписи строки таблицы
  const pctLine = lineWith("of the Original Price to be paid to the Developer");
  if (pctLine && e.remainingPct !== "") {
    const pct = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2, useGrouping: false }).format(e.remainingPct);
    if (!pctLine.includes(`${pct}%`)) {
      found.push(`процент остатка: ожидал ${pct}%, в строке «${pctLine.trim().slice(0, 70)}»`);
    }
  }

  // состав сторон: все имена на месте, доли и доверенность не потерялись
  for (const side of ["sellers", "buyers"]) {
    for (const person of PARTY_SETS[c.parties][side]) {
      if (!text.includes(person.name)) found.push(`нет собственника: ${person.name}`);
      if (!text.includes(`Ownership rights – ${person.ownershipPercent}%`)) {
        found.push(`нет доли ${person.ownershipPercent}% у ${person.name}`);
      }
      if (person.hasPoa && !text.includes(person.poaName)) found.push(`нет представителя: ${person.poaName}`);
    }
  }
  if (c.parties === "доверенность" && !text.includes("Power of Attorney")) {
    found.push("доверенность есть, а слов Power of Attorney нет");
  }
  // подписи: за собственника с доверенностью подписывает представитель
  const signName = c.parties === "доверенность" ? "Name: Petr Sidorov" : "Name: Ivan Petrov";
  if (!text.includes(signName)) found.push(`в подписях нет строки «${signName}»`);

  if (MORTGAGE) {
    // ссылки на статьи про банк в ст.7–8 идут по фактическим номерам:
    // с депозитами 10 и 11, без них — 8 и 9
    const ref = `described in Articles ${numbers.article_mortgage_approval_number} and ${numbers.article_bank_valuation_number}`;
    const refCount = text.split(ref).length - 1;
    if (refCount !== 2) found.push(`ссылок «${ref}» в ст.7–8: ${refCount} вместо 2`);
    if (/Articles \d+ and \d+/.test(text.replace(new RegExp(ref, "g"), ""))) found.push("осталась старая ссылка «Articles N and M»");
    // возврат депозита при отказе банка — только когда депозит Покупателя есть
    const rejection = /unable to obtain Final Mortgage Approval/.test(text);
    if (rejection !== c.buyerDeposit) found.push(`абзац об отказе банка ${rejection ? "есть" : "отсутствует"} при депозите Покупателя=${c.buyerDeposit}`);
    if (!/Mortgage Pre-Approval/.test(text)) found.push("нет статьи про Mortgage Approval");
  }

  // нумерация статей: подряд, без дыр и повторов
  const nums = Array.from(text.matchAll(/^Article (\d+)$/gm), (m) => Number(m[1]));
  const expectSeq = Array.from({ length: e.articleCount }, (_, i) => i + 1);
  if (nums.join(",") !== expectSeq.join(",")) {
    found.push(`нумерация статей: ${nums.join(",")} вместо ${expectSeq.join(",")}`);
  }

  // Раньше дефекты первой комбинации вычитались из остальных как «исходная вёрстка».
  // Так пряталась та же ошибка, возникшая в другой комбинации по другой причине,
  // поэтому теперь показываем всё и группируем по виду.
  if (found.length) failures.push({ name, found });
}

console.log(`комбинаций: ${combos.length}, с замечаниями: ${failures.length}`);

// группируем по виду замечания: 3000 комбинаций дают одни и те же несколько дефектов
const kinds = new Map();
for (const f of failures) {
  for (const x of f.found) {
    const kind = x.split(" → ")[0];
    if (!kinds.has(kind)) kinds.set(kind, { count: 0, example: x, combo: f.name });
    kinds.get(kind).count += 1;
  }
}
for (const [kind, info] of kinds) {
  console.log(`\n✘ ${kind} — в ${info.count} комбинациях`);
  if (info.example !== kind) console.log("   " + info.example.split(" → ")[1]);
  console.log("   пример: " + info.combo);
}
if (!failures.length) console.log("замечаний нет");
process.exitCode = failures.length ? 1 : 0;
