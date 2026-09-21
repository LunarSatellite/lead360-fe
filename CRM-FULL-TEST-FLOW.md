# OmniFlow CRM — Real-World End-to-End Test Flow

> **How to read this document:**
> Written from how CRM actually works globally (Salesforce, HubSpot, Zoho, Dynamics patterns).
> Status of each step in OmniFlow shown inline. Build gaps listed at the end.
>
> **Status Icons:**
> - ✅ Built + UI page — test in browser at `http://localhost:5173`
> - 🔧 Built + API only — no UI page yet, use Swagger / Postman
> - ⏳ Partially built — backend entity exists, no FE page
> - ❌ Not built yet — needed for real-world completeness

---

## Roles in This Flow

| Role | Responsibility |
|---|---|
| **Admin / Owner** | System setup, approvals, configuration |
| **Marketing** | Campaigns, leads, nurture |
| **Sales Rep** | Deals, quotes, proposals, negotiations |
| **Sales Manager** | Pipeline oversight, approvals, commissions |
| **Finance** | Invoicing, payments, credit, commissions |
| **Procurement** | Vendor relations, POs, goods receipt |
| **Warehouse** | Receiving, picking, packing, shipping |
| **Customer Success (CS)** | Onboarding, renewals, account health |
| **Field Technician** | Work orders, installations, repairs |
| **Support Agent** | Tickets, escalations |

---

---

# PHASE 0 — Company Foundation Setup

> Done once before the first lead arrives. Admin configures the system to match the business.

---

## 0.1 Users & Roles ✅ `/dashboard/team`

Real world: Every CRM deployment starts with defining who can see and do what.

1. Invite all team members with appropriate roles (Admin, Agent, Manager)
2. Set permissions per role: who can approve deals, see financial data, manage vendors

---

## 0.2 Sales Territories ❌

Real world: Large sales teams divide accounts geographically or by industry. Rules automatically assign leads to the right rep based on country, region, or company size.

> **Not built.** Manual assignment used as workaround via rotation pools.

---

## 0.3 Pipeline & Stage Gates ✅ `/dashboard/crm/pipelines`

Real world: A pipeline defines the steps a deal goes through before closing. Gate conditions prevent reps from skipping stages without completing required actions.

1. Create pipeline: `Enterprise Sales`
2. Stages:
   - `Prospecting` → `Discovery Call` → `Demo / Proof of Concept` → `Proposal Sent` → `Negotiation` → `Contract Review` → `Closed Won` / `Closed Lost`
3. Gate on `Discovery Call`: Required field — `Budget Range`
4. Gate on `Proposal Sent`: Manual checkbox — `Demo completed and signed off`
5. Gate on `Contract Review`: Manual checkbox — `Legal review complete`

---

## 0.4 Product Catalog & Price Books ❌

Real world: Products/services are defined centrally with multiple price tiers:
- **Standard price** (default)
- **VIP / Enterprise price** (negotiated)
- **Distributor price** (for channel partners)
- **Promotional price** (time-limited)

When a sales rep builds a quote, they select a price book — prices populate automatically.

> **Not built as price books.** Products exist in catalog but no multi-tier pricing. Workaround: manually enter unit price in quotes.

---

## 0.5 Tax Rules ❌

Real world: Tax rates vary by product type, customer location, and registration status (B2B VAT-exempt in many countries). Tax is auto-calculated on quotes and invoices.

> **Not built.** Enter tax manually in quote/invoice line items.

---

## 0.6 Payment Terms Library ❌

Real world: A set of named payment terms (Net 30, Net 60, 50% upfront, etc.) applied to customers based on account tier or credit rating.

> **Not built.** Enter payment terms as free text on invoices.

---

## 0.7 Approval Authority Matrix ✅ `/dashboard/crm/approval-chains`

Real world: Defines who can approve what amount. Example:
- Quotes < $5k: auto-approved
- Quotes $5k–$50k: Sales Manager approves
- Quotes > $50k: VP Sales approves
- POs < $10k: Procurement Manager approves
- POs > $10k: Finance Director approves

1. Create `Quote Approval` chain (2-step: Manager → VP)
2. Create `Deal Closure Approval` chain (1-step: Manager)
3. Create `PO Approval` chain (1-step: Finance)

---

## 0.8 Custom Fields ✅ `/dashboard/crm/custom-fields`

Real world: Every business needs fields specific to their industry not covered by default CRM fields.

| Entity | Field | Type |
|---|---|---|
| Contact | Job Title | Text |
| Contact | LinkedIn URL | Text |
| Deal | Budget Range | Text |
| Deal | Decision Timeline | Text |
| Deal | Competitor | Text |
| Deal | Win Reason | Text |
| Deal | Loss Reason | Text |
| Lead | Lead Score | Number |

---

## 0.9 SLA Policies ✅ `/dashboard/crm/support`

Real world: Different customer tiers get different response guarantees.

| Tier | First Response | Resolution |
|---|---|---|
| Enterprise (Gold) | 2 hours | 24 hours |
| Business (Silver) | 8 hours | 72 hours |
| Standard | 24 hours | 5 days |

---

## 0.10 Assignment Rotation Pools ✅ `/dashboard/crm/assignment-rotation`

Real world: Ensures fair distribution of incoming leads, support tickets, and work orders across team members.

1. `Sales Lead Pool` → round-robin across sales reps
2. `Support Ticket Pool` → round-robin across support agents
3. `Field Tech Pool` → round-robin across field technicians

---

## 0.11 Vendor Registry ✅ `/dashboard/crm/vendors`

Real world: Pre-qualify and register all suppliers before any purchasing can happen. Includes payment terms, currency, lead times, and reliability ratings.

1. Add vendor: `BrevaCo International`
   - Payment Terms: Net 30, Currency: USD, Country: Italy
   - Contact: `james@brevaco.com`
2. Add vendor: `Koyo Machinery Ltd` (backup supplier)

---

## 0.12 Email Templates ❌

Real world: Reusable templates for: quote emails, follow-up sequences, invoice reminders, onboarding welcome, renewal reminders, shipping confirmations.

> **Not built as a template library.** Emails sent but not templated.

---

## 0.13 Contract Templates ⏳

Real world: Standard MSA (Master Service Agreement), NDA, SaaS subscription agreement templates that auto-populate with deal/customer details.

> **Backend entity exists. No UI to manage templates.**

---

## 0.14 Time Periods (Quota Periods) ✅ `/dashboard/crm/time-periods`

Real world: Defines fiscal periods against which rep quotas and team targets are measured.

1. Create `Q3 2026` — July 1 to Sept 30 → Approve
2. Create `June 2026` — June 1 to June 30 → Approve

