import { getBotClients } from "../google-bot.mjs";
const { drive } = getBotClients();
const stamp = new Date().toISOString().slice(0, 10);
const copy = await drive.files.copy({
  fileId: "1vlmCEPFpPFQQfTVUbzeErNQKr1Vf2aApcbQrVt0B1-o",
  requestBody: {
    name: `БЭКАП ${stamp} — 1. DRAFT Off-plan MOU (до разметки)`,
    parents: ["1wAOozC2ofCV3Hsm16wdJoywK6_jvjZpm"],
  },
  fields: "id,webViewLink",
});
console.log("бэкап:", copy.data.webViewLink);
