<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Merchant admin design and interaction

Before creating or changing `/admin` pages, shared admin components, or merchant forms, read and follow [`../../docs/admin-ui-guidelines.md`](../../docs/admin-ui-guidelines.md).

- Keep Ant Design as the admin component system; use the merchant theme in `src/components/admin/antd-root.tsx`.
- Put reusable admin styles in `src/app/admin/admin.css`. Preserve the separate storefront and marketing design systems.
- Detail pages must organize summary, business records, primary actions and secondary actions deliberately; do not use an arbitrary stack of cards.
- Follow server permissions and status transitions. Financial/destructive operations require contextual confirmation and explicit outcome feedback.
- Check meaningful desktop/mobile layouts and states. A successful build alone does not establish good UX.
