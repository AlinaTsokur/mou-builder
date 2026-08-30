// Вернуть начертание в размеченном шаблоне:
//   node scripts/fix-bold.mjs <размеченный> [эталон до разметки]
//
// Два шага. Первый — список BOLD_REPAIR: там, где текст заменён плейсхолдером
// и сравнивать не с чем (суммы, имя банка, дата), начертание задано вручную.
// Второй — если передан эталон, выравниваем начертание слово в слово: для каждого
// слова, которое есть и там и там, ставим то же, что было до разметки.
// Обе операции идемпотентные, запускать можно сколько угодно раз.
import { getBotClients } from "./google-bot.mjs";
import { applyEdits } from "./docs-edit.mjs";
import { BOLD_REPAIR } from "./markup/bold-repair.mjs";

const WORD = /[\p{L}\p{N}%]+/gu;

function paragraphs(doc) {
  const out = [];
  const walk = (content, segmentId) => {
    for (const el of content || []) {
      if (el.paragraph) {
        const runs = (el.paragraph.elements || [])
          .filter((e) => e.textRun?.content)
          .map((e) => ({ text: e.textRun.content, start: e.startIndex, bold: !!e.textRun.textStyle?.bold }));
        if (runs.some((r) => r.text.trim())) out.push({ runs, segmentId });
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

function keyed(list) {
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

// Плоский текст абзаца с абсолютным индексом и начертанием каждого символа
function chars(p) {
  const out = [];
  for (const r of p.runs) {
    for (let i = 0; i < r.text.length; i += 1) out.push({ c: r.text[i], index: r.start + i, bold: r.bold });
  }
  return out;
}

// Слова абзаца, кроме тех, что внутри {{...}}: начертание маркеров не важно,
// в готовом договоре их нет
function words(p) {
  const cs = chars(p);
  const text = cs.map((c) => c.c).join("");
  const inMarker = new Array(text.length).fill(false);
  for (const m of text.matchAll(/\{\{[^}]*\}\}/g)) {
    for (let i = m.index; i < m.index + m[0].length; i += 1) inMarker[i] = true;
  }
  const out = [];
  WORD.lastIndex = 0;
  let m;
  while ((m = WORD.exec(text))) {
    const from = m.index;
    const to = m.index + m[0].length;
    if (inMarker[from]) continue;
    out.push({ word: m[0], bold: cs[from].bold, start: cs[from].index, end: cs[to - 1].index + 1 });
  }
  return out;
}

const [markedId, referenceId] = process.argv.slice(2);
if (!markedId) throw new Error("укажи ID размеченного документа");

const { docs } = getBotClients();

const res = await applyEdits(docs, markedId, BOLD_REPAIR);
console.log(`список BOLD_REPAIR: применено ${res.done.length} из ${BOLD_REPAIR.length}`);
res.failed.forEach((f) => console.log("   ——", f));

if (!referenceId) process.exit(0);

const marked = keyed(paragraphs((await docs.documents.get({ documentId: markedId })).data));
const reference = keyed(paragraphs((await docs.documents.get({ documentId: referenceId })).data));
const refByKey = new Map(reference.map((p) => [p.key, p]));

const requests = [];
let touched = 0;
for (const p of marked) {
  const ref = refByKey.get(p.key);
  if (!ref || p.base.length < 12) continue;

  // Считаем вхождения: одно и то же слово в абзаце может быть жирным в одном
  // месте и обычным в другом («the Agreement» против «Commission Agreement»),
  // поэтому ключ — слово плюс порядковый номер, а не просто слово.
  const numbered = (list) => {
    const seen = new Map();
    return list.map((w) => {
      const n = seen.get(w.word) || 0;
      seen.set(w.word, n + 1);
      return { ...w, key: `${w.word}#${n}` };
    });
  };
  const want = new Map(numbered(words(ref)).map((w) => [w.key, w.bold]));

  for (const w of numbered(words(p))) {
    if (!want.has(w.key)) continue;
    const desired = want.get(w.key);
    if (desired === w.bold) continue;
    requests.push({ updateTextStyle: {
      range: { ...(p.segmentId ? { segmentId: p.segmentId } : {}), startIndex: w.start, endIndex: w.end },
      textStyle: { bold: desired }, fields: "bold",
    } });
    touched += 1;
  }
}

console.log(`выравнивание по эталону: слов поправлено ${touched}`);
for (let i = 0; i < requests.length; i += 200) {
  await docs.documents.batchUpdate({ documentId: markedId, requestBody: { requests: requests.slice(i, i + 200) } });
}
