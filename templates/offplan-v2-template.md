# Off-Plan MOU Template v2 — размеченная версия

Это эталонный текст нового off-plan шаблона с условными маркерами и плейсхолдерами.
Его нужно перенести в Google Doc шаблона. Движок в `lib/google/docs.js` (v2) читает маркеры
и собирает финальный договор.

## Синтаксис маркеров

| Маркер | Значение |
|---|---|
| `{{#if flag}} ... {{/if}}` | Блок/фраза остаётся, если флаг true; иначе удаляется вместе с маркерами. Работает и внутри абзаца (инлайн), и на несколько абзацев |
| `{{#if !flag}} ... {{/if}}` | То же, но при флаге false |
| `{{#row flag}}` | Ставится внутри строки таблицы: строка остаётся при true (маркер стирается), удаляется целиком при false |
| `{{value}}` | Подстановка значения (как раньше) |

## Флаги (вычисляются кодом из формы)

| Флаг | Условие |
|---|---|
| `buyer_deposit` / `seller_deposit` | депозит стороны включён |
| `both_deposits` | оба депозита включены |
| `any_deposit` | хотя бы один депозит |
| `buyer_cheque_details` / `seller_cheque_details` | реквизиты чека известны (НЕ Delayed) |
| `buyer_cheque_third_party` | галочка «чек выписан третьим лицом» |
| `seller_agent` / `buyer_agent` | агент стороны есть |
| `both_agents` / `any_agent` | оба / хотя бы один |
| `seller_agent_fee` / `buyer_agent_fee` | комиссия агента включена (агент есть И комиссия не отключена) |
| `any_agent_fee` | хотя бы одна комиссия |
| `noc_fee` | Transfer Fee Label проекта = "NOC Fee" (колонка в PROJECTS) |
| `has_top_up` | threshold top-up > 0 |

## Новые вычисляемые значения (в дополнение к существующим)

| Плейсхолдер | Значение |
|---|---|
| `{{seller_agent_representative}}`, `{{seller_agent_position}}`, `{{seller_agent_license}}`, `{{seller_agent_address}}` | из вкладки AGENTS (и зеркально buyer_) |
| `{{amount_to_seller_payment_text}}` | "Manager's Cheque." / "Cash." / "Manager's Cheque issued in favour of X." |
| `{{buyer_liquidated_damages_amount}}` | депозит Buyer, если есть; иначе = депозит Seller |
| `{{seller_liquidated_damages_amount}}` | депозит Seller, если есть; иначе = депозит Buyer |
| `{{buyer_deposit_80_percent_amount}}` / `{{buyer_deposit_20_percent_amount}}` | 80%/20% от buyer_liquidated_damages (при отсутствии seller agent 80% = 100%) |
| `{{seller_deposit_80_percent_amount}}` / `{{seller_deposit_20_percent_amount}}` | зеркально |
| `{{seller_deposit_intro}}` | "Similarly, upon signing this agreement," если депозит Buyer есть, иначе "Upon signing this agreement," |
| `{{deposit_return_parties}}` | "the Buyer and to the Seller" / "the Buyer" / "the Seller" |
| `{{seller_signature_block}}` / `{{buyer_signature_block}}` | Name/Signature/Date на каждого участника стороны |
| `{{article_*_number}}` | динамические номера статей (ручное отключение статей сохраняется) |

Ключи статей v2: `article_sale_offer_number` (1), `article_effective_date_number` (2),
`article_property_details_number` (3), `article_payment_table_number` (4),
`article_reservation_period_number` (5), `article_security_deposit_number` (6),
`article_buyer_default_number` (7), `article_seller_default_number` (8),
`article_deposit_release_number` (9), `article_buyer_own_funds_number` (10),
`article_seller_outstanding_charges_number` (11), `article_property_hold_number` (12),
`article_developer_approval_number` (13), `article_aml_number` (14),
`article_amicable_dispute_number` (15), `article_entire_agreement_number` (16),
`article_electronic_signature_number` (17).

---

# ТЕКСТ ШАБЛОНА

**Memorandum of Understanding (MOU)**

This Agreement is signed and entered on the Date **{{agreement_date}}**

## BY AND BETWEEN:

{{seller_party_block}}, hereafter referred to as the **«Seller»**

## AND

{{buyer_party_block}}, hereinafter referred to as the **«Buyer»**

The Seller and the **Buyer** are hereafter collectively referred to as the **"Parties/Party."**

