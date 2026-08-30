// Боевая генерация локально, ботовыми ключами: node scripts/generate-test.mjs <templateId> [сценарий]
// Гоняет ровно тот же код, что и сайт (createMouDocument, engine v2).
import { getBotClients } from "./google-bot.mjs";
import { createMouDocument } from "../lib/google/docs.js";
import { normalizeForm, calculate, buildFlags, buildReplacementsV2, buildDraftTitle } from "../lib/mou/core.js";
import { buildArticleNumbers, ARTICLE_DEFS_OFFPLAN_V2 } from "../lib/mou/articles.js";

const BASE = {
  agreementDate: "30/08/2026", reservationDeadline: "30/09/2026",
  projectName: "GARDENIA BAY", unitStatus: "Off-plan",
  developerName: "ALDAR DEVELOPMENT L.L.C – O.P.C",
  developerLegalName: "ALDAR PROPERTIES PJSC",
  escrowAccountName: "GARDENIA ESCROW ACCOUNT",
  propertyLocation: "Yas Island, Abu Dhabi", bedrooms: "2", areaM2: "95.5",
  propertyType: "Apartment", unitNumber: "GB-1204", parkingSpaces: "1",
  titleDeedNumber: "—",
  sellingPrice: "1,670,000", originalPrice: "1,494,050",
  paidAmountToDeveloper: "373,512.50", transferThresholdPercent: "25",
  admAdminFee: "575", transferFee: "4,000", transferFeeLabel: "Transfer Fee",
  buyerDefaultPenaltyAmount: "167,000", sellerDefaultPenaltyAmount: "167,000",
  agencyFeeSeller: "33,400", agencyFeeBuyer: "33,400",
  sellers: [{ salutation: "Mr.", name: "Ivan Petrov", nationality: "Russian Federation",
    passport: "722334455", eid: "784-1985-1234567-1", ownershipPercent: "100" }],
  buyers: [{ salutation: "Ms.", name: "Anna Ivanova", nationality: "Russian Federation",
    passport: "755667788", eid: "784-1990-7654321-2", ownershipPercent: "100" }],
  sellerAgentEnabled: "Yes", buyerAgentEnabled: "Yes",
  sellerAgentName: "PRIME BRIDGE REAL ESTATE BROKERAGE - L.L.C - S.P.C",
  sellerAgentRepresentative: "Mikhail Slobodchikov", sellerAgentLicense: "CN-6410679",
  sellerAgentAddress: "Office 6, Ar Raha 8 St, MUSAFFAH, Abu Dhabi, 20335",
  buyerAgentName: "S Q F REALTY REAL ESTATE MANAGEMENT - L.L.C - S.P.C",
  buyerAgentRepresentative: "Irina Germanovna Meidman", buyerAgentLicense: "CN-0000000",
  buyerAgentAddress: "Office 6, Ar Raha 8 St, MUSAFFAH, Abu Dhabi, 20335",
  buyerDepositEnabled: "Yes", buyerDepositCalcType: "percent", buyerDepositPercent: "10",
  buyerChequeNumber: "000123", buyerChequeDate: "30/08/2026",
  buyerChequeBank: "Emirates NBD", buyerChequeDrawnBy: "Anna Ivanova",
  buyerChequeInFavourOf: "PRIME BRIDGE REAL ESTATE BROKERAGE - L.L.C - S.P.C",
  sellerDepositEnabled: "Yes", sellerDepositCalcType: "percent", sellerDepositPercent: "10",
  sellerChequeNumber: "000456", sellerChequeDate: "30/08/2026",
  sellerChequeBank: "First Abu Dhabi Bank", sellerChequeDrawnBy: "Ivan Petrov",
  sellerChequeInFavourOf: "S Q F REALTY REAL ESTATE MANAGEMENT - L.L.C - S.P.C",
};

const SCENARIOS = {
  full: {},
  "no-deposits": { buyerDepositEnabled: "No", sellerDepositEnabled: "No" },
  "no-agents": { sellerAgentEnabled: "No", buyerAgentEnabled: "No" },
  "seller-agent-only": { buyerAgentEnabled: "No" },
};

const templateId = process.argv[2];
const key = process.argv[3] || "full";
if (!templateId) throw new Error("укажи ID шаблона");
if (!SCENARIOS[key]) throw new Error(`сценарии: ${Object.keys(SCENARIOS).join(", ")}`);

const { docs, drive } = getBotClients();
const form = { ...BASE, ...SCENARIOS[key] };
const data = normalizeForm(form);
const calc = calculate(data);
const flags = buildFlags(data, calc);
const numbers = buildArticleNumbers(data, [], ARTICLE_DEFS_OFFPLAN_V2);
const replacements = buildReplacementsV2(data, calc, numbers);

const doc = await createMouDocument({
  drive, docs, title: `ТЕСТ ${key} — ${buildDraftTitle(data)}`,
  data, rules: [], replacements, flags, templateId, engine: "v2",
});

console.log("сценарий:", key);
console.log("документ:", doc.url);
console.log(doc.remainingPlaceholders.length
  ? "НЕ ПОДСТАВЛЕНО: " + doc.remainingPlaceholders.join(", ")
  : "все плейсхолдеры подставлены");
