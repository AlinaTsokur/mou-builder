# Аудит шаблонов MOU — 22.08.2026

Сравнение 8 шаблонов из папки «Автоматизация». Цель — найти расхождения, которые
появились из-за правок в одном шаблоне без переноса в остальные.

Все шаблоны конвертированы в Google Docs, поэтому проверены и текст, и форматирование
(жирный шрифт).

Обозначения: **1** off-plan, **1.2** off-plan no deposit, **2** off-plan mortgage,
**3** cash→cash ready, **4** cash→mortgage ready, **5** mortgage→cash ready,
**C3-1** C3 cash, **C3-2** C3 mortgage.

| # | Google Doc ID | Статей |
|---|---|---|
| 1 | `1w2lWKpWFiPw2lj3NeBNi8yaI_LoU2wf96bOzWAJFNfc` | 17 |
| 1.2 | `1ESf9f9YXX5o7GbKIs63BmGVQDHpluDI4t2ptgyFO5fY` | 15 |
| 2 | `1qt3L83Za8IrrR-D5t13k1uR1ssgiDXAN1Oy4I6jVFlI` | 18 |
| 3 | `1ywdXmgieTCTVFwnluF3Movw2mSjxLCzwrHKU32ThwbY` | 18 |
| 4 | `1CeaCRPb9mo6ZpMw1KscxWM0ttg_MhURmyRG4WLaIXUI` | 19 |
| 5 | `15VTWI0BtklRY6NItM-8iv4L7SPWUCK-Hq6eYTX-QZbg` | 18 |
| C3-1 | `1gQqotIcOQ081GPi3Oxchco-dFA0M1EuNj0UUFLve7bw` | 18 |
| C3-2 | `1FgswpVD6vi3uFpSw98JOq_ACqtDALX-_nAXZvwbHJe0` | 19 |

---

## A. Ошибки — надо исправить

### A1. Оборванное предложение в ст. 8 (шаблон 5)
> «…and such failure does not arise due to Force Majeure, Buyer's Default, or any
> third-party reason beyond the Seller's reasonable control, including delays by the
> Seller's Bank in issuing the liability letter, clearance, or mortgage release, provided
> the Seller has complied with the Bank's requirements.»

Пропущено окончание: **«…, the Seller shall be deemed to be in Default in accordance with
the definition set out in this MOU.»** Предложение не имеет главной части.

### A2. Пропущено предложение о liquidated damages в ст. 7 (шаблон C3-1)
Статья 7 идёт так: «…shall be deemed to be in Default…» → сразу «The forfeited Security
Deposit shall be distributed as follows». Отсутствует предложение **«Upon Buyer Default,
the Buyer shall pay AED X as liquidated damages, being an amount equal to the Security
Deposit, which the Parties agree is not a penalty.»** — при том что в ст. 8 того же
шаблона оно есть. Асимметрия между статьями 7 и 8.

### A3. «Buyer's» вместо «Seller's» в ст. 8 (шаблоны 2 и 4)
В статье про дефолт **Продавца** написано «any third-party reason beyond the **Buyer's**
reasonable control». Должно быть Seller's. В шаблонах 5 и C3-2 — правильно.

### A4. Разорванное определение The Developer (шаблон 2)
В нумерованном списке определений пункт 4 (Force Majeure) заканчивается словами
«…completion of the transaction.**The**», а пункт 5 начинается «**Developer** – ALDAR…».
Артикль ушёл в предыдущий пункт, определение разорвано на два.

### A5. Дублирующийся абзац в ст. 6 (шаблон 4)
Фраза «In the event that the Buyer is unable to obtain Final Mortgage Approval… bank
rejection letter» встречается **дважды**: после первого абзаца и ещё раз после абзаца
о возврате чеков.

### A6. Дата продавца в блоке SELLER'S AGENCY (все 8 шаблонов)
Стоит `Date: {{buyer_signature_date}}` — должно быть `{{seller_signature_date}}`.

