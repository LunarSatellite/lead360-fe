# OmniFlow CRM — Real-World End-to-End Test Flow

> **How to read this document:**
> Written from how CRM actually works globally (Salesforce, HubSpot, Zoho, Dynamics patterns).
> Status of each step in OmniFlow shown inline. Build gaps listed at the end with full specs.
>
> **Status Icons:**
> - ✅ Built + UI page — test in browser at `http://localhost:5173`
> - 🔧 Built + API only — no UI page yet, use Swagger / Postman
> - ⏳ Partially built — backend entity exists, no FE page
> - ❌ Not built yet — full spec below each section so it can be built

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

## 0.1 Users, Roles & Permissions ✅ `/dashboard/team`

Real world: Every CRM deployment starts with defining who can see and do what. Two layers: the system role (Admin / Agent for platform access) and the CRM role (Owner / Manager / Sales Rep / Agent for data-level permissions per feature).

**Members tab:**
1. Invite team members with system roles: Admin, Agent
2. For each member, assign a CRM role from the dropdown (Owner, Admin, Manager, Agent — seeded on first startup)
3. Deactivate a user to revoke access

**Roles & Permissions tab:**
1. Select a system role → view the 23-feature × 6-permission matrix (View, View All, Create, Edit, Delete, Approve)
2. System roles (Owner, Admin, Manager, Agent) are read-only — permissions shown for reference
3. Click `New` → create a custom role: `Senior Rep`
   - Enable: Leads, Deals, Contacts, Accounts, Quotes, Proposals — View All + Edit
   - Disable: Vendors, POs, Settings, Team Management
   - Click `Save changes`
4. Delete the custom `Senior Rep` role → confirm dialog → removed

---

## 0.2 Sales Territories ✅ `/dashboard/crm/territories`

Real world: Large sales teams divide accounts geographically or by industry. Rules automatically route incoming leads to the right rep. Within each territory, leads are distributed round-robin across members.

**Create territories:**
1. Click `New territory` → Name: `South Asia`, Priority: `1`, Description: `Nepal, India, Sri Lanka`
2. Click `New territory` → Name: `Global Enterprise`, Priority: `2`, Description: `Companies with 500+ employees globally`
3. Click `New territory` → Name: `Catch-All`, Priority: `99` (no rules = matches everything)

**Add rules to South Asia:**
1. Expand `South Asia` → Rules → `Add rule`
   - Field: `Country`, Operator: `=`, Value: `Nepal` → Add
2. Add rule → AND — Field: `Country`, Operator: `=`, Value: `India` → change logic to OR → Add
3. Add rule → OR — Field: `Country`, Operator: `=`, Value: `Sri Lanka` → Add

**Add rules to Global Enterprise:**
1. Field: `Company Size`, Operator: `≥`, Value: `500` → Add

**Add members:**
1. Expand `South Asia` → Members → select your rep → Add
2. Add a second rep → both show in round-robin list
3. Remove one member → verify removed

**Toggle active:**
1. Toggle `Catch-All` off → grayed out
2. Toggle back on

**Delete:**
1. Delete `Global Enterprise` → confirm → removed from list

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

Real world: Products and services are defined centrally with multiple price tiers — Standard, VIP/Enterprise, Distributor, Promotional. When a sales rep builds a quote, they select the price book and prices populate automatically. A single product can have a different price per book.

**What to build:**
- **Backend entities:** `PriceBook` (TenantId, Name, Currency, IsDefault, IsActive), `PriceBookEntry` (PriceBookId, ProductId/ProductName, UnitPrice, MinQty)
- **API:** CRUD on `/api/v1/crm/price-books` and `/api/v1/crm/price-books/{id}/entries`
- **Quote integration:** Quote form → PriceBook dropdown → selecting it reloads line item unit prices from that book's entries
- **Frontend page:** `/dashboard/crm/price-books` — list + entry editor per book

**Test steps (once built):**
1. Create price book: `Standard` (default), Currency: USD
2. Add entries: `Espresso Machine Pro X1` → $2,500 | `Annual Maintenance Plan` → $1,200
3. Create price book: `Enterprise`
4. Add entries: `Espresso Machine Pro X1` → $2,200 | `Annual Maintenance Plan` → $1,000
5. Create price book: `Distributor`
6. Add entries: `Espresso Machine Pro X1` → $1,900
7. Open a new quote → PriceBook dropdown: select `Enterprise` → line items auto-populate at Enterprise pricing
8. Switch to `Standard` → prices update to Standard pricing
9. Mark `Standard` as default → verify it's pre-selected on new quotes
10. Deactivate `Distributor` → verify it disappears from quote dropdown

---

## 0.5 Tax Rules ❌

Real world: Tax rates vary by product type, customer location, and business registration status. B2B customers with a VAT registration number are exempt in many jurisdictions. Tax is auto-calculated on quotes and invoices based on the customer's account country and product type.

**What to build:**
- **Backend entities:** `TaxRule` (TenantId, Name, Jurisdiction (country/state), TaxType (VAT/SalesTax/GST/Custom), Rate decimal, AppliesToAll bool, ProductCategories[]), `TaxExemption` (AccountId, ExemptionType, VATNumber, ValidUntil)
- **API:** CRUD on `/api/v1/crm/tax-rules`
- **Quote/Invoice integration:** On line item add → look up tax rule matching customer account's country + product type → auto-apply tax line → total recalculated. If account has TaxExemption → tax = 0 + show exemption reference.
- **Frontend page:** `/dashboard/crm/tax-rules` (new page under Settings or CRM section)

**Test steps (once built):**
1. Create tax rule: `Nepal VAT`, Jurisdiction: Nepal, Type: VAT, Rate: 13%, Applies to all products
2. Create tax rule: `US Sales Tax`, Jurisdiction: US, Type: Sales Tax, Rate: 8.5%
3. Open quote for Acme Corp (account country: Nepal) → tax line auto-appears: VAT 13% = $3,471 → Total: $30,171
4. Set Acme Corp account → Tax Exempt: Yes, VAT Number: `PAN-700312345` → open quote → tax: $0, exemption reference shown
5. Open quote for a US customer → US Sales Tax 8.5% auto-applied

---

## 0.6 Payment Terms Library ❌

Real world: Named payment terms (Net 30, Net 60, 50% Upfront + Net 30) are defined once and applied to customers based on account tier or credit rating. When a new invoice is created, the account's default terms populate the due date automatically.

**What to build:**
- **Backend entity:** `PaymentTerm` (TenantId, Name, NetDays, DepositPercent, Description, IsDefault)
- **API:** CRUD on `/api/v1/crm/payment-terms`
- **Account integration:** Account → default PaymentTerm field. Invoice creation → auto-populate Due Date from account's PaymentTerm.
- **Frontend:** Dropdown in Account settings + Invoice form. Simple list page (can live in `/dashboard/settings` or `/dashboard/crm/payment-terms`)

**Test steps (once built):**
1. Create: `Net 30` — NetDays: 30 (mark as default)
2. Create: `Net 60` — NetDays: 60
3. Create: `50% Upfront + Net 30` — DepositPercent: 50, NetDays: 30
4. Create: `Immediate` — NetDays: 0
5. Set Acme Corp account → Payment Terms: Net 30
6. Create invoice for Acme Corp → Due Date auto-set to today + 30 days ✓
7. Change account terms to Net 60 → new invoice → Due Date: today + 60 days ✓

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

Real world: Reusable templates with variable placeholders for: quote delivery, invoice reminders, order acknowledgments, shipping confirmations, onboarding welcome, renewal reminders. When sending a document email, the rep selects a template and variables auto-fill from the record.

**What to build:**
- **Backend entity:** `EmailTemplate` (TenantId, Name, Category enum [Quote/Invoice/Order/Campaign/Onboarding/Support/Renewal/General], Subject, BodyHtml with `{{VariableName}}` placeholders, IsActive)
- **Variable resolution service:** `TemplateRenderer.Render(templateId, context)` — replaces `{{ContactFirstName}}`, `{{AccountName}}`, `{{QuoteNumber}}`, `{{DueDate}}`, `{{TotalAmount}}`, etc.
- **API:** CRUD on `/api/v1/crm/email-templates`
- **Integration points:** Quote Send → template picker. Invoice Send → template picker. Order confirm → template picker. All use category filter to show relevant templates only.
- **Frontend page:** `/dashboard/crm/email-templates` — list by category + rich-text editor with variable insert helpers

**Test steps (once built):**
1. Create template (Category: Quote):
   - Name: `Quote Ready — Standard`
   - Subject: `Your quote from OmniFlow — {{QuoteNumber}}`
   - Body: `Hi {{ContactFirstName}}, your quote for {{AccountName}} is ready. Total: {{TotalAmount}}. Valid until {{ValidUntil}}. [View Quote]`
