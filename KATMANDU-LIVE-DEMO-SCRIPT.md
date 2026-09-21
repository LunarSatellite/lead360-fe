# Lead360 — Live Demo Director's Script
### Katmandu Coffee · Wholesale & Trade

> **The one job of this demo:** make them *feel* the cost of running wholesale on spreadsheets — then watch that pain disappear, click by click, inside Lead360.
>
> **Frontend:** `http://localhost:5173` · **Login:** `admin@omniflow.ai` / `Admin@123456`
> **Runtime:** 12 min core + optional closers · **Hero story:** win **Himalayan Brew Café** from a cold lead to a paid, *recurring* order.

---

## How to use this script

Each beat has four lines:
- **🎬 DO** — exactly what to click.
- **🗣️ SAY** — say this, near-verbatim. The bold line is the one that lands.
- **🎯 WHY** — the pain you're killing (say it only if they look skeptical).
- **✨ WOW** — the moment to slow down, stop talking, and let them react.

**Golden rules of the room**
1. **Talk about their café, never "the system."** Say "Himalayan Brew," not "the account entity."
2. **Tee up every reveal.** Never click in silence — say what's about to happen, *then* show it.
3. **After a WOW, shut up.** Let the silence do the selling. Count to three.
4. **Tie clicks to their words.** When they mention a pain in the opening chat, callback to it: *"Remember you said cafés go quiet? Watch this."*

---

## ⏱️ Pre-flight (do this before they walk in)

- [ ] Logged in, dashboard open, **one full dry run done** so forms are warm and the AI brief is cached.
- [ ] Opening deck (`client-demo-opening.html`) on **slide 12** ("Let's win a wholesale café"), fullscreen (press `F`).
- [ ] Zoom browser to **110–125%** so the back of the room can read it.
- [ ] A second tab already on **Analytics** (pre-loaded — charts render instantly when you switch).
- [ ] Phone/notifications off. One monitor, one story.
- [ ] Know your fallback line if the AI is slow (see Failure Recovery at the bottom).

---

## 🎙️ COLD OPEN — 30 seconds, before you touch the keyboard

> *Stand up. Don't look at the screen. Look at them.*