---

## 0.15 Announcements ✅ `/dashboard/crm/announcements`

Real world: Internal broadcasts to the sales/ops team (price changes, product updates, new policies).

1. Publish: `Q3 Pricing Effective July 1 — Update All Quotes Before Sending`
2. Schedule: `New Vendor Added — BrevaCo International (faster lead times)`

---

---

# PHASE 1 — Marketing & Demand Generation

> Marketing team generates interest and captures leads.

---

## 1.1 Ad Campaigns ✅ `/dashboard/crm/meta-ads`

Real world: Paid ads on Meta (Facebook/Instagram), Google, LinkedIn to reach target buyers.

1. Connect Meta Ads account
2. Review active campaigns → sync leads from ad forms

---

## 1.2 Email Campaigns ✅ `/dashboard/crm/campaigns`

Real world: Targeted email to existing contacts and purchased/uploaded lists.

1. Create: `Q3 Commercial Coffee Outreach`
   - Audience: Contacts in Manufacturing and Hospitality industry
   - Subject: `Cut office coffee costs by 40%`
   - Schedule: tomorrow 09:00

---

## 1.3 Event & Website Tracking ✅ `/dashboard/crm/event-ingestion`

Real world: JavaScript snippet placed on company website records: page visits, form submissions, pricing page views. Each event is linked to a known contact/lead, updating their score.

1. Generate tracking key → place JS snippet on website
2. Verify events appear: `pricing_page_view`, `contact_form_submit`

---

## 1.4 Campaign Performance Tracking ❌

Real world: After a campaign runs: open rate, click-through rate, bounce rate, conversions, cost per lead. Used to decide which campaigns to scale.

> **Not built.** Campaign list exists but no performance analytics panel.

---

---

# PHASE 2 — Lead Management

> Leads flow in from all sources. Sales team qualifies and converts them.

---

## 2.1 Lead Capture ✅ `/dashboard/crm/leads`

Real world: Leads arrive from: website form, ad form, referral, cold outreach, event badge scan, phone call, WhatsApp inquiry.

1. Manual lead: `Anita Sharma`, anita.sharma@acmecorp.com, +977-9801234567
   - Source: `Website`, Company: `Acme Corp`, Industry: `Manufacturing`
2. Lead from campaign: synced from Meta Ads

---

## 2.2 Lead Scoring ⏳

Real world: Each action adds points automatically:
- Opened email: +5
- Clicked link: +10
- Visited pricing page: +15
- Submitted demo request: +25
- Score > 50: flagged as MQL (Marketing Qualified Lead) → auto-assigned to sales rep

> **Partial.** Score field exists as custom field. Auto-scoring engine not built.

---

## 2.3 Lead Assignment ✅ (via rotation pool)

Real world: Lead auto-assigned to sales rep from rotation pool or territory rule.

- Assign from `Sales Lead Pool` rotation

---

## 2.4 Lead Nurture ✅ `/dashboard/crm/nurture`

Real world: Cold leads get automated email sequences to educate and warm them up before the sales rep calls.

1. Create sequence: `Cold Lead Warm-Up`
   - Day 0: Welcome email
   - Day 3: Case study / ROI message
   - Day 7: Invite to demo webinar
   - Day 14: Final follow-up → change stage to `Qualified`
2. Enroll Anita Sharma

---

## 2.5 Lead Qualification ✅

Real world: Sales rep makes first contact. Applies BANT framework:
- **B**udget: Does the company have money to spend?
- **A**uthority: Is this person the decision-maker?
- **N**eed: Is there a real business problem to solve?
- **T**imeline: When do they need to buy?

Progression: `New` → `Contacted` → `Warm` → `Qualified` / `Disqualified`

1. Log call note on Anita's lead: `Budget $25k confirmed. Anita is IT Head, final sign-off. Q3 timeline.`
2. Advance stage: `Warm` → `Qualified`

---

## 2.6 Lead Conversion ❌

Real world: A single **Convert** button on the lead record simultaneously creates:
- Contact (from lead contact info)
- Account/Company (from lead company info)
- Deal/Opportunity (pre-filled with lead data)
- Lead marked `Converted` (kept for reporting, not deleted)

This is the formal hand-off from Marketing to Sales. It is a core feature in Salesforce, HubSpot, Zoho, and every major CRM.

> **Not built as a single convert action.** Workaround: manually create Contact, Account, and Deal separately. Lead stays as a separate record with no formal link to the resulting deal.

---

---

# PHASE 3 — Account & Contact Management

> Sales rep builds the full picture of the customer organization.

---

## 3.1 Organization ✅ `/dashboard/crm/organizations`

Real world: The legal entity or parent company. Multiple accounts (offices, divisions) can belong to one organization.

- Name: `Acme Corp`, Website: `acmecorp.com`, Industry: `Manufacturing`, Size: `201–500`

---

## 3.2 Account with Hierarchy ✅ `/dashboard/crm/accounts`

Real world: Accounts represent a company relationship. Large companies have hierarchies: HQ → regional offices → divisions. Each account has its own owner, tier, and spend history.

1. Parent: `Acme Corp — Global` (Strategic tier)
2. Child: `Acme Corp — Nepal` (Enterprise tier) → owner: yourself → **copy ACCOUNT_ID**
3. Child: `Acme Corp — Operations Division` (parent: Nepal)

---

## 3.3 Contacts with Stakeholder Roles ✅ `/dashboard/crm/contacts`

Real world: Multiple stakeholders per deal, each with a different role:
- **Economic Buyer**: signs the check (CFO)
- **Champion**: advocates internally for your solution (IT Head)
- **Technical Buyer**: evaluates fit (IT Admin)
- **Influencer**: has opinions but no final authority
- **Blocker**: actively opposed to the purchase

1. Create: `Anita Sharma` — IT Head / Champion, anita.sharma@acmecorp.com → **copy CONTACT_ID**
2. Create: `Rajesh Rana` — CFO / Economic Buyer, rajesh@acmecorp.com
3. Create: `Priya KC` — IT Admin / Technical Buyer, priya@acmecorp.com
4. Link all three to `Acme Corp — Nepal`

---

## 3.4 Contact Roles on Deal ❌

Real world: When creating the deal, you assign contacts with their specific roles in that deal. This lets you track who you need to influence and who the final approver is.

> **Not built.** Deals have one primary contact. Multi-contact role assignment not available.

---

## 3.5 Deduplication ✅ `/dashboard/crm/dedup`

Real world: Duplicates arise constantly — from imports, multiple reps creating the same contact, form submissions. CRM detects and merges them.

