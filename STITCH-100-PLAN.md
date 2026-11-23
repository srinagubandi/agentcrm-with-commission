# Stitch refinement plan

Baseline is AgentCRM 0.5.4 plus the unpublished workspace changes. Use synthetic records for browser runs. Each numbered loop starts with its plan below. Execute in order, perform a design review and a workflow review, challenge the result at the specified width, fix failures and rerun before advancing. Record measured results and any fixes. Desktop exports supply visual references. Phone layouts preserve the same information hierarchy.

## Loop 1 — Monthly earnings / Desktop composition

Reference: agentcrm_monthly_earnings_desktop/screen.png and code.html. Route: /earnings. Width: 1440 px.

Use the selected client’s receipts and invoice references in the composition and partner breakdown. Compare the primary region with the named export and render its mapped heading. Skeptic review: Look for a generic table replacing the primary content. Acceptance: Mapped section is present and visible.

## Loop 2 — Monthly earnings / Navigation

Reference: agentcrm_monthly_earnings_desktop/screen.png and code.html. Route: /earnings. Width: 1440 px.

Use the selected client’s receipts and invoice references in the composition and partner breakdown. Follow the current route and inspect its sidebar selection. Skeptic review: Check for duplicate selections or an incorrect destination. Acceptance: Exactly one current page link matches the route.

## Loop 3 — Monthly earnings / Surface and type

Reference: agentcrm_monthly_earnings_desktop/screen.png and code.html. Route: /earnings. Width: 1440 px.

Use the selected client’s receipts and invoice references in the composition and partner breakdown. Measure the canvas, typeface and navigation rail against Fiscal Trust. Skeptic review: Check that legacy styling has not overridden the export tokens. Acceptance: Canvas is #fbf8fc and Inter is the first declared font.

## Loop 4 — Monthly earnings / Ledger or card surface

Reference: agentcrm_monthly_earnings_desktop/screen.png and code.html. Route: /earnings. Width: 1280 px.

Use the selected client’s receipts and invoice references in the composition and partner breakdown. Inspect the first content surface and its wrapping behavior. Skeptic review: Check if content blends into the canvas or extends offscreen. Acceptance: Primary section has a distinct surface and fits within main.

## Loop 5 — Monthly earnings / Tablet

Reference: agentcrm_monthly_earnings_desktop/screen.png and code.html. Route: /earnings. Width: 820 px.

Use the selected client’s receipts and invoice references in the composition and partner breakdown. Render at a narrow tablet width with the desktop rail. Skeptic review: Check whether the rail squeezes the document wider than the viewport. Acceptance: Document width fits the viewport.

## Loop 6 — Monthly earnings / Phone

Reference: agentcrm_monthly_earnings_desktop/screen.png and code.html. Route: /earnings. Width: 390 px.

Use the selected client’s receipts and invoice references in the composition and partner breakdown. Render at a common mobile width and inspect the rail and content. Skeptic review: Check for horizontal page scrolling or a fixed sidebar covering content. Acceptance: Main starts inside the viewport and document width fits.

## Loop 7 — Monthly earnings / Small phone

Reference: agentcrm_monthly_earnings_desktop/screen.png and code.html. Route: /earnings. Width: 320 px.

Use the selected client’s receipts and invoice references in the composition and partner breakdown. Render at 320 CSS pixels and inspect the page edges. Skeptic review: Try the narrowest common layout where ledger tables could overflow. Acceptance: The document fits and tables scroll within their container.

## Loop 8 — Monthly earnings / Keyboard access

Reference: agentcrm_monthly_earnings_desktop/screen.png and code.html. Route: /earnings. Width: 1024 px.

Use the selected client’s receipts and invoice references in the composition and partner breakdown. Move keyboard focus to the skip link and activate it. Skeptic review: Check that the link can be reached and reaches the intended content. Acceptance: Skip link receives focus and its destination exists.

## Loop 9 — Monthly earnings / Data and access

Reference: agentcrm_monthly_earnings_desktop/screen.png and code.html. Route: /earnings. Width: 1280 px.

Use the selected client’s receipts and invoice references in the composition and partner breakdown. Check the role-specific financial or workflow content using seeded accounts. Skeptic review: Check for another recipient’s private data, missing financial values or a missing agency control. Acceptance: The screen-specific data assertion passes.

## Loop 10 — Monthly earnings / Forms and actions

Reference: agentcrm_monthly_earnings_desktop/screen.png and code.html. Route: /earnings. Width: 390 px.

Use the selected client’s receipts and invoice references in the composition and partner breakdown. Inspect available controls, forms, labels and placeholder destinations. Skeptic review: Check for inert prototype controls, unlabeled inputs or unsafe submissions. Acceptance: Form actions are local, inputs have labels and POST forms have session protection.

## Loop 11 — Commission review / Desktop composition

Reference: agentcrm_commission_review_payouts_desktop/screen.png and code.html. Route: /commissions. Width: 1440 px.

Keep approved, held and paid amounts distinguishable. Compare the primary region with the named export and render its mapped heading. Skeptic review: Look for a generic table replacing the primary content. Acceptance: Mapped section is present and visible.

