import { getBotClients } from "../google-bot.mjs";
const { drive } = getBotClients();
const res = await drive.files.list({
  q: "'1wAOozC2ofCV3Hsm16wdJoywK6_jvjZpm' in parents and trashed = false",
  fields: "files(id,name,mimeType)", orderBy: "name", pageSize: 100,
});
for (const f of res.data.files) console.log(f.id, "|", f.name);
