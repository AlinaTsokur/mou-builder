# Как дать Клоду прямой доступ к Google-файлам Алины

Инструкция для Клода в новом проекте. Здесь описано, что он делает сам,
а что может сделать только Алина — щелчки в браузере под своим аккаунтом.

Итог настройки: у Клода в терминале появляются авторизованные клиенты Google
Docs, Drive и Sheets, и он правит документы напрямую, без выгрузок и копий.

Аккаунт: `tsokuraline@gmail.com`.

---

## Почему другой Клод говорит «не могу править таблицы»

Это почти всегда правда — но про его окружение, а не про Клода вообще.
Три ситуации:

1. **Клод в приложении claude.ai с коннектором Google Drive.** Коннектор умеет
   искать файлы, читать их и заменять файл целиком. Точечно править содержимое
   он не может: у него нет ни Docs API, ни Sheets API — нечем сказать «впиши
   в ячейку B7» или «замени этот абзац». Это потолок коннектора.
2. **Клод в терминале, но в проекте нет ключей.** Без `.env.local` с тремя
   строками ниже доступа нет вообще. Лечится настройкой из этой инструкции,
   она занимает минут пятнадцать и делается один раз.
3. **Ключи есть, но протухли.** Приложение осталось в режиме Testing (тогда
   refresh token умирает через 7 дней) или доступ отозван вручную. Симптом —
   ошибка `invalid_grant`.

В проекте mou-builder работает второй вариант, уже настроенный: у Клода в
терминале есть авторизованные клиенты Docs, Drive и Sheets, и он правит файлы
напрямую в аккаунте Алины — тем же способом, каким человек правит их руками.

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

## Таблицы: что именно можно делать

Скоуп `spreadsheets` даёт полный доступ: читать, писать значения, менять
оформление, добавлять и удалять строки, создавать листы. Проверено на живой
таблице «MOU Builder» (чтение) и на временной (запись, форматирование, удаление).

`spreadsheetId` — из ссылки: `docs.google.com/spreadsheets/d/<ID>/edit`.

**Прочитать диапазон:**

```js
import { getBotClients } from "./scripts/google-bot.mjs";
const { sheets } = getBotClients();
const spreadsheetId = "1cDlPWsD4gmmbzdaV0spVxLNSAedEXZruizYYtnn7CsQ";

const r = await sheets.spreadsheets.values.get({ spreadsheetId, range: "AGENTS!A1:F50" });
console.log(r.data.values); // массив массивов; хвостовые пустые ячейки просто отсутствуют
```

**Узнать, какие есть листы и их `sheetId`** (нужен для форматирования — это не то же
самое, что `spreadsheetId`):

```js
const meta = await sheets.spreadsheets.get({
  spreadsheetId, fields: "properties.title,sheets.properties(sheetId,title)",
});
```

**Записать значения:**

```js
await sheets.spreadsheets.values.update({
  spreadsheetId, range: "AGENTS!B7:C7",
  valueInputOption: "USER_ENTERED", // как будто набрали руками: формулы и даты распознаются
  requestBody: { values: [["Новое имя", "CN-1234567"]] },
});
```

`RAW` кладёт текст как есть — `=A2*2` останется строкой. Для формул и дат нужен
`USER_ENTERED`.

**Дописать строку в конец:**

```js
await sheets.spreadsheets.values.append({
  spreadsheetId, range: "DRAFTS_LOG!A:E",
  valueInputOption: "USER_ENTERED", insertDataOption: "INSERT_ROWS",
  requestBody: { values: [["2026-09-04", "off-plan №1", "готово"]] },
});
```

**Оформление, строки, листы — через `batchUpdate`** (здесь `sheetId`, не `spreadsheetId`):

```js
await sheets.spreadsheets.batchUpdate({
  spreadsheetId,
  requestBody: { requests: [
    { repeatCell: {                                  // шапка жирным
      range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
      cell: { userEnteredFormat: { textFormat: { bold: true } } },
      fields: "userEnteredFormat.textFormat.bold" } },
    { insertDimension: {                             // вставить строку
      range: { sheetId: 0, dimension: "ROWS", startIndex: 5, endIndex: 6 } } },
  ] },
});
```

Индексы в `batchUpdate` считаются с нуля и не включают правую границу:
`startRowIndex: 0, endRowIndex: 1` — это первая строка.

---

## Если что-то не работает

| Ошибка | Причина | Что делать |
|---|---|---|
| `invalid_grant` | токен отозван, или приложение в режиме Testing и токену больше 7 дней | Publish app в консоли, затем заново `node scripts/google-auth.mjs` |
| `403 insufficient authentication scopes` | нужный скоуп не выдавался | добавить скоуп в `SCOPES` и пере-авторизоваться с `prompt: "consent"` |
| `404 File not found` | файл принадлежит другому аккаунту или доступ не открыт | проверить, что согласие давалось под `tsokuraline@gmail.com` |
| `429` / `503` | превышен лимит запросов | пауза 1,1 с между записями, повтор с нарастающей задержкой |
| Google не вернул refresh token | забыт `access_type: "offline"` или `prompt: "consent"` | вернуть оба параметра и авторизоваться заново |

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
