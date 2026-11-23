# AgentCRM Stitch comparison

Release 0.5.8 covers 20 distinct frames. The two later earnings exports contain identical HTML. The original earnings views are retained as historical comparisons. Source PNG sizes can differ from the viewport widths in their filenames.

Each row compares an actual Chrome capture using a synthetic account with the supplied PNG at its native raster dimensions. Different pixels includes content, whitespace, scroll length, glyph rendering and viewport differences. It is not a design quality score. The exported sign-in PNG appears unstyled while its HTML specifies the centered branded form.

| Frame | Route or state | Role | Raster | Different pixels |
|---|---|---|---|---:|
| client detail alder studio | /clients  | admin | 439 × 1600 | 82.33% |
| client detail desktop | /clients  | admin | 1158 × 1600 | 70.66% |
| commission review payouts desktop | /commissions  | admin | 1779 × 2022 | 67.49% |
| equity owner revenue sharing desktop | /owners  | admin | 1779 × 2118 | 64.02% |
| fee agreements tier editor desktop | /clients terms | admin | 1047 × 1600 | 84.55% |
| monthly earnings alder studio | /earnings  | admin | 357 × 1600 | 78.17% |
| monthly earnings desktop | /earnings  | admin | 1600 × 1525 | 66.67% |
| overview | /  | admin | 442 × 1600 | 59.38% |
| overview desktop | /  | admin | 1436 × 1600 | 58.52% |
| owner share reports desktop | /owners  | owner | 1291 × 1600 | 72.17% |
| partner portal morgan reed | /  | partner | 1600 × 1446 | 73.28% |
| sales pipeline | /sales  | admin | 432 × 1600 | 73.40% |
| sales pipeline desktop | /sales  | admin | 1140 × 1600 | 78.67% |
| split vendor invoice modal desktop | /owners expense | admin | 1600 × 1280 | 92.22% |
| user management roles desktop | /people  | admin | 1337 × 1600 | 80.58% |
| canonical monthly earnings reconciliation desktop 1440px | /earnings  | admin | 1108 × 1600 | 65.43% |
| monthly earnings reconciliation mobile 390px | /earnings  | admin | 409 × 1600 | 76.92% |
| reports workspace export studio | /reports  | super | 1600 × 1481 | 72.76% |
| settings payout schedule audit | /settings  | admin | 1352 × 1600 | 78.35% |
| sign in expired session recovery | /login?reason=expired  | signed out | 1600 × 1280 | 90.09% |

## Remaining differences

Client and owner ledgers, commission rows, report filters and directory records use the actual synthetic ledger. The agreement and vendor split editors support adding and removing tier and allocation rows. Differences remain in the full-page agreement layout, agreement simulation, allocation preview and modal placement. The sales board uses the configured sales stages. Mobile views retain the app’s role-scoped navigation. The sign-in form uses actual authentication states and makes no claim of draft restoration, certifications or connected banking.

## Additional design assets

Supply a rendered sign-in screenshot that matches the exported HTML, the original CSS viewport and zoom for tall screenshots, and a fixture manifest with the exact role, client, month and records per frame. Profile upload, standalone errors and financial corrections still need dedicated frames.
