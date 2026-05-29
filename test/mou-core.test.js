import assert from "node:assert/strict";
import test from "node:test";
import {
  buildConditionalTextRequests,
  buildSignatureTableFillRequests,
  buildSignatureTablePlan,
  buildSignatureTableStyleRequests,
} from "../lib/google/docs.js";
import { buildArticleNumbers, DEFAULT_RULES } from "../lib/mou/articles.js";
import { buildReplacements, calculate, formatLongDate, normalizeForm, validateMou } from "../lib/mou/core.js";

function base(overrides = {}) {
  return normalizeForm({
    agreementDate: "26.05.2026",
    reservationDeadline: "30.06.2026",
    projectName: "Gardenia Bay",
    unitStatus: "Off-Plan",
    unitNumber: "A-101",
    sellerAgentName: "Seller Agent",
    buyerAgentName: "Buyer Agent",
    sellers: [{ name: "Seller One", ownershipPercent: "100" }],
    buyers: [{ name: "Buyer One", ownershipPercent: "100" }],
    sellingPrice: "1,570,000",
    originalPrice: "1,400,000",
    paidAmountToDeveloper: "300,000",
    transferThresholdPercent: "30",
    admAdminFee: "575",
    amountToSellerPaymentMethod: "manager_cheque",
    buyerDepositEnabled: "No",
    sellerDepositEnabled: "No",
    ...overrides,
  });
}

test("ADM fee uses the higher of selling price and original price plus admin fee", () => {
  const data = base();
  const calc = calculate(data);
  const replacements = buildReplacements(data, calc, buildArticleNumbers(data));
  assert.equal(calc.admFee, 1570000 * 0.02 + 575);
  assert.equal(calc.admFeeBase, 1570000);
  assert.equal(replacements.adm_fee_base_label, "Selling Price");

  const originalData = base({ sellingPrice: "1,200,000", originalPrice: "1,400,000" });
  const originalPriceBase = calculate(originalData);
  const originalReplacements = buildReplacements(originalData, originalPriceBase, buildArticleNumbers(originalData));
  assert.equal(originalPriceBase.admFee, 1400000 * 0.02 + 575);
  assert.equal(originalPriceBase.admFeeBase, 1400000);
  assert.equal(originalReplacements.adm_fee_base_label, "Original Price");
});

test("threshold top-up and remaining developer balance are calculated", () => {
  const calc = calculate(base());
  assert.equal(calc.requiredThresholdAmount, 420000);
  assert.equal(calc.thresholdTopUpAmount, 120000);
  assert.equal(calc.remainingDeveloperBalance, 980000);
  assert.equal(calc.amountToSeller, 470000);
});

test("automatic amount to seller is selling price minus unpaid developer balance", () => {
  const data = base({
    sellingPrice: "2,000,000",
    originalPrice: "1,500,000",
    paidAmountToDeveloper: "600,000",
    transferThresholdPercent: "40",
  });
  const calc = calculate(data);
  const unpaidDeveloperBalance = calc.thresholdTopUpAmount + calc.remainingDeveloperBalance;

  assert.equal(unpaidDeveloperBalance, 900000);
  assert.equal(calc.amountToSeller, 1100000);
});

test("filled The Row MOU payment table matches automatic calculations", () => {
  const calc = calculate(
    base({
      sellingPrice: "5,400,000",
      originalPrice: "5,612,300",
      paidAmountToDeveloper: "280,615",
      transferThresholdPercent: "30",
      admAdminFee: "575",
      buyerDepositEnabled: "Yes",
      buyerDepositCalcType: "% of Selling Price",
      buyerDepositPercent: "10",
      sellerDepositEnabled: "Yes",
      sellerDepositCalcType: "% of Selling Price",
      sellerDepositPercent: "10",
    }),
  );

  assert.equal(calc.thresholdTopUpAmount, 1403075);
  assert.equal(calc.remainingDeveloperBalance, 3928610);
  assert.equal(calc.amountToSeller, 68315);
  assert.equal(calc.admFee, 112821);
  assert.equal(calc.buyerDepositAmount, 540000);
  assert.equal(calc.sellerDepositAmount, 540000);
});

test("buyer and seller deposits support percent and fixed amount", () => {
  const calc = calculate(
    base({
      buyerDepositEnabled: "Yes",
      buyerDepositCalcType: "% of Selling Price",
      buyerDepositPercent: "10",
      sellerDepositEnabled: "Yes",
      sellerDepositCalcType: "Fixed Amount",
      sellerDepositFixedAmount: "100000",
    }),
  );
  assert.equal(calc.buyerDepositAmount, 157000);
  assert.equal(calc.buyerDeposit80, 125600);
  assert.equal(calc.buyerDeposit20, 31400);
  assert.equal(calc.sellerDepositAmount, 100000);
});

