# MOU Builder Project Handoff

## Purpose

MOU Builder is a small web application for preparing Memorandum of Understanding documents from a Google Docs template.

The user fills a guided form, the app reads reference data from Google Sheets, calculates the payment values, copies the Google Docs template into a Google Drive output folder, replaces placeholders, applies conditional document changes, writes a row into `DRAFTS_LOG`, and returns a clickable Google Doc link.

The product is for non-technical real estate staff. The interface must stay simple, clear, and forgiving. Tooltips are important and should explain fields in Russian where possible, while keeping contract terms in English where useful.

## Current Production Setup

- Production app: `https://mou-builder-rho.vercel.app/`
- GitHub repo: `git@github.com:AlinaTsokur/mou-builder.git`
- Default branch: `main`
- Deploy: Vercel auto-deploys from GitHub after push to `main`.
- Framework: Next.js app router.
- Auth: NextAuth Google OAuth.

Google source IDs:

- Spreadsheet: `1rI2ePSqkmHeUByorcEMsGv3anRKT7HuOHYCQ4vR8D8o`
- Template Google Doc: `1N4KOttFqvFrMDu_zV93dd1HEGkd0khxh3_9t-rOHbDo`
- Output Google Drive folder: `1PccENrU-KpY0f27-vHxgs4y82idyZC4j`

Important OAuth redirect for Vercel:

```text
https://mou-builder-rho.vercel.app/api/auth/callback/google
```

Local OAuth redirect:

```text
http://localhost:3000/api/auth/callback/google
```

## Environment Variables

Required:

```env
NEXTAUTH_URL=https://mou-builder-rho.vercel.app
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_ALLOWED_DOMAIN=...
```

Optional Google source overrides:

```env
MOU_SPREADSHEET_ID=1rI2ePSqkmHeUByorcEMsGv3anRKT7HuOHYCQ4vR8D8o
MOU_TEMPLATE_DOC_ID=1N4KOttFqvFrMDu_zV93dd1HEGkd0khxh3_9t-rOHbDo
MOU_OUTPUT_FOLDER_ID=1PccENrU-KpY0f27-vHxgs4y82idyZC4j
MOU_PROJECTS_SHEET=PROJECTS
MOU_LISTS_SHEET=LISTS
MOU_LOG_SHEET=DRAFTS_LOG
MOU_RULES_SHEET=RULES
```

Temporary testing flag:

```env
MOU_REQUIRE_VALIDATION=true
```

If `MOU_REQUIRE_VALIDATION=true`, required validation blocks MOU creation. Currently the app defaults to test mode, so validation errors are shown but do not block creation. This was done to make bug testing faster.

Do not commit `.env.local`.

## Main Files

```text
app/page.js                         Main UI form and preview panel
app/globals.css                     UI styles
app/api/init/route.js               Reads projects, lists, drafts, rules
app/api/preview/route.js            Returns calculated preview and validation
app/api/mou/route.js                Creates final Google Doc and logs draft
app/api/drafts/[rowNumber]/route.js Loads saved Form JSON from DRAFTS_LOG
app/api/auth/[...nextauth]/route.js Google auth route

lib/mou/core.js                     Form normalization, calculations, replacements, validation
lib/mou/articles.js                 Article definitions, rules, numbering
lib/mou/helpers.js                  Parsing and formatting helpers
lib/mou/config.js                   Google IDs and sheet names

lib/google/auth.js                  NextAuth Google OAuth config and scopes
lib/google/client.js                Google API clients from session access token
lib/google/sheets.js                Google Sheets readers/writers
lib/google/docs.js                  Google Docs copy, placeholder replacement, document edits

test/mou-core.test.js               Unit tests for calculations and document request logic
rules-template.csv                  Starter RULES sheet content
payment-flow-example.md             User-facing payment flow explanation
```

## Google Sheets Structure

### `PROJECTS`

Used for project-specific autofill.

Known columns include:

- `Project Name`
- `Location`
- `Developer Name`
- `Developer Legal Name`
- `Escrow Account Name`
- `ADM Admin Fee Off-Plan`
- `ADM Admin Fee Ready`
- `Transfer Fee Label`
- `Transfer Fee Off-Plan`
- `Transfer Fee Ready`

Headers are normalized by `keyFromHeader`, for example `Project Name` becomes `project_name`.

When a project is selected in the UI:

- developer fields are autofilled;
- escrow account is autofilled;
- transfer fee label is autofilled;
- ADM admin fee and transfer/NOC fee are selected by `Unit Status`;
- location is autofilled if `Location` exists in `PROJECTS`;
- user can still edit autofilled fields manually.