## Loop 12 — Commission review / Navigation

Reference: agentcrm_commission_review_payouts_desktop/screen.png and code.html. Route: /commissions. Width: 1440 px.

Keep approved, held and paid amounts distinguishable. Follow the current route and inspect its sidebar selection. Skeptic review: Check for duplicate selections or an incorrect destination. Acceptance: Exactly one current page link matches the route.

## Loop 13 — Commission review / Surface and type

Reference: agentcrm_commission_review_payouts_desktop/screen.png and code.html. Route: /commissions. Width: 1440 px.

Keep approved, held and paid amounts distinguishable. Measure the canvas, typeface and navigation rail against Fiscal Trust. Skeptic review: Check that legacy styling has not overridden the export tokens. Acceptance: Canvas is #fbf8fc and Inter is the first declared font.

## Loop 14 — Commission review / Ledger or card surface

Reference: agentcrm_commission_review_payouts_desktop/screen.png and code.html. Route: /commissions. Width: 1280 px.

Keep approved, held and paid amounts distinguishable. Inspect the first content surface and its wrapping behavior. Skeptic review: Check if content blends into the canvas or extends offscreen. Acceptance: Primary section has a distinct surface and fits within main.

## Loop 15 — Commission review / Tablet

Reference: agentcrm_commission_review_payouts_desktop/screen.png and code.html. Route: /commissions. Width: 820 px.

Keep approved, held and paid amounts distinguishable. Render at a narrow tablet width with the desktop rail. Skeptic review: Check whether the rail squeezes the document wider than the viewport. Acceptance: Document width fits the viewport.

## Loop 16 — Commission review / Phone

Reference: agentcrm_commission_review_payouts_desktop/screen.png and code.html. Route: /commissions. Width: 390 px.

Keep approved, held and paid amounts distinguishable. Render at a common mobile width and inspect the rail and content. Skeptic review: Check for horizontal page scrolling or a fixed sidebar covering content. Acceptance: Main starts inside the viewport and document width fits.

## Loop 17 — Commission review / Small phone

Reference: agentcrm_commission_review_payouts_desktop/screen.png and code.html. Route: /commissions. Width: 320 px.

Keep approved, held and paid amounts distinguishable. Render at 320 CSS pixels and inspect the page edges. Skeptic review: Try the narrowest common layout where ledger tables could overflow. Acceptance: The document fits and tables scroll within their container.

## Loop 18 — Commission review / Keyboard access

Reference: agentcrm_commission_review_payouts_desktop/screen.png and code.html. Route: /commissions. Width: 1024 px.

Keep approved, held and paid amounts distinguishable. Move keyboard focus to the skip link and activate it. Skeptic review: Check that the link can be reached and reaches the intended content. Acceptance: Skip link receives focus and its destination exists.

## Loop 19 — Commission review / Data and access

Reference: agentcrm_commission_review_payouts_desktop/screen.png and code.html. Route: /commissions. Width: 1280 px.

Keep approved, held and paid amounts distinguishable. Check the role-specific financial or workflow content using seeded accounts. Skeptic review: Check for another recipient’s private data, missing financial values or a missing agency control. Acceptance: The screen-specific data assertion passes.

## Loop 20 — Commission review / Forms and actions

Reference: agentcrm_commission_review_payouts_desktop/screen.png and code.html. Route: /commissions. Width: 390 px.

Keep approved, held and paid amounts distinguishable. Inspect available controls, forms, labels and placeholder destinations. Skeptic review: Check for inert prototype controls, unlabeled inputs or unsafe submissions. Acceptance: Form actions are local, inputs have labels and POST forms have session protection.

## Loop 21 — Owner distributions / Desktop composition

Reference: agentcrm_equity_owner_revenue_sharing_desktop/screen.png and code.html. Route: /owners. Width: 1440 px.

Keep owner distributions, expenses and available amounts aligned with ledger records. Compare the primary region with the named export and render its mapped heading. Skeptic review: Look for a generic table replacing the primary content. Acceptance: Mapped section is present and visible.

## Loop 22 — Owner distributions / Navigation

Reference: agentcrm_equity_owner_revenue_sharing_desktop/screen.png and code.html. Route: /owners. Width: 1440 px.

Keep owner distributions, expenses and available amounts aligned with ledger records. Follow the current route and inspect its sidebar selection. Skeptic review: Check for duplicate selections or an incorrect destination. Acceptance: Exactly one current page link matches the route.

## Loop 23 — Owner distributions / Surface and type

Reference: agentcrm_equity_owner_revenue_sharing_desktop/screen.png and code.html. Route: /owners. Width: 1440 px.

Keep owner distributions, expenses and available amounts aligned with ledger records. Measure the canvas, typeface and navigation rail against Fiscal Trust. Skeptic review: Check that legacy styling has not overridden the export tokens. Acceptance: Canvas is #fbf8fc and Inter is the first declared font.

## Loop 24 — Owner distributions / Ledger or card surface

Reference: agentcrm_equity_owner_revenue_sharing_desktop/screen.png and code.html. Route: /owners. Width: 1280 px.

