// Central registry for all conditional contract text snippets.
// docs.js and core.js import from here instead of hardcoding strings.
// When adding new conditions, add the text here and import where needed.

// --- Fee definitions (Article 1 / Definitions list item) ---

export const TRANSFER_FEE_DEFINITION_TEXT =
  "Transfer fee – any fee levied by the Property Developer related to the transfer procedure of ownership and title registration.";

export const NOC_FEE_DEFINITION_TEXT =
  "NOC fee is a fee charged for issuing a No Objection Certificate (NOC) — an official document stating that the issuing authority has no objection to a specific action.";

export const COMBINED_FEE_DEFINITION_TEXT = `${TRANSFER_FEE_DEFINITION_TEXT}  ${NOC_FEE_DEFINITION_TEXT}`;

// --- Deposit definitions (Article 1 / Definitions) ---

export const BUYER_DEPOSIT_DEFINITION_TEXT =
  "the deposit issued by the Buyer to the Seller upon commencement of this agreement";

export const SELLER_DEPOSIT_DEFINITION_TEXT =
  " and a corresponding deposit issued by the Seller to the Buyer";

export const SELLER_ONLY_DEPOSIT_DEFINITION_TEXT =
  "the deposit issued by the Seller to the Buyer upon commencement of this agreement";

// --- Deposit return block (Article 6 — Security Deposit) ---

export const DEPOSIT_RETURN_BOTH =
  "Upon successful completion of the transfer of ownership on the Transfer Date, the Security Deposit cheques shall be returned to the Buyer <<and to the Seller>> or cancelled and shall not be presented for payment.";

export const DEPOSIT_RETURN_BUYER_ONLY =
  "Upon successful completion of the transfer of ownership on the Transfer Date, the Buyer's Security Deposit cheque shall be returned to the Buyer or cancelled and shall not be presented for payment.";

export const DEPOSIT_RETURN_SELLER_ONLY =
  "Upon successful completion of the transfer of ownership on the Transfer Date, the Seller's Security Deposit cheque shall be returned to the Seller or cancelled and shall not be presented for payment.";

// --- Amount to Seller payment method (searched in template) ---

export const AMOUNT_TO_SELLER_PAYMENT_TEXT_VARIANTS = [
  "Manager's Cheque or Cash.",
  "Manager's Cheque or Сash.", // variant with Cyrillic С in template
];

// --- ADM fee payee (searched in template) ---

export const ADM_FEE_PAYEE_TEXT =
  "to be paid by the Buyer to Abu Dhabi Municipality on the transfer date by a Manager\u2019s Cheque";

// --- Default penalties (Article 7 & 8) ---

export const BUYER_DEFAULT_FORFEIT_TEXT =
  "the Security Deposit referred to in Article {{article_security_deposit_number}} shall be forfeited as liquidated damages, and the Parties expressly agree that such amount constitutes a genuine pre-estimate of the Seller\u2019s loss and shall not be construed as a penalty.";

export const BUYER_DEFAULT_PENALTY_TEXT =
  "the Buyer shall be liable to pay the Seller a fixed amount of AED {{buyer_default_penalty_amount}} as liquidated damages, which the Parties agree represents a genuine pre-estimate of the Seller\u2019s losses and is not a penalty.";

export const SELLER_DEFAULT_FORFEIT_TEXT =
  "the Security Deposit referred to in Article {{article_security_deposit_number}} shall be forfeited as liquidated damages, and the Parties expressly agree that such amount constitutes a genuine pre-estimate of the Buyer\u2019s loss and shall not be construed as a penalty.";

export const SELLER_DEFAULT_PENALTY_TEXT =
  "the Seller shall be liable to pay the Buyer a fixed amount of AED {{seller_default_penalty_amount}} as liquidated damages, which the Parties agree represents a genuine pre-estimate of the Buyer\u2019s losses and is not a penalty.";

export const DEFAULT_AMOUNT_SAID_TEXT = "The said amount";
export const DEFAULT_AMOUNT_ABOVE_TEXT = "The above amount";

// --- Seller Outstanding Charges — NOC phrase ---

export const SELLER_OUTSTANDING_NOC_PHRASE = " or No Objection Certificate (NOC)";

// --- Signature block ---

export const SIGNATURE_BLOCK_PLACEHOLDER = "{{signature_block}}";

export const SIGNATURE_HEADER_RGB = {
  red: 0.6117647059,
  green: 0.7607843137,
  blue: 0.8941176471,
};