test("agency fees default to 2.1 percent but can be manually overridden", () => {
  const automatic = calculate(base({ sellingPrice: "5,400,000" }));
  assert.equal(automatic.agencyFeeSeller, 113400);
  assert.equal(automatic.agencyFeeBuyer, 113400);

  const overridden = calculate(base({ sellingPrice: "5,400,000", agencyFeeSeller: "0", agencyFeeBuyer: "54,000" }));
  assert.equal(overridden.agencyFeeSeller, 0);
  assert.equal(overridden.agencyFeeBuyer, 54000);
});

test("article numbering closes gaps when optional articles are disabled", () => {
  const numbers = buildArticleNumbers(base({ includeArticle6: "No", includeArticle7: "No" }));
  assert.equal(numbers.article_payment_table_number, "5");
  assert.equal(numbers.article_security_deposit_number, "");
  assert.equal(numbers.article_buyer_default_number, "");
  assert.equal(numbers.article_seller_default_number, "6");
});

test("any article can be excluded and remaining articles are renumbered", () => {
  const numbers = buildArticleNumbers(base({ excludedArticleKeys: ["article_property_details_number"] }), DEFAULT_RULES);
  assert.equal(numbers.article_property_details_number, "");
  assert.equal(numbers.article_selling_price_number, "3");
});

test("validation catches ownership and deposit details", () => {
  const data = base({
    buyers: [{ name: "Buyer One", ownershipPercent: "50" }],
    buyerDepositEnabled: "Yes",
    buyerDepositCalcType: "Fixed Amount",
    buyerDepositFixedAmount: "",
  });
  const validation = validateMou(data);
  assert.equal(validation.ok, false);
  assert(validation.errors.some((error) => error.includes("Buyer ownership")));
  assert(validation.errors.some((error) => error.includes("fixed amount")));
});

test("security deposit definition is adjusted by cheque availability", () => {
  const doc = {
    body: {
      content: [
        {
          startIndex: 10,
          endIndex: 220,
          paragraph: {
            elements: [
              {
                textRun: {
                  content:
                    "Security Deposit – the deposit issued by the Buyer to the Seller upon commencement of this agreement and a corresponding deposit issued by the Seller to the Buyer as a guarantee of their respective obligations.\n",
                },
              },
            ],
          },
        },
      ],
    },
  };

  const bothDisabled = buildConditionalTextRequests(doc, base({ buyerDepositEnabled: "No", sellerDepositEnabled: "No" }));
  const bothDisabledDelete = bothDisabled.find((request) => request.deleteContentRange);
  assert.deepEqual(bothDisabledDelete.deleteContentRange.range, { startIndex: 10, endIndex: 219 });

  const sellerDisabled = buildConditionalTextRequests(doc, base({ buyerDepositEnabled: "Yes", sellerDepositEnabled: "No" }));
  assert.equal(sellerDisabled[0].replaceAllText.replaceText, "");
  assert(sellerDisabled[0].replaceAllText.containsText.text.includes("Seller to the Buyer"));

  const buyerDisabled = buildConditionalTextRequests(doc, base({ buyerDepositEnabled: "No", sellerDepositEnabled: "Yes" }));
  assert.equal(
    buyerDisabled[0].replaceAllText.replaceText,
    "the deposit issued by the Seller to the Buyer upon commencement of this agreement",
  );
});

