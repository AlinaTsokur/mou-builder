import { DEFAULT_AGENT } from "./config.js";
import {
  bool,
  boolDefault,
  formatPropertyLocation,
  money,
  moneyNoDecimals,
  n,
  percent,
  s,
  sanitizeFileName,
} from "./helpers.js";
import { articleSummary, buildArticleNumbers, getArticleDefs, DEFAULT_RULES } from "./articles.js";
import {
  SELLER_OUTSTANDING_NOC_PHRASE,
  DEPOSIT_RETURN_BOTH,
  DEPOSIT_RETURN_BUYER_ONLY,
  DEPOSIT_RETURN_SELLER_ONLY,
} from "./texts.js";

export function createEmptyParty() {
  return {
    salutation: "",
    name: "",
    nationality: "",
    passport: "",
    eid: "",
    ownershipPercent: "100",
    hasPoa: false,
    poaName: "",
    poaNationality: "",
    poaPassport: "",
    poaEid: "",
  };
}

export function normalizePartyList(list) {
  const source = Array.isArray(list) ? list : [];
  const normalized = source
    .map((item) => ({
      salutation: s(item.salutation),
      name: s(item.name),
      nationality: s(item.nationality),
      passport: s(item.passport),
      eid: s(item.eid),
      ownershipPercent: s(item.ownershipPercent),
      hasPoa: bool(item.hasPoa),
      poaName: s(item.poaName),
      poaNationality: s(item.poaNationality),
      poaPassport: s(item.poaPassport),
      poaEid: s(item.poaEid),
    }))
    .filter((item) => item.name || item.passport || item.eid);

  return normalized.length ? normalized : [createEmptyParty()];
}

