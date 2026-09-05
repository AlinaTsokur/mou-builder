import { getGoogleClients, jsonError } from "@/lib/google/client";
import { createMouDocument } from "@/lib/google/docs";
import { appendDraftLog, readRules } from "@/lib/google/sheets";
import {
  buildDraftTitle,
  buildFlags,
  buildPreview,
  buildReplacements,
  buildReplacementsV2,
  calculate,
  getMainPartyName,
  normalizeForm,
  formForTemplate,
  validateMou,
} from "@/lib/mou/core";
import { buildArticleNumbers, getArticleDefs, getArticleDefsForTemplate } from "@/lib/mou/articles";
import { MOU_TEMPLATES } from "@/lib/mou/config";

const REQUIRE_VALIDATION_BEFORE_CREATE = process.env.MOU_REQUIRE_VALIDATION === "true";

export async function POST(request) {
  try {
    const { drive, docs, sheets } = await getGoogleClients();
    const form = await request.json();
    const templateId = form.templateId || "";
    const templateEntry = MOU_TEMPLATES.find((t) => t.id === templateId) || MOU_TEMPLATES[0];
    const engine = templateEntry?.engine === "v2" ? "v2" : "legacy";

    const data = normalizeForm(formForTemplate(form, templateEntry));
    const validation = validateMou(data, { mortgage: !!templateEntry?.mortgage });
    if (REQUIRE_VALIDATION_BEFORE_CREATE && !validation.ok) {
      return Response.json({ ok: false, validation }, { status: 422 });
    }

    const calc = calculate(data);
    const title = buildDraftTitle(data);

    let document;
    let rules;
    if (engine === "v2") {
      // v2: условия живут в шаблоне ({{#if}}/{{#row}}), правил-таблиц нет.
      // Ручное отключение статей работает через excludedArticleKeys.
      rules = [];
      const articleNumbers = buildArticleNumbers(data, rules, getArticleDefsForTemplate(templateEntry, data.unitStatus));
      const replacements = buildReplacementsV2(data, calc, articleNumbers);
      const flags = buildFlags(data, calc);
      document = await createMouDocument({
        drive, docs, title, data, rules, replacements, flags, templateId, engine,
      });
    } else {
      rules = await readRules(sheets);
      const articleDefs = getArticleDefs(data.unitStatus);
      const articleNumbers = buildArticleNumbers(data, rules, articleDefs);
      const replacements = buildReplacements(data, calc, articleNumbers);
      document = await createMouDocument({
        drive, docs, title, data, rules, replacements, templateId,
      });
    }

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