2. Create template (Category: Invoice — Reminder):
   - Name: `Invoice Due in 7 Days`
   - Subject: `Reminder: Invoice {{InvoiceNumber}} due {{DueDate}}`
3. Open a quote → Send → template picker → select `Quote Ready — Standard` → preview shows variables resolved → Send ✓
4. Edit template subject → re-open quote send → updated subject appears ✓
5. Deactivate template → no longer appears in picker ✓

---

## 0.13 Contract Templates ⏳ → `/dashboard/crm/contracts`

Real world: Standard MSA, NDA, and SaaS subscription agreement templates that auto-populate with deal and customer details. The rep generates the contract in one click, reviews the pre-filled version, and sends it for signing.

**What to build (backend entity exists):**
- **Frontend page:** `/dashboard/crm/contracts` — list of contracts (status: Draft / Sent / Partially Signed / Fully Signed / Expired / Terminated)
- **Contract detail:** View generated text, signatories list, signature status per person, timeline
- **Deal page integration:** `Generate Contract` button → select template → preview with variables resolved → set signatories → Send
- **Signatory workflow (without external e-sign):** "Record Signature" action per signatory → date + name → once all signed → status: Fully Signed → deal gate unlocked

**Test steps (once built):**
1. `/dashboard/crm/contracts` → `New Template`
   - Name: `Standard Sales Agreement`, populate body with {{AccountName}}, {{DealValue}}, {{PaymentTerms}}, {{DeliveryDate}}
2. Open Acme Corp deal → `Generate Contract` → select `Standard Sales Agreement`
   - Preview: Acme Corp, $25,200, Net 45, delivery in 7 days — all auto-filled
3. Add signatories: Anita Sharma + Rajesh Rana
4. Send → status: Sent
5. Record Anita's signature → date: today → 1 of 2 signed
6. Record Rajesh's signature → status: Fully Signed
7. Deal `Contract Review` gate → unlocked ✓
8. Mark deal Won

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

Real world: After a campaign runs, marketing reviews open rate, click-through rate, bounce rate, conversions, and cost per lead. These metrics determine which campaigns to scale, which messaging to keep, and which channels underperform.

**What to build:**
- **Backend entities:** `CampaignMetricSnapshot` (CampaignId, ComputedAt, TotalSent, TotalDelivered, TotalOpened, UniqueOpens, TotalClicked, UniqueClicks, TotalBounced, TotalUnsubscribed, TotalConverted) OR compute live from `CampaignRecipient` rows
- **Conversion tracking:** `CampaignConversion` (CampaignId, ContactId/LeadId, ConvertedAt, ConversionType [LeadCreated/DealCreated/QuoteSent]) — mark via a "Converted from campaign" action on the lead/deal
- **Cost per lead:** `Campaign.Budget / TotalConverted` (require Budget field on Campaign entity)
- **API:** `GET /api/v1/crm/campaigns/{id}/metrics` — returns the snapshot
- **Frontend:** Campaign list → click campaign → Performance tab
  - Stat cards: Sent, Delivered %, Open Rate %, Click Rate %, Bounce Rate %, Unsubscribed, Conversions, Cost/Lead
  - Engagement chart: opens + clicks per day since send
  - Recipient table: per-contact status (Sent / Opened / Clicked / Bounced / Converted)

**Test steps (once built):**
1. Open a sent campaign → Performance tab
2. Verify stat cards: Sent: X, Delivered: Y, Open Rate: Z%
3. Open a lead that came from this campaign → `Mark as converted from campaign`
4. Return to campaign Performance tab → Conversions: 1, Cost/Lead: $Campaign.Budget
5. Click `Recipient table` → find the converted contact → shows Converted badge
6. Compare two campaigns → higher click rate campaign identified → scale it

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

Real world: Each action automatically adds points. Once a threshold is crossed, the lead is promoted to MQL (Marketing Qualified Lead) and auto-assigned to a sales rep.

- Email opened: +5
- Link clicked: +10
- Pricing page visited: +15
- Demo request submitted: +25
- Score ≥ 50: promoted to MQL → auto-assigned to sales rep

**What to build (backend entity exists, auto-scoring engine missing):**
- **Backend entities:** `LeadScoringRule` (TenantId, EventType enum [EmailOpened/LinkClicked/PageVisit/DemoRequest/FormSubmit/Meeting], Points, IsActive), `LeadScoreLog` (LeadId, EventType, Points, EventAt, Source)
- **LeadScoringService:** On each tracked event (email open, click, page view) → find matching rule → add points → recalculate total → check MQL threshold → if crossed: update lead status to MQL + auto-assign from rotation pool + notify manager
- **MQL threshold:** Configurable per tenant in CRM settings (default: 50)
- **API:** CRUD on `/api/v1/crm/scoring-rules`. `POST /api/v1/crm/leads/{id}/score-events` (manual event trigger for testing)
- **Frontend:** Lead detail → Score badge (prominent, color-coded: grey < 25, yellow 25–49, green ≥ 50 MQL) + Score History tab with event log. Lead list → sortable Score column + MQL filter.

**Test steps (once built):**
1. Create scoring rules: Email Opened +5, Link Clicked +10, Pricing Page Visit +15, Demo Request +25, MQL threshold: 50
2. Open Anita Sharma lead → Score: 0
3. Trigger: Email Opened → Score: 5 (grey)
4. Trigger: Pricing Page Visit → Score: 20
5. Trigger: Pricing Page Visit × 2 → Score: 50 → promoted to MQL (green badge)
6. Verify: lead auto-assigned from Sales Lead Pool → assigned rep gets notification
7. Score history tab → shows each event + points

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

Real world: A single **Convert** button simultaneously creates a Contact (from lead contact info), an Account/Company (from lead company info), and a Deal/Opportunity (pre-filled with lead data). The lead is marked Converted and kept for reporting — never deleted. This is the formal hand-off from Marketing to Sales and is a core feature in every major CRM.

**What to build:**
- **Backend:** `POST /api/v1/crm/leads/{id}/convert`
  - Request body: `{ CreateContact: bool, CreateAccount: bool, CreateDeal: bool, DealTitle: string, DealValue: decimal, PipelineId: guid }`
  - In a single DB transaction: create Contact (from lead fields) + Account (if not exists, from lead company) + Deal (linked to Contact + Account, pre-filled) → set `Lead.Status = Converted`, `Lead.ConvertedAt`, `Lead.ConvertedContactId`, `Lead.ConvertedAccountId`, `Lead.ConvertedDealId` → return the three new record IDs
  - Guard: already-converted lead returns 409 with links to existing records
- **Frontend:** Lead detail → `Convert Lead` button (only on Qualified leads) → modal
  - Three toggles: Create Contact ✓, Create Account ✓, Create Deal ✓
  - Pre-filled fields from lead: contact name/email/phone, company name/industry, deal title
  - Pipeline dropdown + initial deal value field
  - Click `Convert` → success toast with three links: "View Contact", "View Account", "View Deal"
  - Lead status badge → **Converted** (read-only, fields greyed out)
  - Lead detail shows: "Converted records" section with links to the 3 created records

**Test steps (once built):**
1. Open Anita Sharma lead (Qualified) → `Convert Lead` button
2. Verify pre-filled: Contact: Anita Sharma / anita.sharma@acmecorp.com, Company: Acme Corp / Manufacturing, Deal title: `Acme Corp — Opportunity`
3. Set deal value: $25,000, Pipeline: Enterprise Sales
4. Click Convert → success: 3 links shown
5. Open Contact → linked to Acme Corp account ✓
6. Open Account → Acme Corp created ✓
7. Open Deal → linked to Contact + Account + Lead ✓
8. Return to lead → status: Converted, links to 3 records visible ✓
9. Try converting again → error: "Already converted" ✓

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

Real world: When working a deal, you assign contacts with their specific role in that deal (Champion, Economic Buyer, Technical Buyer, Influencer, Blocker). This makes clear who to call for what, who needs to be persuaded, and who signs. Without this, deals are managed as single-contact, and multi-stakeholder B2B selling falls apart.

**What to build:**
- **Backend entity:** `DealContact` (DealId, ContactId, Role enum [Champion/EconomicBuyer/TechnicalBuyer/Influencer/Blocker/User/Other], Notes, AddedAt, AddedByUserId)
- **API:** `POST /api/v1/crm/deals/{id}/contacts` (body: ContactId + Role), `DELETE /api/v1/crm/deals/{id}/contacts/{dealContactId}`, `GET /api/v1/crm/deals/{id}/contacts`
- **Frontend:** Deal detail → `Contacts` section
  - Table: Avatar | Name | Role | Company | Remove
  - `Add contact` button → search/select from account's contacts + pick role
  - Role color-coded: Champion (green), Economic Buyer (blue), Blocker (red)
  - Primary contact still exists as a single field — deal contacts are additional stakeholders