1. Create duplicate: `Anita S`, same email → system detects
2. Compare side-by-side → select winner → Merge ✓

---

---

# PHASE 4 — Deal / Opportunity Management

> The core of the CRM. Sales rep manages the opportunity through the pipeline to close.

---

## 4.1 Deal Creation ✅ `/dashboard/crm/deals`

Real world: One opportunity per buying event. If the same customer buys again, it is a new deal.

1. New Deal:
   - Title: `Acme Corp — 10x Espresso Machine Enterprise`
   - Account: `Acme Corp — Nepal`, Primary Contact: `Anita Sharma`
   - Pipeline: `Enterprise Sales`, Stage: `Prospecting`
   - Value: `25,500`, Close Date: 30 days out
   - Custom fields: Budget Range: `$20k–$30k`, Decision Timeline: `End of Q3`
   - Competitor: `DeLonghi`
2. Save → **copy DEAL_ID**

---

## 4.2 Stage Progression with Gate Enforcement ✅

Real world: Moving through stages is not free-form — gates enforce completeness before a rep can advance.

1. Move to `Discovery Call` → gate fires: Budget Range required ✓ (already filled)
2. Add strategy note: `All 3 stakeholders aligned. Anita champions, Rajesh signs o  ff, Priya evaluates spec.`
3. Move to `Demo / Proof of Concept` → log activity: `Demo delivered. All 10 machines tested. Coffee quality approved by Anita.`
4. Move to `Proposal Sent` → gate: Demo completed ✓

---

## 4.3 Meetings & Activities ✅ `/dashboard/crm/meetings`

Real world: Every customer interaction is logged. The activity timeline tells the complete story of the relationship.

1. New Meeting: `Discovery Call — Acme Corp`, Date: yesterday, Duration: 45 min
2. New Meeting: `Product Demo — Acme Corp HQ`, Date: today, Duration: 90 min
   - Click `Request AI Call Summary`
   - Click `Create Task from Meeting` → `Send proposal to all 3 stakeholders`

---

## 4.4 Pipeline Forecasting ✅ (partially)

Real world: Every deal has a probability %. Sales management uses probability × value to project revenue for the quarter.

- Deal at `Proposal Sent` → probability ~60%
- Weighted value = $25,500 × 60% = $15,300 in forecast

---

## 4.5 Competitor Tracking ❌

Real world: Knowing which competitor is in each deal lets management track win rates against each competitor and coach reps accordingly.

> **Not built as a structured field.** Workaround: add competitor name in custom field or deal notes.

---

---

# PHASE 5 — Pre-Sales Documents

> Formal documents that move the deal from discussion to commitment.

---

## 5.1 Quote ✅ `/dashboard/crm/quotes`

Real world: A formal pricing document. In B2B, quotes must be approved before being sent. Multiple versions (revisions) can exist for the same deal.

1. New Quote → Contact: Anita Sharma, Deal: link it
   - Validity: 30 days
   - Line items:
     - `Espresso Machine Pro X1` × 10 @ `2,500` = `25,000`
     - `Installation & Commissioning` × 1 @ `500`
     - `Annual Maintenance Plan` × 1 @ `1,200`
   - Total: `$26,700`
2. Save → Submit for Approval → `/dashboard/crm/approvals`
3. Approve both steps → status: **Approved**
4. Send to Customer → status: **Sent**

---

## 5.2 Negotiation Rounds ⏳

Real world: Customer pushes back on price or terms. Sales rep records each round:
- Round 1 — Customer: `$24,000, Net 60`
- Round 2 — Rep: `$25,200, Net 45, free installation`
- Round 3 — Customer accepts

Each round is dated and tracked. The final agreed terms flow into the contract.

> **Backend entity exists. No UI page.** Workaround: log negotiation rounds as notes on the deal. Agreed terms manually entered on the revised quote.

---

## 5.3 Proposal ✅ `/dashboard/crm/proposals`

Real world: The business case document — longer and more persuasive than a quote. Explains the problem, your solution, ROI, timeline, investment, and next steps. Sent to all stakeholders.

1. New Proposal → `OmniFlow Enterprise Coffee Solution — Acme Corp`
2. Generate with AI → edit sections:
   - Executive Summary: business problem + solution
   - ROI estimate: 40% cost saving vs cafe runs
   - Investment: $26,700 + payment terms
   - Timeline: delivery within 7 days of PO
3. Send → status: **Sent**

---

## 5.4 Contract & E-Signature ⏳

Real world: The legally binding agreement. Generated from accepted quote terms. Sent via e-sign platform. Both parties sign. Deal only marks Won after the contract is fully countersigned.

1. Generate contract from approved quote
2. Send for e-signature to `Anita Sharma` and `Rajesh Rana` (CFO — the authority)
3. Both sign → contract stored → deal unlocks to Mark as Won

> **Backend entity exists. No UI page.** Workaround: mark deal Won manually after verbal or email confirmation.

---

---

# PHASE 6 — Deal Close

> The formal close process. Not just clicking a button — it involves approval, documentation, and handover.

---

## 6.1 Mark as Won ✅ `/dashboard/crm/deals`

Real world: Closing a deal requires a signed contract (or accepted PO for trusted accounts), a win reason on record, and manager approval.

1. Move deal → `Contract Review` → gate: Legal review complete ✓
2. Click `Mark as Won` → fill Win Reason: `Best TCO vs DeLonghi. Anita championed. Rajesh approved.`
3. Submit for Deal Closure Approval → approve → deal shows **Won** badge ✓

---

## 6.2 Commission Calculation ⏳

Real world: As soon as the deal is marked Won:
- Commission = Deal Value × Rep Rate (e.g., 5% = $1,275)
- If a split deal: split among reps by contribution %
- Commission record created → pending manager approval → approved → paid in next payroll run

> **Backend built. No UI page.** Commission calculated but no page to view, approve, or track payouts.

---

## 6.3 Internal Handover Note ❌

Real world: The sales rep writes a structured handover note for the CS team covering:
- What the customer expects vs what was sold
- Who the stakeholders are and their personalities
- Any special commitments made during negotiation
- Red flags or sensitivities to be aware of

> **Not built as a structured handover record.** Workaround: write handover as a deal note and manually assign a task to the CS rep.

---

---

# PHASE 7 — Order Management

> Finance and sales ops turn the won deal into a confirmed sales order.

---

## 7.1 Sales Order Creation ✅ `/dashboard/crm/orders`

Real world: A Sales Order is the internal document that triggers fulfillment. Generated directly from the signed contract / accepted quote — line items carry over automatically.

