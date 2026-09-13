import test from "node:test";
import assert from "node:assert/strict";
import { buildEdits } from "../scripts/markup/offplan-edits.mjs";
import { OFFPLAN } from "../scripts/markup/offplan-deals.mjs";

test("список правок off-plan собирается целиком", () => {
  const edits = buildEdits(OFFPLAN);
  assert.equal(edits.length, 172);
  for (const e of edits) {
    assert.ok(e.find || e.cellAfter, `правка без find: ${JSON.stringify(e)}`);
    assert.ok(e.replace !== undefined || e.insertBefore !== undefined || e.bold !== undefined,
      `правка без замены: ${JSON.stringify(e)}`);
  }
});

test("заголовки статей идут от последней к первой", () => {
  const heads = buildEdits(OFFPLAN).filter((e) => /^Article \d+$/.test(e.find));
  assert.equal(heads.length, 17);
  assert.equal(heads[0].find, "Article 17");
  assert.equal(heads.at(-1).find, "Article 1");
});

test("без строки порога правок меньше ровно на четыре", () => {
  const full = buildEdits(OFFPLAN).length;
  const short = buildEdits({ ...OFFPLAN, hasThresholdRow: false }).length;
  assert.equal(full - short, 4);
});

// ═══ шаблон №2 — ипотека
import { OFFPLAN_MORTGAGE, THRESHOLD_ROW } from "../scripts/markup/offplan-deals.mjs";

test("список правок для ипотечного шаблона собирается целиком", () => {
  const edits = buildEdits(OFFPLAN_MORTGAGE);
  assert.equal(edits.length, 180);
  for (const e of edits) {
    assert.ok(e.find || e.cellAfter, `правка без find: ${JSON.stringify(e)}`);
    assert.ok(e.replace !== undefined || e.insertBefore !== undefined || e.bold !== undefined,
      `правка без замены: ${JSON.stringify(e)}`);
  }
  const heads = edits.filter((e) => /^Article \d+$/.test(e.find));
  assert.equal(heads.length, 18);
  assert.equal(heads[0].find, "Article 18");
  assert.equal(heads.at(-1).find, "Article 1");
  // способ оплаты Продавцу не трогаем («только чек»), строки порога в документе нет
  assert.ok(!edits.some((e) => e.replace === "{{amount_to_seller_payment_text}}"));
  assert.ok(!edits.some((e) => e.find === "Remaining balance to complete "));
  // ссылки на ипотечные статьи — динамические, обе
  assert.equal(edits.filter((e) => e.find === "described in Articles 10 and 11").length, 2);
});

