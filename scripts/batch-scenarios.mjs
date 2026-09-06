// Сценарии пакета договоров для проверки глазами.
// Используются в двух местах: generate-batch.mjs (генерация) и verify-batch.mjs (сверка).
// Для ипотечного шаблона (№2) те же сценарии, но с полями ADM-сборов — см. baseFor().

export const BASE = {
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

export const TWO_SELLERS = [
  { salutation: "Mr.", name: "Ivan Petrov", nationality: "Russian Federation",
    passport: "722334455", eid: "784-1985-1234567-1", ownershipPercent: "50" },
  { salutation: "Mrs.", name: "Maria Petrova", nationality: "Russian Federation",
    passport: "722334456", eid: "784-1987-7654321-2", ownershipPercent: "50" },
];
export const TWO_BUYERS = [
  { salutation: "Ms.", name: "Anna Ivanova", nationality: "Russian Federation",
    passport: "755667788", eid: "784-1990-7654321-2", ownershipPercent: "50" },
  { salutation: "Mr.", name: "Oleg Ivanov", nationality: "Russian Federation",
    passport: "755667789", eid: "784-1992-1111111-3", ownershipPercent: "50" },
];

// Ипотечный off-plan: ADM Fee считается сам (2% от Selling Price), две строки
// фиксированные (ответ Миши, 04.09.2026)
export const MORTGAGE_FIELDS = { admAdminFee: "", admElectronicFee: "1,392", admValuationFee: "925.75" };

// Готовый объект (№3): застройщику не платят, вместо Transfer Fee два NOC-сбора,
// свои суммы ADM, номер проекта и номер парковки, объект по умолчанию свободен
export const READY_FIELDS = {
  unitStatus: "Ready",
  admAdminFee: "", admElectronicFee: "919", admValuationFee: "1,037",
  developerNocFee: "2,750", communityNocFee: "1,050",
  projectNumber: "2023/278930", titleDeedNumber: "2026/0000", parkingSpaces: "B27",
  propertyRented: "No", annualRent: "150,000", tenancyEndDate: "12/12/2027",
  transferFeeLabel: "NOC Fee",
};

export function baseFor(mortgage, ready = false) {
  if (ready) return { ...BASE, ...READY_FIELDS };
  return mortgage ? { ...BASE, ...MORTGAGE_FIELDS } : BASE;
}

// Описание шаблона для formForTemplate: проверки должны считать форму так же,
// как сайт, иначе в пакет уезжает то, чего в договоре быть не может.
export function templateFor(mortgage, ready = false) {
  if (ready) return { engine: "v2", ready: true, articles: "ready-cash-v2" };
  if (mortgage) return { engine: "v2", mortgage: true, articles: "offplan-mortgage-v2" };
  return { engine: "v2", articles: "offplan-v2" };
}

// сценарии, которые есть только у готовых объектов
export const READY_SCENARIOS = [
  ["17 объект сдан в аренду", { propertyRented: "Yes" }],
  ["18 сдан в аренду и без депозитов", { propertyRented: "Yes", buyerDepositEnabled: "No", sellerDepositEnabled: "No" }],
];

export const SCENARIOS = [
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
  ["15 чек Продавца от третьего лица", { sellerChequeDrawnBy: "Olga Petrova", sellerChequeThirdParty: "Yes" }],
  ["16 оба чека от третьих лиц", {
    buyerChequeDrawnBy: "Sergey Kuznetsov", buyerChequeThirdParty: "Yes",
    sellerChequeDrawnBy: "Olga Petrova", sellerChequeThirdParty: "Yes" }],
];