Keep owner distributions, expenses and available amounts aligned with ledger records. Inspect the first content surface and its wrapping behavior. Skeptic review: Check if content blends into the canvas or extends offscreen. Acceptance: Primary section has a distinct surface and fits within main.

## Loop 25 — Owner distributions / Tablet

Reference: agentcrm_equity_owner_revenue_sharing_desktop/screen.png and code.html. Route: /owners. Width: 820 px.

Keep owner distributions, expenses and available amounts aligned with ledger records. Render at a narrow tablet width with the desktop rail. Skeptic review: Check whether the rail squeezes the document wider than the viewport. Acceptance: Document width fits the viewport.

## Loop 26 — Owner distributions / Phone

Reference: agentcrm_equity_owner_revenue_sharing_desktop/screen.png and code.html. Route: /owners. Width: 390 px.

Keep owner distributions, expenses and available amounts aligned with ledger records. Render at a common mobile width and inspect the rail and content. Skeptic review: Check for horizontal page scrolling or a fixed sidebar covering content. Acceptance: Main starts inside the viewport and document width fits.

## Loop 27 — Owner distributions / Small phone

Reference: agentcrm_equity_owner_revenue_sharing_desktop/screen.png and code.html. Route: /owners. Width: 320 px.

Keep owner distributions, expenses and available amounts aligned with ledger records. Render at 320 CSS pixels and inspect the page edges. Skeptic review: Try the narrowest common layout where ledger tables could overflow. Acceptance: The document fits and tables scroll within their container.

## Loop 28 — Owner distributions / Keyboard access

Reference: agentcrm_equity_owner_revenue_sharing_desktop/screen.png and code.html. Route: /owners. Width: 1024 px.

Keep owner distributions, expenses and available amounts aligned with ledger records. Move keyboard focus to the skip link and activate it. Skeptic review: Check that the link can be reached and reaches the intended content. Acceptance: Skip link receives focus and its destination exists.

## Loop 29 — Owner distributions / Data and access

Reference: agentcrm_equity_owner_revenue_sharing_desktop/screen.png and code.html. Route: /owners. Width: 1280 px.

Keep owner distributions, expenses and available amounts aligned with ledger records. Check the role-specific financial or workflow content using seeded accounts. Skeptic review: Check for another recipient’s private data, missing financial values or a missing agency control. Acceptance: The screen-specific data assertion passes.

## Loop 30 — Owner distributions / Forms and actions

Reference: agentcrm_equity_owner_revenue_sharing_desktop/screen.png and code.html. Route: /owners. Width: 390 px.

Keep owner distributions, expenses and available amounts aligned with ledger records. Inspect available controls, forms, labels and placeholder destinations. Skeptic review: Check for inert prototype controls, unlabeled inputs or unsafe submissions. Acceptance: Form actions are local, inputs have labels and POST forms have session protection.

## Loop 31 — Client detail / Desktop composition

Reference: agentcrm_client_detail_desktop/screen.png and code.html. Route: /clients. Width: 1440 px.

Keep the selected client’s agreement and referral attribution together. Compare the primary region with the named export and render its mapped heading. Skeptic review: Look for a generic table replacing the primary content. Acceptance: Mapped section is present and visible.

## Loop 32 — Client detail / Navigation

Reference: agentcrm_client_detail_desktop/screen.png and code.html. Route: /clients. Width: 1440 px.

Keep the selected client’s agreement and referral attribution together. Follow the current route and inspect its sidebar selection. Skeptic review: Check for duplicate selections or an incorrect destination. Acceptance: Exactly one current page link matches the route.

## Loop 33 — Client detail / Surface and type

Reference: agentcrm_client_detail_desktop/screen.png and code.html. Route: /clients. Width: 1440 px.

Keep the selected client’s agreement and referral attribution together. Measure the canvas, typeface and navigation rail against Fiscal Trust. Skeptic review: Check that legacy styling has not overridden the export tokens. Acceptance: Canvas is #fbf8fc and Inter is the first declared font.

## Loop 34 — Client detail / Ledger or card surface

Reference: agentcrm_client_detail_desktop/screen.png and code.html. Route: /clients. Width: 1280 px.

Keep the selected client’s agreement and referral attribution together. Inspect the first content surface and its wrapping behavior. Skeptic review: Check if content blends into the canvas or extends offscreen. Acceptance: Primary section has a distinct surface and fits within main.

## Loop 35 — Client detail / Tablet

Reference: agentcrm_client_detail_desktop/screen.png and code.html. Route: /clients. Width: 820 px.

Keep the selected client’s agreement and referral attribution together. Render at a narrow tablet width with the desktop rail. Skeptic review: Check whether the rail squeezes the document wider than the viewport. Acceptance: Document width fits the viewport.

## Loop 36 — Client detail / Phone

Reference: agentcrm_client_detail_desktop/screen.png and code.html. Route: /clients. Width: 390 px.

Keep the selected client’s agreement and referral attribution together. Render at a common mobile width and inspect the rail and content. Skeptic review: Check for horizontal page scrolling or a fixed sidebar covering content. Acceptance: Main starts inside the viewport and document width fits.