### A7. Обрезанное определение NOC (шаблон 4)
«**NOC** — an official document stating that the issuing authority has no objection…» —
потеряна первая половина «NOC fee is a fee charged for issuing a No Objection Certificate».
В шаблонах 3, 5, C3-1, C3-2 определение полное.

### A8. Шаблон 1.2 не размечен
В блоке подписей вместо плейсхолдеров — «Name Surname» (два продавца), даты пустые,
агентства вписаны руками (PRIME BRIDGE / S Q F REALTY).

### A9. Черновиковые разделители в тексте
Символы `__`, `—-`, `_____` (пометки альтернативных вариантов) остались в:
**1** (ст. 7, 8), **2** (ст. 7), **3** (ст. 7, 8), **4** (ст. 7, 8),
**5** (ст. 7, 8, 10), **C3-2** (ст. 7).

В **C3-2, ст. 8** и **C3-1, ст. 8** разделителя нет вовсе — два взаимоисключающих
лид-абзаца идут подряд, и без пометки не видно, что это варианты.

---

## B. Расхождения формулировок — выбрать одну версию

### B1. Кому уходит копия уведомления о споре
| Формулировка | Шаблоны |
|---|---|
| «delivered to **Agencies** for their reference» | 1, 1.2 |
| «delivered to **Seller's agent and Buyer's agent**» | 2, 3, 4, 5, C3-1, C3-2 |

Мы договаривались использовать `{{agencies_word}}` (Agencies / the Agency).

### B2. Держатель депозитного чека — «Agency» или «Agent»
| Формулировка | Шаблоны |
|---|---|
| «held by **The Seller's Agency / The Buyer's Agency** as **stakeholder**» | 1, 3, 5 |
| «held by **Seller's Agent / Buyer's Agent** as stakeholder» | 2, 4, C3-1, C3-2 |

Отличаются и слово (Agency/Agent), и артикль, и жирность слова stakeholder.

### B3. Определение Transfer fee / NOC fee
| Что написано | Шаблоны |
|---|---|
| «Transfer fee – … registration. **NOC fee** is a fee charged…» (обе фразы) | 1, 2 |
| «Transfer fee – … registration.» (без NOC) | 1.2 |
| «**NOC fee** is a fee charged…» (без Transfer fee) | 3, 5, C3-1, C3-2 |
| «**NOC** — an official document…» (обрезано, см. A7) | 4 |

Логика частично осознанная: в Ready/C3 нет Transfer Fee, есть NOC Fee. Но версия
шаблона 4 сломана, а в 1.2 фраза про NOC потеряна.

### B4. Определение Liquidated Damages при двух депозитах
Правило: удаляется, когда оба депозита включены. Фактически **определение присутствует
во всех восьми шаблонах**, включая те, где в Payment Table стоят оба депозита.
Либо правило изменилось, либо надо обернуть маркером.

### B5. Порядок «in favour of» в ст. 6
| Порядок | Шаблоны |
|---|---|
| «…cheque No. X dated Y, issued by Z, drawn by A **in favour of B**» | 1, 3, 5 |
| «…Security Deposit cheque **in favour of B** by cheque No. X dated Y, issued by Z, drawn by A» | 2, 4, C3-1, C3-2 |

Плюс в **C3-1**: «drawn by **a third party, namely** Name Surname» — уникальная формулировка,
в C3-2 и остальных просто «drawn by Name Surname».

### B6. Мелочи в Payment Table
- «on the **Transfer Date** by Card» (1) vs «on the **transfer date** by **Credit Card**» (1.2)
- «ADM **Verification** Certificate» (2) vs «ADM **Valuation** Certificate» (3, 4, 5, C3-1, C3-2) —
  похоже на опечатку в шаблоне 2
- Project name в примерах: «The Source» (1) / «the Source» (3, 5) / «C3 Garden» (4 — Ready-шаблон)

---

## C. Структурные различия — подтвердить, осознанны ли

### C1. Разный состав ADM-строк внутри off-plan группы
| Шаблон | Строки |
|---|---|
| 1, 1.2 | одна: «ADM Electronic Fee: (2% from Selling Price + AED 575)» |
| 2 | три: «ADM Fee (2% или по оценке ADM, что выше)» + «ADM Electronic Fee» + «ADM Verification Certificate» |

