# oddbackward — project state

> Dated, newest-first log of what shipped and where things stand. Prepend new
> entries at the top.

## Destination

`oddbackward.forpono.com` states what DDO is in one screen and shows every
public project under Design, Development, Optimization with an honest status,
crawlable without interaction, on a provably-current build.

## Out of scope

- **Prebuilt deploys.** Ruled out 2026-09-19 (see
  `docs/findings-deploy.md`). `bash scripts/deploy.sh` is the single deploy path.

---

## 2026-09-28 — Workflow Intel live; Optimization now has a clickable project

Status: **committed, not deployed** — branch `feat/intel-live`.

- `https://intel.forpono.com` went public on 2026-09-28: read pages are open,
  `/settings` is gated. Checked 2026-09-28: `/` and `/strategy` return 200,
  `/settings` returns 307 to `/login?next=%2Fsettings`.
- `src/data/projects.ts`: the `workflow-intel` entry moves from `in-progress`
  to `live` with `href: "https://intel.forpono.com"` and detail "Eleven
  sources, weekly triage, one strategy doc. Runs unattended every Sunday."
  Summary unchanged. No other registry entry changes.
- The work index renders it as a link with no component change, because links
  are derived from `status === "live"` plus the registry `href`. Optimization
  now has a clickable project; Flyer Bot and PACE Bot stay unlinked.

## 2026-09-28 — dependency hygiene: next 15.5.26, postcss override raised

Status: **deployed** — live build stamp `b3dcf91 2026-09-29T00:01:23Z`, on `main`.

- `package.json`: `next` 15.5.19 → 15.5.26 (exact pin, patched 15.5 release).
  `overrides.postcss` and `devDependencies.postcss` `^8.5.15` → `^8.5.23`.
- In-range updates only (`npm update postcss nanoid sharp`, no `--force`, no
  major bump): postcss 8.5.15 → 8.5.28, nanoid 3.3.12 → 3.3.19, sharp 0.34.5 →
  0.35.5 (next 15.5.26 declares `sharp: ^0.34.3 || ^0.35.4`).
- `npm audit fix` was not used: npm 10.2.4 crashes in arborist
  (`Cannot read properties of null (reading 'edgesOut')`) while resolving the
  vitest peer set. Raising the override plus `npm update` reached the same
  in-range fixes without it.
- `npm audit --omit=dev`: 4 (1 critical, 3 high) → **0**. Full `npm audit`:
  8 (1 critical, 4 high, 3 moderate) → 4 (1 high, 3 moderate).
- Reach: none of the fixed advisories reached the shipped artifact.
  `output: "export"` with `images.unoptimized: true`, no server actions or API
  routes; live `/_next/image?...` and `/api/x` return 404.
- Accepted dev-only residuals (not reachable: test and build tooling only):
  `@vitest/mocker` / `vitest` (moderate), `baseline-browser-mapping`
  (moderate), `browserslist` (high).

## 2026-09-27 — slice 2: static work index (layout A, ledger) under the orbit

Status: **deployed** — live build stamp `a80d456 2026-09-28T08:20:14Z`, on `main`.

- `src/components/WorkIndex.tsx` — new server component. `<section id="work">`
  renders every registry project under its pillar in three columns (Design,
  Development, Optimization), each row carrying name, status tag, and summary.
  Only `live` projects render as links (new tab, `noopener noreferrer`); every
  other row is plain text. The whole list is in the static export, so it is
  crawlable without interaction.
- `src/data/work.ts` — `Proof` now carries `status`; `STATUS_LABEL` is the one
  map from `ProjectStatus` to visible copy (Live, In progress, Demo soon, Past).
- `src/app/page.tsx` — renders `<WorkIndex />` after `<Orbit />` in `<main>`.
  It lands below the orbit footer in normal flow; no Orbit layout change.
- `src/app/globals.css` — new `/* work index */` block, ported from the Option
  A ledger prototype onto existing tokens (brass / sage / clay, display font).
  One column at `max-width: 820px`.