## Loop 37 — Client detail / Small phone

Reference: agentcrm_client_detail_desktop/screen.png and code.html. Route: /clients. Width: 320 px.

Keep the selected client’s agreement and referral attribution together. Render at 320 CSS pixels and inspect the page edges. Skeptic review: Try the narrowest common layout where ledger tables could overflow. Acceptance: The document fits and tables scroll within their container.

## Loop 38 — Client detail / Keyboard access

Reference: agentcrm_client_detail_desktop/screen.png and code.html. Route: /clients. Width: 1024 px.

Keep the selected client’s agreement and referral attribution together. Move keyboard focus to the skip link and activate it. Skeptic review: Check that the link can be reached and reaches the intended content. Acceptance: Skip link receives focus and its destination exists.

## Loop 39 — Client detail / Data and access

Reference: agentcrm_client_detail_desktop/screen.png and code.html. Route: /clients. Width: 1280 px.

Keep the selected client’s agreement and referral attribution together. Check the role-specific financial or workflow content using seeded accounts. Skeptic review: Check for another recipient’s private data, missing financial values or a missing agency control. Acceptance: The screen-specific data assertion passes.

## Loop 40 — Client detail / Forms and actions

Reference: agentcrm_client_detail_desktop/screen.png and code.html. Route: /clients. Width: 390 px.

Keep the selected client’s agreement and referral attribution together. Inspect available controls, forms, labels and placeholder destinations. Skeptic review: Check for inert prototype controls, unlabeled inputs or unsafe submissions. Acceptance: Form actions are local, inputs have labels and POST forms have session protection.

## Loop 41 — Pipeline / Desktop composition

Reference: agentcrm_sales_pipeline_desktop/screen.png and code.html. Route: /sales. Width: 1440 px.

Render one stage lane per stage with its own cards and count. Compare the primary region with the named export and render its mapped heading. Skeptic review: Look for a generic table replacing the primary content. Acceptance: Mapped section is present and visible.

## Loop 42 — Pipeline / Navigation

Reference: agentcrm_sales_pipeline_desktop/screen.png and code.html. Route: /sales. Width: 1440 px.

Render one stage lane per stage with its own cards and count. Follow the current route and inspect its sidebar selection. Skeptic review: Check for duplicate selections or an incorrect destination. Acceptance: Exactly one current page link matches the route.

## Loop 43 — Pipeline / Surface and type

Reference: agentcrm_sales_pipeline_desktop/screen.png and code.html. Route: /sales. Width: 1440 px.

Render one stage lane per stage with its own cards and count. Measure the canvas, typeface and navigation rail against Fiscal Trust. Skeptic review: Check that legacy styling has not overridden the export tokens. Acceptance: Canvas is #fbf8fc and Inter is the first declared font.

## Loop 44 — Pipeline / Ledger or card surface

Reference: agentcrm_sales_pipeline_desktop/screen.png and code.html. Route: /sales. Width: 1280 px.

Render one stage lane per stage with its own cards and count. Inspect the first content surface and its wrapping behavior. Skeptic review: Check if content blends into the canvas or extends offscreen. Acceptance: Primary section has a distinct surface and fits within main.

## Loop 45 — Pipeline / Tablet

Reference: agentcrm_sales_pipeline_desktop/screen.png and code.html. Route: /sales. Width: 820 px.

Render one stage lane per stage with its own cards and count. Render at a narrow tablet width with the desktop rail. Skeptic review: Check whether the rail squeezes the document wider than the viewport. Acceptance: Document width fits the viewport.

## Loop 46 — Pipeline / Phone

Reference: agentcrm_sales_pipeline_desktop/screen.png and code.html. Route: /sales. Width: 390 px.

Render one stage lane per stage with its own cards and count. Render at a common mobile width and inspect the rail and content. Skeptic review: Check for horizontal page scrolling or a fixed sidebar covering content. Acceptance: Main starts inside the viewport and document width fits.

## Loop 47 — Pipeline / Small phone

Reference: agentcrm_sales_pipeline_desktop/screen.png and code.html. Route: /sales. Width: 320 px.

Render one stage lane per stage with its own cards and count. Render at 320 CSS pixels and inspect the page edges. Skeptic review: Try the narrowest common layout where ledger tables could overflow. Acceptance: The document fits and tables scroll within their container.

## Loop 48 — Pipeline / Keyboard access

Reference: agentcrm_sales_pipeline_desktop/screen.png and code.html. Route: /sales. Width: 1024 px.

Render one stage lane per stage with its own cards and count. Move keyboard focus to the skip link and activate it. Skeptic review: Check that the link can be reached and reaches the intended content. Acceptance: Skip link receives focus and its destination exists.

## Loop 49 — Pipeline / Data and access

Reference: agentcrm_sales_pipeline_desktop/screen.png and code.html. Route: /sales. Width: 1280 px.