**🗣️ SAY:**
> *"Before I click anything — one question. When a café that used to order from you every three weeks suddenly goes quiet… who notices, and how long does it take?"*
>
> *(let them answer — it's usually 'a while' or an awkward laugh)*
>
> **"That gap — between a customer slipping and someone noticing — that's where your wholesale revenue leaks. Everything I'm about to show you exists to close that gap. Let's win a café and never lose it."**

> *Now hand off from deck slide 12 → live app.*

---

# ACT I — Build the relationship (≈3 min)

### Beat 1 · Organization — "the café itself"

**🎬 DO:** Organizations → **New Organization** → `Himalayan Brew Café`, F&B, Kathmandu, 25 employees → **Create**.

**🗣️ SAY:** *"New café walks in the door. One record — and from now on every order, every conversation, every rupee they spend hangs off this. No more 'which spreadsheet was that in?'"*

**🎯 WHY:** Their context lives in five places today. This is the single source of truth.

---

### Beat 2 · Contacts — "a café isn't one person"

**🎬 DO:** Contacts → create `Anish Shrestha` (Owner) and `Maya Gurung` (Head Barista) → open Anish → show **AI Summary**.

**🗣️ SAY:** *"The owner signs the cheque. The head barista decides if your beans actually get used. You sell to both."* → *(open AI Summary)* → **"And before any rep calls Anish, they read this — sentiment, what he cares about, the recommended next move. Five seconds, fully briefed."**

**✨ WOW:** Pause on the AI Summary. *"Your newest hire now sounds like your most experienced rep."*

---

### Beat 3 · Account + roles — "who signs vs. who pours"

**🎬 DO:** Accounts → **New Account** `Himalayan Brew — Wholesale`, Status `Customer`, Tier `Wholesale` → open it → Contacts tab → add Anish as **Economic Buyer + Primary**, Maya as **Champion**.

> 💡 *Leave the contract-value field blank, or ask the client what a typical café contract looks like and type their number live — it makes the demo feel like theirs. Never invent a figure.*

**🗣️ SAY:** *"Now the relationship has structure. Anish is the economic buyer. Maya is your champion on the floor. When you walk into a renewal, you know exactly who to win over — and who already loves you."*

---

# ACT II — Run the deal your way (≈3.5 min)

### Beat 4 · Pipeline & stage gates — "your standards, enforced"

**🎬 DO:** Pipelines → `Wholesale Supply Pipeline` (Prospecting → Sample Sent → Proposal → Negotiation → Won/Lost). On **Negotiation** → stage gates → add `ManualCheck: Sample tasting approved` (Required) + `RequiredField: Amount`.

**🗣️ SAY:** *"Every café gets a sample before a contract — that's your rule. So we make it a* ***gate.*** *A deal physically cannot reach 'Won' until the tasting is approved and pricing is locked."*

**🎯 WHY:** Stops juniors from skipping steps and giving away margin. Your process, not their improvisation.

**✨ WOW:** *"This is the difference between a CRM that* ***stores*** *your process and one that* ***protects*** *it."*

---

### Beat 5 · Deal — "the opportunity, on a board"

**🎬 DO:** Deals → **New Deal** `Himalayan Brew — House Blend Supply`, Prospecting, close ~45 days → show on **Kanban**, flick to **List**, back to Kanban.

> 💡 *If you enter an amount, ask the client for a realistic café-deal size and use theirs. Otherwise leave it — the board works fine without a number.*

**🗣️ SAY:** *"Every café deal, every value, one board. Your sales lead opens this Monday morning and sees the entire wholesale pipeline in ten seconds — no status meeting required."*

---

### Beat 6 · Deal detail — "the whole story in one place"

**🎬 DO:** Open deal → **Deal Strategy**: Champion `Maya`, Win Plan `Free sample + machine lease`, Next Steps `Book tasting`. **Timeline** → add **Call** (`~40kg/month`), **Note** (`wants medium roast`), **Meeting** (`tasting next week`). Change stage → `Sample Sent` (auto-logs).

**🗣️ SAY:** *"Watch the timeline build. Every call, every note, the tasting, the stage change — automatically on the record. Your rep quits next month? The next person picks up this café without missing a beat."*

**🎯 WHY:** Knowledge walking out the door is their single biggest hidden risk. This kills it.

---

# ACT III — The AI moment (≈2 min) — *this is your headline. Slow down.*

### Beat 7 · AI Account Brief — "your best salesperson, on every account"

**🎬 DO:** Open the Account → **Account Brief** → **Generate/Refresh**. Wait for it. Read it aloud.

**🗣️ SAY:** *(tee it up first)* *"You have one salesperson who just* ***knows*** *each café — what's at risk, where the next sale is. Imagine that instinct on* ***every*** *account, refreshed automatically."* → *(generate, then read the real output)* → **"Headline. Risks. Opportunities. The recommended next move. The AI read every interaction on this account and wrote this."**

**✨ WOW:** Stop talking. Let them read it. Then: *"That's not a chatbot bolted on the side. That's the AI that watches the café you'd otherwise forget about."*

**🎯 WHY (the kill shot):** *"Remember the question I opened with — who notices when a café goes quiet? This does. Automatically. Before they leave."*

---

# ACT IV — Quote to cash (≈3 min)

### Beat 8 · Quote — "beans + equipment, sent in a minute"

**🎬 DO:** Quotes → **New Quote** → Deal + Anish → line `House Blend Beans 10kg` (Qty 4) → line `Espresso Machine (lease setup)` (Qty 1) → **Create** → **Send** → **Accept**.

> 💡 *Best move: turn to the client and ask "what would you actually charge for this?" — type their price live. The totals auto-calculate and the demo becomes unmistakably theirs. If they don't want to share, leave unit prices at 0 — the flow (Draft → Sent → Accepted) is the point, not the number.*

**🗣️ SAY:** *"Beans and the machine on one quote, totalled automatically, sent, accepted — and it stays welded to the deal. No Word doc, no 'which version did we send?'"*

---

### Beat 9 · Gates + Close Won — "it only closes when it's clean"

**🎬 DO:** Deal → stage `Negotiation` → **Gate Checklist** appears → tick `Sample tasting approved` (Amount already satisfied) → stage `Closed Won`.

**🗣️ SAY:** *"Watch — the gates appear. Tasting approved? Check. Price set? Check. Now, and* ***only*** *now, it closes Won. Every deal you close is auditable and clean."*

**✨ WOW:** *"No more 'why did this close without a contract?' It can't."*

---

### Beat 10 · Invoice & payment — "quote to cash, one flow"

**🎬 DO:** Invoices → **Generate from Deal** → Send → **Record Payment** (amount auto-fills from the deal/quote), Method `Bank Transfer`, Reference `WIRE-HB001` → **Paid**.

**🗣️ SAY:** *"Won deal becomes an invoice in one click, sent, paid, tracked. And the invoice that* ***doesn't*** *get paid? Lead360 sends the dunning reminders for you. You stop being your own collections department."*

---

### Beat 11 · Subscription — "the part that makes you rich" 💰

**🎬 DO:** Subscriptions/Orders → create `House Blend 10kg every 3 weeks` linked to the deal.

**🗣️ SAY:** **"Here's the whole game. A café doesn't buy once — it reorders forever. We just turned a one-time deal into recurring, predictable, forecastable revenue. This single subscription is worth more than the deal we just closed."**

**✨ WOW:** *"One café. Now multiply it by every wholesale account you have."*

---

# ACT V — The leadership view (≈1.5 min)

### Beat 12 · Analytics — "what you take to the board"

**🎬 DO:** Switch to the pre-loaded **Analytics** tab. Sweep: Deals → **Revenue Forecast** (weighted + 12-mo chart) → Deal Velocity → Pipeline Stages → **Nurture / Signals** → **AI Actions** tab (approve/reject queue).

**🗣️ SAY:** *"This is your Monday-morning view. Weighted forecast, what's accelerating, what's slipping."* → *(AI Actions tab)* → **"And here — the AI suggests the moves, your team approves them. The AI never acts behind your back. It proposes; you decide."**

---

## 🏁 THE CLOSE — stand up again, screen off if you can

**🗣️ SAY:**
> *"In twelve minutes we took a café from a cold lead to a paid order, turned it into recurring revenue, and put an AI on watch so it never quietly slips away."*
>
> **"You sell some of the best coffee in Nepal. This is the system that makes sure the business behind it is just as good — every account, every reorder, every cup."**
>
> *"The next step is small: a two-week pilot on* ***your*** *real cafés, not demo data. Shall we set it up?"*

> *Stop. Let them respond. The first person to talk after the ask loses — make it them.*

---

## 🥊 Objection handling (have these ready)

| If they say… | You respond… |
|---|---|
| *"We already use spreadsheets / WhatsApp."* | *"And they work — until a café goes quiet and nobody notices. Spreadsheets store; they don't* ***watch.*** *That's the gap we just closed."* |
| *"Looks complex for my team."* | *"Your rep only ever sees one screen — the deal in front of them. We onboard the team in days, on your real accounts. Complexity is ours; simplicity is theirs."* |
| *"Is the AI making decisions for us?"* | *"Never. Look at the AI-Actions tab — it* ***proposes,*** *a human* ***approves.*** *You stay in control of every customer-facing move."* |
| *"What about our data / who hosts it?"* | *"Your data, multi-tenant isolated, soft-delete and full audit trail on every record. We'll walk your technical team through the architecture right after this."* |
| *"How long to go live?"* | *"Pilot in two weeks with your real accounts. Full team live in days after that — not months."* |

---

## ➕ Optional closers (only if they're leaning in)

- **Campaigns** → B2B tab → `New Single-Origin — Hotel Buyers`, show sent/open/reply + ROI. *"Market to every hotel buyer at once, see exactly who bit."*
- **Nurture** → a sequence auto-warming cold café leads. *"Leads that aren't ready yet stay warm without a human touching them."*
- **Support Cases** → `Grinder issue at Café Y` → escalate → resolve. *"After-sale problems tracked to resolution, not lost in WhatsApp."*
- **Meetings / Booking** → public page for a tasting or barista-school slot. *"Cafés book a tasting themselves — no phone tag."*
- **Omnichannel + Flow Builder** → the WhatsApp bot. *"A bot takes wholesale reorders on WhatsApp at 2am — your busiest cafés never wait."*

---

## 🆘 Failure recovery (stay calm, narrate it)

- **AI brief slow / shows "Generating…":** *"This is running live against the model right now — in production it's cached, instant."* Keep talking; it'll land. Have the dry-run brief on a second tab as backup.
- **A create form errors:** *"I'll grab the one I prepped earlier"* → switch to the pre-seeded record. Never debug on stage.
- **Lost your place:** jump to **Beat 7 (AI brief)** or **Beat 11 (subscription)** — those two alone sell the product.
- **Wifi dies:** the opening deck (`client-demo-opening.html`) is 100% offline — narrate the feature-alignment slides until you're back.

---

### Source of truth
Field names, exact button labels and sidebar icons are in **`B2B-DEMO-GUIDE.md`** (Demos 1–16). If a label differs in the build, that file wins.

> 💰 **No prices anywhere — on purpose.** We never invent rupee figures; guessing wrong in front of a coffee owner reads as fake. Leave amount/unit-price fields blank, **or** ask the client for their real numbers and type them in live so the demo becomes unmistakably *theirs*. The flow is the story — the number is theirs to give.
