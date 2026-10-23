# Project instructions

This is a pnpm monorepo. The web application is in `apps/web`.

Before changing web code, read `apps/web/AGENTS.md` and the applicable installed Next.js guides.

For any merchant/admin interface, including detail pages, forms and shared components:
- Read `docs/admin-ui-guidelines.md` before implementation.
- Reuse the merchant Ant Design theme and existing layout patterns. Do not introduce a second component system into admin pages.
- Design around the operator's current task and business state, rather than placing one card per database object.
- Validate desktop and mobile layouts and the applicable interaction states before reporting completion.

These instructions apply to code generated or modified by any assistant that reads this repository's AGENTS.md. They do not replace authorization checks or domain rules enforced by the server.
