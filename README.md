# SoberArkansas

SoberArkansas.com — Arkansas's treatment and sober living directory. Every rehab,
detox program, outpatient clinic, and sober living home in Arkansas's 75 counties,
in one free list.

Forked from the SoberMissouri codebase (2026-11-24). Same stack: Vite + React +
Tailwind frontend on Vercel, the `arkansas` schema in the shared Supabase project
(SoberDirectories/VR Counseling), build-time prerender for listing/county/treatment
pages (`scripts/prerender.mjs`).

Design: DELTA — deep delta navy #10293E, river blue #173F5F, lighter river
blue #2E6E8E, harvest gold #D9A441 (kicker gold #E8B84B), pale river mist
#F4F6F8, chip blue #DDE9F2, ink #1B2430, crisis crimson #8C1D2F; Libre Franklin
headlines set bold and tight, Inter body, wide-tracked uppercase kickers, flat
lowland-horizon art with sun and river bands. See `src/index.css`.

Data rules live in AGENTS.md and the goal spec: listings come from SAMHSA,
Arkansas Department of Human Services sources (OSAMH catchment-area provider
lists, DPSQA licensing records), Oxford House, and AARR certified residence
listings, with the source recorded on every row. AARR publishes street
addresses for its certified residences; Oxford House listings may be city-only
where no street address is published. County pages carry each county's crisis
line (988) and its access line, the Arkansas Mental Health & Addiction Support
Line (DHS, 1-844-763-0198, Mon–Fri 8–5), plus the county's OSAMH catchment-area
contracted provider as its referral authority.

Masthead help lines: 988 (call or text, crisis, 24/7) and the DHS access line
1-844-763-0198 (treatment referrals, business hours — not a crisis line).

Production deploy: soberarkansas.com (planned: Vercel, team directories3; not yet deployed).

Prepared November 2026; the Arkansas data load was still in progress at prep
time, so count copy avoids hard totals and is refreshed at launch once the
load and enrichment land.
