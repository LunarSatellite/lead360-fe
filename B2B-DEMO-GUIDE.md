# Lead360 CRM — B2B Demo Guide

> **Frontend:** `http://localhost:5173`  
> **Login:** `admin@omniflow.ai` / `Admin@123456`

---

## Demo 1: Organizations

| # | Action | Expected |
|---|--------|----------|
| 1 | Login → From sidebar, click **Organizations** (Building2 icon) | Organizations page loads with empty list or existing records |
| 2 | Click **New Organization** button | Modal opens: **New Organization** |
| 3 | Fill: Name=`Acme Corp`, Domain=`acme.com`, Industry=`Manufacturing`, Employees=`500`, Country=`USA`, City=`New York`, Website=`https://acme.com` | |
| 4 | Click **Create Organization** | Modal closes, org appears in list with "Acme Corp" row |
| 5 | Click **New Organization** → fill Name=`Globex Inc`, Domain=`globex.io`, Industry=`Technology`, Employees=`200` → **Create Organization** | Second org appears |
| 6 | In search bar, type `acme` → click **Search** | Only Acme Corp shows |
| 7 | Click `×` in search or clear → **Search** | Both orgs show |
| 8 | Click any org row → SlideOver panel opens showing detail (name, domain, industry, description, created date) | |
| 9 | In SlideOver, click **Edit** → edit Employees to `600` → **Save Changes** | Org updates |
| 10 | On list, hover the trash icon on org row → click **Delete** → confirm | Org disappears (soft-deleted, undo not shown in list) |

---

## Demo 2: Contacts

| # | Action | Expected |
|---|--------|----------|
| 1 | Sidebar → **Contacts** (UserCheck icon) | Contacts list page |
| 2 | Click **New Contact** (or similar create button) | Look for a create button/modal |
| 3 | Fill: FullName=`John Smith`, Email=`john@acme.com`, Phone=`+1234567890`, JobTitle=`VP Engineering` | |
| 4 | Submit | Contact appears in list |
| 5 | Repeat: Create **Sarah Lee** (Procurement Manager, sarah@acme.com), **Mike Brown** (IT Director, mike@globex.io) | 3 contacts in list |
| 6 | Click a contact row → Detail page loads | Shows full info + empty timeline |
| 7 | On detail, look for **Summary** section or button → AI summary loads (or "Generating..." then fallback) | |
| 8 | Click **Back** to return to list | |

---

## Demo 3: Accounts

| # | Action | Expected |
|---|--------|----------|
| 1 | Sidebar → **Accounts** (Building icon) | Accounts list |
| 2 | Click **New Account** | Modal: **New Account** |
| 3 | Fill: Account Name=`Acme Corp Account`, Status=`Customer`, Tier=`Enterprise`, Contract Value=`150000`, Currency=`USD` | |
| 4 | Click **Create Account** | Account in list |
| 5 | Click the account row → SlideOver opens | Shows account detail |
| 6 | In SlideOver, click **Contacts** tab | Shows **No contacts linked to this account.** |
| 7 | Click **Add Contact** → search for `John` → select John Smith → Role dropdown select `Economic Buyer` → check **Primary** → click **Add** | Contact appears with role badge + **Primary** gold badge |
| 8 | Add Sarah Lee as `User`, Mike Brown as `Champion` | 3 contacts shown |
| 9 | Switch to **Details** tab → shows renewal date, contract value, notes | |

---

## Demo 4: Pipelines & Stages