1. New Order → Contact: Anita Sharma, Deal: link it
   - Line items (same as quote):
     - `Espresso Machine Pro X1` × 10 @ `2,500`
     - `Installation & Commissioning` × 1 @ `500`
     - `Annual Maintenance Plan` × 1 @ `1,200`
2. Save → status: **Draft** → **copy ORDER_ID**

---

## 7.2 Customer PO Number ❌

Real world: In B2B, the buying company issues their own Purchase Order number (e.g., `ACME-PO-2026-441`). Your sales order must reference their PO number. Finance will not pay without it. Your invoice must match their PO number or the customer's AP team will reject it.

> **Not built.** No `CustomerPONumber` field on the Order entity. Critical for B2B invoicing.

---

## 7.3 Credit Check ❌

Real world: Before confirming a large order from a first-time or high-risk customer:
- Check for outstanding overdue invoices from this account
- Check if the order exceeds their credit limit
- High-risk accounts require deposit or upfront payment before goods are released

> **Not built.** Workaround: check outstanding invoices manually before confirming.

---

## 7.4 Order Acknowledgment to Customer ❌

Real world: After the order is confirmed internally, an acknowledgment email is sent confirming order number, items, quantities, prices, and expected delivery date. This is standard B2B practice.

> **Not built as automated email trigger.** Workaround: send acknowledgment email manually.

---

---

# PHASE 8 — Inventory Check

> Before fulfilling any order, check if stock is available.

---

## 8.1 Check Available Stock 🔧

Real world: The system checks current available stock = on-hand minus already reserved for other confirmed orders.

```
POST https://localhost:50362/api/v1/inventory/check
Authorization: Bearer <token>
[
  { "ProductId": "<ESPRESSO_MACHINE_PRODUCT_ID>", "Quantity": 10 }
]
```

**Outcome A — All available:** `AllAvailable: true` → skip to Phase 10 (Confirm Order)
**Outcome B — Insufficient stock:** `AllAvailable: false` → proceed to Phase 9 (Procure)

---

---

# PHASE 9 — Procurement (when stock is insufficient)

> Procurement team buys from suppliers to fulfill the order.

---

## 9.1 Request for Quotation from Vendors (RFQ) ❌

Real world: For large purchases, procurement sends an RFQ to 2–3 pre-approved vendors and selects the best based on price, lead time, and historical reliability rating.

> **Not built.** Go directly to raising a PO with the preferred vendor.

---

## 9.2 Purchase Order ✅ `/dashboard/crm/purchase-orders`

Real world: A formal, legally binding commitment to buy from a supplier. Must be approved internally before sending. PO number referenced in all related documents.

1. New PO → Vendor: `BrevaCo International`
   - Expected Delivery: 7 days from today
   - Line item: `Espresso Machine Pro X1` × 12 (10 for order + 2 safety buffer)
   - Unit Cost: `1,800` → Total: `21,600`
2. Save → Submit for Approval → `/dashboard/crm/approvals` → approve → **Approved**
3. Send to Vendor → status: **Sent to Vendor**

---

## 9.3 Supplier Order Confirmation ❌

Real world: The vendor sends back a confirmation acknowledging your PO with their internal reference number and a confirmed delivery date. This confirmation is filed against your PO.

> **Not built.** Workaround: log vendor confirmation as a note on the PO record.

---

## 9.4 Goods Receipt ✅ `/dashboard/crm/goods-receipts`

Real world: When the shipment arrives, warehouse staff inspect it:
- Count received quantity vs PO quantity
- Check condition — any damage?
- Record serial numbers of each unit received
- Record batch/lot numbers if applicable
- Short delivery or damage → discrepancy report raised to vendor

1. New Goods Receipt → link to PO above
   - Warehouse Location: `Main Warehouse, Bay 3`
   - Line: `Espresso Machine Pro X1`, Received: `12`, Condition: Good
2. Click **Confirm Receipt** → PO status: **Fully Received**
3. Inventory auto-updated: `QuantityOnHand + 12`

---

## 9.5 Goods Receipt Discrepancy ❌

Real world: Received quantity ≠ PO quantity, or items arrive damaged:
- Short delivery: debit note raised, PO marked partially received, balance remains open
- Damaged goods: vendor return raised, replacement requested

> **Not built.** Workaround: note discrepancy in the GR record manually.

---

## 9.6 Three-Way Match ❌

Real world: Before paying the supplier invoice, finance reconciles three documents:
- **PO:** What price per unit was agreed
- **GR:** What quantity was actually received
- **Supplier Invoice:** What the vendor is charging

All three must match. Mismatches go to a dispute queue. This prevents overpayment and paying for goods never received.

> **Not built as automated matching.** Workaround: reconcile manually by comparing PO, GR, and invoice figures before approving payment.

---

## 9.7 Supplier Invoice ✅ `/dashboard/crm/supplier-invoices`

Real world: Vendor sends invoice. Finance verifies it against the PO and GR (3-way match). If matched, scheduled for payment on due date.

1. New Supplier Invoice → Vendor: BrevaCo, link PO
   - Invoice Number: `BRV-2026-0441`, Amount: `21,600`, Due: 30 days
2. Approve → Record Payment on due date

---

## 9.8 Supplier Payment ❌

Real world: Finance processes payment via bank transfer or payment platform on the due date. Remittance advice sent to vendor. Payment confirmation recorded.

> **Not built as payment processing.** Record Payment updates status only; no actual payment dispatch or remittance.

---

---

# PHASE 10 — Order Confirmation & Stock Reservation

---

## 10.1 Confirm Order ✅ `/dashboard/crm/orders`

Real world: When the order is confirmed, the required quantity is ring-fenced in inventory for this customer. Other orders cannot claim the same stock.

1. Open the order → click **Confirm**
   - System checks stock: 12 units available → 10 reserved for this order
   - `StockStatus`: **Reserved** ✓
   - Order status: **Confirmed**

> If `StockStatus` shows **Backordered**: stock still insufficient — complete Phase 9 first, then re-confirm.

---

---

# PHASE 11 — Fulfillment & Delivery

> Warehouse picks, packs, and ships the order.

---

## 11.1 Pick List & Packing ❌

Real world: Warehouse Management System generates a pick list:
- Location: `Bay 3, Shelf A`
- Item: Espresso Machine Pro X1, Qty 10
- Serial numbers to pull: BRV-2026-001001 through 001010

Staff picks items, packs them, scans serial numbers, records box count and weight.

> **Not built.** No warehouse management / pick-pack-ship workflow.

---

## 11.2 Delivery / Shipment ✅ `/dashboard/crm/deliveries`

Real world: Carrier booked, tracking number generated. Customer receives automatic shipping confirmation email with a tracking link.

