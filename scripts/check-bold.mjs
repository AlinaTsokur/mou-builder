// Сверка жирного: node scripts/check-bold.mjs <размеченный> <эталон до разметки>
// Замена куска текста в Google Docs берёт стиль первого символа диапазона.
// Если правка накрыла несколько кусков с разным начертанием, жирный пропадает —
// глазами это видно только на распечатке, поэтому сверяем по абзацам.
import { getBotClients } from "./google-bot.mjs";

const { docs } = getBotClients();

function paragraphs(doc) {
  const out = [];
  const walk = (content) => {
    for (const el of content || []) {
      if (el.paragraph) {
        const runs = (el.paragraph.elements || [])
          .map((e) => ({ text: e.textRun?.content || "", bold: !!e.textRun?.textStyle?.bold }))
          .filter((r) => r.text.trim());
        if (runs.length) out.push(runs);
      }
      if (el.table) for (const r of el.table.tableRows || []) for (const c of r.tableCells || []) walk(c.content);
    }
  };
  walk(doc.body.content);
  return out;
}

// ключ абзаца: только буквы, без сумм, дат и маркеров — они как раз и меняются
const keyOf = (runs) => runs.map((r) => r.text).join("")
  .replace(/\{\{[^}]*\}\}/g, "")
  .replace(/[\d.,%\s]/g, "")
  .toLowerCase()
  .slice(0, 60);

const boldShare = (runs) => {
  const total = runs.reduce((s, r) => s + r.text.trim().length, 0);
  const bold = runs.filter((r) => r.bold).reduce((s, r) => s + r.text.trim().length, 0);
  return total ? bold / total : 0;
};

const [markedId, referenceId] = process.argv.slice(2);
if (!markedId || !referenceId) throw new Error("укажи два ID: размеченный и эталон");

const marked = paragraphs((await docs.documents.get({ documentId: markedId })).data);
const reference = paragraphs((await docs.documents.get({ documentId: referenceId })).data);

const refByKey = new Map();
for (const runs of reference) {
  const k = keyOf(runs);
  if (k.length > 12 && !refByKey.has(k)) refByKey.set(k, runs);
}

const lost = [];
for (const runs of marked) {
  const k = keyOf(runs);
  const ref = refByKey.get(k);
  if (!ref) continue;
  const was = boldShare(ref);
  const now = boldShare(runs);
  if (was > 0.05 && now < was - 0.15) {
    lost.push({ was, now, text: runs.map((r) => r.text).join("").trim().slice(0, 90) });
  }
}

console.log(`абзацев сверено: ${marked.length}, потеряли жирный: ${lost.length}`);
for (const l of lost) {
  console.log(`\n  было ${Math.round(l.was * 100)}% → стало ${Math.round(l.now * 100)}%`);
  console.log(`  ${l.text}`);
}
process.exitCode = lost.length ? 1 : 0;
