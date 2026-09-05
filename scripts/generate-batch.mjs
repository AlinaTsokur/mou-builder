// Пакет договоров для проверки глазами: node scripts/generate-batch.mjs <templateId> [--mortgage]
// Создаёт папку с датой внутри папки MOU и кладёт туда договор на каждый сценарий.
// Генерация — тем же кодом, что и сайт.
import { getBotClients } from "./google-bot.mjs";
import { createMouDocument } from "../lib/google/docs.js";
import { normalizeForm, calculate, buildFlags, buildReplacementsV2 } from "../lib/mou/core.js";
import { buildArticleNumbers, ARTICLE_DEFS_OFFPLAN_V2, ARTICLE_DEFS_OFFPLAN_MORTGAGE_V2 } from "../lib/mou/articles.js";
import { baseFor, SCENARIOS } from "./batch-scenarios.mjs";

const MORTGAGE = process.argv.includes("--mortgage");
const DEFS = MORTGAGE ? ARTICLE_DEFS_OFFPLAN_MORTGAGE_V2 : ARTICLE_DEFS_OFFPLAN_V2;
const BASE = baseFor(MORTGAGE);

const MOU_FOLDER = "1wAOozC2ofCV3Hsm16wdJoywK6_jvjZpm";

const templateId = process.argv[2];
if (!templateId) throw new Error("укажи ID шаблона");

const { docs, drive } = getBotClients();

const stamp = new Date().toISOString().slice(0, 10);
const folder = await drive.files.create({
  requestBody: {
    name: `ТЕСТЫ ${stamp} — ${MORTGAGE ? "off-plan №2 ипотека" : "off-plan №1"}`,
    mimeType: "application/vnd.google-apps.folder",
    parents: [MOU_FOLDER],
  },
  fields: "id,webViewLink",
});
console.log("папка:", folder.data.webViewLink, "\n");

// createMouDocument кладёт копию в MOU_CONFIG.outputFolderId — переносим в папку тестов
for (const [name, over] of SCENARIOS) {
  const form = { ...BASE, ...over };
  const data = normalizeForm(form);
  const calc = calculate(data);
  const flags = buildFlags(data, calc);
  const numbers = buildArticleNumbers(data, [], DEFS);
  const replacements = buildReplacementsV2(data, calc, numbers);
  const doc = await createMouDocument({
    drive, docs, title: name, data, rules: [], replacements, flags, templateId, engine: "v2",
  });
  await drive.files.update({
    fileId: doc.id,
    addParents: folder.data.id,
    fields: "id",
  });
  const rest = doc.remainingPlaceholders.length ? `  ⚠ НЕ ПОДСТАВЛЕНО: ${doc.remainingPlaceholders.join(", ")}` : "";
  console.log(`${name}${rest}`);
}
console.log("\nготово");
