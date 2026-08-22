# Аудит шаблонов MOU — 22.08.2026

Сравнение 8 шаблонов из папки «Автоматизация». Цель — найти расхождения, которые
появились из-за правок в одном шаблоне без переноса в остальные.

⚠️ Ограничение: все файлы — .docx, при чтении теряется жирный шрифт. Пункты про
выделение проверю после конвертации в Google Docs.

Обозначения: **1** off-plan, **1.2** off-plan no deposit, **2** off-plan mortgage,
**3** cash→cash ready, **4** cash→mortgage ready, **5** mortgage→cash ready,
**C3-1** C3 cash, **C3-2** C3 mortgage.

---

## A. Ошибки — надо исправить

### A1. Оборванное предложение в ст. 8 (шаблон 5)
> «…and such failure does not arise due to Force Majeure, Buyer's Default, or any
> third-party reason beyond the Seller's reasonable control, including delays by the
> Seller's Bank in issuing the liability letter, clearance, or mortgage release, provided
> the Seller has complied with the Bank's requirements.»

Пропущено окончание: **«…, the Seller shall be deemed to be in Default in accordance with
the definition set out in this MOU.»** Предложение не имеет главной части.

### A2. «Buyer's» вместо «Seller's» в ст. 8 (шаблоны 2 и 4)
В статье про дефолт **Продавца** написано «any third-party reason beyond the **Buyer's**
reasonable control». Должно быть Seller's. В шаблонах 5 и C3-2 — правильно.

### A3. Слипшиеся определения (шаблон 2)
> «…materially delays the completion of the transaction.**The** Developer – ALDAR
> DEVELOPMENT L.L.C – O.P.C…»

Определения Force Majeure и The Developer склеились, «The» ушло в конец предыдущего абзаца.

### A4. Дублирующийся абзац в ст. 6 (шаблон 4)
Фраза «In the event that the Buyer is unable to obtain Final Mortgage Approval… bank
rejection letter» встречается **дважды**: после первого абзаца и ещё раз после абзаца
о возврате чеков.

### A5. Дата продавца в блоке SELLER'S AGENCY (все шаблоны)
Стоит `Date: {{buyer_signature_date}}` — должно быть `{{seller_signature_date}}`.
Ошибка присутствует во всех восьми шаблонах.

### A6. Шаблон 1.2 не размечен
В блоке подписей вместо плейсхолдеров — «Name Surname», даты пустые, агентства вписаны
руками (PRIME BRIDGE / S Q F REALTY). Остальные шаблоны хотя бы частично размечены.

### A7. Черновиковые разделители в тексте
Символы `__`, `—-`, `_____` (пометки альтернативных вариантов) остались в:
шаблонах **1** (ст. 7, 8), **2** (ст. 7), **3** (ст. 7, 8), **4** (ст. 7, 8),
**5** (ст. 7, 8, 10), **C3-1** (ст. 7, 8), **C3-2** (ст. 7).
При разметке заменяются на `{{#if}}`, но сейчас попадут в документ как есть.

---

## B. Расхождения формулировок — выбрать одну версию

### B1. Кому уходит копия уведомления о споре
| Формулировка | Шаблоны |
|---|---|
| «delivered to **Agencies** for their reference» | 1, 1.2 |
| «delivered to **Seller's agent and Buyer's agent**» | 2, 3, 4, 5, C3-1, C3-2 |

Мы договаривались использовать `{{agencies_word}}` (Agencies / the Agency). Большинство
шаблонов пошло по второму пути.

### B2. Держатель депозитного чека — «Agency» или «Agent»
| Формулировка | Шаблоны |
|---|---|
| «held by **The Seller's Agency / The Buyer's Agency** as stakeholder» | 1, 3, 5 |
| «held by **Seller's Agent / Buyer's Agent** as stakeholder» | 2, 4, C3-1, C3-2 |

Разная терминология и разные артикли для одной и той же роли.

### B3. Определение Transfer fee / NOC fee
| Что написано | Шаблоны |
|---|---|
| «Transfer fee – … registration. NOC fee is a fee charged for issuing…» (обе фразы) | 1, 2 |
| «Transfer fee – … registration.» (без NOC) | 1.2 |
| «NOC fee is a fee charged for issuing…» (без Transfer fee) | 3, 5, C3-1, C3-2 |
| «NOC — an official document stating…» (обрезано, нет «NOC fee is a fee charged») | 4 |

### B4. Определение Liquidated Damages при двух депозитах
Правило: удаляется, когда оба депозита включены. Фактически **определение присутствует
во всех шаблонах**, включая те, где в Payment Table стоят оба депозита (1, 2, 3, 4, 5).
Либо правило изменилось, либо надо обернуть маркером.

### B5. Порядок «in favour of» в ст. 6
| Порядок | Шаблоны |
|---|---|
| «…cheque No. X dated Y, issued by Z, drawn by A **in favour of B**» | 1, 3, 5 |
| «…Security Deposit cheque **in favour of B** by cheque No. X dated Y, issued by Z, drawn by A» | 2, 4, C3-1, C3-2 |