**Test steps (once built):**
1. Open Acme Corp deal → Contacts section
2. `Add contact` → Anita Sharma → Role: Champion
3. Add → Rajesh Rana → Role: Economic Buyer
4. Add → Priya KC → Role: Technical Buyer
5. Verify: 3 contacts shown with role badges
6. Remove Priya KC → confirm → removed from list ✓
7. Deal list → hover a deal → see contact role summary ✓

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
2. Add strategy note: `All 3 stakeholders aligned. Anita champions, Rajesh signs off, Priya evaluates spec.`
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

Real world: Knowing which competitor appears in each deal allows management to track win/loss rates per competitor, coach reps on specific objections, and inform product positioning. Currently just a free-text custom field — no aggregation possible.

**What to build:**
- **Backend entities:** `Competitor` (TenantId, Name, Website, Notes — global list), `DealCompetitor` (DealId, CompetitorId, OurStrengths, TheirStrengths, Outcome enum [Pending/WonAgainst/LostTo/NoDecision])
- **API:** CRUD on `/api/v1/crm/competitors` (global list). `POST/DELETE /api/v1/crm/deals/{id}/competitors`
- **Analytics integration:** Win rate by competitor — `GET /api/v1/crm/analytics/competitors` → per-competitor: total deals, won, lost, win rate %
- **Frontend:** Deal detail → `Competitors` section. Global competitor library in settings. Analytics → Competitor Win Rate table.

**Test steps (once built):**
1. Settings → Competitors → Add: `DeLonghi` (website: delonghi.com), Add: `Nespresso`
2. Open Acme Corp deal → Competitors → Add `DeLonghi`
   - Our strengths: `Reliability, 2yr warranty, local support`
   - Their strengths: `Lower hardware price, brand recognition`
   - Outcome: Pending
3. Mark deal Won → update DealCompetitor outcome: Won Against DeLonghi
4. Create a test deal → add Nespresso competitor → mark deal Lost → outcome: Lost To Nespresso
5. Analytics → Competitor Win Rates: DeLonghi: 1W 0L (100%), Nespresso: 0W 1L (0%) ✓

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

Real world: Customer pushes back on price or terms. Sales rep records each round with date, their offer, the customer's counter, and the outcome. The final agreed terms flow directly into a revised quote — no re-entering data.

**What to build (backend entity exists):**
- **Frontend:** Deal detail → `Negotiation` tab
  - Timeline of rounds: Date | Our Offer | Terms | Customer Counter | Status (In Progress / Agreed / Rejected)
  - `Add Round` button → form: Our Price, Our Payment Terms, Other Concessions, Customer Response text, Status
  - On a round marked Agreed → `Use These Terms` button → opens a new quote draft pre-filled with the agreed price + terms
  - Round history is append-only (read-only once saved)

**Test steps (once built):**
1. Open Acme Corp deal → Negotiation tab → `Add Round 1`
   - Our offer: $26,700, Net 30
   - Customer counter: $24,000, Net 60, free installation requested
   - Status: In Progress
2. `Add Round 2`:
   - Our offer: $25,200, Net 45, installation included
   - Customer: Accepted
   - Status: Agreed
3. Click `Use These Terms` on Round 2 → new Quote draft opens: $25,200, Net 45, installation $0 ✓
4. Round 1 still visible in history, read-only ✓

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

Real world: The legally binding agreement. Generated from accepted quote terms, sent for e-signature to both parties. The deal is only marked Won after the contract is fully countersigned. Until then it remains at risk.

**What to build (backend entity exists — see also 0.13):**
- **Frontend page:** `/dashboard/crm/contracts` — full list of all contracts across all deals
- **Deal integration:** Deal page → `Generate Contract` button (visible at Negotiation stage onward)
  - Select template → preview with deal/account data resolved → confirm → contract created in Draft
  - Set signatories (from deal contacts) → `Send` → status: Sent for Signature
  - Per-signatory: `Record Signature` button → enter name + date → updates signed count
  - All signed → status: Fully Signed → deal `Contract Review` gate auto-satisfied
- **Contract detail:** contract text, signatory list with dates, status history, download PDF

**Test steps (once built):**
1. Acme Corp deal at `Negotiation` stage → `Generate Contract`
2. Select template: `Standard Sales Agreement`
3. Preview: `Acme Corp`, `$25,200`, `Net 45`, `delivery 7 days after PO` — all resolved ✓
4. Signatories: Anita Sharma + Rajesh Rana → Send → status: Sent for Signature
5. `Record Signature` → Anita Sharma, today → `1 of 2 signed`
6. `Record Signature` → Rajesh Rana, today → status: Fully Signed ✓
7. Deal → move to `Contract Review` → gate: Legal review complete (manual check) → advance
8. Mark deal Won

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

## 6.2 Commission Calculation ⏳ → `/dashboard/crm/commissions`

Real world: The moment a deal is marked Won, the commission is automatically calculated based on the rep's commission rate. If multiple reps contributed, the deal is split by contribution percentage. Commissions are pending until the manager approves them, then paid in the next payroll run.

**What to build (backend built — needs frontend):**
- **Frontend page:** `/dashboard/crm/commissions`
  - **Rep view** (own commissions only): table — Deal | Closed Date | Deal Value | Commission % | Amount | Status (Pending / Approved / Paid)
    - Summary bar: Earned This Period, Pending Approval, Paid to Date, Quota Attainment %
  - **Manager view** (all reps): per-rep summary table → drill into each rep's commission list
    - `Approve` / `Reject` action per commission (with note on reject)
    - `Record Payout` → enter Payment Date + Payroll Reference → status: Paid
  - Time Period filter (uses CRM Time Periods: Q3 2026, June 2026, etc.)
  - Split commissions: show each rep's contribution % + their share

**Test steps (once built):**
1. Open `/dashboard/crm/commissions` → Acme Corp deal shows: $25,500 × 5% = $1,275 (Pending)
2. Switch to Manager view → same commission visible under your name
3. Click `Approve` → status: Approved
4. Click `Record Payout` → Payment Date: today, Reference: PAYROLL-JUN-2026 → status: Paid ✓
5. Filter: Q3 2026 → only Q3 deals shown
6. Quota attainment: if Q3 quota = $30,000 → $25,500 / $30,000 = 85% ✓

---

## 6.3 Internal Handover Note ❌

Real world: Before handing the account to CS, the sales rep writes a structured note covering exactly what the customer was promised, who the key personalities are, any commitments made during negotiation, and red flags to watch. Without this, the CS rep walks in blind and early satisfaction drops.

**What to build:**
- **Backend entity:** `DealHandover` (DealId, WrittenByUserId, CustomerExpectations text, StakeholderSummary text, SpecialCommitments text, RedFlags text, HandedOverToUserId guid nullable, HandedOverAt datetime nullable, Status enum [Draft/Submitted])
- **API:** `POST /api/v1/crm/deals/{id}/handover`, `GET /api/v1/crm/deals/{id}/handover`
- **Frontend:** Deal detail → `Handover` tab (visible once deal is Won)
  - 4 text areas: "What the customer expects", "Stakeholder map + personalities", "Special commitments made", "Red flags / sensitivities"
  - `Assign to CS Rep` dropdown + `Submit Handover` button → CS rep receives in-app + email notification
  - CS rep sees incoming handovers as a task in their queue
  - Submitted handovers are read-only — new version required to amend

**Test steps (once built):**
1. Mark deal Won → Handover tab appears
2. Fill:
   - Expects: `7-day delivery + full installation on all 10 units. Rajesh expects a kickoff call.`
   - Stakeholders: `Anita (champion, tech-focused). Rajesh (CFO — only cares about cost). Priya (skeptical, watch her.)`
   - Commitments: `Free installation included. Agreed in Round 2. Do not charge.`
   - Red flags: `Rajesh was not fully convinced. Monitor CSAT closely first 30 days.`
3. Assign to CS Rep → Submit Handover → CS rep notified
4. Log in as CS rep → notification shows → open deal → Handover tab → all fields visible, read-only ✓

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

## 7.2 Customer PO Number on Order ❌

Real world: In B2B, the buying company issues their own Purchase Order number (e.g., `ACME-PO-2026-441`). Your sales order must reference their PO number. Finance will not invoice without it. The customer's AP team will reject the invoice if the PO number doesn't match their records.

**What to build:**
- **Backend:** Add `CustomerPONumber` (string, nullable, max 100) to SalesOrder entity + EF migration
- **Invoice propagation:** When invoice is generated from an order, auto-copy `CustomerPONumber` to invoice
- **Frontend:** Order form → `Customer PO #` field (labeled clearly). Invoice view/PDF → show Customer PO # prominently in header, next to invoice number. Optional soft warning when confirming an order without a Customer PO number.

**Test steps (once built):**
1. Edit Acme Corp order → enter Customer PO #: `ACME-PO-2026-441` → Save
2. Generate invoice from order → invoice shows: Customer PO: `ACME-PO-2026-441` ✓
3. Create new order → try to send invoice without Customer PO # → warning: `B2B customers typically require their PO number on invoices`
4. Enter PO # → warning clears ✓

