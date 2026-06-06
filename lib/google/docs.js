import { MOU_CONFIG } from "../mou/config.js";
import { disabledArticlePlaceholders } from "../mou/articles.js";
import {
  BUYER_DEPOSIT_DEFINITION_TEXT,
  SELLER_DEPOSIT_DEFINITION_TEXT,
  SELLER_ONLY_DEPOSIT_DEFINITION_TEXT,
  TRANSFER_FEE_DEFINITION_TEXT,
  NOC_FEE_DEFINITION_TEXT,
  COMBINED_FEE_DEFINITION_TEXT,
  AMOUNT_TO_SELLER_PAYMENT_TEXT_VARIANTS,
  ADM_FEE_PAYEE_TEXT,
  SELLER_OUTSTANDING_NOC_PHRASE,
  SIGNATURE_BLOCK_PLACEHOLDER,
  SIGNATURE_HEADER_RGB,
  BUYER_DEFAULT_FORFEIT_TEXT,
  BUYER_DEFAULT_PENALTY_TEXT,
  SELLER_DEFAULT_FORFEIT_TEXT,
  SELLER_DEFAULT_PENALTY_TEXT,
  DEFAULT_AMOUNT_SAID_TEXT,
  DEFAULT_AMOUNT_ABOVE_TEXT,
} from "../mou/texts.js";

export async function createMouDocument({ drive, docs, title, data, rules, replacements, templateId }) {
  const copy = await drive.files.copy({
    fileId: templateId || MOU_CONFIG.templateDocId,
    supportsAllDrives: true,
    requestBody: {
      name: title,
      parents: [MOU_CONFIG.outputFolderId],
    },
    fields: "id,name,webViewLink",
  });

  const documentId = copy.data.id;
  await applyDocumentDeletes({ docs, documentId, data, rules, replacements });

  const beforeSignatureTable = await docs.documents.get({ documentId });
  const signatureTablePlan = buildSignatureTablePlan(beforeSignatureTable.data, data);
  if (signatureTablePlan) {
    await docs.documents.batchUpdate({
      documentId,
      requestBody: { requests: signatureTablePlan.requests },
    });

    const withSignatureTable = await docs.documents.get({ documentId });
    const fillRequests = buildSignatureTableFillRequests(withSignatureTable.data, data, signatureTablePlan);
    if (fillRequests.length) {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests: fillRequests },
      });
    }
  }

  const document = await docs.documents.get({ documentId });
  const conditionalTextRequests = buildConditionalTextRequests(document.data, data).filter((request) => !request.deleteContentRange);
  const replaceRequests = Object.entries(replacements).map(([key, value]) => ({
    replaceAllText: {
      containsText: {
        text: `{{${key}}}`,
        matchCase: true,
      },
      replaceText: String(value || ""),
    },
  }));

  const requests = [...conditionalTextRequests, ...replaceRequests];
  if (requests.length) {
    await docs.documents.batchUpdate({
      documentId,
      requestBody: { requests },
    });
  }

  const after = await docs.documents.get({ documentId });
  const boldRequests = buildBoldFormattingRequests(after.data);
  if (boldRequests.length) {
    await docs.documents.batchUpdate({
      documentId,
      requestBody: { requests: boldRequests },
    });
  }

  const finalDoc = await docs.documents.get({ documentId });
  const remainingPlaceholders = findPlaceholders(finalDoc.data);

  return {
    id: documentId,
    title: copy.data.name || title,
    url: copy.data.webViewLink || `https://docs.google.com/document/d/${documentId}/edit`,
    remainingPlaceholders,
  };
}

async function applyDocumentDeletes({ docs, documentId, data, rules, replacements }) {
  await applyDeleteRequestsOneByOne({
    docs,
    documentId,
    buildRequests: (doc) => buildDeleteArticleRequests(doc, data, rules),
  });

  await applyDeleteRequestsOneByOne({
    docs,
    documentId,
    buildRequests: (doc) => {
      const requests = buildConditionalTextRequests(doc, data).filter((request) => request.deleteContentRange);
      if (replacements) {
        const topUp = String(replacements.threshold_top_up_amount || "");
        if (topUp === "0,00" || topUp === "0.00" || topUp === "0" || topUp === "") {
          requests.push(...buildDeleteTableRowRequests(doc, "{{threshold_top_up_amount}}"));
        }
      }
      return requests;
    },
  });
}