Render one stage lane per stage with its own cards and count. Check the role-specific financial or workflow content using seeded accounts. Skeptic review: Check for another recipient’s private data, missing financial values or a missing agency control. Acceptance: The screen-specific data assertion passes.

## Loop 50 — Pipeline / Forms and actions

Reference: agentcrm_sales_pipeline_desktop/screen.png and code.html. Route: /sales. Width: 390 px.

Render one stage lane per stage with its own cards and count. Inspect available controls, forms, labels and placeholder destinations. Skeptic review: Check for inert prototype controls, unlabeled inputs or unsafe submissions. Acceptance: Form actions are local, inputs have labels and POST forms have session protection.

## Loop 51 — Agency overview / Desktop composition

Reference: agentcrm_overview_desktop/screen.png and code.html. Route: /. Width: 1440 px.

Place the follow-up queue alongside reconciliation on desktop. Compare the primary region with the named export and render its mapped heading. Skeptic review: Look for a generic table replacing the primary content. Acceptance: Mapped section is present and visible.

## Loop 52 — Agency overview / Navigation

Reference: agentcrm_overview_desktop/screen.png and code.html. Route: /. Width: 1440 px.

Place the follow-up queue alongside reconciliation on desktop. Follow the current route and inspect its sidebar selection. Skeptic review: Check for duplicate selections or an incorrect destination. Acceptance: Exactly one current page link matches the route.

## Loop 53 — Agency overview / Surface and type

Reference: agentcrm_overview_desktop/screen.png and code.html. Route: /. Width: 1440 px.

Place the follow-up queue alongside reconciliation on desktop. Measure the canvas, typeface and navigation rail against Fiscal Trust. Skeptic review: Check that legacy styling has not overridden the export tokens. Acceptance: Canvas is #fbf8fc and Inter is the first declared font.

## Loop 54 — Agency overview / Ledger or card surface

Reference: agentcrm_overview_desktop/screen.png and code.html. Route: /. Width: 1280 px.

Place the follow-up queue alongside reconciliation on desktop. Inspect the first content surface and its wrapping behavior. Skeptic review: Check if content blends into the canvas or extends offscreen. Acceptance: Primary section has a distinct surface and fits within main.

## Loop 55 — Agency overview / Tablet

Reference: agentcrm_overview_desktop/screen.png and code.html. Route: /. Width: 820 px.

Place the follow-up queue alongside reconciliation on desktop. Render at a narrow tablet width with the desktop rail. Skeptic review: Check whether the rail squeezes the document wider than the viewport. Acceptance: Document width fits the viewport.

## Loop 56 — Agency overview / Phone

Reference: agentcrm_overview_desktop/screen.png and code.html. Route: /. Width: 390 px.

Place the follow-up queue alongside reconciliation on desktop. Render at a common mobile width and inspect the rail and content. Skeptic review: Check for horizontal page scrolling or a fixed sidebar covering content. Acceptance: Main starts inside the viewport and document width fits.

## Loop 57 — Agency overview / Small phone

Reference: agentcrm_overview_desktop/screen.png and code.html. Route: /. Width: 320 px.

Place the follow-up queue alongside reconciliation on desktop. Render at 320 CSS pixels and inspect the page edges. Skeptic review: Try the narrowest common layout where ledger tables could overflow. Acceptance: The document fits and tables scroll within their container.

## Loop 58 — Agency overview / Keyboard access

Reference: agentcrm_overview_desktop/screen.png and code.html. Route: /. Width: 1024 px.

Place the follow-up queue alongside reconciliation on desktop. Move keyboard focus to the skip link and activate it. Skeptic review: Check that the link can be reached and reaches the intended content. Acceptance: Skip link receives focus and its destination exists.

## Loop 59 — Agency overview / Data and access

Reference: agentcrm_overview_desktop/screen.png and code.html. Route: /. Width: 1280 px.

Place the follow-up queue alongside reconciliation on desktop. Check the role-specific financial or workflow content using seeded accounts. Skeptic review: Check for another recipient’s private data, missing financial values or a missing agency control. Acceptance: The screen-specific data assertion passes.

## Loop 60 — Agency overview / Forms and actions

Reference: agentcrm_overview_desktop/screen.png and code.html. Route: /. Width: 390 px.

Place the follow-up queue alongside reconciliation on desktop. Inspect available controls, forms, labels and placeholder destinations. Skeptic review: Check for inert prototype controls, unlabeled inputs or unsafe submissions. Acceptance: Form actions are local, inputs have labels and POST forms have session protection.

## Loop 61 — User management / Desktop composition

Reference: agentcrm_user_management_roles_desktop/screen.png and code.html. Route: /people. Width: 1440 px.

Show agency roles and keep explicit Super User designation visible. Compare the primary region with the named export and render its mapped heading. Skeptic review: Look for a generic table replacing the primary content. Acceptance: Mapped section is present and visible.

## Loop 62 — User management / Navigation

Reference: agentcrm_user_management_roles_desktop/screen.png and code.html. Route: /people. Width: 1440 px.

Show agency roles and keep explicit Super User designation visible. Follow the current route and inspect its sidebar selection. Skeptic review: Check for duplicate selections or an incorrect destination. Acceptance: Exactly one current page link matches the route.