export function normalizeForm(form = {}) {
  const buyerDepositEnabled = bool(form.buyerDepositEnabled);
  const sellerDepositEnabled = bool(form.sellerDepositEnabled);
  const includeArticle6 = buyerDepositEnabled || sellerDepositEnabled
    ? boolDefault(form.includeArticle6, true)
    : false;
  const unitStatus = s(form.unitStatus);
  const transferFeeLabelRaw = s(form.transferFeeLabel);
  const transferFeeLabel = unitStatus.toLowerCase() === "ready"
    ? "NOC Fee"
    : transferFeeLabelRaw;

  return {
    agreementDate: s(form.agreementDate),
    reservationDeadline: s(form.reservationDeadline),
    projectName: s(form.projectName),
    unitStatus,
    developerName: s(form.developerName),
    developerLegalName: s(form.developerLegalName),
    escrowAccountName: s(form.escrowAccountName),
    admAdminFee: n(form.admAdminFee),
    transferFeeLabel,
    titleDeedNumber: s(form.titleDeedNumber),
    propertyLocation: s(form.propertyLocation),
    bedrooms: s(form.bedrooms),
    areaM2: s(form.areaM2),
    propertyType: s(form.propertyType),
    unitNumber: s(form.unitNumber),
    additionalInformation: s(form.additionalInformation),
    parkingSpaces: s(form.parkingSpaces),
    sellers: normalizePartyList(form.sellers),
    buyers: normalizePartyList(form.buyers),
    originalPrice: n(form.originalPrice),
    sellingPrice: n(form.sellingPrice),
    paidAmountToDeveloper: n(form.paidAmountToDeveloper),
    amountToSeller: n(form.amountToSeller),
    amountToSellerPaymentMethod: s(form.amountToSellerPaymentMethod),
    amountToSellerChequeInFavourOf: s(form.amountToSellerChequeInFavourOf),
    transferThresholdPercent: n(form.transferThresholdPercent),
    thresholdTopUpAmount: n(form.thresholdTopUpAmount),
    remainingDeveloperBalance: n(form.remainingDeveloperBalance),
    transferFee: n(form.transferFee),
    agencyFeeSeller: n(form.agencyFeeSeller),
    agencyFeeBuyer: n(form.agencyFeeBuyer),
    sellerAgentEnabled: boolDefault(form.sellerAgentEnabled, true),
    buyerAgentEnabled: boolDefault(form.buyerAgentEnabled, true),
    sellerAgentName: s(form.sellerAgentName) || DEFAULT_AGENT,
    buyerAgentName: s(form.buyerAgentName) || DEFAULT_AGENT,
    buyerDepositEnabled,
    buyerDepositCalcType: s(form.buyerDepositCalcType),
    buyerDepositPercent: n(form.buyerDepositPercent),
    buyerDepositFixedAmount: n(form.buyerDepositFixedAmount),
    buyerDefaultPenaltyAmount: n(form.buyerDefaultPenaltyAmount),
    buyerChequeNumber: s(form.buyerChequeNumber),
    buyerChequeDate: s(form.buyerChequeDate),
    buyerChequeBank: s(form.buyerChequeBank),
    buyerChequeDrawnBy: s(form.buyerChequeDrawnBy),
    buyerChequeInFavourOf: s(form.buyerChequeInFavourOf),
    buyerChequeTiming: s(form.buyerChequeTiming),
    buyerChequeDays: s(form.buyerChequeDays),
    sellerDepositEnabled,
    sellerDepositCalcType: s(form.sellerDepositCalcType),
    sellerDepositPercent: n(form.sellerDepositPercent),
    sellerDepositFixedAmount: n(form.sellerDepositFixedAmount),
    sellerDefaultPenaltyAmount: n(form.sellerDefaultPenaltyAmount),
    sellerChequeNumber: s(form.sellerChequeNumber),
    sellerChequeDate: s(form.sellerChequeDate),
    sellerChequeBank: s(form.sellerChequeBank),
    sellerChequeDrawnBy: s(form.sellerChequeDrawnBy),
    sellerChequeInFavourOf: s(form.sellerChequeInFavourOf),
    sellerChequeTiming: s(form.sellerChequeTiming),
    sellerChequeDays: s(form.sellerChequeDays),
    sellerSignatureDate: s(form.sellerSignatureDate),
    buyerSignatureDate: s(form.buyerSignatureDate),
    includeArticle6,
    includeArticle7: boolDefault(form.includeArticle7, true),
    includeArticle8: boolDefault(form.includeArticle8, true),
    includeArticle9: includeArticle6 ? boolDefault(form.includeArticle9, true) : false,
    includeArticle18: boolDefault(form.includeArticle18, true),
    excludedArticleKeys: normalizeExcludedArticles(form.excludedArticleKeys),
  };
}

function normalizeExcludedArticles(value) {
  const arr = Array.isArray(value) ? value : [];
  return Array.from(new Set(arr.map((item) => s(item)).filter(Boolean)));
}