async function applyDeleteRequestsOneByOne({ docs, documentId, buildRequests }) {
  for (let attempts = 0; attempts < 20; attempts += 1) {
    const current = await docs.documents.get({ documentId });
    const [request] = buildRequests(current.data);
    if (!request) return;

    await docs.documents.batchUpdate({
      documentId,
      requestBody: { requests: [request] },
    });
  }
}

export function buildSignatureTablePlan(doc, data) {
  const paragraph = flattenParagraphs(doc).find((item) => item.text.includes(SIGNATURE_BLOCK_PLACEHOLDER));
  const existingSignatureTable = paragraph ? null : findExistingSignatureTable(doc);
  if (!paragraph && !existingSignatureTable) return null;

  const partiesPerSide = Math.max(data.sellers?.length || 1, data.buyers?.length || 1);
  const rows = 1 + partiesPerSide * 3;
  const startIndex = paragraph?.startIndex || existingSignatureTable.startIndex;
  const rawEndIndex = paragraph?.endIndex || existingSignatureTable.endIndex;
  const segmentEndIndex = paragraph?.segmentEndIndex || existingSignatureTable.segmentEndIndex;
  const range = buildSafeDeleteRange(startIndex, rawEndIndex, segmentEndIndex);
  if (!range) return null;

  return {
    insertionIndex: startIndex,
    rows,
    columns: 2,
    requests: [
      {
        deleteContentRange: {
          range,
        },
      },
      {
        insertTable: {
          rows,
          columns: 2,
          location: {
            index: startIndex,
          },
        },
      },
    ],
  };
}

function buildSafeDeleteRange(startIndex, endIndex, segmentEndIndex) {
  const safeEndIndex = clampDeleteEndIndex(endIndex, segmentEndIndex);
  if (!Number.isFinite(startIndex) || !Number.isFinite(safeEndIndex) || safeEndIndex <= startIndex) return null;
  return { startIndex, endIndex: safeEndIndex };
}

function clampDeleteEndIndex(endIndex, segmentEndIndex) {
  if (!Number.isFinite(segmentEndIndex)) return endIndex;
  return Math.min(endIndex, segmentEndIndex - 1);
}

export function buildSignatureTableFillRequests(doc, data, plan) {
  const tableInfo = findTableNearIndex(doc, plan.insertionIndex);
  const table = tableInfo?.table;
  if (!table) return [];

  const rows = table.tableRows || [];
  const sellerDate = data.sellerSignatureDate || data.agreementDate;
  const buyerDate = data.buyerSignatureDate || data.agreementDate;
  const requests = [
    ...buildSignatureTableStyleRequests(tableInfo.startIndex, plan.rows, plan.columns),
  ];
  const textRequests = [];
  const values = [];

  values.push([["THE SELLER", "THE BUYER"], true]);

  for (let i = 0; i < plan.rows - 1; i += 3) {
    const seller = data.sellers?.[i / 3];
    const buyer = data.buyers?.[i / 3];

    values.push([[seller ? `Name: ${signatureName(seller)}` : "", buyer ? `Name: ${signatureName(buyer)}` : ""], false]);
    values.push([[seller ? "Signature:" : "", buyer ? "Signature:" : ""], false]);
    values.push([[seller ? `Date:      ${sellerDate}` : "", buyer ? `Date:      ${buyerDate}` : ""], false]);
  }

  values.forEach(([rowValues, bold], rowIndex) => {
    rowValues.forEach((text, columnIndex) => {
      if (!text) return;
      const cell = rows[rowIndex]?.tableCells?.[columnIndex];
      const insertIndex = firstCellTextIndex(cell);
      if (!insertIndex) return;

      textRequests.push({
        insertText: {
          location: { index: insertIndex },
          text,
        },
      });

      if (bold || text.startsWith("Name:") || text.startsWith("Signature:") || text.startsWith("Date:")) {
        textRequests.push({
          updateTextStyle: {
            range: {
              startIndex: insertIndex,
              endIndex: insertIndex + text.length,
            },
            textStyle: {
              bold: true,
            },
            fields: "bold",
          },
        });
      }

      if (rowIndex === 0) {
        textRequests.push({
          updateParagraphStyle: {
            range: {
              startIndex: insertIndex,
              endIndex: insertIndex + text.length,
            },
            paragraphStyle: {
              alignment: "CENTER",
            },
            fields: "alignment",
          },
        });
      }
    });
  });

  return [
    ...requests,
    ...textRequests.sort((a, b) => {
      const indexA =
        a.insertText?.location?.index ||
        a.updateTextStyle?.range?.startIndex ||
        a.updateParagraphStyle?.range?.startIndex ||
        0;
      const indexB =
        b.insertText?.location?.index ||
        b.updateTextStyle?.range?.startIndex ||
        b.updateParagraphStyle?.range?.startIndex ||
        0;
      return indexB - indexA;
    }),
  ];
}

