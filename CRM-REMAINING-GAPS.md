# OmniFlow CRM — Gaps by Priority

> Verified by auditing actual backend (entities/services/controllers) and frontend (routes/pages/mutations) code — not by trusting status icons in `CRM-FULL-TEST-FLOW.md`, which is stale and mislabels most features. Ordered by business impact, not by doc section. `CRM-FULL-TEST-FLOW.md` section numbers are kept in parentheses for traceability.

---

## Tier A — Blocks real use, or creates legal/financial risk

| Feature | Status | Why it's Tier A |
|---|---|---|
| **Custom Reports & Dashboards** (20.1) | Fully built backend (`CrmReportController`/`CrmDashboardController` — filters, grouping, charts, scheduling), **zero frontend** | Every new view a manager wants requires a developer. This is the #1 daily-use feature in any real CRM deployment |
| **Mobile Access** (20.10) | Not built | Field sales reps and field technicians — a role this platform explicitly serves (work orders, installations, repairs) — have no way to check a deal or log a call away from a desk |
| **GDPR data requests** | Backend built (`CrmAdminControllers`), **zero UI** | No way to action a right-to-be-forgotten or data-export request. Real legal exposure for any business serving EU customers |
| **SSO (SAML/OAuth)** | Backend built (`CrmAdminControllers`), **zero UI** | Enterprise buyers routinely require SSO before they'll adopt any SaaS tool — this can silently kill enterprise deals with no obvious symptom until procurement asks for it |

---

## Tier B — Operational friction (daily usability, not blocking)

| Feature | Status | Why it matters |
|---|---|---|
| **Email Templates** (0.12) | Not built | Every quote/invoice/order email written from scratch — slower reps, inconsistent customer communication |
| **Knowledge Base** (15.5) | Backend built (`CrmKbArticle`/`CrmKbDraft`), zero UI | Support agents re-diagnose the same recurring issues instead of reusing a known fix |
| **CSAT Surveys** (15.4) | Backend built (`CrmCsatRecord`), zero UI | No structured feedback loop on individual support interactions |
| **Bulk Actions** (20.9) | Partial — only Deals, only delete | Managing 100 leads means 100 individual clicks; no bulk-assign or bulk-stage-change anywhere |
| **Profitability per Deal** (19.8) | Not built | No margin visibility — pricing and deal-approval decisions made blind to actual cost |
| **Account Health Score** (17.3) | Not built as spec'd (churn-risk prediction exists but isn't the same thing) | CS has no simple at-a-glance risk indicator per account |
| **RFQ to vendors** (9.1) | Not built | No formal way to compare multiple supplier quotes before purchasing — procurement discipline gap |
| **GR Discrepancy workflow** (9.5) | Not built | Short/damaged deliveries aren't auto-flagged against the PO — handled manually, easy to miss |
| **Approve/Reject via Email** (20.8) | Not built for CRM approvals (exists only for AI-agent runs) | Managers must log in for every quote/deal/PO approval, even a simple yes/no |
| **Webhooks (outbound)** | Backend built, zero UI | No way to connect OmniFlow to other systems (Zapier-style) without a developer |
| **Web Forms builder** | Backend built, zero UI | No native lead-capture form for the website — marketing depends on a workaround |
| **Pipeline Forecasting AI** (verified 2026-07-09) | Backend built (`CrmForecastController`/`CrmForecastService` — Monte Carlo pipeline forecast, per-deal AI win-probability, at-risk-deal scan), **zero frontend**. The "Weighted Forecast" card on the Analytics page is a separate, simpler calc — not this service | The weekly forecast/quota conversation runs blind to a system that already computes deal-level AI probability and flags at-risk deals |
| **Call Summary Transcript Source** (verified 2026-07-09) | The Call Summary feature itself works — LLM structured extraction (themes, decisions, objections, competitor mentions, sentiment arc) + full UI on the Meetings page — but it ingests `signal.Summary` text as a "transcript proxy" (explicit TODO in code); no real call-recording/audio-transcription pipeline feeds it | The AI analysis has nothing real to analyze until a recording/transcription source is wired in — summaries are only as good as manually-typed notes |

