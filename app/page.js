"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileText,
  HelpCircle,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { ARTICLE_DEFS } from "@/lib/mou/articles";

const DEFAULT_AGENT = "PRIME BRIDGE REAL ESTATE BROKERAGE L.L.C";
const REQUIRED_FIELDS_BLOCKING = false;
const legacyArticleFields = {
  article_security_deposit_number: "includeArticle6",
  article_buyer_default_number: "includeArticle7",
  article_seller_default_number: "includeArticle8",
  article_deposit_release_number: "includeArticle9",
  article_automatic_extension_number: "includeArticle18",
};
const articleTips = {
  article_sale_offer_number: "Основное согласие: Seller продает, Buyer покупает объект.",
  article_effective_date_number: "Когда договор начинает действовать для сторон.",
  article_property_details_number: "Описание объекта: проект, юнит, площадь, спальни, парковка.",
  article_selling_price_number: "Фиксирует согласованную цену сделки.",
  article_payment_table_number: "Все платежи: seller, developer, fees, deposits, agency.",
  article_security_deposit_number: "Кто дает security cheque, сумма, банк и условия хранения.",
  article_buyer_default_number: "Что происходит, если Buyer не завершает сделку.",
  article_seller_default_number: "Что происходит, если Seller не завершает сделку.",
  article_deposit_release_number: "Когда и как можно вернуть или удержать security deposit.",
  article_termination_agreement_number: "Как стороны оформляют расторжение сделки.",
  article_buyer_own_funds_number: "Buyer подтверждает, что у него есть деньги на сделку.",
  article_seller_outstanding_charges_number: "Seller отвечает за долги и платежи до transfer date.",
  article_property_hold_number: "Seller держит объект за Buyer и не продает другим.",
  article_seller_documents_number: "Какие документы Seller должен предоставить для сделки.",
  article_spa_assignment_number: "Переуступка SPA и обязательств Buyer перед developer.",
  article_power_of_attorney_number: "Что делать, если сторона действует через POA.",
  article_reservation_period_number: "Крайний срок завершения transfer / assignment.",
  article_automatic_extension_number: "Когда срок может автоматически продлиться.",
  article_developer_approval_number: "Сделка зависит от approval / NOC / KYC developer.",
  article_force_majeure_number: "Что делать при событиях вне контроля сторон.",
  article_indemnity_number: "Кто покрывает убытки и претензии после сделки.",
  article_aml_number: "AML, KYC и compliance требования для сторон.",
  article_amicable_dispute_number: "Сначала стороны пытаются решить спор мирно.",
  article_court_jurisdiction_number: "Если спор не решен, куда обращаться в суд.",
  article_entire_agreement_number: "MOU заменяет предыдущие договоренности по сделке.",
  article_confidentiality_number: "Условия сделки нельзя раскрывать посторонним.",
  article_electronic_signature_number: "Электронная подпись имеет силу как обычная.",
};

const initialParty = () => ({
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
});

const initialForm = {
  agreementDate: "",
  reservationDeadline: "",
  projectName: "",
  unitStatus: "",
  developerName: "",
  developerLegalName: "",
  escrowAccountName: "",
  admAdminFee: "",
  transferFeeLabel: "",
  titleDeedNumber: "",
  propertyLocation: "",
  bedrooms: "",
  areaM2: "",
  propertyType: "",
  unitNumber: "",
  additionalInformation: "",
  parkingSpaces: "",
  sellers: [initialParty()],
  buyers: [initialParty()],
  originalPrice: "",
  sellingPrice: "",
  paidAmountToDeveloper: "",
  manualAmountToSeller: "No",
  amountToSeller: "",
  amountToSellerPaymentMethod: "",
  amountToSellerChequeInFavourOf: "",
  transferThresholdPercent: "",
  thresholdTopUpAmount: "",
  remainingDeveloperBalance: "",
  transferFee: "",
  sellerAgentName: DEFAULT_AGENT,
  buyerAgentName: DEFAULT_AGENT,
  agencyFeeSeller: "",
  agencyFeeBuyer: "",
  buyerDepositEnabled: "Yes",
  buyerDepositCalcType: "% of Selling Price",
  buyerDepositPercent: "",
  buyerDepositFixedAmount: "",
  buyerChequeNumber: "",
  buyerChequeDate: "",
  buyerChequeBank: "",
  buyerChequeDrawnBy: "",
  buyerChequeInFavourOf: "",
  sellerDepositEnabled: "Yes",
  sellerDepositCalcType: "% of Selling Price",
  sellerDepositPercent: "",
  sellerDepositFixedAmount: "",
  sellerChequeNumber: "",
  sellerChequeDate: "",
  sellerChequeBank: "",
  sellerChequeDrawnBy: "",
  sellerChequeInFavourOf: "",
  includeArticle6: true,
  includeArticle7: true,
  includeArticle8: true,
  includeArticle9: true,
  includeArticle18: true,
  excludedArticleKeys: [],
  sellerSignatureDate: "",
  buyerSignatureDate: "",
};

function pad2(value) {
  return String(value).padStart(2, "0");
}

function toDateInputValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return raw;

  const numeric = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (numeric) {
    const [, day, month, year] = numeric;
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
  }

  return "";
}