### C2. Шаблон 2 — нет строки threshold top-up
В шаблоне 1 есть «Remaining balance to complete 30% threshold…», в шаблоне 2 её нет,
и остаток застройщику платится «on the Transfer Date by a Manager's Cheque», а не
«in accordance with the Payment Plan».

### C3. Шаблон 1.2 содержит LPC-пункт
«In the event that any Late Payment Charges (LPC) are incurred in relation to the payment
due on 14 August 2026…» — мы решили LPC не добавлять, но в этом шаблоне он есть.

### C4. Ст. 3 — разные поля таблицы
| Группа | Поля |
|---|---|
| off-plan (1, 1.2, 2) | Additional Information, Number of Car Parking Spaces |
| Ready + C3 | Project No., Car Parking Spaces |

Плюс «Type of Area»: off-plan «Residential», Ready/C3 «Residential - Household Living».

### C5. Ст. 6 — разное число вариантов абзацев
| Шаблон | Что в статье |
|---|---|
| 1, 3, 5 | 3 абзаца: Buyer без реквизитов / Buyer с реквизитами + третье лицо / Seller с реквизитами |
| 2, 4 | 2 абзаца: Buyer (реквизиты + третье лицо + возврат при отказе банка) / Seller (реквизиты + **третье лицо тоже**) |
| C3-1, C3-2 | 1 абзац: только Buyer, «in favour of LUCKY HOLDING» (конкретное имя вместо плейсхолдера) |

В шаблоне 2 у Seller тоже появилась фраза про третье лицо и undertaking letter — раньше
мы решали, что она только для Buyer.

### C6. Vacant / Tenancy — два абзаца подряд без выбора
В шаблонах 3, 4, 5 идут подряд «Property shall be vacant on the Transfer Date» и
«Property is currently leased at a rent of AED 150,000…». Это взаимоисключающие варианты,
но разделителя нет. В C3-1 и C3-2 — только vacant.

### C7. Расхождения внутри группы C3
| Строка | C3-1 (cash) | C3-2 (mortgage) |
|---|---|---|
| ADM Electronic Fee | AED 925.75, «by **Card**» | AED 1,392.00, «by **Manager's Cheque** or **Card**» |
| Unit Verification / Search Certificate | нет строки | AED 103.50 |
| Ст. 7, предложение о liquidated damages | **отсутствует** (см. A2) | есть |
| Title Deed Number «2026/0000» | жирным | обычным |

### C8. Юрлицо как сторона (C3-1, C3-2)
Seller = «LUCKY HOLDING - F.Z.E, Trade License #46879, Issue Date…, Expiry Date…,
Ownership rights – 100%, acting through its shareholders… • Mr. Marc Glotser… holding 100%
ownership interest in the Company, has designated Mr. …». Отдельная структура блока
стороны — компания с маркированным списком акционеров. Код сейчас умеет только физлиц.

Плюс блок подписи: «Name: LUCKY HOLDING - F.Z.E (shareholder – Marc Glotser)» —
тоже отдельный формат.

### C9. Ст. 4, подпись под таблицей
- Шаблон 5: «The Selling Price **and the Agency Fee**…» (без «the amount payable to the
  Seller» — сумма зависит от Liability Letter). Похоже осознанно.
- Остальные: «The Selling Price, **the amount payable to the Seller**, and the Agency Fee…»

### C10. Ст. 10 в шаблоне 5 — три несогласованных абзаца
Идут подряд: mortgage release + «Buyer confirms… own funds» + `___` + «Buyer confirms…
Personal Loan, Equity Release». Второй и третий — взаимоисключающие варианты.

---

## D. Форматирование (жирный шрифт)