**Create shipment via API:**
```
POST https://localhost:50362/api/v1/crm/orders/<ORDER_ID>/deliveries
Authorization: Bearer <token>
{
  "Carrier": "DHL Express",
  "TrackingNumber": "DHL-ACME-BATCH-001",
  "RecipientName": "Anita Sharma",
  "RecipientAddress": "Acme Corp HQ, Thamel, Kathmandu 44600, Nepal"
}
```

**Track and advance in UI:**
1. Open `/dashboard/crm/deliveries` → find `DHL-ACME-BATCH-001`
2. Advance: `Label Created` → `Picked Up` → `In Transit` → `Out for Delivery` → **Delivered** ✓

**Simulate failed delivery:**
```
POST → TrackingNumber: "DHL-ACME-FAIL-001"
```
→ Advance to `Out for Delivery` → `Mark Failed` → reason: `Recipient not available` ✓

---

## 11.3 Proof of Delivery (POD) ❌

Real world: On delivery, the recipient signs (physically or via digital capture). POD is uploaded and linked to the delivery record. In many companies, this is the invoice trigger.

> **Not built.** Delivery confirmed by status update only.

---

---

# PHASE 12 — Customer Invoicing & Payment

> Finance sends the official tax invoice and collects payment.

---

## 12.1 Invoice Creation ✅ `/dashboard/crm/invoices`

Real world: Two common models:
- **Invoice on shipment** (most B2B): invoice goes out when goods leave the warehouse
- **Invoice on delivery confirmation**: sent only after customer confirms receipt

The invoice must reference the customer's PO number for their AP team to process it.

1. New Invoice → Contact: Anita Sharma, Order: link it
   - Due: Net 30 from today
   - Line items auto-populated from order
2. Save → **Send** → status: **Sent**

---

## 12.2 Pro-Forma Invoice ❌

Real world: For international trade, customers often need a pro-forma (draft invoice) before the goods ship — for import clearance, letters of credit, or internal PO approval.

> **Not built.**

---

## 12.3 Payment Reminders ❌

Real world: Automated sequence:
- Day −7 before due: `Your invoice is due in 7 days`
- Day 0: `Invoice is due today`
- Day +7: `Invoice is 7 days overdue — please remit`
- Day +30: Escalate to collections team

> **Not built.** Reminders sent manually.

---

## 12.4 Record Payment ✅

Real world: Payment received via bank transfer, cheque, or payment gateway. Remittance matched to invoice. Receipt issued to customer.

1. Open invoice → **Record Payment**
   - Amount: `26,700`, Method: `Bank Transfer`, Date: today
2. Status → **Paid** ✓
3. Order auto-updates → **Fulfilled**
4. Inventory reservations released → `QuantityOnHand: 2`, `QuantityReserved: 0`

**Verify inventory consumed** 🔧:
```
GET https://localhost:50362/api/v1/inventory/<PRODUCT_ID>
Expect: QuantityOnHand: 2, QuantityReserved: 0
```

---

## 12.5 Overdue & Disputed Invoices ✅

1. Create second invoice, due date: yesterday → verify **Overdue** badge ✓
2. Click **Mark as Disputed** → reason: `Customer claims 9 units received, not 10`
3. Click **Void** → status: **Voided** ✓

---

## 12.6 Credit Note ❌

Real world: When a return is accepted or an overcharge is found, a credit note (the financial inverse of an invoice) is issued. It reduces the customer's outstanding balance or triggers a refund.

> **Not built.** Returns are approved but no credit note document is generated.

---

---

# PHASE 13 — Customer Onboarding

> CS team ensures the customer achieves value quickly and without friction.

---

## 13.1 Equipment Registration ✅ `/dashboard/crm/equipment`

Real world: Every physical unit shipped is registered with serial number, warranty start date, and site location. This is the foundation for service scheduling and warranty management.

> Register BEFORE creating the subscription. You can only subscribe for maintenance of machines that are registered.

1. Register `ACME-ESP-001` — Model: Espresso Pro X1, Serial: `BRV-2026-001001`, Site: Main Kitchen
2. Register `ACME-ESP-002` — Site: Floor 3 Pantry
3. Register `ACME-ESP-003` — Site: Boardroom
4. *(Register remaining 7 similarly)*
5. Warranty: 2 years from today, First Service Date: 6 months out

---

## 13.2 Installation Work Order ✅ `/dashboard/crm/work-orders`

Real world: Field tech is dispatched to install, configure, and commission the equipment on-site. All time and parts are logged.

1. New Work Order → `Installation — Acme Corp 10x Units`
   - Type: Installation, Priority: High
   - Contact: Anita Sharma, Equipment: ACME-ESP-001
   - Scheduled: tomorrow 08:00, Estimated: 480 min
2. Status: `Draft` → `Scheduled` → `En Route` → `In Progress`
3. Notes during work:
   - `Units 1–5 installed and calibrated. Pump pressure 9.2 bar.`
   - Parts: `Wall mount brackets × 10, Power cables × 10`
   - `Units 6–10 complete. All tested. Customer approves.`
4. Resolution: `All 10 units installed, tested. Sign-off obtained from Anita Sharma.`
5. Actual Minutes: `420` → **Complete** ✓

---

## 13.3 Onboarding Milestones ✅ `/dashboard/crm/customer-onboarding`

Real world: A formal project with milestones agreed between CS and the customer at the kickoff call.

1. Start Onboarding → `Acme Corp — 10x Machine Rollout`
   - Deal: link it, Contact: Anita Sharma
2. Milestones:
   - `Kickoff Call` | Day 0
   - `Equipment Delivered & Installed` | Day 7
   - `Barista Training — Group A (Floors 1–2)` | Day 10
   - `Barista Training — Group B (Floors 3–5)` | Day 12
   - `All 10 Units Go Live` | Day 14
   - `30-Day Health Check Call` | Day 44

**Work through milestones:**
1. Check `Kickoff Call` ✓ → 17%
2. Check `Equipment Delivered & Installed` ✓ → 33%
3. **Mark Blocked** on `Barista Training — Group A` → reason: `Training room renovation delayed`
4. Verify blocked indicator shows on card
5. **Unblock** → check Group A ✓ → 50%
6. Check Group B ✓ → 67%
7. Check `All 10 Units Go Live` ✓ → 83%
8. Check `30-Day Health Check Call` ✓ → 100%
9. **Mark Onboarding Complete** → status: **Completed** ✓

---

---

# PHASE 14 — Subscription & Renewal Management

> Ongoing recurring revenue. Requires proactive management to prevent churn.

---

## 14.1 Subscription Creation ✅ `/dashboard/crm/subscriptions`

