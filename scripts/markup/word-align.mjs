// Сопоставление слов абзаца до и после разметки.
//
// Считать по порядковому номеру слова нельзя: плейсхолдер выбрасывает слова
// («Buyer’s Agent as stakeholder» → {{buyer_deposit_holder}}), и вся нумерация
// дальше по абзацу съезжает. Поэтому ищем наибольшую общую подпоследовательность
// и сравниваем только те слова, которые она спарила.
export function alignWords(a, b) {
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] = a[i].word === b[j].word
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const pairs = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i].word === b[j].word) {
      pairs.push([a[i], b[j]]);
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i += 1;
    } else {
      j += 1;
    }
  }
  return pairs;
}