test("fee definition keeps only one paragraph: NOC for ready or NOC label, otherwise Transfer", () => {
  const doc = {
    body: {
      content: [
        {
          startIndex: 10,
          endIndex: 140,
          paragraph: {
            elements: [
              {
                textRun: {
                  content:
                    "Transfer fee – any fee levied by the Property Developer related to the transfer procedure of ownership and title registration.\n",
                },
              },
            ],
          },
        },
        {
          startIndex: 140,
          endIndex: 310,
          paragraph: {
            elements: [
              {
                textRun: {
                  content:
                    "NOC fee is a fee charged for issuing a No Objection Certificate (NOC) — an official document stating that the issuing authority has no objection to a specific action.\n",
                },
              },
            ],
          },
        },
        {
          startIndex: 310,
          endIndex: 610,
          paragraph: {
            elements: [
              {
                textRun: {
                  content:
                    "Transfer fee – any fee levied by the Property Developer related to the transfer procedure of ownership and title registration.  NOC fee is a fee charged for issuing a No Objection Certificate (NOC) — an official document stating that the issuing authority has no objection to a specific action.\n",
                },
              },
            ],
          },
        },
      ],
    },
  };

  const readyModeRequests = buildConditionalTextRequests(doc, base({ unitStatus: "Ready", transferFeeLabel: "Transfer Fee" }));
  const readyCombinedReplace = readyModeRequests.find((item) =>
    item.replaceAllText?.containsText?.text.includes("Transfer fee") &&
    item.replaceAllText?.containsText?.text.includes("NOC fee"),
  );
  const readyReplace = readyModeRequests.find((item) => item.replaceAllText?.containsText?.text.includes("Transfer fee"));
  const readyDefinitionDelete = readyModeRequests.find((item) => item.deleteContentRange?.range.startIndex === 140);
  assert.equal(
    readyCombinedReplace.replaceAllText.replaceText,
    "<<NOC fee>> is a fee charged for issuing a <<No Objection Certificate (NOC)>> — an official document stating that the issuing authority has no objection to a specific action.",
  );
  assert.equal(
    readyReplace.replaceAllText.replaceText,
    "<<NOC fee>> is a fee charged for issuing a <<No Objection Certificate (NOC)>> — an official document stating that the issuing authority has no objection to a specific action.",
  );
  assert.equal(readyDefinitionDelete, undefined);

  const offPlanTransferRequests = buildConditionalTextRequests(doc, base({ unitStatus: "Off-Plan", transferFeeLabel: "Transfer Fee" }));
  const offPlanCombinedFix = offPlanTransferRequests.find((item) =>
    item.replaceAllText?.containsText?.text.includes("Transfer fee") &&
    item.replaceAllText?.containsText?.text.includes("NOC fee"),
  );
  const offPlanDefinitionDelete = offPlanTransferRequests.find((item) => item.deleteContentRange?.range.startIndex === 140);
  assert.equal(
    offPlanCombinedFix.replaceAllText.replaceText,
    "<<Transfer fee>> – any fee levied by the <<Property Developer>> related to the transfer procedure of ownership and title registration.",
  );
  assert.equal(offPlanDefinitionDelete, undefined);
});

test("ready unit forces NOC fee label in normalized form", () => {
  const data = normalizeForm({
    unitStatus: "Ready",
    transferFeeLabel: "Transfer Fee",
  });
  assert.equal(data.transferFeeLabel, "NOC Fee");
});

test("seller outstanding NOC phrase is included only for NOC deals", () => {
  const transferData = base({ unitStatus: "Off-Plan", transferFeeLabel: "Transfer Fee" });
  const transferReplacements = buildReplacements(transferData, calculate(transferData), buildArticleNumbers(transferData));
  assert.equal(transferReplacements.seller_outstanding_noc_phrase, "");

  const transferRequests = buildConditionalTextRequests({ body: { content: [] } }, transferData);
  assert(
    transferRequests.some((request) =>
      request.replaceAllText?.containsText?.text === " or No Objection Certificate (NOC)" &&
      request.replaceAllText?.replaceText === "",
    ),
  );

  const nocData = base({ unitStatus: "Ready", transferFeeLabel: "Transfer Fee" });
  const nocReplacements = buildReplacements(nocData, calculate(nocData), buildArticleNumbers(nocData));
  const nocRequests = buildConditionalTextRequests({ body: { content: [] } }, nocData);
  assert.equal(nocReplacements.seller_outstanding_noc_phrase, " or No Objection Certificate (NOC)");
  assert.equal(
    nocRequests.some((request) => request.replaceAllText?.containsText?.text === " or No Objection Certificate (NOC)"),
    false,
  );
});

test("amount to seller payment method replaces fixed payment wording", () => {
  const doc = { body: { content: [] } };
  const cashRequests = buildConditionalTextRequests(doc, base({ amountToSellerPaymentMethod: "cash" }));
  assert(
    cashRequests.some((request) =>
      request.replaceAllText?.containsText?.text === "Manager's Cheque or Cash." &&
      request.replaceAllText?.replaceText === "Cash.",
    ),
  );

  const namedChequeRequests = buildConditionalTextRequests(
    doc,
    base({
      amountToSellerPaymentMethod: "manager_cheque_in_favour",
      amountToSellerChequeInFavourOf: "John Smith",
    }),
  );
  assert(
    namedChequeRequests.some((request) =>
      request.replaceAllText?.replaceText === "Manager's Cheque issued in favour of John Smith.",
    ),
  );
});