export function buildSignatureTableStyleRequests(tableStartIndex, rows, columns) {
  const allCellsRange = {
    tableCellLocation: {
      tableStartLocation: { index: tableStartIndex },
      rowIndex: 0,
      columnIndex: 0,
    },
    rowSpan: rows,
    columnSpan: columns,
  };
  const headerRange = {
    tableCellLocation: {
      tableStartLocation: { index: tableStartIndex },
      rowIndex: 0,
      columnIndex: 0,
    },
    rowSpan: 1,
    columnSpan: columns,
  };
  const border = {
    color: { color: { rgbColor: { red: 0, green: 0, blue: 0 } } },
    width: { magnitude: 1, unit: "PT" },
    dashStyle: "SOLID",
  };

  return [
    {
      updateTableCellStyle: {
        tableRange: allCellsRange,
        tableCellStyle: {
          borderTop: border,
          borderBottom: border,
          borderLeft: border,
          borderRight: border,
          paddingTop: { magnitude: 7, unit: "PT" },
          paddingBottom: { magnitude: 7, unit: "PT" },
          paddingLeft: { magnitude: 7, unit: "PT" },
          paddingRight: { magnitude: 7, unit: "PT" },
        },
        fields: "borderTop,borderBottom,borderLeft,borderRight,paddingTop,paddingBottom,paddingLeft,paddingRight",
      },
    },
    {
      updateTableCellStyle: {
        tableRange: headerRange,
        tableCellStyle: {
          backgroundColor: {
            color: { rgbColor: SIGNATURE_HEADER_RGB },
          },
        },
        fields: "backgroundColor",
      },
    },
    ...Array.from({ length: rows }, (_, rowIndex) => ({
      updateTableRowStyle: {
        tableStartLocation: { index: tableStartIndex },
        rowIndices: [rowIndex],
        tableRowStyle: {
          minRowHeight: { magnitude: rowIndex === 0 ? 28 : 36, unit: "PT" },
        },
        fields: "minRowHeight",
      },
    })),
  ];
}

function signatureName(party) {
  return party?.hasPoa && party?.poaName ? party.poaName : party?.name || "";
}

function firstCellTextIndex(cell) {
  const paragraph = cell?.content?.find((item) => item.paragraph)?.paragraph;
  const element = paragraph?.elements?.[0];
  return element?.startIndex || null;
}

function findTableNearIndex(doc, index) {
  return flattenTables(doc)
    .filter((table) => table.startIndex >= index - 2)
    .sort((a, b) => Math.abs(a.startIndex - index) - Math.abs(b.startIndex - index))[0] || null;
}

function findExistingSignatureTable(doc) {
  return flattenTables(doc).find((item) => {
    const text = tableText(item.table);
    return text.includes("{{seller_signature_name}}") && text.includes("{{buyer_signature_name}}");
  });
}