Special rule: if `Unit Status = Ready`, `transferFeeLabel` is forced to `NOC Fee`, even if Google Sheet says `Transfer Fee`.

### `LISTS`

Used for dropdown/autocomplete values.

Known columns include:

- `Property Types`
- `Nationalities`
- `Transfer Threshold %`
- `Agent`
- `Banks`
- `Ownership %`
- `Yes / No`
- `Security Deposit Calc Type`
- `Bedroom`

`Bedroom` powers the Bedrooms dropdown.

### `DRAFTS_LOG`

Every created MOU appends a row:

1. Date Created
2. Agreement Date
3. Project
4. Unit Number
5. Seller
6. Buyer
7. Selling Price
8. Google Doc Link
9. Form JSON

`Form JSON` is used to reload existing drafts into the UI.

### `RULES`

Optional sheet. If it does not exist or is empty, built-in default rules are used.

Expected starter columns:

```text
rule_id,target_type,target_key,label,default_enabled,condition_field,operator,condition_value,action,notes
```

Current first-version purpose: enable/disable optional articles 6, 7, 8, 9, and 18 without code edits.

## API Interfaces

```text
GET /api/init
```

Returns projects, lists, drafts, and rules.

```text
POST /api/preview
```

Input: form JSON.

Returns normalized data, calculations, replacement values, article summary, validation, and preview summary. This endpoint does not create documents.

```text
POST /api/mou
```

Input: form JSON.

Creates the Google Doc, writes `DRAFTS_LOG`, and returns:

```json
{
  "ok": true,
  "title": "...",
  "url": "...",
  "remainingPlaceholders": [],
  "preview": {}
}
```

```text
GET /api/drafts/:rowNumber
```

Reads `Form JSON` from `DRAFTS_LOG` and returns the saved form.

## Business Logic

All core calculations live in `lib/mou/core.js`.

### Number Parsing

Numeric fields are parsed by helper `n()`. It accepts common human-entered formats with spaces, commas, dots, and `AED`.

### ADM Fee

Current formula:

```text
admFeeBase = max(Selling Price, Original Price) when both are present
ADM Fee = admFeeBase * 2% + ADM Admin Fee
```

`ADM Admin Fee` is autofilled from `PROJECTS` based on `Unit Status`.

In the payment table, the ADM fee payee is taken from `Developer Name` when available. The replacement also supports a template placeholder:

```text
{{adm_fee_payee}}
```

### Transfer Threshold

```text
Required Threshold Amount = Original Price * Transfer Threshold % / 100
```

### Threshold Top-up to Developer

If user manually enters `Threshold Top-up Amount`, that value is used.

Otherwise:

```text
Threshold Top-up Amount = max(Required Threshold Amount - Paid Amount to Developer, 0)
```

Meaning: amount Buyer pays to developer/escrow at transfer to bring paid amount up to the required transfer threshold.

### Remaining Developer Balance

If user manually enters `Remaining Developer Balance`, that value is used.

Otherwise:

```text
Remaining Developer Balance = max(Original Price - Paid Amount to Developer - Threshold Top-up Amount, 0)
```

Meaning: unpaid developer payment plan balance after transfer/top-up.

### Amount to be paid to Seller

If `Manual Amount to Seller = Yes`, the app uses the manually entered `Amount to Seller`.

Otherwise:

```text
Amount to Seller = Selling Price - Threshold Top-up Amount - Remaining Developer Balance
```

Plain explanation: this is what Buyer pays directly to Seller, after subtracting unpaid developer obligations from the selling price.

### Amount to Seller Payment Method

UI has three options:

1. `Manager's Cheque`
2. `Cash`
3. `Manager's Cheque issued in favour of ...`

If option 3 is selected, an extra field appears for beneficiary name.

The document text replaces the fixed phrase:

```text
Manager's Cheque or Cash.
```

with the selected payment method text.

### Agency Fee

If user enters a value, use it.

Otherwise:

```text
Agency Fee Seller = Selling Price * 2.1%
Agency Fee Buyer = Selling Price * 2.1%
```

2.1% represents 2% + VAT.

### Security Deposit

Buyer and Seller deposits are separate.

If deposit is disabled, amount and article block are empty.

If calculation type includes `Fixed`:

```text
Deposit Amount = Fixed Amount
```

Otherwise:

```text
Deposit Amount = Selling Price * Deposit % / 100
```

For default articles:

