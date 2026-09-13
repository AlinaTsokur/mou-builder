// Разметка шаблона Ready mortgage to cash (№5) маркерами движка v2.
// На копию (черновик):  node scripts/markup-ready-mortgage-cash.mjs
// В оригинал:           node scripts/markup-ready-mortgage-cash.mjs --original
//
// Документ — №3 с ипотекой Продавца: строка Mortgage Release Fee, банк Продавца
// и два варианта денег Покупателя в ст.10. Конфиг — READY_MORTGAGE_CASH
// в scripts/markup/ready-deals.mjs.
import { buildEdits } from "./markup/offplan-edits.mjs";
import { READY_MORTGAGE_CASH } from "./markup/ready-deals.mjs";
import { runMarkup } from "./markup/run.mjs";

await runMarkup({
  sourceId: "1RDNBmgnI3V-1o-Nk--g4XJUpwvHP0sC2IrGY7R_hhw0",
  draftName: "РАЗМЕТКА — ready mortgage to cash (черновик)",
  edits: buildEdits(READY_MORTGAGE_CASH),
  // дата в шапке: табы убраны правкой, абзац прижимаем к правому краю
  paragraphStyles: [
    { contains: "{{agreement_date_long}}", style: { alignment: "END" }, fields: "alignment" },
    // абзац «с кредитом» склеен с разделителем «___» и взял его стиль — возвращаем отступ исходника
    { contains: "{{#if !buyer_own_funds}}", style: { spaceAbove: { magnitude: 12, unit: "PT" } }, fields: "spaceAbove" },
  ],
  toOriginal: process.argv.includes("--original"),
});