export function calculate(data) {
  const isReady = String(data.unitStatus || "").toLowerCase() === "ready";
  const admAdminFee = data.admAdminFee !== "" ? data.admAdminFee : "";
  const admFeeBase =
    data.sellingPrice !== "" && data.originalPrice !== ""
      ? Math.max(data.sellingPrice, data.originalPrice)
      : data.sellingPrice !== ""
        ? data.sellingPrice
        : data.originalPrice;

  const admFee = admFeeBase !== "" && admAdminFee !== "" ? admFeeBase * 0.02 + admAdminFee : "";

  const requiredThresholdAmount = isReady ? "" :
    data.originalPrice !== "" && data.transferThresholdPercent !== ""
      ? (data.originalPrice * data.transferThresholdPercent) / 100
      : "";
  const thresholdTopUpAmount = isReady ? "" :
    data.thresholdTopUpAmount !== ""
      ? data.thresholdTopUpAmount
      : requiredThresholdAmount !== "" && data.paidAmountToDeveloper !== ""
        ? Math.max(requiredThresholdAmount - data.paidAmountToDeveloper, 0)
        : "";
  const remainingDeveloperBalance = isReady ? "" :
    data.remainingDeveloperBalance !== ""
      ? data.remainingDeveloperBalance
      : data.originalPrice !== "" && data.paidAmountToDeveloper !== "" && thresholdTopUpAmount !== ""
        ? Math.max(data.originalPrice - data.paidAmountToDeveloper - thresholdTopUpAmount, 0)
        : "";

  const remainingBalancePercent = isReady ? "" :
    remainingDeveloperBalance !== "" && data.originalPrice !== "" && data.originalPrice > 0
      ? (remainingDeveloperBalance / data.originalPrice) * 100
      : data.transferThresholdPercent !== ""
        ? 100 - data.transferThresholdPercent
        : "";
  const amountToSeller = isReady
    ? (data.sellingPrice !== "" ? data.sellingPrice : data.amountToSeller)
    : data.sellingPrice !== "" && thresholdTopUpAmount !== "" && remainingDeveloperBalance !== ""
      ? data.sellingPrice - thresholdTopUpAmount - remainingDeveloperBalance
      : data.amountToSeller;

  const agencyFeeSeller =
    data.agencyFeeSeller !== "" ? data.agencyFeeSeller : data.sellingPrice !== "" ? data.sellingPrice * 0.021 : "";
  const agencyFeeBuyer =
    data.agencyFeeBuyer !== "" ? data.agencyFeeBuyer : data.sellingPrice !== "" ? data.sellingPrice * 0.021 : "";
  const buyerDepositAmount = calcDeposit(
    data.buyerDepositEnabled,
    data.buyerDepositCalcType,
    data.buyerDepositPercent,
    data.buyerDepositFixedAmount,
    data.sellingPrice,
  );
  const sellerDepositAmount = calcDeposit(
    data.sellerDepositEnabled,
    data.sellerDepositCalcType,
    data.sellerDepositPercent,
    data.sellerDepositFixedAmount,
    data.sellingPrice,
  );

  const buyerDefaultPenaltyAmount = data.buyerDefaultPenaltyAmount !== "" 
    ? data.buyerDefaultPenaltyAmount 
    : data.sellingPrice !== "" ? data.sellingPrice * 0.1 : "";
  const sellerDefaultPenaltyAmount = data.sellerDefaultPenaltyAmount !== "" 
    ? data.sellerDefaultPenaltyAmount 
    : data.sellingPrice !== "" ? data.sellingPrice * 0.1 : "";

  const buyerPenalty80 = buyerDefaultPenaltyAmount !== "" ? buyerDefaultPenaltyAmount * 0.8 : "";
  const buyerPenalty20 = buyerDefaultPenaltyAmount !== "" ? buyerDefaultPenaltyAmount * 0.2 : "";
  const sellerPenalty80 = sellerDefaultPenaltyAmount !== "" ? sellerDefaultPenaltyAmount * 0.8 : "";
  const sellerPenalty20 = sellerDefaultPenaltyAmount !== "" ? sellerDefaultPenaltyAmount * 0.2 : "";

  return {
    admAdminFee,
    admFeeBase,
    admFee,
    remainingBalancePercent,
    agencyFeeSeller,
    agencyFeeBuyer,
    requiredThresholdAmount,
    thresholdTopUpAmount,
    remainingDeveloperBalance,
    amountToSeller,
    buyerDepositAmount,
    buyerDeposit80: data.sellerAgentEnabled
      ? (buyerDepositAmount !== "" ? buyerDepositAmount * 0.8 : buyerPenalty80)
      : (buyerDepositAmount !== "" ? buyerDepositAmount : buyerDefaultPenaltyAmount),
    buyerDeposit20: data.sellerAgentEnabled
      ? (buyerDepositAmount !== "" ? buyerDepositAmount * 0.2 : buyerPenalty20)
      : "",
    sellerDepositAmount,
    sellerDeposit80: data.buyerAgentEnabled
      ? (sellerDepositAmount !== "" ? sellerDepositAmount * 0.8 : sellerPenalty80)
      : (sellerDepositAmount !== "" ? sellerDepositAmount : sellerDefaultPenaltyAmount),
    sellerDeposit20: data.buyerAgentEnabled
      ? (sellerDepositAmount !== "" ? sellerDepositAmount * 0.2 : sellerPenalty20)
      : "",
    buyerDefaultPenaltyAmount,
    sellerDefaultPenaltyAmount,
    sellingPriceFormatted: money(data.sellingPrice),
  };
}