Real world: Created after equipment is registered and operational. Subscription covers ongoing maintenance, support tier upgrade, or consumables replenishment.

1. New Subscription → Contact: Anita Sharma
   - Plan: `Annual Maintenance Plan`, Billing: Monthly, Amount: `100`
   - Start: today, Auto-renew: Yes
2. Status: **Active**

---

## 14.2 Subscription Changes ✅

1. **Pause** → reason: `Customer on holiday closure, no usage` → **Paused**
2. **Resume** → **Active** ✓

---

## 14.3 Renewal Lifecycle ❌

Real world: Active management of the renewal 90 days before expiry:
- 90 days: CS gets alert → reviews account health → calls customer
- 60 days: Renewal quote generated and sent
- 30 days: Follow-up if no response
- 7 days: Manager escalated if still no decision
- Expiry day: auto-renews or lapses

> **Not built.** No renewal pipeline, alerts, or renewal quote generation. Renewals managed manually.

---

## 14.4 Churn Tracking ❌

Real world: When a subscription is cancelled, the reason is recorded and aggregated for quarterly review. Management uses churn reason data to fix product/service gaps.

> **Not built.** Cancel reason noted but no churn analytics.

---

---

# PHASE 15 — Support & Field Service

> Customers experience issues. Support resolves; field service visits if needed.

---

## 15.1 Support Ticket ✅ `/dashboard/crm/support`

Real world: Customer contacts via phone, email, WhatsApp, or the company chatbot. A ticket is created immediately. SLA clock starts on creation.

1. New Case → `ACME-ESP-007 — No Power After 2 Weeks`
   - Contact: Anita Sharma, Priority: **Urgent**
   - SLA: `Enterprise (Gold)` → 2h first response, 24h resolution
2. Internal note: `Likely power board failure — same issue as 2024-B batch`
3. Reply: `Technician dispatched. On-site tomorrow 09:00.`
4. Escalate to L2: `Possible manufacturing defect — 3 units in same batch batch`

---

## 15.2 Repair Work Order ✅ `/dashboard/crm/work-orders`

Real world: Field tech visits site. Diagnosis, repair, and parts are all logged. Time tracked for billing (if out-of-warranty) or for warranty claim submission to the manufacturer.

1. New WO → `Urgent Repair — ACME-ESP-007`
   - Type: Repair, Priority: Urgent, linked to support case above
   - Equipment: `ACME-ESP-007`, Scheduled: tomorrow 09:00
2. Auto-assign from `Field Tech Pool` → verify assignment ✓
3. Status: `En Route` → `In Progress`
4. Notes:
   - `Diagnosis: pump motor seized, PCB water damaged`
   - Parts: `Pump motor assembly × 1, PCB board × 1`
5. Resolution: `Repaired. Tested. Root cause: condensation ingress near steam vent. Advisory issued.`
6. Complete ✓

---

## 15.3 Support Case Resolution ✅

1. Resolve case → resolution summary: `Pump motor and PCB replaced on-site. Unit operational.`
2. Status → **Closed** ✓

---

## 15.4 Post-Resolution CSAT Survey ❌

Real world: 24 hours after ticket closure, an automated 1-question CSAT survey is sent:
`How satisfied were you with your support experience today? (1–5)`

Score feeds into agent-level and team-level performance dashboards. Drives coaching and staffing decisions.

> **Not built.** NPS survey exists. CSAT auto-triggered from ticket close is not built.

---

## 15.5 Knowledge Base ❌

Real world: Recurring issues are documented: symptoms, root cause, fix steps, affected models. Next time the same issue comes in, the agent sees the known fix in under 10 seconds.

> **Not built.**

---

---

# PHASE 16 — Returns (RMA — Return Merchandise Authorization)

> Customer wants to return a defective or unwanted item.

---

## 16.1 Return Request ✅ `/dashboard/crm/returns`

Real world: Customer contacts support. Return eligibility is checked (warranty status, reason, condition policy). RMA number issued. Return instructions and shipping label sent.

**Create via API:**
```
POST https://localhost:50362/api/v1/crm/orders/<ORDER_ID>/returns
Authorization: Bearer <token>
{
  "ContactId": "<CONTACT_ID>",
  "ReturnReason": 1,
  "CustomerNotes": "Unit 7 — complete pump failure after 2 weeks. Cannot repair on-site.",
  "LineItems": [{
    "ProductName": "Espresso Machine Pro X1",
    "QuantityOrdered": 10,
    "QuantityReturned": 1,
    "UnitPrice": 2500
  }]
}
```
`ReturnReason: 1` = Defective

---

## 16.2 RMA Approval & Physical Inspection ✅

Real world: Once item is received back in the warehouse, it is inspected formally and outcome recorded.

1. Open return → **Approve** → RMA number issued
2. **Mark Received** → item back in warehouse
3. **Record Inspection**:
   - Result: `Failed`
   - Findings: `Pump motor seized, PCB water damage. Manufacturing defect confirmed.`

---

## 16.3 Return Resolution ✅

1. **Resolve** → Type: Replacement → Notes: `Replacement unit shipped DHL-ACME-REPLACE-001`
2. Status → **Resolved** ✓

**Test rejection path:**
```
POST → ReturnReason: 3 (Out of Warranty)
```
→ Open → **Reject** → reason: `Outside 2-year warranty. Physical damage observed.` ✓

---

## 16.4 Credit Note for Refund ❌

Real world: If the customer chose refund or credit instead of replacement:
- Credit note issued for the value of the returned unit ($2,500)
- Applied to the next invoice OR refunded to original payment method
- Recorded in accounts receivable as a debit

> **Not built.** Return resolved but no financial document generated.

---

## 16.5 Returned Stock Disposition ❌

Real world: Returned item is assessed:
- **Restockable (Grade A):** returned to saleable inventory → `QuantityOnHand + 1`
- **Refurbishable:** sent to repair, re-graded as Grade B, relisted at lower price
- **Write-off:** damaged beyond repair → inventory decremented → loss recorded

> **Partial.** Inventory can be manually adjusted via API. No formal disposition workflow.

---

---

# PHASE 17 — Upsell / Cross-Sell / Expansion

> Existing customers are the lowest-cost source of new revenue.

---

## 17.1 Expansion Opportunity ✅ `/dashboard/crm/deals`

Real world: Expansion triggers:
- Support ticket reveals an unmet need
- CS notices new office opening from account news
- Subscription renewal conversation: "want to add a floor?"
- Annual account review

1. New Deal → `Acme Corp — Boardroom Upgrade × 2 Units`
   - Account: `Acme Corp — Nepal`, Stage: `Discovery Call`
   - Source: `Existing Customer — Expansion`
   - Value: `5,500`
