// Вернуть жирный в размеченном шаблоне: node scripts/fix-bold.mjs <documentId>
// Можно запускать повторно — правки идемпотентные.
import { getBotClients } from "./google-bot.mjs";
import { applyEdits } from "./docs-edit.mjs";
import { BOLD_REPAIR } from "./markup/bold-repair.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");

const { docs } = getBotClients();
const res = await applyEdits(docs, documentId, BOLD_REPAIR);
console.log(`применено: ${res.done.length} из ${BOLD_REPAIR.length}`);
if (res.failed.length) {
  console.log("не найдено:");
  res.failed.forEach((f) => console.log("   ——", f));
}
