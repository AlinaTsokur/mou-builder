import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function getGoogleClients() {
  const session = await getServerSession(authOptions);
  if (session?.authError === "RefreshAccessTokenError") {
    const error = new Error("Google-сессия истекла. Нажмите Sign out и войдите через Google заново.");
    error.status = 401;
    throw error;
  }

  if (!session?.accessToken) {
    const error = new Error("Войдите через Google, чтобы работать с Docs/Sheets/Drive.");
    error.status = 401;
    throw error;
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: session.accessToken });

  return {
    drive: google.drive({ version: "v3", auth: oauth2Client }),
    docs: google.docs({ version: "v1", auth: oauth2Client }),
    sheets: google.sheets({ version: "v4", auth: oauth2Client }),
    session,
  };
}

export function jsonError(error) {
  const status = error.status || error.code || 500;
  const rawMessage = error.message || "Unknown error";
  const isGoogleAuthError =
    status === 401 ||
    rawMessage.includes("invalid authentication credentials") ||
    rawMessage.includes("Expected OAuth 2 access token");

  return Response.json(
    {
      ok: false,
      error: isGoogleAuthError
        ? "Google-сессия истекла. Нажмите Sign out и войдите через Google заново, чтобы снова загрузить проекты."
        : rawMessage,
    },
    { status: typeof status === "number" ? status : 500 },
  );
}
