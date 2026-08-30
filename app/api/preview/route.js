import { getGoogleClients, jsonError } from "@/lib/google/client";
import { readRules } from "@/lib/google/sheets";
import { buildPreview } from "@/lib/mou/core";
import { MOU_TEMPLATES } from "@/lib/mou/config";

export async function POST(request) {
  try {
    const { sheets } = await getGoogleClients();
    const form = await request.json();
    const rules = await readRules(sheets);
    const template = MOU_TEMPLATES.find((t) => t.id === form.templateId) || MOU_TEMPLATES[0];
    return Response.json({ ok: true, preview: buildPreview(form, rules, template) });
  } catch (error) {
    return jsonError(error);
  }
}
