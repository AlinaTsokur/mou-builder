import assert from "node:assert/strict";
import test from "node:test";
import { amountToWords, numberToWords } from "../lib/mou/amount-words.js";

test("целые числа прописью", () => {
  assert.equal(numberToWords(0), "zero");
  assert.equal(numberToWords(7), "seven");
  assert.equal(numberToWords(15), "fifteen");
  assert.equal(numberToWords(21), "twenty-one");
  assert.equal(numberToWords(100), "one hundred");
  assert.equal(numberToWords(150000), "one hundred fifty thousand");
  assert.equal(numberToWords(5280135), "five million two hundred eighty thousand one hundred thirty-five");
});

test("сумма в дирхамах прописью", () => {
  assert.equal(amountToWords("150,000.00"), "One hundred fifty thousand dirhams");
  assert.equal(amountToWords(1), "One dirham");
  assert.equal(amountToWords("1,037.50"), "One thousand thirty-seven dirhams and fifty fils");
  assert.equal(amountToWords(""), "");
  assert.equal(amountToWords("не число"), "");
});
