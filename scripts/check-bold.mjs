// Сверка начертания: node scripts/check-bold.mjs <размеченный> <эталон до разметки>
//
// Замена куска текста в Google Docs берёт стиль первого символа диапазона.
// Если правка накрыла несколько кусков с разным начертанием, жирный пропадает
// или переезжает на соседние слова — глазами это ловится только на распечатке.
// Сравниваем не долю жирного, а сами жирные слова: пропажу и появление лишнего.
import { getBotClients } from "./google-bot.mjs";

const { docs } = getBotClients();

// Абзацы берём из всех сегментов: подписи и печати живут в подвале.
function paragraphs(doc) {
  const out = [];
  const walk = (content, segmentId) => {
    for (const el of content || []) {
      if (el.paragraph) {
        const runs = (el.paragraph.elements || [])
          .map((e) => ({ text: e.textRun?.content || "", bold: !!e.textRun?.textStyle?.bold }))
          .filter((r) => r.text.trim());
        if (runs.length) out.push({ runs, segmentId });
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

// Жирные слова абзаца: сравниваем множества, а не проценты
// Маркеры вырезаем до разбивки на слова: они вставлены внутрь жирных кусков
// и унаследовали начертание, но в готовом договоре их нет — сравнивать нечего.
const boldWords = (runs) => new Set(
  runs.filter((r) => r.bold)
    .flatMap((r) => r.text.replace(/\{\{[^}]*\}\}/g, " ").split(/\s+/))
    .map((w) => w.replace(/[^\p{L}\p{N}%]/gu, ""))
    .filter((w) => w.length > 1 && !/^\d[\d.,]*$/.test(w)),
);

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
  const was = boldWords(ref.runs);
  const now = boldWords(p.runs);
  // Слова, которых в размеченном абзаце вообще нет, заменены плейсхолдером
  // (имя банка, дата, процент). Их начертание задаётся списком BOLD_REPAIR,
  // сравнивать с эталоном нечего — иначе каждый плейсхолдер даст ложную потерю.
  const markedText = p.runs.map((r) => r.text).join("").replace(/[^\p{L}\p{N}%]/gu, " ");
  const stillThere = (w) => new RegExp(`(^| )${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}( |$)`).test(markedText);
  const lost = [...was].filter((w) => !now.has(w) && stillThere(w));
  const extra = [...now].filter((w) => !was.has(w));
  if (lost.length || extra.length) {
    problems.push({
      text: p.runs.map((r) => r.text).join("").trim().slice(0, 80),
      segmentId: p.segmentId,
      lost, extra,
    });
  }
}

console.log(`абзацев сверено: ${compared} из ${marked.length}, расхождений: ${problems.length}`);
for (const p of problems) {
  console.log(`\n  ${p.segmentId ? `[${p.segmentId}] ` : ""}${p.text}`);
  if (p.lost.length) console.log(`    пропал жирный: ${p.lost.join(", ")}`);
  if (p.extra.length) console.log(`    лишний жирный: ${p.extra.join(", ")}`);
}
process.exitCode = problems.length ? 1 : 0;
