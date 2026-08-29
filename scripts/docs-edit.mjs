// Точечные правки Google Docs: находим текст, меняем/выделяем, не трогая остальное.
// Каждая правка применяется отдельным запросом с перечитыванием документа,
// поэтому индексы всегда актуальны и правки не сдвигают друг друга.

// Плоская карта символов документа: позиция в тексте → абсолютный индекс в Google Docs.
export function buildIndex(doc) {
  const chars = [];
  const walk = (content) => {
    for (const el of content || []) {
      if (el.paragraph) {
        for (const pe of el.paragraph.elements || []) {
          const run = pe.textRun;
          if (!run) continue;
          const bold = Boolean(run.textStyle?.bold);
          [...run.content].forEach((c, k) => chars.push({ c, i: pe.startIndex + k, bold }));
        }
      } else if (el.table) {
        for (const row of el.table.tableRows || []) {
          for (const cell of row.tableCells || []) walk(cell.content);
        }
      }
    }
  };
  walk(doc.body.content);
  return { chars, text: chars.map((x) => x.c).join("") };
}

// Границы абзаца, в котором лежит позиция pos (по переводам строк).
function paragraphBounds(text, pos) {
  const from = text.lastIndexOf("\n", pos - 1) + 1;
  const to = text.indexOf("\n", pos);
  return [from, to === -1 ? text.length : to];
}

// Ищем find; если задан within — только в абзаце, где встречается within.
function locate({ chars, text }, { find, within, nth = 0 }) {
  let searchFrom = 0;
  let searchTo = text.length;
  if (within) {
    const anchor = text.indexOf(within);
    if (anchor === -1) return null;
    [searchFrom, searchTo] = paragraphBounds(text, anchor);
  }
  let pos = -1;
  let seen = -1;
  let cursor = searchFrom;
  while (cursor < searchTo) {
    const hit = text.indexOf(find, cursor);
    if (hit === -1 || hit + find.length > searchTo) break;
    seen += 1;
    if (seen === nth) { pos = hit; break; }
    cursor = hit + 1;
  }
  if (pos === -1) return null;
  return { start: chars[pos].i, end: chars[pos + find.length - 1].i + 1, pos };
}

// Одна правка. Виды:
//   { find, replace }            — заменить текст
//   { find, bold: true|false }   — сменить начертание
//   { find, insertBefore }       — вставить текст перед найденным
// Плюс необязательные within (ограничить абзацем) и nth (какое по счёту вхождение).
export async function applyEdit(docs, documentId, edit) {
  const doc = (await docs.documents.get({ documentId })).data;
  const idx = buildIndex(doc);
  const hit = locate(idx, edit);
  if (!hit) return { ok: false, reason: `не найдено: «${edit.find.slice(0, 60)}»` };

  if (edit.dryRun) return { ok: true, dry: true };

  const requests = [];
  if (typeof edit.replace === "string") {
    requests.push({ deleteContentRange: { range: { startIndex: hit.start, endIndex: hit.end } } });
    if (edit.replace) {
      requests.push({ insertText: { location: { index: hit.start }, text: edit.replace } });
      // по умолчанию сохраняем начертание заменяемого фрагмента,
      // иначе вставка унаследует стиль соседнего символа
      const keepBold = edit.bold !== undefined ? edit.bold : idx.chars[hit.pos].bold;
      requests.push({ updateTextStyle: {
        range: { startIndex: hit.start, endIndex: hit.start + edit.replace.length },
        textStyle: { bold: keepBold }, fields: "bold",
      } });
      // runs: [[отступ от начала, отступ до, жирный?], ...] — разное начертание внутри вставки
      for (const [a, b, bold] of edit.runs || []) {
        requests.push({ updateTextStyle: {
          range: { startIndex: hit.start + a, endIndex: hit.start + b },
          textStyle: { bold }, fields: "bold",
        } });
      }
    }
  } else if (typeof edit.insertBefore === "string") {
    requests.push({ insertText: { location: { index: hit.start }, text: edit.insertBefore } });
    if (edit.bold !== undefined) {
      requests.push({ updateTextStyle: {
        range: { startIndex: hit.start, endIndex: hit.start + edit.insertBefore.length },
        textStyle: { bold: edit.bold }, fields: "bold",
      } });
    }
  } else if (edit.bold !== undefined) {
    requests.push({ updateTextStyle: {
      range: { startIndex: hit.start, endIndex: hit.end },
      textStyle: { bold: edit.bold }, fields: "bold",
    } });
  } else {
    return { ok: false, reason: "правка ничего не делает" };
  }

  await withRetry(() => docs.documents.batchUpdate({ documentId, requestBody: { requests } }));
  return { ok: true };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// У Google Docs API лимит 60 записей в минуту на проект — ждём и повторяем.
async function withRetry(fn, attempts = 6) {
  for (let i = 0; ; i += 1) {
    try {
      return await fn();
    } catch (e) {
      const code = e?.code || e?.response?.status;
      if ((code !== 429 && code !== 503) || i >= attempts - 1) throw e;
      await sleep(15000 * (i + 1));
    }
  }
}

export async function applyEdits(docs, documentId, edits, { label = "", pauseMs = 1100 } = {}) {
  const done = [];
  const failed = [];
  for (const edit of edits) {
    const r = await applyEdit(docs, documentId, edit);
    (r.ok ? done : failed).push(r.ok ? (edit.note || edit.find.slice(0, 50)) : `${edit.note || edit.find.slice(0, 40)} — ${r.reason}`);
    if (pauseMs) await sleep(pauseMs);
  }
  return { label, done, failed };
}