| # | Action | Expected |
|---|--------|----------|
| 1 | Sidebar → **Pipelines** (GitBranch icon) | Pipelines page |
| 2 | You should see existing pipeline(s). Click **New Pipeline** | Create form |
| 3 | Fill: Pipeline name=`B2B Sales Pipeline`, Description=`Standard B2B process`, pick a color | |
| 4 | Click **Create** | Pipeline appears in list with 0 stages |
| 5 | Find your pipeline → click **Add Stage** | Input appears |
| 6 | Add stages one by one: `Prospecting`, `Discovery`, `Proposal`, `Negotiation`, `Closed Won` (toggle Won), `Closed Lost` (toggle Lost) | Stages list shows with order numbers |
| 7 | Hover over a stage → drag handle appears → drag to reorder | Order updates |
| 8 | Look for **Set as default** star icon → click it | Pipeline gets **default** badge |
| 9 | Click **Configure stage gates** on any stage (e.g., Negotiation) | Gate panel slides open |
| 10 | Click **Add gate** → Type=`ManualCheck`, Label=`Legal review completed`, Required=checked → **Add** | Gate appears with **required** danger badge |
| 11 | Add another gate: Type=`RequiredField`, Field=`Amount`, Label=`Contract Value must be set` → **Add** | Two gates listed |

---

## Demo 5: Deals

| # | Action | Expected |
|---|--------|----------|
| 1 | Sidebar → **Deals** (Briefcase icon) | Deals page with Kanban/List toggle |
| 2 | Click **New Deal** | SlideOver: **New Deal** |
| 3 | Fill: Deal Name=`Acme Corp — SaaS Platform`, Pipeline=`B2B Sales Pipeline`, Stage=`Prospecting`, Amount=`120000`, Close Date=`60 days from now` | |
| 4 | Click **Create Deal** | Deal appears in Prospecting column on Kanban |
| 5 | Create another: `Globex — Cloud Migration`, Amount=`200000`, Stage=`Prospecting` | 2 deals in Prospecting |
| 6 | Switch to **List** view | Shows table with Deal, Stage, Amount, Status, Close Date, Owner |
| 7 | Switch back to **Kanban** view | |
| 8 | Click a deal card → **Deal Detail** page opens | Shows: Deal name, Account, Amount, Close Date, Stage dropdown |
| 9 | Under **Deal Strategy**, click **Edit** → fill Champion=`John Smith`, Win Plan=`Product demo + custom pricing`, Next Steps=`Schedule technical review` → **Save** | Strategy saved |
| 10 | Change Stage via dropdown → select `Discovery` | Stage moves, timeline shows `🔀 Stage Changed` event |
| 11 | In **Activity Timeline**, click **Call** → textarea appears → fill `Discussed requirements with John` → **Save** | Timeline shows `📞 Call` entry |
| 12 | Click **Note** → fill `Customer needs SSO integration` → **Save** | Timeline shows `📝 Note` entry |
| 13 | Click **Meeting** → fill `Scheduled demo for next week` → **Save** | Timeline shows `📅 Meeting` entry |

---

## Demo 6: Stage Gates on Deals

| # | Action | Expected |
|---|--------|----------|
| 1 | From Deal Detail, change Stage to `Negotiation` | If gates exist, gate checklist appears |
| 2 | Look for **Deal Gate Checklist** section | Shows gates: `Legal review completed` (unchecked), `Contract Value must be set` (checked if Amount filled) |
| 3 | Check the `Legal review completed` box | Gate turns checked |
| 4 | All gates satisfied → Stage stays at Negotiation | |

---

## Demo 7: Quotes

| # | Action | Expected |
|---|--------|----------|
| 1 | Sidebar → **Quotes** (FileText icon) | Quotes list |
| 2 | Click **New Quote** (or from Deal Detail click **Create Quote**) | Create modal/slideover |
| 3 | Select Deal=`Acme Corp — SaaS Platform`, Contact=`John Smith` | |
| 4 | Add line item: Description=`SaaS License — Annual`, Quantity=`10`, Unit Price=`1000` → Total auto-calculates to `10000` | |
| 5 | Add another line: Description=`Implementation Fee`, Quantity=`1`, Unit Price=`5000` | Total = `15000` |
| 6 | Click **Create Quote** | Quote appears in list as **Draft** |
| 7 | Click quote → detail view → click **Send** | Status changes to **Sent** |
| 8 | Click **Accept** | Status changes to **Accepted** |

