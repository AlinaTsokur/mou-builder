// Пакет договоров для проверки глазами: node scripts/generate-batch.mjs <templateId>
// Создаёт папку с датой внутри папки MOU и кладёт туда договор на каждый сценарий.
// Генерация — тем же кодом, что и сайт.
import { getBotClients } from "./google-bot.mjs";
import { createMouDocument } from "../lib/google/docs.js";
import { normalizeForm, calculate, buildFlags, buildReplacementsV2 } from "../lib/mou/core.js";
import { buildArticleNumbers, ARTICLE_DEFS_OFFPLAN_V2 } from "../lib/mou/articles.js";

const MOU_FOLDER = "1wAOozC2ofCV3Hsm16wdJoywK6_jvjZpm";

const BASE = {
  agreementDate: "31/08/2026", reservationDeadline: "30/09/2026",
  projectName: "GARDENIA BAY", unitStatus: "Off-plan",
  developerName: "ALDAR DEVELOPMENT L.L.C – O.P.C",
  developerLegalName: "ALDAR PROPERTIES PJSC",
  escrowAccountName: "GARDENIA ESCROW ACCOUNT",
  propertyLocation: "Yas Island, Abu Dhabi, UAE", bedrooms: "2BHK + M", areaM2: "95.50",
  propertyType: "Apartment", unitNumber: "GB-1204", parkingSpaces: "1", titleDeedNumber: "N/A",
  sellingPrice: "1,670,000", originalPrice: "1,494,050",
  paidAmountToDeveloper: "373,512.50", transferThresholdPercent: "30",
  admAdminFee: "575", transferFee: "4,000", transferFeeLabel: "Transfer Fee / NOC Fee",
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
  buyerDepositEnabled: "Yes", buyerDepositCalcType: "% of Selling Price", buyerDepositPercent: "10",
  buyerChequeNumber: "000123", buyerChequeDate: "31.08.2026",
  buyerChequeBank: "Emirates NBD", buyerChequeDrawnBy: "Anna Ivanova",
  buyerChequeInFavourOf: "Ivan Petrov",
  sellerDepositEnabled: "Yes", sellerDepositCalcType: "% of Selling Price", sellerDepositPercent: "10",
  sellerChequeNumber: "000456", sellerChequeDate: "31.08.2026",
  sellerChequeBank: "First Abu Dhabi Bank", sellerChequeDrawnBy: "Ivan Petrov",
  sellerChequeInFavourOf: "Anna Ivanova",
};

const TWO_SELLERS = [
  { salutation: "Mr.", name: "Ivan Petrov", nationality: "Russian Federation",
    passport: "722334455", eid: "784-1985-1234567-1", ownershipPercent: "50" },
  { salutation: "Mrs.", name: "Maria Petrova", nationality: "Russian Federation",
    passport: "722334456", eid: "784-1987-7654321-2", ownershipPercent: "50" },
];
const TWO_BUYERS = [
  { salutation: "Ms.", name: "Anna Ivanova", nationality: "Russian Federation",
    passport: "755667788", eid: "784-1990-7654321-2", ownershipPercent: "50" },
  { salutation: "Mr.", name: "Oleg Ivanov", nationality: "Russian Federation",
    passport: "755667789", eid: "784-1992-1111111-3", ownershipPercent: "50" },
];

const SCENARIOS = [
  ["01 всё включено, 1+1 собственник", {}],
  ["02 два продавца и два покупателя", { sellers: TWO_SELLERS, buyers: TWO_BUYERS }],
  ["03 продавец по доверенности", { sellers: [{ ...BASE.sellers[0],
    hasPoa: true, poaName: "Petr Sidorov", poaNationality: "Russian Federation",
    poaPassport: "700000001", poaEid: "784-1980-0000001-1" }] }],
  ["04 без депозитов (замена шаблона 1.2)", { buyerDepositEnabled: "No", sellerDepositEnabled: "No" }],
  ["05 депозит только у Покупателя", { sellerDepositEnabled: "No" }],
  ["06 депозит только у Продавца", { buyerDepositEnabled: "No" }],
  ["07 без агентств", { sellerAgentEnabled: "No", buyerAgentEnabled: "No" }],
  ["08 только агентство Продавца", { buyerAgentEnabled: "No" }],
  ["09 только агентство Покупателя", { sellerAgentEnabled: "No" }],
  ["10 комиссии выключены", { sellerAgentFeeEnabled: "No", buyerAgentFeeEnabled: "No" }],
  ["11 чек Покупателя будет позже", { buyerChequeTiming: "Delayed (within X days)", buyerChequeDays: "5" }],
  ["12 чек Покупателя от третьего лица", { buyerChequeDrawnBy: "Sergey Kuznetsov", buyerChequeThirdParty: "Yes" }],
  ["13 порог застройщику уже закрыт", { paidAmountToDeveloper: "500,000" }],
  ["14 депозит фиксированной суммой", {
    buyerDepositCalcType: "Fixed amount", buyerDepositFixedAmount: "150,000",
    sellerDepositCalcType: "Fixed amount", sellerDepositFixedAmount: "120,000" }],
];

const templateId = process.argv[2];
if (!templateId) throw new Error("укажи ID шаблона");

const { docs, drive } = getBotClients();

const stamp = new Date().toISOString().slice(0, 10);
const folder = await drive.files.create({
  requestBody: {
    name: `ТЕСТЫ ${stamp} — off-plan №1`,
    mimeType: "application/vnd.google-apps.folder",
    parents: [MOU_FOLDER],
  },
  fields: "id,webViewLink",
});
console.log("папка:", folder.data.webViewLink, "\n");

// createMouDocument кладёт копию в MOU_CONFIG.outputFolderId — переносим в папку тестов
for (const [name, over] of SCENARIOS) {
  const form = { ...BASE, ...over };
  const data = normalizeForm(form);
  const calc = calculate(data);
  const flags = buildFlags(data, calc);
  const numbers = buildArticleNumbers(data, [], ARTICLE_DEFS_OFFPLAN_V2);
  const replacements = buildReplacementsV2(data, calc, numbers);
  const doc = await createMouDocument({
    drive, docs, title: name, data, rules: [], replacements, flags, templateId, engine: "v2",
  });
  await drive.files.update({
    fileId: doc.id,
    addParents: folder.data.id,
    fields: "id",
  });
  const rest = doc.remainingPlaceholders.length ? `  ⚠ НЕ ПОДСТАВЛЕНО: ${doc.remainingPlaceholders.join(", ")}` : "";
  console.log(`${name}${rest}`);
}
console.log("\nготово");