export function buildConditionalTextRequests(doc, data) {
  const requests = [];
  const useNocFeeDefinition = shouldUseNocFeeDefinition(data);

  if (!data.buyerDepositEnabled && !data.sellerDepositEnabled) {
    requests.push(...buildDeleteParagraphRequests(doc, (text) =>
      text.includes("Security Deposit") && text.includes(BUYER_DEPOSIT_DEFINITION_TEXT),
    ));
  }

  if (!data.buyerDepositEnabled && data.sellerDepositEnabled) {
    requests.push({
      replaceAllText: {
        containsText: {
          text: `${BUYER_DEPOSIT_DEFINITION_TEXT}${SELLER_DEPOSIT_DEFINITION_TEXT}`,
          matchCase: true,
        },
        replaceText: SELLER_ONLY_DEPOSIT_DEFINITION_TEXT,
      },
    });
  }

  if (data.buyerDepositEnabled && !data.sellerDepositEnabled) {
    requests.push({
      replaceAllText: {
        containsText: {
          text: SELLER_DEPOSIT_DEFINITION_TEXT,
          matchCase: true,
        },
        replaceText: "",
      },
    });
  }

  if (useNocFeeDefinition) {
    requests.push({
      replaceAllText: {
        containsText: {
          text: COMBINED_FEE_DEFINITION_TEXT,
          matchCase: true,
        },
        replaceText: NOC_FEE_DEFINITION_TEXT,
      },
    });
    requests.push({
      replaceAllText: {
        containsText: {
          text: TRANSFER_FEE_DEFINITION_TEXT,
          matchCase: true,
        },
        replaceText: NOC_FEE_DEFINITION_TEXT,
      },
    });
  } else {
    requests.push({
      replaceAllText: {
        containsText: {
          text: COMBINED_FEE_DEFINITION_TEXT,
          matchCase: true,
        },
        replaceText: TRANSFER_FEE_DEFINITION_TEXT,
      },
    });
    requests.push({
      replaceAllText: {
        containsText: {
          text: SELLER_OUTSTANDING_NOC_PHRASE,
          matchCase: true,
        },
        replaceText: "",
      },
    });
  }

  if (data.developerName) {
    requests.push({
      replaceAllText: {
        containsText: {
          text: ADM_FEE_PAYEE_TEXT,
          matchCase: true,
        },
        replaceText: `to be paid by the Buyer to ${data.developerName} on the transfer date by a Manager’s Cheque`,
      },
    });
  }

  if (!data.buyerDepositEnabled) {
    const variants = [
      BUYER_DEFAULT_FORFEIT_TEXT,
      BUYER_DEFAULT_FORFEIT_TEXT.replace('\u2019', "'"),
      BUYER_DEFAULT_FORFEIT_TEXT.replace('{{article_security_deposit_number}}', '6'),
      BUYER_DEFAULT_FORFEIT_TEXT.replace('\u2019', "'").replace('{{article_security_deposit_number}}', '6')
    ];
    for (const v of variants) {
      requests.push({
        replaceAllText: {
          containsText: { text: v, matchCase: true },
          replaceText: BUYER_DEFAULT_PENALTY_TEXT,
        },
      });
    }
  }

  if (!data.sellerDepositEnabled) {
    const variants = [
      SELLER_DEFAULT_FORFEIT_TEXT,
      SELLER_DEFAULT_FORFEIT_TEXT.replace('\u2019', "'"),
      SELLER_DEFAULT_FORFEIT_TEXT.replace('{{article_security_deposit_number}}', '6'),
      SELLER_DEFAULT_FORFEIT_TEXT.replace('\u2019', "'").replace('{{article_security_deposit_number}}', '6')
    ];
    for (const v of variants) {
      requests.push({
        replaceAllText: {
          containsText: { text: v, matchCase: true },
          replaceText: SELLER_DEFAULT_PENALTY_TEXT,
        },
      });
    }
  }

  if (!data.buyerDepositEnabled || !data.sellerDepositEnabled) {
    const variants = [
      DEFAULT_AMOUNT_SAID_TEXT,
      DEFAULT_AMOUNT_SAID_TEXT + " ",
      "The said amount",
    ];
    for (const v of variants) {
      requests.push({
        replaceAllText: {
          containsText: { text: v, matchCase: true },
          replaceText: DEFAULT_AMOUNT_ABOVE_TEXT,
        },
      });
    }
  }

  requests.push(...buildAmountToSellerPaymentRequests(data));

  return requests;
}

