- County counselor resources live in `county_resources` (county_id NULL = statewide; category "Forms" = downloads) so admins and Muse edit them without code changes.
- Directory filter tags (sober, residential, detox, OTP, Medi-Cal) are derived in `src/lib/arkansas.ts` from category tags plus service flags; keep all filtering/counting going through it.
- The muse-admin function is the single bearer-token API for Muse (listings, county-resources, counties); extend it rather than adding new token-auth functions.
- AI-agent access is public read-only: `agent-api` edge function (search API, llms-full.txt) and MCP tools in `src/lib/mcp/` use only the anon key and public tables/views; never add writes or private data there (write access stays in muse-admin).
- Get Featured inquiries use a public validated function and service-role-only backup storage, separate from listings and admin, to keep visitor contact information private; never return sent success before email acceptance.
- App inquiry email uses the registered managed email template and submission-based idempotency; the existing backup status `queued` means email API acceptance, not a local queue, so retries never create duplicate emails.
- Authentication emails use the managed `auth-email-hook` scaffold and versioned Lovable email SDK; do not introduce queue infrastructure because this project uses managed sending.
- All map views share MapView; derive category priority in arkansas.ts and style inline SVG pins and legend dots with the same global map tokens so their colors cannot diverge.

# Working together (Claude + Pip/Muse)

These rules are about coordination, not scope. Either assistant may improve anything — SEO, pages, design, performance, new features — as long as it follows these steps.

- Pull the latest `main` before starting. Do code work on a branch; merge to `main` when it's ready and checked. Never force-push `main`.
- Every edge function change is committed to this repo first, then deployed. Never edit a function only in the Supabase dashboard; the repo must match what's live.
- Database structure changes (new or renamed tables or columns) go in as migrations in `supabase/migrations/` with a clear commit message, so the other assistant sees them before building on them.
- Listing data: a record whose facts are mixed or questionable is deleted or recategorized only after Jason approves that specific record. Never add a street address or coordinates to a listing whose operator hides its address.
- Before calling anything done or live, load the real page or live count and check it.
- Leave a one-line note in the commit message saying what changed and why, so the other assistant can pick up where you left off.