---

## Tier C — Scale & compliance (matters as the business grows or enters regulated industries)

| Feature | Status | Why it matters |
|---|---|---|
| **Multi-Currency** (20.6) | Backend built (`CrmMultiCurrencyController`), zero UI | Blocks accurate consolidated reporting the moment you sell internationally |
| **Field-Level Audit Trail** (20.7) | Backend built (`CrmFieldAuditService`), zero UI | No "who changed this deal's value and when" — blocks regulated industries (SOX/HIPAA-style) and makes disputes guesswork |
| **Individual Email Sync** (20.2) | Backend built (`CrmEmailSyncWorker`), zero UI | Reps' 1:1 emails never land in the CRM automatically — the single most-used daily feature in Salesforce/HubSpot |
| **Custom Objects / Formula Fields / Validation Rules / Rollup Summaries** | All backend built, zero UI | Salesforce-Platform-style extensibility — only bites once a customer needs to model something outside the built-in entities |
| **Supplier Order Confirmation tracking** (9.3) | Not built | No vendor acknowledgment or confirmed-delivery-date on file |
| **Pro-Forma Invoice** (12.2) | Not built | Blocks international trade (import clearance paperwork) and large B2B deals needing pre-shipment docs |
| **Negotiation Rounds UI** (5.2) | Backend built, no deal-detail tab | Still logged as free-text notes instead of structured rounds |
| **Stock Disposition** (16.5) | Partial — free-text field only | No structured Restock/Refurbish/Write-off classification or inventory adjustment on returns |
| **Login History / Login Policy** | Backend built, zero UI | Basic security hygiene missing from the admin surface |
| **RBAC Anomaly Detection** | Backend built, zero UI | Would flag suspicious permission usage — currently invisible |
| **CPQ Configuration & Pricing Rules** (verified 2026-07-09) | Product Bundles are fully built + UI'd (`ProductBundlesPage`); but `CrmPricingRuleService`/`CrmProductConfigOptionService`/`CrmQuoteBundleService` (dynamic pricing rules, configurable product options, quote-level bundles) are backend built, zero UI | Static bundles work but guided-selling/configure-price logic needs a developer to touch data directly |
| **No-Code AI Action Builder** (verified 2026-07-09) | 30 AI action kinds are hardcoded in the `CrmAiActionKind` enum with a full approve/reject/undo UI already built, but there's no way to define a new action type without shipping code (unlike Zoho's Zia Agent Studio) | Every new automation idea requires an engineering sprint instead of an admin configuring it |
| **Territory Rebalancing AI Analysis** (verified 2026-07-09) | Basic territory CRUD/rules/members is fully built + UI'd (`CrmTerritoriesPage`); but the separate AI-driven rebalancing engine (`CrmTerritoryController` — run/apply analysis) is backend-only, zero UI | Territory assignment stays manual even though the system already has code to suggest rebalancing |

---

## Tier D — Missing vs. the market entirely (no code anywhere, not even a stub)

| Feature | What it is | Why it matters |
|---|---|---|
| **Partner/Reseller Portal (PRM)** | External portal for channel partners to register deals and track their pipeline | Hard blocker the moment you sell through resellers/distributors |
| **Sales Cadences / Sequences** | Structured multi-step touch sequence a *rep* runs on a prospect (call → email → LinkedIn) — distinct from marketing Nurture Sequences | Standard in Salesloft/Outreach and now native in HubSpot/Salesforce; reps here rely on memory/discipline instead |
| **Data Enrichment** | Auto-fill company info from an email domain (Clearbit/ZoomInfo-style) | Manual data-entry burden on every new lead/contact |
| **Sales Gamification** | Leaderboards, points, badges | Common adoption/motivation driver in HubSpot/Zoho, absent here |
| **Saved Custom List Views** | Per-user saved filter/sort/column configs | Each list page likely has ad-hoc, non-reusable filter state |
| **Browser extension** | Log emails/calls from inside Gmail/Outlook without switching tabs | Compounds the Email Sync gap above |
| **Sandbox / tenant cloning** | Safe copy of a tenant to test automation changes before going live | No evidence of this pattern anywhere |
| **Autonomous AI SDR / Outbound Agents** (verified 2026-07-09, confirmed zero code anywhere) | An agent that prospects, qualifies leads, and books meetings without human intervention | Now a standard 2025-2026 differentiator shipped by Salesforce Agentforce / HubSpot Breeze / Zoho Zia — reps here do 100% of prospecting manually |

