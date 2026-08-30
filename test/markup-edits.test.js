import test from "node:test";
import assert from "node:assert/strict";
import { buildEdits } from "../scripts/markup/offplan-edits.mjs";
import { OFFPLAN } from "../scripts/markup/offplan-deals.mjs";

test("список правок off-plan собирается целиком", () => {
  const edits = buildEdits(OFFPLAN);
  assert.equal(edits.length, 188);
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
