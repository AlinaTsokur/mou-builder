// Возврат жирного после разметки. Применяется отдельно от разметки и сколько
// угодно раз: выставить bold — операция идемпотентная, в отличие от вставки маркеров.
// Запуск: node scripts/fix-bold.mjs <documentId>
// Проверка: node scripts/check-style.mjs <documentId> <эталон до разметки>

// Замена текста в Google Docs берёт начертание первого символа диапазона.
// Там, где правка накрыла несколько кусков с разным начертанием, жирный слетел —
// на экране это заметно только при сравнении с исходным шаблоном.
// Проверка: node scripts/check-style.mjs <шаблон> <эталон до разметки>
export const BOLD_REPAIR = [
  { find: "The Buyer’s Agent", bold: true, within: "{{agency_fee_buyer}}", note: "жирный: агентские Покупателя" },
  { find: "Transfer Date", bold: true, within: "{{agency_fee_buyer}}", note: "жирный: Transfer Date" },
  { find: "The Seller’s Agent", bold: true, within: "{{agency_fee_seller}}", note: "жирный: агентские Продавца" },
  { find: "Transfer Date", bold: true, within: "{{agency_fee_seller}}", note: "жирный: Transfer Date" },

  { find: "Security Deposit", bold: true, withinNth: 0,
    within: "The forfeited Security Deposit shall be distributed", note: "жирный: ст.7 распределение" },
  { find: "Security Deposit", bold: true, withinNth: 1,
    within: "The forfeited Security Deposit shall be distributed", note: "жирный: ст.8 распределение" },

  { find: "20%", bold: true, within: "{{buyer_deposit_20_percent_amount}}", note: "жирный: ст.7 b) 20%" },
  { find: "AED {{buyer_deposit_20_percent_amount}}", bold: true,
    within: "{{buyer_deposit_20_percent_amount}}", note: "жирный: ст.7 b) сумма" },
  { find: "Seller’s Agent", bold: true, within: "{{buyer_deposit_20_percent_amount}}", note: "жирный: ст.7 b) агент" },
  { find: "20%", bold: true, within: "{{seller_deposit_20_percent_amount}}", note: "жирный: ст.8 b) 20%" },
  { find: "AED {{seller_deposit_20_percent_amount}}", bold: true,
    within: "{{seller_deposit_20_percent_amount}}", note: "жирный: ст.8 b) сумма" },
  { find: "Buyer’s agent", bold: true, within: "{{seller_deposit_20_percent_amount}}", note: "жирный: ст.8 b) агент" },

  { find: "Article {{article_buyer_default_number}}", bold: true,
    within: "shall be released by", note: "жирный: ст.9 ссылка на ст.7" },
  { find: "Article {{article_seller_default_number}}", bold: true,
    within: "shall be released by", note: "жирный: ст.9 ссылка на ст.8" },

  // строки «100% …», которых в исходном шаблоне не было — выравниваем под a) 80%
  { find: "100%", bold: true, within: "a) 100% (AED {{buyer_deposit_80_percent_amount}})", note: "жирный: ст.7 100%" },
  { find: "AED {{buyer_deposit_80_percent_amount}}", bold: true,
    within: "a) 100% (AED {{buyer_deposit_80_percent_amount}})", note: "жирный: ст.7 100% сумма" },
  { find: "100%", bold: true, within: "a) 100% (AED {{seller_deposit_80_percent_amount}})", note: "жирный: ст.8 100%" },
  { find: "AED {{seller_deposit_80_percent_amount}}", bold: true,
    within: "a) 100% (AED {{seller_deposit_80_percent_amount}})", note: "жирный: ст.8 100% сумма" },
];
