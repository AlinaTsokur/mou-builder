// Значения демо-сделки в каждом шаблоне: по ним ищем текст, который надо заменить
// на плейсхолдер. У разных документов они разные, сама разметка — одна.

export const ARTICLES_OFFPLAN = [
  [1, "article_sale_offer_number"],
  [2, "article_effective_date_number"],
  [3, "article_property_details_number"],
  [4, "article_payment_table_number"],
  [5, "article_reservation_period_number"],
  [6, "article_security_deposit_number"],
  [7, "article_buyer_default_number"],
  [8, "article_seller_default_number"],
  [9, "article_deposit_release_number"],
  [10, "article_buyer_own_funds_number"],
  [11, "article_seller_outstanding_charges_number"],
  [12, "article_property_hold_number"],
  [13, "article_developer_approval_number"],
  [14, "article_aml_number"],
  [15, "article_amicable_dispute_number"],
  [16, "article_entire_agreement_number"],
  [17, "article_electronic_signature_number"],
];

export const OFFPLAN = {
  agreementDate: "28/01/2026",
  agreementDateLong: "January 25, 2026",
  location: "Saadiyat Island, Abu Dhabi, UAE",
  bedrooms: "3BHK + M",
  area: "153.50",
  unitNumber: "The Source-R18-212",
  projectName: "The Source",
  escrowName: "THE SOURCE – ESCROW ACCOUNT",
  remainingDeveloperBalance: "AED 2,672,972.51",
  admAdminFee: "AED 575",
  admFeePayee: "Aldar Development LLC - OPC",
  amountToSellerText: "Manager's Cheque or Cash.",
  buyerLd80: "AED 263,000",
  buyerLd20: "AED 65,000",
  sellerLd80: "AED 263,600",
  sellerLd20: "AED 65,900",
  disputeCopyTail: ", with a copy of such email or letter delivered to Agencies for their reference",
  hasThresholdRow: true,
  developerPaymentWithin: "in accordance with the Payment Plan",
  article5RefCount: 2,
  articles: ARTICLES_OFFPLAN,
};

// ═══ Шаблон №2 — off-plan с ипотекой Покупателя (18 статей)
export const ARTICLES_OFFPLAN_MORTGAGE = [
  [1, "article_sale_offer_number"],
  [2, "article_effective_date_number"],
  [3, "article_property_details_number"],
  [4, "article_payment_table_number"],
  [5, "article_reservation_period_number"],
  [6, "article_security_deposit_number"],
  [7, "article_buyer_default_number"],
  [8, "article_seller_default_number"],
  [9, "article_deposit_release_number"],
  [10, "article_mortgage_approval_number"],
  [11, "article_bank_valuation_number"],
  [12, "article_seller_outstanding_charges_number"],
  [13, "article_property_hold_number"],
  [14, "article_developer_approval_number"],
  [15, "article_aml_number"],
  [16, "article_amicable_dispute_number"],
  [17, "article_entire_agreement_number"],
  [18, "article_electronic_signature_number"],
];

// Строка добора порога: в №2 её нет, а по ответу Миши (04.09.2026) она нужна,
// как в №1. Вставляется отдельной строкой таблицы уже с разметкой — после
// строки «Amount to be paid to the Seller». Начертание — как у соседней строки №1.
export const THRESHOLD_ROW = {
  afterCell: "Amount to be paid to the Seller:",
  cells: [
    [["{{#row has_top_up}}Remaining balance to complete {{transfer_threshold_percent}}% threshold, "
      + "repay outstanding payments to the Developer to obtain the transfer date from the Developer:", true]],
    [["AED {{threshold_top_up_amount}} / ", true], ["to be paid by the ", false], ["Buyer", true],
      [" to ", false], ["{{escrow_account_name}}", false], [" on the ", false], ["Transfer Date", true],
      [" by a ", false], ["Manager’s Cheque", true]],
  ],
};

const MORTGAGE_ARTICLE_REFS = "described in Articles {{article_mortgage_approval_number}} and {{article_bank_valuation_number}}";