## Loop 63 — User management / Surface and type

Reference: agentcrm_user_management_roles_desktop/screen.png and code.html. Route: /people. Width: 1440 px.

Show agency roles and keep explicit Super User designation visible. Measure the canvas, typeface and navigation rail against Fiscal Trust. Skeptic review: Check that legacy styling has not overridden the export tokens. Acceptance: Canvas is #fbf8fc and Inter is the first declared font.

## Loop 64 — User management / Ledger or card surface

Reference: agentcrm_user_management_roles_desktop/screen.png and code.html. Route: /people. Width: 1280 px.

Show agency roles and keep explicit Super User designation visible. Inspect the first content surface and its wrapping behavior. Skeptic review: Check if content blends into the canvas or extends offscreen. Acceptance: Primary section has a distinct surface and fits within main.

## Loop 65 — User management / Tablet

Reference: agentcrm_user_management_roles_desktop/screen.png and code.html. Route: /people. Width: 820 px.

Show agency roles and keep explicit Super User designation visible. Render at a narrow tablet width with the desktop rail. Skeptic review: Check whether the rail squeezes the document wider than the viewport. Acceptance: Document width fits the viewport.

## Loop 66 — User management / Phone

Reference: agentcrm_user_management_roles_desktop/screen.png and code.html. Route: /people. Width: 390 px.

Show agency roles and keep explicit Super User designation visible. Render at a common mobile width and inspect the rail and content. Skeptic review: Check for horizontal page scrolling or a fixed sidebar covering content. Acceptance: Main starts inside the viewport and document width fits.

## Loop 67 — User management / Small phone

Reference: agentcrm_user_management_roles_desktop/screen.png and code.html. Route: /people. Width: 320 px.

Show agency roles and keep explicit Super User designation visible. Render at 320 CSS pixels and inspect the page edges. Skeptic review: Try the narrowest common layout where ledger tables could overflow. Acceptance: The document fits and tables scroll within their container.

## Loop 68 — User management / Keyboard access

Reference: agentcrm_user_management_roles_desktop/screen.png and code.html. Route: /people. Width: 1024 px.

Show agency roles and keep explicit Super User designation visible. Move keyboard focus to the skip link and activate it. Skeptic review: Check that the link can be reached and reaches the intended content. Acceptance: Skip link receives focus and its destination exists.

## Loop 69 — User management / Data and access

Reference: agentcrm_user_management_roles_desktop/screen.png and code.html. Route: /people. Width: 1280 px.

Show agency roles and keep explicit Super User designation visible. Check the role-specific financial or workflow content using seeded accounts. Skeptic review: Check for another recipient’s private data, missing financial values or a missing agency control. Acceptance: The screen-specific data assertion passes.

## Loop 70 — User management / Forms and actions

Reference: agentcrm_user_management_roles_desktop/screen.png and code.html. Route: /people. Width: 390 px.

Show agency roles and keep explicit Super User designation visible. Inspect available controls, forms, labels and placeholder destinations. Skeptic review: Check for inert prototype controls, unlabeled inputs or unsafe submissions. Acceptance: Form actions are local, inputs have labels and POST forms have session protection.

## Loop 71 — Partner portal / Desktop composition

Reference: agentcrm_partner_portal_morgan_reed/screen.png and code.html. Route: /. Width: 1440 px.

Limit visible statements to the signed-in recipient. Compare the primary region with the named export and render its mapped heading. Skeptic review: Look for a generic table replacing the primary content. Acceptance: Mapped section is present and visible.

## Loop 72 — Partner portal / Navigation

Reference: agentcrm_partner_portal_morgan_reed/screen.png and code.html. Route: /. Width: 1440 px.

Limit visible statements to the signed-in recipient. Follow the current route and inspect its sidebar selection. Skeptic review: Check for duplicate selections or an incorrect destination. Acceptance: Exactly one current page link matches the route.

## Loop 73 — Partner portal / Surface and type

Reference: agentcrm_partner_portal_morgan_reed/screen.png and code.html. Route: /. Width: 1440 px.

Limit visible statements to the signed-in recipient. Measure the canvas, typeface and navigation rail against Fiscal Trust. Skeptic review: Check that legacy styling has not overridden the export tokens. Acceptance: Canvas is #fbf8fc and Inter is the first declared font.

## Loop 74 — Partner portal / Ledger or card surface

Reference: agentcrm_partner_portal_morgan_reed/screen.png and code.html. Route: /. Width: 1280 px.

Limit visible statements to the signed-in recipient. Inspect the first content surface and its wrapping behavior. Skeptic review: Check if content blends into the canvas or extends offscreen. Acceptance: Primary section has a distinct surface and fits within main.

## Loop 75 — Partner portal / Tablet

Reference: agentcrm_partner_portal_morgan_reed/screen.png and code.html. Route: /. Width: 820 px.

Limit visible statements to the signed-in recipient. Render at a narrow tablet width with the desktop rail. Skeptic review: Check whether the rail squeezes the document wider than the viewport. Acceptance: Document width fits the viewport.