---

## 7.3 Credit Check ❌

Real world: Before confirming a large order from a new or high-risk account, finance checks for overdue balances and available credit. Orders from accounts over their credit limit or with significant overdue are blocked until a manager overrides.

**What to build:**
- **Backend service:** `CreditCheckService.CheckAsync(accountId, orderValue)` → returns:
  - `OverdueBalance decimal`, `OverdueInvoiceCount int`, `CreditLimit decimal`, `UtilizedCredit decimal`, `AvailableCredit decimal`, `RiskLevel enum [Green/Amber/Red]`
  - Green: no overdue, within credit limit. Amber: has overdue but under credit limit. Red: over credit limit OR >$X overdue.
- **API:** `GET /api/v1/crm/accounts/{id}/credit-check`
- **Frontend:** Order detail → `Confirm` button → runs credit check first → shows result modal:
  - Green: "Account in good standing — proceed?" → Confirm
  - Amber: "Account has $X overdue. Proceed with caution? Add a note." → Override with note
  - Red: "Account over credit limit. Order blocked. Manager override required." → only Manager/Admin role can override + must enter note
- **Credit limit field:** Add to Account entity (CreditLimit decimal, nullable)

**Test steps (once built):**
1. Set Acme Corp credit limit: $50,000
2. Confirm Acme Corp order ($26,700) → Green check → "No overdue, $23,300 remaining credit" → Confirm ✓
3. Create an invoice for Acme Corp → mark Overdue manually
4. Try confirming a new order → Amber warning: "$X overdue" → override with note ✓
5. Set account credit limit: $5,000 → place order for $10,000 → Red block → only manager can override ✓

---

## 7.4 Order Acknowledgment Email ❌

Real world: After internal order confirmation, an acknowledgment email is automatically sent to the customer contact confirming order number, items, quantities, prices, and expected delivery date. Standard B2B practice — the customer expects this as proof the order is in the system.

**What to build:**
- **Backend:** On Order status change to Confirmed → publish `OrderConfirmedEvent` → handler renders acknowledgment email from template and sends via SMTP to order's primary contact email. Include: Order #, Customer PO #, line items table, total, expected delivery.
- **Manual resend:** `POST /api/v1/crm/orders/{id}/acknowledge` (resend button)
- **Frontend:** Order detail → `Resend Acknowledgment` button (visible once Confirmed). Order detail → Activity log shows "Acknowledgment email sent to anita.sharma@acmecorp.com at [datetime]"

**Test steps (once built):**
1. Confirm an order → check SMTP log (or console in dev) → acknowledgment email sent to Anita ✓
2. Email contains: Order #, ACME-PO-2026-441, line items, $26,700, expected delivery
3. Order activity log → `Acknowledgment sent to anita.sharma@acmecorp.com` ✓
4. Click `Resend Acknowledgment` → second email sent, log updated ✓

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

Real world: For significant purchases, procurement sends an RFQ to 2–3 pre-approved vendors and selects the best offer based on price, lead time, and supplier reliability rating. The winning response becomes the PO automatically.

**What to build:**
- **Backend entities:** `RFQ` (TenantId, RFQNumber, Status [Draft/Sent/Responses Received/Awarded/Cancelled], Deadline, LinkedOrderId nullable, LineItems[]), `RFQVendorInvitation` (RFQId, VendorId, SentAt, ResponseDeadline), `RFQVendorResponse` (RFQId, VendorId, QuotedUnitPrice, LeadTimeDays, ValidUntil, Notes, ReceivedAt)
- **API:** CRUD on `/api/v1/crm/rfqs`. `POST /api/v1/crm/rfqs/{id}/send` (sends to all invited vendors). `POST /api/v1/crm/rfqs/{id}/responses` (record a vendor response). `POST /api/v1/crm/rfqs/{id}/award/{vendorId}` (select winner → auto-creates PO from RFQ).
- **Frontend:** `/dashboard/crm/purchase-orders` → `Create RFQ` option before raising a PO. RFQ detail: vendor comparison table side-by-side (price, lead time, reliability score). `Award` button on winning row.

**Test steps (once built):**
1. `Create RFQ` → 12× Espresso Machine Pro X1, deadline: 3 days, invite: BrevaCo + Koyo
2. Send RFQ → status: Sent
3. Record BrevaCo response: $1,800/unit, 7 days lead time
4. Record Koyo response: $1,750/unit, 14 days lead time
5. Compare: BrevaCo slightly more expensive but 7 days faster → Award BrevaCo
6. PO auto-created: Vendor: BrevaCo, 12 units @ $1,800, total $21,600 ✓

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

Real world: The vendor sends back a written acknowledgment with their internal reference number and a confirmed delivery date. This confirmation is filed on the PO so procurement knows the order is in the vendor's system and has a committed date.

**What to build:**
- **Backend:** Add to PO entity: `SupplierReference` (string, nullable, max 100), `ConfirmedDeliveryDate` (date, nullable), `VendorConfirmedAt` (datetime, nullable)
- **API:** `POST /api/v1/crm/purchase-orders/{id}/confirm-vendor` (body: SupplierReference, ConfirmedDeliveryDate)
- **Frontend:** PO detail → `Record Vendor Confirmation` button (visible when status is Sent to Vendor). Fields: Vendor's Ref #, Confirmed Delivery Date. On save → PO shows confirmation badge + confirmed date.

**Test steps (once built):**
1. Open BrevaCo PO → `Record Vendor Confirmation`
   - Vendor Ref: `BRV-CONF-2026-7891`, Confirmed Delivery: today + 7 days
2. PO header → `Vendor confirmed ✓`, shows BRV-CONF-2026-7891, expected: [date] ✓
3. PO without confirmation → shows `Awaiting vendor confirmation` warning ✓

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

Real world: Received quantity is less than ordered, or items arrive visibly damaged. A formal discrepancy record is raised to the vendor for credit or replacement. The PO stays partially open until the shortfall is resolved.

**What to build:**
- **Backend entity:** `GRDiscrepancy` (GoodsReceiptId, LineItemId, ExpectedQty, ReceivedQty, DamageNotes, Status [Raised/Vendor Notified/Resolved/Written Off])
- **Auto-detect on GR confirm:** if received qty < expected qty for any line → auto-create discrepancy record
- **API:** `GET /api/v1/crm/goods-receipts/{id}/discrepancies`, `PUT /api/v1/crm/goods-receipts/discrepancies/{id}/resolve`
- **Frontend:** GR detail → Discrepancies section (auto-populated). Shows expected vs received diff. Note field + `Notify Vendor` button. Resolution: Vendor sent replacement (link to second GR) / Credit received / Written off.

**Test steps (once built):**
1. New GR for BrevaCo PO → enter Received: `11` (not 12)
2. Confirm Receipt → discrepancy auto-raised: Expected 12, Received 11 — Short delivery ✓
3. Enter note: `1 unit missing from shipment. Driver confirmed at delivery.`
4. Click `Notify Vendor` → BrevaCo receives email (or log entry in dev)
5. BrevaCo ships missing unit → create second GR → Received: 1 → Discrepancy resolved ✓
6. PO status → Fully Received ✓

---

## 9.6 Three-Way Match ❌

Real world: Before approving a supplier invoice for payment, finance reconciles three documents: the PO (what price was agreed), the GR (what quantity was actually received), and the supplier invoice (what the vendor is charging). All three must align. Any mismatch goes to a dispute queue.

**What to build:**
- **Backend service:** `ThreeWayMatchService.MatchAsync(supplierInvoiceId)` → loads SI, linked PO, linked GR → compares: SI.Amount vs (GR.ReceivedQty × PO.UnitCost), SI.Qty vs GR.ReceivedQty → returns: `MatchStatus [Matched/PriceVariance/QtyVariance/BothVariance]`, variance amounts
- **API:** `POST /api/v1/crm/supplier-invoices/{id}/match` → returns match result
- **Frontend:** Supplier Invoice detail → `Match Status` section with `Run Match` button
  - Matched: green banner "PO + GR + Invoice aligned ✓"
  - Variance: red banner "Invoice $400 over GR value" + breakdown table (PO row, GR row, Invoice row, Variance row)
  - Approve Payment button disabled until matched (or manager overrides with note)

**Test steps (once built):**
1. Open BrevaCo supplier invoice → Run Match → all aligned ($21,600 = 12 × $1,800 = GR 12 units) → Matched ✓
2. Create second supplier invoice with amount $22,000 → Run Match → Variance: $400 over GR value
3. Variance detail: PO: $1,800/unit, GR: 12 units, Expected: $21,600, Invoice: $22,000, Variance: +$400 ✓
4. Raise dispute → finance notified → vendor contacted to issue credit note
5. `Override Match` (manager role) → enter note → payment unlocked ✓

---

