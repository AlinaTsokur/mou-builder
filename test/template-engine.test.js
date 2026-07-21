import test from "node:test";
import assert from "node:assert/strict";

import { buildConditionalPlan, buildRowPlan, findResidualMarkers } from "../lib/google/template-engine.js";
import { buildFlags, buildReplacementsV2, calculate, depositHolder, normalizeForm } from "../lib/mou/core.js";

// ---------- helpers: синтетический документ в форме Google Docs ----------

function buildDoc(blocks) {
  let index = 1;
  const content = [];
  const chars = new Map();

  const pushParagraph = (target, raw) => {
    const text = raw.endsWith("\n") ? raw : `${raw}\n`;
    const start = index;
    for (const ch of text) {
      chars.set(index, ch);
      index += 1;
    }
    target.push({
      startIndex: start,
      endIndex: index,
      paragraph: {
        elements: [{ startIndex: start, endIndex: index, textRun: { content: text } }],
      },
    });
  };

  for (const block of blocks) {
    if (typeof block === "string") {
      pushParagraph(content, block);
    } else if (block.table) {
      const tableStart = index;
      index += 1; // структурный индекс начала таблицы
      const tableRows = block.table.map((rowCells) => ({
        tableCells: rowCells.map((cellText) => {
          index += 1; // структурный индекс ячейки
          const cellContent = [];
          const saved = content.length;
          pushParagraphIntoCell(cellContent, cellText);
          return { content: cellContent };
        }),
      }));
      content.push({ startIndex: tableStart, endIndex: index, table: { tableRows } });
      index += 1;
    }
  }

  function pushParagraphIntoCell(target, raw) {
    pushParagraph(target, raw);
  }

  return { doc: { body: { content } }, chars };
}

function applyDeletes(chars, requests) {
  for (const request of requests) {
    const range = request.deleteContentRange?.range;
    if (!range) continue;
    for (let i = range.startIndex; i < range.endIndex; i += 1) chars.delete(i);
  }
  return Array.from(chars.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, ch]) => ch)
    .join("");
}

function renderConditionals(blocks, flags) {
  const { doc, chars } = buildDoc(blocks);
  const plan = buildConditionalPlan(doc, flags);
  return { text: applyDeletes(chars, plan.requests), plan };
}

// ---------- {{#if}} ----------

test("inline if: true оставляет текст без маркеров", () => {
  const { text } = renderConditionals(["Hello {{#if x}}World{{/if}}!"], { x: true });
  assert.equal(text, "Hello World!\n");
});

test("inline if: false удаляет фрагмент", () => {
  const { text } = renderConditionals(["Hello {{#if x}}World{{/if}}!"], { x: false });
  assert.equal(text, "Hello !\n");
});

test("отрицание {{#if !x}}", () => {
  const { text } = renderConditionals(["A{{#if !x}}B{{/if}}C"], { x: false });
  assert.equal(text, "ABC\n");
  const { text: text2 } = renderConditionals(["A{{#if !x}}B{{/if}}C"], { x: true });
  assert.equal(text2, "AC\n");
});

test("блочный if на несколько абзацев: false удаляет блок вместе с маркерами и абзацами", () => {
  const blocks = ["{{#if x}}", "Content line", "{{/if}}", "After"];
  assert.equal(renderConditionals(blocks, { x: false }).text, "After\n");
  assert.equal(renderConditionals(blocks, { x: true }).text, "Content line\nAfter\n");
});

test("вариантная пара из шаблона ст. 6 (вложенные if)", () => {
  const blocks = [
    "{{#if bd}}{{#if !bcd}}",
    "Variant A",
    "{{/if}}{{#if bcd}}",
    "Variant B",
    "{{/if}}{{/if}}",
    "Tail",
  ];
  assert.equal(renderConditionals(blocks, { bd: true, bcd: true }).text, "Variant B\nTail\n");
  assert.equal(renderConditionals(blocks, { bd: true, bcd: false }).text, "Variant A\nTail\n");
  assert.equal(renderConditionals(blocks, { bd: false, bcd: true }).text, "Tail\n");
  assert.equal(renderConditionals(blocks, { bd: false, bcd: false }).text, "Tail\n");
});

test("выбор лид-фразы: два смежных инлайн-ifа", () => {
  const blocks = ["{{#if dep}}The forfeited Security Deposit{{/if}}{{#if !dep}}This amount{{/if}} shall be distributed"];
  assert.equal(renderConditionals(blocks, { dep: true }).text, "The forfeited Security Deposit shall be distributed\n");
  assert.equal(renderConditionals(blocks, { dep: false }).text, "This amount shall be distributed\n");
});

