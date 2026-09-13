// Пакет договоров для проверки глазами: node scripts/generate-batch.mjs <templateId> [--mortgage]
// Создаёт папку с датой внутри папки MOU и кладёт туда договор на каждый сценарий.
// Генерация — тем же кодом, что и сайт.
import { getBotClients } from "./google-bot.mjs";
import { createMouDocument } from "../lib/google/docs.js";
import { normalizeForm, calculate, buildFlags, buildReplacementsV2, formForTemplate } from "../lib/mou/core.js";
import { buildArticleNumbers, getArticleDefsForTemplate } from "../lib/mou/articles.js";
import { baseFor, templateFor, SCENARIOS, READY_SCENARIOS, SELLER_MORTGAGE_SCENARIOS } from "./batch-scenarios.mjs";

const MORTGAGE = process.argv.includes("--mortgage");
const READY = process.argv.includes("--ready");
// --ready --seller-mortgage — №5, ипотека Продавца
const SELLER_MORTGAGE = process.argv.includes("--seller-mortgage");
const BASE = baseFor(MORTGAGE, READY, SELLER_MORTGAGE);
// то же описание шаблона, что и на сайте: иначе в пакет уедет форма, которой
// в реальной генерации не бывает (админ-часть ADM Fee, способ оплаты Продавцу)
const TEMPLATE = templateFor(MORTGAGE, READY, SELLER_MORTGAGE);
const DEFS = getArticleDefsForTemplate(TEMPLATE);
const CASES = READY ? [...SCENARIOS, ...READY_SCENARIOS, ...(SELLER_MORTGAGE ? SELLER_MORTGAGE_SCENARIOS : [])] : SCENARIOS;

const MOU_FOLDER = "1wAOozC2ofCV3Hsm16wdJoywK6_jvjZpm";

const templateId = process.argv[2];
if (!templateId) throw new Error("укажи ID шаблона");

const { docs, drive } = getBotClients();

const stamp = new Date().toISOString().slice(0, 10);
const folder = await drive.files.create({
  requestBody: {
    name: `ТЕСТЫ ${stamp} — ${READY && SELLER_MORTGAGE ? "ready №5 mortgage to cash" : READY && MORTGAGE ? "ready №4 cash to mortgage" : MORTGAGE ? "off-plan №2 ипотека" : READY ? "ready №3 cash to cash" : "off-plan №1"}`,
    mimeType: "application/vnd.google-apps.folder",
    parents: [MOU_FOLDER],
  },
  fields: "id,webViewLink",
});
console.log("папка:", folder.data.webViewLink, "\n");

// createMouDocument кладёт копию в MOU_CONFIG.outputFolderId — переносим в папку тестов
for (const [name, over] of CASES) {
  const form = { ...BASE, ...over };
  const data = normalizeForm(formForTemplate(form, TEMPLATE));
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
