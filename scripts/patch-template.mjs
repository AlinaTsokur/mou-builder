// Точечные правки уже размеченного шаблона: node scripts/patch-template.mjs <documentId> <ключ>
// Разметку целиком повторно не запустить (она не идемпотентна), а отдельные
// согласованные правки внести надо. Каждая правка описана здесь и применяется один раз.
import { getBotClients } from "./google-bot.mjs";
import { applyEdits } from "./docs-edit.mjs";

const PATCHES = {
  // 05.09: в строке ADM Fee не закрывалась скобка: «(2% from the Selling Price or
  // as per ADM valuation (whatever comes higher) to be paid…». В №1 скобка обнимает
  // способ расчёта и закрывается перед «to be paid» — приводим к тому же виду,
  // внутренняя пара скобок становится запятой
  "adm-fee-parenthesis": [
    { find: "or as per ADM valuation (whatever comes higher) to be paid",
      replace: "or as per ADM valuation, whatever comes higher) to be paid",
      note: "ст.4: скобка в строке ADM Fee" },
  ],
  // 05.09: если застройщику всё выплачено, строка остатка показывала «0% … AED 0.00».
  // Банк даёт чек застройщику, только если остаток есть (ответ Миши, 04.09) —
  // при нуле строка уходит целиком, как строка добора порога
  "developer-balance-row": [
    { find: "Remaining balance of {{remaining_balance_percent}}% of the Original Price",
      replace: "{{#row has_developer_balance}}Remaining balance of {{remaining_balance_percent}}% of the Original Price",
      note: "ст.4: строка остатка застройщику по условию" },
  ],
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
  // 05.09: пустая строка перед абзацем Продавца в ст.6 пропадала, когда реквизиты
  // чека известны — закрывающий маркер переезжает в начало следующего абзаца
  "seller-paragraph-blank-line": [
    { find: "in accordance with the terms of this MOU.{{/if}}\n{{#if seller_cheque_details}}",
      replace: "in accordance with the terms of this MOU.\n{{/if}}{{#if seller_cheque_details}}",
      note: "ст.6: маркер в начало абзаца Similarly" },
  ],
  // 04.09, ответ Миши: у Покупателя важен факт банковского пре-одобрения, сумма
  // не обязана равняться Selling Price (ипотека может быть на меньшую сумму)
  "mortgage-preapproval-amount": [
    { find: "obtained Mortgage Pre-Approval for an amount equal to the agreed Selling Price and that",
      replace: "obtained Mortgage Pre-Approval and that", note: "ст.10: сумма пре-одобрения" },
  ],
  // 01.09, согласовано с Алиной: упоминание Agency Fee следует за наличием
  // комиссий (any_agent_fee), а не агентов; при одном депозите чек в
  // единственном числе
  "fee-sentence-and-cheque-plural": [
    { find: "The Selling Price{{#if any_agent}}, the amount payable to the Seller, and the Agency Fee{{/if}}"
        + "{{#if !any_agent}} and the amount payable to the Seller{{/if}} set out",
      replace: "The Selling Price{{#if any_agent_fee}}, the amount payable to the Seller, and the Agency Fee{{/if}}"
        + "{{#if !any_agent_fee}} and the amount payable to the Seller{{/if}} set out",
      note: "ст.4 итоговая строка" },
    { find: "by the Parties{{#if any_agent}} or in a separate Commission Agreement{{/if}}.",
      replace: "by the Parties{{#if any_agent_fee}} or in a separate Commission Agreement{{/if}}.",
      note: "ст.4 Commission Agreement" },
    { find: "Security Deposit cheques shall be returned to {{deposit_return_parties}}",
      replace: "Security Deposit cheque{{#if both_deposits}}s{{/if}} shall be returned to {{deposit_return_parties}}",
      note: "ст.6 возврат чеков" },
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
// правка применена наполовину — это не успех, шаблон в промежуточном виде
process.exitCode = res.failed.length ? 1 : 0;
