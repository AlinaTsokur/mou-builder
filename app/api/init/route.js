import { getGoogleClients, jsonError } from "@/lib/google/client";
import { getInitData } from "@/lib/google/sheets";
import { MOU_TEMPLATES } from "@/lib/mou/config";

export async function GET() {
  try {
    const { sheets, session } = await getGoogleClients();
    const data = await getInitData(sheets);
    return Response.json({
      ok: true,
      user: session.user,
      ...data,
      config: {
        allowedDomain: process.env.GOOGLE_ALLOWED_DOMAIN || "",
        hasOutputFolder: Boolean(process.env.MOU_OUTPUT_FOLDER_ID),
        templates: MOU_TEMPLATES,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