## 9.7 Supplier Invoice ✅ `/dashboard/crm/supplier-invoices`

Real world: Vendor sends invoice. Finance verifies it against the PO and GR (3-way match). If matched, scheduled for payment on due date.

1. New Supplier Invoice → Vendor: BrevaCo, link PO
   - Invoice Number: `BRV-2026-0441`, Amount: `21,600`, Due: 30 days
2. Approve → Record Payment on due date

---

## 9.8 Supplier Payment ❌

Real world: Finance processes payment on or before the due date. Remittance advice (a document showing which invoices are being paid) is sent to the vendor. Payment confirmation and transaction reference are recorded on the invoice for audit.

**What to build:**
- **Backend entity:** `SupplierPayment` (SupplierInvoiceId, Amount, PaymentMethod enum [BankTransfer/Cheque/Card/ACH], BankReference, PaidAt, RemittanceSentAt nullable, Notes)
- **API:** `POST /api/v1/crm/supplier-invoices/{id}/payment`. `POST /api/v1/crm/supplier-invoices/{id}/remittance` (trigger remittance email)
- **Frontend:** Supplier Invoice detail → `Record Payment` button (visible when Approved)
  - Fields: Amount, Payment Method, Bank Ref (e.g., TXN-BANK-20260628), Payment Date
  - `Send Remittance to Vendor` button → sends email to vendor contact with invoice # + amount + payment ref
  - Status → Paid ✓, payment details shown in header

**Test steps (once built):**
1. Open BrevaCo supplier invoice (Approved) → `Record Payment`
   - Amount: $21,600, Method: Bank Transfer, Ref: TXN-BANK-20260628, Date: today
2. Status → Paid ✓
3. Click `Send Remittance` → email queued to james@brevaco.com
4. Invoice detail → shows payment date, bank ref, remittance sent ✓
5. Linked PO → shows `Fully Paid` badge ✓

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

Real world: The system generates a pick list specifying exactly where in the warehouse each item is located. Staff pick the items, scan serial numbers, and record box count and weight before handing to the carrier.

**What to build:**
- **Backend entities:** `PickList` (OrderId, GeneratedAt, GeneratedByUserId, Status [Pending/InProgress/Picked/Packed]), `PickListItem` (PickListId, ProductId, ProductName, WarehouseLocation, QuantityToPick, QuantityPicked, SerialNumbers string[] JSON)
- **API:** `POST /api/v1/crm/orders/{id}/pick-list` (generate). `PUT /api/v1/crm/orders/{id}/pick-list/items/{itemId}` (update picked qty + serials). `POST /api/v1/crm/orders/{id}/pick-list/pack` (mark packed → generates packing slip).
- **Frontend:** Order detail → `Generate Pick List` button (visible when Confirmed). Pick list view: table per line — Location | Item | Qty to Pick | Qty Picked | Serial Numbers (comma entry). `Mark All Picked` → `Mark Packed` → packing slip summary → Order status: Ready to Ship.

**Test steps (once built):**
1. Confirm Acme Corp order → `Generate Pick List`
2. Pick List: `Espresso Machine Pro X1 × 10, Location: Bay 3 Shelf A`
3. Enter picked: 10, serial numbers: `BRV-2026-001001, BRV-2026-001002, ..., 001010`
4. `Mark All Picked` → `Mark Packed` → packing slip: 1 pallet, 10 units, serial range listed ✓
5. Order status → Ready to Ship ✓
6. Proceed to create delivery

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

Real world: On delivery, the recipient signs. The signature (physical scan, photo, or digital capture) is uploaded and linked to the delivery record. In many companies the POD is the legal trigger for invoicing — the invoice is not sent until signed POD is on file.

**What to build:**
- **Backend:** Add to Delivery entity: `PODSignedByName` (string), `PODSignedAt` (datetime), `PODDocumentUrl` (string — uploaded file URL or base64 reference), `PODConfirmedAt` (datetime)
- **API:** `POST /api/v1/crm/deliveries/{id}/pod` (multipart: file upload OR body: SignedByName + Date + DocumentUrl)
- **Frontend:** Delivery detail → `Record Proof of Delivery` section (visible when status is Out for Delivery or Delivered)
  - Fields: Signed By Name, Signed Date, Upload Document (image or PDF)
  - `Confirm Delivery via POD` → sets status to Delivered + records POD details
  - Optional: POD confirmation auto-triggers invoice creation (configurable per tenant)

**Test steps (once built):**
1. Advance DHL delivery to Out for Delivery → `Record POD` section appears
2. Enter: Signed By: Anita Sharma, Date: today → Upload a dummy PNG
3. Confirm → status: Delivered ✓, POD section shows signature name + document link
4. Settings → enable `Auto-create invoice on POD` → confirm another delivery → invoice draft auto-created ✓

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

Real world: For international trade and large B2B purchases, the customer often needs a pro-forma (draft invoice) before goods ship — for import clearance paperwork, to open a letter of credit, or for internal budget approval. It looks identical to the final invoice but is labelled "PRO-FORMA" and is not a payment request.

**What to build:**
- **Backend:** Add `IsProForma` (bool) flag to Invoice entity OR create a `ProFormaInvoice` entity linked to Order. Pro-forma uses same line items/pricing as final invoice but has a separate number series (e.g., `PF-2026-0001`).
- **API:** `POST /api/v1/crm/orders/{id}/proforma` → creates/returns pro-forma invoice. `POST /api/v1/crm/proforma/{id}/send`
- **Frontend:** Order detail → `Generate Pro-Forma` button (available before order is confirmed). Invoice list → Pro-Forma invoices shown with a distinct badge. Download/email PDF → header clearly reads "PRO-FORMA INVOICE — NOT A PAYMENT REQUEST"

**Test steps (once built):**
1. Pre-confirm order → `Generate Pro-Forma` → preview: labeled PRO-FORMA INVOICE, correct line items ✓
2. Send to Anita Sharma → she receives PDF for import clearance
3. Confirm order → create actual invoice → both documents visible in invoice list ✓
4. Pro-forma has status: Sent (separate from actual invoice) ✓

---

## 12.3 Payment Reminders ❌

Real world: Automated email sequence fired at key intervals around the due date. Drives on-time payment without manual chasing. Every reminder is logged so finance knows who received what and when.

**What to build:**
- **Backend:** `InvoiceReminderJob` (hosted service or scheduled job, runs daily):
  - Query: invoices with status Sent or Overdue + IsDeleted = false + no reminder sent at this interval
  - Intervals: Due − 7 days, Due day, Overdue + 7 days, Overdue + 30 days (escalate to collections team)
  - Send email from template per interval → log in `InvoiceReminderLog` (InvoiceId, SentAt, IntervalType, EmailAddress)
- **API:** `POST /api/v1/crm/invoices/{id}/remind` (manual immediate send)
- **Frontend:** Invoice detail → `Reminders` tab: timeline of all sent reminders with date + interval label. `Send Reminder Now` manual button (one-off). Overdue badge on invoice list + days overdue counter.

**Test steps (once built):**
1. Create invoice due in 7 days → run job manually → reminder sent: "Invoice due in 7 days" ✓
2. Reminders tab → shows: `7-day notice sent to anita@acmecorp.com at [datetime]` ✓
3. Advance date to due date → run job → "Invoice due today" reminder sent ✓
4. Advance past due + 7 days → run job → overdue reminder sent ✓
5. Click `Send Reminder Now` → immediate send, logged ✓

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

Real world: When a return is accepted, an overbilling is found, or a dispute is resolved in the customer's favour, a credit note (the financial inverse of an invoice) is issued. It reduces the customer's outstanding balance or triggers a refund. Legally required in most jurisdictions when reversing an invoiced amount.

**What to build:**
- **Backend entity:** `CreditNote` (TenantId, AccountId, OriginalInvoiceId nullable, Amount, Reason, Status [Draft/Issued/Applied/Refunded], ApplyMethod enum [AccountBalance/NextInvoice/CashRefund], IssuedAt, AppliedAt)
- **API:** `POST /api/v1/crm/invoices/{id}/credit-note` (linked to invoice). `POST /api/v1/crm/accounts/{id}/credit-note` (standalone account credit). `POST /api/v1/crm/credit-notes/{id}/apply`
- **Frontend:** Invoice detail → `Issue Credit Note` button (visible on Disputed, Voided, or Paid invoices). Fields: Amount (≤ invoice amount, pre-filled from returned items if linked to return), Reason, Apply To: Account Balance / Next Invoice / Cash Refund. Credit Note list in invoice section. Account detail → shows credit balance outstanding.

**Test steps (once built):**
1. Open disputed invoice → `Issue Credit Note`
   - Amount: $2,500 (one returned unit), Reason: `Defective unit returned, RMA approved`
   - Apply To: Account Balance
2. Credit Note issued ✓ — Account credit balance: $2,500
3. Create next invoice for Acme Corp → $2,500 auto-applied → net due: total − $2,500 ✓
4. Refund path: Issue Credit Note, Apply To: Cash Refund → finance records refund payment ✓

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