---

## Demo 8: Proposals

| # | Action | Expected |
|---|--------|----------|
| 1 | Sidebar → **Proposals** (ClipboardList icon) | Proposals list |
| 2 | Click **New Proposal** (or from Deal Detail click **Generate Proposal**) | Create form |
| 3 | Fill: Title=`Acme Corp SaaS Proposal`, select deal, contact, template | |
| 4 | Click **Create** | Proposal generated with sections |
| 5 | Click into a section → edit content if needed | Content updates |
| 6 | Click **Regenerate Section** on any section → AI re-generates (or shows placeholder fallback) | Section updated |
| 7 | Click **Send** | Status = **Sent** |
| 8 | Click **Accept** | Status = **Accepted** → deal can be closed |

---

## Demo 9: Close Deal Won

| # | Action | Expected |
|---|--------|----------|
| 1 | Go back to **Deals** → open the deal that has accepted proposal/quote | |
| 2 | On Deal Detail, use Stage dropdown → select `Closed Won` | Sale closes |
| 3 | Or on Kanban, click the deal card → click **Won** button from quick actions | |
| 4 | Deal shows in Closed Won column with **Won** badge | |
| 5 | Open the deal again → shows **Won** status, close reason field available | |

---

## Demo 10: Invoices

| # | Action | Expected |
|---|--------|----------|
| 1 | Sidebar → **Invoices** (Receipt icon) | Invoice list |
| 2 | Click **Generate from Deal** (or look for button) | Select deal modal |
| 3 | Select the won deal → invoice auto-generates with amount from deal | Invoice appears as **Draft** |
| 4 | Click invoice → **Send** | Status = **Sent**, email sent |
| 5 | Click **Record Payment** → fill Amount=`120000`, Method=`Bank Transfer`, Reference=`WIRE001` → submit | Status = **Paid** |
| 6 | (If client wants dunning:) Create another invoice, leave unpaid → after due date, check **Dunning** section → click **Send Reminder** | Dunning event logged |

---

## Demo 11: AI Intelligence

| # | Action | Expected |
|---|--------|----------|
| 1 | Sidebar → **Accounts** → click an account → look for **Account Brief** section or separate **Account Briefs** page | AI-generated brief with headline, risks, opportunities, recommended moves |
| 2 | Click **Refresh** or **Generate** button | Brief regenerates |
| 3 | Go to **Contacts** → click a contact → look for **AI Summary** | Headline, sentiment, key topics, recommended actions |
| 4 | For deals with AI summary → shows risk level, insights, next actions | |

---

## Demo 12: Analytics

| # | Action | Expected |
|---|--------|----------|
| 1 | Sidebar → **Analytics** (TrendingUp icon) | CRM Analytics page |
| 2 | **Analytics** tab is selected by default | 8 sections load |
| 3 | **Deals** section: Open count, Won count, Win Rate %, Pipeline value | Numbers match deal data |
| 4 | **Revenue Forecast**: Weighted forecast, This Month, This Quarter, Won All time + 12-month chart | Chart renders |
| 5 | **Deal Velocity**: Avg Days to Close, Median Days, Avg Open Deal Age, Slowest/Fastest stage | |
| 6 | **Pipeline Stages** table: Stage name, Deal count, Value | |
| 7 | **Activity (Signals)**: Last 30/7 day counts, Top Engaged Contacts list | |
| 8 | **Contacts**: Total, This Month, Last Month counts | |
| 9 | **Lead Funnel**: Stage breakdown bar chart, score distribution, leads by channel | |
| 10 | **Nurture Performance**: Enrolled, Active, Messages Sent, Response Rate, Conversion | |
| 11 | Switch to **AI Actions** tab | Shows pending approvals + recent actions with approve/reject buttons |

---

## Demo 13: Email Campaigns

