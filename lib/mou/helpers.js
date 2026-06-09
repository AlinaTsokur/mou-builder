export function keyFromHeader(header) {
  return String(header || "")
    .trim()
    .toLowerCase()
    .replace(/[%]/g, "percent")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function s(value) {
  return String(value === null || value === undefined ? "" : value).trim();
}

export function n(value) {
  if (value === "" || value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isNaN(value) ? "" : value;

  let raw = String(value)
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, "")
    .replace(/AED/gi, "")
    .replace(/[^\d,.\-]/g, "");

  if (!raw) return "";

  const commaCount = (raw.match(/,/g) || []).length;
  const dotCount = (raw.match(/\./g) || []).length;

  if (commaCount > 0 && dotCount > 0) {
    if (raw.lastIndexOf(",") > raw.lastIndexOf(".")) {
      raw = raw.replace(/\./g, "").replace(",", ".");
    } else {
      raw = raw.replace(/,/g, "");
    }
  } else if (commaCount > 0) {
    if (commaCount > 1 || /^\d{1,3}(,\d{3})+$/.test(raw)) {
      raw = raw.replace(/,/g, "");
    } else {
      raw = raw.replace(",", ".");
    }
  } else if (dotCount > 0) {
    if (dotCount > 1 || /^\d{1,3}(\.\d{3})+$/.test(raw)) {
      raw = raw.replace(/\./g, "");
    }
  }

  const parsed = Number(raw);
  return Number.isNaN(parsed) ? "" : parsed;
}

export function bool(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "yes" || normalized === "true" || normalized === "1" || value === true;
}

export function boolDefault(value, defaultValue) {
  if (value === undefined || value === null || value === "") return defaultValue;
  return bool(value);
}

export function money(num) {
  if (num === "" || num === null || num === undefined) return "";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(Number(num));
}

export function moneyNoDecimals(num) {
  if (num === "" || num === null || num === undefined) return "";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(Number(num));
}

export function percent(num) {
  if (num === "" || num === null || num === undefined) return "";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(Number(num));
}

export function formatPropertyLocation(value) {
  const text = s(value);
  if (!text) return "";
  const lower = text.toLowerCase();
  if (lower.includes("abu dhabi") || lower.includes("uae")) return text;
  return `${text}, Abu Dhabi, UAE`;
}

export function sanitizeFileName(value) {
  return String(value || "").replace(/[\\/:*?"<>|]/g, "-");
}