### B6. Мелочи в Payment Table
- «on the **Transfer Date** by Card» (1) vs «on the **transfer date** by **Credit Card**» (1.2)
- «on the **transfer date**» (1, 1.2) vs «on the **Transfer Date**» (Ready-группа)
- «ADM **Verification** Certificate» (2) vs «ADM **Valuation** Certificate» (3, 4, 5, C3-1) —
  похоже на опечатку в шаблоне 2
- Project name в примерах: «The Source» (1) / «the Source» (3, 5) / «C3 Garden» (4 — Ready-шаблон)

---

## C. Структурные различия — подтвердить, осознанны ли

### C1. Разный состав ADM-строк внутри off-plan группы
| Шаблон | Строки |
|---|---|
| 1, 1.2 | одна: «ADM Electronic Fee: (2% from Selling Price + AED 575)» |
| 2 | три: «ADM Fee (2% или по оценке ADM, что выше)» + «ADM Electronic Fee» + «ADM Verification Certificate» |

Существенное расхождение: в ипотечном off-plan структура как в Ready, в обычном off-plan —
своя. Это осознанно?

### C2. Шаблон 2 — нет строки threshold top-up
В шаблоне 1 есть «Remaining balance to complete 30% threshold…», в шаблоне 2 её нет,
и остаток застройщику платится «on the Transfer Date by a Manager's Cheque», а не
«in accordance with the Payment Plan». Подтвердить: в ипотечном off-plan действительно
нет top-up и всё гасится на Transfer Date?

### C3. Шаблон 1.2 содержит LPC-пункт
«In the event that any Late Payment Charges (LPC) are incurred in relation to the payment
due on 14 August 2026…» — мы решили LPC не добавлять, но в этом шаблоне он есть.
Оставляем как опциональный блок с полем даты или убираем?

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

### C7. Расхождение внутри группы C3
| Строка | C3-1 (cash) | C3-2 (mortgage) |
|---|---|---|
| ADM Electronic Fee | AED 925.75 | AED 1,392.00 |
| Unit Verification / Search Certificate | нет строки | AED 103.50 |
| Security deposit | только Buyer | только Buyer |

### C8. Юрлицо как сторона (C3-1, C3-2)
Seller = «LUCKY HOLDING - F.Z.E, Trade License #46879, Issue Date…, Expiry Date…,
acting through its shareholders…». Это отдельная структура блока стороны — компания,
а не физлицо. Сейчас код умеет собирать только физлиц.

### C9. Ст. 4, подпись под таблицей
- Шаблон 5: «The Selling Price **and the Agency Fee**…» (без «the amount payable to the
  Seller» — потому что сумма зависит от Liability Letter). Похоже осознанно.
- Остальные: «The Selling Price, **the amount payable to the Seller**, and the Agency Fee…»

### C10. Ст. 10 в шаблоне 5 — три несогласованных абзаца
Идут подряд: mortgage release + «Buyer confirms… own funds» + `___` + «Buyer confirms…
Personal Loan, Equity Release». Второй и третий — взаимоисключающие варианты.

---

## D. Что одинаково во всех шаблонах (эталон)

Эти блоки совпадают дословно — их можно считать общей базой:

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
- Финальная таблица подписей

---

## E. Предложение: 3 шаблона вместо 8

Общая часть — примерно 70% текста. Различия сводятся к набору флагов:

| Группа | Что внутри различается |
|---|---|
| **Off-plan** (1, 1.2, 2) | депозиты вкл/выкл, ипотека вкл/выкл, threshold top-up, состав ADM-строк |
| **Ready** (3, 4, 5) | ипотека покупателя, ипотека продавца (Liability Letter), vacant/tenancy |
| **C3** (C3-1, C3-2) | ипотека покупателя, свои строки NOC/Admin Fee |

Новые флаги, которых пока нет в движке:
`buyer_mortgage`, `seller_mortgage`, `property_vacant`, `seller_is_company`,
`has_threshold_top_up` (есть), `adm_valuation_based`.

Плюсы: правка в одном месте вместо восьми, расхождения структурно невозможны.
Минус: один документ длиннее и требует аккуратности при редактировании.

Если объединение кажется рискованным — можно оставить 8 документов, но тогда общую часть
надо один раз выровнять по эталону и дальше править всегда во всех.

---

## F. Что нужно от Алины

1. Решить по каждому пункту разделов A и B (ошибки и расхождения) — какая версия верная.
2. Ответить по разделу C: осознанны ли структурные различия (особенно C1, C2, C3, C5).
3. Решить: объединяем в 3 шаблона или оставляем 8 (раздел E).
4. Конвертировать .docx → Google Docs (в Drive: правый клик → Открыть с помощью →
   Google Документы → Файл → Сохранить как документ Google). После этого проверю
   форматирование (жирный шрифт), которое из .docx не читается.
