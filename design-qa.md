# Product Design QA

final result: passed

Reference:
- https://www.tuling.shop/docs
- User-provided screenshots for the docs card grid and detail expectations.

Checked:
- `/docs` desktop at 1440px: centered title, three-column document cards, rounded white cards, icon circles, hover/click affordance, no visible text overflow.
- `/docs` mobile at 390px: single-column cards, title wraps cleanly, tag chips stay inside cards, no horizontal overflow.
- `/docs/codex` desktop at 1440px: detail header, endpoint cards, registration-to-key flow, copyable code blocks, right-side tutorial navigation, no visible overlap.

Notes:
- Production Base URL is read from site status `server_address` when available, then falls back to the current browser origin.
- Existing monitoring page changes were left untouched.