## Loop 76 — Partner portal / Phone

Reference: agentcrm_partner_portal_morgan_reed/screen.png and code.html. Route: /. Width: 390 px.

Limit visible statements to the signed-in recipient. Render at a common mobile width and inspect the rail and content. Skeptic review: Check for horizontal page scrolling or a fixed sidebar covering content. Acceptance: Main starts inside the viewport and document width fits.

## Loop 77 — Partner portal / Small phone

Reference: agentcrm_partner_portal_morgan_reed/screen.png and code.html. Route: /. Width: 320 px.

Limit visible statements to the signed-in recipient. Render at 320 CSS pixels and inspect the page edges. Skeptic review: Try the narrowest common layout where ledger tables could overflow. Acceptance: The document fits and tables scroll within their container.

## Loop 78 — Partner portal / Keyboard access

Reference: agentcrm_partner_portal_morgan_reed/screen.png and code.html. Route: /. Width: 1024 px.

Limit visible statements to the signed-in recipient. Move keyboard focus to the skip link and activate it. Skeptic review: Check that the link can be reached and reaches the intended content. Acceptance: Skip link receives focus and its destination exists.

## Loop 79 — Partner portal / Data and access

Reference: agentcrm_partner_portal_morgan_reed/screen.png and code.html. Route: /. Width: 1280 px.

Limit visible statements to the signed-in recipient. Check the role-specific financial or workflow content using seeded accounts. Skeptic review: Check for another recipient’s private data, missing financial values or a missing agency control. Acceptance: The screen-specific data assertion passes.

## Loop 80 — Partner portal / Forms and actions

Reference: agentcrm_partner_portal_morgan_reed/screen.png and code.html. Route: /. Width: 390 px.

Limit visible statements to the signed-in recipient. Inspect available controls, forms, labels and placeholder destinations. Skeptic review: Check for inert prototype controls, unlabeled inputs or unsafe submissions. Acceptance: Form actions are local, inputs have labels and POST forms have session protection.

## Loop 81 — Owner portal / Desktop composition

Reference: agentcrm_owner_share_reports_desktop/screen.png and code.html. Route: /owners. Width: 1440 px.

Show the owner’s own share and scope the history to that owner. Compare the primary region with the named export and render its mapped heading. Skeptic review: Look for a generic table replacing the primary content. Acceptance: Mapped section is present and visible.

## Loop 82 — Owner portal / Navigation

Reference: agentcrm_owner_share_reports_desktop/screen.png and code.html. Route: /owners. Width: 1440 px.

Show the owner’s own share and scope the history to that owner. Follow the current route and inspect its sidebar selection. Skeptic review: Check for duplicate selections or an incorrect destination. Acceptance: Exactly one current page link matches the route.

## Loop 83 — Owner portal / Surface and type

Reference: agentcrm_owner_share_reports_desktop/screen.png and code.html. Route: /owners. Width: 1440 px.

Show the owner’s own share and scope the history to that owner. Measure the canvas, typeface and navigation rail against Fiscal Trust. Skeptic review: Check that legacy styling has not overridden the export tokens. Acceptance: Canvas is #fbf8fc and Inter is the first declared font.

## Loop 84 — Owner portal / Ledger or card surface

Reference: agentcrm_owner_share_reports_desktop/screen.png and code.html. Route: /owners. Width: 1280 px.

Show the owner’s own share and scope the history to that owner. Inspect the first content surface and its wrapping behavior. Skeptic review: Check if content blends into the canvas or extends offscreen. Acceptance: Primary section has a distinct surface and fits within main.

## Loop 85 — Owner portal / Tablet

Reference: agentcrm_owner_share_reports_desktop/screen.png and code.html. Route: /owners. Width: 820 px.

Show the owner’s own share and scope the history to that owner. Render at a narrow tablet width with the desktop rail. Skeptic review: Check whether the rail squeezes the document wider than the viewport. Acceptance: Document width fits the viewport.

## Loop 86 — Owner portal / Phone

Reference: agentcrm_owner_share_reports_desktop/screen.png and code.html. Route: /owners. Width: 390 px.

Show the owner’s own share and scope the history to that owner. Render at a common mobile width and inspect the rail and content. Skeptic review: Check for horizontal page scrolling or a fixed sidebar covering content. Acceptance: Main starts inside the viewport and document width fits.

## Loop 87 — Owner portal / Small phone

Reference: agentcrm_owner_share_reports_desktop/screen.png and code.html. Route: /owners. Width: 320 px.

Show the owner’s own share and scope the history to that owner. Render at 320 CSS pixels and inspect the page edges. Skeptic review: Try the narrowest common layout where ledger tables could overflow. Acceptance: The document fits and tables scroll within their container.

## Loop 88 — Owner portal / Keyboard access

Reference: agentcrm_owner_share_reports_desktop/screen.png and code.html. Route: /owners. Width: 1024 px.

Show the owner’s own share and scope the history to that owner. Move keyboard focus to the skip link and activate it. Skeptic review: Check that the link can be reached and reaches the intended content. Acceptance: Skip link receives focus and its destination exists.

