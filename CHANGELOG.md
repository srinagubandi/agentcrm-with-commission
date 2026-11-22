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
