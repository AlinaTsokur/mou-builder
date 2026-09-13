// Маршруты API целиком: настоящие /api/preview, /api/mou и /api/drafts, настоящие
// getGoogleClients/jsonError и работа с DRAFTS_LOG. Подменён только Google:
// вход (next-auth), клиенты googleapis, копирование шаблона в Docs (createMouDocument)
// и сама таблица — массивом в памяти. Текст договора здесь не проверяется, это делают
// check-scenarios и сверка пакетов с боевыми шаблонами.
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { beforeEach, test } from "node:test";

const ROOT = new URL("../", import.meta.url);
const STUBS = {
  "next-auth": `export async function getServerSession() {
    globalThis.__mouTest.sessionCalls += 1;
    return globalThis.__mouTest.session;
  }`,
  "google-auth-options": "export const authOptions = {};",
  googleapis: `export const google = {
    auth: { OAuth2: class { setCredentials() {} } },
    drive: () => ({}),
    docs: () => ({}),
    sheets: () => globalThis.__mouTest.sheets,
  };`,
  "@/lib/google/docs": `export async function createMouDocument(options) {
    globalThis.__mouTest.created.push(options);
    return { title: options.title, url: "https://docs.google.com/document/d/test-copy/edit", remainingPlaceholders: [] };
  }`,
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier in STUBS) return { url: `stub:${specifier}`, shortCircuit: true };
    if (specifier === "./auth" && context.parentURL?.endsWith("/lib/google/client.js")) {
      return { url: "stub:google-auth-options", shortCircuit: true };
    }
    if (specifier.startsWith("@/")) return { url: new URL(`${specifier.slice(2)}.js`, ROOT).href, shortCircuit: true };
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith("stub:")) return { format: "module", source: STUBS[url.slice(5)], shortCircuit: true };
    return nextLoad(url, context);
  },
});

const preview = await import("../app/api/preview/route.js");
const mou = await import("../app/api/mou/route.js");
const draft = await import("../app/api/drafts/[rowNumber]/route.js");
const { MOU_TEMPLATES, TEMPLATE_REQUIRED_ERROR } = await import("../lib/mou/config.js");

const byArticles = (key) => MOU_TEMPLATES.find((t) => t.articles === key);
const OFFPLAN = byArticles("offplan-v2");
const READY_MORTGAGE = byArticles("ready-mortgage-v2");

const LOG_HEADERS = ["Date Created", "Agreement Date", "Project", "Unit Number", "Seller", "Buyer", "Selling Price", "Google Doc Link", "Form JSON"];

beforeEach(() => {
  const log = [LOG_HEADERS];
  globalThis.__mouTest = {
    session: { accessToken: "test-token" },
    sessionCalls: 0,
    created: [],
    log,
    sheets: {
      spreadsheets: {
        values: {
          append: async ({ requestBody }) => { log.push(...requestBody.values); },
          get: async () => ({ data: { values: log } }),
        },
      },
    },
  };
});

function form(overrides = {}) {
  return {
    agreementDate: "13.09.2026",
    projectName: "Saadiyat Grove",
    unitNumber: "API-TEST-1",
    sellingPrice: "1,000,000",
    sellers: [{ name: "Seller One", ownershipPercent: "100" }],
    buyers: [{ name: "Buyer One", ownershipPercent: "100" }],
    ...overrides,
  };
}

function post(body) {
  return new Request("http://localhost/api", { method: "POST", body: JSON.stringify(body) });
}

async function call(handler, body) {
  const res = await handler(post(body));
  return { status: res.status, json: await res.json() };
}

test("API: без шаблона или с неизвестным шаблоном — 400, Google не трогается", async () => {
  for (const templateId of [undefined, "", "нет-такого-шаблона"]) {
    for (const [name, handler] of [["preview", preview.POST], ["mou", mou.POST]]) {
      const { status, json } = await call(handler, form({ templateId }));
      assert.equal(status, 400, `${name}, templateId=${templateId}`);
      assert.equal(json.ok, false);
      assert.equal(json.error, TEMPLATE_REQUIRED_ERROR);
    }
  }
  const t = globalThis.__mouTest;
  assert.equal(t.sessionCalls, 0);
  assert.equal(t.created.length, 0, "договор не создаётся");
  assert.equal(t.log.length, 1, "в DRAFTS_LOG ничего не пишется");
});

test("API Preview: число статей по каждому шаблону v2", async () => {
  const expected = { "offplan-v2": 17, "offplan-mortgage-v2": 18, "ready-cash-v2": 18, "ready-mortgage-v2": 19 };
  for (const [key, count] of Object.entries(expected)) {
    const template = byArticles(key);
    const { status, json } = await call(preview.POST, form({ templateId: template.id }));
    assert.equal(status, 200, key);
    assert.equal(json.preview.articles.length, count, key);
  }
});

test("API Preview: без входа в Google — 401 с понятной ошибкой", async () => {
  globalThis.__mouTest.session = null;
  const { status, json } = await call(preview.POST, form({ templateId: OFFPLAN.id }));
  assert.equal(status, 401);
  assert.match(json.error, /войдите через Google/i);
});

test("API Create MOU → Load Draft: договор из выбранного шаблона, черновик помнит шаблон", async () => {
  const body = form({ templateId: READY_MORTGAGE.id, amountToSellerPaymentMethod: "cash", unitVerificationFee: "103.50" });
  const { status, json } = await call(mou.POST, body);
  assert.equal(status, 200);
  assert.equal(json.ok, true);
  assert.equal(json.url, "https://docs.google.com/document/d/test-copy/edit");
  assert.equal(json.preview.articles.length, 19);

  const [created] = globalThis.__mouTest.created;
  assert.equal(created.templateId, READY_MORTGAGE.id, "копируется выбранный шаблон, а не №1");
  assert.equal(created.engine, "v2");
  assert.equal(created.data.amountToSellerPaymentMethod, "manager_cheque", "в готовом объекте способ оплаты зашит");
  assert.equal(created.replacements.unit_verification_fee, "103.50");

  const log = globalThis.__mouTest.log;
  assert.equal(log.length, 2, "одна строка в DRAFTS_LOG");
  assert.equal(log[1][7], json.url);

  const res = await draft.GET(null, { params: Promise.resolve({ rowNumber: "2" }) });
  const loaded = await res.json();
  assert.equal(res.status, 200);
  assert.equal(loaded.form.templateId, READY_MORTGAGE.id);
  assert.equal(loaded.form.unitNumber, "API-TEST-1");
});
