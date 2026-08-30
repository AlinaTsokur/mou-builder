// Разметка шаблона off-plan маркерами движка v2.
// На копию (черновик):  node scripts/markup-offplan.mjs
// В оригинал:           node scripts/markup-offplan.mjs --original
import { getBotClients } from "./google-bot.mjs";
import { applyEdits } from "./docs-edit.mjs";

const SRC = "1vlmCEPFpPFQQfTVUbzeErNQKr1Vf2aApcbQrVt0B1-o";
const FOLDER = "1wAOozC2ofCV3Hsm16wdJoywK6_jvjZpm";
const TO_ORIGINAL = process.argv.includes("--original");
const DRAFT_NAME = "РАЗМЕТКА — off-plan (черновик)";
const { drive, docs } = getBotClients();

const SELLER = "referred to as the «Seller»";
const BUYER = "referred to as the «Buyer»";

const EDITS = [
  // ═══ шапка
  { find: "28/01/2026", replace: "{{agreement_date}}" },
  { find: "January 25, 2026", replace: "{{agreement_date_long}}", note: "дата над логотипом" },

  // Продавец
  { find: "Mr(s). ", replace: "{{#if !seller_is_company}}Mr(s). ", within: SELLER },
  { find: "Name Surname", replace: "{{seller_name}}", within: SELLER },
  { find: "Russian Federation", replace: "{{seller_nationality}}", within: SELLER },
  { find: "222222222", replace: "{{seller_passport}}", within: SELLER },
  { find: "784-1990-2222222-2", replace: "{{seller_eid}}", within: SELLER },
  { find: "100", replace: "{{seller_ownership}}", within: SELLER },
  { find: " has designated", replace: "{{#if seller_poa}} has designated", within: SELLER },
  { find: "Name Surname", replace: "{{seller_poa_name}}", within: SELLER },
  { find: "Russian Federation", replace: "{{seller_poa_nationality}}", within: SELLER },
  { find: "11 1111111", replace: "{{seller_poa_passport}}", within: SELLER },
  { find: "784-1990-1111111-1", replace: "{{seller_poa_eid}}", within: SELLER },
  { find: ", hereafter referred to as the «Seller»",
    replace: "{{/if}}{{/if}}{{#if seller_is_company}}{{seller_company_block}}{{/if}}, hereafter referred to as the «Seller»" },

  // Покупатель
  { find: "Name Surname", replace: "{{buyer_name}}", within: BUYER },
  { find: "Russian Federation", replace: "{{buyer_nationality}}", within: BUYER },
  { find: "222222222", replace: "{{buyer_passport}}", within: BUYER },
  { find: "784-1990-2222222-2", replace: "{{buyer_eid}}", within: BUYER },
  { find: "100", replace: "{{buyer_ownership}}", within: BUYER },
  { find: " has designated", replace: "{{#if buyer_poa}} has designated", within: BUYER },
  { find: "Name Surname", replace: "{{buyer_poa_name}}", within: BUYER },
  { find: "Russian Federation", replace: "{{buyer_poa_nationality}}", within: BUYER },
  { find: "11 1111111", replace: "{{buyer_poa_passport}}", within: BUYER },
  { find: "784-1990-1111111-1", replace: "{{buyer_poa_eid}}", within: BUYER },
  { find: ", hereinafter referred to as the «Buyer»", replace: "{{/if}}, hereinafter referred to as the «Buyer»" },

  // Агентства
  { find: "PRIME BRIDGE REAL ESTATE BROKERAGE - L.L.C - S.P.C", replace: "{{seller_agent_name}}", nth: 0 },
  { find: "Mikhail Slobodchikov", replace: "{{seller_agent_representative}}", nth: 0 },
  { find: "#CN-6410679", replace: "{{seller_agent_license}}", nth: 0 },
  { find: "Office 6, Ar Raha 8 St, MUSAFFAH, Abu Dhabi, 20335", replace: "{{seller_agent_address}}", nth: 0 },
  { find: "PRIME BRIDGE REAL ESTATE BROKERAGE - L.L.C - S.P.C", replace: "{{buyer_agent_name}}", nth: 0 },
  { find: "Mikhail Slobodchikov", replace: "{{buyer_agent_representative}}", nth: 0 },
  { find: "#CN-6410679", replace: "{{buyer_agent_license}}", nth: 0 },
  { find: "Office 6, Ar Raha 8 St, MUSAFFAH, Abu Dhabi, 20335", replace: "{{buyer_agent_address}}", nth: 0 },
  // блок каждого агентства — под своим флагом, совместное определение — только при двух
  { find: "{{seller_agent_name}}", insertBefore: "{{#if seller_agent}}" },
  { find: "{{buyer_agent_name}}", insertBefore: "{{/if}}{{#if buyer_agent}}" },
  { find: "The Seller’s Agent and the Buyer’s Agent are hereafter collectively referred to as",
    insertBefore: "{{/if}}{{#if both_agents}}", note: "открыть both_agents" },
  { find: "Terms and conditions", insertBefore: "{{/if}}", note: "закрыть both_agents" },

  // ═══ определения
  { find: "ALDAR DEVELOPMENT L.L.C – O.P.C", replace: "{{developer_name}}", within: "being the developer authorized" },
  { find: "Security Deposit ", replace: "{{#if any_deposit}}Security Deposit ", within: "the security deposit, if any" },
  { find: "performance of their obligations.", replace: "performance of their obligations.{{/if}}" },
  { find: "Liquidated Damages", replace: "{{#if !both_deposits}}Liquidated Damages", within: "an agreed amount payable by the defaulting Party" },
  { find: "pre-estimate of loss and not a penalty.", replace: "pre-estimate of loss and not a penalty.{{/if}}", within: "an agreed amount payable by the defaulting Party" },
  { find: " NOC fee", replace: "{{#if noc_fee}} NOC fee", within: "any fee levied by the" },
  { find: "no objection to a specific action.", replace: "no objection to a specific action.{{/if}}", within: "any fee levied by the" },

  // ═══ ст. 3 — объект
  { find: "Residential", replace: "{{type_of_area}}", within: "Type of Area" },
  { find: "N/A", replace: "{{title_deed_number}}" },
  { find: "Saadiyat Island, Abu Dhabi, UAE", replace: "{{location}}" },
  { find: "3BHK + M", replace: "{{bedrooms}}" },
  { find: "153.50", replace: "{{area_sqm}}" },
  { find: "Apartment", replace: "{{property_type}}" },
  { find: "The Source-R18-212", replace: "{{unit_number}}" },
  { find: "The Source", replace: "{{project_name}}", within: "Project name" },
  { find: "Additional Information:", replace: "Additional Information: {{additional_information}}" },
  { cellAfter: "Number of Car Parking Spaces:", replace: "{{parking_spaces}}", note: "parking_spaces" },

  // ═══ ст. 4 — платёжная таблица
  { find: "AED 0,000,000.00", replace: "AED {{original_price}}", within: "as per the SPA issued by the" },
  { find: "AED 0,000,000.00", replace: "AED {{selling_price}}", within: "as agreed by the" },
  { find: "AED 0,000,000.00", replace: "AED {{amount_to_seller}}", within: "to be paid by the" },
  { find: "Manager's Cheque or Cash", replace: "{{seller_payment_method}}" },

  { find: "Remaining balance to complete ", replace: "{{#row has_top_up}}Remaining balance to complete " },
  // порог и остаток застройщику — проценты у сделок разные (30/70 против 25/75)
  { find: "complete 30% threshold", replace: "complete {{transfer_threshold_percent}}% threshold" },
  { find: "Remaining balance of 70% of the Original Price",
    replace: "Remaining balance of {{remaining_balance_percent}}% of the Original Price" },
  { find: "AED 00,000.00", replace: "AED {{threshold_amount}}", within: "ESCROW ACCOUNT on the Transfer Date" },
  { find: "THE SOURCE – ESCROW ACCOUNT", replace: "{{escrow_account}}", within: "ESCROW ACCOUNT on the Transfer Date" },

  { find: "AED 2,672,972.51", replace: "AED {{developer_balance}}" },
  { find: "THE SOURCE – ESCROW ACCOUNT", replace: "{{escrow_account}}", within: "in accordance with the Payment Plan" },

  // подпись строки: «Transfer Fee / NOC Fee» либо просто «Transfer Fee» — решает движок
  { find: "Transfer Fee / NOC Fee:", replace: "{{transfer_fee_label}}:" },
  { find: "AED 4,000.00", replace: "AED {{transfer_fee}}" },
  { find: "ALDAR PROPERTIES PJSC", replace: "{{transfer_fee_payee}}" },
  { find: "AED 00,000.00", replace: "AED {{adm_electronic_fee}}", within: "2% from the" },
  { find: "AED 575", replace: "AED {{adm_surcharge}}" },
  { find: "Aldar Development LLC - OPC", replace: "{{adm_payee}}" },

  { find: "Security deposit:", replace: "{{#row any_deposit}}Security deposit:" },
  // строку целиком собирает движок: при проценте — «10% of the Selling Price…»,
  // при фиксированной сумме — «Security Deposit…». Разметка по кускам это не умела.
  { find: "AED 000,000.00 / (10% of the Selling Price provided by the Buyer to the Seller)",
    replace: "{{#if buyer_deposit}}{{buyer_security_deposit_table_line}}{{/if}}", note: "строка депозита Покупателя" },
  { find: "AED 000,000.00 / (10% of the Selling Price provided by the Seller to the Buyer)",
    replace: "{{#if seller_deposit}}{{seller_security_deposit_table_line}}{{/if}}", note: "строка депозита Продавца" },

  { find: "AED 00,000.00", replace: "{{#if buyer_agent_fee}}AED {{buyer_agency_fee}}", within: "to The Buyer’s Agent" },
  { find: "to The Buyer’s Agent on the Transfer Date", replace: "to The Buyer’s Agent on the Transfer Date{{/if}}" },
  { find: "AED 00,000.00", replace: "{{#if seller_agent_fee}}AED {{seller_agency_fee}}", within: "to The Seller’s Agent" },
  { find: "to The Seller’s Agent on the Transfer Date", replace: "to The Seller’s Agent on the Transfer Date{{/if}}" },

  // ═══ ст. 5 — срок
  { find: "15 January 2026", replace: "{{reservation_deadline}}" },

  // ═══ ст. 6 — депозитные чеки
  // Покупатель, абзац без реквизитов чека
  { find: "Upon signing this agreement", replace: "{{#if buyer_deposit}}{{#if !buyer_cheque_details}}Upon signing this agreement",
    within: "will be held by The Seller’s Agency" },
  { find: "AED 000,000 ", replace: "AED {{buyer_deposit_amount}} ", within: "will be held by The Seller’s Agency" },
  // держатель уже содержит «as stakeholder» — забираем эти слова в плейсхолдер
  { find: "The Seller’s Agency as stakeholder", replace: "{{buyer_deposit_holder}}",
    within: "will be held by The Seller’s Agency" },
  { find: "in accordance with the terms of this MOU.", replace: "in accordance with the terms of this MOU.{{/if}}",
    within: "{{buyer_deposit_holder}} until" },

  // Покупатель, абзац с реквизитами чека
  { find: "Upon signing this agreement", replace: "{{#if buyer_cheque_details}}Upon signing this agreement", within: "cheque No." },
  { find: "AED 528,013", replace: "AED {{buyer_deposit_amount}}", within: "cheque No." },
  { find: "Name Surname", replace: "{{buyer_cheque_favour}}", within: "cheque No." },
  { find: "174369", replace: "{{buyer_cheque_no}}" },
  { find: "14.04.2026", replace: "{{buyer_cheque_date}}" },
  { find: "First Abu Dhabi Bank", replace: "{{buyer_cheque_bank}}" },
  { find: "Name Surname", replace: "{{buyer_cheque_drawer}}", within: "cheque No." },
  { find: ", on behalf of the Buyer, provided that such third party",
    replace: "{{#if buyer_cheque_third_party}}, on behalf of the Buyer, provided that such third party" },
  { find: "the funds are provided on behalf of the Buyer.", replace: "the funds are provided on behalf of the Buyer{{/if}}." },
  { find: "Buyer’s Agent as stakeholder", replace: "{{buyer_deposit_holder}}", within: "cheque No." },
  { find: "in accordance with the terms of this MOU.", replace: "in accordance with the terms of this MOU.{{/if}}{{/if}}",
    within: "cheque No." },

  // Продавец: в документе есть только абзац с реквизитами.
  // Вставляем перед ним зеркальный абзац без реквизитов — как у Покупателя
  // (текст согласован в эталоне templates/offplan-v2-template.md).
  { find: "Similarly, upon signing",
    insertBefore: "{{#if seller_deposit}}{{#if !seller_cheque_details}}{{seller_deposit_intro}} the Seller undertakes to pay a sum of AED "
      + "{{seller_deposit_amount}} as a holding Security Deposit cheque. This cheque is to secure the purchase of the Property "
      + "and will be held by {{seller_deposit_holder}} until the Transfer Date in accordance with the terms of this MOU.{{/if}}\n",
    note: "абзац Продавца без реквизитов чека" },

  // Продавец, абзац с реквизитами чека
  { find: "Similarly, upon signing this agreement,", replace: "{{#if seller_cheque_details}}{{seller_deposit_intro}}" },
  { find: "AED 000,000 ", replace: "AED {{seller_deposit_amount}} ", within: "Petr Petrov" },
  { find: "Petr Petrov", replace: "{{seller_cheque_favour}}" },
  { find: "000020", replace: "{{seller_cheque_no}}" },
  { find: "00.00.2026", replace: "{{seller_cheque_date}}" },
  { find: "Emirates NBD", replace: "{{seller_cheque_bank}}" },
  { find: "Ivan Ivanov", replace: "{{seller_cheque_drawer}}" },
  { find: ", on behalf of the Seller, provided that such third party",
    replace: "{{#if seller_cheque_third_party}}, on behalf of the Seller, provided that such third party" },
  { find: "the funds are provided on behalf of the Seller.", replace: "the funds are provided on behalf of the Seller{{/if}}." },
  { find: "Seller’s Agent as stakeholder", replace: "{{seller_deposit_holder}}", within: "{{seller_cheque_drawer}}" },
  { find: "in accordance with the terms of this MOU.", replace: "in accordance with the terms of this MOU.{{/if}}{{/if}}",
    within: "{{seller_cheque_drawer}}" },

  { find: "Upon successful completion of the transfer", replace: "{{#if any_deposit}}Upon successful completion of the transfer" },
  { find: "shall not be presented for payment.", replace: "shall not be presented for payment.{{/if}}" },

  // ═══ ст. 7 — дефолт Покупателя
  { find: "__", replace: "{{#if !buyer_deposit}}", nth: 0 },
  { find: "AED 528,013", replace: "AED {{buyer_liquidated_damages}}", within: "Upon Buyer Default" },
  { find: "This amount shall be distributed as follows:", replace: "This amount shall be distributed as follows:{{/if}}", nth: 0 },
  { find: "__", replace: "{{#if buyer_deposit}}", nth: 0 },
  { find: "The forfeited Security Deposit shall be distributed as follows:",
    replace: "The forfeited Security Deposit shall be distributed as follows:{{/if}}", nth: 0 },
  { find: "AED 263,000", replace: "AED {{buyer_ld_80}}" },
  { find: "AED 65,000", replace: "AED {{buyer_ld_20}}" },

  // ═══ ст. 8 — дефолт Продавца
  { find: "—-", replace: "{{#if !seller_deposit}}", note: "ст.8, открыть !seller_deposit" },
  { find: "AED 528,013", replace: "AED {{seller_liquidated_damages}}", within: "Upon Seller Default" },
  { find: "This amount shall be distributed as follows:", replace: "This amount shall be distributed as follows:{{/if}}", nth: 1 },
  { find: "_____", replace: "{{#if seller_deposit}}" },
  { find: "The forfeited Security Deposit shall be distributed as follows:",
    replace: "The forfeited Security Deposit shall be distributed as follows:{{/if}}", nth: 1 },
  { find: "AED 263,600", replace: "AED {{seller_ld_80}}" },
  { find: "AED 65,900", replace: "AED {{seller_ld_20}}" },

  // ═══ ст. 9 — освобождение депозита
  { find: "If Article 7 or Article 8 applies", replace: "{{#if any_deposit}}If Article 7 or Article 8 applies" },
  { find: "No unilateral instruction from either Party shall authorize its release.",
    replace: "No unilateral instruction from either Party shall authorize its release.{{/if}}" },

  // ═══ ст. 15 — уведомление о споре
  { find: "via agents\u2019 email", replace: "via {{#if any_agent}}agents\u2019 {{/if}}email" },
  { find: ", with a copy of such email or letter delivered to Agencies for their reference",
    replace: "{{#if any_agent}}, with a copy of such email or letter delivered to {{agencies_word}} for their reference{{/if}}" },
  // решение заказчика: без агентств абзац об освобождении агентства от ответственности уходит целиком
  { find: "The Parties hereby undertake to indemnify",
    replace: "{{#if any_agent}}The Parties hereby undertake to indemnify" },
  { find: "the Agency", replace: "{{agencies_word}}", within: "hold harmless" },
  { find: "in relation to this MOU.", replace: "in relation to this MOU.{{/if}}", within: "hold harmless" },

  // ═══ подписи агентств
  { find: "SELLER’S AGENCY", replace: "{{#if seller_agent}}SELLER’S AGENCY" },
  { find: "Company Stamp", replace: "Company Stamp{{/if}}", nth: 0 },
  { find: "BUYER’S AGENCY", replace: "{{#if buyer_agent}}BUYER’S AGENCY" },
  { find: "Company Stamp", replace: "Company Stamp{{/if}}", nth: 1 },

  // ═══ номера статей: движок нумерует сам (ARTICLE_DEFS_OFFPLAN_V2),
  // поэтому при отключении статьи остальные не «поплывут».
  // Сначала перекрёстные ссылки в тексте, потом заголовки — от 17 к 1,
  // иначе «Article 1» совпал бы с началом «Article 17».
  { find: "described in Article 3 of this Agreement",
    replace: "described in Article {{article_property_details_number}} of this Agreement" },
  { find: "set out in Article 4 of this Agreement",
    replace: "set out in Article {{article_payment_table_number}} of this Agreement" },
  { find: "as defined in Article 5 of this MOU",
    replace: "as defined in Article {{article_reservation_period_number}} of this MOU", nth: 0 },
  { find: "as defined in Article 5 of this MOU",
    replace: "as defined in Article {{article_reservation_period_number}} of this MOU", nth: 0 },
  { find: "If Article 7 or Article 8 applies",
    replace: "If Article {{article_buyer_default_number}} or Article {{article_seller_default_number}} applies" },
  { find: "Article 17", replace: "Article {{article_electronic_signature_number}}", nth: 0, note: "заголовок ст. 17" },
  { find: "Article 16", replace: "Article {{article_entire_agreement_number}}", nth: 0, note: "заголовок ст. 16" },
  { find: "Article 15", replace: "Article {{article_amicable_dispute_number}}", nth: 0, note: "заголовок ст. 15" },
  { find: "Article 14", replace: "Article {{article_aml_number}}", nth: 0, note: "заголовок ст. 14" },
  { find: "Article 13", replace: "Article {{article_developer_approval_number}}", nth: 0, note: "заголовок ст. 13" },
  { find: "Article 12", replace: "Article {{article_property_hold_number}}", nth: 0, note: "заголовок ст. 12" },
  { find: "Article 11", replace: "Article {{article_seller_outstanding_charges_number}}", nth: 0, note: "заголовок ст. 11" },
  { find: "Article 10", replace: "Article {{article_buyer_own_funds_number}}", nth: 0, note: "заголовок ст. 10" },
  { find: "Article 9", replace: "Article {{article_deposit_release_number}}", nth: 0, note: "заголовок ст. 9" },
  { find: "Article 8", replace: "Article {{article_seller_default_number}}", nth: 0, note: "заголовок ст. 8" },
  { find: "Article 7", replace: "Article {{article_buyer_default_number}}", nth: 0, note: "заголовок ст. 7" },
  { find: "Article 6", replace: "Article {{article_security_deposit_number}}", nth: 0, note: "заголовок ст. 6" },
  { find: "Article 5", replace: "Article {{article_reservation_period_number}}", nth: 0, note: "заголовок ст. 5" },
  { find: "Article 4", replace: "Article {{article_payment_table_number}}", nth: 0, note: "заголовок ст. 4" },
  { find: "Article 3", replace: "Article {{article_property_details_number}}", nth: 0, note: "заголовок ст. 3" },
  { find: "Article 2", replace: "Article {{article_effective_date_number}}", nth: 0, note: "заголовок ст. 2" },
  { find: "Article 1", replace: "Article {{article_sale_offer_number}}", nth: 0, note: "заголовок ст. 1" },
];

let id = SRC;
if (!TO_ORIGINAL) {
  // прошлый черновик удаляем: разметка не идемпотентна, каждый прогон — свежая копия
  const stale = await drive.files.list({
    q: `'${FOLDER}' in parents and name = '${DRAFT_NAME}' and trashed = false`,
    fields: "files(id)",
  });
  for (const f of stale.data.files || []) await drive.files.update({ fileId: f.id, requestBody: { trashed: true } });

  const copy = await drive.files.copy({
    fileId: SRC,
    requestBody: { name: DRAFT_NAME, parents: [FOLDER] },
    fields: "id,webViewLink",
  });
  id = copy.data.id;
  console.log("копия:", copy.data.webViewLink);
}

const res = await applyEdits(docs, id, EDITS);
console.log(`\nприменено: ${res.done.length} из ${EDITS.length}`);
if (res.failed.length) {
  console.log("не найдено:");
  res.failed.forEach((f) => console.log("   ——", f));
}