export function calcDeposit(enabled, calcType, depositPercent, fixedAmount, sellingPrice) {
  if (!enabled) return "";
  const type = String(calcType || "").toLowerCase();
  if (type.includes("fixed")) return fixedAmount !== "" ? fixedAmount : "";
  if (depositPercent !== "" && sellingPrice !== "") return (sellingPrice * depositPercent) / 100;
  return "";
}

export function buildReplacements(data, calc, articleNumbers) {
  const r = { ...articleNumbers };

  r.agreement_date = data.agreementDate;
  r.agreement_date_long = formatLongDate(data.agreementDate);
  r.seller_party_block = buildPartyBlock(data.sellers);
  r.buyer_party_block = buildPartyBlock(data.buyers);
  r.seller_name = getMainPartyName(data.sellers);
  r.buyer_name = getMainPartyName(data.buyers);
  r.developer_name = data.developerName;
  r.developer_legal_name = data.developerLegalName;
  r.escrow_account_name = data.escrowAccountName;
  r.seller_agent_name = data.sellerAgentName;
  r.buyer_agent_name = data.buyerAgentName;
  r.type_of_area = getTypeOfArea(data.projectName);
  r.title_deed_number = data.titleDeedNumber;
  r.property_location = formatPropertyLocation(data.propertyLocation);
  r.bedrooms = data.bedrooms;
  r.area_m2 = data.areaM2;
  r.property_type = data.propertyType;
  r.project_name = data.projectName;
  r.unit_status = data.unitStatus;
  r.unit_number = data.unitNumber;
  r.additional_information = data.additionalInformation;
  r.parking_spaces = data.parkingSpaces;
  r.original_price = money(data.originalPrice);
  r.selling_price = money(data.sellingPrice);
  r.amount_to_seller = money(calc.amountToSeller);
  r.threshold_top_up_amount = money(calc.thresholdTopUpAmount);
  r.remaining_developer_balance = money(calc.remainingDeveloperBalance);
  r.transfer_threshold_percent = percent(data.transferThresholdPercent);
  r.remaining_balance_percent = percent(calc.remainingBalancePercent);
  r.required_threshold_amount = money(calc.requiredThresholdAmount);
  r.paid_amount_to_developer = money(data.paidAmountToDeveloper);
  r.transfer_fee_label = data.transferFeeLabel || "Transfer Fee";
  r.transfer_fee = money(data.transferFee);
  r.seller_outstanding_noc_phrase = shouldUseNoc(data) ? SELLER_OUTSTANDING_NOC_PHRASE : "";
  r.adm_fee = money(calc.admFee);
  r.adm_fee_base = money(calc.admFeeBase);
  r.adm_fee_base_label = calc.admFeeBase === data.originalPrice && data.originalPrice !== data.sellingPrice
    ? "Original Price"
    : "Selling Price";
  r.adm_admin_fee = moneyNoDecimals(calc.admAdminFee);
  r.adm_fee_payee = data.developerName || "Abu Dhabi Municipality";
  r.agency_fee_seller = money(calc.agencyFeeSeller);
  r.agency_fee_buyer = money(calc.agencyFeeBuyer);
  r.buyer_security_deposit_table_line = buildDepositTableLine("Buyer", data, calc);
  r.seller_security_deposit_table_line = buildDepositTableLine("Seller", data, calc);
  r.buyer_security_deposit_article6_block = buildDepositArticleBlock("Buyer", data, calc);
  r.seller_security_deposit_article6_block = buildDepositArticleBlock("Seller", data, calc);
  r.security_deposit_return_block = buildDepositReturnBlock(data);
  r.buyer_deposit_80_percent_amount = money(calc.buyerDeposit80);
  r.buyer_deposit_20_percent_amount = money(calc.buyerDeposit20);
  r.seller_deposit_80_percent_amount = money(calc.sellerDeposit80);
  r.seller_deposit_20_percent_amount = money(calc.sellerDeposit20);
  r.buyer_default_penalty_amount = money(calc.buyerDefaultPenaltyAmount);
  r.seller_default_penalty_amount = money(calc.sellerDefaultPenaltyAmount);
  r.buyer_distribution_phrase = data.buyerDepositEnabled 
    ? "The forfeited <<Security Deposit>> shall be distributed as follows:" 
    : "The above amount shall be distributed as follows:";
  r.seller_distribution_phrase = data.sellerDepositEnabled 
    ? "The forfeited <<Security Deposit>> shall be distributed as follows:" 
    : "The above amount shall be distributed as follows:";
  r.reservation_deadline = data.reservationDeadline;
  r.seller_signature_name = getSignatureName(data.sellers);
  r.buyer_signature_name = getSignatureName(data.buyers);
  r.seller_signature_date = data.sellerSignatureDate || data.agreementDate;
  r.buyer_signature_date = data.buyerSignatureDate || data.agreementDate;

  return r;
}

