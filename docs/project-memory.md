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
| 1 | [DRAFT Off-plan MOU](https://docs.google.com/document/d/1w2lWKpWFiPw2lj3NeBNi8yaI_LoU2wf96bOzWAJFNfc/edit) | Off-plan | 17 | `1w2lWKpWFiPw2lj3NeBNi8yaI_LoU2wf96bOzWAJFNfc` |
| 1.2 | [DRAFT Off-plan NO DEPOSIT CHEQUES](https://docs.google.com/document/d/1ESf9f9YXX5o7GbKIs63BmGVQDHpluDI4t2ptgyFO5fY/edit) | Off-plan | 15 | `1ESf9f9YXX5o7GbKIs63BmGVQDHpluDI4t2ptgyFO5fY` |
| 2 | [DRAFT Off-plan–mortgage](https://docs.google.com/document/d/1qt3L83Za8IrrR-D5t13k1uR1ssgiDXAN1Oy4I6jVFlI/edit) | Off-plan | 18 | `1qt3L83Za8IrrR-D5t13k1uR1ssgiDXAN1Oy4I6jVFlI` |
| 3 | [DRAFT Cash to cash READY](https://docs.google.com/document/d/1ywdXmgieTCTVFwnluF3Movw2mSjxLCzwrHKU32ThwbY/edit) | Ready | 18 | `1ywdXmgieTCTVFwnluF3Movw2mSjxLCzwrHKU32ThwbY` |
| 4 | [DRAFT Cash to Mortgage READY](https://docs.google.com/document/d/1CeaCRPb9mo6ZpMw1KscxWM0ttg_MhURmyRG4WLaIXUI/edit) | Ready | 19 | `1CeaCRPb9mo6ZpMw1KscxWM0ttg_MhURmyRG4WLaIXUI` |
| 5 | [DRAFT Mortgage to cash READY](https://docs.google.com/document/d/15VTWI0BtklRY6NItM-8iv4L7SPWUCK-Hq6eYTX-QZbg/edit) | Ready | 18 | `15VTWI0BtklRY6NItM-8iv4L7SPWUCK-Hq6eYTX-QZbg` |
| C3-1 | [С3 1. DRAFT Cash](https://docs.google.com/document/d/1gQqotIcOQ081GPi3Oxchco-dFA0M1EuNj0UUFLve7bw/edit) | C3 | 18 | `1gQqotIcOQ081GPi3Oxchco-dFA0M1EuNj0UUFLve7bw` |
| C3-2 | [С3 2. DRAFT Mortgage](https://docs.google.com/document/d/1FgswpVD6vi3uFpSw98JOq_ACqtDALX-_nAXZvwbHJe0/edit) | C3 | 19 | `1FgswpVD6vi3uFpSw98JOq_ACqtDALX-_nAXZvwbHJe0` |

Все шаблоны — Google Docs (конвертированы 22.08.2026). Старые .docx Алина удаляет сама:
у коннектора нет прав удалять чужие файлы.

6, 7 (ипотечные) — ещё не готовы.
Папка [«Готовые MOU»](https://drive.google.com/drive/folders/1u1rIUlh7AADIgmvdS33JXtYo5NlXfIWX) — `1u1rIUlh7AADIgmvdS33JXtYo5NlXfIWX`.
Таблица [«MOU Builder»](https://docs.google.com/spreadsheets/d/1zIfMwN9CpyFMVxsfuAdY4G6x10NIPlgC0tVuSQTd1Gg/edit) — `1zIfMwN9CpyFMVxsfuAdY4G6x10NIPlgC0tVuSQTd1Gg`.

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