2. Note: sales cycle is 3× shorter — no new prospecting, trust already established

---

## 17.2 Quarterly Business Review (QBR) ❌

Real world: CS schedules a formal quarterly meeting with customer leadership:
- Review: uptime, support ticket history, usage, satisfaction
- Share: product roadmap, upcoming features
- Discuss: expansion needs, renewal terms
- Record: action items, commitments, account health update

> **Not built as a structured QBR record.** Workaround: log as meeting + activity notes.

---

## 17.3 Account Health Score ❌

Real world: CRM auto-calculates health (Red / Yellow / Green) based on:
- Days since last purchase
- Open support tickets (volume + severity)
- NPS score
- Overdue invoices
- Subscription renewal proximity

CS team focuses proactively on Red accounts before they churn.

> **Not built.**

---

---

# PHASE 18 — Operations & Team Productivity

---

## 18.1 Tasks ✅ `/dashboard/crm/tasks`

Real world: CRM-linked to-dos. Every deal, case, and delivery generates tasks — manually or via automation.

1. Auto-created from meeting: `Send proposal to all 3 stakeholders` ✓
2. Manual: `Follow up on overdue invoice — Acme Corp`, Priority: High, Due: today
3. Manual: `Schedule QBR for Q3`, Due: Aug 1, Assigned: CS rep

---

## 18.2 Time Tracking ✅ `/dashboard/crm/time-tracking`

Real world: Sales and CS log hours against deals, accounts, and cases. Finance uses this for profitability analysis and client billing.

1. Log: `Proposal writing + pricing analysis` — 3h, Deal: Acme Corp, Billable: Yes
2. Log: `Demo delivery and prep` — 2h, Billable: Yes
3. Log: `Installation work order` — 7h, Work Order: linked

---

## 18.3 Process Workflows (Checklists) ✅ `/dashboard/crm/process-tasks`

Real world: Repeatable multi-step checklists enforced for consistency — e.g., every enterprise delivery goes through the same 6-step checklist.

1. Define: `Enterprise Equipment Delivery Checklist`
   - Pre-shipment inspection complete
   - Delivery confirmed with customer
   - Equipment registered (all serial numbers)
   - Installation work order completed
   - Staff training delivered
   - Customer sign-off obtained

2. Start Instance → link to Acme Corp → work through steps

---

## 18.4 Workflow Automation ✅ `/dashboard/crm/workflows`

Real world: Rules that fire automatically based on CRM events — removing manual steps and ensuring nothing is missed.

Examples:
- Deal Won → create onboarding task + notify CS rep
- Invoice overdue 7 days → send reminder + notify finance
- Support case open 48h without response → auto-escalate + alert manager
- Equipment service date in 30 days → create maintenance work order

1. Create: `Deal Won → Trigger Onboarding`
   - Trigger: Deal Stage = Closed Won
   - Action 1: Create Task → `Start onboarding — {Account Name}`
   - Action 2: Send Notification → CS rep
2. Activate → close a test deal as Won → verify auto-task created ✓

---

---

# PHASE 19 — Intelligence & Analytics

---

## 19.1 Sales Analytics ✅ `/dashboard/crm/analytics`

Real world: Daily view for sales managers:
- Pipeline by stage and by rep
- Win rate, average deal size, average sales cycle length
- Lead-to-opportunity conversion rate
- Won vs lost this period
- AI-suggested next actions

1. Verify: Deals won: 1, Revenue: $26,700, Expansion pipeline: $5,500
2. AI Actions panel → approve one → reject one → undo approved → verify rolled back ✓

---

## 19.2 Revenue Forecasting ✅ (partially)

Real world: Probability-weighted pipeline + committed (Won) revenue = quarter forecast.

- Won (committed): $26,700
- Expansion deal at `Discovery` (20%): $5,500 × 20% = $1,100
- Total forecast: ~$27,800

---

## 19.3 Win / Loss Analysis ✅

Real world: Aggregates win/loss reasons across all deals. Answers: why do we win? Which competitors do we beat? Which segments do we lose in?

1. Close a throwaway deal as **Lost** → reason: `Chose DeLonghi — 15% cheaper on hardware`
2. Analytics → verify loss reason tracked and visible ✓

---

## 19.4 NPS ✅ `/dashboard/crm/nps`

Real world: Sent at key moments: post-delivery, post-onboarding, post-support, at renewal.

1. Send to Anita Sharma (post-onboarding) → Score `9` → **Promoter** ✓
2. Send to another contact → Score `6` → **Passive**
3. Send → Score `3` → **Detractor** → triggers CS alert to call customer

---

## 19.5 Operations Dashboard ✅ `/dashboard/crm/ops-dashboard`

Real world: Logistics and field service leadership view:
- Deliveries: in transit, delayed, failed
- Work orders: overdue, scheduled today, this week
- Returns: pending inspection
- Onboardings: on-track vs at-risk

1. Verify: 1 delivered + 1 failed, 1 WO completed, 1 return resolved ✓

---

## 19.6 Inventory Intelligence 🔧

Real world: Stock levels, reorder alerts, supplier fill rates, stock turnover ratio.

```
GET /api/v1/inventory?BelowReorderPoint=true   → items needing reorder
GET /api/v1/inventory/<PRODUCT_ID>/transactions → full movement history
```

Expected transaction history: `GoodsIn` (Phase 9.4) → `OrderReserved` (Phase 10.1) → `OrderFulfilled` (Phase 12.4)

---

## 19.7 Commission Reporting ⏳

Real world: Finance and sales managers review per-period:
- Commission earned per rep
- Commission pending manager approval
- Commission paid vs owed
- Quota attainment % per rep

> **Backend built. No UI.**

---

## 19.8 Profitability per Deal ❌

Real world:
- Revenue: $26,700
- COGS: 10 × $1,800 = $18,000
- Gross margin: $8,700 (32.6%)
- Time cost: 12.5h × blended hourly rate
- Net margin per deal

> **Not built.** Time tracking exists but no COGS + margin calculation.

---

---

# Full Lifecycle at a Glance

