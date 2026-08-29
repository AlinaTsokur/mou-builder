// Применение правок, одобренных заказчиком (вкладка REVIEW).
// Проверка без изменений:  node scripts/apply-review.mjs
// Применение:              node scripts/apply-review.mjs --apply
import { getBotClients } from "./google-bot.mjs";
import { applyEdits } from "./docs-edit.mjs";

const APPLY = process.argv.includes("--apply");

const T = {
  "1":    "1vlmCEPFpPFQQfTVUbzeErNQKr1Vf2aApcbQrVt0B1-o",
  "1.2":  "1vftXIyFV32PKyFoCg-2J5b_58V94e5TFXJgXSIbIvWM",
  "2":    "1RjrVeLZG65Fyzc5h0TFR0sks8D--jJocEXyF2H9fg9g",
  "3":    "1d-bXwKBO9J8fUQ35vqKWw5KzADJ6lB6fmD4hxeSjy3k",
  "4":    "1slUJ8aQCw8nKIhlKBHWvhUFkLWnLH3k_N_OtwH5sm3Y",
  "5":    "1RDNBmgnI3V-1o-Nk--g4XJUpwvHP0sC2IrGY7R_hhw0",
  "6":    "1tRz59MGjnZKQpAZv0q_QMU4W6UPFLDBLr8uKPZYWP3w",
  "C3-1": "1SFLGotwOKOibBCT3iMiflfBWS9vjLkl8r7UuxpA8gW8",
  "C3-2": "1NngXRZMAxI1oK41vAsAh2KpXfkqIpSP1gCgKt9HLM14",
};

const A = "’"; // ’
const SELLER_DEFAULT = "the Seller shall be deemed to be in Default";
const BUYER_DEFAULT = "the Buyer shall be deemed to be in Default";

// [шаблон, правка]
const PLAN = [
  // № 2 — в статье о дефолте Продавца стоит Buyer's
  ["2", { note: "№2 Buyer→Seller (ст. 8)", within: SELLER_DEFAULT,
          find: `beyond the Buyer${A}s reasonable control`, replace: `beyond the Seller${A}s reasonable control` }],
  ["4", { note: "№2 Buyer→Seller (ст. 8)", within: SELLER_DEFAULT,
          find: `beyond the Buyer${A}s reasonable control`, replace: `beyond the Seller${A}s reasonable control` }],

  // № 3 — дубль фразы
  ["4", { note: "№3 убрать дубль (ст. 7)", within: BUYER_DEFAULT,
          find: `, or any third-party reason beyond the Buyer${A}s reasonable control`, replace: "" }],

  // № 4 — разорванное определение The Developer
  ["2", { note: "№4 убрать The с конца Force Majeure", find: "transaction.The", replace: "transaction." }],
  ["2", { note: "№4 вернуть The к Developer", find: "Developer – ALDAR DEVELOPMENT", insertBefore: "The ", bold: false }],

  // № 5 — обрезанное определение NOC
  ["4", { note: "№5 NOC → NOC fee", within: "an official document stating that the issuing authority",
          find: "NOC", replace: "NOC fee", bold: true }],
  ["4", { note: "№5 вернуть текст определения", within: "an official document stating that the issuing authority",
          find: " — an official document", insertBefore: " is a fee charged for issuing a No Objection Certificate (NOC)", bold: false }],
  ["4", { note: "№5 выделить No Objection Certificate", find: "No Objection Certificate (NOC)", bold: true }],

  // № 6 — дата в блоке агентства Продавца (шаблон 1.2 не размечен, идёт отдельно)
  ...["1", "2", "3", "4", "5", "6", "C3-1", "C3-2"].map((k) => [k, {
    note: "№6 дата агентства Продавца", within: "SELLER" + A + "S AGENCY",
    find: "{{buyer_signature_date}}", replace: "{{seller_signature_date}}",
  }]),

  // № 9 — слипшиеся пункты a) и b)
  ["2", { note: "№9 перенос перед a)", find: "a) 80%", insertBefore: "\n" }],
  ["2", { note: "№9 перенос перед b)", find: "b) 20%", insertBefore: "\n" }],
  ["4", { note: "№9 перенос перед a)", find: "a) 80%", insertBefore: "\n" }],
  ["4", { note: "№9 перенос перед b)", find: "b) 20%", insertBefore: "\n" }],
  ["C3-1", { note: "№9 перенос перед a)", find: "a) 80%", insertBefore: "\n" }],
  ["C3-1", { note: "№9 перенос перед b)", find: "b) 20%", insertBefore: "\n" }],

  // № 16 — Mr. → Mr(s). (по два вхождения: Продавец и Покупатель)
  ...["1", "1.2", "3", "5"].flatMap((k) => [
    [k, { note: "№16 Mr(s). (продавец)", find: "has designated Mr. ", replace: "has designated Mr(s). " }],
    [k, { note: "№16 Mr(s). (покупатель)", find: "has designated Mr. ", replace: "has designated Mr(s). " }],
  ]),

  // № 17 — hereinafter
  ["2", { note: "№17 hereinafter", find: "here in after referred to", replace: "hereinafter referred to" }],
  ["4", { note: "№17 hereinafter", find: "here in after referred to", replace: "hereinafter referred to" }],

  // № 18 — точка снаружи жирного в “Parties/Party”.
  ...["1", "1.2", "2"].map((k) => [k, {
    note: "№18 Parties/Party", find: "“Parties/Party”.", replace: "“Parties/Party”.",
    runs: [[0, 15, true], [15, 16, false]],
  }]),

  // № 19 — Verification → Valuation
  ["2", { note: "№19 ADM Valuation Certificate", find: "ADM Verification Certificate", replace: "ADM Valuation Certificate" }],

  // № 21 — Agreement жирным в первой строке
  ...["1", "1.2", "2"].map((k) => [k, {
    note: "№21 Agreement жирным", within: "is signed and entered on the Date", find: "Agreement", bold: true,
  }]),

  // № 22 — Title Deed Number жирным
  ["C3-2", { note: "№22 Title Deed жирным", find: "2026/0000", bold: true }],
];

const { docs } = getBotClients();
const byDoc = new Map();
for (const [key, edit] of PLAN) {
  if (!byDoc.has(key)) byDoc.set(key, []);
  byDoc.get(key).push({ ...edit, dryRun: !APPLY });
}

let okCount = 0;
let failCount = 0;
for (const [key, edits] of byDoc) {
  const res = await applyEdits(docs, T[key], edits);
  console.log(`\n── шаблон ${key}`);
  for (const d of res.done) { console.log(`   ok   ${d}`); okCount += 1; }
  for (const f of res.failed) { console.log(`   ——   ${f}`); failCount += 1; }
}
console.log(`\n${APPLY ? "ПРИМЕНЕНО" : "ПРОВЕРКА"}: найдено ${okCount}, не найдено ${failCount}`);