## Loop 89 — Owner portal / Data and access

Reference: agentcrm_owner_share_reports_desktop/screen.png and code.html. Route: /owners. Width: 1280 px.

Show the owner’s own share and scope the history to that owner. Check the role-specific financial or workflow content using seeded accounts. Skeptic review: Check for another recipient’s private data, missing financial values or a missing agency control. Acceptance: The screen-specific data assertion passes.

## Loop 90 — Owner portal / Forms and actions

Reference: agentcrm_owner_share_reports_desktop/screen.png and code.html. Route: /owners. Width: 390 px.

Show the owner’s own share and scope the history to that owner. Inspect available controls, forms, labels and placeholder destinations. Skeptic review: Check for inert prototype controls, unlabeled inputs or unsafe submissions. Acceptance: Form actions are local, inputs have labels and POST forms have session protection.

## Loop 91 — Fee agreements / Desktop composition

Reference: agentcrm_fee_agreements_tier_editor_desktop/screen.png and code.html. Route: /clients. Width: 1440 px.

Keep effective dates, retainer, split method and tier method discoverable. Compare the primary region with the named export and render its mapped heading. Skeptic review: Look for a generic table replacing the primary content. Acceptance: Mapped section is present and visible.

## Loop 92 — Fee agreements / Navigation

Reference: agentcrm_fee_agreements_tier_editor_desktop/screen.png and code.html. Route: /clients. Width: 1440 px.

Keep effective dates, retainer, split method and tier method discoverable. Follow the current route and inspect its sidebar selection. Skeptic review: Check for duplicate selections or an incorrect destination. Acceptance: Exactly one current page link matches the route.

## Loop 93 — Fee agreements / Surface and type

Reference: agentcrm_fee_agreements_tier_editor_desktop/screen.png and code.html. Route: /clients. Width: 1440 px.

Keep effective dates, retainer, split method and tier method discoverable. Measure the canvas, typeface and navigation rail against Fiscal Trust. Skeptic review: Check that legacy styling has not overridden the export tokens. Acceptance: Canvas is #fbf8fc and Inter is the first declared font.

## Loop 94 — Fee agreements / Ledger or card surface

Reference: agentcrm_fee_agreements_tier_editor_desktop/screen.png and code.html. Route: /clients. Width: 1280 px.

Keep effective dates, retainer, split method and tier method discoverable. Inspect the first content surface and its wrapping behavior. Skeptic review: Check if content blends into the canvas or extends offscreen. Acceptance: Primary section has a distinct surface and fits within main.

## Loop 95 — Fee agreements / Tablet

Reference: agentcrm_fee_agreements_tier_editor_desktop/screen.png and code.html. Route: /clients. Width: 820 px.

Keep effective dates, retainer, split method and tier method discoverable. Render at a narrow tablet width with the desktop rail. Skeptic review: Check whether the rail squeezes the document wider than the viewport. Acceptance: Document width fits the viewport.

## Loop 96 — Fee agreements / Phone

Reference: agentcrm_fee_agreements_tier_editor_desktop/screen.png and code.html. Route: /clients. Width: 390 px.

Keep effective dates, retainer, split method and tier method discoverable. Render at a common mobile width and inspect the rail and content. Skeptic review: Check for horizontal page scrolling or a fixed sidebar covering content. Acceptance: Main starts inside the viewport and document width fits.

## Loop 97 — Fee agreements / Small phone

Reference: agentcrm_fee_agreements_tier_editor_desktop/screen.png and code.html. Route: /clients. Width: 320 px.

Keep effective dates, retainer, split method and tier method discoverable. Render at 320 CSS pixels and inspect the page edges. Skeptic review: Try the narrowest common layout where ledger tables could overflow. Acceptance: The document fits and tables scroll within their container.

## Loop 98 — Fee agreements / Keyboard access

Reference: agentcrm_fee_agreements_tier_editor_desktop/screen.png and code.html. Route: /clients. Width: 1024 px.

Keep effective dates, retainer, split method and tier method discoverable. Move keyboard focus to the skip link and activate it. Skeptic review: Check that the link can be reached and reaches the intended content. Acceptance: Skip link receives focus and its destination exists.

## Loop 99 — Fee agreements / Data and access

Reference: agentcrm_fee_agreements_tier_editor_desktop/screen.png and code.html. Route: /clients. Width: 1280 px.

Keep effective dates, retainer, split method and tier method discoverable. Check the role-specific financial or workflow content using seeded accounts. Skeptic review: Check for another recipient’s private data, missing financial values or a missing agency control. Acceptance: The screen-specific data assertion passes.

## Loop 100 — Fee agreements / Forms and actions

Reference: agentcrm_fee_agreements_tier_editor_desktop/screen.png and code.html. Route: /clients. Width: 390 px.

Keep effective dates, retainer, split method and tier method discoverable. Inspect available controls, forms, labels and placeholder destinations. Skeptic review: Check for inert prototype controls, unlabeled inputs or unsafe submissions. Acceptance: Form actions are local, inputs have labels and POST forms have session protection.
