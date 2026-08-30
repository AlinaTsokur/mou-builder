// Сухой прогон: какие правки из №1 находятся в №2, а какие нет. Ничего не пишет.
import fs from "node:fs";
import { getBotClients } from "../google-bot.mjs";
import { buildIndex } from "../docs-edit.mjs";

const src = fs.readFileSync("scripts/markup-offplan.mjs", "utf8");
const start = src.indexOf("const EDITS = [");
const end = src.indexOf("\n];", start);
const body = src.slice(start + "const EDITS = ".length, end + 2);
const EDITS = eval("(" + body + ")");

const { docs } = getBotClients();
const { text } = buildIndex((await docs.documents.get({ documentId: process.argv[2] })).data);

let ok = 0;
const missing = [];
for (const e of EDITS) {
  const needle = e.find || e.cellAfter;
  if (needle && text.includes(needle)) ok += 1;
  else missing.push(needle);
}
console.log(`совпало: ${ok} из ${EDITS.length}`);
console.log("НЕ НАЙДЕНО:");
missing.forEach((m) => console.log("  •", JSON.stringify(m).slice(0, 130)));
