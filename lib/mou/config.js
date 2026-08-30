// Реестр шаблонов из папки «MOU» в «Автоматизации». Держим в коде, а не только
// в env: значение переменной на Vercel обратно не читается, и молчаливая ошибка
// в ней означала бы генерацию размеченного шаблона старым движком.
// engine: "v2" — шаблон с маркерами {{#if}} / {{#row}}, условия живут в документе.
const DEFAULT_TEMPLATES = [
  { id: "1vlmCEPFpPFQQfTVUbzeErNQKr1Vf2aApcbQrVt0B1-o", label: "1. Off-plan", engine: "v2" },
  { id: "1RjrVeLZG65Fyzc5h0TFR0sks8D--jJocEXyF2H9fg9g", label: "2. Off-plan — mortgage" },
  { id: "1d-bXwKBO9J8fUQ35vqKWw5KzADJ6lB6fmD4hxeSjy3k", label: "3. Ready — cash to cash" },
  { id: "1slUJ8aQCw8nKIhlKBHWvhUFkLWnLH3k_N_OtwH5sm3Y", label: "4. Ready — cash to mortgage" },
  { id: "1RDNBmgnI3V-1o-Nk--g4XJUpwvHP0sC2IrGY7R_hhw0", label: "5. Ready — mortgage to cash" },
  { id: "1tRz59MGjnZKQpAZv0q_QMU4W6UPFLDBLr8uKPZYWP3w", label: "6. Ready — mortgage to mortgage" },
  { id: "1SFLGotwOKOibBCT3iMiflfBWS9vjLkl8r7UuxpA8gW8", label: "C3 1. Cash — Garden Residence" },
  { id: "1NngXRZMAxI1oK41vAsAh2KpXfkqIpSP1gCgKt9HLM14", label: "C3 2. Mortgage — Garden Residence" },
];

// Убраны из выбора, файлы на месте:
// 1vftXIyFV32PKyFoCg-2J5b_58V94e5TFXJgXSIbIvWM — «1.2 Off-plan — no deposit cheques».
// Шаблон №1 выдаёт тот же договор, если выключить оба security cheque, а сам №1.2
// не размечен и ушёл бы в старый пайплайн.

function parseTemplates() {
  const json = process.env.MOU_TEMPLATES;
  if (json) {
    try {
      const list = JSON.parse(json);
      if (Array.isArray(list) && list.length) return list;
    } catch { /* fall through to default */ }
  }
  // legacy-переменная на один шаблон: движок берём из реестра, иначе размеченный
  // шаблон уехал бы в старый пайплайн и маркеры {{#if}} попали бы в договор
  const singleId = process.env.MOU_TEMPLATE_DOC_ID;
  if (singleId) {
    const known = DEFAULT_TEMPLATES.find((t) => t.id === singleId);
    return [known || { id: singleId, label: "Standard MOU" }];
  }
  return DEFAULT_TEMPLATES;
}

export const MOU_TEMPLATES = parseTemplates();

export const MOU_CONFIG = {
  spreadsheetId: process.env.MOU_SPREADSHEET_ID || "1cDlPWsD4gmmbzdaV0spVxLNSAedEXZruizYYtnn7CsQ",
  templateDocId: MOU_TEMPLATES[0].id,
  outputFolderId: process.env.MOU_OUTPUT_FOLDER_ID || "1hENNhxCor6GO0SX8Psedc3gPmyq_eIaL",
  projectsSheet: process.env.MOU_PROJECTS_SHEET || "PROJECTS",
  listsSheet: process.env.MOU_LISTS_SHEET || "LISTS",
  logSheet: process.env.MOU_LOG_SHEET || "DRAFTS_LOG",
  rulesSheet: process.env.MOU_RULES_SHEET || "RULES",
  agentsSheet: process.env.MOU_AGENTS_SHEET || "AGENTS",
};

export const DEFAULT_AGENT = "PRIME BRIDGE REAL ESTATE BROKERAGE L.L.C";
