// Общий список правок для off-plan шаблонов. Отличия документов вынесены в конфиг:
// значения демо-сделки, наличие строки порога, список статей, ипотечные вставки.
// Проверка эквивалентности после правок: node scripts/markup/verify-edits.mjs

// Строка «добить порог до N%»: есть не во всех шаблонах — если порог уже закрыт,
// строку из таблицы убрали. Escrow-счёт в ней свой, поэтому эти правки идут вместе.
function thresholdRowHead() {
  return [
    { find: "Remaining balance to complete ", replace: "{{#row has_top_up}}Remaining balance to complete " },
    // проценты у сделок разные (30/70 против 25/75)
    { find: "complete 30% threshold", replace: "complete {{transfer_threshold_percent}}% threshold" },
  ];
}

function thresholdRowTail(D) {
  return [
    { find: "AED 00,000.00", replace: "AED {{threshold_top_up_amount}}", within: "ESCROW ACCOUNT on the Transfer Date" },
    { find: D.escrowName, replace: "{{escrow_account_name}}", within: "ESCROW ACCOUNT on the Transfer Date" },
  ];
}

// заголовки идут от последней статьи к первой: иначе «Article 1» совпал бы
// с началом «Article 17»
function articleHeadings(list) {
  return list.slice().reverse().map(([num, key]) => ({
    find: `Article ${num}`,
    replace: `Article {{${key}}}`,
    nth: 0,
    note: `заголовок ст. ${num}`,
  }));
}

function article5Refs(count) {
  return Array.from({ length: count }, () => ({
    find: "as defined in Article 5 of this MOU",
    replace: "as defined in Article {{article_reservation_period_number}} of this MOU",
    nth: 0,
  }));
}

// Статьи 7–8 ипотечного шаблона (№2). Отличия от №1: в ст.7 нет маркера перед
// «Upon Buyer Default», в ст.8 нет второй фразы «The forfeited…» и маркеров,
// строки a)/b) в ст.8 разделены мягким переносом, после «Agent» стоит точка.
// Итоговая разметка та же, что у №1: без депозита у стороны — фраза про
// liquidated damages, с депозитом — распределение удержанного депозита.
function article78Mortgage(D) {
  return [
    // ═══ ст. 7 — дефолт Покупателя
    { find: "Upon Buyer Default", insertBefore: "{{#if !buyer_deposit}}", note: "ст.7 открыть !buyer_deposit" },
    { find: "AED 528,013", replace: "AED {{buyer_liquidated_damages_amount}}", within: "Upon Buyer Default" },
    { find: ", being an amount equal to the Security Deposit", within: "Upon Buyer Default",
      replace: "{{#if any_deposit}}, being an amount equal to the Security Deposit{{/if}}", note: "ст.7 без депозитов" },
    { find: "This amount shall be distributed as follows:", nth: 0,
      replace: "{{#if any_deposit}}This amount shall be distributed as follows:{{/if}}{{/if}}", note: "ст.7 закрыть !buyer_deposit" },
    { find: "__", replace: "{{#if buyer_deposit}}", nth: 0, note: "ст.7 открыть buyer_deposit" },
    { find: "The forfeited Security Deposit shall be distributed as follows:", nth: 0,
      replace: "The forfeited Security Deposit shall be distributed as follows:{{/if}}", note: "ст.7 закрыть buyer_deposit" },
    { find: D.buyerLd80, replace: "AED {{buyer_deposit_80_percent_amount}}" },
    { find: D.buyerLd20, replace: "AED {{buyer_deposit_20_percent_amount}}" },
    { find: "a) 80% (AED {{buyer_deposit_80_percent_amount}}) to the Seller; and",
      insertBefore: "{{#if any_deposit}}{{#if seller_agent}}", note: "ст.7 открыть распределение" },
    // точка после «Agent» уходит внутрь условия, иначе без депозитов останется голая точка
    { find: "b) 20% (AED {{buyer_deposit_20_percent_amount}}) to the Seller’s Agent.",
      replace: "b) 20% (AED {{buyer_deposit_20_percent_amount}}) to the Seller’s Agent.{{/if}}"
        + "{{#if !seller_agent}}\na) 100% (AED {{buyer_deposit_80_percent_amount}}) to the Seller.{{/if}}{{/if}}",
      note: "ст.7 вариант без агентства Продавца" },
    { find: "against the Seller or the Seller’s Agent arising",
      replace: "against the Seller{{#if seller_agent}} or the Seller’s Agent{{/if}} arising" },

    // ═══ ст. 8 — дефолт Продавца
    { find: "Upon Seller Default", insertBefore: "{{#if !seller_deposit}}", note: "ст.8 открыть !seller_deposit" },
    { find: "AED 528,013", replace: "AED {{seller_liquidated_damages_amount}}", within: "Upon Seller Default" },
    { find: ", being an amount equal to the Security Deposit", within: "Upon Seller Default",
      replace: "{{#if any_deposit}}, being an amount equal to the Security Deposit{{/if}}", note: "ст.8 без депозитов" },
    // второй фразы «The forfeited…» у Продавца в №2 нет — добавляем её, как в №1
    { find: "This amount shall be distributed as follows:", nth: 1,
      replace: "{{#if any_deposit}}This amount shall be distributed as follows:{{/if}}{{/if}}"
        + "{{#if seller_deposit}}The forfeited Security Deposit shall be distributed as follows:{{/if}}",
      note: "ст.8 пара фраз про распределение" },
    { find: D.sellerLd80, replace: "AED {{seller_deposit_80_percent_amount}}" },
    { find: D.sellerLd20, replace: "AED {{seller_deposit_20_percent_amount}}" },
    { find: "a) 80% (AED {{seller_deposit_80_percent_amount}}) to the Buyer; and",
      insertBefore: "{{#if any_deposit}}{{#if buyer_agent}}", note: "ст.8 открыть распределение" },
    // строки a)/b) разделены мягким переносом, поэтому перед «100%» нет «\n»
    { find: "b) 20% (AED {{seller_deposit_20_percent_amount}}) to the Buyer’s Agent.",
      replace: "b) 20% (AED {{seller_deposit_20_percent_amount}}) to the Buyer’s Agent.{{/if}}"
        + "{{#if !buyer_agent}}a) 100% (AED {{seller_deposit_80_percent_amount}}) to the Buyer.{{/if}}{{/if}}",
      note: "ст.8 вариант без агентства Покупателя" },
    { find: "against the Buyer or the Buyer’s Agent arising",
      replace: "against the Buyer{{#if buyer_agent}} or the Buyer’s Agent{{/if}} arising" },
  ];
}

