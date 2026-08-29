# Аудит шаблонов MOU — 22.08.2026 (версия 2)

Сверка 9 шаблонов из папки [«MOU»](https://drive.google.com/drive/folders/1wAOozC2ofCV3Hsm16wdJoywK6_jvjZpm)
после полной замены документов. Прочитаны напрямую через Google Docs API — вместе
с форматированием и всеми 57 комментариями с привязкой к тексту.

| # | Шаблон | Статей | Комм. |
|---|--------|--------|-------|
| 1 | [Off-plan](https://docs.google.com/document/d/1vlmCEPFpPFQQfTVUbzeErNQKr1Vf2aApcbQrVt0B1-o/edit) | 17 | 18 |
| 1.2 | [Off-plan NO DEPOSIT CHEQUES](https://docs.google.com/document/d/1vftXIyFV32PKyFoCg-2J5b_58V94e5TFXJgXSIbIvWM/edit) | 15 | 0 |
| 2 | [Off-plan–mortgage](https://docs.google.com/document/d/1RjrVeLZG65Fyzc5h0TFR0sks8D--jJocEXyF2H9fg9g/edit) | 18 | 1 |
| 3 | [Cash to cash READY](https://docs.google.com/document/d/1d-bXwKBO9J8fUQ35vqKWw5KzADJ6lB6fmD4hxeSjy3k/edit) | 18 | 5 |
| 4 | [Cash to Mortgage READY](https://docs.google.com/document/d/1slUJ8aQCw8nKIhlKBHWvhUFkLWnLH3k_N_OtwH5sm3Y/edit) | 19 | 2 |
| 5 | [Mortgage to cash READY](https://docs.google.com/document/d/1RDNBmgnI3V-1o-Nk--g4XJUpwvHP0sC2IrGY7R_hhw0/edit) | 18 | 7 |
| 6 | [Mortgage to mortgage READY](https://docs.google.com/document/d/1tRz59MGjnZKQpAZv0q_QMU4W6UPFLDBLr8uKPZYWP3w/edit) | 20 | 5 |
| C3-1 | [С3 Cash](https://docs.google.com/document/d/1SFLGotwOKOibBCT3iMiflfBWS9vjLkl8r7UuxpA8gW8/edit) | 18 | 10 |
| C3-2 | [С3 Mortgage](https://docs.google.com/document/d/1NngXRZMAxI1oK41vAsAh2KpXfkqIpSP1gCgKt9HLM14/edit) | 19 | 9 |

---

## A. Ошибки

### A1. Суммы 80/20 не сходятся с депозитом (шаблоны 1 и 3)

Депозит **AED 528,013**, а распределение:

| Шаблон | Статья | 80% | 20% | Сумма | Должно быть |
|--------|--------|-----|-----|-------|-------------|
| 1 | ст. 7 | 263,000 | 65,000 | 328,000 | 422,410.40 + 105,602.60 |
| 1 | ст. 8 | 263,600 | 65,900 | 329,500 | то же |
| 3 | ст. 7 | 263,000 | 65,000 | 328,000 | то же |
| 3 | ст. 8 | 263,600 | 65,900 | 329,500 | то же |

В шаблонах 2, 4, 6, C3-1, C3-2 цифры верные. В 1 и 3 остались старые.
В коде суммы всё равно считаются автоматически, но пример в шаблоне вводит в заблуждение.

### A2. «Buyer's» вместо «Seller's» в статье о дефолте Продавца (шаблоны 2 и 4)

«…or any third-party reason beyond the **Buyer's** reasonable control, the **Seller** shall be
deemed to be in Default». Должно быть Seller's. В 3, 5, 6, C3 — правильно.

### A3. Дублирование фразы (шаблон 4, ст. 7)

«…any third-party reason beyond the Buyer's reasonable control, **or any third-party reason
beyond the Buyer's reasonable control**, or any circumstances described in Articles 10 and 11…»

### A4. Разорванное определение The Developer (шаблон 2)

Пункт Force Majeure заканчивается «…completion of the transaction.**The**», следующий пункт
начинается «• **Developer** – ALDAR…». Артикль ушёл в предыдущий пункт.

### A5. Обрезанное определение NOC (шаблон 4)

«• **NOC** — an official document stating that the issuing authority has no objection…» —
потеряно начало «NOC fee is a fee charged for issuing a No Objection Certificate». В 3, 5, 6,
C3-1, C3-2 определение полное.

### A6. Дата продавца в блоке SELLER'S AGENCY (все 9 шаблонов)

Стоит `Date: {{buyer_signature_date}}` — должно быть `{{seller_signature_date}}`.

### A7. Шаблон 1.2 не размечен

В подписях вместо плейсхолдеров — «Name Surname» (два продавца), даты пустые, агентства
вписаны руками: PRIME BRIDGE и S Q F REALTY. Единственный шаблон без разметки.

### A8. Оправдание не по адресу (шаблон 6, ст. 7)

В статье о дефолте **Покупателя** среди уважительных причин указаны «delays by the
**Seller's Bank** in issuing the liability letter, clearance, or mortgage release». Задержка
банка Продавца — оправдание Продавца. В шаблоне 5 в ст. 7 этого нет.

### A9. Склеенные абзацы распределения (шаблоны 2, 4, C3-1)

«This amount shall be distributed as follows:a) **80%**…andb) **20%**…» — потеряны переносы
строк, пункты a) и b) слиплись с текстом.

### A10. Черновиковые разделители в тексте

Символы `__`, `___`, `_____`, `—-` (пометки взаимоисключающих вариантов) остались:

| Шаблон | 1 | 1.2 | 2 | 3 | 4 | 5 | 6 | C3-1 | C3-2 |
|--------|---|-----|---|---|---|---|---|------|------|
| Штук | 4 | 0 | 2 | 5 | 3 | 5 | 5 | 0 | 1 |

В C3-1 разделителей нет вовсе — взаимоисключающие абзацы идут подряд, и без пометки
не видно, что это варианты.

---

## B. Расхождения формулировок — выбрать одну версию

### B1. Кому уходит копия уведомления о споре

| Формулировка | Шаблоны |
|--------------|---------|
| «delivered to **Agencies** for their reference» | 1, 1.2 |
| «delivered to **Seller's agent and Buyer's agent**» | 2, 3, 4, 5, 6, C3-1, C3-2 |

Договаривались на `{{agencies_word}}` — Agencies при двух агентствах, the Agency при одном.

### B2. Держатель депозита — Agency или Agent, внутри одного шаблона по-разному

В шаблонах 1, 2, 3, 5, 6 первый абзац ст. 6: «held by **The Seller's Agency** as **stakeholder**»
(жирный stakeholder), второй абзац: «held by **Buyer's Agent** as stakeholder» (обычный).
Разные слова и разное форматирование в соседних абзацах.

### B3. Определение Transfer fee / NOC fee

| Что написано | Шаблоны |
|--------------|---------|
| Transfer fee + NOC fee (обе фразы) | 1, 2 |
| только Transfer fee | 1.2 |
| только NOC fee | 3, 5, 6, C3-1, C3-2 |
| обрезанный NOC (см. A5) | 4 |

Комментарий Дарьи в шаблоне 1: «NOC остается для Nine Yards», и «выбрать в зависимости
от проекта (NOC: Sea La vie…)» — то есть выбор зависит от застройщика и должен быть флагом.

### B4. Liquidated Damages при двух депозитах

Комментарий Дарьи в шаблоне 1 на определении: **«Убирается, если у обоих есть Security
Deposit»**. Фактически определение присутствует во всех девяти шаблонах, включая те, где
в Payment Table стоят оба депозита. Нужен маркер.

### B5. Способ оплаты Продавцу

| Формулировка | Шаблоны |
|--------------|---------|
| «by Manager's Cheque or Cash» | 1 |
| «by Manager's Cheque» | 1.2, 2, 3, 4, C3-1, C3-2 |
| «by Manager's Cheque» + оговорка про Liability Letter | 5, 6 |

Комментарий Дарьи: «Если оплата на человека, то by Manager's Cheque/Cash issued in favour
of (имя)» — то есть вариант зависит от получателя.

### B6. ADM Electronic Fee — четыре разных значения

| Значение | Шаблоны |
|----------|---------|
| 2% от Selling Price + AED 575 | 1, 1.2 |
| AED 919.00 | 3, 5 |
| AED 925.75 | C3-1 |
| AED 1,392.00 | 2, 4, 6, C3-2 |

Комментарий Дарьи: **«575 AED проекты Aldar, остальное 475»**. Значит надбавка зависит
от застройщика, а фиксированные суммы — от типа сделки. Правило надо формализовать.

### B7. Мелочи

- «has designated **Mr.**» (1, 1.2, 3, 5) vs «**Mr(s).**» (2, 4, 6) — второе корректнее.
- «hereinafter referred to» vs «**here in after** referred to» (2, 4) — опечатка.
- «“**Parties**/**Party**”**.**» (1, 1.2, 2) vs «“**Parties/Party**”.» (3–6, C3) — точка внутри
  или снаружи жирного.

---

## C. Структурные различия — подтвердить, осознанны ли

### C1. Шаблон 1.2 содержит LPC-пункт

«In the event that any **Late Payment Charges (LPC)** are incurred in relation to the payment
due on 14 August 2026…» — раньше решили LPC не добавлять, но в этом шаблоне он есть.

### C2. Vacant / Tenancy — два взаимоисключающих абзаца подряд

В шаблонах 3, 4, 5, 6 в статье о состоянии объекта идут подряд «Property shall be vacant on
the Transfer Date» и «Property is currently leased at a rent of AED 150,000…» без разделителя.
В C3-1 и C3-2 — только vacant.

### C3. Продавец-юрлицо в группе C3

Seller = «LUCKY HOLDING - F.Z.E, Trade License #46879, Issue Date…, Expiry Date…, Ownership
rights – 100%, acting through its shareholders… • Mr. Marc Glotser…». Блок стороны и блок
подписи в другом формате: «Name: LUCKY HOLDING - F.Z.E (shareholder – Marc Glotser)».
Код сейчас умеет только физлиц — нужен флаг `seller_is_company` и отдельный блок.

### C4. Депозит в C3 — только от Покупателя

В Payment Table одна строка Security deposit (Buyer → Seller), в остальных шаблонах две.
В ст. 6 тоже только абзац Покупателя, абзаца Продавца нет.

### C5. Шаблон 2 — нет строки threshold top-up

В шаблоне 1 есть «Remaining balance to complete **30%** threshold…», в шаблоне 2 её нет,
и остаток застройщику платится «on the Transfer Date by a Manager's Cheque», а не
«in accordance with the Payment Plan».

### C6. Разный состав строк Payment Table

| Строка | 1 | 1.2 | 2 | 3 | 4 | 5 | 6 | C3-1 | C3-2 |
|--------|---|-----|---|---|---|---|---|------|------|
| Original Price | ✓ | ✓ | ✓ | — | — | — | — | — | — |
| Remaining balance 70/75% | ✓ | ✓ | ✓ | — | — | — | — | — | — |
| Transfer Fee / NOC Fee | ✓ | ✓ | ✓ | — | — | — | — | — | — |
| Developer NOC Fee | — | — | — | ✓ | ✓ | ✓ | ✓ | — | — |
| Community NOC Fee | — | — | — | ✓ | ✓ | ✓ | ✓ | — | — |
| NOC Fee + Admin Fee | — | — | — | — | — | — | — | ✓ | ✓ |
| ADM Fee (2% / оценка) | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| ADM Valuation Certificate | — | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| ADM Verification Certificate | — | — | ✓ | — | — | — | — | — | — |
| Unit Verification / Search | — | — | — | — | ✓ | — | — | — | ✓ |
| Mortgage Release Fee | — | — | — | — | — | ✓ | ✓ | — | — |
| Security deposit | 2 стр. | — | 2 стр. | 2 стр. | 2 стр. | 2 стр. | 2 стр. | 1 стр. | 1 стр. |

«ADM **Verification** Certificate» в шаблоне 2 против «ADM **Valuation** Certificate»
в остальных — похоже на опечатку.

### C7. Разные названия документа сделки

- off-plan (1, 1.2, 2): «**Assignment Agreement**», подписывается в офисе застройщика;
- ready + C3: «**Contract of Property Sale and Purchase**», подписывается в **ADREC**.

Похоже осознанно.

---

## D. Форматирование

### D1. Payment Table: способы оплаты

- off-plan (1, 1.2, 2): обычным шрифтом — «by Card», «by a Manager's Cheque»;
- ready + C3: **жирным** — «by **Manager's Cheque** or **Card**», «by **Bank transfer**».

### D2. «This Agreement is signed and entered on the Date»

Слово Agreement обычным в 1, 1.2, 2; жирным в 3–6, C3.

### D3. Title Deed Number

«2026/0000» жирное в 3, 4, 5, 6, C3-1; обычное в C3-2. В off-plan значение «N/A» обычное.

---

## E. Что комментарии говорят про будущие флаги

Комментарии Дарьи и Алины — это, по сути, готовое ТЗ на условия. Сведение:

| Комментарий | Где | Во что превращается |
|-------------|-----|---------------------|
| «Убирается, если у обоих есть Security Deposit» | 1, определение LD | `{{#if !both_deposits}}` |
| «Удаляется, если нет Security cheques у обеих сторон» | 1, ст. 9 | `{{#if any_deposit}}` |
| «удаляем, если нет депозитов» | 3, 5, 6, ст. 9 | то же |
| «если нет депозита» / «если есть депозит» | 1, ст. 7 | выбор лид-абзаца |
| «если у 1 из сторон нет секьюрити депозита» | 1, ст. 7 | третий вариант лид-абзаца |
| «Если чек будет позже» | 1, ст. 6 | `{{#if cheque_later}}` |
| «удаляется, если у Покупателя нет чека» | 2, ст. 6 | `{{#if buyer_cheque}}` |
| «в случае, если чек выписывается 3 лицом» | C3-1, C3-2 | `{{#if buyer_cheque_third_party}}` |
| «NOC остается для Nine Yards» | 1, определение | `{{#if developer_nine_yards}}` |
| «выбрать в зависимости от проекта» | 1, Transfer/NOC | флаг по застройщику |
| «575 AED проекты Aldar, остальное 475» | 1, ADM | вычисляемое значение |
| «покупает за собственные средства» / «покупает под залог итд» | 5, ст. 10 | `{{#if buyer_own_funds}}` |
| «Чек дает тот, кто указан в п.i» | 1, ст. 6 | связь с полем формы |
| «данные по Продавце остаются полностью» | C3 | `{{#if seller_is_company}}` |

Значения, помеченные «остается неизменной» / «фикс цена» — константы, их не надо
подставлять из формы: AED 2,750.00 (Developer NOC, Aldar), AED 1,050.00 (Community NOC),
AED 919.00 / 1,392.00 / 925.75 (ADM Electronic), AED 1,037.00 (ADM Valuation),
AED 960.00 (Mortgage Release), AED 525.00 (Admin Fee C3), AED 103.50 (Unit Verification).

Помеченные «дата составления» / «дата mou» — подставляются из даты MOU:
это `14/04/2026` в ready-шаблонах и `28/01/2026` в off-plan.

---

## F. Что предлагаю по составу шаблонов

Общая часть — около 70% текста. Различия сводятся к набору флагов:

| Группа | Шаблоны | Что различается внутри |
|--------|---------|------------------------|
| **Off-plan** | 1, 1.2, 2 | депозиты вкл/выкл, ипотека покупателя, threshold top-up, LPC |
| **Ready** | 3, 4, 5, 6 | ипотека покупателя, ипотека продавца (Liability Letter), vacant/tenancy |
| **C3** | C3-1, C3-2 | ипотека покупателя, продавец-юрлицо, свои строки NOC/Admin |

Флаги, которых пока нет в движке: `buyer_mortgage`, `seller_mortgage`, `property_vacant`,
`seller_is_company`, `adm_valuation_based`, `has_unit_verification_fee`, `cheque_later`,
`buyer_cheque_third_party`, `developer_nine_yards`.

Плюсы объединения: правка в одном месте вместо девяти, расхождения структурно невозможны.
Минус: документ длиннее и требует аккуратности при ручном редактировании.

Альтернатива — оставить 9 документов, но один раз выровнять общую часть по эталону
и дальше править всегда во всех девяти.

---

## G. Что нужно от Алины

1. Пройти вкладку **REVIEW** в таблице «MOU Builder» и отметить галочками, какие правки
   применять. Я применяю только отмеченное, сразу во всех затронутых шаблонах.
2. Раздел C — подтвердить, осознанны ли структурные различия (особенно C1, C4, C5).
3. Раздел D — выравниваем форматирование по одному стандарту? Рекомендую вариант
   ready/C3: способы оплаты жирным.
4. Раздел F — объединяем в 3 шаблона или оставляем 9.
5. Две одинаковые копии таблицы «MOU Builder»: приложение читает
   [1rI2ePSq…](https://docs.google.com/spreadsheets/d/1rI2ePSqkmHeUByorcEMsGv3anRKT7HuOHYCQ4vR8D8o/edit),
   а в папке лежит дубль
   [1cDlPWsD…](https://docs.google.com/spreadsheets/d/1cDlPWsD4gmmbzdaV0spVxLNSAedEXZruizYYtnn7CsQ/edit)
   с теми же данными. Какую считаем рабочей — вторую удалить, чтобы не разъехались.
6. Папку «Готовые MOU» надо создать заново — старая удалена, в конфиге остался мёртвый ID.