Real world: CS proactively manages every renewal starting 90 days before expiry. Letting a renewal reach expiry without engagement is the most avoidable source of revenue churn.

**What to build:**
- **Backend entities:** `RenewalTask` (SubscriptionId, DaysBeforeExpiry int, AssignedToUserId, Status [Pending/Contacted/QuoteSent/Won/Lost/Missed], Notes, DueAt), `RenewalLog` (RenewalTaskId, Action, Note, LoggedAt)
- **Renewal alert job:** runs daily → for each active subscription: if expiry is in 90, 60, 30, or 7 days and no renewal task for that interval exists → create task + notify assigned CS rep + (at 60 days) auto-generate renewal quote draft
- **Renewal quote:** Clone of original quote with updated start/end dates + optional price adjustment
- **API:** `GET /api/v1/crm/renewals` (all renewal tasks filtered by period/status). `POST /api/v1/crm/subscriptions/{id}/renew` (manually trigger renewal → extend subscription + create new period). `POST /api/v1/crm/renewals/{id}/win` / `/lose`
- **Frontend:** `/dashboard/crm/renewals` — Kanban: columns [90 Days, 60 Days, 30 Days, 7 Days, This Week, Expired]. Each card: account name, plan, MRR/ARR, health score badge. Actions: Log Call, Send Quote, Mark Won/Lost.

**Test steps (once built):**
1. Edit Acme Corp subscription expiry → set to today + 90 days → run renewal job
2. `/dashboard/crm/renewals` → subscription appears in "90 Days" column ✓
3. Click card → Log Call: `Anita confirmed renewal intent, wants same plan`
4. At 60 days: renewal quote auto-generated as Draft
5. Open quote → send → card moves to "Quote Sent" status
6. Mark Won → subscription auto-renewed: expiry extended + 1 year ✓
7. Mark another subscription Lost → cancellation reason required ✓

---

## 14.4 Churn Tracking ❌

Real world: When a customer cancels, the reason is mandatory and structured (not free text). Management reviews churn by reason category every quarter to identify product gaps, pricing issues, and competitive losses.

**What to build:**
- **Backend:** Add to Subscription entity: `CancelReason` (enum [Price/Product/Competitor/Economic/ServiceQuality/NoLongerNeeded/Other]), `CancelNote` (string, nullable). Add `ChurnLog` entity (SubscriptionId, CancelledAt, MRR decimal, ARR decimal, CancelReason, CancelNote, AccountId, PlanName).
- **ChurnAnalyticsService:** `GetChurnByPeriod(start, end)` → total cancellations, MRR churned, breakdown by reason %. `GetChurnTrend(months int)` → month-by-month churn rate.
- **Frontend:** Subscription cancel modal → mandatory CancelReason dropdown + optional CancelNote. Cancel button disabled until reason selected. Analytics page → Churn section: % monthly churn rate, ARR churned this period, bar chart by reason, trend line.

**Test steps (once built):**
1. Cancel a subscription → cancel button shows modal with CancelReason required
2. Select: `Price` → Note: `Switched to competitor — lower monthly rate`
3. Cancel another → `Product` → Note: `Missing bulk-import feature`
4. Analytics → Churn: 2 cancellations, MRR lost: $200, by reason: Price 50%, Product 50% ✓
5. Try cancelling without selecting reason → button stays disabled ✓

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
4. Escalate to L2: `Possible manufacturing defect — 3 units in same batch`

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

Real world: 24 hours after a support ticket is closed, an automated one-question survey is sent to the customer. The score feeds agent-level performance dashboards. A low score (< 3) triggers an immediate alert to the team lead so they can do a recovery call before the customer escalates or churns.

**What to build:**
- **Backend entities:** `CSATSurvey` (SupportCaseId, ContactId, Token uuid, SentAt, Score int 1-5 nullable, FeedbackText nullable, RespondedAt nullable), trigger: 24h delay after case Close event (use background job or event queue with delay)
- **Public endpoint:** `POST /api/v1/public/csat/{token}` → records Score + optional FeedbackText (no auth, token is single-use)
- **Alert:** if Score < 3 → notify case owner + team lead immediately
- **API:** `GET /api/v1/crm/support/csat` (paginated, filterable by agent/period/score)
- **Frontend:** Support case detail → CSAT section: `Pending / Responded — Score: ⭐⭐⭐⭐⭐`. Manual `Send CSAT Now` button (skip the 24h wait). Analytics → CSAT tab: avg score by agent, % response rate, score distribution, trend over 12 weeks.

**Test steps (once built):**
1. Close a support case → CSAT queued for 24h
2. Click `Send CSAT Now` → survey email sent to Anita Sharma
3. Open the public survey URL → submit score: 5 → recorded
4. Case detail → CSAT: ⭐⭐⭐⭐⭐ (5/5) ✓
5. Close another case → send survey → submit score: 2 → case owner gets alert notification ✓
6. Analytics → CSAT tab → avg: 3.5, responses: 2 of 2 (100%) ✓

---

## 15.5 Knowledge Base ❌

Real world: Recurring issues are documented with symptoms, root cause, resolution steps, and affected models. When the same issue comes in, the agent sees the known fix immediately. Reduces resolution time from hours to minutes and prevents the same question from being escalated twice.

**What to build:**
- **Backend entity:** `KBArticle` (TenantId, Title, Category text, SymptomKeywords string[], RootCause text, ResolutionSteps text, AffectedEquipmentModels string[], Status [Draft/Published], ViewCount int, CreatedByUserId, PublishedAt)
- **Auto-suggest:** when creating or updating a support case subject/description → `POST /api/v1/crm/knowledge-base/suggest?query=...` → returns top 3 matching articles by keyword overlap
- **API:** CRUD on `/api/v1/crm/knowledge-base`. Public search: `GET /api/v1/crm/knowledge-base/search?q=...`
- **Frontend page:** `/dashboard/crm/knowledge-base` — article list with search + category filter + status filter. Article editor: Title, Symptoms, Root Cause, Resolution Steps (rich text), Affected Models (tags). Publish → visible to agents. Support case create/edit → `Related Articles` panel on the right side, auto-populated by subject keywords.

**Test steps (once built):**
1. `/dashboard/crm/knowledge-base` → New Article
   - Title: `Espresso Machine — Pump Motor Failure`
   - Symptoms: `No espresso output, grinding noise, overheating, pump motor heat, no power`
   - Root Cause: `Condensation ingress via steam vent. Affects batch BRV-2026.`
   - Resolution: `1. Power off. 2. Remove side panel. 3. Replace pump motor assembly (Part #BRV-PM-01). 4. Replace PCB if water-damaged. 5. Test at 9 bar. 6. Issue customer advisory.`
   - Affected Models: `Espresso Pro X1`
   - Publish ✓
2. Create new support case → type: `pump noise and no output` → Related Articles panel → article auto-suggested ✓
3. Click article → full view opens in sidebar → agent applies resolution steps to case notes ✓
4. Article view count increments on each open ✓

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

Real world: When a customer chooses a refund instead of replacement, a credit note is issued for the value of the returned unit. It is applied to the customer's account balance or refunded to the original payment method. This closes the financial loop on the return — without it, the company has accepted a return but has no record of the offsetting liability.

**What to build:**
- **Backend:** On return resolved with `ResolutionType = Refund` → auto-create `CreditNote` (from 12.6 entity) linked to original invoice, amount = sum of returned line items × unit price. `CreditNote.ApplyMethod = CashRefund` by default (overridable).
- **Return resolution modal update:** add resolution type dropdown: Replacement (current) / Refund / Exchange / Repair and Return. On Refund → credit note auto-generated + shown in confirmation.
- **Frontend:** Return detail → after Resolve as Refund → Credit Note section shows the generated note number + amount. Link to Credit Note detail. Finance sees it in credit note list.

**Test steps (once built):**
1. Approve return → inspect → Resolve → Type: Refund
2. Credit Note auto-generated: $2,500 (1 unit × $2,500) ✓
3. Return detail → Credit Note: CN-2026-0001, $2,500, Pending application ✓
4. Finance → Credit Notes list → CN-2026-0001 appears ✓
5. Apply credit note → Acme Corp balance: −$2,500 (credit owed) ✓

---

## 16.5 Returned Stock Disposition ❌

Real world: After inspection, every returned item must be formally classified: Grade A (restockable, back to saleable inventory), Grade B (refurbishable, restock at lower price), or Write-Off (damaged beyond repair, inventory loss recorded). Without this workflow, returned goods sit in a grey zone — neither in saleable stock nor formally written off.

