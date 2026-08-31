# Как дать Клоду прямой доступ к Google-файлам Алины

Инструкция для Клода в новом проекте. Здесь описано, что он делает сам,
а что может сделать только Алина — щелчки в браузере под своим аккаунтом.

Итог настройки: у Клода в терминале появляются авторизованные клиенты Google
Docs, Drive и Sheets, и он правит документы напрямую, без выгрузок и копий.

Аккаунт: `tsokuraline@gmail.com`.

---

## Что должно получиться

Файл `.env.local` в корне проекта с тремя строками:

```
GOOGLE_BOT_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_BOT_CLIENT_SECRET=GOCSPX-...
GOOGLE_BOT_REFRESH_TOKEN=1//0c...
```

`.env.local` обязан быть в `.gitignore`. Refresh token — это постоянный ключ
от аккаунта, в репозиторий он не попадает никогда.

---

## Шаг 1. Проект и OAuth-клиент в Google Cloud — делает Алина

Клод сам это сделать не может: нужен вход в консоль под её аккаунтом.

1. [console.cloud.google.com](https://console.cloud.google.com) → создать проект,
   например `mou-bot`.
2. **APIs & Services → Library** → включить три API:
   Google Docs API, Google Drive API, Google Sheets API.
3. **APIs & Services → OAuth consent screen**:
   - тип **External**;
   - заполнить название приложения и почту поддержки;
   - в **Audience** нажать **Publish app** и подтвердить.
     Это важно: пока приложение в режиме Testing, refresh token протухает
     через 7 дней и доступ отваливается посреди работы.
     Проверку Google проходить не нужно — она требуется только для внешних
     пользователей, а тут аккаунт владельца.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - тип приложения — **Desktop app**;
   - скопировать **Client ID** и **Client secret**.

Эти два значения Алина передаёт Клоду. Дальше Клод действует сам.

---

## Шаг 2. Скрипт авторизации — пишет Клод

Положить в проект `scripts/google-auth.mjs`. Он поднимает локальный сервер
на порту 53682, печатает ссылку на согласие и ловит код обратно.

Порт 53682 должен совпадать с тем, что Google подставит как redirect для
Desktop-клиента — `http://localhost:53682`.

```js
// Разовая авторизация под аккаунтом Алины: node scripts/google-auth.mjs
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";

const ROOT = path.resolve(import.meta.dirname, "..");
const ENV_PATH = path.join(ROOT, ".env.local");
const env = Object.fromEntries(
  fs.readFileSync(ENV_PATH, "utf8").split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);

const PORT = 53682;
const REDIRECT = `http://localhost:${PORT}`;
const SCOPES = [
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/spreadsheets",
];

const oauth2 = new google.auth.OAuth2(env.GOOGLE_BOT_CLIENT_ID, env.GOOGLE_BOT_CLIENT_SECRET, REDIRECT);
// access_type: offline и prompt: consent обязательны — без них Google
// не выдаст refresh token, а без него доступ живёт один час
console.log("AUTH_URL:", oauth2.generateAuthUrl({ access_type: "offline", prompt: "consent", scope: SCOPES }));

const code = await new Promise((resolve, reject) => {
  const server = http.createServer((req, res) => {
    const params = new URL(req.url, REDIRECT).searchParams;
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h2>Готово, можно закрывать вкладку.</h2>");
    server.close();
    const err = params.get("error");
    err ? reject(new Error(err)) : resolve(params.get("code"));
  });
  server.listen(PORT);
  setTimeout(() => { server.close(); reject(new Error("Таймаут ожидания согласия")); }, 5 * 60 * 1000);
});

const { tokens } = await oauth2.getToken(code);
if (!tokens.refresh_token) throw new Error("Google не вернул refresh token — проверь prompt: consent");
fs.appendFileSync(ENV_PATH, `\nGOOGLE_BOT_REFRESH_TOKEN=${tokens.refresh_token}\n`);
console.log("Refresh token сохранён в .env.local");
```

---

## Шаг 3. Согласие в браузере

Клод запускает `node scripts/google-auth.mjs` и получает ссылку `AUTH_URL`.

Дальше два пути:

- **Отдать ссылку Алине.** Она открывает её в браузере, где вошла под
  `tsokuraline@gmail.com`, и нажимает «Разрешить». Скрипт сам поймает ответ.
- **Открыть самому через Playwright MCP**, если он подключён и работает
  с её постоянным профилем Chrome — тогда её сессия уже там и жать «Разрешить»
  Клод может сам. Спросить разрешения перед этим.

Экран предупреждения «Google не проверил это приложение» — нормально
для собственного клиента: **Дополнительные настройки → Перейти на страницу**.

---

## Шаг 4. Клиенты для остального кода — пишет Клод

`scripts/google-bot.mjs`, его импортируют все остальные скрипты:

```js
import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";

const ROOT = path.resolve(import.meta.dirname, "..");

export function getBotClients() {
  const env = Object.fromEntries(
    fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split("\n")
      .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
      .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
  );
  if (!env.GOOGLE_BOT_REFRESH_TOKEN) {
    throw new Error("Нет GOOGLE_BOT_REFRESH_TOKEN — запусти node scripts/google-auth.mjs");
  }
  const auth = new google.auth.OAuth2(env.GOOGLE_BOT_CLIENT_ID, env.GOOGLE_BOT_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: env.GOOGLE_BOT_REFRESH_TOKEN });
  return {
    auth,
    docs: google.docs({ version: "v1", auth }),
    drive: google.drive({ version: "v3", auth }),
    sheets: google.sheets({ version: "v4", auth }),
  };
}
```

Проверка, что всё живо:

```js
import { getBotClients } from "./scripts/google-bot.mjs";
const { drive } = getBotClients();
const r = await drive.files.list({ pageSize: 3, fields: "files(name)" });
console.log(r.data.files.map((f) => f.name));
```

---

## Что важно знать заранее

**Лимит записи — 60 запросов в минуту на проект.** Между правками ставить
паузу 1,1 секунды и повторять с задержкой при ответах 429 и 503. Иначе
пакетная правка документа падает на середине и оставляет его битым.

**У колонтитулов своя нумерация символов.** В запросе к тексту шапки или
подвала обязателен `segmentId`, иначе правка уедет в тело документа и
испортит чужой текст. Ошибка тихая: запрос проходит, текст ломается.

**Правки документов почти всегда не идемпотентны.** Повторный прогон
скрипта разметки по уже размеченному файлу дублирует вставки и ломает
структуру. Перед записью в живой файл проверять, не размечен ли он уже,
и делать копию-бэкап до первой правки.

**Замена текста берёт начертание первого символа диапазона.** Если правка
накрыла куски с разным начертанием, жирный слетит. Это не видно в тексте —
только при сравнении стилей с копией файла до правок.

**Шаблоны держать в Google Docs, не в .docx.** При конвертации теряется
оформление.

**Refresh token приравнивается к паролю.** Он даёт полный доступ к Диску
аккаунта. Только в `.env.local`, никогда в git, никогда в переменные Vercel
или в чат. Отозвать можно на
[myaccount.google.com/permissions](https://myaccount.google.com/permissions).
