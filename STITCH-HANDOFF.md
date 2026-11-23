# AgentCRM design requests for Stitch

Use the 15 original HTML/PNG pairs in stitch_partner_commission_agency_crm.zip and the accompanying Fiscal Trust DESIGN.md. The application tracks agency fees, referral commissions, client-specific ownership and recorded external payments. Design with fictional records.

## Existing screen map

| App location | Original Stitch screen family | What needs a design decision |
| --- | --- | --- |
| Agency Overview | overview, overview_desktop | Resolve how the attention queue, reconciliation ledger and workspace actions reflow at tablet and phone sizes. Specify destinations and empty states for each action. |
| Partner Overview | partner_portal_morgan_reed | Fit personal disbursements, referrals, and a masked payment preference into one column. Show a partner who also owns a share of one client. |
| Sales pipeline | sales_pipeline, sales_pipeline_desktop | Show all seven real stages, an empty lane, a long company name and a duplicate-referral warning. Define keyboard movement and mobile stage navigation. |
| Clients and agreements | client_detail_alder_studio, client_detail_desktop, fee_agreements_tier_editor_desktop | Show effective-dated terms and overlapping roles. Provide the edit, validation, preview and success states for fixed, percentage and marginal/whole-month tiers. |
| Monthly earnings | monthly_earnings_alder_studio, monthly_earnings_desktop | Set the canonical version. Preserve the fee cards on the left and partner breakdown on the right. Place the client, period, invoice history and receipt-entry form so it is clear which records each filter controls. |
| Commissions | commission_review_payouts_desktop | Include draft, approved, paid, negative adjustment and reversal. Show a single payment covering two invoices. Indicate saved allocation versus a historical estimate. |
| Owners | equity_owner_revenue_sharing_desktop, owner_share_reports_desktop, split_vendor_invoice_modal_desktop | Provide agency-wide and owner-only variants of the waterfall. Include prior loss, reserve, shared expense, closed month and a client with no owner distribution. |
| People | user_management_roles_desktop | Show multiple role assignments, independent Super User designation, masked payment preferences and restricted control states. |
| Reports, settings, sign-in | Separate designs requested | Supply report filter, mobile results, saved-view naming, print, monthly payout day, role-specific sign-in error and empty states. |

## Priority 1 — Earnings and reconciliation

Design a 1440px view and 390px companion for Alder Studio. In October the seeded client has $3,000 fixed fees and $2,000 performance fees collected. Morgan earns $600 and Jules earns $250 under the saved agreement. The agency retains $4,150 before expenses. Show the invoice reference, payment reference, amount and date whenever a number links to history. The right-hand summary must identify whether it covers earned commission, approved commission or paid commission.

Provide separate frames for a partial collection, an externally recorded refund that leaves an invoice settled, a refund that reopens the balance, a zero-cash commission correction and a period with no activity. Fees received and refunds must reconcile to net cash. When refunds have no saved split between fixed and performance fees, show a separate refund line. Include a reference for a long client name and a negative amount. Specify how to enter a receipt and return to its original client and period.

## Priority 2 — Proposed payout batch approval

Design the proposed draft, submitted, returned, approved and recorded states. Show who prepared and reviewed each batch. Client owners vary by client. Approval permission comes from an explicit designation. Illustrate a stale batch after a refund, a repeated submission, an empty batch and a recorded batch with a correction. Provide the recipient statement view separately from agency controls. This is a design request for a future workflow.

## Priority 3 — Shared shell and responsive components

Specify the exact font files and permitted distribution, icon family and weights, sidebar width, header height, content gutters, card padding, shadows, and breakpoints. Include a route-to-icon list, active and keyboard-focus states, reduced-motion behavior, touch target sizes and accessible table captions. Specify whether search and notification controls need functional destinations. The current implementation has a simpler header and rail than the export.

Deliver desktop, tablet and 320/390px phone frames. Give each data table either an accessible scroll region or a designed stacked representation. Include modals on small screens, validation summaries, empty-state actions and expiring-session recovery. Show what happens at 200% text size.

## Return package

Return editable Stitch screens, one HTML and PNG per approved frame, the Fiscal Trust tokens, local asset filenames and a screen-to-route index. Mark the canonical frame when two original screens depict the same route. Include the exact screenshot width, height, browser zoom, font settings and synthetic data for repeatable overlay comparisons. Label proposed interactions with their intended destination and required role.
