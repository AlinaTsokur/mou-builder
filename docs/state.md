# Состояние работ

Оперативная память проекта: что сделано, что ждём, что дальше. Общий план —
`plan.md`, правила и адреса — `project-memory.md`.

Обновлено: 13.09.2026

## Сейчас

Три шаблона переведены на движок v2 и работают на проде: №1 off-plan, №2 off-plan
ипотека, №3 Ready cash to cash. Следующий — №4 Ready cash to mortgage.

## Шаблоны на движке v2

| # | Шаблон | Размечен | Бэкап до разметки | Правок |
|---|--------|----------|-------------------|--------|
| 1 | Off-plan `1LLMqzZ1xeSPzVOhVahG4B8l9bQx0KggFBvZUynOY8bU` | 30.08 | `1KThc8Zq0G50zppR_cRGech6nhyyZSsTwzdw2_uM2RTo` | 170 |
| 2 | Off-plan ипотека `1RjrVeLZG65Fyzc5h0TFR0sks8D--jJocEXyF2H9fg9g` | 05.09 | `12Zcp4G28uLcBEh0XtF1ulgAotC8uju6UV6oPBRMCcU8` | 179 |
| 3 | Ready cash to cash `1d-bXwKBO9J8fUQ35vqKWw5KzADJ6lB6fmD4hxeSjy3k` | 08.09 | `121Mwvo-6GlqkEJ3fMZ52DsdF4XrvdTVm9UpcY6L_0o4` | 178 |

Разметка неидемпотентна: повторный прогон по уже размеченному документу его сломает.
Перед прогоном по оригиналу бэкап делается сам (`--original`).

## Папки с тестовыми договорами

Договоры для проверки глазами, сгенерированы тем же кодом, что и сайт, и сверены
с шаблоном слово в слово (`scripts/verify-batch.mjs`).

- №1 off-plan, 16 договоров: `1dlghjYRbyV86tPdpSF-D5naSYpoHyOzY`
- №2 off-plan ипотека, 16 договоров: `1LULl4rudx4ceyH4XvsZ3vnIF1ithM8CE`
- №3 Ready cash to cash, 18 договоров: `1lGuaPXKl2cE0HvzJCTk7bS2GxvqSwnJB`

Устаревшие пакеты переименовываются в «УСТАРЕЛО — …», а не удаляются.

## Ждём ответа Миши

1. «Bailing» в строке ADM Fee — что это должно значить.
2. Нужен ли админ-сбор 575 в готовых объектах и в ипотеке.
3. Type of Area в готовых объектах: в исходнике №3 стояло «Residential - Household
   Living», сейчас так подставляется только для Garden Residence и C3, для остальных
   «Residential». Пока оставлено как есть.

Плюс вопрос 24 из ревью: включать ли артикль «the» в определяемый термин в шапке.

## Решения, принятые Алиной

- В готовых объектах способ оплаты Продавцу зашит: только Manager's Cheque,
  поле в форме заблокировано (06.09).
- Суммы NOC и ADM в готовых объектах фиксированные, но правятся перед генерацией:
  Developer NOC 2 750, Community NOC 1 050, ADM Electronic 919, ADM Valuation 1 037.
- ADM Fee в ипотеке и готовых объектах — ровно 2% от Selling Price, без админ-части.
- Номер проекта в готовых объектах вводится вручную, номер парковки — конкретный.
- «REVENUE ACCOU» в строке ADM Fee — не опечатка, так и должно быть.
- Мягкий режим валидации оставлен: договор создаётся даже с пропусками, пока на
  Vercel нет `MOU_REQUIRE_VALIDATION=true`. Включать — решение Алины.

## Дальше

1. №4 Ready cash to mortgage `1slUJ8aQCw8nKIhlKBHWvhUFkLWnLH3k_N_OtwH5sm3Y` — 19 статей.
   Это №3 плюс ипотечная часть из №2, оба куска уже разобраны.
2. №5 Ready mortgage to cash `1RDNBmgnI3V-1o-Nk--g4XJUpwvHP0sC2IrGY7R_hhw0`.
3. №6 Ready mortgage to mortgage `1tRz59MGjnZKQpAZv0q_QMU4W6UPFLDBLr8uKPZYWP3w`.
4. C3-1 и C3-2 — нужен блок стороны-юрлица, его ещё нет.

Порядок работы с новым шаблоном: прочитать документ с комментариями → задать Алине
вопросы по расхождениям → разметить черновик → проверки → пакет договоров →
по «да» Алины разметить оригинал → вписать в реестр `lib/mou/config.js`.