test("ипотечные правки ст.7–8 дают ту же разметку, что у №1", () => {
  const mortgage = buildEdits(OFFPLAN_MORTGAGE);
  const markersOf = (list) => list.flatMap((e) => String(e.replace ?? e.insertBefore ?? "").match(/\{\{[#/][^}]*\}\}/g) || []);
  const count = (list, m) => markersOf(list).filter((x) => x === m).length;
  // у Продавца в №2 вторая фраза добавляется правкой, поэтому seller_deposit открывается
  assert.ok(count(mortgage, "{{#if seller_deposit}}") >= 2);
  assert.ok(count(mortgage, "{{#if !seller_deposit}}") >= 1);
  // фактический баланс маркеров считает check-markup по документу: в списке правок
  // маркеры повторяются в find/replace, по нему баланс не свести
});

test("строка порога для №2 — с маркером строки и всеми плейсхолдерами №1", () => {
  const text = THRESHOLD_ROW.cells.flat().map(([t]) => t).join("");
  assert.ok(text.startsWith("{{#row has_top_up}}"));
  for (const key of ["transfer_threshold_percent", "threshold_top_up_amount", "escrow_account_name"]) {
    assert.ok(text.includes(`{{${key}}}`), key);
  }
});

test("строка остатка застройщику размечается условием", () => {
  const edit = buildEdits(OFFPLAN).find((e) => e.find === "Remaining balance of 70% of the Original Price");
  assert.ok(edit, "правка строки остатка не найдена");
  assert.ok(edit.replace.startsWith("{{#row has_developer_balance}}"));
});

// ═══ шаблон №3 — Ready cash to cash
import { READY_CASH, ARTICLES_READY_CASH } from "../scripts/markup/ready-deals.mjs";

test("список правок для Ready cash-to-cash собирается целиком", () => {
  const edits = buildEdits(READY_CASH);
  assert.equal(edits.length, 178);
  assert.equal(ARTICLES_READY_CASH.length, 18);
  const heads = edits.filter((e) => /^Article \d+$/.test(e.find));
  assert.equal(heads.length, 18);
  assert.equal(heads[0].find, "Article 18");
  // в готовом объекте нет платежей застройщику
  assert.ok(!edits.some((e) => e.replace === "AED {{original_price}}"));
  assert.ok(!edits.some((e) => String(e.replace || "").includes("{{remaining_developer_balance}}")));
  // и есть два NOC-сбора со своим состоянием объекта
  assert.ok(edits.some((e) => e.replace === "AED {{developer_noc_fee}}"));
  assert.ok(edits.some((e) => e.replace === "AED {{community_noc_fee}}"));
  assert.ok(edits.some((e) => e.insertBefore === "{{#if property_rented}}"));
});

// ═══ шаблон №4 — Ready cash to mortgage
import { READY_MORTGAGE, ARTICLES_READY_MORTGAGE } from "../scripts/markup/ready-deals.mjs";
import { ARTICLE_DEFS_READY_MORTGAGE_V2 } from "../lib/mou/articles.js";

test("список правок для Ready cash-to-mortgage собирается целиком", () => {
  const edits = buildEdits(READY_MORTGAGE);
  assert.equal(edits.length, 182);
  for (const e of edits) {
    assert.ok(e.find || e.cellAfter, `правка без find: ${JSON.stringify(e)}`);
    assert.ok(e.replace !== undefined || e.insertBefore !== undefined, `правка без замены: ${JSON.stringify(e)}`);
  }
  const heads = edits.filter((e) => /^Article \d+$/.test(e.find));
  assert.equal(heads.length, 19);
  assert.equal(heads[0].find, "Article 19");
  // ипотечные ст.7–8 из №2, сборы и аренда из №3, плюс справка Unit Verification
  assert.equal(edits.filter((e) => e.find === "described in Articles 10 and 11").length, 2);
  assert.ok(edits.some((e) => e.replace === "AED {{unit_verification_fee}}"));
  assert.ok(edits.some((e) => e.replace === "AED {{developer_noc_fee}}"));
  assert.ok(edits.some((e) => e.insertBefore === "{{#if property_rented}}"));
  // решение 13.09.2026: как в №2, сумма пре-одобрения из ст.10 убрана
  assert.ok(edits.some((e) => e.replace === "obtained Mortgage Pre-Approval and that"));
  // строк застройщику и порога в готовом объекте нет
  assert.ok(!edits.some((e) => e.find === "Remaining balance of 70% of the Original Price"));
});

test("статьи №4 в разметке и в коде совпадают", () => {
  assert.equal(ARTICLES_READY_MORTGAGE.length, ARTICLE_DEFS_READY_MORTGAGE_V2.length);
  ARTICLES_READY_MORTGAGE.forEach(([num, key], i) => {
    assert.equal(ARTICLE_DEFS_READY_MORTGAGE_V2[i][0], key);
    assert.equal(ARTICLE_DEFS_READY_MORTGAGE_V2[i][1], num);
  });
});

// ═══ шаблон №5 — Ready mortgage to cash
import { READY_MORTGAGE_CASH, ARTICLES_READY_MORTGAGE_CASH } from "../scripts/markup/ready-deals.mjs";
import { ARTICLE_DEFS_READY_MORTGAGE_CASH_V2 } from "../lib/mou/articles.js";

test("список правок для Ready mortgage-to-cash собирается целиком", () => {
  const edits = buildEdits(READY_MORTGAGE_CASH);
  assert.equal(edits.length, 185);
  for (const e of edits) {
    assert.ok(e.find || e.cellAfter, `правка без find: ${JSON.stringify(e)}`);
    assert.ok(e.replace !== undefined || e.insertBefore !== undefined, `правка без замены: ${JSON.stringify(e)}`);
  }
  const heads = edits.filter((e) => /^Article \d+$/.test(e.find));
  assert.equal(heads.length, 18);
  // решения 13.09.2026: сбор за снятие ипотеки полем, банк Продавца полем, деньги Покупателя — выбор
  assert.ok(edits.some((e) => e.replace === "AED {{mortgage_release_fee}}"));
  assert.ok(edits.some((e) => e.replace === "{{seller_bank_name}}"));
  assert.ok(edits.some((e) => e.insertBefore === "{{#if buyer_own_funds}}"));
  assert.ok(edits.some((e) => e.replace?.includes("{{#if !buyer_own_funds}}")));
  // Personal Cheque — по правилу депозитных чеков (13.09.2026)
  assert.ok(edits.some((e) => e.note === "ст.10: кто держит Personal Cheque"));
  // приписка про Liability Letter стоит сразу после способа оплаты — его текст не трогаем
  assert.ok(!edits.some((e) => e.replace === "{{amount_to_seller_payment_text}}"));
  // сборы и аренда — как в №3
  assert.ok(edits.some((e) => e.replace === "AED {{developer_noc_fee}}"));
  assert.ok(edits.some((e) => e.insertBefore === "{{#if property_rented}}"));
  // «___» из ст.6 №3 в №5 нет: общий поиск «___» задел бы «_____» в ст.8
  assert.ok(!edits.some((e) => e.find === "___"));
});

test("статьи №5 в разметке и в коде совпадают", () => {
  assert.equal(ARTICLES_READY_MORTGAGE_CASH.length, ARTICLE_DEFS_READY_MORTGAGE_CASH_V2.length);
  ARTICLES_READY_MORTGAGE_CASH.forEach(([num, key], i) => {
    assert.equal(ARTICLE_DEFS_READY_MORTGAGE_CASH_V2[i][0], key);
    assert.equal(ARTICLE_DEFS_READY_MORTGAGE_CASH_V2[i][1], num);
  });
});
