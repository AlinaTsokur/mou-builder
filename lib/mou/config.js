function parseTemplates() {
  const json = process.env.MOU_TEMPLATES;
  if (json) {
    try {
      const list = JSON.parse(json);
      if (Array.isArray(list) && list.length) return list;
    } catch { /* fall through to default */ }
  }
  const singleId = process.env.MOU_TEMPLATE_DOC_ID || "1N4KOttFqvFrMDu_zV93dd1HEGkd0khxh3_9t-rOHbDo";
  return [{ id: singleId, label: "Standard MOU" }];
}

export const MOU_TEMPLATES = parseTemplates();

export const MOU_CONFIG = {
  spreadsheetId: process.env.MOU_SPREADSHEET_ID || "1rI2ePSqkmHeUByorcEMsGv3anRKT7HuOHYCQ4vR8D8o",
  templateDocId: MOU_TEMPLATES[0].id,
  outputFolderId: process.env.MOU_OUTPUT_FOLDER_ID || "1PccENrU-KpY0f27-vHxgs4y82idyZC4j",
  projectsSheet: process.env.MOU_PROJECTS_SHEET || "PROJECTS",
  listsSheet: process.env.MOU_LISTS_SHEET || "LISTS",
  logSheet: process.env.MOU_LOG_SHEET || "DRAFTS_LOG",
  rulesSheet: process.env.MOU_RULES_SHEET || "RULES",
};

export const DEFAULT_AGENT = "PRIME BRIDGE REAL ESTATE BROKERAGE L.L.C";
