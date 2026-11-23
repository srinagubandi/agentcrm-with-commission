# Changelog

## 0.1.0 — 2026-11-22 — synthetic demo candidate
- Implemented agreement versions, fixed and performance fees, marginal and whole-period tiers, allocated receipts, referral commissions, refunds and manually recorded payouts.
- Added client-specific owners, expense allocation, reserve and client-isolated monthly loss carryforward.
- Added six seeded synthetic identities, session login, independent admin and Super User permissions, scoped partner and owner views, preference approval, write audit and optimistic revision checks.
- Connected sales pipeline, duplicate flag, linking won referrals, stage history, client directory, agency reports and role administration.
- Applied the supplied Stitch typography, teal palette, responsive navigation, cards and ledger layout to server-rendered pages.

### Review, fixes and verification
- Financial tests cover rounding, tiers, pooled/individual splits, historical receipt stability, refund limits, expense reconciliation, loss recovery and payout bounds.
- Review found shared-pool setup could underspecify active allocations. Added full-pool validation when configuring participants.
- Role tests check all six logins, private views, denied writes, CSRF protection, stale replay rejection, partner preference approval and restart persistence. Moved the integration-test scratch database under the working directory after the initial OS-temp startup check failed.
- Local acceptance command: npm test. Eight automated tests passed before upload.
- Deployment, durable volume and live-account verification are independent release checks. See the release report for observed status.


### Second review
- Found that a backdated payout could draw on receipts recorded for later dates. Restricted referral payout availability to collections received by its payout date. For owner payouts, only completed monthly periods are available.
- Added regression coverage for future collections, a shared vendor bill counted once, duplicate referrals linked to one existing client with stage history, and an agency-absorbed refund.
- Final local suite: 12 passed, 0 failed. Independently signed in using each of the six delivered sample passwords and received HTTP 200 for each authenticated overview.
- Release gate: GitHub upload approval was declined before file transfer. Remote revision, Railway deployment, volume and public login checks are pending. The local demo uses synthetic data.

## 0.2.0 — 100 reporting slices

- Added 20 role-scoped ledgers, each delivered in five incremental capabilities: scoped records, keyword search, month filter, typed sorting and filtered CSV export. Captured the per-slice source hash and four automated review/check results in slice-log.jsonl.
- Connected the reports to authenticated routes and permission checks on both page and export. Added spreadsheet text neutralization, HTML escaping, cent-based amounts, empty states and visible report controls.
- Added client creation, notes, contact carryover, account provisioning, admin audit history and pre-save financial previews. Corrections are linked to original receipts and appear separately on partner statements.
- Resolved empty retainer input overriding agreement defaults, decimal precision ambiguity, unsafe intermediate multiplication on large refunds, future agreement display and referral assignment to a non-partner.
- The release verification exercises the packaged source. Production deployment, browser-level visual comparison and independent human review are pending.

## 0.3.0 — 300 additional slices

- Activated 15 reporting capabilities on each of the 20 existing CRM reports. All operate after role scoping.
- Added authenticated print and JSON routes, selected-column CSV downloads, accessible server-rendered report controls and user-specific saved report views.
- Review decisions: clamp invalid page numbers, validate calendar dates, use inclusive month overlap, keep complete exports independent of page size, escape user inputs, and recheck report access when loading a saved view.
- Verification: 300 new capability tests plus 113 existing domain, report and HTTP tests passed locally. The HTTP suite also exercises saved-view isolation and restricted print/JSON exports. Automated checks are recorded separately from live deployment or human UI review.

## 0.4.0 — payout corrections and financial regression coverage

Backdated partner and owner payouts now use funds available on the payment date and preserve funds needed for later recorded payouts. Admins can schedule a payout on any day from 1 through 31. When the following month is shorter, scheduled commission reports display its last calendar day.

The release adds two production fixes and 9,999 distinct synthetic regression cases. Each of nine families has 1,111 unique financial input sets. The per-case ledger records inputs, observed and expected values, two automated code-contract checks and two automated skeptic checks. The cases exercise shared implementations. Their count measures regression coverage, not independently implemented features. The two production fixes have separate review records. Run npm test with Node.js 24 to replay the suite.

## 0.5.0 — finance review and sales handoff

- Added draft receipt commissions, admin approval with review, and approval-aware partner statements and payout limits. Existing receipts without a status remain approved.
- Added previewable external payout batches. A failing line leaves the entire batch unsaved. Duplicate recipient, earnings type and reference combinations are rejected.
- Added admin client-period close with SHA-256 evidence, settlement totals and a per-client write lock through the selected month. Draft commissions must be approved before close. Post later corrections in an open month.
- Added equal and sales-weighted vendor bill allocation alongside exact dollar splits. Sales weights come from the qualifying sales on fee entries in the bill month.
- Carries up to five referral partners from the won opportunity to client attribution. Agreement rates remain separately configurable. Duplicate client names require linking to the existing client.
- Enabled owners to submit masked payout preference requests. Scoped partner statements and exports to commission amounts and withheld agency fee bases and rates.

### Verification

- Code review 1 checked calculations, persisted data shape and compatibility with existing SQLite data.
- Code review 2 checked role enforcement, report exports, form entry points, preview and confirmation.
- Skeptic review 1 exercised rounding, no-sales months, future payment commitments and partial batch failures.
- Skeptic review 2 exercised duplicate payout references, draft isolation, cross-client edits, unauthorized approvals and persisted state after restart.

## Hosted verification — 2026-11-22 UTC
- Application release: merged GitHub commit `62fd4e25df728beb46408fe0e61cb8ea42360a2e` from pull request #1. Existing README and design brief were retained; the private login CSV was not committed.
- Railway: dedicated `AgentCRM Synthetic Demo` project, `production` environment, service `agentcrm-demo`, GitHub branch `main`, root directory at repository root, persistent volume mounted at `/data`.
- HTTPS URL: https://agentcrm-demo-production.up.railway.app. The `/health` endpoint returned HTTP 200 with `{"status":"ok","database":true}`.
- Node.js 24.22.3: `npm test` passed all 12 bundled tests. Railway built the supplied Node.js 24 Dockerfile and deployed the merged application revision successfully.
- All six accounts signed in and signed out. The admin opened settings, recorded a fictional fee and payment, and verified the commission effect. The first partner submitted a fictional referral and opened the commission statement; the second partner could not see that referral. The owner report showed only the owner's clients. The Super User saw agency reports without admin editing controls; the principal saw the reports and admin controls.
- The same application revision was redeployed successfully (initial deployment `2374d230-99ab-43a1-b52f-b018418fc77c`; redeployment `cf6b1515-c4e0-48e3-ad80-85b4f963521c`). The fictional referral remained present for the first partner and absent from the second partner after redeployment, verifying persistence and isolation.
- The hosted instance contains synthetic demonstration data only. Do not store the private login CSV in the public repository.
