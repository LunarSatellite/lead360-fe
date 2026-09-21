# OmniFlow CRM — Gaps by Priority

> Verified by auditing actual backend (entities/services/controllers) and frontend (routes/pages/mutations) code — not by trusting status icons in `CRM-FULL-TEST-FLOW.md`, which is stale and mislabels most features. Ordered by business impact, not by doc section. `CRM-FULL-TEST-FLOW.md` section numbers are kept in parentheses for traceability.

---

## Tier A — Blocks real use, or creates legal/financial risk

| Feature | Status | Why it's Tier A |
|---|---|---|
| **Mobile Access** (20.10) | Partial — `DashboardLayout.tsx` has a responsive bottom tab bar + "More" sheet for small screens, but that's just a breakpoint treatment of the existing desktop routes. No PWA manifest, no offline/installable capability (confirmed: no `vite-plugin-pwa`/workbox config anywhere), no mobile-specific API surface | Field sales reps and field technicians — a role this platform explicitly serves (work orders, installations, repairs) — still have no real away-from-desk capability, just a squeezed desktop UI |
| **GDPR data requests** | Backend built (`CrmAdminControllers`), **zero UI** | No way to action a right-to-be-forgotten or data-export request. Real legal exposure for any business serving EU customers |
| **SSO (SAML/OAuth)** | Backend built (`CrmAdminControllers`), **zero UI** | Enterprise buyers routinely require SSO before they'll adopt any SaaS tool — this can silently kill enterprise deals with no obvious symptom until procurement asks for it |

---

## Tier B — Operational friction (daily usability, not blocking)

