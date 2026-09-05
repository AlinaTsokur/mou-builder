// Проверка размеченного шаблона: node scripts/check-markup.mjs <documentId>
// Считает не только баланс маркеров, но и глубину вложенности —
// простой счётчик не видит, когда лишний {{/if}} в одном месте
// компенсируется недостающим в другом.
import { getBotClients } from "./google-bot.mjs";
import { buildIndex } from "./docs-edit.mjs";

const ENGINE_FLAGS = new Set([
  "buyer_deposit", "seller_deposit", "both_deposits", "any_deposit",
  "buyer_cheque_details", "seller_cheque_details", "buyer_cheque_third_party",
  "seller_agent", "buyer_agent", "both_agents", "any_agent",
  "seller_agent_fee", "buyer_agent_fee", "any_agent_fee",
  "noc_fee", "has_top_up", "has_developer_balance", "seller_cheque_third_party", "any_agent_fee",
]);

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");

const { docs } = getBotClients();
const { text } = buildIndex((await docs.documents.get({ documentId })).data);

let depth = 0;
let extra = 0;
const stack = [];
for (const m of text.matchAll(/\{\{(#if\s+!?([a-z0-9_]+)|\/if)\}\}/g)) {
  if (m[1] === "/if") {
    if (depth === 0) {
      extra += 1;
      console.log("ЛИШНИЙ {{/if}}:", JSON.stringify(text.slice(Math.max(0, m.index - 80), m.index + 12)));
    } else { depth -= 1; stack.pop(); }
  } else { depth += 1; stack.push(m[2]); }
}
if (depth > 0) console.log("НЕ ЗАКРЫТЫ условия:", stack.join(", "));

const flags = new Set([...text.matchAll(/\{\{#if\s+!?([a-z0-9_]+)\}\}/g)].map((m) => m[1]));
const rows = new Set([...text.matchAll(/\{\{#row\s+!?([a-z0-9_]+)\}\}/g)].map((m) => m[1]));
const unknown = [...flags, ...rows].filter((f) => !ENGINE_FLAGS.has(f));
const occ = [...text.matchAll(/\{\{([a-z0-9_]+)\}\}/g)].map((m) => m[1]);
const noAed = [...text.matchAll(/(.{6})\{\{(\w*(?:price|amount|fee|balance|damages|ld_\d+))\}\}/g)]
  .filter((m) => !/AED /.test(m[1])).map((m) => m[2]);

console.log(`вложенность: ${depth === 0 && extra === 0 ? "корректна" : "ОШИБКА"}`);
console.log(`условий: ${flags.size} видов, строк таблиц: ${[...rows].join(", ")}`);
console.log(`плейсхолдеры: ${new Set(occ).size} уникальных, ${occ.length} вхождений`);
console.log(`флаги вне движка: ${unknown.length ? unknown.join(", ") : "нет"}`);
console.log(`суммы без AED: ${noAed.length ? [...new Set(noAed)].join(", ") : "нет"}`);

// Код выхода нужен для CI: без него «ОШИБКА» в выводе всё равно считалась успехом
const ok = depth === 0 && extra === 0 && unknown.length === 0 && noAed.length === 0;
process.exitCode = ok ? 0 : 1;
