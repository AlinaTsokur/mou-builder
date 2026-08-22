// Авторизованные клиенты Google для локальных скриптов (правка шаблонов, таблица).
// Использование: import { getBotClients } from "./google-bot.mjs";
import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";

const ROOT = path.resolve(import.meta.dirname, "..");

function readEnv() {
  const file = path.join(ROOT, ".env.local");
  if (!fs.existsSync(file)) throw new Error("Нет .env.local");
  return Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split("\n")
      .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      }),
  );
}

export function getBotClients() {
  const env = readEnv();
  const { GOOGLE_BOT_CLIENT_ID, GOOGLE_BOT_CLIENT_SECRET, GOOGLE_BOT_REFRESH_TOKEN } = env;
  if (!GOOGLE_BOT_REFRESH_TOKEN) {
    throw new Error("Нет GOOGLE_BOT_REFRESH_TOKEN — запусти node scripts/google-auth.mjs");
  }
  const auth = new google.auth.OAuth2(GOOGLE_BOT_CLIENT_ID, GOOGLE_BOT_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: GOOGLE_BOT_REFRESH_TOKEN });
  return {
    auth,
    docs: google.docs({ version: "v1", auth }),
    drive: google.drive({ version: "v3", auth }),
    sheets: google.sheets({ version: "v4", auth }),
  };
}
