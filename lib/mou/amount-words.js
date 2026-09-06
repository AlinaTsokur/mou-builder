// Сумма прописью по-английски для договоров: «AED 150,000.00 (One hundred fifty
// thousand dirhams)». Так написано в шаблоне Ready, поэтому первое слово с большой
// буквы, остальные строчными, валюта — dirhams, копейки — fils.
// Алина, 06.09.2026: пропись генерируем сами, руками её никто не пишет.

const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const SCALES = [
  [1e9, "billion"],
  [1e6, "million"],
  [1e3, "thousand"],
];

function underThousand(n) {
  const parts = [];
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds) parts.push(`${ONES[hundreds]} hundred`);
  if (rest < 20) {
    if (rest) parts.push(ONES[rest]);
  } else {
    const tens = Math.floor(rest / 10);
    const ones = rest % 10;
    parts.push(ones ? `${TENS[tens]}-${ONES[ones]}` : TENS[tens]);
  }
  return parts.join(" ");
}

// Целое число прописью, строчными буквами.
export function numberToWords(value) {
  let n = Math.floor(Math.abs(Number(value) || 0));
  if (n === 0) return "zero";
  const parts = [];
  for (const [scale, name] of SCALES) {
    if (n >= scale) {
      parts.push(`${underThousand(Math.floor(n / scale))} ${name}`);
      n %= scale;
    }
  }
  if (n) parts.push(underThousand(n));
  return parts.join(" ");
}

// Сумма в дирхамах прописью, с первой заглавной: «One hundred fifty thousand dirhams».
// Филсы добавляются, только если они есть: «… dirhams and fifty fils».
export function amountToWords(value) {
  if (value === "" || value === null || value === undefined) return "";
  const number = Number(String(value).replace(/,/g, ""));
  if (!Number.isFinite(number)) return "";
  const dirhams = Math.floor(Math.abs(number));
  const fils = Math.round((Math.abs(number) - dirhams) * 100);
  let words = `${numberToWords(dirhams)} dirham${dirhams === 1 ? "" : "s"}`;
  if (fils) words += ` and ${numberToWords(fils)} fil${fils === 1 ? "" : "s"}`;
  return words.charAt(0).toUpperCase() + words.slice(1);
}