| Feature | Status | Why it matters |
|---|---|---|
| **Email Templates** (0.12) | Not built — re-verified 2026-07-09; the only "EmailTemplate" code is `OmniFlow.Service/Implementations/Identity/EmailTemplates.cs`, hardcoded system auth emails (password reset etc.), not a CRM entity/controller | Every quote/invoice/order email written from scratch — slower reps, inconsistent customer communication |
| **Profitability per Deal** (19.8) | Not built — re-verified 2026-07-09; `CostPrice`/margin fields exist only on `CatalogProduct` and PO/GR line items (feeding `ThreeWayMatchService`), nothing at the Deal level | No margin visibility — pricing and deal-approval decisions made blind to actual cost |
| **Account Health Score** (17.3) | Not built as spec'd — re-verified 2026-07-09; churn-risk prediction (`CrmPredictionService`, `ChurnInterventionService`) is still active and is not the same thing. A `HealthScore` field does exist but it's scoped to onboarding progress (`CrmOnboardingStateDto.HealthScore`), not a general per-account risk score | CS has no simple at-a-glance risk indicator per account |
| **RFQ to vendors** (9.1) | Not built — re-verified 2026-07-09, zero hits for RFQ/RequestForQuote/vendor-quote-comparison anywhere | No formal way to compare multiple supplier quotes before purchasing — procurement discipline gap |
| **GR Discrepancy workflow** (9.5) | Not built — re-verified 2026-07-09; `GoodsReceiptService.ConfirmAsync` just sums received qty into the PO, no over/short-receipt flag. (`ThreeWayMatchService` variance is invoice-vs-PO at billing time, not at receiving time — doesn't cover this) | Short/damaged deliveries aren't auto-flagged against the PO — handled manually, easy to miss |
| **Webhooks (outbound)** | Backend built (`CrmWebhookController`/`CrmWebhookService`), zero UI — re-verified 2026-07-09 | No way to connect OmniFlow to other systems (Zapier-style) without a developer |
| **Web Forms builder** | Backend built, zero UI | No native lead-capture form for the website — marketing depends on a workaround |
| **Pipeline Forecasting AI** (verified 2026-07-09) | Backend built (`CrmForecastController`/`CrmForecastService` — Monte Carlo pipeline forecast, per-deal AI win-probability, at-risk-deal scan), **zero frontend**. The "Weighted Forecast" card on the Analytics page is a separate, simpler calc — not this service | The weekly forecast/quota conversation runs blind to a system that already computes deal-level AI probability and flags at-risk deals |
| **Call Summary Transcript Source** (verified 2026-07-09) | The Call Summary feature itself works — LLM structured extraction (themes, decisions, objections, competitor mentions, sentiment arc) + full UI on the Meetings page — but it ingests `signal.Summary` text as a "transcript proxy" (explicit TODO in code); no real call-recording/audio-transcription pipeline feeds it | The AI analysis has nothing real to analyze until a recording/transcription source is wired in — summaries are only as good as manually-typed notes |

---

## Tier C — Scale & compliance (matters as the business grows or enters regulated industries)

| Feature | Status | Why it matters |
|---|---|---|
| **Multi-Currency** (20.6) | Backend built (`CrmMultiCurrencyController`), zero UI | Blocks accurate consolidated reporting the moment you sell internationally |
| **Field-Level Audit Trail** (20.7) | Backend built (`CrmFieldAuditController` at `crm/field-audit`), zero UI — re-verified 2026-07-09. **Trap for future audits:** the sidebar's existing "Audit Log" nav item (`AuditLogPage.tsx`) is a *different* feature — it calls `crmApi.getAuditFeed()` (`/audit-feed`), a general activity log, not field-level history. There's also a `RecordAuditTrail.tsx` component already written but never imported anywhere (dead code) | No "who changed this deal's value and when" — blocks regulated industries (SOX/HIPAA-style) and makes disputes guesswork |
| **Individual Email Sync** (20.2) | Backend built (`CrmEmailSyncWorker`), zero UI | Reps' 1:1 emails never land in the CRM automatically — the single most-used daily feature in Salesforce/HubSpot |
| **Custom Objects / Formula Fields / Validation Rules / Rollup Summaries** | All backend built, zero UI | Salesforce-Platform-style extensibility — only bites once a customer needs to model something outside the built-in entities |
| **Supplier Order Confirmation tracking** (9.3) | Not built | No vendor acknowledgment or confirmed-delivery-date on file |
| **Pro-Forma Invoice** (12.2) | Not built | Blocks international trade (import clearance paperwork) and large B2B deals needing pre-shipment docs |
| **Negotiation Rounds UI** (5.2) | Backend built — re-verified 2026-07-09, naming corrected: the actual entity is `CrmConcession` via `CrmNegotiationController` (`crm/negotiation`, `/deals/{id}/concessions`), not a literal "NegotiationRound". `DealDetailPage.tsx` has zero references to it — no rounds/concessions tab | Still logged as free-text notes instead of structured rounds |
| **Stock Disposition** (16.5) | Partial — free-text field only | No structured Restock/Refurbish/Write-off classification or inventory adjustment on returns |
| **Login History / Login Policy** | Backend built, zero UI | Basic security hygiene missing from the admin surface |
| **RBAC Anomaly Detection** | Backend built, zero UI | Would flag suspicious permission usage — currently invisible |
| **CPQ Configuration & Pricing Rules** (re-verified 2026-07-09 — gap is deeper than previously stated) | Product Bundles are fully built + UI'd (`ProductBundlesPage`, a separate feature); but `ICrmCpqService`/`CrmCpqServices.cs` (dynamic pricing rules, configurable product options, quote-level bundles) has **no controller anywhere calling it** — not wired to an HTTP endpoint at all, let alone a UI | Static bundles work but guided-selling/configure-price logic isn't even reachable via API yet, not just missing a UI |
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
| **Sandbox / tenant cloning** | Safe copy of a tenant to test automation changes before going live | Correction (2026-07-09): NOT "zero code" — a real `CrmSandbox` entity + `SandboxStatus` enum + EF table + DTOs (`CrmSandboxDto`/`CreateSandboxRequest`) already exist. But there's no service, no controller, and no frontend reference — it's a data-model-only stub, someone started this and stopped |
| **Autonomous AI SDR / Outbound Agents** (verified 2026-07-09, confirmed zero code anywhere) | An agent that prospects, qualifies leads, and books meetings without human intervention | Now a standard 2025-2026 differentiator shipped by Salesforce Agentforce / HubSpot Breeze / Zoho Zia — reps here do 100% of prospecting manually |

---

## Tier E — Undocumented backend scaffolding (unclear if planned or abandoned)

~24 more backend modules exist with entities/services/controllers but **no frontend API-client wrapper at all** — genuinely unreachable, and never mentioned in `CRM-FULL-TEST-FLOW.md` either. Unlike Tiers A–D, I can't say these are "needed" with confidence — they may be intentional future roadmap or dead generated code. Re-spot-checked 2026-07-09: still all orphaned, no new frontend wiring on any of them:

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

**Built this session** (2026-07-09): Custom Reports & Dashboards (20.1) — was previously miscategorized as "backend built, zero frontend"; the backend was actually just a metadata CRUD shell with no execution engine at all. Added: a 14-object field catalog (Deal/Lead/Contact/Account/Quote/Order/Invoice/CreditNote/SupplierInvoice/Task/Meeting/SupportCase/Campaign/Contract) with reflection-verified fields; a `System.Linq.Dynamic.Core`-based query engine that safely translates stored filter/group/sort JSON into real EF Core queries (field names whitelisted against the catalog, values always parameterized — never string-interpolated); a dashboard-widget data endpoint; an hourly Hangfire job (`ReportScheduleJob`) that runs due schedules and emails a CSV export via the existing `IEmailService`; and two new frontend pages, `/dashboard/crm/reports` (object/column/filter/group/sort builder with live preview, save, and schedule) and `/dashboard/crm/dashboards` (create dashboard, add report-bound widgets, adjust layout, live-rendered data). Follow-up fix (same day): widget layout now uses real drag-and-drop + resize on the grid (`react-grid-layout`, dragged by a grip handle, persisted via the existing layout endpoint) instead of numeric inputs; scheduled CSV attachments now carry the correct `text/csv` MIME type (threaded a `contentType` param through `IEmailService.SendDocumentEmailAsync` and all three implementations — Smtp/Resend/Console — default stays `application/pdf` for existing PDF callers). Remaining known limit: no PDF export option yet, CSV only.

**Built this session, continued** (2026-07-09): **CSAT Surveys** (15.4) — new `crm-csat` API wrapper + `ContactSentimentPanel`/`CsatScoreBar`/`CsatRecordRow` on the Contact detail page, surfacing NPS classification and score history against the pre-existing `ICrmCsatService`/`CrmCsatController` backend. **Bulk Actions** (20.9) — was "only Deals, only delete"; added `BulkActionAsync` to both `CrmDealService` (Stage/Assign/Delete — Stage delegates to the existing `MoveStageAsync` per item so exit-gate enforcement still applies) and `CrmContactService` (FunnelStage/Assign/Delete), new `POST bulk` endpoints on both controllers, and matching bulk-bar UI on `LeadsPage`, `DealsPage`, and `ContactsPage`. **Knowledge Base** (15.5) — was "backend built, zero UI"; new `crm-kb` API wrapper + `/dashboard/crm/knowledge-base` page (Articles tab with category search + detail/edit view; Pending Review tab with Preview toggle, Approve & publish, Reject-with-reason) against the pre-existing `ICrmKnowledgeBaseService`/`CrmKnowledgeBaseController`; also added a "Generate KB Draft" button on resolved/closed Support Cases. All three verified live via Playwright against the real running app (login → click through → real API calls → screenshot evidence), not just typechecked.

**Found already built, doc was stale** (discovered during 2026-07-09 audit): **Approve/Reject via Email for CRM approvals** (20.8) — doc said "not built for CRM approvals (exists only for AI-agent runs)". This is now wrong: migration `20260707094803_AddCrmApprovalEmailToken` added `ApprovalTokenHash`/`ApprovalTokenExpiresAt`/`DecidedViaEmail` to `CrmApprovalRequests`, and a new no-auth `CrmPublicApprovalController` exposes token-based `GET .../approve` and `GET/POST .../reject` endpoints with HTML confirmation pages, backed by `CrmApprovalService.ApproveByTokenAsync`/`RejectByTokenAsync`/`ValidateTokenAsync`. Nobody on this thread built it this session — it must have landed in an earlier commit and never got reflected here. Moved out of the gaps list entirely.

## What OmniFlow has that Salesforce/HubSpot/Zoho don't ship natively

Native multi-channel chatbot engine (WhatsApp/Telegram/Messenger/SMS/Voice/WebChat/Email) driving CRM data directly — competitors need a bolted-on third party for this. AI-native churn prediction + auto-refreshing "Living Account Brief" narrative per account. An AI Actions panel with approve/reject/undo built into analytics. A visual flow builder wired into the same CRM data model. A deeper procurement chain (RFQ-adjacent PO → GR → Supplier Invoice) than HubSpot/Zoho ship out of the box — even though the Three-Way-Match step is still missing (Tier A).