```text
80% = Deposit Amount * 0.8
20% = Deposit Amount * 0.2
```

Security deposit cheque fields:

- Cheque No.
- Cheque Date
- Cheque Bank
- Drawn by
- In favour of

Recent UI behavior:

- For Buyer cheque:
  - `Drawn by` suggests Buyer names from the current form.
  - `In favour of` suggests Seller names from the current form.
- For Seller cheque:
  - `Drawn by` suggests Seller names.
  - `In favour of` suggests Buyer names.
- User can still type any custom value.

If both Buyer and Seller deposit are disabled:

- Article 6 is automatically disabled.
- Article 6 checkbox is disabled in UI.
- The app warns if Articles 7, 8, or 9 remain enabled, because they may reference security deposit logic.

### Transfer Fee vs NOC Fee Definition

Important recent bug context:

The contract should have one fee definition list item. It must be either Transfer Fee text or NOC Fee text, not both.

Rules:

- If `Unit Status = Ready`, force label to `NOC Fee`.
- If `Transfer Fee Label` contains `NOC`, use NOC definition.
- Otherwise use Transfer Fee definition.

Current exact texts in code:

```text
Transfer fee – any fee levied by the Property Developer related to the transfer procedure of ownership and title registration.
```

```text
NOC fee is a fee charged for issuing a No Objection Certificate (NOC) — an official document stating that the issuing authority has no objection to a specific action.
```

Do not delete list items at runtime for this logic. Earlier deletion caused Google Docs to merge list items and produced both texts in one point.

Current safer approach:

- Replace Transfer text with NOC text when needed.
- If template already has combined broken text, replace combined text with only the correct text.

Recommendation: manually clean the Google Docs template so the base template contains only the Transfer Fee definition in that list item.

### Parties

Each party has:

- Title/salutation: empty, `Mr.`, `Mrs.`, `Ms.`
- Name
- Nationality
- Passport
- EID
- Ownership %
- POA toggle
- POA name/nationality/passport/EID

Ownership total should be 100% per side. In current test mode this warning does not block creation unless `MOU_REQUIRE_VALIDATION=true`.

Party block rules:

- Multiple sellers/buyers are joined with `, and\n` so each can start more cleanly in the document.
- Salutation is included only if selected.
- POA text is included only when POA is enabled and POA name exists.

### Property Location

`formatPropertyLocation()` appends `, Abu Dhabi, UAE` unless the entered value already includes `Abu Dhabi` or `UAE`.

Example:

```text
Yas Island -> Yas Island, Abu Dhabi, UAE
```

## Article Logic

Article definitions are in `lib/mou/articles.js`.

The app renumbers articles after optional articles are disabled. It replaces placeholders such as:

```text
{{article_security_deposit_number}}
```

Disabled article placeholders get an empty replacement and their article section is deleted from the copied Google Doc.

Default optional article controls:

- Article 6 - Security Deposit
- Article 7 - Buyer Default
- Article 8 - Seller Default
- Article 9 - Deposit Release
- Article 18 - Automatic Extension

Article deletion happens by finding headings that contain:

```text
Article {{placeholder}}
```

and deleting until the next article heading or signature section.

Be careful with delete ranges in Google Docs. Ranges must be clamped to the document segment end index. Existing tests cover this.

## Google Docs Generation Flow

Implemented in `lib/google/docs.js`.

High-level flow:

1. Copy template Doc into output Drive folder.
2. Delete disabled article sections.
3. Apply conditional deletions/text edits.
4. Replace or build dynamic signature table.
5. Replace all `{{placeholder}}` values.
6. Read back final document and detect remaining placeholders.
7. Return created document URL.

### Placeholder Replacement

All replacements are built in `buildReplacements()` in `lib/mou/core.js`.

Placeholders use this format in Google Docs:

```text
{{placeholder_name}}
```

Replacement happens in body/header/footer where Google Docs API exposes content. `agreement_date_long` is used for footer-style long date, for example `May 19, 2026`.

### Signature Block

Current dynamic signature logic:

- Preferred placeholder: `{{signature_block}}`.
- If no placeholder exists, code tries to find the old simple table with `{{seller_signature_name}}` and `{{buyer_signature_name}}`.
- It replaces that with a dynamic 2-column table.

Table style:

- Header fill color: `#9cc2e4`.
- 2 columns: THE SELLER / THE BUYER.
- Rows expand by max number of sellers/buyers.
- For each party: Name, Signature, Date.
- If one side has fewer parties, extra cells on that side stay empty.

Important: user wants the signature table to look like the provided example and not merge multiple sellers into one name cell.

