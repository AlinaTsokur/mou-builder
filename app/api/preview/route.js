import { getGoogleClients, jsonError } from "@/lib/google/client";
import { readRules } from "@/lib/google/sheets";
import { buildPreview } from "@/lib/mou/core";

export async function POST(request) {
  try {
    const { sheets } = await getGoogleClients();
    const form = await request.json();
    const rules = await readRules(sheets);
    return Response.json({ ok: true, preview: buildPreview(form, rules) });
  } catch (error) {
    return jsonError(error);
  }
}
