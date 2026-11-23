# AgentCRM 0.5.1 skeptic review

The live AgentCRM application code ran in a browser against a disposable SQLite database with six fictional accounts. A separate HTTP test run used its own fixture, compared version 0.5.0 with the release, and verified API and persistence behavior.

| Account | Browser checks passed | HTTP loop cases passed | Boundary reviewed |
| --- | ---: | ---: | --- |
| Agency Admin | 75 | 75 | Agency reporting, payout references, receipt approval and period close |
| Referral Partner | 75 | 75 | Own commission breakdown, saved views and reporting access |
| Second Referral Partner | 75 | 75 | Independent scope from the first partner |
| Client Owner | 75 | 75 | Own distributions, payout history and masked preference |
| Super User | 75 | 75 | Agency reporting and separation of administrative write actions |
| Principal | 75 | 75 | Combined owner and administrator permissions |

The browser evidence covers nine page checks, three observations for each of 20 reports, and six account and saved-view checks per role. Report observations cover what appeared on the page and whether print and JSON links were available. The HTTP matrix also exercised the three export endpoints directly, including CSV, and tested writes and rejected submissions.

### Before and after

The 0.5.0 HTTP baseline failed in loops 72, 74, 75, 80, 150, 155, 225, 231, 300, 375, 449 and 450. The 0.5.1 matrix passed those same cases and the remaining matrix. See the JSON Lines log for the role and outcome of every case.

### Review passes

1. Checked agreement between the page, export and server authorization rules.
2. Checked that single and batch entry share payout validation and still honor the available balance and atomic batch behavior.
3. Compared both partner views against each other and against agency views. Checked that directory navigation never substitutes another client for an unavailable selection.
4. Checked mask validation, browser reload and logout, existing data compatibility and SQLite restart.

Run `npm test` on Node.js 24 to reproduce the HTTP and domain checks. Browser evidence records the rendered workflows observed during this release. All browser writes used the disposable database.
