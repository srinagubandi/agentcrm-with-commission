# AgentCRM with Commission | Google Stitch design brief

## Prompt for Stitch

Design a responsive CRM for a small agency that wins clients through referral partners. The agency can earn a retainer, a performance fee, a sales commission, or a combination. Two to five partners may share in one client's monthly agency earnings. Make it easy for an owner to answer “Which deals need follow-up?” and “For this month, what did we collect, who gets paid, and why?” Produce connected, editable UI designs and a clickable prototype. Railway is the planned application host. Use fictional data throughout.

## Start with one journey

An account manager records a referral, adds two more partners to the opportunity, and schedules a follow-up. When the deal is won, carry its contacts, notes and partner attribution into the client record. At month end the owner enters the fees collected, previews the partner amounts, approves them, and records an external payout. Opening a partner's statement should lead back to the client, month and calculation that produced each line.

## A worked example to use across every screen

Use the fictional client Alder Studio and the period October 2026. The client generates $40,000 in qualifying sales. The agency earns a 5% performance fee ($2,000) plus a $3,000 retainer. Assume both fees were collected in October. The agency earnings available for the example split are $5,000. Label client sales, agency fees and partner commissions separately so nobody applies a partner rate to $40,000 by mistake.

| Recipient | Share of eligible agency earnings | October amount |
| --- | ---: | ---: |
| Morgan Reed | 10% | $500 |
| Jules Lane | 5% | $250 |
| Sam Cole | 2.5% | $125 |
| Agency retains before other expenses | 82.5% | $4,125 |

Show $875 due across three partners. When Morgan's $500 payout is recorded, show $500 paid and $375 outstanding. Keep the $875 earned visible. These fictional USD amounts illustrate the individual-rate method. Also design the shared-pool method described below.

## Screens to design

| Screen | What the user sees and does |
| --- | --- |
| Overview | Default to the current month. Prioritize overdue follow-ups, then earnings awaiting review and approved commissions awaiting payment. Clicking a count opens the corresponding filtered list. Label pipeline estimates separately from collected fees. |
| Sales pipeline | Desktop board and mobile list. Use New Referral → Contacted → Discovery → Proposal → Negotiation, closing as Won or Lost. Cards show prospect, referrer, owner, next action and due date. Offer a keyboard-accessible stage menu alongside drag and drop. The new referral form needs only a company, contact and referring partner to start. |
| Client detail | Header with owner and contact. Tabs for Activity, Partner terms and Monthly earnings. Show the next follow-up and chronological notes. Winning a deal should open the linked client without re-entering data. |
| Partner terms | Editable rows for partner, rate, eligible fee types and effective dates. Show the basis in words beside each rate and preview dollars for the selected month. Design examples with two and five partners, plus a direct client with none. Treat five as a layout test, pending a decision on limits. Flag duplicate or overlapping terms and shares above 100%. |
| Monthly earnings | Filter by client and month. Enter each fee separately with type, amount collected, date and optional reference. For a performance fee, show the sales basis and agency rate beside the calculated fee. For other deals allow a known fee to be entered directly. Put partner-by-partner arithmetic and the agency remainder next to the inputs. |
| Commission review and payouts | Show Draft, Approved and Paid as distinct states. Group amounts by partner with client-level detail. Open a review before approval. Record payment date, amount and reference after money moves externally. Design a correction to a prior month as a visible adjustment linked to the original entry. |
| Partner record and portal | Internal record shows contacts, referred deals, active clients and commission history. For the required partner login, show a partner signed in to their own referrals and monthly statement. Omit other partners' rates, agency margins and internal notes from this view. |

## Visual and interaction direction

Use a compact left navigation on desktop with Overview, Sales, Clients, Partners and Commissions. Use the client name and selected period as persistent context on financial screens. Use warm white surfaces, dark charcoal type, one deep teal action color and tabular numerals for amounts. Keep totals right-aligned. Reserve amber for items needing attention and pair every status color with text. Prefer a readable ledger over charts when the user needs to reconcile dollars.

At desktop width, display the monthly inputs and split preview side by side. On a 390 px phone, stack the same content in reading order, put totals above expandable partner rows, and keep the primary action reachable. Provide visible keyboard focus, labeled controls and inline error messages. Design an empty pipeline, a month with no collections, an incomplete split, an approved month viewed after a rate change, and a failed save that retains the user's entries.

## Requested design handoff

Return named desktop and mobile frames, reusable components for a deal card, partner-rate row, earnings line, status badge and payout row, plus typography, spacing and color values. Link two prototype paths end to end: referral to won client, and collected fee to partner statement. Include the two-partner and five-partner variants and one validation-error frame. Annotate which values are entered, calculated, or visible only to staff. The sample October amounts must reconcile on every frame.

## Confirmed launch workflows

- Agency admin and partner have separate signed-in views. Partners submit referrals, track their own status, and see their commission calculations, adjustments, paid amounts and balances. Keep other partners’ identities and rates private. Route potential duplicate referrals to an admin who chooses whom to credit and sets the shares.
- The admin selects eligible fee types and split method per client. Support independent rates and a shared pool. Give each partner-client agreement its own start date and optional end date. In a pool example, $5,000 collected × 15% creates a $750 pool. A partner with a 40% allocation earns $300. Show this partner only their own calculation.
- An admin can enter a known agency fee directly or derive it from qualifying client sales and the agency rate. Give fees and payments separate forms. A fee alone creates no payable partner commission.
- Manual entry is the launch workflow for client receipts and external partner payouts. Record payer, payee, date, amount, method, status and reference. Match each client receipt to the fees it covers. Show a partial collection example: $2,500 collected against $5,000 of eligible fees earns $250 for a 10% partner. Collecting the remaining balance adds another $250.
- Schedule payouts for the prior month on one agency-wide monthly day selected by the admin. Show next due date and unpaid balance. Recording an external payout updates the partner statement. Use “Record payout” as the action label.
- For each refund, preview the original partner allocation. Let the admin choose whether the agency absorbs the refund or deducts the associated commission from a future payout. Link the adjustment to the original receipt.
- Store each partner’s preferred payout method and payout identifier. Partners can submit changes. Display both the effective preference and pending request to the agency admin. Continue using the approved preference until the admin approves the replacement.

## Additional frames for the prototype

Include partner referral submission and tracking, admin duplicate review, client fee eligibility and split setup, monthly schedule settings, manual receipt allocation, partial payment, refund review, partner statement, and payout-preference approval. Show these as connected steps or drawers where appropriate. Keep personal and financial sample data fictional.


## Fee agreements and rate history

Design an agreement editor with fixed fees, flat percentages and sliding scales. Allow a monthly retainer alongside a flat or tiered performance fee. Default sliding scales to marginal tiers, with a whole-month option per agreement. Preview both methods using $60,000 in sales and a 5% rate through $50,000 followed by 7% above it. The marginal fee is $3,200 and the whole-month fee is $4,200. Show the retainer separately.

Give each partner a default rate for the client with an optional override per eligible fee type. Allocate partial receipts proportionally across the outstanding fees they cover. Allow the admin to override that allocation before saving. Preview a $2,500 receipt against a $3,000 retainer and $2,000 performance fee. Allocate $1,500 and $1,000 respectively. At partner rates of 10% and 15%, the commission is $150 plus $150, totaling $300.

Give each rate change an effective date. On a recorded receipt, display the terms used when its commission was recorded. A later rate change preserves that calculation. Show any correction as a separate dated adjustment linked to the original payment on the partner statement.