function buildAmountToSellerPaymentRequests(data) {
  const replacement = amountToSellerPaymentText(data);
  if (!replacement) return [];

  return AMOUNT_TO_SELLER_PAYMENT_TEXT_VARIANTS.map((text) => ({
    replaceAllText: {
      containsText: {
        text,
        matchCase: true,
      },
      replaceText: replacement,
    },
  }));
}

function amountToSellerPaymentText(data) {
  switch (data?.amountToSellerPaymentMethod) {
    case "manager_cheque":
      return "Manager's Cheque.";
    case "cash":
      return "Cash.";
    case "manager_cheque_in_favour":
      return data.amountToSellerChequeInFavourOf
        ? `Manager's Cheque issued in favour of ${data.amountToSellerChequeInFavourOf}.`
        : "";
    default:
      return "";
  }
}

function shouldUseNocFeeDefinition(data) {
  const label = String(data?.transferFeeLabel || "").toLowerCase();
  const unitStatus = String(data?.unitStatus || "").toLowerCase();
  return label.includes("noc") || unitStatus === "ready";
}

function buildDeleteParagraphRequests(doc, predicate) {
  return flattenParagraphs(doc)
    .filter((paragraph) => predicate(paragraph.text))
    .map((paragraph) => buildSafeDeleteRange(paragraph.startIndex, paragraph.endIndex, paragraph.segmentEndIndex))
    .filter(Boolean)
    .sort((a, b) => b.startIndex - a.startIndex)
    .map((range) => ({
      deleteContentRange: {
        range,
      },
    }));
}

export function buildDeleteArticleRequests(doc, data, rules) {
  const disabled = disabledArticlePlaceholders(data, rules);
  const paragraphs = flattenParagraphs(doc);
  const ranges = [];

  for (const placeholder of disabled) {
    const heading = `Article {{${placeholder}}}`;
    const startIndex = paragraphs.findIndex((p) => p.text.includes(heading));
    if (startIndex === -1) continue;

    let endIndex = paragraphs.length - 1;
    for (let i = startIndex + 1; i < paragraphs.length; i += 1) {
      const text = paragraphs[i].text.trim();
      if (text.startsWith("Article {{") || text === "THE SELLER" || text === "THE BUYER") {
        endIndex = i - 1;
        break;
      }
    }

    const start = paragraphs[startIndex].startIndex;
    const end = paragraphs[endIndex].endIndex;
    const range = buildSafeDeleteRange(start, end, paragraphs[startIndex].segmentEndIndex);
    if (range) ranges.push(range);
  }

  return ranges
    .sort((a, b) => b.startIndex - a.startIndex)
    .map((range) => ({
      deleteContentRange: {
        range,
      },
    }));
}

export function buildDeleteTableRowRequests(doc, textToFind) {
  const requests = [];
  const tables = flattenTables(doc);

  tables.forEach(({ table, startIndex }) => {
    (table.tableRows || []).forEach((row, rowIndex) => {
      let rowHasText = false;
      (row.tableCells || []).forEach((cell) => {
        const text = (cell.content || []).map((c) => {
          if (!c.paragraph) return "";
          return (c.paragraph.elements || []).map((el) => el.textRun?.content || "").join("");
        }).join("");

        if (text.includes(textToFind)) {
          rowHasText = true;
        }
      });

      if (rowHasText) {
        requests.push({
          deleteTableRow: {
            tableCellLocation: {
              tableStartLocation: { index: startIndex },
              rowIndex: rowIndex,
              columnIndex: 0,
            },
          },
        });
      }
    });
  });

  return requests.reverse();
}