{{#if seller_agent}}
**{{seller_agent_name}}**, represented by the {{seller_agent_position}} **{{seller_agent_representative}}**, authorized by the Economic license #{{seller_agent_license}}, located at {{seller_agent_address}}

(hereinafter referred to as the **"Seller's Agent"**)
{{/if}}

{{#if buyer_agent}}
**{{buyer_agent_name}}**, represented by the {{buyer_agent_position}} **{{buyer_agent_representative}}**, authorized by the Economic license #{{buyer_agent_license}}, located at {{buyer_agent_address}}

(hereinafter referred to as the **"Buyer's Agent"**)
{{/if}}

{{#if both_agents}}
The Seller's Agent and the Buyer's Agent are hereafter collectively referred to as the **"Agencies/Agency."**
{{/if}}

**Terms and conditions:**

"Agreement" or "Memorandum of Understanding" (MOU) – this Agreement together with such amendments and additions there to as may be approved in writing or confirmed by signature by the Parties.

Default – is defined as failure, willing or not to complete the transaction in accordance with the terms of this contract.

Force Majeure – any event beyond the reasonable control of either Party, including but not limited to acts of God, declared war within the United Arab Emirates, strikes, or adverse weather conditions, which prevents or materially delays the completion of the transaction.

The Developer – **{{developer_legal_name}}**, being the developer authorized to transfer title to the Buyer.

Security Deposit – the security deposit, if any, provided by either or both Parties under this MOU as security for the performance of their obligations.

{{#if !both_deposits}}
Liquidated Damages – an agreed amount payable by the defaulting Party upon a Default under this Agreement, representing a genuine pre-estimate of loss and not a penalty.
{{/if}}

Transfer fee – any fee levied by the Property Developer related to the transfer procedure of ownership and title registration. {{#if noc_fee}}NOC fee is a fee charged for issuing a No Objection Certificate (NOC) — an official document stating that the issuing authority has no objection to a specific action.{{/if}}

POA - is a valid Power of Attorney authorizing a person to act on behalf of a Party in connection with this MOU and the transfer of the Property, in a form acceptable to the Abu Dhabi Real Estate Centre.

Addendum - any addendum including Commission Agreement attached to this MOU is an integral part of the Agreement between the Parties and the Agency.

The Parties shall bear their own exchange rate differences, bank charges, manager's cheque fees and any other fees associated with the transfer and disbursement of the deposit and balance.

In consideration of the foregoing recitals and of the terms and conditions hereafter contained, the Parties hereto agree as follows:

**WHEREAS:**

A. The Seller confirms that it is the legal owner of the property described in Article {{article_property_details_number}} of this Agreement (the "Property") and has the full right, authority, and capacity to sell and transfer the Property to the Buyer.

B. The Seller agrees to sell, and the Buyer agrees to purchase, the Property for the Selling Price set out in Article {{article_payment_table_number}} of this Agreement.

NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein, the Parties agree as follows:

**Article {{article_sale_offer_number}}**

The Seller agrees to sell and the Buyer agrees to purchase the Property in accordance with this Agreement.

**Article {{article_effective_date_number}}**

This Agreement shall become effective and binding upon execution by both Parties.

If this MOU is not signed by either Party within two (2) business days from the date of this MOU, or, if one Party has signed this MOU within such period, the other Party fails to sign and deliver the signed MOU within two (2) business days from the date the first Party signed this MOU, this MOU shall automatically lapse and be of no further force or effect, unless otherwise agreed in writing by the Parties.

**Article {{article_property_details_number}}**

| PROPERTY DETAILS | | |
|---|---|---|
| Type of Area: {{type_of_area}} | Title Deed Number: | {{title_deed_number}} |
| Location: {{property_location}} | No. of Bedroom: | {{bedrooms}} |
| Area (sq.m): {{area_m2}} | Type of property: | {{property_type}} |
| Project name: {{project_name}} | Unit number: | {{unit_number}} |
| Additional Information: {{additional_information}} | Number of Car Parking Spaces: | {{parking_spaces}} |

**Article {{article_payment_table_number}}**

| PAYMENT TABLE | |
|---|---|
| Original Price: | **AED {{original_price}}** / The Original Price of the Property as per the SPA issued by the Developer |
| Selling Price: | **AED {{selling_price}}** / as agreed by the Parties |
| Amount to be paid to the Seller: | **AED {{amount_to_seller}}** / to be paid by the Buyer to the Seller on the Transfer Date by {{amount_to_seller_payment_text}} |
| `{{#row has_top_up}}` Remaining balance to complete {{transfer_threshold_percent}}% threshold, repay outstanding payments to the Developer to obtain the transfer date from the Developer: | **AED {{threshold_top_up_amount}}** / to be paid by the Buyer to {{escrow_account_name}} on the Transfer Date by a Manager's Cheque |
| Remaining balance of {{remaining_balance_percent}}% of the Original Price to be paid to the Developer: | **AED {{remaining_developer_balance}}** / to be paid by the Buyer to {{escrow_account_name}} in accordance with the Payment Plan |
| {{transfer_fee_label}}: | **AED {{transfer_fee}}** / to be paid by the Buyer to {{developer_legal_name}} on the Transfer Date by Card |
| ADM Electronic Fee: | **AED {{adm_fee}}** / (2% from the Selling Price + AED {{adm_admin_fee}}) to be paid by the Buyer to {{adm_fee_payee}} on the transfer date by a Manager's Cheque |
| `{{#row any_deposit}}` Security deposit: | {{buyer_security_deposit_table_line}}{{seller_security_deposit_table_line}} |
| `{{#row any_agent_fee}}` Agency Fee: | {{#if buyer_agent_fee}}**AED {{agency_fee_buyer}} (VAT inclusive)** / to be paid by the Buyer to The Buyer's Agent on the Transfer Date{{/if}}{{#if seller_agent_fee}}**AED {{agency_fee_seller}} (VAT inclusive)** / to be paid by the Seller to The Seller's Agent on the Transfer Date{{/if}} |

The Selling Price, the amount payable to the Seller, and the Agency Fee set out in the Payment Table are final and binding, unless otherwise agreed in writing by the Parties or in a separate Commission Agreement.

Any governmental, registration, administrative, third-party, or other fees imposed or amended by any competent authority after the execution of this MOU shall be borne by the Buyer.

**Article {{article_reservation_period_number}}**

The transfer and the Assignment Agreement of the Property shall be completed at the Developer's office on or before **{{reservation_deadline}}** (the "Reservation Period").

The Parties acknowledge and agree that the Reservation Period is of the essence and may be extended only in the following circumstances:

by mutual written agreement of the Seller and the Buyer; or

due to the occurrence of Force Majeure no more than seven (7) working days; or

due to administrative or procedural reasons attributable to third parties, including the Developer, ADREC, or any governmental authority shall be automatically extended by fourteen (14) calendar days.

**Article {{article_security_deposit_number}}**

{{#if buyer_deposit}}{{#if !buyer_cheque_details}}
Upon signing this agreement, the Buyer undertakes to pay a sum of **AED {{buyer_deposit_amount}}** as a holding Security Deposit cheque. This cheque is to secure the purchase of the Property and will be held by The Seller's Agency as stakeholder until the Transfer Date in accordance with the terms of this MOU.
{{/if}}{{#if buyer_cheque_details}}
Upon signing this agreement, the Buyer undertakes to pay a sum of **AED {{buyer_deposit_amount}}** as a holding Security Deposit cheque by cheque No. **{{buyer_cheque_number}}** dated **{{buyer_cheque_date}}**, issued by **{{buyer_cheque_bank}}**, drawn by **{{buyer_cheque_drawn_by}}** in favour of **{{buyer_cheque_in_favour_of}}**{{#if buyer_cheque_third_party}}, on behalf of the Buyer, provided that such third party executes an undertaking letter acceptable to the Agent and the Parties, confirming that the funds are provided on behalf of the Buyer{{/if}}. This cheque is to secure the purchase of the Property and will be held by The Buyer's Agency as stakeholder until the Transfer Date in accordance with the terms of this MOU.
{{/if}}{{/if}}

{{#if seller_deposit}}{{#if !seller_cheque_details}}
{{seller_deposit_intro}} the Seller undertakes to pay a sum of **AED {{seller_deposit_amount}}** as a holding Security Deposit cheque. This cheque is to secure the purchase of the Property and will be held by The Seller's Agency as stakeholder until the Transfer Date in accordance with the terms of this MOU.
{{/if}}{{#if seller_cheque_details}}
{{seller_deposit_intro}} the Seller undertakes to pay a sum of **AED {{seller_deposit_amount}}** as a holding Security Deposit cheque by cheque No. **{{seller_cheque_number}}** dated **{{seller_cheque_date}}**, issued by **{{seller_cheque_bank}}**, drawn by **{{seller_cheque_drawn_by}}** in favour of **{{seller_cheque_in_favour_of}}**. This cheque is to secure the purchase of the Property and will be held by The Seller's Agency as stakeholder until the Transfer Date in accordance with the terms of this MOU.
{{/if}}{{/if}}

Upon successful completion of the transfer of ownership on the Transfer Date, the Security Deposit cheques shall be returned to {{deposit_return_parties}} or cancelled and shall not be presented for payment.

**Article {{article_buyer_default_number}}**

In the event that the Buyer fails to complete the transfer of the Property within the Reservation Period, as defined in Article {{article_reservation_period_number}} of this MOU, in breach of this MOU, and such failure does not arise due to Force Majeure, Seller's Default, or any third-party reason beyond the Buyer's reasonable control, the Buyer shall be deemed to be in Default in accordance with the definition set out in this MOU.

Upon Buyer Default, the Buyer shall pay **AED {{buyer_liquidated_damages_amount}}** as liquidated damages, being an amount equal to the Security Deposit, which the Parties agree is not a penalty.

{{#if buyer_deposit}}The forfeited Security Deposit shall be distributed as follows:{{/if}}{{#if !buyer_deposit}}This amount shall be distributed as follows:{{/if}}

{{#if seller_agent}}
a) **80% (AED {{buyer_deposit_80_percent_amount}})** to the Seller; and

b) **20% (AED {{buyer_deposit_20_percent_amount}})** to the Seller's Agent
{{/if}}
{{#if !seller_agent}}
a) **100% (AED {{buyer_deposit_80_percent_amount}})** to the Seller
{{/if}}

The Buyer shall have no further claim against the Seller{{#if seller_agent}} or the Seller's Agent{{/if}} arising from such termination, save for fraud or wilful misconduct.

**Article {{article_seller_default_number}}**

In the event that the Seller fails to complete the transfer of the Property within the Reservation Period, as defined in Article {{article_reservation_period_number}} of this MOU, in breach of this MOU, and such failure does not arise due to Force Majeure, Buyer's Default, or any third-party reason beyond the Seller's reasonable control, the Seller shall be deemed to be in Default in accordance with the definition set out in this MOU.

Upon Seller Default, the Seller shall pay **AED {{seller_liquidated_damages_amount}}** as liquidated damages, being an amount equal to the Security Deposit, which the Parties agree is not a penalty.

{{#if seller_deposit}}The forfeited Security Deposit shall be distributed as follows:{{/if}}{{#if !seller_deposit}}This amount shall be distributed as follows:{{/if}}

{{#if buyer_agent}}
a) **80% (AED {{seller_deposit_80_percent_amount}})** to the Buyer; and

b) **20% (AED {{seller_deposit_20_percent_amount}})** to the Buyer's Agent
{{/if}}
{{#if !buyer_agent}}
a) **100% (AED {{seller_deposit_80_percent_amount}})** to the Buyer
{{/if}}

The Seller shall have no further claim against the Buyer{{#if buyer_agent}} or the Buyer's Agent{{/if}} arising from such termination, save for fraud or wilful misconduct.

**Article {{article_deposit_release_number}}**

If Article {{article_buyer_default_number}} or Article {{article_seller_default_number}} applies, the Security Deposit shall be released by the Agent strictly in accordance with the relevant Article.

If a dispute arises between the Parties regarding this MOU, the Security Deposit shall remain held by the Agent until either:

both Parties provide joint written instructions (including a signed Termination Agreement); or

a final and binding judgment is issued by the competent courts of the Emirate of Abu Dhabi.

The Agent shall act solely as a neutral stakeholder and shall not be liable for withholding or releasing the Security Deposit in accordance with this Article. No unilateral instruction from either Party shall authorize its release.

**Article {{article_buyer_own_funds_number}}**

The Buyer confirms that the purchase of the Property is made solely with the Buyer's own funds and is not conditional upon obtaining financing or the sale of any other property or asset. Failure to complete the transfer due to insufficient funds shall constitute Default under this MOU.

**Article {{article_seller_outstanding_charges_number}}**

The Seller shall be solely responsible for all outstanding charges, penalties and other amounts relating to the Property up to and including the Transfer Date, and shall obtain a clear Statement of Account and/or any required NOC prior to completion of the transfer.

**Article {{article_property_hold_number}}**

From the date of signing this MOU until the expiry of the Reservation Period, the Seller shall not sell, reserve, transfer, or otherwise dispose of the Property, accept any third-party offers, or market or list the Property through any other real estate agency. The Seller shall ensure that all existing listings and advertisements are removed during the Reservation Period.

**Article {{article_developer_approval_number}}**

Completion of the transfer is subject to the Parties obtaining the Developer's approval, including KYC, AML and compliance clearance.

If such approval is not granted in respect of any Party, despite such Party acting in good faith and providing all documents reasonably requested by the Developer, such circumstance shall not constitute a default by either Party. In such event, this MOU shall be terminated, neither Party shall be entitled to claim the liquidated damages, and the Security Deposit shall be returned to the Party that provided it.

**Article {{article_aml_number}}**

Both Parties agree to comply with all applicable Anti-Money Laundering (AML) regulations as stipulated under the laws of the United Arab Emirates, including Cabinet Decision No. (10) of 2019 Concerning the Implementing Regulation of Federal Decree-Law No. (20) of 2018 on Anti-Money Laundering, fulfilling Know Your Customer (KYC) requirements, undertaking all necessary due diligence checks, and providing the necessary documents as required.

The Parties, including the Buyer and Seller, shall fully cooperate with Seller's Agent and Buyer's Agent by providing all necessary information and documentation, including, but not limited to, the mandatory KYC form and supporting documents (such as proof of residential address, bank statements, and any other required materials), in accordance with Federal Decree-Law No. (20) of 2018 and Cabinet Decision No. (10) of 2019. The timely and accurate submission of the KYC form and accompanying documents is essential for regulatory compliance and is required for the completion of the transaction.

**Article {{article_amicable_dispute_number}}**

Any dispute arising in connection with this Agreement or its interpretation shall be resolved amicably between the Parties within seven (7) calendar days from the date of notification by one Party to the other regarding the dispute. Notification shall be made via agents' email, WhatsApp or by a written and signed letter from one Party to the other{{#if any_agent}}, with a copy of such email or letter delivered to Agencies for their reference{{/if}}.

If the Parties fail to resolve the dispute amicably within the specified period, the dispute shall be referred to the competent Courts of the Emirate of Abu Dhabi, which shall have exclusive jurisdiction.

{{#if any_agent}}
The Parties hereby undertake to indemnify and hold harmless the Agency against any costs, expenses or liabilities incurred in connection with any legal dispute arising out of or in relation to this MOU.
{{/if}}

**Article {{article_entire_agreement_number}}**

This MOU is intended to bind the Parties to the transaction contemplated hereby and constitutes the entire understanding between the Parties with respect to the subject hereof and supersedes all previous agreements between them on the subject. No amendments shall be legally effective unless made in writing and signed by all Parties.

The Seller and Buyer agree that any matters contained in or arising out of this MOU are confidential and are not to be disclosed to any person other than may be required by law.

**Article {{article_electronic_signature_number}}**

This MOU may be executed electronically. Electronic signatures shall have the same legal effect as original signatures.

**THE SELLER**

{{seller_signature_block}}

**THE BUYER**

{{buyer_signature_block}}

{{#if seller_agent}}
**SELLER'S AGENCY**

Company: **{{seller_agent_name}}**
Represented by: **{{seller_agent_representative}}** Signature: ________________
Date: **{{seller_signature_date}}**
Company Stamp
{{/if}}

{{#if buyer_agent}}
**BUYER'S AGENCY**

Company: **{{buyer_agent_name}}**
Represented by: **{{buyer_agent_representative}}** Signature: ________________
Date: **{{buyer_signature_date}}**
Company Stamp
{{/if}}

| | |
|---|---|
| Seller's signature____________ | Buyer's signature____________ |
| `{{#row any_agent}}` {{#if seller_agent}}Seller's Agent signature__________{{/if}} | {{#if buyer_agent}}Buyer's Agent signature__________{{/if}} |

---

## Примечания

1. **Исправлен баг исходника**: в блоке SELLER'S AGENCY стояло `Date: {{buyer_signature_date}}` → заменено на `{{seller_signature_date}}`.
2. `{{seller_signature_block}}` / `{{buyer_signature_block}}` — код генерирует по строке Name/Signature/Date на каждого участника стороны (как в сделке Lilac с двумя продавцами).
3. Держатель чека в статье 6 — статичный текст внутри каждого варианта (как в исходном шаблоне): Buyer без реквизитов → Seller's Agency; Buyer с реквизитами → Buyer's Agency; Seller → Seller's Agency.
4. Фраза undertaking letter (третье лицо) реализована только для Buyer — как в исходном шаблоне. Если понадобится для Seller, добавляется тем же маркером.
5. Жирный шрифт — родное форматирование Google Doc, маркеры `<< >>` для текста шаблона больше не нужны (остаются только для party blocks, генерируемых кодом).