export function buildEdits(D) {
  return [
  // правки, которые надо сделать до общих: у документа свои разделители и ссылки
  ...(D.pre || []),

  // ═══ шапка
  { find: D.agreementDate, replace: "{{agreement_date}}" },
  { find: D.agreementDateLong, replace: "{{agreement_date_long}}", note: "дата над логотипом" },

  // Стороны: движок собирает блок целиком (buildPartyBlock) — обращение Mr./Mrs./Ms.,
  // гражданство, паспорт, EID, доли, доверенность и любое число продавцов/покупателей.
  // Поэтому здесь один плейсхолдер, а не отдельные поля.
  { find: "Mr(s). Name Surname, nationality: Russian Federation, holder of Passport number: 222222222, "
      + "holder of EID Number 784-1990-2222222-2, Ownership rights \u2013 100%, has designated Mr(s). Name Surname "
      + "(pursuant to a valid Power of Attorney), nationality: Russian Federation, holder of Passport number: 11 1111111, "
      + "holder of EID Number 784-1990-1111111-1",
    replace: "{{seller_party_block}}", note: "блок Продавца" },
  { find: "Mr(s). Name Surname, nationality: Russian Federation, holder of Passport number: 222222222, "
      + "holder of EID Number 784-1990-2222222-2, Ownership rights \u2013 100%, has designated Mr(s). Name Surname "
      + "(pursuant to a valid Power of Attorney), nationality: Russian Federation, holder of Passport number: 11 1111111, "
      + "holder of EID Number 784-1990-1111111-1",
    replace: "{{buyer_party_block}}", note: "блок Покупателя" },

  // Агентства
  { find: "PRIME BRIDGE REAL ESTATE BROKERAGE - L.L.C - S.P.C", replace: "{{seller_agent_name}}", nth: 0 },
  { find: "Mikhail Slobodchikov", replace: "{{seller_agent_representative}}", nth: 0 },
  { find: "CN-6410679", replace: "{{seller_agent_license}}", nth: 0 },
  { find: "Office 6, Ar Raha 8 St, MUSAFFAH, Abu Dhabi, 20335", replace: "{{seller_agent_address}}", nth: 0 },
  { find: "represented by the Manager", replace: "represented by the {{seller_agent_position}}", nth: 0 },
  { find: "PRIME BRIDGE REAL ESTATE BROKERAGE - L.L.C - S.P.C", replace: "{{buyer_agent_name}}", nth: 0 },
  { find: "Mikhail Slobodchikov", replace: "{{buyer_agent_representative}}", nth: 0 },
  { find: "CN-6410679", replace: "{{buyer_agent_license}}", nth: 0 },
  { find: "Office 6, Ar Raha 8 St, MUSAFFAH, Abu Dhabi, 20335", replace: "{{buyer_agent_address}}", nth: 0 },
  { find: "represented by the Manager", replace: "represented by the {{buyer_agent_position}}", nth: 0 },
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
  { find: D.location, replace: "{{property_location}}" },
  { find: D.bedrooms, replace: "{{bedrooms}}" },
  { find: D.area, replace: "{{area_m2}}" },
  { find: "Apartment", replace: "{{property_type}}" },
  { find: D.unitNumber, replace: "{{unit_number}}" },
  { find: D.projectName, replace: "{{project_name}}", within: "Project name" },
  { find: "Additional Information:", replace: "Additional Information: {{additional_information}}" },
  { cellAfter: "Number of Car Parking Spaces:", replace: "{{parking_spaces}}", note: "parking_spaces" },

  // ═══ ст. 4 — платёжная таблица
  { find: "AED 0,000,000.00", replace: "AED {{original_price}}", within: "as per the SPA issued by the" },
  { find: "AED 0,000,000.00", replace: "AED {{selling_price}}", within: "as agreed by the" },
  { find: "AED 0,000,000.00", replace: "AED {{amount_to_seller}}", within: "to be paid by the" },
  ...(D.amountToSellerText
    ? [{ find: D.amountToSellerText, replace: "{{amount_to_seller_payment_text}}", note: "способ оплаты (точка внутри значения)" }]
    : []),

  ...(D.hasThresholdRow ? thresholdRowHead() : []),

  // строка остатка застройщику уходит целиком, когда платить нечего
  { find: "Remaining balance of 70% of the Original Price",
    replace: "{{#row has_developer_balance}}Remaining balance of {{remaining_balance_percent}}% of the Original Price" },

  ...(D.hasThresholdRow ? thresholdRowTail(D) : []),
  { find: D.remainingDeveloperBalance, replace: "AED {{remaining_developer_balance}}",
    ...(D.remainingBalanceWithin ? { within: D.remainingBalanceWithin } : {}) },
  { find: D.escrowName, replace: "{{escrow_account_name}}", within: D.developerPaymentWithin },

  // подпись строки: «Transfer Fee / NOC Fee» либо просто «Transfer Fee» — решает движок
  { find: "Transfer Fee / NOC Fee:", replace: "{{transfer_fee_label}}:" },
  { find: "AED 4,000.00", replace: "AED {{transfer_fee}}" },
  { find: "ALDAR PROPERTIES PJSC", replace: "{{developer_legal_name}}" },
  ...(D.admEdits || [
    { find: "AED 00,000.00", replace: "AED {{adm_fee}}", within: "2% from the" },
    { find: D.admAdminFee, replace: "AED {{adm_admin_fee}}" },
    { find: D.admFeePayee, replace: "{{adm_fee_payee}}" },
  ]),

  { find: "Security deposit:", replace: "{{#row any_deposit}}Security deposit:" },
  // строку целиком собирает движок: при проценте — «10% of the Selling Price…»,
  // при фиксированной сумме — «Security Deposit…». Разметка по кускам это не умела.
  { find: "AED 000,000.00 / (10% of the Selling Price provided by the Buyer to the Seller)",
    replace: "{{#if buyer_deposit}}{{buyer_security_deposit_table_line}}{{/if}}", note: "строка депозита Покупателя" },
  { find: "AED 000,000.00 / (10% of the Selling Price provided by the Seller to the Buyer)",
    replace: "{{#if seller_deposit}}{{seller_security_deposit_table_line}}{{/if}}", note: "строка депозита Продавца" },

  { find: "Agency Fee:", replace: "{{#row any_agent_fee}}Agency Fee:" },
  { find: "AED 00,000.00", replace: "{{#if buyer_agent_fee}}AED {{agency_fee_buyer}}", within: "to The Buyer’s Agent" },
  { find: "to The Buyer’s Agent on the Transfer Date", replace: "to The Buyer’s Agent on the Transfer Date{{/if}}" },
  { find: "AED 00,000.00", replace: "{{#if seller_agent_fee}}AED {{agency_fee_seller}}", within: "to The Seller’s Agent" },
  { find: "to The Seller’s Agent on the Transfer Date", replace: "to The Seller’s Agent on the Transfer Date{{/if}}" },

  // ═══ ст. 5 — срок
  { find: "15 January 2026", replace: "{{reservation_deadline_long}}" },

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
  { find: "Name Surname", replace: "{{buyer_cheque_in_favour_of}}", within: "cheque No." },
  { find: "174369", replace: "{{buyer_cheque_number}}" },
  { find: "14.04.2026", replace: "{{buyer_cheque_date}}" },
  { find: "First Abu Dhabi Bank", replace: "{{buyer_cheque_bank}}" },
  { find: "Name Surname", replace: "{{buyer_cheque_drawn_by}}", within: "cheque No." },
  { find: ", on behalf of the Buyer, provided that such third party",
    replace: "{{#if buyer_cheque_third_party}}, on behalf of the Buyer, provided that such third party" },
  // без агентств одобрять гарантийное письмо некому — Агент из фразы уходит
  { find: "acceptable to the Agent and the Parties", nth: 0,
    replace: "acceptable to {{#if any_agent}}the Agent and {{/if}}the Parties",
    note: "чек от третьего лица: Агент под условием (Покупатель)" },
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
      // закрывающий маркер — в начале следующего абзаца: тогда при известных реквизитах
      // удаляется вставленный абзац целиком, а пустая строка перед «Similarly» остаётся
      + "and will be held by {{seller_deposit_holder}} until the Transfer Date in accordance with the terms of this MOU.\n{{/if}}",
    note: "абзац Продавца без реквизитов чека" },

  // Продавец, абзац с реквизитами чека
  { find: "Similarly, upon signing this agreement,", replace: "{{#if seller_cheque_details}}{{seller_deposit_intro}}" },
  { find: "AED 000,000 ", replace: "AED {{seller_deposit_amount}} ", within: "Petr Petrov" },
  { find: "Petr Petrov", replace: "{{seller_cheque_in_favour_of}}" },
  { find: "000020", replace: "{{seller_cheque_number}}" },
  { find: "00.00.2026", replace: "{{seller_cheque_date}}" },
  { find: "Emirates NBD", replace: "{{seller_cheque_bank}}" },
  { find: "Ivan Ivanov", replace: "{{seller_cheque_drawn_by}}" },
  { find: ", on behalf of the Seller, provided that such third party",
    replace: "{{#if seller_cheque_third_party}}, on behalf of the Seller, provided that such third party" },
  { find: "acceptable to the Agent and the Parties", nth: 0,
    replace: "acceptable to {{#if any_agent}}the Agent and {{/if}}the Parties",
    note: "чек от третьего лица: Агент под условием (Продавец)" },
  { find: "the funds are provided on behalf of the Seller.", replace: "the funds are provided on behalf of the Seller{{/if}}." },
  { find: "Seller’s Agent as stakeholder", replace: "{{seller_deposit_holder}}", within: "{{seller_cheque_drawn_by}}" },
  { find: "in accordance with the terms of this MOU.", replace: "in accordance with the terms of this MOU.{{/if}}{{/if}}",
    within: "{{seller_cheque_drawn_by}}" },

  { find: "Upon successful completion of the transfer", replace: "{{#if any_deposit}}Upon successful completion of the transfer" },
  // кому возвращают чеки — зависит от того, чьи депозиты есть
  // 01.09.2026, Алина: при одном депозите чек в единственном числе
  { find: "cheques shall be returned to the Buyer and to the Seller or cancelled",
    replace: "cheque{{#if both_deposits}}s{{/if}} shall be returned to {{deposit_return_parties}} or cancelled" },
  { find: "shall not be presented for payment.", replace: "shall not be presented for payment.{{/if}}" },

  ...(D.article78 === "mortgage" ? [] : [
  // ═══ ст. 7 — дефолт Покупателя
  { find: "__", replace: "{{#if !buyer_deposit}}", nth: 0 },
  { find: "AED 528,013", replace: "AED {{buyer_liquidated_damages_amount}}", within: "Upon Buyer Default" },
  { find: "This amount shall be distributed as follows:", replace: "This amount shall be distributed as follows:{{/if}}", nth: 0 },
  { find: "__", replace: "{{#if buyer_deposit}}", nth: 0 },
  { find: "The forfeited Security Deposit shall be distributed as follows:",
    replace: "The forfeited Security Deposit shall be distributed as follows:{{/if}}", nth: 0 },
  { find: D.buyerLd80, replace: "AED {{buyer_deposit_80_percent_amount}}" },
  { find: D.buyerLd20, replace: "AED {{buyer_deposit_20_percent_amount}}" },

  // ═══ ст. 8 — дефолт Продавца
  { find: "—-", replace: "{{#if !seller_deposit}}", note: "ст.8, открыть !seller_deposit" },
  { find: "AED 528,013", replace: "AED {{seller_liquidated_damages_amount}}", within: "Upon Seller Default" },
  { find: "This amount shall be distributed as follows:", replace: "This amount shall be distributed as follows:{{/if}}", nth: 1 },
  { find: "_____", replace: "{{#if seller_deposit}}" },
  { find: "The forfeited Security Deposit shall be distributed as follows:",
    replace: "The forfeited Security Deposit shall be distributed as follows:{{/if}}", nth: 1 },
  { find: D.sellerLd80, replace: "AED {{seller_deposit_80_percent_amount}}" },
  { find: D.sellerLd20, replace: "AED {{seller_deposit_20_percent_amount}}" },
  ]),

  // ═══ ст. 9 — освобождение депозита
  { find: "If Article 7 or Article 8 applies", replace: "{{#if any_deposit}}If Article 7 or Article 8 applies" },
  // ст. 13: хвост про возврат депозита уходит, когда депозитов нет (точка снаружи)
  { find: ", and the Security Deposit shall be returned to the Party that provided it.",
    replace: "{{#if any_deposit}}, and the Security Deposit shall be returned to the Party that provided it{{/if}}." },
  { find: "No unilateral instruction from either Party shall authorize its release.",
    replace: "No unilateral instruction from either Party shall authorize its release.{{/if}}" },

  // ═══ ст. 15 — уведомление о споре
  { find: "via agents\u2019 email", replace: "via {{#if any_agent}}agents\u2019 {{/if}}email" },
  { find: D.disputeCopyTail,
    replace: "{{#if any_agent}}, with a copy of such email or letter delivered to {{agencies_word}} for their reference{{/if}}" },
  // решение заказчика: без агентств абзац об освобождении агентства от ответственности уходит целиком
  { find: "The Parties hereby undertake to indemnify",
    replace: "{{#if any_agent}}The Parties hereby undertake to indemnify" },
    { find: "in relation to this MOU.", replace: "in relation to this MOU.{{/if}}", within: "hold harmless" },

  // ═══ подписи агентств
  // В №2 между блоками подписей пустые абзацы-разделители: открывающий маркер там
  // цепляется к концу предыдущего абзаца (см. extra в OFFPLAN_MORTGAGE), чтобы
  // разделитель уходил вместе с блоком, а не оставался лишней пустой строкой.
  ...(D.agencyMarkersAfterPrevious ? [] : [
    { find: "SELLER’S AGENCY", replace: "{{#if seller_agent}}SELLER’S AGENCY" },
    { find: "BUYER’S AGENCY", replace: "{{#if buyer_agent}}BUYER’S AGENCY" },
  ]),
  { find: "Company Stamp", replace: "Company Stamp{{/if}}", nth: 0 },
  { find: "Company Stamp", replace: "Company Stamp{{/if}}", nth: 1 },

  // представитель подтягивается из вкладки AGENTS, вручную вписывать не надо
  // (у Продавца два пробела перед Signature, у Покупателя четыре — этим и различаем)
  { find: "Represented by: __________  Signature", replace: "Represented by: {{seller_agent_representative}}  Signature" },
  { find: "Represented by: __________    Signature", replace: "Represented by: {{buyer_agent_representative}}    Signature" },

  // подписи: на каждого продавца и покупателя своя строка — собирает движок
  { find: "Name: {{seller_signature_name}}    Signature: ________________\u000bDate: {{seller_signature_date}}",
    replace: "{{seller_signature_block}}", note: "блок подписей Продавца" },
  { find: "Name: {{buyer_signature_name}}    Signature: ________________\u000bDate: {{buyer_signature_date}}",
    replace: "{{buyer_signature_block}}", note: "блок подписей Покупателя" },

  // ═══ номера статей: движок нумерует сам (ARTICLE_DEFS_OFFPLAN_V2),
  // поэтому при отключении статьи остальные не «поплывут».
  // Сначала перекрёстные ссылки в тексте, потом заголовки — от 17 к 1,
  // иначе «Article 1» совпал бы с началом «Article 17».
  { find: "described in Article 3 of this Agreement",
    replace: "described in Article {{article_property_details_number}} of this Agreement" },
  { find: "set out in Article 4 of this Agreement",
    replace: "set out in Article {{article_payment_table_number}} of this Agreement" },
  ...article5Refs(D.article5RefCount),
  { find: "If Article 7 or Article 8 applies",
    replace: "If Article {{article_buyer_default_number}} or Article {{article_seller_default_number}} applies" },
  ...articleHeadings(D.articles),
  // строки подписей агентов внизу — только если агентство есть
  // {{#row any_agent}} убирает обе строки подвала целиком, когда агентств нет вовсе
  { find: "Seller\u2019s Agent signature__________", replace: "{{#row any_agent}}{{#if seller_agent}}Seller\u2019s Agent signature__________{{/if}}" },
  { find: "Buyer\u2019s Agent signature__________", replace: "{{#if buyer_agent}}Buyer\u2019s Agent signature__________{{/if}}" },

  // заголовки депозитных статей: без депозитов остались бы голые «Article» без номера
  { find: "Article {{article_security_deposit_number}}", insertBefore: "{{#if any_deposit}}", note: "открыть ст.6 целиком" },
  { find: "shall not be presented for payment.{{/if}}", replace: "shall not be presented for payment.{{/if}}{{/if}}", note: "закрыть ст.6 целиком" },
  { find: "Article {{article_deposit_release_number}}", insertBefore: "{{#if any_deposit}}", note: "открыть ст.9 целиком" },
  { find: "No unilateral instruction from either Party shall authorize its release.{{/if}}",
    replace: "No unilateral instruction from either Party shall authorize its release.{{/if}}{{/if}}", note: "закрыть ст.9 целиком" },
  ...(D.article78 === "mortgage" ? [] : [
  // ═══ варианты «без агентства» — как в эталоне templates/offplan-v2-template.md
  // ст. 7: без агентства продавца всё достаётся Продавцу, строка b) исчезает
  { find: "a) 80% (AED {{buyer_deposit_80_percent_amount}}) to the Seller; and", insertBefore: "{{#if seller_agent}}" },
  { find: "b) 20% (AED {{buyer_deposit_20_percent_amount}}) to the Seller’s Agent",
    replace: "b) 20% (AED {{buyer_deposit_20_percent_amount}}) to the Seller’s Agent{{/if}}"
      + "{{#if !seller_agent}}\na) 100% (AED {{buyer_deposit_80_percent_amount}}) to the Seller{{/if}}" },
  { find: "against the Seller or the Seller’s Agent arising",
    replace: "against the Seller{{#if seller_agent}} or the Seller’s Agent{{/if}} arising" },

  // ст. 8: зеркально, без агентства покупателя
  { find: "a) 80% (AED {{seller_deposit_80_percent_amount}}) to the Buyer; and", insertBefore: "{{#if buyer_agent}}" },
  { find: "b) 20% (AED {{seller_deposit_20_percent_amount}}) to the Buyer’s agent",
    replace: "b) 20% (AED {{seller_deposit_20_percent_amount}}) to the Buyer’s agent{{/if}}"
      + "{{#if !buyer_agent}}\na) 100% (AED {{seller_deposit_80_percent_amount}}) to the Buyer{{/if}}" },
  { find: "against the Buyer or the Buyer’s Agent arising",
    replace: "against the Buyer{{#if buyer_agent}} or the Buyer’s Agent{{/if}} arising" },
  ]),

  // ст. 9: без агентства депозит держат и освобождают сами стороны
  { find: "shall be released by the Agent strictly",
    replace: "shall be released by {{#if any_agent}}the Agent{{/if}}{{#if !any_agent}}the Parties{{/if}} strictly" },
  { find: "shall remain held by the Agent until either",
    replace: "shall remain held by {{#if any_agent}}the Agent{{/if}}{{#if !any_agent}}the respective Parties{{/if}} until either" },
  { find: "The Agent shall act solely", replace: "{{#if any_agent}}The Agent shall act solely" },
  { find: "in accordance with this Article. ", replace: "in accordance with this Article. {{/if}}" },

  // определения: пункт Addendum ссылается на агентство (правило из info.md)
  { find: "Addendum - any addendum", replace: "{{#if any_agent}}Addendum - any addendum" },
  { find: "an integral part of the Agreement between the Parties and the Agency.",
    replace: "an integral part of the Agreement between the Parties and the Agency.{{/if}}" },

  // ответы заказчика: без агентств убрать агентские и Commission Agreement,
  // а в AML написать, что стороны сами предоставляют информацию
  // 01.09.2026, Алина: упоминание Agency Fee следует за наличием комиссий,
  // а не агентов — строка Agency Fee в таблице живёт по тому же флагу
  { find: "The Selling Price, the amount payable to the Seller, and the Agency Fee set out",
    replace: "The Selling Price{{#if any_agent_fee}}, the amount payable to the Seller, and the Agency Fee{{/if}}"
      + "{{#if !any_agent_fee}} and the amount payable to the Seller{{/if}} set out", note: "ст.4 итоговая строка" },
  { find: "unless otherwise agreed in writing by the Parties or in a separate Commission Agreement.",
    replace: "unless otherwise agreed in writing by the Parties{{#if any_agent_fee}} or in a separate Commission Agreement{{/if}}.",
    note: "ст.4 Commission Agreement" },
  { find: "The Buyer and Seller shall fully cooperate with their respective Agents by providing all required information",
    replace: "The Buyer and Seller shall {{#if any_agent}}fully cooperate with their respective Agents by providing{{/if}}"
      + "{{#if !any_agent}}provide{{/if}} all required information", note: "ст.14 AML" },

  ...(D.article78 === "mortgage" ? article78Mortgage(D) : [
  // Шаблон 1.2 (депозитов нет ни у кого) — главный для этого случая:
  // там нет ни фразы про Security Deposit, ни распределения 80/20.
  { find: "{{buyer_liquidated_damages_amount}} as liquidated damages, being an amount equal to the Security Deposit, "
      + "which the Parties agree is not a penalty. \nThis amount shall be distributed as follows:",
    replace: "{{buyer_liquidated_damages_amount}} as liquidated damages{{#if any_deposit}}, being an amount equal to the Security Deposit{{/if}}, "
      + "which the Parties agree is not a penalty. \n{{#if any_deposit}}This amount shall be distributed as follows:{{/if}}",
    note: "ст.7 без депозитов" },
  { find: "{{seller_liquidated_damages_amount}} as liquidated damages, being an amount equal to the Security Deposit, "
      + "which the Parties agree is not a penalty. \u000b\nThis amount shall be distributed as follows:",
    replace: "{{seller_liquidated_damages_amount}} as liquidated damages{{#if any_deposit}}, being an amount equal to the Security Deposit{{/if}}, "
      + "which the Parties agree is not a penalty. \u000b\n{{#if any_deposit}}This amount shall be distributed as follows:{{/if}}",
    note: "ст.8 без депозитов" },
  { find: "{{#if seller_agent}}a) 80% (AED {{buyer_deposit_80_percent_amount}}) to the Seller; and",
    insertBefore: "{{#if any_deposit}}", note: "ст.7 открыть распределение" },
  { find: "a) 100% (AED {{buyer_deposit_80_percent_amount}}) to the Seller{{/if}}",
    replace: "a) 100% (AED {{buyer_deposit_80_percent_amount}}) to the Seller{{/if}}{{/if}}", note: "ст.7 закрыть распределение" },
  { find: "{{#if buyer_agent}}a) 80% (AED {{seller_deposit_80_percent_amount}}) to the Buyer; and",
    insertBefore: "{{#if any_deposit}}", note: "ст.8 открыть распределение" },
  { find: "a) 100% (AED {{seller_deposit_80_percent_amount}}) to the Buyer{{/if}}",
    replace: "a) 100% (AED {{seller_deposit_80_percent_amount}}) to the Buyer{{/if}}{{/if}}", note: "ст.8 закрыть распределение" },
  ]),

  { find: "disbursement of the deposit and balance.",
    replace: "disbursement of the {{#if any_deposit}}deposit and {{/if}}balance.", note: "расходы без депозита" },
    ...(D.extra || []),
  ];
}
