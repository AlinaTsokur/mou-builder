import { MOU_CONFIG } from "@/lib/mou/config";
import { DEFAULT_RULES } from "@/lib/mou/articles";
import { keyFromHeader } from "@/lib/mou/helpers";

export async function getInitData(sheets) {
  const [projects, lists, drafts, rules] = await Promise.all([
    readProjects(sheets),
    readLists(sheets),
    readDrafts(sheets),
    readRules(sheets),
  ]);

  return { projects, lists, drafts, rules };
}

export async function readProjects(sheets) {
  const values = await readRange(sheets, `${MOU_CONFIG.projectsSheet}!A:Z`);
  if (values.length < 2) return [];
  const headers = values[0].map((h) => keyFromHeader(h));
  return values
    .slice(1)
    .filter((row) => String(row[0] || "").trim())
    .map((row) => Object.fromEntries(headers.map((h, i) => [h, String(row[i] || "").trim()])));
}

export async function readLists(sheets) {
  const values = await readRange(sheets, `${MOU_CONFIG.listsSheet}!A:Z`);
  if (!values.length) return {};
  const headers = values[0].map((h) => keyFromHeader(h));
  const lists = {};
  headers.forEach((header, col) => {
    if (!header) return;
    lists[header] = values
      .slice(1)
      .map((row) => String(row[col] || "").trim())
      .filter(Boolean);
  });
  return lists;
}

export async function readRules(sheets) {
  return DEFAULT_RULES;
}

export async function readDrafts(sheets) {
  const values = await readRange(sheets, `${MOU_CONFIG.logSheet}!A:Z`);
  if (values.length < 2) return [];
  const headers = values[0].map((h) => String(h || "").trim());
  const col = (name) => headers.indexOf(name);
  const jsonCol = col("Form JSON");
  if (jsonCol === -1) return [];

  return values
    .slice(1)
    .map((row, index) => {
      const rowNumber = index + 2;
      const label = [
        row[col("Date Created")] || "",
        row[col("Project")] || "",
        row[col("Unit Number")] || "",
        row[col("Seller")] || "",
        row[col("Buyer")] || "",
      ]
        .filter(Boolean)
        .join(" | ");

      return {
        rowNumber,
        label: label || `Draft row ${rowNumber}`,
        link: row[col("Google Doc Link")] || "",
        hasFormJson: Boolean(row[jsonCol]),
      };
    })
    .filter((item) => item.hasFormJson)
    .reverse();
}

export async function readDraftForm(sheets, rowNumber) {
  const values = await readRange(sheets, `${MOU_CONFIG.logSheet}!A:Z`);
  if (values.length < 2) throw new Error("DRAFTS_LOG пустой.");
  const headers = values[0].map((h) => String(h || "").trim());
  const jsonCol = headers.indexOf("Form JSON");
  if (jsonCol === -1) throw new Error("В DRAFTS_LOG нет колонки Form JSON.");
  const row = Number(rowNumber);
  if (!row || row < 2 || !values[row - 1]) throw new Error("Черновик не найден.");
  const json = values[row - 1][jsonCol];
  if (!json) throw new Error("У этого draft нет сохраненных данных формы.");
  return JSON.parse(json);
}

export async function appendDraftLog(sheets, item) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: MOU_CONFIG.spreadsheetId,
    range: `${MOU_CONFIG.logSheet}!A:I`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          new Date().toLocaleString("ru-RU", { timeZone: "Europe/Madrid" }),
          item.agreementDate || "",
          item.projectName || "",
          item.unitNumber || "",
          item.sellerName || "",
          item.buyerName || "",
          item.sellingPrice || "",
          item.docUrl || "",
          item.formJson || "",
        ],
      ],
    },
  });
}

async function readRange(sheets, range) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: MOU_CONFIG.spreadsheetId,
    range,
    valueRenderOption: "FORMATTED_VALUE",
  });
  return res.data.values || [];
}
