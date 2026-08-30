import { getBotClients } from "../google-bot.mjs";
const { docs } = getBotClients();
const names = { "1Jn3rjQFXZUYilCzhHF_JroAOf44xQXRUmbY5RydBbjk": "full",
  "1QtClmLq9yDNoain80AuFVNRrdhcUTQWPN_PKMR5Jk8c": "no-deposits",
  "145JWNHJK9TKGqOTDUg8ZAjX-t2ePJDX1tgx585vHr-U": "no-agents",
  "10gZziAKrkmp3OuNlcJ6QrFW43m-RbqTsED_9pToFGDE": "seller-agent-only" };
for (const [documentId, name] of Object.entries(names)) {
  const doc = (await docs.documents.get({ documentId })).data;
  for (const footer of Object.values(doc.footers || {})) {
    for (const el of footer.content || []) {
      if (!el.table) continue;
      console.log(`— ${name}: строк ${el.table.tableRows.length}`);
      el.table.tableRows.forEach((row) => console.log("   ", JSON.stringify(row.tableCells.map((c) =>
        (c.content || []).map((p) => (p.paragraph?.elements || []).map((e) => e.textRun?.content || "").join("")).join("").trim()))));
    }
  }
}