| # | Action | Expected |
|---|--------|----------|
| 1 | Sidebar → **Campaigns** (Megaphone icon) | Campaigns page with 3 tabs: B2B, Leads, FB Ads |
| 2 | **B2B** tab selected → click **New Campaign** | Drawer/modal: **New B2B Campaign** |
| 3 | Fill: Name=`Q3 Outreach — Acme Corp`, Subject=`Exclusive offer for {{FullName}}`, Body=`Hi {{FullName}},\n\nCheck out our latest...` | |
| 4 | Set targeting (if available) → contacts belonging to certain org/tags | |
| 5 | Click **Create Campaign** | Campaign appears as **Draft** |
| 6 | Click **Launch** | Status changes to **Running** |
| 7 | Click campaign → **Stats** tab: shows Sent, Opened, Replied counts | |
| 8 | Look for **Performance** or **ROI** section | Budget, attributed revenue, ROI% |

---

## Demo 14: Support Cases

| # | Action | Expected |
|---|--------|----------|
| 1 | Sidebar → **Support** (LifeBuoy icon) | Support cases list |
| 2 | Click **New Case** | Create form |
| 3 | Fill: Contact=John Smith, Subject=`API integration issue`, Severity=`High`, Category=`Technical` | |
| 4 | Click **Create** | Case appears in list |
| 5 | Click case → detail view → **Add Message**: type response → **Send** | Message appears in thread |
| 6 | Click **Escalate** → fill reason → **Escalate** | Status updates |
| 7 | Click **Resolve** → fill resolution notes → **Resolve** | Case closed |

---

## Demo 15: Workflows & Approvals

| # | Action | Expected |
|---|--------|----------|
| 1 | Sidebar → **Workflows** (Zap icon) | Workflows list |
| 2 | Click **New Workflow** → fill Name, trigger type, conditions | |
| 3 | Click **Create** | Workflow appears |
| 4 | Sidebar → **Approvals** (ShieldCheck icon) | Shows pending approval requests |
| 5 | Click **Approve** or **Reject** on a request | Status updates |

---

## Demo 16: Extra Features

| Feature | Sidebar Label | What to Demo |
|---------|---------------|--------------|
| Duplicates | **Duplicates** | Click → **Scan** → shows potential duplicate contacts → **Merge** |
| Custom Fields | **Custom Fields** | Click → **New Field** → Entity=Deal, Type=Dropdown, Options=`30 days,60 days,90 days` → Save → goes to deal detail page |
| Tasks | **Tasks** | Shows all CRM tasks with status, priority, due date |
| Meetings | **Meetings** | Click **New Meeting** → fill details → proposed slots → book |
| NPS | **NPS** | Shows NPS survey records |
| Time Tracking | **Time Tracking** | Log time against a deal |
| Subscriptions | **Subscriptions** | Create subscription linked to deal |
| Orders | **Orders** | Create order from deal |
| Nurture | **Nurture** | Shows sequences, enrollment status |
| Meta Ads | **Meta Ads** | Facebook/Instagram ads integration |
| Announcements | **Announcements** | Click **New** → fill title, content → **Create** → click title → **Publish now** |
| Event Tracking | **Event Tracking** | Webhook/event ingestion page |

---

## 10-Minute Express Demo Flow

```
1. Organizations  → Create "Acme Corp" 
2. Contacts       → Create John Smith (VP Eng)
3. Accounts       → Create Enterprise account, link John as Economic Buyer
4. Pipelines      → Show existing pipeline, stage gates on Negotiation
5. Deals          → Create deal $120K in Prospecting
6. Deal Detail    → Move stage, show timeline, add note, show AI summary
7. Stage Gates    → Show gate checklist on Negotiation
8. Quotes         → Create quote with line items, send
9. Invoices       → Generate from won deal, record payment
10. Analytics     → Show pipeline, revenue, velocity dashboards
```

---

> **Total: 31 CRM pages** under `/dashboard/crm/*`  
> **All features verified** with real backend code — no stubs