### D1. Payment Table: способы оплаты и получатели
| Группа | Как оформлено |
|---|---|
| off-plan (1, 1.2, 2) | способы оплаты обычным шрифтом: «by Card», «by a Manager's Cheque»; получатель жирным |
| Ready + C3 (3, 4, 5, C3-1, C3-2) | способы оплаты **жирным**: «by **Manager's Cheque** or **Card**», «by **Bank transfer**» |

Самое заметное различие в оформлении между группами.

### D2. «This Agreement is signed and entered on the Date…»
- 1, 1.2, 2: слово Agreement обычным шрифтом
- 3, 4, 5, C3-1, C3-2: «This **Agreement** is signed…» — жирным

### D3. Определение Mortgage Release (шаблон 5) целиком жирное
Весь абзац выделен жирным, тогда как во всех остальных определениях жирным выделен
только термин. Единственный такой случай.

### D4. «Parties/Party» — разная разметка кавычек
- 1, 1.2, 2: `**“Parties**/**Party”.**` — точка внутри жирного, слеш вне
- 3, 4, 5, C3: `**“Parties/Party”**.` — точка снаружи

Визуально почти незаметно, но при разметке даст разный результат.

### D5. Нумерация списка определений сбивается
В 1, 1.2, 3, 4, 5, C3-1, C3-2 первый пункт («Agreement» / «MOU») — отдельный список,
затем нумерация начинается заново с 1. То есть в документе два пункта с номером 1.
Только в шаблоне 2 — единый список 1–11.

### D6. Title Deed Number
Значение «2026/0000» жирное в 3, 4, 5, C3-1; обычное в C3-2. В off-plan значение «N/A»
обычное везде.

---

## E. Что одинаково во всех шаблонах (эталон)

Совпадают дословно и по форматированию:

- Шапка: BY AND BETWEEN, юрблоки агентств, «Agencies/Agency»
- Определения: Agreement/MOU, Default, Force Majeure, POA, Addendum, «The Parties shall
  bear their own exchange rate differences…»
- WHEREAS A/B + NOW THEREFORE
- Ст. 1 (Sale Offer), ст. 2 (Effective Date, 2 business days)
- Ст. 5 (Reservation Period): FM ≤ 7 рабочих дней, авто-продление 14 календарных дней
- Ст. Deposit Release (полностью)
- Ст. AML (оба абзаца)
- Ст. Dispute: 7 календарных дней, agents' email/WhatsApp, суды Абу-Даби, indemnity
- Ст. Entire Agreement + Confidentiality, ст. Electronic Signature
- Блоки подписей сторон и агентств

---

## F. Предложение: 3 шаблона вместо 8

Общая часть — примерно 70% текста. Различия сводятся к набору флагов:

| Группа | Что внутри различается |
|---|---|
| **Off-plan** (1, 1.2, 2) | депозиты вкл/выкл, ипотека вкл/выкл, threshold top-up, состав ADM-строк |
| **Ready** (3, 4, 5) | ипотека покупателя, ипотека продавца (Liability Letter), vacant/tenancy |
| **C3** (C3-1, C3-2) | ипотека покупателя, свои строки NOC/Admin Fee |

Новые флаги, которых пока нет в движке:
`buyer_mortgage`, `seller_mortgage`, `property_vacant`, `seller_is_company`,
`adm_valuation_based`, `has_unit_verification_fee`.

Плюсы: правка в одном месте вместо восьми, расхождения структурно невозможны, единое
форматирование. Минус: документ длиннее и требует аккуратности при редактировании.

Если объединение кажется рискованным — оставляем 8 документов, но тогда общую часть надо
один раз выровнять по эталону и дальше править всегда во всех восьми.

---

## G. Что нужно от Алины

1. Удалить 8 файлов .docx из папки (у меня нет прав — я редактор, а не владелец).
2. Решить по разделам A и B — какая версия верная.
3. Ответить по разделу C: осознанны ли структурные различия (особенно C1, C2, C3, C5).
4. Решить по разделу D: выравниваем форматирование по одному стандарту?
   Рекомендую вариант Ready/C3 (способы оплаты жирным) — он читается лучше в таблице.
5. Решить: объединяем в 3 шаблона или оставляем 8 (раздел F).
