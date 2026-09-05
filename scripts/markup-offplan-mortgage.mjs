// Разметка шаблона off-plan с ипотекой (№2) маркерами движка v2.
// На копию (черновик):  node scripts/markup-offplan-mortgage.mjs
// В оригинал:           node scripts/markup-offplan-mortgage.mjs --original
//
// Правки общие с №1 (scripts/markup/offplan-edits.mjs), отличия — в конфиге
// OFFPLAN_MORTGAGE (scripts/markup/offplan-deals.mjs). Строка добора порога
// вставляется отдельно, уже размеченной.
import { buildEdits } from "./markup/offplan-edits.mjs";
import { OFFPLAN_MORTGAGE, THRESHOLD_ROW } from "./markup/offplan-deals.mjs";
import { runMarkup } from "./markup/run.mjs";

await runMarkup({
  sourceId: "1RjrVeLZG65Fyzc5h0TFR0sks8D--jJocEXyF2H9fg9g",
  draftName: "РАЗМЕТКА — off-plan ипотека (черновик)",
  edits: buildEdits(OFFPLAN_MORTGAGE),
  rows: [THRESHOLD_ROW],
  // дата в шапке: табы убраны правкой, абзац прижимаем к правому краю
  paragraphStyles: [{ contains: "{{agreement_date_long}}", style: { alignment: "END" }, fields: "alignment" }],
  toOriginal: process.argv.includes("--original"),
});
