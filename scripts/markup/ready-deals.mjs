// Значения демо-сделки шаблона №3 (Ready, cash to cash) для разметки.
// Правки собираются тем же buildEdits, что и off-plan: документы почти совпадают,
// отличается платёжная таблица и статья про состояние объекта.

export const ARTICLES_READY_CASH = [
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
  [12, "article_vacant_on_transfer_number"],
  [13, "article_property_hold_number"],
  [14, "article_developer_approval_number"],
  [15, "article_aml_number"],
  [16, "article_amicable_dispute_number"],
  [17, "article_entire_agreement_number"],
  [18, "article_electronic_signature_number"],
];

const VACANT = "The Seller confirms that the Property shall be vacant on the Transfer Date";
const RENTED = "The Seller confirms that the Property is currently leased at a rent of";

export const READY_CASH = {
  agreementDate: "14/04/2026",
  agreementDateLong: "April 14, 2026",
  location: "Saadiyat Island, Abu Dhabi, UAE",
  bedrooms: "2BHK+Maid",
  area: "140.55",
  unitNumber: "201",
  projectName: "the Source",
  typeOfAreaValue: "Residential - Household Living",
  titleDeedValue: "2026/0000",
  parkingLabel: "Car Parking Spaces:",
  hasAdditionalInformation: false,
  // в готовом объекте есть номер проекта, вводится руками (Алина, 06.09.2026)
  propertyExtra: [
    { find: "2023/278930", replace: "{{project_number}}", note: "номер проекта" },
  ],

  // платёжная таблица: застройщику платить нечего, цены по SPA нет
  priceValue: "AED 5,280,135.00",
  hasOriginalPrice: false,
  hasDeveloperBalanceRow: false,
  hasThresholdRow: false,
  amountToSellerWithin: "to be paid by the Buyer to the Seller",
  amountToSellerText: "Manager’s Cheque",
  // вместо Transfer Fee — два NOC-сбора и три строки ADM
  feeEdits: [
    { find: "AED 2,750.00", replace: "AED {{developer_noc_fee}}", note: "Developer NOC Fee" },
    { find: "ALDAR DEVELOPMENT L.L.C – O.P.C", replace: "{{developer_name}}", within: "{{developer_noc_fee}}",
      note: "получатель Developer NOC Fee" },
    { find: "AED 1,050.00", replace: "AED {{community_noc_fee}}", note: "Community NOC Fee" },
    { find: "ALDAR PROPERTIES PJSC", replace: "{{developer_legal_name}}", within: "{{community_noc_fee}}",
      note: "получатель Community NOC Fee" },
    { find: "AED 106,521.70", replace: "AED {{adm_fee}}", note: "ADM Fee" },
    { find: "AED 919.00", replace: "AED {{adm_electronic_fee}}", note: "ADM Electronic Fee" },
    { find: "AED 1,037.00", replace: "AED {{adm_valuation_fee}}", note: "ADM Valuation Certificate" },
  ],
  // ADM-строки уже в feeEdits, отдельного блока не нужно
  admEdits: [],
  // определение NOC fee в этом шаблоне своё и живёт всегда: NOC-сборы есть в каждой сделке
  hasNocDefinition: false,
  // в определениях застройщик другой; в таблице он же станет {{developer_name}}
  developerDefinitionName: "NATION WIDE HOLDING - L.L.C",
  // в ст.7 между абзацами пустая строка и нет пробела после точки — свой вариант правки
  noDepositLdEdits: [
    { find: "{{buyer_liquidated_damages_amount}} as liquidated damages, being an amount equal to the Security Deposit, "
        + "which the Parties agree is not a penalty.\n\nThis amount shall be distributed as follows:",
      replace: "{{buyer_liquidated_damages_amount}} as liquidated damages{{#if any_deposit}}, being an amount equal to the Security Deposit{{/if}}, "
        + "which the Parties agree is not a penalty.\n{{#if any_deposit}}\nThis amount shall be distributed as follows:{{/if}}",
      note: "ст.7 без депозитов" },
    { find: "{{seller_liquidated_damages_amount}} as liquidated damages, being an amount equal to the Security Deposit, "
        + "which the Parties agree is not a penalty.\nThis amount shall be distributed as follows:",
      replace: "{{seller_liquidated_damages_amount}} as liquidated damages{{#if any_deposit}}, being an amount equal to the Security Deposit{{/if}}, "
        + "which the Parties agree is not a penalty.\n{{#if any_deposit}}This amount shall be distributed as follows:{{/if}}",
      note: "ст.8 без депозитов" },
  ],

  buyerLd80: "AED 263,000",
  buyerLd20: "AED 65,000",
  sellerLd80: "AED 263,600",
  sellerLd20: "AED 65,900",
  disputeCopyTail: ", with a copy of such email or letter delivered to Seller’s agent and Buyer’s agent for their reference",
  article5RefCount: 2,
  articles: ARTICLES_READY_CASH,
  agencyMarkersAfterPrevious: false,

  pre: [
    // дата в шапке прижата табами: плейсхолдер длиннее и переносился бы на вторую строку
    { find: "\t\t\t\t\t\t\t\t    \t", replace: "", note: "шапка: убрать табы перед датой" },
    // разделитель между двумя вариантами абзаца Покупателя в ст.6 — как «_____» в №2
    { find: "___", replace: "", nth: 0, note: "ст.6: убрать разделитель «___»" },
    // скобка в строке ADM Fee не закрывалась — приводим к виду №1
    { find: "or as per ADM valuation (whatever comes higher) to be paid",
      replace: "or as per ADM valuation, whatever comes higher) to be paid", note: "ст.4: скобка в ADM Fee" },
    // ст.8: разделитель «—-» и хвост абзаца оставляли по мягкому переносу,
    // из-за них в договоре появлялись пустые строки вокруг фразы о дефолте Продавца
    { find: "—-\u000bUpon Seller Default", replace: "—-Upon Seller Default", note: "ст.8: перенос после разделителя" },
    { find: "not a penalty. \u000b\nThis amount shall be distributed",
      replace: "not a penalty.\nThis amount shall be distributed", note: "ст.8: перенос в конце абзаца" },
    // двойные пробелы исходника
    { find: "REVENUE ACCOU  on the Transfer Date by a Manager", replace: "REVENUE ACCOU on the Transfer Date by a Manager",
      note: "двойной пробел, ADM Fee" },
    { find: "REVENUE ACCOU  on the Transfer Date by Manager", replace: "REVENUE ACCOU on the Transfer Date by Manager",
      note: "двойной пробел, ADM Electronic Fee" },
  ],

  extra: [
    // ст.12: в документе оба варианта подряд — свободен и сдан в аренду.
    // Показываем ровно один, второй абзац удаляется целиком.
    { find: VACANT, insertBefore: "{{#if !property_rented}}", note: "ст.12: открыть вариант «свободен»" },
    { find: "furnishings existing at the time of viewing, unless otherwise agreed in writing.", nth: 0,
      replace: "furnishings existing at the time of viewing, unless otherwise agreed in writing.{{/if}}",
      note: "ст.12: закрыть вариант «свободен»" },
    { find: RENTED, insertBefore: "{{#if property_rented}}", note: "ст.12: открыть вариант «сдан»" },
    { find: "AED 150,000.00", replace: "AED {{annual_rent}}", note: "годовая аренда" },
    { find: "(One hundred… dirhams)", replace: "({{annual_rent_words}})", note: "аренда прописью" },
    { find: "12 December 2027", replace: "{{tenancy_end_date}}", note: "срок договора аренды" },
    { find: "the Seller shall transfer an equivalent amount to the Buyer on the Transfer Date.",
      replace: "the Seller shall transfer an equivalent amount to the Buyer on the Transfer Date.{{/if}}",
      note: "ст.12: закрыть вариант «сдан»" },
  ],
};