---

## Tier E — Undocumented backend scaffolding (unclear if planned or abandoned)

~24 more backend modules exist with entities/services/controllers but **no frontend API-client wrapper at all** — genuinely unreachable, and never mentioned in `CRM-FULL-TEST-FLOW.md` either. Unlike Tiers A–D, I can't say these are "needed" with confidence — they may be intentional future roadmap or dead generated code:

Digital Assets · Audit Narration (AI-narrated audit summaries) · BI Query (natural-language BI) · Certifications · Cross-Sell recommendations · Customer Segments (AI-discovered) · Dashboard Narration · Documents · Dunning Campaigns (a *second*, likely more complete dunning system than the one in Tier A) · Email Integrations · Feedback · Handoff notes (distinct from the working Deal Handover) · Invoice Generation Rules · Loyalty program · Narrative Timeline · Projects · Referrals program · Service Contracts (distinct from Sales Contracts) · AI Policy governance · Training Programs · Warehouses · Warranties · Social Post scheduling · Account Briefs (AI "Living Account Brief")

**Orphaned:** Dispatch Calendar (API-client hook exists, zero pages call it).

**Recommendation:** ask the team which of these were intentional before building any UI for them — building a page for dead scaffolding wastes time Tier A–D doesn't have yet.

---

## Explicitly deferred by the original doc (unchanged, genuinely low priority)

Order-from-signed-Contract · line-level discounts · order revisions/amendments · auto-invoice-on-confirm · split shipments · per-line tax items.

---

## What's actually built and solid (don't re-build this)

Verified with real mutations/data, not just routes: Price Books, Tax Rules, Payment Terms, Contract Templates + e-signature (signatory recording), Lead Scoring auto-engine (Score badge, MQL auto-promotion at ≥50, Score History), Contact Roles on Deal, Competitor Tracking (+ win-rate analytics), Commission UI, Internal Handover Note, Customer PO# on Order, Credit Check (live on order Confirm), Order Acknowledgment Email (Send/Resend button), Supplier Payment, Pick List/Packing, Proof of Delivery (file upload), Campaign Performance analytics, Renewal Pipeline (outreach/outcome tracking), Churn Tracking (via `Churn30`/`Churn60` predictive risk), Online Payment Collection (`PublicPayPage.tsx` Pay Now flow), Customer Portal, **CSV Import (Deals, Leads, and Contacts — all three fully wired, `CsvToolbar` component reused across all three pages)**.

**Built this session** (2026-07-07): Credit Notes (new `CrmCreditNote` entity + service + controller, auto-issued from resolved Returns, apply/refund flow, `/dashboard/crm/credit-notes` page) · Three-Way Match (`ThreeWayMatchService` comparing Supplier Invoice vs. PO × received qty, "Run Match" button + variance banner on Supplier Invoices) · Payment Reminders/Dunning UI (Reminders section on invoice detail: history timeline, Pause/Resume, manual Send-Now — the backend job and 3 of 4 endpoints already existed, just had zero frontend).

## What OmniFlow has that Salesforce/HubSpot/Zoho don't ship natively

Native multi-channel chatbot engine (WhatsApp/Telegram/Messenger/SMS/Voice/WebChat/Email) driving CRM data directly — competitors need a bolted-on third party for this. AI-native churn prediction + auto-refreshing "Living Account Brief" narrative per account. An AI Actions panel with approve/reject/undo built into analytics. A visual flow builder wired into the same CRM data model. A deeper procurement chain (RFQ-adjacent PO → GR → Supplier Invoice) than HubSpot/Zoho ship out of the box — even though the Three-Way-Match step is still missing (Tier A).
