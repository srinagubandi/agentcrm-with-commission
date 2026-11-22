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

## Hosted verification — 2026-11-22 UTC
- Application release: merged GitHub commit `62fd4e25df728beb46408fe0e61cb8ea42360a2e` from pull request #1. Existing README and design brief were retained; the private login CSV was not committed.
- Railway: dedicated `AgentCRM Synthetic Demo` project, `production` environment, service `agentcrm-demo`, GitHub branch `main`, root directory at repository root, persistent volume mounted at `/data`.
- HTTPS URL: https://agentcrm-demo-production.up.railway.app. The `/health` endpoint returned HTTP 200 with `{"status":"ok","database":true}`.
- Node.js 24.22.3: `npm test` passed all 12 bundled tests. Railway built the supplied Node.js 24 Dockerfile and deployed the merged application revision successfully.
- All six accounts signed in and signed out. The admin opened settings, recorded a fictional fee and payment, and verified the commission effect. The first partner submitted a fictional referral and opened the commission statement; the second partner could not see that referral. The owner report showed only the owner's clients. The Super User saw agency reports without admin editing controls; the principal saw the reports and admin controls.
- The same application revision was redeployed successfully (initial deployment `2374d230-99ab-43a1-b52f-b018418fc77c`; redeployment `cf6b1515-c4e0-48e3-ad80-85b4f963521c`). The fictional referral remained present for the first partner and absent from the second partner after redeployment, verifying persistence and isolation.
- The hosted instance contains synthetic demonstration data only. Do not store the private login CSV in the public repository.
