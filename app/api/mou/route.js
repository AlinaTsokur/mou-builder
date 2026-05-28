import { getGoogleClients, jsonError } from "@/lib/google/client";
import { createMouDocument } from "@/lib/google/docs";
import { appendDraftLog, readRules } from "@/lib/google/sheets";
import {
  buildDraftTitle,
  buildPreview,
  buildReplacements,
  calculate,
  getMainPartyName,
  normalizeForm,
  validateMou,
} from "@/lib/mou/core";
import { buildArticleNumbers } from "@/lib/mou/articles";

const REQUIRE_VALIDATION_BEFORE_CREATE = process.env.MOU_REQUIRE_VALIDATION === "true";

export async function POST(request) {
  try {
    const { drive, docs, sheets } = await getGoogleClients();
    const form = await request.json();
    const rules = await readRules(sheets);
    const data = normalizeForm(form);
    const validation = validateMou(data);
    if (REQUIRE_VALIDATION_BEFORE_CREATE && !validation.ok) {
      return Response.json({ ok: false, validation }, { status: 422 });
    }

    const calc = calculate(data);
    const articleNumbers = buildArticleNumbers(data, rules);
    const replacements = buildReplacements(data, calc, articleNumbers);
    const title = buildDraftTitle(data);
    const document = await createMouDocument({ drive, docs, title, data, rules, replacements });

    await appendDraftLog(sheets, {
      agreementDate: data.agreementDate,
      projectName: data.projectName,
      unitNumber: data.unitNumber,
      sellerName: getMainPartyName(data.sellers),
      buyerName: getMainPartyName(data.buyers),
      sellingPrice: calc.sellingPriceFormatted,
      docUrl: document.url,
      formJson: JSON.stringify(form || {}),
    });

    return Response.json({
      ok: true,
      title: document.title,
      url: document.url,
      remainingPlaceholders: document.remainingPlaceholders,
      preview: buildPreview(form, rules),
    });
  } catch (error) {
    return jsonError(error);
  }
}
