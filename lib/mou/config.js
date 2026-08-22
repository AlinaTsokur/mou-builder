function parseTemplates() {
  const json = process.env.MOU_TEMPLATES;
  if (json) {
    try {
      const list = JSON.parse(json);
      if (Array.isArray(list) && list.length) return list;
    } catch { /* fall through to default */ }
  }
  const singleId = process.env.MOU_TEMPLATE_DOC_ID || "1vlmCEPFpPFQQfTVUbzeErNQKr1Vf2aApcbQrVt0B1-o";
  return [{ id: singleId, label: "Standard MOU" }];
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
