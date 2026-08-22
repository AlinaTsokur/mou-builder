// Разовая авторизация бота под аккаунтом Алины.
// Запуск: node scripts/google-auth.mjs
// Печатает ссылку, ждёт согласия, сохраняет refresh token в .env.local.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";

const ROOT = path.resolve(import.meta.dirname, "..");
const ENV_PATH = path.join(ROOT, ".env.local");

const env = Object.fromEntries(
  fs
    .readFileSync(ENV_PATH, "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const CLIENT_ID = env.GOOGLE_BOT_CLIENT_ID;
const CLIENT_SECRET = env.GOOGLE_BOT_CLIENT_SECRET;
if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new Error("В .env.local нет GOOGLE_BOT_CLIENT_ID / GOOGLE_BOT_CLIENT_SECRET.");
}

const PORT = 53682;
const REDIRECT = `http://localhost:${PORT}`;
const SCOPES = [
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/spreadsheets",
];

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT);
const url = oauth2.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: SCOPES,
});

console.log("AUTH_URL:", url);

const code = await new Promise((resolve, reject) => {
  const server = http.createServer((req, res) => {
    const params = new URL(req.url, REDIRECT).searchParams;
    const err = params.get("error");
    const c = params.get("code");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<h2>${err ? "Отказано: " + err : "Готово, можно закрывать вкладку."}</h2>`);
    server.close();
    err ? reject(new Error(err)) : resolve(c);
  });
  server.listen(PORT);
  setTimeout(() => {
    server.close();
    reject(new Error("Таймаут ожидания согласия (5 минут)."));
  }, 5 * 60 * 1000);
});

const { tokens } = await oauth2.getToken(code);
if (!tokens.refresh_token) throw new Error("Google не вернул refresh_token.");

const line = `GOOGLE_BOT_REFRESH_TOKEN=${tokens.refresh_token}`;
const current = fs.readFileSync(ENV_PATH, "utf8");
const next = current.includes("GOOGLE_BOT_REFRESH_TOKEN=")
  ? current.replace(/GOOGLE_BOT_REFRESH_TOKEN=.*/, line)
  : `${current.trimEnd()}\n${line}\n`;
fs.writeFileSync(ENV_PATH, next);

console.log("OK: refresh token сохранён в .env.local");
