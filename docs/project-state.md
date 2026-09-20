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

## 2026-09-19 — slice 1: single project registry, solo voice, canonical to `oddbackward.forpono.com`

Status: **committed, not deployed** — branch `feat/project-registry`.

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
- **2026-09-19 — `research`: `npm audit --omit=dev`.** `npm ci` reports 8
  vulnerabilities (1 critical); none triaged. Check whether any reach the
  shipped static-export artifact, or whether they are dev-only tooling.
- **2026-09-19 — `prototype`: static work index under the orbit.** Slice 2
  reserved for the crawlable project list — layout, ordering, and status
  chips. Do not implement in this slice.
- **2026-09-19 — `task`: record demo clips for PACE Bot and Desktop Pet.** The
  Optimization pillar has no live proof until then; the Development pillar has
  Desktop Pet at `recording` waiting for the same.
- **2026-09-19 — `research`: has the Kailani API shipped since 2026-09-11?**
  If yes, flip its status to `live` and add its href.
- **2026-09-19 — `grilling`: remove the Workflow Intel password gate.** Public
  exposure needs its own recon in the `workflow-intel-web` repo; not a
  drive-by from here.

## Accepted gaps

- `air.forpono.com` ships the title "Create Next App". Fix lives in the
  `air-hub` repo, not this one.
- Featured projects show their summary twice in an orbit panel (once as a
  proof, once as a selected-work entry). Slice 2 restructures the panels.
