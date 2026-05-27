import { getGoogleClients, jsonError } from "@/lib/google/client";
import { readDraftForm } from "@/lib/google/sheets";

export async function GET(_request, { params }) {
  try {
    const { sheets } = await getGoogleClients();
    const { rowNumber } = await params;
    const form = await readDraftForm(sheets, rowNumber);
    return Response.json({ ok: true, form });
  } catch (error) {
    return jsonError(error);
  }
}