test("ADM fee payee can be replaced with developer name", () => {
  const requests = buildConditionalTextRequests(
    { body: { content: [] } },
    base({ developerName: "ALDAR DEVELOPMENT L.L.C" }),
  );

  assert(
    requests.some((request) =>
      request.replaceAllText?.containsText?.text === "to be paid by the Buyer to Abu Dhabi Municipality on the transfer date by a Manager’s Cheque" &&
      request.replaceAllText?.replaceText === "to be paid by the Buyer to ALDAR DEVELOPMENT L.L.C on the transfer date by a Manager’s Cheque",
    ),
  );
});

test("named amount to seller cheque requires beneficiary name", () => {
  const validation = validateMou(base({
    amountToSellerPaymentMethod: "manager_cheque_in_favour",
    amountToSellerChequeInFavourOf: "",
  }));
  assert.equal(validation.ok, false);
  assert(validation.errors.some((error) => error.includes("Manager's Cheque")));
});

test("agreement date has a long format replacement for footer", () => {
  assert.equal(formatLongDate("25/01/2026"), "January 25, 2026");
  assert.equal(formatLongDate("25.01.2026"), "January 25, 2026");

  const data = base({ agreementDate: "25/01/2026" });
  const replacements = buildReplacements(data, calculate(data), buildArticleNumbers(data));
  assert.equal(replacements.agreement_date, "25/01/2026");
  assert.equal(replacements.agreement_date_long, "January 25, 2026");
});

test("signature block placeholder creates a dynamic table plan", () => {
  const doc = {
    body: {
      content: [
        {
          startIndex: 100,
          endIndex: 120,
          paragraph: {
            elements: [{ textRun: { content: "{{signature_block}}\n" } }],
          },
        },
      ],
    },
  };

  const data = base({
    sellers: [
      { name: "Seller One", ownershipPercent: "50" },
      { name: "Seller Two", ownershipPercent: "50" },
    ],
    buyers: [{ name: "Buyer One", ownershipPercent: "100" }],
  });
  const plan = buildSignatureTablePlan(doc, data);

  assert.equal(plan.rows, 7);
  assert.equal(plan.columns, 2);
  assert.equal(plan.requests[0].deleteContentRange.range.startIndex, 100);
  assert.equal(plan.requests[1].insertTable.rows, 7);
});

test("existing simple signature table can be replaced by dynamic signature table", () => {
  const doc = {
    body: {
      content: [
        {
          startIndex: 100,
          endIndex: 300,
          table: {
            tableRows: [
              {
                tableCells: [
                  { content: [{ paragraph: { elements: [{ textRun: { content: "{{seller_signature_name}}" } }] } }] },
                  { content: [{ paragraph: { elements: [{ textRun: { content: "{{buyer_signature_name}}" } }] } }] },
                ],
              },
            ],
          },
        },
      ],
    },
  };
  const data = base({
    sellers: [
      { name: "Seller One", ownershipPercent: "50" },
      { name: "Seller Two", ownershipPercent: "50" },
    ],
    buyers: [{ name: "Buyer One", ownershipPercent: "100" }],
  });
  const plan = buildSignatureTablePlan(doc, data);

  assert.equal(plan.rows, 7);
  assert.deepEqual(plan.requests[0].deleteContentRange.range, { startIndex: 100, endIndex: 299 });
});

test("existing signature table delete range is clamped to document segment", () => {
  const doc = {
    body: {
      content: [
        {
          startIndex: 100,
          endIndex: 23838,
          table: {
            tableRows: [
              {
                tableCells: [
                  { content: [{ paragraph: { elements: [{ textRun: { content: "{{seller_signature_name}}" } }] } }] },
                  { content: [{ paragraph: { elements: [{ textRun: { content: "{{buyer_signature_name}}" } }] } }] },
                ],
              },
            ],
          },
        },
        {
          startIndex: 23646,
          endIndex: 23647,
          paragraph: {
            elements: [{ textRun: { content: "\n" } }],
          },
        },
      ],
    },
  };
  const plan = buildSignatureTablePlan(doc, base());

  assert.deepEqual(plan.requests[0].deleteContentRange.range, { startIndex: 100, endIndex: 23646 });
});