test("неизвестный флаг: текст сохраняется, маркеры стираются, флаг в отчёте", () => {
  const { text, plan } = renderConditionals(["X{{#if mystery}}Y{{/if}}Z"], {});
  assert.equal(text, "XYZ\n");
  assert.deepEqual(plan.unknownFlags, ["mystery"]);
});

test("условие внутри ячейки таблицы: false очищает ячейку, не трогая перевод строки ячейки", () => {
  const { doc, chars } = buildDoc([
    { table: [["{{#if a}}Agent cell{{/if}}", "Other cell"]] },
    "After",
  ]);
  const plan = buildConditionalPlan(doc, { a: false });
  const text = applyDeletes(chars, plan.requests);
  assert.ok(!text.includes("Agent cell"));
  assert.ok(text.includes("Other cell"));
  assert.ok(text.includes("After"));
});

test("несбалансированные маркеры попадают в errors", () => {
  const { doc } = buildDoc(["{{#if x}}no close"]);
  const plan = buildConditionalPlan(doc, { x: true });
  assert.equal(plan.errors.length, 1);
});

// ---------- {{#row}} ----------

test("row-маркер: false удаляет строку, true стирает маркер", () => {
  const { doc } = buildDoc([
    {
      table: [
        ["Header", "H2"],
        ["{{#row keep}}Kept row", "v"],
        ["{{#row drop}}Dropped row", "v"],
      ],
    },
  ]);
  const plan = buildRowPlan(doc, { keep: true, drop: false });

  const deletions = plan.requests.filter((r) => r.deleteTableRow);
  assert.equal(deletions.length, 1);
  assert.equal(deletions[0].deleteTableRow.tableCellLocation.rowIndex, 2);

  const cleanups = plan.requests.filter((r) => r.replaceAllText);
  assert.equal(cleanups.length, 1);
  assert.equal(cleanups[0].replaceAllText.containsText.text, "{{#row keep}}");
});

test("удаление строк идёт снизу вверх и по таблицам с конца документа", () => {
  const { doc } = buildDoc([
    { table: [["{{#row x}}r0"], ["{{#row x}}r1"]] },
    { table: [["{{#row x}}r0"]] },
  ]);
  const plan = buildRowPlan(doc, { x: false });
  const dels = plan.requests.filter((r) => r.deleteTableRow);
  assert.equal(dels.length, 3);
  const tableStarts = dels.map((d) => d.deleteTableRow.tableCellLocation.tableStartLocation.index);
  assert.ok(tableStarts[0] >= tableStarts[1]);
  const firstTableRows = dels
    .filter((d) => d.deleteTableRow.tableCellLocation.tableStartLocation.index === Math.min(...tableStarts))
    .map((d) => d.deleteTableRow.tableCellLocation.rowIndex);
  assert.deepEqual(firstTableRows, [1, 0]);
});

test("findResidualMarkers находит все виды маркеров", () => {
  const { doc } = buildDoc(["{{#if a}}x{{/if}}", { table: [["{{#row b}}y"]] }]);
  const markers = findResidualMarkers(doc);
  assert.ok(markers.includes("{{#if a}}"));
  assert.ok(markers.includes("{{/if}}"));
  assert.ok(markers.includes("{{#row b}}"));
});

// ---------- флаги и расчёты v2 ----------

function v2Form(overrides = {}) {
  return normalizeForm({
    sellingPrice: "1000000",
    buyerDepositEnabled: "Yes",
    buyerDepositCalcType: "% of Selling Price",
    buyerDepositPercent: "10",
    sellerDepositEnabled: "Yes",
    sellerDepositCalcType: "% of Selling Price",
    sellerDepositPercent: "10",
    sellerAgentEnabled: "Yes",
    buyerAgentEnabled: "Yes",
    transferFeeLabel: "Transfer Fee",
    ...overrides,
  });
}

test("buildFlags: базовый сценарий", () => {
  const data = v2Form();
  const flags = buildFlags(data, calculate(data));
  assert.equal(flags.both_deposits, true);
  assert.equal(flags.any_deposit, true);
  assert.equal(flags.both_agents, true);
  assert.equal(flags.seller_agent_fee, true);
  assert.equal(flags.noc_fee, false);
  assert.equal(flags.buyer_cheque_details, true);
});