function shouldUseNoc(data) {
  const label = String(data?.transferFeeLabel || "").toLowerCase();
  const unitStatus = String(data?.unitStatus || "").toLowerCase();
  return label.includes("noc") || unitStatus === "ready";
}

export function buildDepositTableLine(side, data, calc) {
  const p = side.toLowerCase();
  if (!data[`${p}DepositEnabled`]) return "";
  const amount = calc[`${p}DepositAmount`];
  if (amount === "") return "";
  const calcType = String(data[`${p}DepositCalcType`] || "").toLowerCase();
  const depositPercent = data[`${p}DepositPercent`];
  const direction = side === "Buyer" ? "provided by the Buyer to the Seller" : "provided by the Seller to the Buyer";
  if (calcType.includes("fixed")) return `AED ${money(amount)} / (Security Deposit ${direction})`;
  return `AED ${money(amount)} / (${percent(depositPercent)}% of the Selling Price ${direction})`;
}

const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function numberToWords(num) {
  const n = parseInt(num, 10);
  if (isNaN(n)) return "";
  if (n < 20) return WORDS[n];
  if (n < 100) {
    return TENS[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + WORDS[n % 10] : "");
  }
  return String(n);
}

export function buildDepositArticleBlock(side, data, calc) {
  const p = side.toLowerCase();
  if (!data[`${p}DepositEnabled`]) return "";
  const amount = calc[`${p}DepositAmount`];
  if (amount === "") return "";
  const isDelayed = data[`${p}ChequeTiming`] === "Delayed (within X days)";
  const chequeDays = data[`${p}ChequeDays`] || "";
  
  let firstWord = "Upon signing this agreement,";
  if (side === "Seller" && data.buyerDepositEnabled) {
    firstWord = "Similarly, upon signing this agreement,";
  }

  const agent = side === "Buyer" ? data.buyerAgentName : data.sellerAgentName;
  const agencyLabel = side === "Buyer" ? "Buyer’s Agency name" : "Seller’s Agency name";

  if (isDelayed) {
    return `${firstWord} the <<${side}>> undertakes to provide a sum of <<AED ${money(amount)}>> as a holding <<Security Deposit cheque>> within <<${chequeDays} (${numberToWords(chequeDays)}) calendar days>> from the date of this MOU. This cheque is to secure the purchase of the <<Property>> and will be held by <<${agent} (${agencyLabel})>> as stakeholder until the <<Transfer Date>> in accordance with the terms of this <<MOU>>.`;
  }

  return `${firstWord} the <<${side}>> undertakes to pay a sum of <<AED ${money(amount)}>> as a holding <<Security Deposit cheque>> by cheque No. <<${data[`${p}ChequeNumber`]}>> dated <<${data[`${p}ChequeDate`]}>>, issued by <<${data[`${p}ChequeBank`]}>>, drawn by <<${data[`${p}ChequeDrawnBy`]}>> in favour of <<${data[`${p}ChequeInFavourOf`]}>>. This cheque is to secure the purchase of the <<Property>> and will be held by <<${agent} (${agencyLabel})>> as stakeholder until the <<Transfer Date>> in accordance with the terms of this <<MOU>>.`;
}

