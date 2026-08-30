// Точечные правки уже размеченного шаблона: node scripts/patch-template.mjs <documentId> <ключ>
// Разметку целиком повторно не запустить (она не идемпотентна), а отдельные
// согласованные правки внести надо. Каждая правка описана здесь и применяется один раз.
import { getBotClients } from "./google-bot.mjs";
import { applyEdits } from "./docs-edit.mjs";

const PATCHES = {
  // 30.08, согласовано с Алиной: без агентств одобрять гарантийное письмо
  // от третьего лица некому, Агент из фразы уходит
  "agent-in-third-party-cheque": [
    { find: "acceptable to the Agent and the Parties", nth: 0,
      replace: "acceptable to {{#if any_agent}}the Agent and {{/if}}the Parties",
      note: "чек от третьего лица, Покупатель" },
    { find: "acceptable to the Agent and the Parties", nth: 0,
      replace: "acceptable to {{#if any_agent}}the Agent and {{/if}}the Parties",
      note: "чек от третьего лица, Продавец" },
  ],
};

const [documentId, key] = process.argv.slice(2);
if (!documentId || !PATCHES[key]) {
  throw new Error(`укажи ID и ключ правки. Доступные: ${Object.keys(PATCHES).join(", ")}`);
}

const { docs } = getBotClients();
const res = await applyEdits(docs, documentId, PATCHES[key]);
console.log(`применено: ${res.done.length} из ${PATCHES[key].length}`);
res.failed.forEach((f) => console.log("   ——", f));