test("buildFlags: комиссия выключается отдельно от агента", () => {
  const data = v2Form({ sellerAgentFeeEnabled: "No" });
  const flags = buildFlags(data, calculate(data));
  assert.equal(flags.seller_agent, true);
  assert.equal(flags.seller_agent_fee, false);
  assert.equal(flags.any_agent_fee, true);
});

test("buildFlags: NOC из Transfer Fee Label, delayed-чек и третье лицо", () => {
  const data = v2Form({
    transferFeeLabel: "NOC Fee",
    buyerChequeTiming: "Delayed (within X days)",
    buyerChequeThirdParty: "Yes",
  });
  const flags = buildFlags(data, calculate(data));
  assert.equal(flags.noc_fee, true);
  assert.equal(flags.buyer_cheque_details, false);
  assert.equal(flags.buyer_cheque_third_party, true);
});

test("liquidated damages: равны своему депозиту, а без него — депозиту другой стороны", () => {
  const both = calculate(v2Form());
  assert.equal(both.buyerLiquidatedDamages, 100000);
  assert.equal(both.sellerLiquidatedDamages, 100000);

  const sellerOnly = calculate(v2Form({ buyerDepositEnabled: "No" }));
  assert.equal(sellerOnly.buyerLiquidatedDamages, 100000); // = депозит Seller
  assert.equal(sellerOnly.buyerLd80, 80000);
  assert.equal(sellerOnly.buyerLd20, 20000);
});

test("liquidated damages: без агента другой стороны 80% становится 100%", () => {
  const calc = calculate(v2Form({ sellerAgentEnabled: "No" }));
  assert.equal(calc.buyerLd80, 100000);
  assert.equal(calc.buyerLd20, "");
});

test("depositHolder: матрица держателей", () => {
  const both = v2Form();
  assert.equal(depositHolder("Buyer", both), "The Buyer’s Agency as stakeholder");
  assert.equal(depositHolder("Seller", both), "The Seller’s Agency as stakeholder");

  const delayed = v2Form({ buyerChequeTiming: "Delayed (within X days)" });
  assert.equal(depositHolder("Buyer", delayed), "The Seller’s Agency as stakeholder");

  const buyerAgentOnly = v2Form({ sellerAgentEnabled: "No" });
  assert.equal(depositHolder("Buyer", buyerAgentOnly), "The Buyer’s Agency as stakeholder");
  assert.equal(depositHolder("Seller", buyerAgentOnly), "The Buyer’s Agency as stakeholder");

  const noAgents = v2Form({ sellerAgentEnabled: "No", buyerAgentEnabled: "No" });
  assert.equal(depositHolder("Buyer", noAgents), "the Seller");
  assert.equal(depositHolder("Seller", noAgents), "the Buyer");
});

test("buildReplacementsV2: agencies_word, intro, return parties, подписи", () => {
  const data = v2Form({
    agreementDate: "21/07/2026",
    sellers: [{ name: "Ivan Ivanov", ownershipPercent: "100" }],
    buyers: [{ name: "Petr Petrov", ownershipPercent: "50" }, { name: "Anna Petrova", ownershipPercent: "50" }],
  });
  const r = buildReplacementsV2(data, calculate(data), {});
  assert.equal(r.agencies_word, "Agencies");
  assert.equal(r.seller_deposit_intro, "Similarly, upon signing this agreement,");
  assert.equal(r.deposit_return_parties, "the Buyer and to the Seller");
  assert.ok(r.buyer_signature_block.includes("Name: Petr Petrov"));
  assert.ok(r.buyer_signature_block.includes("Name: Anna Petrova"));
  assert.equal(r.buyer_liquidated_damages_amount, "100,000.00");

  const singleAgent = v2Form({ buyerAgentEnabled: "No", buyerDepositEnabled: "No" });
  const r2 = buildReplacementsV2(singleAgent, calculate(singleAgent), {});
  assert.equal(r2.agencies_word, "the Agency");
  assert.equal(r2.seller_deposit_intro, "Upon signing this agreement,");
  assert.equal(r2.deposit_return_parties, "the Seller");
});

test("normalizeForm: новые поля v2 с дефолтами", () => {
  const data = normalizeForm({});
  assert.equal(data.sellerAgentFeeEnabled, true);
  assert.equal(data.buyerAgentFeeEnabled, true);
  assert.equal(data.buyerChequeThirdParty, false);
  assert.equal(data.sellerAgentRepresentative, "");
});
