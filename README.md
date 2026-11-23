# AgentCRM with Commission

## Rehearse recovery

Use Node.js 24 to run `node recovery-copy.js <source SQLite file> <new restore directory>`. The command snapshots the source transactionally, checks the copy's integrity, and clears its sign-in sessions. The destination must be a new directory. Keep recovery copies private because they contain ledger records and account verifiers.

Start a separate test process with `DATA_DIR` pointing at the restore directory and a different `PORT`. Verify all six role sign-ins, compare client balances and partner/owner payout exports with the source, and check a closed period. The live volume remains attached to the existing service during the rehearsal.

## Start locally

Use Node.js 24. From this folder run npm test, then npm start. Open http://localhost:3000/login. The six synthetic accounts use the private demo login sheet distributed with the original release. New accounts can be added by an agency admin under People.

## Railway

Upload the extracted project files to the repository root. Connect the repository to a Railway service using the included Dockerfile, attach one persistent volume at /data, and create an HTTPS domain. Use a single application replica with this SQLite release. Verify /health, each demo login and persisted entries after restarting the service. This archive was tested locally. Hosted deployment and live verification remain pending.

## Workflows

Sales handles referrals, overlap review, stages and conversion. Clients holds versioned partner and owner agreements and notes. Monthly earnings records fees, previews allocations, posts cash receipts and links refunds and corrections. Commissions shows individual statements, payout preferences and external payouts. Owner shares reconciles net earnings, expenses, carried losses, distributions and reserves. The admin directory manages new users and super-user access.

Reports includes 20 ledgers. Each has a scoped record view, keyword search, month filter, column sorting and filtered CSV download. Month filtering uses the date named above the control. The monthly activity ledger shows net movement during that month. Scheduled commissions show accrued commissions by scheduled due date. Recorded payouts and outstanding balances are separate views.

## Review evidence

See slice-log.jsonl for the 100 sequential slice records, including catalog hashes and automated checks for each pass. Review dimensions cover the output contract, rendered entry point, cross-role isolation and boundary cases. Run npm test to replay all 100 capability checks, the domain regressions and the HTTP role/persistence integration test. See TEST-RESULTS.txt for packaged release verification.

The demo uses synthetic identities and fictional earnings. Keep the private login CSV and SQLite database outside public source control.

## Release 0.3.0 — reporting and reconciliation

This release adds 300 reporting slices to the previous 100. Each of the 20 financial and sales reports gains 15 independently exercised capabilities. Report options include calendar year and quarter, inclusive start and end dates, exact inclusion and exclusion, grouped and monthly totals, column selection, page size and navigation, projected CSV, printable full results, JSON export and baseline-month comparison. Save frequently used report configurations under My saved views.

Date filters use the report's first column. Monthly records overlap each day in their month. A comparison keeps the non-date filters and uses the selected baseline month. Monetary JSON fields use integer cents and percentage fields use basis points, with units identified by column. Exports and printing include all matching records across pages. Report options apply to the records visible to the signed-in user.

The previous slice log covers 1–100. The new slice-log-101-400.jsonl records each incremental activation, its configuration hash, two automated code checks and two automated skeptical checks. These checks exercise contracts, rendered controls, permission boundaries and feature-specific edge cases. Run npm test to reproduce the final 413 local checks. No hosted deployment was verified for this archive.

## Release 0.4.0

Run npm test to replay all 10,414 tests. See CHANGELOG.md for the two payout changes. The nine synthetic scenario families cover fees, receipt allocations, partner pools, eligibility dates, refunds, corrections, client-specific owner loss recovery, payout chronology and scheduled dates. Read slice-log-401-10401.jsonl.gz for the four checks and results for each new slice. All monetary test amounts are integer cents unless explicitly converted to a decimal amount for entry.

## Release 0.5.0

New web receipts with positive referral commissions start in Draft. In Commissions, an agency admin reviews and approves them before the payout can include them. Batch recording uses a single external method and date with a separate recipient, type, amount and reference per row. The same reference may be shared across different recipients.

In Owner shares, an admin can close a completed client period after reviewing the settlement. The close locks dated ledger entries and agreements through the chosen month for that client. Close is an explicit admin step. Late corrections use an open period. Equal splits divide the bill among selected clients. Sales-weighted splits use the qualifying sales recorded on fee entries in the bill month.

In Sales pipeline, choose up to four additional referral partners on an opportunity. The won client displays the resulting attribution. Use its agreement to set commission eligibility and rates.

Demo sign-in accounts and the SQLite format carry forward from 0.4.0. Use the private credential sheet for synthetic sign-in. The deployment health response includes the release in its X-AgentCRM-Version header.