test("disabled article delete range is clamped to document segment", async () => {
  const { buildDeleteArticleRequests } = await import("../lib/google/docs.js");
  const doc = {
    body: {
      content: [
        {
          startIndex: 100,
          endIndex: 120,
          paragraph: {
            elements: [{ textRun: { content: "Article {{article_security_deposit_number}}\n" } }],
          },
        },
        {
          startIndex: 130,
          endIndex: 23838,
          paragraph: {
            elements: [{ textRun: { content: "Article body\n" } }],
          },
        },
        {
          startIndex: 23646,
          endIndex: 23647,
          paragraph: {
            elements: [{ textRun: { content: "\n" } }],
          },
        },
      ],
    },
  };
  const requests = buildDeleteArticleRequests(doc, base({ includeArticle6: "No" }), DEFAULT_RULES);

  assert.deepEqual(requests[0].deleteContentRange.range, { startIndex: 100, endIndex: 23646 });
});

test("dynamic signature table is filled for uneven seller and buyer counts", () => {
  const tableRows = Array.from({ length: 7 }, (_, row) => ({
    tableCells: Array.from({ length: 2 }, (_, column) => ({
      content: [
        {
          paragraph: {
            elements: [{ startIndex: 200 + row * 20 + column * 10 }],
          },
        },
      ],
    })),
  }));
  const doc = {
    body: {
      content: [
        {
          startIndex: 100,
          endIndex: 400,
          table: { tableRows },
        },
      ],
    },
  };
  const data = base({
    agreementDate: "19/05/2026",
    sellers: [
      { name: "Emma Caroline Fritz", ownershipPercent: "50" },
      { name: "Claes Jesper Fritz", ownershipPercent: "50" },
    ],
    buyers: [{ name: "Sahmurat Ahmetoglu", ownershipPercent: "100" }],
  });
  const requests = buildSignatureTableFillRequests(doc, data, { insertionIndex: 100, rows: 7 });
  const insertedText = requests.map((request) => request.insertText?.text).filter(Boolean);

  assert(insertedText.includes("THE SELLER"));
  assert(insertedText.includes("THE BUYER"));
  assert(insertedText.includes("Name: Emma Caroline Fritz"));
  assert(insertedText.includes("Name: Claes Jesper Fritz"));
  assert(insertedText.includes("Name: Sahmurat Ahmetoglu"));
});

test("dynamic signature table includes local template styling", () => {
  const requests = buildSignatureTableStyleRequests(100, 7, 2);
  const headerStyle = requests.find((request) => request.updateTableCellStyle?.tableCellStyle?.backgroundColor);
  const allCellsStyle = requests.find((request) => request.updateTableCellStyle?.tableCellStyle?.borderTop);
  const rowHeightRequests = requests.filter((request) => request.updateTableRowStyle);

  assert.equal(headerStyle.updateTableCellStyle.tableCellStyle.backgroundColor.color.rgbColor.blue, 0.8941176471);
  assert.equal(allCellsStyle.updateTableCellStyle.tableCellStyle.borderTop.width.magnitude, 1);
  assert.equal(rowHeightRequests.length, 7);
  assert.equal(rowHeightRequests[0].updateTableRowStyle.tableRowStyle.minRowHeight.magnitude, 28);
});

test("article 6 deposit block supports delayed cheque timing and drops agency label", () => {
  const data = base({
    sellerDepositEnabled: "Yes",
    sellerDepositCalcType: "Fixed Amount",
    sellerDepositFixedAmount: "360000",
    sellerChequeTiming: "Delayed (within X days)",
    sellerChequeDays: "5",
    sellerAgentName: "PRIME BRIDGE REAL ESTATE BROKERAGE L.L.C - S.P.C",
  });
  const calc = calculate(data);
  const replacements = buildReplacements(data, calc, {});
  const block = replacements.seller_security_deposit_article6_block;
  
  const expected = "Similarly, upon signing this agreement, the <<Seller>> undertakes to provide a sum of <<AED 360.000,00>> as a holding <<Security Deposit cheque>> within <<5 (Five) calendar days>> from the date of this MOU. This cheque is to secure the purchase of the <<Property>> and will be held by <<PRIME BRIDGE REAL ESTATE BROKERAGE L.L.C - S.P.C (Seller’s Agency name)>> as stakeholder until the <<Transfer Date>> in accordance with the terms of this <<MOU>>.";
  
  if (block !== expected) {
    throw new Error(`Deposit block does not match expected output.\nEXPECTED: ${expected}\nACTUAL:   ${block}`);
  }
});
