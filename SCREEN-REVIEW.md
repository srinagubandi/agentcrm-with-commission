# All-screen implementation and verification plan

1. Compare the screen inventory in both exports. Use the new 1440px and 390px earnings frames for earnings. Use the original frames for the other mapped routes.
2. Match the shared workspace shell and components, including the top utility area, section navigation, status labels, numeric cells, fields, buttons, and desktop and touch sizes. Preserve the profile and sign-out actions.
3. Rebuild the sales board controls and attribution cards. Verify stage filtering, list navigation, return to board, referral entry and role scope.
4. Apply the shared components to overview, clients and agreements, earnings, commissions, owners and expenses, users, reports, settings, profile, login, previews, retry, error and print views. Keep financial data and permitted actions tied to the signed-in user.
5. Inspect every primary route in the browser at desktop and mobile widths. Check role-specific pages, scrolling, headings, profile access and logout. Rerun the financial, permissions, persistence and workflow suite.
6. Distinguish missing source frames from implementation discrepancies in the final handoff. Publish after CI and check the Railway release.