```
[FOUNDATION]
  Users + Roles → Pipelines + Gates → Approval Matrix
  Custom Fields → SLA Tiers → Rotation Pools
  Vendor Registry → Time Periods → Announcements

[MARKETING]
  Ad Campaigns (Meta) → Email Campaigns
  Website Event Tracking → Lead Capture
  Nurture Sequences → Lead Scoring (partial)

[QUALIFY]
  Lead: captured → scored → assigned → nurtured
  Discovery call → BANT qualified
  Convert → Contact + Account + Deal    ← ❌ formal conversion not built

[ACCOUNT & CONTACT]
  Organization → Account (hierarchy) → Contacts (3 stakeholders)
  Deduplication → merged ✓
  Contact roles on deal                 ← ❌ not built

[DEAL]
  Pipeline → stage gates enforced ✓
  Meetings + activities logged ✓
  Forecasting (probability-weighted) ✓

[PRE-SALES]
  Quote → internal approval → sent ✓
  Negotiation rounds                    ← ⏳ backend only
  Proposal (AI-generated) → sent ✓
  Contract → e-signature                ← ⏳ backend only

[CLOSE]
  Deal Won → win reason → approval ✓
  Commission calculated                 ← ⏳ no UI
  Internal handover note                ← ❌ not built

[ORDER]
  Sales order created ✓
  Customer PO number recorded           ← ❌ field missing
  Credit check                          ← ❌ not built
  Order acknowledgment sent             ← ❌ not built

[INVENTORY CHECK]
  Stock check API → 0 units available  ← 🔧 API only

[PROCURE]
  PO raised → BrevaCo ✓
  PO approved → sent to vendor ✓
  GR confirmed → inventory +12 ✓
  3-way match (PO + GR + Invoice)       ← ❌ manual only
  Supplier invoice paid ✓

[FULFILL]
  Order confirmed → 10 units reserved ✓
  Pick / Pack                           ← ❌ not built
  Delivery created (API) → DHL ✓
  Shipped → In Transit → Delivered ✓
  Inventory released: 12 → 2 ✓

[INVOICE & PAYMENT]
  Tax invoice sent ✓
  Payment reminders                     ← ❌ manual
  Payment recorded → Paid ✓
  Credit note                           ← ❌ not built

[ONBOARDING]
  Equipment registered (10 units) ✓    ← must be BEFORE subscription
  Installation work order → Complete ✓
  Onboarding milestones → 100% ✓
  Subscription: Maintenance → Active ✓

[SUPPORT]
  Support ticket → SLA timer ✓
  Escalation L1 → L2 ✓
  Repair work order → Complete ✓
  Post-close CSAT                       ← ❌ not built
  Knowledge base                        ← ❌ not built

[RETURNS]
  RMA raised → approved → inspected ✓
  Replacement shipped ✓
  Credit note                           ← ❌ not built
  Stock disposition                     ← ❌ formal flow not built

[UPSELL]
  Expansion deal (existing account) ✓
  QBR scheduling                        ← ❌ not built
  Account health score                  ← ❌ not built

[ANALYTICS]
  Sales analytics + win/loss ✓
  Ops dashboard ✓
  NPS ✓
  Inventory history (API) ✓
  Commission reports                    ← ⏳ no UI
  Profitability                         ← ❌ not built
```

---

---

# Build Gap Summary

> What OmniFlow needs to match a globally standard CRM.

| Priority | # | Feature | Notes |
|---|---|---|---|
| **A — Blocks real use** | 1 | Lead Conversion (single-click → Contact + Account + Deal) | Core CRM pattern. Currently 3 manual steps with no formal link. |
| **A** | 2 | Customer PO Number on Order | B2B invoicing requirement. Customers' AP teams reject invoices without it. |
| **A** | 3 | Credit Check before Order Confirm | Prevents shipping to customers with overdue balances. |
| **A** | 4 | Renewal Automation (90/60/30/7d alerts + renewal quote) | Without it, subscriptions lapse silently. Revenue walks out the door. |
| **A** | 5 | Credit Notes (from returns / adjustments) | Financial document legally required when refunding or crediting. |
| **A** | 6 | Commission UI (view, approve, payout tracking) | Backend built. Sales reps have no visibility on their own earnings. |
| **B — Important** | 7 | Payment Reminders (auto at −7d, 0d, +7d, +30d) | Drives on-time payment without manual chasing. |
| **B** | 8 | Contract / E-Signature UI | Backend entity built. No way to manage contracts in the UI. |
| **B** | 9 | Negotiation Rounds UI | Backend built. Currently logged as deal notes — no structured history. |
| **B** | 10 | Account Health Score (Red / Yellow / Green) | CS team needs to know which accounts are at risk before they churn. |
| **B** | 11 | Three-Way Match (PO + GR + Invoice auto-check) | Prevents paying supplier invoices that don't match what was ordered and received. |
| **B** | 12 | Inventory UI Page (browse stock levels, adjust, view movements) | API fully built. Just needs a frontend page. |
| **B** | 13 | Contact Roles on Deals (Champion, Economic Buyer, Technical Buyer) | Multi-stakeholder B2B selling. Missing this means deals are managed as single-contact. |
| **B** | 14 | Order Acknowledgment Email (auto on confirm) | Standard B2B practice. Customer expects written confirmation. |
| **C — Nice to have** | 15 | Post-Ticket CSAT Survey (auto-triggered on close) | NPS exists at account level. CSAT per-ticket is different and more actionable. |
| **C** | 16 | Pick / Pack Workflow | Warehouse management. High complexity; usually an ERP integration. |
| **C** | 17 | Returned Stock Disposition (restock / Grade B / write-off) | Returns approved but inventory impact not formal. |
| **C** | 18 | Profitability per Deal (revenue − COGS − time cost) | Needs COGS integration + time tracking roll-up. |
| **C** | 19 | Supplier Order Confirmation Tracking | Log vendor's PO acknowledgment against your PO. |
| **C** | 20 | Request for Quotation (RFQ to multiple vendors) | Optional for smaller businesses; important for procurement discipline. |
| **C** | 21 | Sales Territory Management | Auto-assign leads/accounts by geography or industry. |
| **C** | 22 | Pro-Forma Invoice | International trade requirement for import clearance. |
| **C** | 23 | Knowledge Base / Known Issue Library | Speeds support resolution. Reduces repeat escalations. |
| **C** | 24 | QBR Scheduling (structured quarterly business reviews) | Currently managed as meetings + notes. |
| **C** | 25 | Churn Analytics (cancel reasons aggregated + trended) | Cancel reason noted; no analytics. |
| **C** | 26 | Campaign Performance Analytics (open rate, CTR, cost per lead) | Campaign list exists; no performance dashboard. |
| **C** | 27 | Proof of Delivery Upload | Physical / digital delivery confirmation linked to the delivery record. |
| **C** | 28 | Lead Scoring Engine (auto, behavior-based) | Score field exists; auto-scoring rules not built. |
| **C** | 29 | Product Price Books (multi-tier: standard / VIP / distributor) | One price per product. Quote price entered manually. |
| **C** | 30 | Internal Handover Note (sales → CS at deal close) | Structured handover record. Currently done as free-text notes. |