export const OFFPLAN_MORTGAGE = {
  agreementDate: "00/00/2026",
  agreementDateLong: "May 00, 2026",
  location: "Yas Island, Abu Dhabi, UAE",
  bedrooms: "2BHK + M",
  area: "167,47",
  unitNumber: "YasGolfCollection-F-07-02",
  projectName: "YasGolfCollection",
  escrowName: "YAS GOLF COLLECTION",
  // в №2 у остатка застройщику тот же текст-заглушка, что у цен, — ищем в своей строке
  remainingDeveloperBalance: "AED 0,000,000.00",
  remainingBalanceWithin: "YAS GOLF COLLECTION",
  // «только чек» (Миша, 04.09.2026): текст способа оплаты не трогаем
  amountToSellerText: null,
  buyerLd80: "AED 422,410.40",
  buyerLd20: "AED 105,602.60",
  sellerLd80: "AED 422,410.40",
  sellerLd20: "AED 105,602.60",
  // копия уведомления о споре — как в №1: «delivered to Agencies», иначе с одним
  // агентством фраза про «Seller’s agent and Buyer’s agent» неверна
  disputeCopyTail: ", with a copy of such email or letter delivered to Seller’s agent and Buyer’s agent for their reference",
  hasThresholdRow: false,
  developerPaymentWithin: "YAS GOLF COLLECTION on the Transfer Date",
  article5RefCount: 2,
  articles: ARTICLES_OFFPLAN_MORTGAGE,
  article78: "mortgage",
  agencyMarkersAfterPrevious: true,
  // ADM-сборы: три строки, суммы из формы (ответ Миши, 04.09.2026)
  admEdits: [
    { find: "AED 106,521.70", replace: "AED {{adm_fee}}", note: "ADM Fee" },
    { find: "ALDAR DEVELOPMENT L.L.C – O.P.C", replace: "{{adm_fee_payee}}", within: "whatever comes higher", note: "получатель ADM Fee" },
    { find: "AED 1,392.00", replace: "AED {{adm_electronic_fee}}", note: "ADM Electronic Fee" },
    { find: "AED 925.75", replace: "AED {{adm_valuation_fee}}", note: "ADM Valuation Certificate" },
  ],
  pre: [
    // разделитель между двумя вариантами абзаца Покупателя в ст.6 — в №1 его нет
    { find: "_____", replace: "", note: "ст.6: убрать разделитель «_____»" },
    // ссылки на ипотечные статьи: при выключенных депозитах нумерация сдвигается
    { find: "described in Articles 10 and 11", replace: MORTGAGE_ARTICLE_REFS, nth: 0, note: "ст.7 ссылка на ст.10–11" },
    { find: "described in Articles 10 and 11", replace: MORTGAGE_ARTICLE_REFS, nth: 0, note: "ст.8 ссылка на ст.10–11" },
    { find: "specified in Article 5 of this MOU",
      replace: "specified in Article {{article_reservation_period_number}} of this MOU", note: "ст.10 ссылка на ст.5" },
    // заголовок ст.10 приклеен к тексту мягким переносом — делаем его отдельным абзацем,
    // как все остальные заголовки
    { find: "Article 10\u000b", replace: "Article 10\n", note: "ст.10: заголовок отдельным абзацем" },
    // в ст.8 строки a)/b) приклеены к «follows:» мягким переносом: без депозитов
    // от абзаца оставался бы один пустой перенос — делаем a)/b) отдельным абзацем
    { find: "This amount shall be distributed as follows:\u000ba) ",
      replace: "This amount shall be distributed as follows:\na) ", note: "ст.8: a)/b) отдельным абзацем" },
    // типографика исходника: двойные пробелы и точка в конце хвоста ст.4
    { find: "to  YAS GOLF COLLECTION", replace: "to YAS GOLF COLLECTION", note: "двойной пробел, остаток застройщику" },
    { find: "O.P.C  after valuation", replace: "O.P.C after valuation", note: "двойной пробел, ADM Fee" },
    { find: "REVENUE ACCOU  after valuation", replace: "REVENUE ACCOU after valuation", note: "двойной пробел, ADM Electronic Fee" },
    { find: "simultaneously with the ownership transfer at ADREC",
      replace: "simultaneously with the ownership transfer at ADREC.", note: "точка в конце ст.4" },
    // Миша, 04.09.2026: важен факт пре-одобрения, сумма не обязана равняться Selling Price
    { find: "obtained Mortgage Pre-Approval for an amount equal to the agreed Selling Price and that",
      replace: "obtained Mortgage Pre-Approval and that", note: "ст.10: сумма пре-одобрения" },
  ],
  extra: [
    // возврат депозита при отказе банка — только если депозит Покупателя есть
    { find: "In the event that the Buyer is unable to obtain Final Mortgage Approval",
      insertBefore: "{{#if buyer_deposit}}", note: "ст.6 ипотека: открыть buyer_deposit" },
    { find: "subject to submission of official bank rejection letter.",
      replace: "subject to submission of official bank rejection letter.{{/if}}", note: "ст.6 ипотека: закрыть buyer_deposit" },
    // ст.10–11: возврат депозита упоминается, только когда депозит Покупателя есть
    // (то же правило, что для ст.13 в №1)
    { find: ", and the Security Deposit shall be refunded to the Buyer in full.",
      replace: "{{#if buyer_deposit}}, and the Security Deposit shall be refunded to the Buyer in full{{/if}}.", note: "ст.10 депозит под условием" },
    { find: "the Buyer may terminate this MOU and the Security Deposit shall be refunded in full.",
      replace: "the Buyer may terminate this MOU{{#if buyer_deposit}} and the Security Deposit shall be refunded in full{{/if}}.", note: "ст.11 депозит под условием" },
    // открывающие маркеры блоков агентств — в конец предыдущего абзаца
    { find: "{{buyer_signature_block}}", replace: "{{buyer_signature_block}}{{#if seller_agent}}", note: "подписи: открыть seller_agent" },
    { find: "Company Stamp{{/if}}", nth: 0, replace: "Company Stamp{{/if}}{{#if buyer_agent}}", note: "подписи: открыть buyer_agent" },
  ],
};
