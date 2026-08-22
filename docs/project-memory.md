# MOU Builder — память проекта

Файл-память: правила, договорённости и планы. Обновляется по ходу работы.
Последнее обновление: 22.08.2026.

## 1. Что это и где лежит

- Приложение: Next.js на Vercel (проект `mou-builder`, команда Tsokurenok's projects).
  Код: github.com/AlinaTsokur/mou-builder, ветка `main` — пушим напрямую в main.
- Генерация: копия Google Doc шаблона → движок v2 обрабатывает условные маркеры →
  подстановка значений → готовый MOU в папку «Готовые MOU».
- Данные: Google Таблица «MOU Builder» (вкладки PROJECTS, LISTS, AGENTS, DRAFTS_LOG;
  план — добавить TEMPLATES). Базы данных нет и пока не нужна.
- Шаблоны: папка «Автоматизация» на Google Диске `tsokuraline@gmail.com`
  ([«Автоматизация»](https://drive.google.com/drive/folders/1wAOozC2ofCV3Hsm16wdJoywK6_jvjZpm), `1wAOozC2ofCV3Hsm16wdJoywK6_jvjZpm`). Коннектор Claude подключён к аккаунту
  `kkorobkova84@gmail.com` — папка расшарена на него как редактору.
- Переезд на рабочий аккаунт позже = копирование файлов + замена 3-4 ID (spreadsheetId,
  outputFolderId, ID шаблонов). Ничего в коде к аккаунту не привязано.

## 2. Как устроены шаблоны (движок v2)

- Условия живут в самом Google Doc:
  - `{{#if flag}} … {{/if}}` — инлайн, блоки, вложенность, отрицание `{{#if !flag}}`
  - `{{#row flag}}` — для строк таблиц
  - `{{placeholder}}` — подстановка значений
- Код больше не ищет фразы договора. Текст можно править в документе без участия
  программиста; нельзя менять только имена флагов и плейсхолдеров.
- Жирный/курсив — родное форматирование Google Doc. Маркеры `<< >>` остаются только
  для значений, собираемых кодом (блоки сторон).
- Неизвестный флаг не ломает документ: текст сохраняется, имя флага попадает в отчёт.
- Эталонная разметка off-plan: `templates/offplan-v2-template.md`.
- ВАЖНО: шаблоны должны быть Google Docs, а не .docx — при чтении .docx теряется
  жирный шрифт (проверено 22.08.2026).

## 3. Согласованные правила

### Депозиты
- Шаблон Off-plan (с депозитом) предполагает минимум один депозит. Оба без депозита =
  отдельный шаблон «1.2 NO DEPOSIT CHEQUES».
- Определение Liquidated Damages удаляется, когда ОБА депозита включены.
  ⚠️ В текущих шаблонах это правило не отражено — см. отчёт аудита.
- Ст. Buyer/Seller Default: предложение «shall pay AED X as liquidated damages, being an
  amount equal to the Security Deposit» присутствует всегда. X = свой депозит, если есть,
  иначе депозит другой стороны. Лид-фраза: есть депозит → «The forfeited Security Deposit
  shall be distributed», нет → «This amount shall be distributed».
- Распределение 80% стороне / 20% агенту другой стороны; нет агента → 100% стороне.
- Вариант без реквизитов чека = чека ещё нет (Delayed). Зеркально для Seller.
- Держатель чека (`{{buyer_deposit_holder}}` / `{{seller_deposit_holder}}`): оба агента →
  чек Buyer без реквизитов у Seller's Agency, с реквизитами у Buyer's Agency; чек Seller
  у Seller's Agency. Один агент → оба чека у него. Агентов нет → чек держит противоположная
  сторона, ст. Deposit Release «the Agent» → «the Parties».
- Чек от третьего лица = галочка в форме → фраза про undertaking letter.
- Возврат чеков: `{{deposit_return_parties}}` = «the Buyer and to the Seller» / «the Buyer» /
  «the Seller».

### Агентства
- Агентства — стороны договора: юрблок в шапке (компания, представитель, должность,
  лицензия, адрес) из вкладки AGENTS.
- Комиссию можно отключить при живом агенте (флаги `seller_agent_fee` / `buyer_agent_fee`).
  Обе выключены → строка Agency Fee удаляется целиком.
- В тексте используются роли («The Buyer's Agent»), не названия компаний.
- `{{agencies_word}}`: два агента → «Agencies», один → «the Agency».

### NOC / Transfer fee
- Условие NOC берётся из колонки Transfer Fee Label вкладки PROJECTS (= «NOC Fee»),
  не по имени застройщика. Лейбл в таблице и фраза про NOC в определениях — из одного
  источника.

### Прочее
- Ст. Effective Date: аннулирование MOU за 2 рабочих дня — фиксированный текст.
- LPC-пункт (Late Payment Charges) не добавляем. ⚠️ В шаблоне 1.2 он присутствует — решить.
- Ручное отключение статей в форме оставляем → нумерация `{{article_*_number}}` динамическая.
- Threshold top-up = 0 → строка удаляется (`{{#row has_top_up}}`).
- Способ оплаты Amount to Seller → `{{amount_to_seller_payment_text}}`.
- Блоки подписей: `{{seller_signature_block}}` / `{{buyer_signature_block}}` — строка
  Name/Signature/Date на каждого участника. Подписи агентств и финальная таблица — по флагам.

## 4. Шаблоны (папка «Автоматизация»)

| # | Файл (ссылка) | Группа | Статей | Google Doc ID |
|---|------|--------|--------|-----|
| 1 | [Off-plan](https://docs.google.com/document/d/1vlmCEPFpPFQQfTVUbzeErNQKr1Vf2aApcbQrVt0B1-o/edit) | Off-plan | 17 | `1vlmCEPFpPFQQfTVUbzeErNQKr1Vf2aApcbQrVt0B1-o` |
| 1.2 | [Off-plan NO DEPOSIT CHEQUES](https://docs.google.com/document/d/1vftXIyFV32PKyFoCg-2J5b_58V94e5TFXJgXSIbIvWM/edit) | Off-plan | 15 | `1vftXIyFV32PKyFoCg-2J5b_58V94e5TFXJgXSIbIvWM` |
| 2 | [Off-plan–mortgage](https://docs.google.com/document/d/1RjrVeLZG65Fyzc5h0TFR0sks8D--jJocEXyF2H9fg9g/edit) | Off-plan | 18 | `1RjrVeLZG65Fyzc5h0TFR0sks8D--jJocEXyF2H9fg9g` |
| 3 | [Cash to cash READY](https://docs.google.com/document/d/1d-bXwKBO9J8fUQ35vqKWw5KzADJ6lB6fmD4hxeSjy3k/edit) | Ready | 18 | `1d-bXwKBO9J8fUQ35vqKWw5KzADJ6lB6fmD4hxeSjy3k` |
| 4 | [Cash to Mortgage READY](https://docs.google.com/document/d/1slUJ8aQCw8nKIhlKBHWvhUFkLWnLH3k_N_OtwH5sm3Y/edit) | Ready | 19 | `1slUJ8aQCw8nKIhlKBHWvhUFkLWnLH3k_N_OtwH5sm3Y` |
| 5 | [Mortgage to cash READY](https://docs.google.com/document/d/1RDNBmgnI3V-1o-Nk--g4XJUpwvHP0sC2IrGY7R_hhw0/edit) | Ready | 18 | `1RDNBmgnI3V-1o-Nk--g4XJUpwvHP0sC2IrGY7R_hhw0` |
| 6 | [Mortgage to mortgage READY](https://docs.google.com/document/d/1tRz59MGjnZKQpAZv0q_QMU4W6UPFLDBLr8uKPZYWP3w/edit) | Ready | 20 | `1tRz59MGjnZKQpAZv0q_QMU4W6UPFLDBLr8uKPZYWP3w` |
| C3-1 | [С3 Cash](https://docs.google.com/document/d/1SFLGotwOKOibBCT3iMiflfBWS9vjLkl8r7UuxpA8gW8/edit) | C3 | 18 | `1SFLGotwOKOibBCT3iMiflfBWS9vjLkl8r7UuxpA8gW8` |
| C3-2 | [С3 Mortgage](https://docs.google.com/document/d/1NngXRZMAxI1oK41vAsAh2KpXfkqIpSP1gCgKt9HLM14/edit) | C3 | 19 | `1NngXRZMAxI1oK41vAsAh2KpXfkqIpSP1gCgKt9HLM14` |

Все шаблоны заново загружены Алиной 22.08.2026 — ID изменились, старые недействительны.
Актуальный аудит: `docs/templates-audit-2026-08.md` (версия 2).
Папка «Готовые MOU» удалена 22.08.2026 — создать заново, в конфиге мёртвый ID.
Таблица [«MOU Builder»](https://docs.google.com/spreadsheets/d/1cDlPWsD4gmmbzdaV0spVxLNSAedEXZruizYYtnn7CsQ/edit) — `1cDlPWsD4gmmbzdaV0spVxLNSAedEXZruizYYtnn7CsQ`,
копия Алины с правом записи. Та, что прописана в конфиге (`1rI2ePSq…`), принадлежит другому
аккаунту, у Алины там только просмотр — надо переключить `MOU_SPREADSHEET_ID`.
Вкладка REVIEW в этой таблице — согласование правок шаблонов галочками.

## 5. План

1. ✅ Движок v2 (`lib/google/template-engine.js`) — готов, 20 тестов.
2. ✅ Аудит всех 8 шаблонов (текст + форматирование) — `docs/templates-audit-2026-08.md`.
3. Алина решает по расхождениям из аудита (разделы A–F) и удаляет старые .docx.
4. Реестр шаблонов → вкладка TEMPLATES в таблице (ID, название, группа, движок).
5. Вырезать из кода старый путь (поиск фраз, генерация таблицы подписей, старые
   тексты/статьи/правила). Остаётся только v2.
6. Разметить шаблоны, подключить, протестировать на реальных сделках.
7. Новый интерфейс: пошаговая форма (сделка → стороны → агентства → финансы → депозиты →
   проверка), живая валидация у полей, автозаполнение из справочников, липкая панель
   Preview/Create.
8. Позже: переезд на рабочий Google-аккаунт; ипотечные шаблоны 6–7; при необходимости —
   БД (Neon) для истории и статусов.

## 6. Открытые вопросы

- Ипотечные шаблоны: нужны новые поля — банк покупателя, банк продавца (Seller's Bank),
  сумма кредита, Liability Letter. Уточнить состав.
- Нужно ли для Seller поддержать чек от третьего лица (в шаблоне 2 такая фраза есть).
- Юрлицо как сторона: в C3-шаблонах Seller = компания (Trade License, shareholders).
  Нужен отдельный вариант блока стороны «компания vs физлицо».
- Переезд на рабочий аккаунт: кто будет владельцем папок и таблицы.

## 8. Правка Google Docs роботом

Что умеет и не умеет доступ к докам:

- **Drive-коннектор Claude** — только чтение, поиск и смена имени/папки. Записать текст
  в существующий док не может (поэтому появлялись копии вместо правок).
- **Docs API (OAuth-токен или сервисный аккаунт)** — хирургические правки на месте:
  меняется только указанный диапазон, оформление не трогается. Режим предложений
  («рекомендации» с галочками) через API недоступен.
- **Предложения с галочками** получаются одним путём: выгрузить .docx → внести правки
  как tracked changes (`w:ins`/`w:del`) → залить обратно с конвертацией. Риск —
  круговая конвертация может сдвинуть списки/отступы. Не проверено.
- **Playwright MCP** (добавлен 22.08.2026, user scope) — управление реальным Chrome
  под профилем `~/.claude-browser-profile`. Позволяет работать в интерфейсе Докс так же,
  как человек, включая режим предложений. Медленно, годится для точечных задач,
  не для сотен правок.

Проверено 22.08.2026: предложения в грантовом доке Алины оставил живой аккаунт
(Maxim Fedyukov), а не API-бот — либо руками, либо агентом в браузере.

## 9. Прямой доступ бота к Google (OAuth)

Cloud-проект `mou-bot-506311` (личный аккаунт Алины), OAuth-клиент Desktop `mou-bot-cli`,
приложение «MOU Bot» в режиме Testing, тестовый пользователь — tsokuraline@gmail.com.
Scopes: documents, drive, spreadsheets.

- Ключи и refresh token — в `.env.local` (`GOOGLE_BOT_*`), в гит не попадают.
- Клиенты: `scripts/google-bot.mjs` → `getBotClients()` даёт `docs` / `drive` / `sheets`.
- Перевыпуск токена: `node scripts/google-auth.mjs`, дальше открыть напечатанный AUTH_URL
  в браузере Playwright и подтвердить. В режиме Testing токен живёт 7 дней.
- Опубликовать приложение (чтобы токен не истекал) нельзя: Google требует сайт
  с политикой конфиденциальности.

## 10. Актуальные адреса (22.08.2026)

Папка [«Автоматизация»](https://drive.google.com/drive/folders/1wAOozC2ofCV3Hsm16wdJoywK6_jvjZpm)
— основная. Всё, что вне её, считаем устаревшим.

- Таблица «MOU Builder»: `1cDlPWsD4gmmbzdaV0spVxLNSAedEXZruizYYtnn7CsQ` (лежит в папке).
  Старая `1rI2ePSq…` принадлежит другому аккаунту, у Алины там только просмотр — не использовать.
- Папка [«Готовые MOU»](https://drive.google.com/drive/folders/1hENNhxCor6GO0SX8Psedc3gPmyq_eIaL):
  `1hENNhxCor6GO0SX8Psedc3gPmyq_eIaL`, создана заново внутри «Автоматизации».
- Реестр всех 9 шаблонов — в `MOU_TEMPLATES` (Vercel, Production) и в дефолтах `lib/mou/config.js`.
- Вкладка REVIEW в таблице — согласование правок шаблонов галочками.

Env в Vercel обновлены только для Production: preview-ветками не пользуемся, пушим в `main`.

Позже всё переезжает на рабочую почту — при переезде поменять эти ID ещё раз.