function fromDateInputValue(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function todayFormValue() {
  const today = new Date();
  return `${pad2(today.getDate())}/${pad2(today.getMonth() + 1)}/${today.getFullYear()}`;
}

function addReservationDays(startValue, daysValue, dayType) {
  const startIso = toDateInputValue(startValue);
  const days = Number(daysValue);

  if (!startIso || !Number.isFinite(days) || days < 0) return "";

  const date = new Date(`${startIso}T00:00:00`);

  if (dayType === "business") {
    let added = 0;
    while (added < days) {
      date.setDate(date.getDate() + 1);
      const day = date.getDay();
      if (day !== 0 && day !== 6) added += 1;
    }
  } else {
    date.setDate(date.getDate() + days);
  }

  return fromDateInputValue(`${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`);
}

const tips = {
  agreementDate: "Дата подписания MOU (договора). Можно писать в привычном формате, например 26.05.2026.",
  reservationDeadline: "Последний день, до которого стороны должны завершить transfer/assignment (передачу прав/переоформление). Можно выбрать конкретную дату или посчитать от Agreement Date по количеству дней.",
  reservationDeadlineMode: "Specific date (конкретная дата): выберите дату вручную. Calculate by days (посчитать по дням): укажите количество дней от Agreement Date.",
  reservationDays: "Количество дней от Agreement Date. Calendar days (календарные) считают все дни подряд. Business days (рабочие) пропускают субботу и воскресенье.",
  projectName: "Название проекта. Если выбрать из списка, developer (застройщик), fees (сборы) и другие данные подтянутся из PROJECTS.",
  unitStatus: "Ready (готовый объект) или Off-Plan (строящийся объект). От этого зависят ADM Admin Fee и Transfer/NOC Fee из таблицы PROJECTS.",
  developerName: "Короткое имя developer (застройщика), которое используется в тексте договора.",
  developerLegalName: "Полное юридическое имя developer (застройщика) для payment table (таблицы платежей) и transfer/NOC fee.",
  escrowAccountName: "Escrow account (эскроу-счет застройщика), куда Buyer (покупатель) платит суммы, связанные с developer. Если нет, оставьте пустым.",
  admAdminFee: "Административная часть ADM Fee (сбора Abu Dhabi Municipality). Обычно подставляется автоматически, но ее можно исправить вручную.",
  transferFeeLabel: "Название строки: Transfer Fee или NOC Fee.",
  titleDeedNumber: "Номер title deed (документа о праве собственности). Если для Off-Plan его нет, оставьте пустым.",
  propertyLocation: "Можно указать только остров/район, например Yas Island. Abu Dhabi, UAE добавится автоматически.",
  bedrooms: "Как должно быть в договоре: Studio, 1 Bedroom, 2 Bedrooms и т.д.",
  areaM2: "Площадь в квадратных метрах. Пишите как в документах по объекту.",
  propertyType: "Apartment, Villa, Townhouse и т.д.",
  unitNumber: "Unit number (номер объекта) из SPA или developer documents (документов застройщика).",
  additionalInformation: "Любая дополнительная информация по unit, если ее надо видеть в property details.",
  parkingSpaces: "Количество парковочных мест или текст из документа.",
  originalPrice: "Есть в MOU. Original Price (цена по SPA с застройщиком). Нужна для расчета developer balance (остатка застройщику).",
  sellingPrice: "Есть в MOU. Selling Price (цена сделки между Seller и Buyer). От нее считаются ADM Fee, agency fee и deposits.",
  paidAmountToDeveloper: "В MOU не печатается. Paid to Developer (уже оплачено застройщику) — сумма, которую Seller уже оплатил developer. Нужна только для расчета: сколько Buyer платит developer и сколько Seller.",
  manualAmountToSeller: "No (нет): приложение само считает Amount to Seller. Yes (да): приложение берет сумму, которую вы вручную ввели в поле ниже.",
  amountToSeller: "Есть в MOU. Amount to Seller (сумма Seller) — сколько Buyer реально платит Seller на transfer date. Автоматически: Selling Price минус все, что Buyer должен заплатить developer.",
  amountToSellerPaymentMethod: "Как Buyer оплатит сумму Seller на Transfer Date: Manager's Cheque, Cash или Manager's Cheque in favour of указанного имени.",
  amountToSellerChequeInFavourOf: "Имя/фамилия или компания, в пользу кого будет выписан Manager's Cheque для Seller.",
  transferThresholdPercent: "Есть в MOU. Transfer Threshold % (порог для передачи) — процент Original Price, который должен быть оплачен developer, чтобы получить transfer/assignment. Например 20, 30 или 40.",
  thresholdTopUpAmount: "Есть в MOU. Threshold Top-up (доплата до порога) — доплата developer, чтобы на transfer date было оплачено достаточно для передачи. Пример: Original Price 1,000,000, threshold 30%, уже оплачено 200,000. Нужно довести до 300,000, значит top-up = 100,000.",
  remainingDeveloperBalance: "Есть в MOU. Remaining Developer Balance (остаток рассрочки застройщику) — что Buyer будет платить developer уже после transfer по payment plan. Пример: Original Price 1,000,000, Seller уже оплатил 200,000, top-up 100,000. Остаток developer = 700,000.",
  transferFee: "Сумма Transfer/NOC Fee (сбор за передачу/NOC). Обычно подтягивается из PROJECTS, но можно изменить.",
  sellerAgentName: "Agency name (название агентства) со стороны Seller. По умолчанию PRIME BRIDGE.",
  buyerAgentName: "Agency name (название агентства) со стороны Buyer. По умолчанию PRIME BRIDGE.",
  agencyFeeSeller: "Agency Fee Seller (комиссия агентству со стороны Seller). Если пусто, софт считает auto 2.1% от Selling Price. Если в сделке другая сумма, введите ее вручную. Если комиссии Seller нет, введите 0.",
  agencyFeeBuyer: "Agency Fee Buyer (комиссия агентству со стороны Buyer). Если пусто, софт считает auto 2.1% от Selling Price. Если в сделке другая сумма, введите ее вручную. Для примера The Row нужно вручную 54,000, потому что это 1% от 5,400,000.",
  depositEnabled: "Yes (да): deposit и cheque details попадут в MOU. No (нет): строки по депозиту будут пустыми/исключенными.",
  depositCalcType: "% of Selling Price (процент от цены сделки) считает депозит от цены сделки. Fixed Amount (фиксированная сумма) берет введенную сумму.",
  depositPercent: "Процент deposit (депозита) от Selling Price, например 10.",
  depositFixedAmount: "Фиксированная сумма депозита, если выбран Fixed Amount.",
  chequeNumber: "Номер security deposit cheque (чека депозита).",
  chequeDate: "Дата cheque (чека).",
  chequeBank: "Банк, который выпустил cheque (чек).",
  chequeDrawnBy: "Drawn by (кем выписан чек).",
  chequeInFavourOf: "In favour of (в пользу кого выписан чек).",
  articles: "Если снять галочку, статья будет удалена из договора, а номера остальных статей пересчитаются.",
  signatureDate: "Если оставить пустым, будет использована Agreement Date.",
  partyName: "Полное имя стороны так, как должно быть в MOU.",
  nationality: "Nationality (гражданство) на английском, как в passport.",
  passport: "Passport number (номер паспорта). Если пусто, не попадет в party block.",
  eid: "Emirates ID (ID в ОАЭ). Если пусто, не попадет в party block.",
  ownershipPercent: "Ownership % (доля владения). Для Seller и Buyer отдельно сумма должна быть 100%.",
  poa: "Yes (да), если вместо стороны подписывает представитель по POA / Power of Attorney (доверенности).",
  salutation: "Обращение перед именем в тексте договора (например Mr., Mrs., Ms.).",
};

function hasValue(value) {
  return String(value ?? "").trim() !== "";
}

function makeSectionStatus(missing, optional = false) {
  if (optional) return { state: "optional", label: "Optional", missingCount: 0 };
  if (!missing.length) return { state: "complete", label: "Complete", missingCount: 0 };
  return { state: "missing", label: `Needs info (${missing.length})`, missingCount: missing.length };
}

function missingFields(source, fields) {
  return fields.filter(([key]) => !hasValue(source[key])).map(([, label]) => label);
}

function partySectionStatus(parties) {
  const missing = [];
  const list = Array.isArray(parties) ? parties : [];

  if (!list.length) missing.push("At least one party");

  list.forEach((party, index) => {
    const label = `Party ${index + 1}`;
    if (!hasValue(party.name)) missing.push(`${label}: Name`);
    if (!hasValue(party.nationality)) missing.push(`${label}: Nationality`);
    if (!hasValue(party.passport)) missing.push(`${label}: Passport`);
    if (!hasValue(party.ownershipPercent)) missing.push(`${label}: Ownership %`);
    if (party.hasPoa) {
      if (!hasValue(party.poaName)) missing.push(`${label}: POA Name`);
      if (!hasValue(party.poaPassport)) missing.push(`${label}: POA Passport`);
    }
  });

  const total = list.reduce((sum, party) => sum + (Number(String(party.ownershipPercent || "").replace(",", ".")) || 0), 0);
  if (Math.round(total * 100) / 100 !== 100) missing.push("Ownership total 100%");

  return makeSectionStatus(missing);
}

function depositSectionStatus(form, side) {
  const enabled = form[`${side}DepositEnabled`] === "Yes";
  if (!enabled) return makeSectionStatus([]);

  const calcType = String(form[`${side}DepositCalcType`] || "");
  const missing = [];

  if (!hasValue(calcType)) missing.push("Calculation Type");
  if (calcType.includes("Fixed")) {
    if (!hasValue(form[`${side}DepositFixedAmount`])) missing.push("Fixed Amount");
  } else if (!hasValue(form[`${side}DepositPercent`])) {
    missing.push("Deposit %");
  }

  [
    [`${side}ChequeNumber`, "Cheque No."],
    [`${side}ChequeDate`, "Cheque Date"],
    [`${side}ChequeBank`, "Cheque Bank"],
    [`${side}ChequeDrawnBy`, "Drawn by"],
    [`${side}ChequeInFavourOf`, "In favour of"],
  ].forEach(([key, label]) => {
    if (!hasValue(form[key])) missing.push(label);
  });

  return makeSectionStatus(missing);
}

function buildSectionStatuses(form, reservationMode, reservationDays) {
  const agreementMissing = missingFields(form, [
    ["agreementDate", "Agreement Date"],
    ["reservationDeadline", "Reservation Deadline"],
  ]);
  if (reservationMode === "days" && !hasValue(reservationDays)) agreementMissing.push("Reservation Period Days");

  const paymentsRequired = [
    ["originalPrice", "Original Price"],
    ["sellingPrice", "Selling Price"],
    ["paidAmountToDeveloper", "Paid to Developer"],
    ["transferThresholdPercent", "Transfer Threshold %"],
    ["transferFee", "Transfer / NOC Fee"],
  ];
  if (form.manualAmountToSeller === "Yes") paymentsRequired.push(["amountToSeller", "Amount to Seller"]);
  paymentsRequired.push(["amountToSellerPaymentMethod", "Amount to Seller Payment Method"]);
  if (form.amountToSellerPaymentMethod === "manager_cheque_in_favour") {
    paymentsRequired.push(["amountToSellerChequeInFavourOf", "Cheque in favour of"]);
  }

  return {
    agreement: makeSectionStatus(agreementMissing),
    project: makeSectionStatus(missingFields(form, [
      ["projectName", "Project"],
      ["unitStatus", "Unit Status"],
      ["developerName", "Developer Name"],
      ["developerLegalName", "Developer Legal Name"],
      ["escrowAccountName", "Escrow Account Name"],
      ["admAdminFee", "ADM Admin Fee"],
      ["transferFeeLabel", "Transfer Fee Label"],
    ])),
    property: makeSectionStatus(missingFields(form, [
      ["propertyLocation", "Property Location"],
      ["bedrooms", "Bedrooms"],
      ["areaM2", "Area"],
      ["propertyType", "Property Type"],
      ["unitNumber", "Unit Number"],
    ])),
    sellers: partySectionStatus(form.sellers),
    buyers: partySectionStatus(form.buyers),
    payments: makeSectionStatus(missingFields(form, paymentsRequired)),
    agency: makeSectionStatus(missingFields(form, [
      ["sellerAgentName", "Seller Agent"],
      ["buyerAgentName", "Buyer Agent"],
    ])),
    buyerDeposit: depositSectionStatus(form, "buyer"),
    sellerDeposit: depositSectionStatus(form, "seller"),
    articles: makeSectionStatus([]),
    signatures: makeSectionStatus([], true),
  };
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const [form, setForm] = useState(initialForm);
  const [init, setInit] = useState({ projects: [], lists: {}, drafts: [], rules: [] });
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loadingInit, setLoadingInit] = useState(false);
  const [message, setMessage] = useState("");
  const [actionErrors, setActionErrors] = useState([]);
  const [result, setResult] = useState(null);
  const [draftRow, setDraftRow] = useState("");
  const [reservationMode, setReservationMode] = useState("date");
  const [reservationDays, setReservationDays] = useState("");
  const [reservationDayType, setReservationDayType] = useState("calendar");

  useEffect(() => {
    if (status === "authenticated") loadInit();
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const handle = setTimeout(() => updatePreview(), 350);
    return () => clearTimeout(handle);
  }, [form, status]);

  useEffect(() => {
    if (reservationMode !== "days") return;
    const agreementDate = form.agreementDate || todayFormValue();
    const reservationDeadline = reservationDays
      ? addReservationDays(agreementDate, reservationDays, reservationDayType)
      : "";

    if (form.agreementDate !== agreementDate || form.reservationDeadline !== reservationDeadline) {
      setForm((current) => ({
        ...current,
        agreementDate,
        reservationDeadline,
      }));
    }
  }, [reservationMode, reservationDays, reservationDayType, form.agreementDate, form.reservationDeadline]);

  useEffect(() => {
    const bothDepositsDisabled = form.buyerDepositEnabled === "No" && form.sellerDepositEnabled === "No";
    if (!bothDepositsDisabled || !form.includeArticle6) return;
    setForm((current) => ({ ...current, includeArticle6: false }));
  }, [form.buyerDepositEnabled, form.sellerDepositEnabled, form.includeArticle6]);

  useEffect(() => {
    if (String(form.unitStatus || "").toLowerCase() !== "ready") return;
    if (String(form.transferFeeLabel || "").toLowerCase().includes("noc")) return;
    setForm((current) => ({ ...current, transferFeeLabel: "NOC Fee" }));
  }, [form.unitStatus, form.transferFeeLabel]);

  const lists = init.lists || {};
  const projectNames = useMemo(() => init.projects.map((p) => p.project_name).filter(Boolean), [init.projects]);
  const sectionStatuses = useMemo(
    () => buildSectionStatuses(form, reservationMode, reservationDays),
    [form, reservationMode, reservationDays],
  );

  async function api(path, options = {}) {
    const res = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    const data = await res.json();
    if (!res.ok || data.ok === false) {
      const err = new Error(data.error || data.validation?.errors?.join("\n") || "Request failed");
      err.payload = data;
      throw err;
    }
    return data;
  }

  async function loadInit() {
    setLoadingInit(true);
    setMessage("Loading data from Google Sheets...");
    try {
      const data = await api("/api/init");
      setInit(data);
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoadingInit(false);
    }
  }

  async function updatePreview() {
    try {
      const data = await api("/api/preview", { method: "POST", body: JSON.stringify(form) });
      setPreview(data.preview);
    } catch (error) {
      setPreview({ validation: { errors: [error.message], warnings: [] } });
    }
  }

  async function createMou() {
    setBusy(true);
    setResult(null);
    setActionErrors([]);
    setMessage("Creating MOU...");
    try {
      const data = await api("/api/mou", { method: "POST", body: JSON.stringify(form) });
      setResult(data);
      setMessage("MOU created");
      await loadInit();
    } catch (error) {
      const validation = error.payload?.validation;
      if (validation) {
        setPreview((current) => ({ ...(current || {}), validation }));
        setActionErrors(validation.errors || [error.message]);
      } else {
        setActionErrors([error.message]);
      }
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function loadDraft() {
    if (!draftRow) return;
    setBusy(true);
    setMessage("Loading draft...");
    try {
      const data = await api(`/api/drafts/${draftRow}`);
      setForm({ ...initialForm, ...data.form });
      setResult(null);
      setMessage("Draft loaded");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  function patch(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleArticle(key, included) {
    setForm((current) => {
      const excluded = new Set(current.excludedArticleKeys || []);
      if (included) {
        excluded.delete(key);
      } else {
        excluded.add(key);
      }

      const next = {
        ...current,
        excludedArticleKeys: Array.from(excluded),
      };
      const legacyField = legacyArticleFields[key];
      if (legacyField) next[legacyField] = included;
      return next;
    });
  }

  function setAgreementDate(value) {
    setForm((current) => {
      const next = { ...current, agreementDate: value };
      if (reservationMode === "days") {
        next.reservationDeadline = addReservationDays(value, reservationDays, reservationDayType);
      }
      return next;
    });
  }

  function updateReservationByDays(daysValue = reservationDays, dayTypeValue = reservationDayType) {
    setForm((current) => ({
      ...current,
      agreementDate: current.agreementDate || todayFormValue(),
      reservationDeadline: daysValue
        ? addReservationDays(current.agreementDate || todayFormValue(), daysValue, dayTypeValue)
        : "",
    }));
  }

  function changeReservationMode(value) {
    setReservationMode(value);
    if (value === "days") updateReservationByDays(reservationDays, reservationDayType);
  }

  function changeReservationDays(value) {
    setReservationDays(value);
    updateReservationByDays(value, reservationDayType);
  }

  function changeReservationDayType(value) {
    setReservationDayType(value);
    updateReservationByDays(reservationDays, value);
  }

  function applyProjectData(value = form.projectName, statusValue = form.unitStatus, options = {}) {
    const found = init.projects.find((p) => String(p.project_name || "").toLowerCase() === String(value || "").toLowerCase());
    if (!found) return;
    setForm((current) => ({
      ...current,
      projectName: value,
      propertyLocation: options.syncLocation ? found.location || current.propertyLocation : current.propertyLocation,
      developerName: found.developer_name || "",
      developerLegalName: found.developer_legal_name || "",
      escrowAccountName: found.escrow_account_name || "",
      transferFeeLabel: found.transfer_fee_label || "",
      admAdminFee:
        statusValue === "Ready"
          ? found.adm_admin_fee_ready || current.admAdminFee
          : statusValue === "Off-Plan"
            ? found.adm_admin_fee_off_plan || current.admAdminFee
            : current.admAdminFee,
      transferFee:
        statusValue === "Ready"
          ? found.transfer_fee_ready || current.transferFee
          : statusValue === "Off-Plan"
            ? found.transfer_fee_off_plan || current.transferFee
            : current.transferFee,
    }));
  }

  if (status === "loading") return <FullScreenLoader text="Checking Google session..." />;

  if (status !== "authenticated") {
    return (
      <main className="login">
        <section className="loginPanel">
          <FileText size={40} />
          <h1>MOU Builder</h1>
          <p>Войдите через рабочий Google-аккаунт, чтобы читать таблицу, создавать Google Docs и сохранять draft log.</p>
          <button className="primary" onClick={() => signIn("google")}>Sign in with Google</button>
        </section>
      </main>
    );
  }

  return (
    <main className="appShell">
      <header className="topbar">
        <div>
          <h1>MOU Builder</h1>
          <p>{session?.user?.email}</p>
        </div>
        <div className="topActions">
          <CustomSelect
            id="draftRow"
            value={draftRow}
            options={[
              { value: "", label: "Existing Draft" },
              ...(init.drafts || []).map((draft) => ({ value: draft.rowNumber, label: draft.label })),
            ]}
            onChange={setDraftRow}
          />
          <button className="secondary" onClick={loadDraft} disabled={!draftRow || busy}>Load Draft</button>
          <button className="secondary iconText" onClick={loadInit} disabled={loadingInit}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="ghost" onClick={() => signOut()}>Sign out</button>
        </div>
      </header>

      {message && <StatusLine text={message} type={message.includes("created") || message.includes("loaded") ? "ok" : actionErrors.length ? "error" : "info"} />}
      {result && <ResultBox result={result} />}
      {actionErrors.length ? <ActionErrorBox errors={actionErrors} /> : null}

      <div className="workspace">
        <form className="formPanel" onSubmit={(e) => e.preventDefault()}>
          <Section title="Agreement" status={sectionStatuses.agreement}>
            <DateField id="agreementDate" label="Agreement Date" tip={tips.agreementDate} value={form.agreementDate} onChange={(_, value) => setAgreementDate(value)} />
            <SelectField
              id="reservationMode"
              label="Reservation Deadline Mode"
              tip={tips.reservationDeadlineMode}
              value={reservationMode}
              onChange={(_, value) => changeReservationMode(value)}
              options={[
                { value: "date", label: "Specific date" },
                { value: "days", label: "Calculate by days" },
              ]}
            />
            {reservationMode === "date" ? (
              <DateField id="reservationDeadline" label="Reservation Deadline" tip={tips.reservationDeadline} value={form.reservationDeadline} onChange={patch} />
            ) : (
              <>
                <Field id="reservationDays" label="Reservation Period Days" tip={tips.reservationDays} value={reservationDays} onChange={(_, value) => changeReservationDays(value)} placeholder="Например 30" />
                <SelectField
                  id="reservationDayType"
                  label="Day Type"
                  tip={tips.reservationDays}
                  value={reservationDayType}
                  onChange={(_, value) => changeReservationDayType(value)}
                  options={[
                    { value: "calendar", label: "Calendar days" },
                    { value: "business", label: "Business days" },
                  ]}
                />
                <DateField id="reservationDeadline" label="Reservation Deadline" tip={tips.reservationDeadline} value={form.reservationDeadline} onChange={patch} />
              </>
            )}
          </Section>

          <Section title="Project / Developer" status={sectionStatuses.project}>
            <Field id="projectName" label="Project" tip={tips.projectName} value={form.projectName} onChange={(id, value) => { patch(id, value); applyProjectData(value, form.unitStatus, { syncLocation: true }); }} list="projectsList" options={projectNames} />
            <SelectField id="unitStatus" label="Unit Status" tip={tips.unitStatus} value={form.unitStatus} onChange={(id, value) => { patch(id, value); applyProjectData(form.projectName, value); }} options={["", "Off-Plan", "Ready"]} />
            <Field id="developerName" label="Developer Name" tip={tips.developerName} value={form.developerName} onChange={patch} />
            <Field id="developerLegalName" label="Developer Legal Name" tip={tips.developerLegalName} value={form.developerLegalName} onChange={patch} />
            <Field id="escrowAccountName" label="Escrow Account Name" tip={tips.escrowAccountName} value={form.escrowAccountName} onChange={patch} />
            <Field id="admAdminFee" label="ADM Admin Fee" tip={tips.admAdminFee} value={form.admAdminFee} onChange={patch} />
            <Field id="transferFeeLabel" label="Transfer Fee Label" tip={tips.transferFeeLabel} value={form.transferFeeLabel} onChange={patch} />
          </Section>

          <Section title="Property" status={sectionStatuses.property}>
            <Field id="titleDeedNumber" label="Title Deed Number" tip={tips.titleDeedNumber} value={form.titleDeedNumber} onChange={patch} />
            <Field id="propertyLocation" label="Property Location / Island" tip={tips.propertyLocation} value={form.propertyLocation} onChange={patch} />
            <Field id="bedrooms" label="Bedrooms" tip={tips.bedrooms} value={form.bedrooms} onChange={patch} list="bedroomsList" options={lists.bedroom || []} />
            <Field id="areaM2" label="Area, sq.m" tip={tips.areaM2} value={form.areaM2} onChange={patch} />
            <Field id="propertyType" label="Property Type" tip={tips.propertyType} value={form.propertyType} onChange={patch} list="propertyTypesList" options={lists.property_types || []} />
            <Field id="unitNumber" label="Unit Number" tip={tips.unitNumber} value={form.unitNumber} onChange={patch} />
            <Field id="parkingSpaces" label="Parking Spaces" tip={tips.parkingSpaces} value={form.parkingSpaces} onChange={patch} />
            <Field id="additionalInformation" label="Additional Information" tip={tips.additionalInformation} value={form.additionalInformation} onChange={patch} />
          </Section>

          <PartySection title="Seller" type="sellers" parties={form.sellers} setForm={setForm} lists={lists} status={sectionStatuses.sellers} />
          <PartySection title="Buyer" type="buyers" parties={form.buyers} setForm={setForm} lists={lists} status={sectionStatuses.buyers} />

          <Section title="Payments" status={sectionStatuses.payments}>
            <Field id="originalPrice" label="Original Price from SPA" tip={tips.originalPrice} value={form.originalPrice} onChange={patch} />
            <Field id="sellingPrice" label="Selling Price agreed by Parties" tip={tips.sellingPrice} value={form.sellingPrice} onChange={patch} />
            <Field id="paidAmountToDeveloper" label="Paid to Developer" tip={tips.paidAmountToDeveloper} value={form.paidAmountToDeveloper} onChange={patch} placeholder="Например 600,000" />
            <SelectField id="manualAmountToSeller" label="Manual Amount to Seller?" tip={tips.manualAmountToSeller} value={form.manualAmountToSeller} onChange={patch} options={["No", "Yes"]} />
            {form.manualAmountToSeller === "Yes" ? (
              <Field id="amountToSeller" label="Amount to be paid to Seller" tip={tips.amountToSeller} value={form.amountToSeller} onChange={patch} placeholder="Введите сумму вручную" />
            ) : (
              <Field id="amountToSellerAuto" label="Amount to be paid to Seller" tip={tips.amountToSeller} value={preview?.summary?.amountToSeller ? `AED ${preview.summary.amountToSeller}` : ""} onChange={() => {}} placeholder="Посчитается автоматически" readOnly />
            )}
            <SelectField
              id="amountToSellerPaymentMethod"
              label="Amount to Seller Payment Method"
              tip={tips.amountToSellerPaymentMethod}
              value={form.amountToSellerPaymentMethod}
              onChange={patch}
              options={[
                { value: "", label: "Select..." },
                { value: "manager_cheque", label: "Manager's Cheque" },
                { value: "cash", label: "Cash" },
                { value: "manager_cheque_in_favour", label: "Manager's Cheque issued in favour of..." },
              ]}
            />
            {form.amountToSellerPaymentMethod === "manager_cheque_in_favour" ? (
              <Field
                id="amountToSellerChequeInFavourOf"
                label="Cheque in favour of"
                tip={tips.amountToSellerChequeInFavourOf}
                value={form.amountToSellerChequeInFavourOf}
                onChange={patch}
                placeholder="Введите имя и фамилию"
              />
            ) : null}
            <Field id="transferThresholdPercent" label="Transfer Threshold %" tip={tips.transferThresholdPercent} value={form.transferThresholdPercent} onChange={patch} list="thresholdList" options={lists.transfer_threshold_percent || []} />
            <AutoMoneyField id="thresholdTopUpAmount" label="Threshold Top-up to Developer" tip={tips.thresholdTopUpAmount} value={form.thresholdTopUpAmount} autoValue={preview?.summary?.thresholdTopUpAmount} onChange={patch} placeholder="Посчитается автоматически" />
            <AutoMoneyField id="remainingDeveloperBalance" label="Remaining Developer Balance" tip={tips.remainingDeveloperBalance} value={form.remainingDeveloperBalance} autoValue={preview?.summary?.remainingDeveloperBalance} onChange={patch} placeholder="Посчитается автоматически" />
            <Field id="transferFee" label="Transfer / NOC Fee" tip={tips.transferFee} value={form.transferFee} onChange={patch} />
          </Section>

          <Section title="Agency" status={sectionStatuses.agency}>
            <Field id="sellerAgentName" label="Seller Agent" tip={tips.sellerAgentName} value={form.sellerAgentName} onChange={patch} list="agentsList" options={lists.agent || []} />
            <Field id="buyerAgentName" label="Buyer Agent" tip={tips.buyerAgentName} value={form.buyerAgentName} onChange={patch} list="agentsList" options={lists.agent || []} />
            <AutoMoneyField id="agencyFeeSeller" label="Agency Fee Seller" tip={tips.agencyFeeSeller} value={form.agencyFeeSeller} autoValue={preview?.summary?.agencyFeeSeller} onChange={patch} placeholder="Пусто = auto 2.1%, 0 = нет комиссии" />
            <AutoMoneyField id="agencyFeeBuyer" label="Agency Fee Buyer" tip={tips.agencyFeeBuyer} value={form.agencyFeeBuyer} autoValue={preview?.summary?.agencyFeeBuyer} onChange={patch} placeholder="Пусто = auto 2.1%, можно вручную" />
          </Section>

          <DepositSection side="buyer" title="Security Deposit - Buyer" form={form} patch={patch} lists={lists} status={sectionStatuses.buyerDeposit} preview={preview} />
          <DepositSection side="seller" title="Security Deposit - Seller" form={form} patch={patch} lists={lists} status={sectionStatuses.sellerDeposit} preview={preview} />

          <Section title="Articles" status={sectionStatuses.articles}>
            {form.buyerDepositEnabled === "No" && form.sellerDepositEnabled === "No" ? (
              <p className="smallNote">Оба security cheque отключены: Article 6 снимается автоматически.</p>
            ) : null}
            {ARTICLE_DEFS.map(([key, originalNumber, title]) => (
              <CheckboxField
                key={key}
                id={key}
                label={`Include Article ${originalNumber} - ${title}`}
                tip={articleTips[key] || tips.articles}
                checked={isArticleIncluded(form, key)}
                onChange={(_, checked) => toggleArticle(key, checked)}
                disabled={key === "article_security_deposit_number" && form.buyerDepositEnabled === "No" && form.sellerDepositEnabled === "No"}
              />
            ))}
          </Section>

          <Section title="Signatures" status={sectionStatuses.signatures}>
            <DateField id="sellerSignatureDate" label="Seller Signature Date" tip={tips.signatureDate} value={form.sellerSignatureDate} onChange={patch} />
            <DateField id="buyerSignatureDate" label="Buyer Signature Date" tip={tips.signatureDate} value={form.buyerSignatureDate} onChange={patch} />
          </Section>
        </form>

        <aside className="previewPanel">
          <div className="previewHeader">
            <div>
              <h2>Preview Summary</h2>
              <p>Это проверочный summary. Финальный текст берется из Google Doc-шаблона.</p>
            </div>
            <button className="primary iconText" onClick={createMou} disabled={busy || loadingInit}>
              {busy ? <Loader2 className="spin" size={16} /> : <FileText size={16} />} Create MOU
            </button>
          </div>
          {actionErrors.length ? <Notice title="MOU was not created" items={actionErrors} type="error" /> : null}
          <Preview preview={preview} />
        </aside>
      </div>
    </main>
  );
}

function FullScreenLoader({ text }) {
  return <main className="login"><section className="loginPanel"><Loader2 className="spin" /><p>{text}</p></section></main>;
}

function StatusLine({ text, type }) {
  return <div className={`status ${type}`}>{type === "ok" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {text}</div>;
}

function ActionErrorBox({ errors }) {
  return (
    <section className="actionErrorBox">
      <strong>MOU was not created</strong>
      <ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul>
    </section>
  );
}

function ResultBox({ result }) {
  return (
    <section className="resultBox">
      <div>
        <strong>MOU created</strong>
        <p>{result.title}</p>
        {result.remainingPlaceholders?.length ? <p className="warningText">Остались placeholders: {result.remainingPlaceholders.join(", ")}</p> : null}
      </div>
      <a className="openDoc" href={result.url} target="_blank" rel="noreferrer">
        Open Google Doc <ExternalLink size={18} />
      </a>
    </section>
  );
}

function Section({ title, children, status, grid = true, className = "" }) {
  const [open, setOpen] = useState(true);
  const statusState = status?.state || "optional";
  const statusLabel = status?.label || "Optional";

  return (
    <section className={`section ${className} ${open ? "" : "collapsed"}`}>
      <button className="sectionTitle" type="button" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <span className={`sectionChevron ${open ? "open" : ""}`}><ChevronDown size={16} /></span>
        <span className="sectionName">{title}</span>
        <span className={`sectionStatus ${statusState}`}>{statusLabel}</span>
      </button>
      {open && <div className={grid ? "grid" : "sectionBody"}>{children}</div>}
    </section>
  );
}

function Label({ label, tip }) {
  return (
    <label>
      <span>{label}</span>
      <Tooltip text={tip} />
    </label>
  );
}

function Tooltip({ text }) {
  const iconRef = useRef(null);
  const [bubble, setBubble] = useState(null);

  function showBubble() {
    const rect = iconRef.current?.getBoundingClientRect();
    if (!rect) return;

    const width = Math.min(320, window.innerWidth - 24);
    const left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, 12), window.innerWidth - width - 12);
    const preferredTop = rect.top - 12;
    const top = preferredTop > 110 ? preferredTop : rect.bottom + 12;

    setBubble({
      width,
      left,
      top,
      placement: preferredTop > 110 ? "above" : "below",
    });
  }

  function hideBubble() {
    setBubble(null);
  }

  return (
    <span
      ref={iconRef}
      className="tooltip"
      tabIndex={0}
      onMouseEnter={showBubble}
      onMouseOver={showBubble}
      onMouseLeave={hideBubble}
      onFocus={showBubble}
      onBlur={hideBubble}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (bubble) {
          hideBubble();
        } else {
          showBubble();
        }
      }}
    >
      <HelpCircle size={15} />
      {bubble && (
        <span
          className={`tooltipBubble ${bubble.placement}`}
          style={{
            width: bubble.width,
            left: bubble.left,
            top: bubble.top,
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

function Field({ id, label, tip, value, onChange, list, options, placeholder, readOnly = false }) {
  return (
    <div className="field">
      <Label label={label} tip={tip} />
      {options?.length ? (
        <ComboInput id={id} value={value || ""} options={options} onChange={(next) => onChange(id, next)} />
      ) : (
        <input
          id={id}
          value={value || ""}
          placeholder={placeholder || ""}
          readOnly={readOnly}
          className={readOnly ? "readOnlyInput" : ""}
          onChange={(e) => onChange(id, e.target.value)}
        />
      )}
    </div>
  );
}

function AutoMoneyField({ id, label, tip, value, autoValue, onChange, placeholder }) {
  const hasManualValue = String(value || "").trim() !== "";
  const hasAutoValue = String(autoValue || "").trim() !== "";
  const displayValue = hasManualValue ? value : hasAutoValue ? `AED ${autoValue}` : "";

  return (
    <div className="field">
      <Label label={label} tip={tip} />
      <input
        id={id}
        value={displayValue}
        placeholder={placeholder || ""}
        className={!hasManualValue && hasAutoValue ? "autoCalculatedInput" : ""}
        onFocus={(event) => {
          if (!hasManualValue && hasAutoValue) event.target.select();
        }}
        onChange={(event) => onChange(id, event.target.value)}
      />
    </div>
  );
}

function DateField({ id, label, tip, value, onChange }) {
  return (
    <div className="field">
      <Label label={label} tip={tip} />
      <input
        id={id}
        type="date"
        value={toDateInputValue(value)}
        onChange={(event) => onChange(id, fromDateInputValue(event.target.value))}
      />
    </div>
  );
}

function SelectField({ id, label, tip, value, onChange, options }) {
  return (
    <div className="field">
      <Label label={label} tip={tip} />
      <CustomSelect id={id} value={value || ""} options={options} onChange={(next) => onChange(id, next)} />
    </div>
  );
}

function normalizeSelectOption(option) {
  if (typeof option === "string") {
    return {
      value: option,
      label: option || "Select...",
    };
  }

  return {
    value: option.value,
    label: option.label || option.value || "Select...",
  };
}

function CustomSelect({ id, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const normalizedOptions = options.map(normalizeSelectOption);
  const menuOptions = normalizedOptions.filter((option) => String(option.value) !== "");
  const selected = normalizedOptions.find((option) => String(option.value) === String(value)) || normalizedOptions[0];

  function choose(nextValue) {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div className="selectWrap" onBlur={() => window.setTimeout(() => setOpen(false), 120)}>
      <button
        id={id}
        className={`selectButton ${open ? "open" : ""}`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span>{selected?.label || "Select..."}</span>
        <ChevronDown size={16} />
      </button>

      {open && (
        <div className="selectMenu" role="listbox" aria-labelledby={id}>
          {menuOptions.length ? menuOptions.map((option) => {
            const isSelected = String(option.value) === String(value);

            return (
              <button
                key={`${id}-${option.value}`}
                className={`selectOption ${isSelected ? "selected" : ""}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option.value)}
              >
                {option.label}
              </button>
            );
          }) : <div className="comboEmpty">No options</div>}
        </div>
      )}
    </div>
  );
}

function CheckboxField({ id, label, tip, checked, onChange, disabled = false }) {
  return (
    <div className="checkField">
      <input id={id} type="checkbox" checked={Boolean(checked)} disabled={disabled} onChange={(e) => onChange(id, e.target.checked)} />
      <Label label={label} tip={tip} />
    </div>
  );
}

function ComboInput({ id, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const normalized = String(value || "").trim().toLowerCase();
  const filtered = normalized
    ? options.filter((option) => String(option).toLowerCase().includes(normalized))
    : options;

  return (
    <div className="combo" onBlur={() => window.setTimeout(() => setOpen(false), 120)}>
      <input
        id={id}
        value={value || ""}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      />
      <button className="comboToggle" type="button" aria-label="Open options" onMouseDown={(e) => e.preventDefault()} onClick={() => setOpen((current) => !current)}>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className="comboMenu" role="listbox">
          {filtered.length ? (
            filtered.map((option) => (
              <button
                key={`${id}-${option}`}
                className="comboOption"
                type="button"
                role="option"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
              >
                {option}
              </button>
            ))
          ) : (
            <div className="comboEmpty">No matches</div>
          )}
        </div>
      )}
    </div>
  );
}

function PartySection({ title, type, parties, setForm, lists, status }) {
  function setParty(index, key, value) {
    setForm((current) => ({
      ...current,
      [type]: current[type].map((party, i) => (i === index ? { ...party, [key]: value } : party)),
    }));
  }

  function addParty() {
    setForm((current) => ({ ...current, [type]: rebalance([...current[type], initialParty()]) }));
  }

  function removeParty(index) {
    setForm((current) => ({ ...current, [type]: rebalance(current[type].filter((_, i) => i !== index)) }));
  }

  const total = parties.reduce((sum, p) => sum + (Number(String(p.ownershipPercent || "").replace(",", ".")) || 0), 0);

  return (
    <Section title={title} status={status} grid={false} className="full">
      {parties.map((party, index) => (
        <div className="partyCard" key={`${type}-${index}`}>
          <div className="partyHead">
            <h3>{title} {index + 1}</h3>
            {parties.length > 1 && <button className="danger iconText" type="button" onClick={() => removeParty(index)}><Trash2 size={15} /> Remove</button>}
          </div>
          <div className="grid">
            <SelectField
              id={`${type}-${index}-salutation`}
              label="Title"
              tip={tips.salutation}
              value={party.salutation || ""}
              onChange={(_, v) => setParty(index, "salutation", v)}
              options={[
                { value: "", label: "Select..." },
                "Mr.",
                "Mrs.",
                "Ms.",
              ]}
            />
            <Field id={`${type}-${index}-name`} label="Name" tip={tips.partyName} value={party.name} onChange={(_, v) => setParty(index, "name", v)} />
            <Field id={`${type}-${index}-nationality`} label="Nationality" tip={tips.nationality} value={party.nationality} onChange={(_, v) => setParty(index, "nationality", v)} list={`${type}-${index}-nationalities`} options={lists.nationalities || []} />
            <Field id={`${type}-${index}-passport`} label="Passport" tip={tips.passport} value={party.passport} onChange={(_, v) => setParty(index, "passport", v)} />
            <Field id={`${type}-${index}-eid`} label="EID" tip={tips.eid} value={party.eid} onChange={(_, v) => setParty(index, "eid", v)} />
            <Field id={`${type}-${index}-ownership`} label="Ownership %" tip={tips.ownershipPercent} value={party.ownershipPercent} onChange={(_, v) => setParty(index, "ownershipPercent", v)} list={`${type}-${index}-ownerships`} options={lists.ownership_percent || []} />
            <SelectField id={`${type}-${index}-poa`} label="POA?" tip={tips.poa} value={party.hasPoa ? "Yes" : "No"} onChange={(_, v) => setParty(index, "hasPoa", v === "Yes")} options={["No", "Yes"]} />
          </div>
          {party.hasPoa && (
            <div className="grid poaGrid">
              <Field id={`${type}-${index}-poaName`} label="POA Name" tip="Имя представителя по Power of Attorney (доверенности)." value={party.poaName} onChange={(_, v) => setParty(index, "poaName", v)} />
              <Field id={`${type}-${index}-poaNationality`} label="POA Nationality" tip={tips.nationality} value={party.poaNationality} onChange={(_, v) => setParty(index, "poaNationality", v)} list={`${type}-${index}-poa-nationalities`} options={lists.nationalities || []} />
              <Field id={`${type}-${index}-poaPassport`} label="POA Passport" tip={tips.passport} value={party.poaPassport} onChange={(_, v) => setParty(index, "poaPassport", v)} />
              <Field id={`${type}-${index}-poaEid`} label="POA EID" tip={tips.eid} value={party.poaEid} onChange={(_, v) => setParty(index, "poaEid", v)} />
            </div>
          )}
        </div>
      ))}
      <div className="sectionFooter">
        <button className="secondary iconText" type="button" onClick={addParty}><Plus size={16} /> Add {title}</button>
        <span className={Math.round(total * 100) / 100 === 100 ? "okText" : "warningText"}>Ownership total (итого доля): {Math.round(total * 100) / 100}%</span>
      </div>
    </Section>
  );
}

function rebalance(parties) {
  if (!parties.length) return [initialParty()];
  const base = Math.floor((100 / parties.length) * 100) / 100;
  let total = 0;
  return parties.map((party, index) => {
    const ownershipPercent = index < parties.length - 1 ? base : Math.round((100 - total) * 100) / 100;
    total += ownershipPercent;
    return { ...party, ownershipPercent: String(ownershipPercent).replace(".", ",") };
  });
}

function isArticleIncluded(form, key) {
  if (key === "article_security_deposit_number" && form.buyerDepositEnabled === "No" && form.sellerDepositEnabled === "No") {
    return false;
  }
  if ((form.excludedArticleKeys || []).includes(key)) return false;
  const legacyField = legacyArticleFields[key];
  if (legacyField && form[legacyField] === false) return false;
  return true;
}

function partyNameOptions(parties) {
  return Array.from(new Set(
    (parties || [])
      .map((party) => String(party?.name || "").trim())
      .filter(Boolean),
  ));
}

function DepositSection({ side, title, form, patch, lists, status, preview }) {
  const cap = side[0].toUpperCase() + side.slice(1);
  const enabledKey = `${side}DepositEnabled`;
  const calcTypeKey = `${side}DepositCalcType`;
  const enabled = form[enabledKey] === "Yes";
  const fixed = String(form[calcTypeKey] || "").includes("Fixed");
  const depositAutoValue = preview?.summary?.[`${side}Deposit`];
  const sellerNames = partyNameOptions(form.sellers);
  const buyerNames = partyNameOptions(form.buyers);
  const drawnByOptions = side === "buyer" ? buyerNames : sellerNames;
  const inFavourOptions = side === "buyer" ? sellerNames : buyerNames;

  return (
    <Section title={title} status={status}>
      <SelectField id={enabledKey} label={`${cap} provides cheque?`} tip={tips.depositEnabled} value={form[enabledKey]} onChange={patch} options={["Yes", "No"]} />
      <SelectField id={calcTypeKey} label="Calculation Type" tip={tips.depositCalcType} value={form[calcTypeKey]} onChange={patch} options={["% of Selling Price", "Fixed Amount"]} />
      {!fixed && <Field id={`${side}DepositPercent`} label="Deposit %" tip={tips.depositPercent} value={form[`${side}DepositPercent`]} onChange={patch} />}
      {fixed && <Field id={`${side}DepositFixedAmount`} label="Fixed Amount" tip={tips.depositFixedAmount} value={form[`${side}DepositFixedAmount`]} onChange={patch} />}
      {enabled && <Field id={`${side}DepositCalculated`} label="Calculated Deposit Amount" tip="Автоматически посчитанная сумма deposit (депозита), которая попадет в MOU." value={depositAutoValue ? `AED ${depositAutoValue}` : ""} onChange={() => {}} placeholder="Посчитается автоматически" readOnly />}
      {enabled && (
        <>
          <Field id={`${side}ChequeNumber`} label="Cheque No." tip={tips.chequeNumber} value={form[`${side}ChequeNumber`]} onChange={patch} />
          <DateField id={`${side}ChequeDate`} label="Cheque Date" tip={tips.chequeDate} value={form[`${side}ChequeDate`]} onChange={patch} />
          <Field id={`${side}ChequeBank`} label="Cheque Bank" tip={tips.chequeBank} value={form[`${side}ChequeBank`]} onChange={patch} list={`${side}Banks`} options={lists.banks || []} />
          <Field id={`${side}ChequeDrawnBy`} label="Drawn by" tip={tips.chequeDrawnBy} value={form[`${side}ChequeDrawnBy`]} onChange={patch} options={drawnByOptions} />
          <Field id={`${side}ChequeInFavourOf`} label="In favour of" tip={tips.chequeInFavourOf} value={form[`${side}ChequeInFavourOf`]} onChange={patch} options={inFavourOptions} />
        </>
      )}
    </Section>
  );
}

function Preview({ preview }) {
  if (!preview) return <div className="emptyPreview">Preview will appear after data loads.</div>;
  const validation = preview.validation || { errors: [], warnings: [] };
  const s = preview.summary || {};

  return (
    <div className="previewContent">
      {validation.errors?.length ? (
        <Notice
          title={REQUIRED_FIELDS_BLOCKING ? "Fix before creating" : "Test mode: these fields are not blocking now"}
          items={validation.errors}
          type={REQUIRED_FIELDS_BLOCKING ? "error" : "warning"}
        />
      ) : (
        <Notice title="Ready checks" items={["No blocking validation errors."]} type="ok" />
      )}
      {validation.warnings?.length ? <Notice title="Warnings" items={validation.warnings} type="warning" /> : null}

      <PreviewCard title="Parties">
        <Row label="Seller" value={s.seller} />
        <Row label="Buyer" value={s.buyer} />
      </PreviewCard>
      <PreviewCard title="Property">
        <Row label="Project" value={preview.data?.projectName} />
        <Row label="Unit" value={preview.data?.unitNumber} />
        <Row label="Location" value={s.propertyLocation} />
        <Row label="Type of Area" value={s.typeOfArea} />
      </PreviewCard>
      <PreviewCard title="Payment Table">
        <Row label="Selling Price" value={aed(s.sellingPrice)} />
        <Row label="Amount to be paid to Seller" value={aed(s.amountToSeller)} />
        <Row label="Threshold Top-up to Developer" value={aed(s.thresholdTopUpAmount)} />
        <Row label="Remaining Developer Balance" value={aed(s.remainingDeveloperBalance)} />
        <Row label="ADM Fee" value={aed(s.admFee)} />
        <Row label="Agency Fee Seller" value={aed(s.agencyFeeSeller)} />
        <Row label="Agency Fee Buyer" value={aed(s.agencyFeeBuyer)} />
      </PreviewCard>
      <PreviewCard title="Security Deposits">
        <Row label="Buyer Deposit" value={aed(s.buyerDeposit)} />
        <Row label="Seller Deposit" value={aed(s.sellerDeposit)} />
      </PreviewCard>
      <PreviewCard title="Articles">
        <div className="articleGrid">
          {(preview.articles || []).map((article) => (
            <span
              key={article.key}
              className={article.included ? "articleOn articleHint" : "articleOff articleHint"}
              data-tip={articleTips[article.key] || "Короткое описание этой статьи пока не добавлено."}
              tabIndex={0}
            >
              {article.included ? `Article ${article.number}` : "Removed"} - {article.title}
            </span>
          ))}
        </div>
      </PreviewCard>
    </div>
  );
}

function Notice({ title, items, type }) {
  return (
    <div className={`notice ${type}`}>
      <strong>{title}</strong>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </div>
  );
}

function PreviewCard({ title, children }) {
  return <section className="previewCard"><h3>{title}</h3>{children}</section>;
}

function Row({ label, value }) {
  return <div className="row"><span>{label}</span><strong>{value || "—"}</strong></div>;
}

function aed(value) {
  return value ? `AED ${value}` : "";
}
