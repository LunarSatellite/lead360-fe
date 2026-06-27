# OmniFlow CRM — Real-World End-to-End Test Flow

**Scenario:** A sales rep at OmniFlow onboards a new business customer "Acme Corp" — from first marketing touch all the way through ongoing service, renewals, and post-sale operations. Follow every section in order. Each phase uses data from the previous one.

---

## API Token (get once, reuse everywhere)

```
POST https://localhost:50362/api/v1/auth/login
{
  "Email": "admin@omniflow.ai",
  "Password": "Admin@123456"
}
```
Copy `data.accessToken` → paste as `Bearer <token>` in all API calls below.

---

## Start Servers

```bash
# Terminal 1 — backend
dotnet run --project src/OmniFlow.API
# → https://localhost:50362

# Terminal 2 — frontend
npm run dev
# → http://localhost:5173
```

Login: **admin@omniflow.ai / Admin@123456**

---

---

# PHASE 0 — Admin Setup (do once before anything else)

> A real business configures their CRM before the first lead ever comes in. Do this now.

---

## 0.1 Team — `/dashboard/team`

1. Click **Invite Member** → Email: `sales@acme-test.com`, Role: Agent → Send
2. Invite second: `support@acme-test.com`, Role: Agent
3. Invite third: `ops@acme-test.com`, Role: Agent
4. Verify all 3 appear in the members list with status **Pending**

---

## 0.2 Pipeline & Stage Gates — `/dashboard/crm/pipelines`

1. Click **New Pipeline** → Name: `Enterprise Sales`, set as default
2. Add stages in order:
   - `Prospecting`
   - `Discovery Call`
   - `Proposal Sent`
   - `Negotiation`
   - `Contract Review`
   - `Won` / `Lost` (terminal)
