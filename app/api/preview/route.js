import { getGoogleClients, jsonError } from "@/lib/google/client";
import { readRules } from "@/lib/google/sheets";
import { buildPreview } from "@/lib/mou/core";
import { resolveTemplate, TEMPLATE_REQUIRED_ERROR } from "@/lib/mou/config";

export async function POST(request) {
  try {
    const form = await request.json();
    const template = resolveTemplate(form.templateId || "");
    if (!template) {
      return Response.json({ ok: false, error: TEMPLATE_REQUIRED_ERROR }, { status: 400 });
    }
    const { sheets } = await getGoogleClients();
    const rules = await readRules(sheets);
    return Response.json({ ok: true, preview: buildPreview(form, rules, template) });
  } catch (error) {
    return jsonError(error);
  }
}