- Registry: **Kailani** is `live` at `https://kailani.forpono.com` ("Interactive
  storefront demo. No real orders."). **AIR Hub** moves to `in-progress` with
  its href removed ("Being rebuilt. …"): on 2026-09-27 `https://air.forpono.com`
  served the default Next.js starter page, so a live link was a false claim.
- Layout decision: option A (ledger columns), chosen by Tim 2026-09-27 over B
  (cards) and C (spec sheet).
- Tests: `src/components/WorkIndex.test.tsx` (every project once, anchors only
  for live projects with registry hrefs, status labels from `STATUS_LABEL`, no
  `"use client"` or hardcoded names/URLs in the component). The brand test now
  asserts the index rendered before scanning body text.

## 2026-09-19 — slice 1: single project registry, solo voice, canonical to `oddbackward.forpono.com`

Status: **deployed** — live build stamp `42188bc 2026-09-20T00:25:42Z`, on
`main`.

- `src/data/projects.ts` — new single source of project facts (slug, name,
  pillar, status, summary, detail, href, featured). `ProjectStatus` is
  `"live" | "recording" | "in-progress" | "past"`. Invariant: `href` present
  iff `status === "live"`, asserted in `src/data/projects.test.ts` with a
  negative-control demo run this slice.
- `src/data/work.ts` — `pillars` and `selectedWork` now derive from
  `projects.ts`. The `urlKey` indirection and the "Select work" / "bus-finance"
  placeholders are gone.
- `src/config/site.ts` — canonical flipped to `oddbackward.forpono.com`;
  `urls.riskAnalytics` removed (the URL now lives in `projects.ts`).
- `src/app/layout.tsx` — `alternates: { canonical: "/" }` added so Next emits
  `<link rel="canonical" href="https://oddbackward.forpono.com/">` from
  `metadataBase`.
- `src/data/orbit.ts` — solo voice: pair body reads "One person. Senior
  attention. Less noise." Customer-facing "for small teams" phrasing is
  untouched (that describes customers, not DDO).
- Registry copy: AIR Hub is "The hub for a student builder bootcamp." Workflow
  Intel is now an Optimization project (top of the group), summary "A pipeline
  that reads the field, scores what matters, and writes the weekly brief."
  PACE Bot moves to `past` ("Built for a university program. No longer
  running."). These keep the visible `\bAI\b` count at zero without weakening
  the brand assertion.
- No new UI, pages, or components.

## 2026-09-19 — earlier: staged-deploy path replaced prebuilt

The prebuilt deploy path was falsified this morning and replaced by
`bash scripts/deploy.sh`. Full incident + fix write-up:
[`docs/findings-deploy.md`](./findings-deploy.md) (2026-09-19 entry).

## 2026-08-17 — build stamp closes the cannot-prove-what-shipped gap

Full write-up: [`docs/findings-deploy.md`](./findings-deploy.md) (2026-08-17
entry).

## 2026-06-22 — v2 orbit reveal replaces v1, deployed to oddbackward.forpono.com

The site's center-reveal mechanic was rebuilt on branch `orbit-reveal-v2` (now
merged to `main`, fast-forward) and is the live production design as of this
deploy. v2 replaces the v1 Hawaii Orbit center reveal, with a bottom-dock
pillar-panel system, ODD↔DDO glyph morph, held-until-dismissed finale, and a
`:)` portfolio-code easter egg.

---

## Open questions

- **2026-09-19 — `task`: Volta precedes nvm in non-interactive shells.** The
  agent shell starts with Volta's Node 20.14.0 on `PATH` even after `nvm use`
  picks v22.23.2, so `node -v` reports v20 and `npm test` hits
  `ERR_REQUIRE_ESM` from vitest until PATH is reordered. Machine-wide PATH
  ordering issue. Fix in a separate slice.
- **2026-09-27 — `task`: air.forpono.com serves the Next.js starter page;
  AIR Hub stays in-progress until the hub is redeployed.**
- **2026-09-19 — `task`: record demo clips for PACE Bot and Desktop Pet.** The
  Development pillar has Desktop Pet at `recording` waiting for the same.

## Accepted gaps

- Featured projects show their summary twice in an orbit panel. Panel
  restructure is unscheduled.
