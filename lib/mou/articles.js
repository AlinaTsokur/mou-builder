// ---------- Article definitions per template type ----------

export const ARTICLE_DEFS_OFFPLAN = [
  ["article_sale_offer_number", 1, "Sale Offer"],
  ["article_effective_date_number", 2, "Effective Date"],
  ["article_property_details_number", 3, "Property Details"],
  ["article_selling_price_number", 4, "Selling Price"],
  ["article_payment_table_number", 5, "Payment Table"],
  ["article_security_deposit_number", 6, "Security Deposit"],
  ["article_buyer_default_number", 7, "Buyer Default"],
  ["article_seller_default_number", 8, "Seller Default"],
  ["article_deposit_release_number", 9, "Deposit Release"],
  ["article_termination_agreement_number", 10, "Termination Agreement"],
  ["article_buyer_own_funds_number", 11, "Buyer Own Funds"],
  ["article_seller_outstanding_charges_number", 12, "Seller Outstanding Charges"],
  ["article_property_hold_number", 13, "Property Hold"],
  ["article_seller_documents_number", 14, "Seller Documents"],
  ["article_spa_assignment_number", 15, "SPA Assignment"],
  ["article_power_of_attorney_number", 16, "Power of Attorney"],
  ["article_reservation_period_number", 17, "Reservation Period"],
  ["article_automatic_extension_number", 18, "Automatic Extension"],
  ["article_developer_approval_number", 19, "Developer Approval"],
  ["article_force_majeure_number", 20, "Force Majeure"],
  ["article_indemnity_number", 21, "Indemnity"],
  ["article_aml_number", 22, "AML / Compliance"],
  ["article_amicable_dispute_number", 23, "Amicable Dispute Resolution"],
  ["article_court_jurisdiction_number", 24, "Court Jurisdiction"],
  ["article_entire_agreement_number", 25, "Entire Agreement"],
  ["article_confidentiality_number", 26, "Confidentiality"],
  ["article_electronic_signature_number", 27, "Electronic Signature"],
];

export const ARTICLE_DEFS_CASH_TO_CASH = [
  ["article_sale_offer_number", 1, "Sale Offer"],
  ["article_effective_date_number", 2, "Effective Date"],
  ["article_property_details_number", 3, "Property Details"],
  ["article_selling_price_number", 4, "Selling Price"],
  ["article_payment_table_number", 5, "Payment Table"],
  ["article_security_deposit_number", 6, "Security Deposit"],
  ["article_buyer_default_number", 7, "Buyer Default"],
  ["article_seller_default_number", 8, "Seller Default"],
  ["article_deposit_release_number", 9, "Deposit Release"],
  ["article_termination_agreement_number", 10, "Termination Agreement"],
  ["article_buyer_own_funds_number", 11, "Buyer Own Funds"],
  ["article_seller_outstanding_charges_number", 12, "Seller Outstanding Charges"],
  ["article_property_hold_number", 13, "Property Hold"],
  ["article_seller_documents_number", 14, "Seller Documents"],
  ["article_power_of_attorney_number", 15, "Power of Attorney"],
  ["article_reservation_period_number", 16, "Reservation Period"],
  ["article_automatic_extension_number", 17, "Automatic Extension"],
  ["article_force_majeure_number", 18, "Force Majeure"],
  ["article_indemnity_number", 19, "Indemnity"],
  ["article_vacant_on_transfer_number", 20, "Vacant on Transfer / Tenancy Contract"],
  ["article_aml_number", 21, "AML / Compliance"],
  ["article_amicable_dispute_number", 22, "Amicable Dispute Resolution"],
  ["article_court_jurisdiction_number", 23, "Court Jurisdiction"],
  ["article_entire_agreement_number", 24, "Entire Agreement"],
  ["article_confidentiality_number", 25, "Confidentiality"],
  ["article_electronic_signature_number", 26, "Electronic Signature"],
];

// Backward-compatible default (Off-Plan)
export const ARTICLE_DEFS = ARTICLE_DEFS_OFFPLAN;

/**
 * Returns the correct article definitions for the given unit status.
 * "Ready" → Cash-to-Cash, everything else → Off-Plan.
 */
export function getArticleDefs(unitStatus) {
  const status = String(unitStatus || "").toLowerCase();
  if (status === "ready") return ARTICLE_DEFS_CASH_TO_CASH;
  return ARTICLE_DEFS_OFFPLAN;
}

// ---------- Rules ----------

export const DEFAULT_RULES = [
  articleRule("includeArticle6", "article_security_deposit_number", "Article 6 - Security Deposit"),
  articleRule("includeArticle7", "article_buyer_default_number", "Article 7 - Buyer Default"),
  articleRule("includeArticle8", "article_seller_default_number", "Article 8 - Seller Default"),
  articleRule("includeArticle9", "article_deposit_release_number", "Article 9 - Deposit Release"),
  articleRule("includeArticle18", "article_automatic_extension_number", "Article 18 - Automatic Extension"),
];

function articleRule(field, placeholder, label) {
  return {
    rule_id: field,
    target_type: "article",
    target_key: placeholder,
    label,
    default_enabled: "Yes",
    condition_field: field,
    operator: "equals",
    condition_value: "No",
    action: "disable",
    notes: "Matches current Apps Script behavior.",
  };
}

export function disabledArticlePlaceholders(data, rules = DEFAULT_RULES) {
  const disabled = new Set(Array.isArray(data.excludedArticleKeys) ? data.excludedArticleKeys : []);

  // Hardcode legacy explicit flags if they evaluate to false
  if (data.includeArticle6 === false) disabled.add("article_security_deposit_number");
  if (data.includeArticle7 === false) disabled.add("article_buyer_default_number");
  if (data.includeArticle8 === false) disabled.add("article_seller_default_number");
  if (data.includeArticle9 === false) disabled.add("article_deposit_release_number");
  if (data.includeArticle18 === false) disabled.add("article_automatic_extension_number");

  for (const rule of rules) {
    if ((rule.target_type || "").toLowerCase() !== "article") continue;
    if ((rule.action || "").toLowerCase() !== "disable") continue;
    const field = rule.condition_field || rule.rule_id;
    const expected = String(rule.condition_value || "No").toLowerCase();
    const actual = String(data[field] ? "Yes" : "No").toLowerCase();
    if (actual === expected) disabled.add(rule.target_key);
  }

  return Array.from(disabled);
}

export function buildArticleNumbers(data, rules = DEFAULT_RULES, articleDefs) {
  const defs = articleDefs || getArticleDefs(data.unitStatus);
  const disabled = disabledArticlePlaceholders(data, rules);
  const numbers = {};
  let current = 1;

  for (const [placeholder] of defs) {
    if (disabled.includes(placeholder)) {
      numbers[placeholder] = "";
    } else {
      numbers[placeholder] = String(current);
      current += 1;
    }
  }

  return numbers;
}

export function articleSummary(data, rules = DEFAULT_RULES, articleDefs) {
  const defs = articleDefs || getArticleDefs(data.unitStatus);
  const disabled = disabledArticlePlaceholders(data, rules);
  const numbers = buildArticleNumbers(data, rules, defs);
  return defs.map(([key, originalNumber, title]) => ({
    key,
    title,
    originalNumber,
    number: numbers[key],
    included: !disabled.includes(key),
  }));
}
