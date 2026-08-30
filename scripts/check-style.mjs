// Сверка оформления: node scripts/check-style.mjs <размеченный> <эталон до разметки>
//
// Кроме жирного сверяются курсив, подчёркивание, зачёркивание, кегль, гарнитура,
// цвет и параметры абзаца — выравнивание и отступы.
//
// Замена куска текста в Google Docs берёт стиль первого символа диапазона.
// Если правка накрыла несколько кусков с разным начертанием, жирный пропадает
// или переезжает на соседние слова — глазами это ловится только на распечатке.
// Сравниваем не долю жирного, а сами жирные слова: пропажу и появление лишнего.
import { getBotClients } from "./google-bot.mjs";
import { alignWords } from "./markup/word-align.mjs";

const { docs } = getBotClients();

// Абзацы берём из всех сегментов: подписи и печати живут в подвале.
// Подпись оформления куска: всё, кроме жирного — он сверяется отдельно по словам
const sigOf = (t) => [
  t.italic ? "курсив" : "", t.underline ? "подчёркнут" : "", t.strikethrough ? "зачёркнут" : "",
  t.fontSize?.magnitude || "", t.weightedFontFamily?.fontFamily || "",
  JSON.stringify(t.foregroundColor || null),
].join("|");

// Слова абзаца со всем их оформлением. Маркеры пропускаем: в готовом договоре
// их нет, начертание внутри них ничего не значит.
function styledWords(p) {
  const cs = [];
  for (const r of p.all || p.runs) for (const ch of r.text) cs.push({ ch, bold: r.bold, sig: r.sig });
  const text = cs.map((c) => c.ch).join("");
  const mark = new Array(text.length).fill(false);
  for (const m of text.matchAll(/\{\{[^}]*\}\}/g)) {
    for (let i = m.index; i < m.index + m[0].length; i += 1) mark[i] = true;
  }
  const out = [];
  for (const m of text.matchAll(/[\p{L}\p{N}%]+/gu)) {
    if (mark[m.index]) continue;
    out.push({ word: m[0], bold: cs[m.index].bold, sig: cs[m.index].sig });
  }
  return out;
}

function paragraphs(doc) {
  const out = [];
  const walk = (content, segmentId) => {
    for (const el of content || []) {
      if (el.paragraph) {
        const st = el.paragraph.paragraphStyle || {};
        const all = (el.paragraph.elements || []).filter((e) => e.textRun?.content);
        const runs = all
          .map((e) => ({
            text: e.textRun.content,
            bold: !!e.textRun.textStyle?.bold,
            sig: sigOf(e.textRun.textStyle || {}),
          }))
          .filter((r) => r.text.trim());
        if (runs.length) {
          out.push({
            runs, segmentId,
            // все куски, включая пробельные: если их выкинуть, соседние слова
            // склеятся и сравнение придумает несуществующие слова
            all: all.map((e) => ({
              text: e.textRun.content,
              bold: !!e.textRun.textStyle?.bold,
              sig: sigOf(e.textRun.textStyle || {}),
            })),
            align: st.alignment || "",
            indent: JSON.stringify(st.indentFirstLine || null) + JSON.stringify(st.indentStart || null),
            spaceAbove: JSON.stringify(st.spaceAbove || null),
          });
        }
      }
      if (el.table) for (const r of el.table.tableRows || []) for (const c of r.tableCells || []) walk(c.content, segmentId);
    }
  };
  const holders = doc.tabs?.length ? doc.tabs.map((t) => t.documentTab || {}) : [doc];
  for (const h of holders) {
    walk(h.body?.content, "");
    for (const kind of ["headers", "footers"]) {
      for (const [id, obj] of Object.entries(h[kind] || {})) walk(obj.content, id);
    }
  }
  return out;
}

// Ключ абзаца: только буквы. Суммы, даты и маркеры меняются разметкой,
// поэтому в ключ не идут. Одинаковые ключи нумеруем — иначе два похожих
// абзаца сравнивались бы с одним и тем же эталонным.
function keys(list) {
  const seen = new Map();
  return list.map((p) => {
    const base = p.runs.map((r) => r.text).join("")
      .replace(/\{\{[^}]*\}\}/g, "")
      .replace(/[^\p{L}]/gu, "")
      .toLowerCase()
      .slice(0, 60);
    const n = seen.get(base) || 0;
    seen.set(base, n + 1);
    return { ...p, key: `${base}#${n}`, base };
  });
}

const [markedId, referenceId] = process.argv.slice(2);
if (!markedId || !referenceId) throw new Error("укажи два ID: размеченный и эталон");

const marked = keys(paragraphs((await docs.documents.get({ documentId: markedId })).data));
const reference = keys(paragraphs((await docs.documents.get({ documentId: referenceId })).data));

const refByKey = new Map(reference.map((p) => [p.key, p]));

const problems = [];
let compared = 0;
for (const p of marked) {
  const ref = refByKey.get(p.key);
  if (!ref || p.base.length < 12) continue;
  compared += 1;
  // Сопоставляем слова через наибольшую общую подпоследовательность:
  // плейсхолдеры выбрасывают слова из абзаца, и счёт по номеру слова съезжает.
  const pairs = alignWords(styledWords(ref), styledWords(p));
  const lost = [];
  const extra = [];
  const styleDiffs = [];
  for (const [was, now] of pairs) {
    if (was.bold && !now.bold) lost.push(was.word);
    if (!was.bold && now.bold) extra.push(now.word);
    if (was.sig !== now.sig) styleDiffs.push(`«${was.word}»: было ${was.sig}, стало ${now.sig}`);
  }
  for (const f of ["align", "indent", "spaceAbove"]) {
    if (p[f] !== ref[f]) styleDiffs.push(`${f}: было ${ref[f]}, стало ${p[f]}`);
  }

  if (lost.length || extra.length || styleDiffs.length) {
    problems.push({
      text: (p.all || p.runs).map((r) => r.text).join("").trim().slice(0, 80),
      segmentId: p.segmentId,
      lost, extra, styleDiffs,
    });
  }
}

console.log(`абзацев сверено: ${compared} из ${marked.length}, расхождений: ${problems.length}`);
for (const p of problems) {
  console.log(`\n  ${p.segmentId ? `[${p.segmentId}] ` : ""}${p.text}`);
  if (p.lost.length) console.log(`    пропал жирный: ${p.lost.join(", ")}`);
  if (p.extra.length) console.log(`    лишний жирный: ${p.extra.join(", ")}`);
  p.styleDiffs.forEach((d) => console.log(`    ${d.slice(0, 180)}`));
}
process.exitCode = problems.length ? 1 : 0;
