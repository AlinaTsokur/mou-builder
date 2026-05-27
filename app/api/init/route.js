import { getGoogleClients, jsonError } from "@/lib/google/client";
import { getInitData } from "@/lib/google/sheets";

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
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