export function buildDepositReturnBlock(data) {
  if (data.buyerDepositEnabled && data.sellerDepositEnabled) return DEPOSIT_RETURN_BOTH;
  if (data.buyerDepositEnabled) return DEPOSIT_RETURN_BUYER_ONLY;
  if (data.sellerDepositEnabled) return DEPOSIT_RETURN_SELLER_ONLY;
  return "";
}

export function buildPartyBlock(partyList) {
  return (partyList || [])
    .map((person) => {
      let text = "";
      const salutation = person.salutation;
      if (person.name) text += salutation ? `${salutation} <<${person.name}>>` : `<<${person.name}>>`;
      if (person.nationality) text += `, nationality: <<${person.nationality}>>`;
      if (person.passport) text += `, holder of Passport number: <<${person.passport}>>`;
      if (person.eid) text += `, holder of EID Number <<${person.eid}>>`;
      if (person.ownershipPercent) text += `, Ownership rights – <<${person.ownershipPercent}%>>`;
      if (person.hasPoa && person.poaName) {
        text += `, has designated Mr. <<${person.poaName}>> (pursuant to a valid Power of Attorney)`;
        if (person.poaNationality) text += `, nationality: <<${person.poaNationality}>>`;
        if (person.poaPassport) text += `, holder of Passport number: <<${person.poaPassport}>>`;
        if (person.poaEid) text += `, holder of EID Number <<${person.poaEid}>>`;
      }
      return text;
    })
    .filter(Boolean)
    .join(", and\n");
}

export function getMainPartyName(partyList) {
  return (partyList || []).map((p) => p.name).filter(Boolean).join(" and ");
}

export function getOwnershipTotal(partyList) {
  return (partyList || []).reduce((sum, p) => {
    const parsed = n(p.ownershipPercent);
    return sum + (parsed === "" ? 0 : parsed);
  }, 0);
}

export function getSignatureName(partyList) {
  return (partyList || [])
    .map((p) => (p.hasPoa && p.poaName ? p.poaName : p.name))
    .filter(Boolean)
    .join(" and ");
}

export function getTypeOfArea(projectName) {
  const project = String(projectName || "").trim().toLowerCase();
  if (project.includes("c3") || project.includes("garden residence")) return "Residential - Household Living";
  return "Residential";
}

export function formatLongDate(value) {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (!match) return raw;

  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(date.getTime())) return raw;

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function buildDraftTitle(data) {
  const parts = [
    "MOU",
    data.projectName || "Project",
    data.unitNumber || "Unit",
    getMainPartyName(data.sellers) || "Seller",
    getMainPartyName(data.buyers) || "Buyer",
  ];
  return sanitizeFileName(parts.filter(Boolean).join(" - "));
}