## UI Notes

Main UI is in `app/page.js`.

Design direction:

- friendly, clear, not technical;
- sections are collapsible;
- section badges show complete/missing state;
- tooltips are kept, rewritten in Russian/simple language;
- dropdowns/autocomplete are custom components to avoid native select styling issues;
- date fields use calendar inputs;
- preview is a summary, not a fake exact copy of final legal document.

Important UX decisions:

- Project dropdown comes from `PROJECTS`.
- Bedrooms dropdown comes from `LISTS -> Bedroom`.
- Nationality dropdown comes from `LISTS -> Nationalities`.
- Banks dropdown comes from `LISTS -> Banks`.
- Agent dropdown comes from `LISTS -> Agent`.
- Security deposit `Drawn by` / `In favour of` suggestions come from current form party names.
- User can type custom values into autocomplete fields.

## Validation

Validation rules live in `validateMou()`.

Required validations currently include:

- Agreement Date
- Reservation Deadline
- Project
- Unit Status
- Unit Number
- Seller Agent
- Buyer Agent
- Seller name
- Buyer name
- Selling Price
- Amount to Seller payment method
- Ownership total = 100% per side
- Deposit required fields when deposit is enabled

Temporary state:

- Creation is not blocked by validation unless env `MOU_REQUIRE_VALIDATION=true`.
- UI shows validation as test-mode warnings.

Restore production behavior by setting:

```env
MOU_REQUIRE_VALIDATION=true
```

## Tests

Run:

```bash
npm test
npm run build
```

Current tests cover:

- ADM fee
- threshold top-up
- remaining developer balance
- amount to seller auto/manual
- filled payment table calculations
- buyer/seller deposit fixed/percent
- agency fees
- article numbering
- validation
- security deposit definition text
- transfer/NOC definition logic
- amount-to-seller payment method text replacement
- long date formatting
- signature table request planning
- Google Docs delete range clamping
- dynamic signature table for uneven seller/buyer counts

## Known Risk Areas

1. Google Docs list item deletion is fragile.
   - Avoid deleting individual list items for fee definition switching.
   - Prefer replacing text inside an existing paragraph.

2. Google Docs template may be manually edited.
   - If placeholder names change, generation can silently leave placeholders.
   - The app returns `remainingPlaceholders`; show/monitor those.

3. Signature table structure depends on Docs API indexes.
   - Tests cover request generation, but visual QA should be done after template changes.

4. Security deposit articles are legally sensitive.
   - If Article 6 is disabled while Articles 7/8/9 remain enabled, legal references may be inconsistent.
   - Current approach warns, does not automatically rewrite those articles.

5. Do not change contract wording casually.
   - User explicitly does not want critical legal text changed without approval.
   - UI text can be improved; legal template text should be preserved unless requested.

6. Access permissions.
   - The signed-in Google account must have access to:
     - source template doc;
     - spreadsheet;
     - output folder;
     - ability to copy/write docs and append to sheets.

## Local Development

Install dependencies:

```bash
npm install
```

Run dev server:

```bash
npm run dev
```

Local URL:

```text
http://localhost:3000
```

Required Google Cloud OAuth local redirect:

```text
http://localhost:3000/api/auth/callback/google
```

## Deployment Notes

Typical flow:

```bash
git add ...
git commit -m "Message"
git push
```

Vercel deploys automatically from `main`.

If production URL changes, update both:

1. Vercel env `NEXTAUTH_URL`.
2. Google Cloud OAuth Authorized JavaScript origins and Redirect URIs.

For current production:

```text
Authorized JavaScript origin:
https://mou-builder-rho.vercel.app

Authorized redirect URI:
https://mou-builder-rho.vercel.app/api/auth/callback/google
```

## Recommended Next Steps

1. Clean the template fee definition so the base template has only the Transfer Fee definition list item.
2. Decide the legal behavior when both security deposits are disabled:
   - Should Articles 7/8/9 be automatically disabled too?
   - Or should legal wording be rewritten?
3. Re-enable strict validation by setting `MOU_REQUIRE_VALIDATION=true` when testing phase ends.
4. Add visual QA checklist for final generated MOU examples:
   - one seller / one buyer;
   - two sellers / one buyer;
   - one seller / two buyers;
   - POA;
   - Buyer deposit off;
   - Seller deposit off;
   - both deposits off;
   - Ready/NOC;
   - Off-plan/Transfer Fee.
5. Consider adding a small admin/settings screen later for rules and labels, but only after core contract output is stable.