3. Click **Discovery Call** → open stage settings
4. Add a gate: type **Required Field**, field `Budget Range` (we'll create this in custom fields)
5. Add another gate on `Proposal Sent`: type **Manual Checkpoint**, label `Demo completed`
6. Save pipeline

---

## 0.3 Approval Chains — `/dashboard/crm/approval-chains`

1. Click **New Chain** → Entity: `Quote`, Name: `Quote Approval`
2. Add Step 1: Approver → yourself
3. Add Step 2: Approver → `sales@acme-test.com`
4. Save
5. Create another: Entity `Deal`, Name: `Deal Closure Approval`
6. Add single step: yourself
7. Save
8. Verify both chains appear in the list

---

## 0.4 Custom Fields — `/dashboard/crm/custom-fields`

1. Create for **Contact**: `Industry` — Type: Text
2. Create for **Contact**: `LinkedIn URL` — Type: Text
3. Create for **Deal**: `Budget Range` — Type: Text
4. Create for **Deal**: `Decision Timeline` — Type: Text
5. Create for **Lead**: `Lead Score` — Type: Text
6. Verify all 5 appear, each tagged to the right entity

---

## 0.5 SLA Policies — `/dashboard/crm/support`

1. Open Support page → find SLA Policies section (tab or panel)
2. Create policy: Name `Enterprise SLA`, First Response: 2h, Resolution: 24h, Priority: High
3. Create policy: Name `Standard SLA`, First Response: 8h, Resolution: 72h, Priority: Normal
4. Verify both appear in the SLA list

---

## 0.6 Assignment Rotation — `/dashboard/crm/assignment-rotation`

1. Click **New Rotation Pool** → Entity: `Work Order`, Name: `Field Tech Pool`
2. Add members: `ops@acme-test.com`, yourself
3. Mode: Round-Robin
4. Save
5. Create another: Entity `Returns`, Name: `Returns Team`
6. Add members: `support@acme-test.com`, yourself
7. Save

---

## 0.7 Time Periods — `/dashboard/crm/time-periods`

1. Click **New Time Period** → Name: `June 2026`, Start: 2026-06-01, End: 2026-06-30
2. Save → status: **Draft**
3. Click **Submit for Approval** → status: **Submitted**
4. Click **Approve** → status: **Approved** ✓
5. Create another: `July 2026` — leave as Draft for now

---

## 0.8 Event Ingestion — `/dashboard/crm/event-ingestion`

1. Open the page
2. Click **Generate Key** (or **New Tracking Key**)
3. Name it: `Website Tracking`
4. Copy the JavaScript snippet shown
5. Verify the key appears with status Active
6. This key would be pasted into the Acme Corp website — note it for reference

---

## 0.9 Announcements — `/dashboard/crm/announcements`

1. Click **New Announcement**
2. Type: `Urgent`, Title: `Q3 Pricing Effective July 1 — Update All Quotes`
3. Body: `All quotes issued after July 1 must use the new Q3 price list. See attached.`
4. Click **Publish** → status changes to Published
5. Create another: Type: `General`, Title: `Welcome to OmniFlow CRM`, Schedule for 5 minutes from now
6. Verify the scheduled one shows future publish time

---

---

# PHASE 1 — Marketing & Lead Generation

---

## 1.1 Meta Ads Integration — `/dashboard/crm/meta-ads`

1. Open the page — shows the Facebook/Meta integration panel
2. Click **Connect Ad Account** (if not yet connected, the OAuth flow begins — skip if no real FB account)
3. If already connected: verify campaigns are listed
4. Check **Sync Leads** → any leads from FB Lead Ads should appear
5. Verify attribution tracking is configured (pixel events)

---

## 1.2 Campaign — `/dashboard/crm/campaigns`

### B2B Outreach Campaign
1. Open the **B2B Campaigns** tab
2. Click **New Campaign**
3. Name: `Q3 Espresso Machine Outreach`, Channel: Email
4. Target Segment: all contacts with Industry = Manufacturing
5. Schedule: start tomorrow 09:00
6. Add content: Subject `Transform your office coffee experience`
7. Save → status: **Draft**
8. Click **Launch** → status: **Active**

### Lead Campaign
1. Switch to **Lead Campaigns** tab
2. Click **New Campaign**
3. Name: `Inbound Demo Request`, Source: Website
4. Save and launch

---

## 1.3 Lead Created (via chatbot / manual)

### Manual lead entry
1. Go to `/dashboard/crm/leads`
2. Click **New Lead**
3. Fill:
   - First Name: `Anita`, Last Name: `Sharma`
   - Email: `anita.sharma@acmecorp.com`
   - Phone: `+977-9801234567`
   - Company: `Acme Corp` - missing
   - Source: `Website`
   - Stage: `New` 
   - Custom field `Lead Score`: `85`  - not saving 
4. Save → appears in list with stage **New**

---

## 1.4 Lead Detail & Qualification — `/dashboard/crm/leads/<id>`

1. Click Anita's row → detail page opens
2. Verify: name, email, company, source shown
3. Add a note (timeline): `Initial contact — interested in 10 machines for new HQ. Budget ~$25k.`
4. Change stage: `New` → `Warm`
5. Verify stage badge updates

---

## 1.5 Nurture Sequence — `/dashboard/crm/nurture`

1. Click **New Sequence**
2. Name: `Cold Lead Warm-Up`
3. Add steps:
   - Step 1: Send Message, delay 0 days, text `Thanks for your interest in OmniFlow Machines!`
   - Step 2: Send Message, delay 3 days, text `Did you know our machines reduce coffee costs by 40%?`
   - Step 3: Change Stage → `Qualified`, delay 7 days
   - Step 4: Add Tag → `high-value`, delay 7 days
4. Save sequence
5. Go back to Anita's lead → find **Enroll in Sequence** → select `Cold Lead Warm-Up`
6. Verify Anita shows as enrolled in the sequence detail

---

---

# PHASE 2 — Organization, Account & Contact

---

## 2.1 Organization — `/dashboard/crm/organizations`

1. Click **New Organization**
2. Name: `Acme Corp`, Website: `https://acmecorp.com`
3. Industry: `Manufacturing`, Size: `201-500`
4. HQ: `Kathmandu, Nepal`
5. Save

---

## 2.2 Account — `/dashboard/crm/accounts`

1. Click **New Account**
2. Name: `Acme Corp — Nepal`, Type: `Customer`
3. Tier: `Enterprise`
4. Organization: link to `Acme Corp`
5. Assigned To: yourself
6. Save
7. Open the account → add a child account: `Acme Corp — Operations Division` (parent: Acme Corp Nepal)
8. Verify the hierarchy shows parent → child relationship

---

## 2.3 Contact — `/dashboard/crm/contacts`

1. Click **New Contact**
2. First Name: `Anita`, Last Name: `Sharma`
3. Email: `anita.sharma@acmecorp.com`
4. Phone: `+977-9801234567`
5. Account: `Acme Corp — Nepal`
6. Custom field `Industry`: `Manufacturing`
7. Custom field `LinkedIn URL`: `https://linkedin.com/in/anita-sharma-acme`
8. Save → **copy CONTACT_ID from URL**

> **CONTACT_ID** — used in every section after this.

### Contact Detail — `/dashboard/crm/contacts/<CONTACT_ID>`
1. Open Anita's detail page
2. Verify all fields shown including custom fields
3. Add a note: `Met at Nepal Tech Summit. Primary decision maker for IT purchases.`
4. Verify it appears in the activity timeline with timestamp
5. Check that the linked account `Acme Corp — Nepal` is shown and clickable

---

## 2.4 Deduplication — `/dashboard/crm/dedup`

1. Create a duplicate contact:
   - Name: `Anita S`, Email: `anita.sharma@acmecorp.com` (same email)
2. Go to `/dashboard/crm/dedup`
3. Verify the system detects Anita Sharma + Anita S as duplicates
4. Open the pair → compare fields side-by-side
5. Select `Anita Sharma` (the first one) as the **winner**
6. Click **Merge** → duplicate removed
7. Verify only one Anita Sharma remains in contacts

---

---

# PHASE 3 — Pre-Sales

---

## 3.1 Deal — `/dashboard/crm/deals`

1. Click **New Deal**
2. Title: `Acme Corp — 10x Espresso Machine Enterprise`
3. Contact: `Anita Sharma`
4. Pipeline: `Enterprise Sales`, Stage: `Prospecting`
5. Value: `25500`
6. Expected Close: 30 days from today
7. Custom field `Budget Range`: `$20k–$30k`
8. Custom field `Decision Timeline`: `End of Q3`
9. Save → appears in Kanban board under `Prospecting`

> **DEAL_ID** — copy from URL after saving.

### Move through stages
1. Open the deal
2. Drag or change stage → `Discovery Call`
3. The stage gate fires: **Budget Range is required** — it should already be filled ✓
4. Add strategy note: `Anita confirmed Q3 budget. Three competitors being evaluated: Jura, DeLonghi, us.`
5. Move to `Proposal Sent` → gate fires: **Demo completed** (manual checkbox) — check it ✓
6. Verify deal stays in `Proposal Sent`

### Deal timeline
1. Scroll to the deal timeline
2. Verify stage-change events are recorded automatically
3. Add a manual note: `Follow-up call scheduled for Thursday`

---

## 3.2 Meeting — `/dashboard/crm/meetings`

1. Click **New Meeting**
2. Title: `Acme Corp — Product Demo`
3. Contact: `Anita Sharma`, Deal: `Acme Corp — 10x Espresso Machine`
4. Start: tomorrow 14:00, Duration: 60 min
5. Location: `Google Meet`
6. Save → appears in meetings list
7. Open the meeting → click **Book via Calendar** (if calendar integration configured)
8. After the demo: click **Request Call Summary** (AI-generated)
9. Verify summary appears (may be a loading state if no real transcript)
10. Click **Create Task from Meeting** → auto-populates task: `Send quote to Anita`
11. Verify task appears in `/dashboard/crm/tasks` ✓

---

## 3.3 Quote — `/dashboard/crm/quotes`

1. Click **New Quote**
2. Contact: `Anita Sharma`, Deal: `Acme Corp — 10x Espresso Machine`
3. Validity: 14 days from today
4. Add line items:
   - `Espresso Machine Pro X1` × 10 @ `2,500` = `25,000`
   - `Installation & Commissioning` × 1 @ `500` = `500`
   - `Annual Maintenance Plan` × 1 @ `1,200` = `1,200`
5. Save → status: **Draft**
6. Note total: `$26,700`

### Submit for approval
1. Click **Submit for Approval** (this triggers the Quote Approval chain we built in 0.3)
2. Go to `/dashboard/crm/approvals`
3. Find the pending quote approval
4. Click **Approve** with comment: `Pricing within authorized range`
5. Step 2 approver (sales@acme-test.com) would also need to approve — simulate by approving as admin
6. Verify quote status → **Approved**
7. Click **Send to Customer** → status: **Sent**

---

## 3.4 Proposal — `/dashboard/crm/proposals`

1. Click **New Proposal**
2. Title: `OmniFlow Enterprise Coffee Solution — Acme Corp`
3. Contact: `Anita Sharma`, Deal: link it
4. Click **Generate with AI** (if available) → AI drafts sections
5. Edit sections:
   - Executive Summary: `Acme Corp requires 10 commercial espresso machines...`
   - Solution Overview: describe the machines
   - Investment: `$26,700 total`
   - Timeline: `Installation within 14 days of PO`
6. Save → **Send** → status: **Sent**
7. Verify the proposal shows in Anita's contact timeline

---

## 3.5 Approvals Board — `/dashboard/crm/approvals`

1. Open the page
2. Verify you can see:
   - The quote approval (should be completed)
   - Filter by `Pending` — should be empty now
   - Filter by `Approved` — quote shows
3. Click on the completed approval → verify full comment trail is visible

---

---

# PHASE 4 — Deal Won → Revenue

---

## 4.1 Close the Deal

1. Go to deal `Acme Corp — 10x Espresso Machine`
2. Move stage → `Negotiation`, then `Contract Review`
3. Click **Mark as Won**
4. Submit for Deal Closure Approval (triggers the chain from 0.3)
5. Go to Approvals → approve it
6. Verify deal shows **Won** badge ✓, pipeline board moves it out

---

## 4.2 Order — `/dashboard/crm/orders`

1. Click **New Order**
2. Contact: `Anita Sharma`, Deal: link it
3. Currency: `USD`
4. Line items (same as quote):
   - `Espresso Machine Pro X1` × 10 @ `2,500`
   - `Installation & Commissioning` × 1 @ `500`
   - `Annual Maintenance Plan` × 1 @ `1,200`
5. Save → status: **Pending**

> **ORDER_ID** — copy from URL. Used for Deliveries and Returns.

6. Change status → **Confirmed**
7. After partial ship: change → **Partially Fulfilled**
8. After all items ship: → **Fulfilled** ✓

---

## 4.3 Invoice — `/dashboard/crm/invoices`

1. Click **New Invoice** (or generate from order)
2. Contact: `Anita Sharma`, Order: link it
3. Due date: 30 days from today
4. Line items auto-populated (or add manually)
5. Save → status: **Draft**
6. Click **Send** → status: **Sent**
7. Click **Record Payment** → Amount: `26,700`, Method: `Bank Transfer`, Date: today
8. Status → **Paid** ✓ (green badge)

### Test overdue flow
1. Create a second invoice: Contact: `Anita`, due date: yesterday
2. Verify status auto-shows as **Overdue** (or manually trigger)
3. Click **Mark as Disputed** → add dispute note: `Customer claims unit count discrepancy`
4. Click **Void** → status: **Voided**

---

## 4.4 Subscription — `/dashboard/crm/subscriptions`

1. Click **New Subscription**
2. Contact: `Anita Sharma`, Plan: `Maintenance Pro`
3. Billing: Monthly, Amount: `100`
4. Start: today, Renewal: 1 year
5. Save → status: **Active**
6. Click **Pause** → status: **Paused**
7. Click **Resume** → status: **Active** again ✓
8. Verify renewal date is visible

---

---

# PHASE 5 — Operational

---

## 5.1 Tasks — `/dashboard/crm/tasks`

1. Open the page
2. Auto-created task from meeting should already be here (`Send quote to Anita`)
3. Create manually: **New Task**
   - Title: `Coordinate machine delivery with logistics`
   - Assigned To: `ops@acme-test.com`
   - Due: 3 days from today
   - Priority: **High**
   - Linked Contact: `Anita Sharma`
4. Create another: Title `Follow up on invoice payment`, Priority: Normal, Due: 15 days
5. Filter by **High priority** → only the logistics task shows
6. Filter by **Assignee: ops** → same
7. Open the delivery task → click **Complete** ✓
8. Verify completed tasks show with strikethrough or separate section

---

## 5.2 Time Tracking — `/dashboard/crm/time-tracking`

1. Click **New Time Entry**
2. Entity Type: `Deal`, Entity: `Acme Corp — 10x Espresso Machine`
3. Date: today, Hours: `2.5`
4. Notes: `Proposal writing and pricing analysis`
5. Billable: Yes
6. Save
7. Add another: Entity Type: `Support Case` (link to a case we'll create next)
   - Hours: `1`, Notes: `Initial troubleshooting call`, Billable: Yes
8. Verify total billable hours shown in summary
9. Filter by Entity Type: `Deal` → only first entry shows

---

## 5.3 Support — `/dashboard/crm/support`

1. Click **New Support Case**
2. Subject: `Unit 7 — Machine not powering on after installation`
3. Contact: `Anita Sharma`
4. Priority: **High**, SLA Policy: `Enterprise SLA`
5. Description: `Unit 7 of 10 is completely unresponsive. All other units are working.`
6. Save → status: **Open**

### Work the case
1. Open the case
2. Add internal note: `Checked logs — appears to be a power board failure. Dispatching technician.`
3. Change priority → **Urgent**
4. Click **Escalate** → add escalation reason: `Hardware failure on enterprise account`
5. Status → **Escalated**
6. Add reply to customer: `We have escalated your case and a technician will be on-site tomorrow.`
7. Verify SLA timer is visible (first response within 2h, resolution within 24h)
8. After "resolution": click **Resolve** → add resolution summary
9. Status → **Resolved** ✓, then **Closed**

---

## 5.4 Process Tasks & Workflows — `/dashboard/crm/process-tasks`

### Workflow Definitions tab
1. Click **New Process Workflow**
2. Name: `Enterprise Onboarding Process`
3. Add steps in order:
   - Step 1: `Send welcome package`
   - Step 2: `Schedule kickoff call`
   - Step 3: `Deliver & install equipment`
   - Step 4: `Conduct staff training`
   - Step 5: `Sign-off and handover`
4. Save

### Instances tab
1. Click **Start Instance** on `Enterprise Onboarding Process`
2. Link to contact: `Anita Sharma`
3. Verify instance appears with all steps as **Pending**
4. Open the instance → click Step 1 → **Mark In Progress**
5. Click Step 1 → **Mark Completed**
6. Step 2 auto-advances to **Pending** → mark **In Progress**
7. Try **Escalate** on Step 2 → add reason: `Can't reach customer to schedule`
8. Step shows as **Escalated**

### Tasks tab
1. Verify the steps create individual trackable tasks
2. Filter by **Escalated** → Step 2 shows

---

## 5.5 Workflow Automation — `/dashboard/crm/workflows`

### Create an automation
1. Click **New Workflow**
2. Name: `Deal Won → Create Onboarding Task`
3. Trigger: `Deal Stage Changed to Won`
4. Add Action: `Create Task` — Title: `Start customer onboarding`, Assign To: `ops@acme-test.com`
5. Add Action: `Send Notification` — Message: `New enterprise customer won — onboarding needed`
6. Save → click **Activate**

### Test it
1. Go to Deals → create a throwaway deal → move it to Won
2. Go to Tasks → verify the auto-created onboarding task appears ✓
3. Return to Workflows → click the workflow → open **Runs** tab
4. Verify one run recorded with status **Completed**

### AI-generated workflow
1. Click **Generate with AI**
2. Prompt: `When a support case priority changes to Urgent, notify the assigned agent and create a follow-up task for 24 hours later`
3. Review the generated workflow → Activate it

---

## 5.6 Workflow Campaigns — `/dashboard/crm/workflow-campaigns`

1. Click **New Workflow Campaign**
2. Name: `Onboarding Automation — Enterprise`
3. Workflow: `Deal Won → Create Onboarding Task`
4. Segment: Contacts with Account Tier = Enterprise
5. Schedule: Immediate
6. Save → click **Launch**
7. Verify campaign status shows execution count

---

---

# PHASE 6 — After-Sales

---

## 6.1 Delivery — `/dashboard/crm/deliveries`

### Create the shipment (API — no UI form)
```
POST https://localhost:50362/api/v1/crm/orders/<ORDER_ID>/deliveries
Authorization: Bearer <token>
Content-Type: application/json
{
  "Carrier": "DHL",
  "TrackingNumber": "DHL-ACME-BATCH-001",
  "RecipientName": "Anita Sharma",
  "RecipientAddress": "Acme Corp HQ, Kathmandu, Nepal"
}
```

### Track in UI
1. Open `/dashboard/crm/deliveries`
2. Verify `DHL-ACME-BATCH-001` appears — status: **Label Created**
3. Search `DHL-ACME-BATCH-001` → filters to one row ✓
4. Click row → detail panel shows carrier, tracking, recipient, address
5. Advance status step by step:
   - **Picked Up** → verify timestamp recorded
   - **In Transit** → verify
   - **Out for Delivery** → verify
   - **Delivered** ✓ → green badge
6. Filter by status `Delivered` → only this row shows

### Simulate a failed delivery
1. Create a second shipment via API: TrackingNumber `DHL-ACME-FAIL-001`
2. Advance to `Out for Delivery`
3. Click **Mark Failed** → add failure reason: `Recipient not available — access denied`
4. Verify red **Failed** badge, failure reason visible in detail panel

---

## 6.2 Equipment — `/dashboard/crm/equipment`

Register all 10 machines (do at least 3 for testing):

1. Click **Register Equipment**
2. Unit 1:
   - Serial: `ACME-ESP-001`, Model: `Espresso Pro X1`, Brand: `BrevaCo`
   - Category: `Commercial Espresso`, Contact: `<CONTACT_ID>`
   - Warranty End: 2 years from today
   - Next Service: 6 months from today
   - Site: `Acme Corp — Main Kitchen`
3. Register → repeat for `ACME-ESP-002` (Site: `Acme Corp — Floor 3 Pantry`) and `ACME-ESP-003` (Site: `Acme Corp — Boardroom`)
4. Verify all 3 appear with status **Active** and upcoming service dates in amber

### Equipment detail & notes
1. Open `ACME-ESP-001`
2. Verify: serial, warranty, next service, site all shown
3. **Notes tab** → Add note:
   - Kind: `Installation Note`
   - Text: `Installed and verified. Pump pressure at 9.2 bar. Grind setting at 28.`
4. Add another note: Kind `Service History`, Text `Factory calibration verified on arrival`
5. Verify both notes appear with timestamps

### Status change
1. **Detail tab** → Click **Under Maintenance** → status updates in list
2. Verify the list badge updates without page reload
3. Change back → **Active** ✓

---

## 6.3 Work Orders — `/dashboard/crm/work-orders`

### Create and complete a work order
1. Click **New Work Order**
2. Title: `Installation visit — Acme Corp 10x units`
3. Type: `Installation`, Priority: `High`
4. Contact: `<CONTACT_ID>`, Equipment: `ACME-ESP-001`
5. Scheduled At: tomorrow 09:00, Estimated Minutes: `240`
6. Site Label: `Acme Corp HQ, Kathmandu`
7. Save → status: **Draft**
8. **Status tab** → click **Schedule** → status: **Scheduled**
9. **Status tab** → click **En Route**
10. **Status tab** → click **Start Work** → **In Progress**
11. **Notes tab** → add notes during work:
    - Kind: `Progress Update`: `All units unboxed and positioned. Starting installation on Unit 1.`
    - Kind: `Part Used`: `Wall mount brackets × 10, power cables × 10`
    - Kind: `Progress Update`: `Units 1-5 installed and tested. Taking lunch break.`
    - Kind: `Part Used`: `Cleaning kit × 1 (used during commissioning)`
12. Back to **Status tab** → fill:
    - Actual Minutes: `210`
    - Resolution Notes: `All 10 units installed, calibrated, and tested. Pressure verified on all units. Handover signed by Anita Sharma.`
13. Click **Complete** ✓

### Create a maintenance work order
1. Create another: Title `Monthly service — ACME-ESP-001`, Type `Maintenance`
2. Priority: Normal, Equipment: `ACME-ESP-001`, Scheduled: next month
3. Save → leave as Draft
4. Verify it appears alongside the completed installation WO
5. Filter by Status `Completed` → only the installation WO shows
6. Filter by Priority `High` → only installation WO shows

### Assignment rotation
1. Create WO: Title `Emergency repair — ACME-ESP-002`
2. Leave `Assigned To` blank — the rotation pool should auto-assign from `Field Tech Pool`
3. Verify the assignee was auto-populated from the round-robin pool we created in 0.6

---

## 6.4 Returns — `/dashboard/crm/returns`

### Create return (API — no UI form)
```
POST https://localhost:50362/api/v1/crm/orders/<ORDER_ID>/returns
Authorization: Bearer <token>
Content-Type: application/json
{
  "ContactId": "<CONTACT_ID>",
  "ReturnReason": 1,
  "CustomerNotes": "Unit 7 (ACME-ESP-007) stopped working after 2 weeks. Complete pump failure.",
  "LineItems": [
    {
      "ProductName": "Espresso Machine Pro X1",
      "QuantityOrdered": 10,
      "QuantityReturned": 1,
      "UnitPrice": 2500
    }
  ]
}
```
`ReturnReason: 1` = Defective

### Approve flow
1. Open `/dashboard/crm/returns`
2. Verify RMA appears — status: **Pending Approval**
3. Click row → panel shows reason, customer note, line items
4. Click **Approve** → status: **Approved**
5. Click **Mark Received** → confirm unit received at warehouse → **Received**
6. Click **Record Inspection**:
   - Result: `Failed`
   - Findings: `Pump motor seized. Water damage visible on PCB. Manufacturing defect confirmed.`
7. Inspection record appears in panel
8. Click **Resolve**:
   - Resolution Type: `Replacement`
   - Notes: `Replacement unit ACME-ESP-007R shipped via DHL-ACME-REPLACE-001`
9. Status → **Resolved** ✓

### Reject flow (test the other path)
1. Create a second return via API: `ReturnReason: 3` (Out of Warranty)
2. Open it → click **Reject**
3. Reason: `Unit is outside the 2-year warranty period. Physical damage observed.`
4. Status → **Rejected** ✓ (red badge, reason visible)
5. Create a third → Approve → then **Cancel** it
6. Verify status → **Cancelled**

---

## 6.5 Customer Onboarding — `/dashboard/crm/customer-onboarding`

1. Click **Start Onboarding**
2. Title: `Acme Corp — 10x Machine Rollout`
3. Deal: `<DEAL_ID>`, Contact: `<CONTACT_ID>`
4. Edit default milestones (or use/add):
   - `Kickoff Meeting` | Kind: Kickoff | Due: Day 1
   - `Equipment Delivered & Installed` | Kind: Installation | Due: Day 7
   - `Barista Staff Training — Group A` | Kind: Training | Due: Day 10
   - `Barista Staff Training — Group B` | Kind: Training | Due: Day 12
   - `Go Live — All 10 Units Active` | Kind: Go Live | Due: Day 14
   - `30-Day Check-In Call` | Kind: Review | Due: Day 44
5. Save → card appears in list, progress: `0%`

### Work through milestones
1. Click the card → detail panel opens with milestone checklist
2. Check `Kickoff Meeting` ✓ → progress: 17%
3. Check `Equipment Delivered & Installed` ✓ → 33%
4. Click **Mark Blocked** on `Barista Staff Training — Group A` → reason: `Training room not ready, delayed by 2 days`
5. Verify card in list shows red/warning indicator
6. Click **Unblock** → milestone back to normal state
7. Check `Barista Staff Training — Group A` ✓ → 50%
8. Check `Barista Staff Training — Group B` ✓ → 67%
9. Check `Go Live — All 10 Units Active` ✓ → 83%
10. Check `30-Day Check-In Call` ✓ → 100%
11. **Mark Onboarding Complete** button appears (only at 100%) → click it
12. Status: **Completed** ✓
13. Verify the card in the list shows Completed badge and progress bar full green

---

---

# PHASE 7 — Engagement & Feedback

---

## 7.1 NPS Survey — `/dashboard/crm/nps`

1. Click **New Survey**
2. Name: `Post-Onboarding NPS — Acme Corp`
3. Contact: `Anita Sharma`
4. Trigger: Manual
5. Send → survey dispatched (simulate response via API or if there's a public link)
6. Simulate a response: score `9`, comment `Very smooth onboarding. Team was professional.`
7. Verify Anita's response appears — classified as **Promoter** (9-10) ✓
8. Create another response: score `6` — classified as **Passive**
9. Create: score `3` — classified as **Detractor**
10. Verify the breakdown chart shows 1 Promoter / 1 Passive / 1 Detractor

---

## 7.2 CSAT (if available)

1. Check if CSAT surveys are separate from NPS on the support page
2. After resolving the support case from 5.3, trigger a CSAT survey
3. Verify CSAT score appears on the case and in analytics

---

---

# PHASE 8 — Intelligence & Analytics

---

## 8.1 CRM Analytics — `/dashboard/crm/analytics`

1. Open the page — wait for all widgets to load
2. Verify data from everything created above shows:
   - **Lead Count** > 0 (Anita's lead)
   - **Deal Value** shows ~$25,500
   - **Won Deals** = 1
   - **Revenue** = $26,700 (invoice paid)
   - **Pipeline Health** — no stuck deals (we moved it through)
   - **Lead Funnel** — shows conversion from lead → contact → deal → won
   - **Activity Heatmap** — shows today as active
   - **Nurture Health** — 1 contact enrolled
3. Change date range → **This Month** → verify numbers match
4. Change to **This Quarter** → verify

### AI Action Queue
1. Look for the **AI Actions** panel or tab
2. Verify any AI-generated recommendations appear (e.g., `Follow up with Anita re: renewal`)
3. Click **Approve** on one action → verify it executes (creates a task or sends a message)
4. Click **Reject** on another → it disappears from queue
5. Click **Undo** on the approved one → verify the action is rolled back ✓

---

## 8.2 Ops Dashboard — `/dashboard/crm/ops-dashboard`

1. Open the page
2. Verify summary cards show:
   - Deliveries: X delivered, Y in transit, Z failed
   - Returns: X pending, Y resolved
   - Work Orders: X completed, Y scheduled
   - Onboardings: X completed, Y in progress
3. Check breakdown by status for each section
4. Verify numbers match what was created in Phase 6

---

---

# PHASE 9 — Advanced Features

---

## 9.1 Win/Loss Analysis

1. The deal we closed as Won is in the system
2. Create a second deal → close as **Lost**, reason: `Chose competitor DeLonghi due to price`
3. Go to analytics or deals page
4. Look for Win/Loss insights — verify win rate and loss reasons are tracked

---

## 9.2 Forecasting

1. Create 3 more deals in various stages with different values and close dates
2. Go to the analytics or deals section → look for **Forecast** view
3. Verify forecast shows weighted pipeline value by close date
4. Verify Won deals are excluded from forecast (already closed)

---

## 9.3 Signals / Intent Detection

1. Open Anita's contact detail
2. Look for **Signals** tab or panel
3. Signals would show engagement events from the event ingestion key (from 0.8)
4. Verify the contact shows any tracked signals (website visits, email opens, etc.)

---

## 9.4 Referral (if available)

1. Go to any referral section
2. Record that Anita referred a new prospect: `Bikash Tamang at Beta Corp`
3. Verify referral attribution is tracked

---

---

# PHASE 10 — Cleanup & Edge Cases

---

## 10.1 Verify soft deletes

1. Delete the duplicate contact we created in 2.4 (it was merged — verify it's gone from the list but not from DB)
2. Create a test lead → delete it → verify it's removed from the list
3. Verify deleted items do **not** reappear after page refresh

---

## 10.2 Custom fields on forms

1. Open any **New Contact** form
2. Verify `Industry` and `LinkedIn URL` fields appear in the form
3. Open **New Deal** form
4. Verify `Budget Range` and `Decision Timeline` appear
5. Try saving a deal and moving to `Discovery Call` without filling `Budget Range`
6. Verify the stage gate **blocks** the transition with a validation message ✓

---

## 10.3 Multi-entity timeline

1. Open Anita's contact detail
2. The activity timeline should show (in chronological order):
   - Contact created
   - Note added (Phase 2.3)
   - Deal created (linked)
   - Meeting logged
   - Quote sent
   - Proposal sent
   - Deal won
   - Order created
   - Invoice paid
   - Support case opened + resolved
   - Onboarding completed
3. Verify each event is timestamped and the entity type is labeled

---

## 10.4 Announcements visibility

1. Go to any dashboard page
2. Verify the `Q3 Pricing Effective July 1` announcement is visible (it was Published in 0.9)
3. The `Welcome to OmniFlow CRM` announcement (scheduled) should still be pending
4. Go back to Announcements → **Archive** the Q3 one
5. Verify it no longer appears in the active announcements

---

---

# Full Lifecycle at a Glance

```
[SETUP]
  Pipeline (6 stages + gates) → Approval Chains → Custom Fields → SLA Policies
  Assignment Rotation → Time Periods → Event Ingestion → Announcements

[MARKETING]
  Meta Ads → Campaign (B2B email) → Lead Campaign
      ↓
  Lead: Anita Sharma (Source: Website, Score: 85)
      ↓
  Nurture Sequence enrolled (5-step warm-up)

[SALES]
  Organization: Acme Corp
  Account: Acme Corp Nepal (Enterprise tier)
  Contact: Anita Sharma — custom fields, timeline
      ↓
  Deduplication: merge detected duplicate
      ↓
  Deal: $25,500 — Prospecting → Discovery (gate: Budget Range)
                             → Proposal Sent (gate: Demo done)
                             → Negotiation → Contract Review
      ↓
  Meeting: Product Demo → AI call summary → auto-Task created
      ↓
  Quote: $26,700 → Approval Chain → Approved → Sent
  Proposal: AI-generated → Sent
      ↓
  Deal Won → Deal Closure Approval → Confirmed Won ✓

[REVENUE]
  Order: $26,700 → Confirmed → Fulfilled
  Invoice: Sent → Paid ✓
  Subscription: Maintenance Pro (Monthly $100) → Active

[OPERATIONS]
  Tasks: delivery coordination + invoice follow-up → Completed
  Time Tracking: 2.5h deal + 1h support = 3.5h billable
  Support Case: Unit 7 failure → Escalated → Resolved ✓
  Process Workflow: Enterprise Onboarding (5 steps) → Step 1 done, Step 2 escalated
  Workflow Automation: Deal Won → auto-Task created ✓
  Workflow Campaign: Enterprise segment enrolled

[AFTER-SALES]
  Delivery: DHL shipped → Delivered ✓ (+ Failed delivery tested)
  Equipment: 3 units registered (ACME-ESP-001/002/003) → notes, status change
  Work Order: Installation (240 min) → Completed ✓ (+ Monthly maintenance Draft)
  Return: Unit 7 defective → Inspected (Failed) → Replaced ✓ (+ Rejected path tested)
  Onboarding: 6 milestones → Blocked/Unblocked tested → Completed ✓

[ENGAGEMENT]
  NPS: score 9 (Promoter) + 6 (Passive) + 3 (Detractor) → breakdown verified
  CSAT: triggered post-support case

[INTELLIGENCE]
  Analytics: all KPIs populated — leads, revenue, pipeline, funnel, heatmap
  AI Actions: 1 approved, 1 rejected, undo tested
  Ops Dashboard: all after-sales metrics visible
  Win/Loss: 1 Won + 1 Lost with reason
  Forecasting: weighted pipeline from 3 test deals
```

---

# Common Gotchas

| Symptom | What to check |
|---|---|
| Stage gate blocks you unexpectedly | Check required fields on that stage in Pipelines |
| Approval never moves past Step 1 | Step 2 approver (sales@acme-test.com) hasn't approved — re-approve as admin |
| Delivery page is empty | Shipment must be created via API against an ORDER_ID first |
| Returns page is empty | Same — POST to `/crm/orders/{orderId}/returns` first |
| Work order stuck on Draft | No assignee set — advance manually via Status tab or check rotation pool |
| Onboarding "Complete" button missing | Not all milestones checked — count them, progress bar must be 100% |
| Duplicate not detected | Dedup runs on matching email — use the exact same email address |
| AI summary shows "not available" | No real transcript linked — this is expected in dev without a real call |
| Custom fields not showing on forms | Field must be created for the correct entity type in Custom Fields page |
| Assignment rotation not working | Check that the rotation pool includes at least 1 member and is saved |
| Time period approval fails | Must be Submitted before it can be Approved — check current status |