**What to build:**
- **Backend entity:** `StockDisposition` (ReturnId, InspectionId, DecisionByUserId, DispositionType enum [Restock/Refurbish/WriteOff], Grade enum [A/B/C nullable], Notes, DisposedAt, InventoryAdjusted bool)
- **Inventory integration:** On DispositionType = Restock (Grade A) → InventoryTransaction: type GoodsIn +qty. On WriteOff → InventoryTransaction: type WriteOff −qty + loss record.
- **API:** `POST /api/v1/crm/returns/{id}/disposition`
- **Frontend:** Return detail → after Record Inspection → `Disposition` step appears
  - DispositionType picker: Grade A — Restock | Grade B — Refurbish | Write Off
  - Notes field + `Confirm Disposition` button
  - Inventory change shown: `Inventory +1 (Grade A)` or `Write-off recorded — loss: $2,500`

**Test steps (once built):**
1. Approve return → inspect Passed → Disposition: Grade A Restock
2. Confirm → Inventory QuantityOnHand + 1 ✓
3. Verify: `GET /api/v1/inventory/<PRODUCT_ID>` → QuantityOnHand incremented ✓
4. Second return → inspect Failed → Disposition: Write Off
5. Inventory unchanged (item never restocked) + write-off loss record: $2,500 ✓
6. Analytics → Write-Offs this quarter: $2,500 ✓

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

Real world: CS schedules a formal quarterly review with customer leadership. The QBR reviews account health, product usage, satisfaction, and aligns on the roadmap. It is the primary vehicle for expansion conversations and renewal positioning. Without a structured QBR record, there is no audit trail of commitments made to customers.

**What to build:**
- **Backend entity:** `QBR` (AccountId, AssignedToUserId, Quarter string [e.g., "Q3 2026"], ScheduledDate, Status [Scheduled/Completed/Missed/Rescheduled], LinkedMeetingId nullable, AgendaItems string[], ActionItems[] [{Description, DueDate, AssignedTo}], CustomerSatisfactionRating int 1-5 nullable, AccountHealthUpdate enum [Green/Yellow/Red] nullable, CompletedAt)
- **API:** CRUD on `/api/v1/crm/accounts/{id}/qbrs`. `POST /api/v1/crm/qbrs/{id}/complete`
- **Frontend:** Account detail → `QBRs` tab: timeline of past QBRs + `Schedule QBR` button. QBR form: quarter, scheduled date, link meeting, agenda items. Post-QBR: fill action items with due dates + assignees, customer satisfaction 1–5, account health update. QBR list per account sortable by quarter.

**Test steps (once built):**
1. Open Acme Corp account → QBRs tab → `Schedule QBR`
   - Quarter: Q3 2026, Date: 45 days from now
   - Link Meeting: `30-Day Health Check Call`
   - Agenda: `Uptime review`, `Expansion discussion (Boardroom floor)`, `Q4 pricing preview`
2. Complete QBR:
   - Action items: `Schedule barista refresher training by Aug 1, assigned CS rep`
   - Customer Satisfaction: 5
   - Account Health: Green
3. QBR status: Completed ✓
4. Account health → updated to Green ✓
5. QBR history: Q3 2026 Completed → Q2 2026 Scheduled (simulate) ✓

---

## 17.3 Account Health Score ❌

Real world: CS teams cannot manually monitor every account. A computed health score (Green / Yellow / Red) surfaces accounts at risk before they churn, cancel, or escalate. Computed daily from multiple signals — not manually entered.

**What to build:**
- **Backend service:** `AccountHealthService.ComputeAsync(accountId)` — calculates score 0–100 from:
  - Open overdue invoices: −20 per invoice (max −40)
  - Open unresolved support tickets priority High/Urgent: −10 per ticket (max −30)
  - Days since last purchase: −5 per 30 days inactive (max −30)
  - Subscription renewal < 30 days: −15
  - Most recent NPS: Promoter (9-10) +15, Passive (7-8) +5, Detractor (0-6) −15
  - CSAT avg last 3 tickets: ≥ 4.5 +10, < 3 −10
  - Result: ≥ 70 → Green, 40–69 → Yellow, < 40 → Red
- **Background job:** runs daily → computes score for all active accounts → stores in `AccountHealthSnapshot` (AccountId, Score int, Band enum, ComputedAt, Factors JSON)
- **API:** `GET /api/v1/crm/accounts/{id}/health` (latest snapshot + factor breakdown). `GET /api/v1/crm/analytics/health-summary` (count per band, list of Red accounts)
- **Frontend:** Account detail header → health score badge (Green / Yellow / Red) with score number. Hover → factor breakdown tooltip showing each contributor. Analytics → CS Health Dashboard: Red accounts list (needs action), trend chart (% Red accounts over 12 weeks), at-risk MRR.

**Test steps (once built):**
1. Acme Corp: no overdue invoices, NPS 9 (Promoter), CSAT 5 → compute → score ≥ 70 → Green ✓
2. Create overdue invoice for Acme Corp → recompute → score drops −20 → may turn Yellow
3. Add a Detractor NPS (score 3) → recompute → further drop → Red band triggered
4. Analytics → CS Health → Acme Corp in Red accounts list ✓
5. CS takes action → resolves invoice → NPS improves → recompute → returns to Yellow/Green ✓

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

## 19.7 Commission Reporting ⏳ → `/dashboard/crm/commissions`

Real world: Finance and sales managers review per-period: commission earned per rep, commissions pending approval, commissions paid vs owed, and quota attainment % per rep. Reps need visibility into their own earnings — right now there is no UI despite the backend being built.

**What to build (backend built — needs frontend):**
- **Frontend page:** `/dashboard/crm/commissions`
  - **Rep view** (own commissions): table — Deal | Closed Date | Deal Value | Commission % | Amount | Status (Pending / Approved / Paid). Summary bar: Earned This Period, Pending Approval, Paid to Date, Quota Attainment %.
  - **Manager view** (all reps, Admin/Manager role only): per-rep summary → drill-down. `Approve` / `Reject` (with rejection note) per commission line. `Record Payout` button: enter Payment Date + Payroll Reference → status: Paid.
  - Time Period filter (uses CRM Time Periods). Split deal commissions: show each rep's % share.

**Test steps (once built):**
1. `/dashboard/crm/commissions` → see Acme Corp deal: $25,500 × 5% = $1,275 — Pending
2. Switch to Manager view → same commission visible
3. Approve → status: Approved ✓
4. `Record Payout` → Date: today, Ref: PAYROLL-JUN-2026 → status: Paid ✓
5. Filter: Q3 2026 → only Q3 deals shown ✓
6. Quota attainment: Q3 quota $30,000, Won $25,500 → 85% ✓

---

## 19.8 Profitability per Deal ❌

Real world: Gross margin = Revenue − COGS. Net margin = Gross − time cost. Management uses this to identify which deal types, verticals, and rep strategies are most profitable, and to price future deals correctly.

**What to build:**
- **Backend service:** `DealProfitabilityService.ComputeAsync(dealId)` → returns:
  - `Revenue`: sum of Paid invoices linked to the deal
  - `COGS`: sum of GR line item costs for goods linked to this deal's order(s) (PO unit cost × received qty)
  - `DirectCosts`: sum of supplier invoices linked to delivery of this deal (if any additional costs)
  - `TimeCost`: sum of billable TimeEntry hours linked to deal × blended hourly rate (configurable in tenant settings)
  - `GrossMargin`: Revenue − COGS, `GrossMarginPct`
  - `NetMargin`: Revenue − COGS − TimeCost, `NetMarginPct`
- **API:** `GET /api/v1/crm/deals/{id}/profitability`
- **Frontend:** Deal detail → `Profitability` tab (visible on Won deals with at least one paid invoice)
  - Revenue, COGS, Time Cost rows → Gross Margin + Net Margin totals
  - Margin % gauge (colour-coded: green > 30%, yellow 15–30%, red < 15%)
  - Analytics → `Profitability` section: deals ranked by margin %, average margin by pipeline/rep/vertical

**Test steps (once built):**
1. Open Acme Corp deal → Profitability tab
   - Revenue: $26,700 (paid invoice)
   - COGS: $18,000 (12 units × $1,800 from GR, 10 allocated to this order)
   - Time cost: 12.5h × $50 blended rate = $625
   - Gross margin: $8,700 (32.6%) → green gauge ✓
   - Net margin: $8,075 (30.2%) → green gauge ✓
2. Analytics → Profitability → Acme Corp listed, 30.2% net margin ✓
3. Create a low-margin test deal (Revenue $10k, COGS $9k) → red gauge ✓

---

---

# Full Lifecycle at a Glance

