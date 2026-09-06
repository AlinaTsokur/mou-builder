// Разметка шаблона Ready cash-to-cash (№3) маркерами движка v2.
// На копию (черновик):  node scripts/markup-ready-cash.mjs
// В оригинал:           node scripts/markup-ready-cash.mjs --original
//
// Правки общие с off-plan (scripts/markup/offplan-edits.mjs), отличия документа —
// в конфиге READY_CASH (scripts/markup/ready-deals.mjs).
import { buildEdits } from "./markup/offplan-edits.mjs";
import { READY_CASH } from "./markup/ready-deals.mjs";
import { runMarkup } from "./markup/run.mjs";

await runMarkup({
  sourceId: "1d-bXwKBO9J8fUQ35vqKWw5KzADJ6lB6fmD4hxeSjy3k",
  draftName: "РАЗМЕТКА — ready cash to cash (черновик)",
  edits: buildEdits(READY_CASH),
  // дата в шапке: табы убраны правкой, абзац прижимаем к правому краю
  paragraphStyles: [{ contains: "{{agreement_date_long}}", style: { alignment: "END" }, fields: "alignment" }],
  toOriginal: process.argv.includes("--original"),
});