export function findPlaceholders(doc) {
  const text = flattenParagraphs(doc)
    .map((p) => p.text)
    .join("\n");
  return Array.from(new Set(text.match(/\{\{[a-z0-9_]+\}\}/gi) || [])).sort();
}

function flattenParagraphs(doc) {
  const tabs = doc.tabs?.length ? doc.tabs.map((tab) => tab.documentTab?.body?.content || []) : [doc.body?.content || []];
  return tabs
    .flatMap((item) => {
      const segmentEndIndex = getSegmentEndIndex(item);
      return item.flatMap((contentItem) => {
        const paragraph = contentItem.paragraph;
        if (!paragraph) return [];
        const text = (paragraph.elements || []).map((el) => el.textRun?.content || "").join("");
        return [
          {
            text,
            startIndex: contentItem.startIndex,
            endIndex: contentItem.endIndex,
            segmentEndIndex,
          },
        ];
      });
    });
}

function flattenTables(doc) {
  const tabs = doc.tabs?.length ? doc.tabs.map((tab) => tab.documentTab?.body?.content || []) : [doc.body?.content || []];
  return tabs
    .flatMap((item) => {
      const segmentEndIndex = getSegmentEndIndex(item);
      return item.flatMap((contentItem) => {
        if (!contentItem.table) return [];
        return [
          {
            table: contentItem.table,
            startIndex: contentItem.startIndex,
            endIndex: contentItem.endIndex,
            segmentEndIndex,
          },
        ];
      });
    });
}

function getSegmentEndIndex(content) {
  return content[content.length - 1]?.endIndex || 0;
}

function tableText(table) {
  return (table.tableRows || [])
    .flatMap((row) => row.tableCells || [])
    .flatMap((cell) => cell.content || [])
    .map((item) => {
      const paragraph = item.paragraph;
      if (!paragraph) return "";
      return (paragraph.elements || []).map((element) => element.textRun?.content || "").join("");
    })
    .join("\n");
}

function extractAllParagraphs(contentElements) {
  let paragraphs = [];
  for (const item of contentElements) {
    if (item.paragraph) {
      const text = (item.paragraph.elements || []).map((el) => el.textRun?.content || "").join("");
      paragraphs.push({
        text,
        startIndex: item.startIndex,
        endIndex: item.endIndex,
      });
    } else if (item.table) {
      for (const row of item.table.tableRows || []) {
        for (const cell of row.tableCells || []) {
          if (cell.content) {
            paragraphs = paragraphs.concat(extractAllParagraphs(cell.content));
          }
        }
      }
    }
  }
  return paragraphs;
}

function getAllDocumentParagraphs(doc) {
  const tabs = doc.tabs?.length ? doc.tabs.map((tab) => tab.documentTab?.body?.content || []) : [doc.body?.content || []];
  return tabs.flatMap((content) => extractAllParagraphs(content));
}

function buildBoldFormattingRequests(doc) {
  const paragraphs = getAllDocumentParagraphs(doc);
  const matches = [];

  for (const p of paragraphs) {
    const regex = /<<(.*?)>>/g;
    let match;
    while ((match = regex.exec(p.text)) !== null) {
      matches.push({
        startIndex: p.startIndex + match.index,
        endIndex: p.startIndex + match.index + match[0].length,
      });
    }
  }

  matches.sort((a, b) => b.startIndex - a.startIndex);

  const requests = [];
  for (const m of matches) {
    requests.push({
      deleteContentRange: { range: { startIndex: m.endIndex - 2, endIndex: m.endIndex } },
    });
    requests.push({
      updateTextStyle: {
        range: { startIndex: m.startIndex + 2, endIndex: m.endIndex - 2 },
        textStyle: { bold: true },
        fields: "bold",
      },
    });
    requests.push({
      deleteContentRange: { range: { startIndex: m.startIndex, endIndex: m.startIndex + 2 } },
    });
  }

  return requests;
}