export function validateMou(data) {
  const errors = [];
  const warnings = [];
  const required = [
    ["agreementDate", "Agreement Date"],
    ["reservationDeadline", "Reservation Deadline"],
    ["projectName", "Project"],
    ["unitStatus", "Unit Status"],
    ["unitNumber", "Unit Number"],
    ["sellerAgentName", "Seller Agent"],
    ["buyerAgentName", "Buyer Agent"],
  ];

  required.forEach(([key, label]) => {
    if (!data[key]) errors.push(`${label}: заполните поле.`);
  });

  if (!getMainPartyName(data.sellers)) errors.push("Seller: добавьте имя продавца.");
  if (!getMainPartyName(data.buyers)) errors.push("Buyer: добавьте имя покупателя.");
  if (data.sellingPrice === "") errors.push("Selling Price: введите корректную сумму.");
  if (!data.amountToSellerPaymentMethod) errors.push("Amount to Seller payment method: выберите способ оплаты.");
  if (data.amountToSellerPaymentMethod === "manager_cheque_in_favour" && !data.amountToSellerChequeInFavourOf) {
    errors.push("Amount to Seller payment method: укажите имя, в пользу кого выписан Manager's Cheque.");
  }
  if (data.originalPrice === "") warnings.push("Original Price пустой: часть расчетов может остаться пустой.");
  validateOwnership("Seller", data.sellers, errors);
  validateOwnership("Buyer", data.buyers, errors);
  validateDeposit("Buyer", data, errors);
  validateDeposit("Seller", data, errors);
  const activeSecurityArticles = [];
  if (data.includeArticle7) activeSecurityArticles.push("7");
  if (data.includeArticle8) activeSecurityArticles.push("8");
  if (data.includeArticle9) activeSecurityArticles.push("9");

  if (!data.includeArticle6 && activeSecurityArticles.length > 0) {
    warnings.push(`Article 6 и 9 отключены: проверьте, что ссылки на security deposit в статьях ${activeSecurityArticles.join("/")} уместны для этой сделки.`);
  }

  return { ok: errors.length === 0, errors, warnings };
}

function validateOwnership(label, parties, errors) {
  const total = Math.round(getOwnershipTotal(parties) * 100) / 100;
  if (total !== 100) errors.push(`${label} ownership должен быть 100%, сейчас ${total}%.`);
}

function validateDeposit(side, data, errors) {
  const p = side.toLowerCase();
  if (!data[`${p}DepositEnabled`]) return;
  const calcType = String(data[`${p}DepositCalcType`] || "").toLowerCase();
  if (calcType.includes("fixed") && data[`${p}DepositFixedAmount`] === "") {
    errors.push(`${side} Security Deposit: введите fixed amount.`);
  }
  if (!calcType.includes("fixed") && data[`${p}DepositPercent`] === "") {
    errors.push(`${side} Security Deposit: введите процент депозита.`);
  }
  ["ChequeNumber", "ChequeDate", "ChequeBank", "ChequeDrawnBy", "ChequeInFavourOf"].forEach((field) => {
    if (!data[`${p}${field}`]) errors.push(`${side} Security Deposit: заполните ${field}.`);
  });
}

export function buildPreview(form, rules = DEFAULT_RULES) {
  const data = normalizeForm(form);
  const calc = calculate(data);
  const articleDefs = getArticleDefs(data.unitStatus);
  const articles = articleSummary(data, rules, articleDefs);
  const articleNumbers = buildArticleNumbers(data, rules, articleDefs);
  const replacements = buildReplacements(data, calc, articleNumbers);
  const validation = validateMou(data);

  return {
    data,
    calc,
    replacements,
    articles,
    validation,
    summary: {
      title: buildDraftTitle(data),
      seller: getMainPartyName(data.sellers),
      buyer: getMainPartyName(data.buyers),
      propertyLocation: formatPropertyLocation(data.propertyLocation),
      typeOfArea: getTypeOfArea(data.projectName),
      sellingPrice: money(data.sellingPrice),
      amountToSeller: money(calc.amountToSeller),
      thresholdTopUpAmount: money(calc.thresholdTopUpAmount),
      remainingDeveloperBalance: money(calc.remainingDeveloperBalance),
      admFee: money(calc.admFee),
      agencyFeeSeller: money(calc.agencyFeeSeller),
      agencyFeeBuyer: money(calc.agencyFeeBuyer),
      buyerDeposit: money(calc.buyerDepositAmount),
      sellerDeposit: money(calc.sellerDepositAmount),
      buyerDefaultPenaltyAmount: money(calc.buyerDefaultPenaltyAmount),
      sellerDefaultPenaltyAmount: money(calc.sellerDefaultPenaltyAmount),
    },
  };
}