```
[FOUNDATION]
  Users + CRM Roles + Permissions ✓   ← 0.1 Roles tab
  Sales Territories + Round-Robin ✓   ← 0.2 now built
  Pipelines + Gates ✓
  Approval Matrix ✓
  Custom Fields ✓
  SLA Tiers ✓
  Rotation Pools ✓
  Vendor Registry ✓
  Time Periods ✓
  Announcements ✓
  Price Books                          ← ❌ 0.4
  Tax Rules                            ← ❌ 0.5
  Payment Terms                        ← ❌ 0.6
  Email Templates                      ← ❌ 0.12
  Contract Templates                   ← ⏳ 0.13

[MARKETING]
  Ad Campaigns (Meta) ✓
  Email Campaigns ✓
  Website Event Tracking ✓
  Campaign Performance Analytics       ← ❌ 1.4

[QUALIFY]
  Lead: captured → scored → assigned ✓ (scoring engine partial)
  Lead scoring auto-rules              ← ⏳ 2.2
  Nurture sequences ✓
  Discovery call → BANT qualified ✓
  Convert → Contact + Account + Deal   ← ❌ 2.6

[ACCOUNT & CONTACT]
  Organization → Account (hierarchy) → Contacts ✓
  Deduplication ✓
  Contact roles on deal                ← ❌ 3.4

[DEAL]
  Pipeline → stage gates enforced ✓
  Competitor tracking                  ← ❌ 4.5
  Meetings + activities logged ✓
  Forecasting (probability-weighted) ✓

[PRE-SALES]
  Quote → internal approval → sent ✓
  Negotiation rounds UI                ← ⏳ 5.2
  Proposal (AI-generated) → sent ✓
  Contract → e-signature UI            ← ⏳ 5.4

[CLOSE]
  Deal Won → win reason → approval ✓
  Commission UI                        ← ⏳ 6.2
  Internal handover note               ← ❌ 6.3

[ORDER]
  Sales order created ✓
  Customer PO number field             ← ❌ 7.2
  Credit check                         ← ❌ 7.3
  Order acknowledgment email           ← ❌ 7.4

[INVENTORY CHECK]
  Stock check API ✓ (API only)

[PROCURE]
  RFQ to vendors                       ← ❌ 9.1
  PO raised → approved → sent ✓
  Vendor confirmation                  ← ❌ 9.3
  GR confirmed → inventory +12 ✓
  GR discrepancy tracking              ← ❌ 9.5
  3-way match (PO + GR + Invoice)      ← ❌ 9.6
  Supplier invoice recorded ✓
  Supplier payment + remittance        ← ❌ 9.8

[FULFILL]
  Order confirmed → reserved ✓
  Pick / Pack workflow                 ← ❌ 11.1
  Delivery created → DHL ✓
  Shipped → In Transit → Delivered ✓
  Proof of delivery                    ← ❌ 11.3
  Inventory released ✓

[INVOICE & PAYMENT]
  Pro-forma invoice                    ← ❌ 12.2
  Tax invoice sent ✓
  Payment reminders (auto)             ← ❌ 12.3
  Payment recorded → Paid ✓
  Credit note                          ← ❌ 12.6

[ONBOARDING]
  Equipment registered ✓  (must be BEFORE subscription)
  Installation work order → Complete ✓
  Onboarding milestones → 100% ✓
  Subscription: Maintenance → Active ✓

[RENEWALS]
  Renewal pipeline + alerts            ← ❌ 14.3
  Churn analytics (cancel reason)      ← ❌ 14.4

[SUPPORT]
  Support ticket → SLA timer ✓
  Escalation L1 → L2 ✓
  Repair work order → Complete ✓
  Post-close CSAT survey               ← ❌ 15.4
  Knowledge base                       ← ❌ 15.5

[RETURNS]
  RMA raised → approved → inspected ✓
  Replacement shipped ✓
  Credit note for refund               ← ❌ 16.4
  Stock disposition                    ← ❌ 16.5

[UPSELL]
  Expansion deal (existing account) ✓
  QBR scheduling + records             ← ❌ 17.2
  Account health score                 ← ❌ 17.3

[ANALYTICS]
  Sales analytics + win/loss ✓
  Ops dashboard ✓
  NPS ✓
  Inventory history (API) ✓
  Campaign performance                 ← ❌ 1.4
  Commission reports UI                ← ⏳ 19.7
  Profitability per deal               ← ❌ 19.8
```

---

---

# Build Gap Summary

> Full specs for each item are in the relevant section above. This table is for priority triage only.

| Priority | # | Feature | Section | Notes |
|---|---|---|---|---|
| **A — Blocks real use** | 1 | Lead Conversion (single-click → Contact + Account + Deal) | 2.6 | Core CRM pattern. Currently 3 manual steps with no formal link. |
| **A** | 2 | Customer PO Number on Order | 7.2 | B2B invoicing requirement. Customers' AP teams reject invoices without it. |
| **A** | 3 | Credit Check before Order Confirm | 7.3 | Prevents shipping to customers with overdue balances or over credit limit. |
| **A** | 4 | Renewal Pipeline + Auto-Alerts (90/60/30/7d) | 14.3 | Without it, subscriptions lapse silently. Revenue walks out the door. |
| **A** | 5 | Credit Notes (from returns / adjustments / disputes) | 12.6, 16.4 | Financial document legally required when reversing an invoiced amount. |
| **A** | 6 | Commission UI (view, approve, payout tracking) | 6.2, 19.7 | Backend built. Reps have zero visibility on their own earnings. |
| **B — Important** | 7 | Contract / E-Signature UI | 5.4, 0.13 | Backend entity built. No way to manage contracts in the UI. |
| **B** | 8 | Negotiation Rounds UI | 5.2 | Backend built. Currently logged as free-text deal notes. |
| **B** | 9 | Account Health Score (Green / Yellow / Red) | 17.3 | CS team has no early-warning system for at-risk accounts. |
| **B** | 10 | Payment Reminders (auto at −7d, 0d, +7d, +30d) | 12.3 | Drives on-time payment without manual chasing. |
| **B** | 11 | Three-Way Match (PO + GR + Invoice auto-check) | 9.6 | Prevents overpaying suppliers for goods not ordered or not received. |
| **B** | 12 | Contact Roles on Deals (Champion, Economic Buyer, etc.) | 3.4 | Multi-stakeholder B2B selling. Missing this = deals managed as single-contact. |
| **B** | 13 | Order Acknowledgment Email (auto on confirm) | 7.4 | Standard B2B practice. Customer expects written confirmation. |
| **B** | 14 | Churn Tracking (cancel reason + analytics) | 14.4 | Cancel reason exists but no structured analytics to act on. |
| **C — Nice to have** | 15 | Campaign Performance Analytics (open rate, CTR, cost/lead) | 1.4 | Campaign list exists; no performance dashboard. |
| **C** | 16 | Competitor Tracking (structured + win-rate analytics) | 4.5 | Currently a free-text custom field. No aggregation possible. |
| **C** | 17 | Lead Scoring Engine (auto, behavior-based) | 2.2 | Score field exists; auto-scoring rules + MQL promotion not built. |
| **C** | 18 | Post-Ticket CSAT Survey (auto-triggered on close) | 15.4 | NPS exists at account level. Per-ticket CSAT is different and more actionable. |
| **C** | 19 | Knowledge Base / Known Issue Library | 15.5 | Reduces repeat escalations. High-impact for support quality. |
| **C** | 20 | Proof of Delivery Upload | 11.3 | Delivery confirmed by status update only; no signed POD on file. |
| **C** | 21 | Pick / Pack Workflow | 11.1 | Warehouse management. Medium complexity. |
| **C** | 22 | Returned Stock Disposition (restock / write-off) | 16.5 | Returns approved but formal inventory impact missing. |
| **C** | 23 | QBR Scheduling (structured quarterly business reviews) | 17.2 | Currently managed as meetings + notes. No audit trail of commitments. |
| **C** | 24 | Profitability per Deal (revenue − COGS − time cost) | 19.8 | Needs COGS linkage from GR + time tracking roll-up. |
| **C** | 25 | Supplier Order Confirmation Tracking | 9.3 | Log vendor's acknowledgment + confirmed delivery date on the PO. |
| **C** | 26 | GR Discrepancy Workflow | 9.5 | Short deliveries currently noted manually in GR. |
| **C** | 27 | Supplier Payment + Remittance | 9.8 | Record Payment updates status; no payment details or remittance email. |
| **C** | 28 | Request for Quotation (RFQ to multiple vendors) | 9.1 | Optional for smaller businesses; important for procurement discipline. |
| **C** | 29 | Pro-Forma Invoice | 12.2 | International trade and import clearance requirement. |
| **C** | 30 | Email Templates Library | 0.12 | Emails sent ad-hoc; no reusable templates with variable resolution. |
| **C** | 31 | Product Price Books (multi-tier: standard / VIP / distributor) | 0.4 | One price per product. Quote price entered manually. |
| **C** | 32 | Tax Rules (auto-calculated, B2B exemption) | 0.5 | Tax entered manually on each quote and invoice. |
| **C** | 33 | Payment Terms Library | 0.6 | Payment terms entered as free text; no auto-due-date from account terms. |
| **C** | 34 | Internal Handover Note (sales → CS at deal close) | 6.3 | CS walks in blind without structured handover. |
