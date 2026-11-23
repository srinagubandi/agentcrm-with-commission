# AgentCRM — missing Stitch designs

Use the original 15-screen ZIP and the newer two-screen earnings ZIP together. The newer desktop and mobile earnings layouts are canonical. Keep the Fiscal Trust colors, Inter typography and Material Symbols. Use fictional people and accounts throughout.

## Create these first

| Priority | Requested frames | Required content and interactions |
| --- | --- | --- |
| 1 | Sign-in and expired session | Email and password, invalid credentials, retry after rate limiting, return to sign-in after logout. Include keyboard focus and mobile autofill. |
| 1 | My profile and avatar | Initials fallback, existing photo, choose/replace/remove, saving, success, unsupported file, oversize file and interrupted upload. Show a real 192px square crop preview and accessible status feedback. |
| 1 | Reports workspace | Choose a report, set client and period filters, choose visible columns, save/remove a view, no matches, table overflow, CSV/JSON downloads and print preview. Show distinct admin, partner and owner visibility. |
| 1 | Settings and audit history | Monthly payout day, validation for invalid day, audit table with actor and timestamp, empty history and read-only access. |
| 1 | Financial entry preview, correction and retry | Before/after fee, receipt, refund, adjustment and payout values. Show confirm, cancel, stale edit, retained input after an invalid batch, and an actionable error. |
| 1 | Standalone errors | Permission denied, missing client/invoice, expired session and stale form. Show the appropriate route back and sign-out on authenticated pages. |
| 2 | Monthly close and settlement detail | Client and month, frozen totals, who closed the period, later corrections, cash versus commission and download. Include owner-only reporting. |
| 2 | Transaction history and payout allocation drill-down | Original payment, refund, commission correction, exact reversal, historical estimate versus recorded allocation, and one payout covering several invoices. |
| 2 | Payout batch approval concept | Separate future draft, submitted, returned, stale, approved and recorded states. Include an independent reviewer, changing balance, and duplicate submission. Mark these as proposed features. |

## Mobile and role variants

The exports already include mobile references for overview, pipeline, client detail and earnings. Create 390px and 320px frames for the **commission review queue, owner waterfall, owner-only statement, fee-tier editor, split vendor invoice, user directory and role permissions, and partner portal**. Include a tablet frame showing when the workspace rail collapses. Show how users reach every permitted destination in the bottom navigation.

For mixed roles, supply an owner-plus-referrer example with separate earnings totals and a Super User with reporting access. Ownership varies by client. Use two clients and give the second client a different owner. Include the no-clients, no-partners and no-payouts states. Show long names, negative money amounts and more than five participants.

## Existing screens that need implementation comparison

The existing exports already define sales attribution cards, deal list, referral intake, overview attention queue, client agreement and tier screens, commission review, owners, partner portal, user permissions and split-invoice modal. Reuse those designs. Engineering still needs page-by-page screenshot overlays for exact spacing, density and frame-specific details. Some mockups show invented operational percentages, verified statuses and bank integrations. Specify real data sources or an empty/unavailable state for each such field.

## Deliverables

For each new design, return editable screens, HTML and PNG, the route, role, viewport width/height, browser zoom and the synthetic fixture values. Include normal, empty, validation, success, read-only and keyboard-focus states where applicable. Label interactive controls with their destination. Provide one index pairing each desktop frame with its mobile frame and tracking any proposed feature separately.
