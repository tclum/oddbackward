# oddbackward — project state

> Dated, newest-first log of what shipped and where things stand. Prepend new
> entries at the top.

## Destination

`ddotechsolutions.com` states what DDO is in one screen and shows every
public project under Design, Development, Optimization with an honest status,
crawlable without interaction, on a provably-current build.

## Out of scope

- **Prebuilt deploys.** Ruled out 2026-09-19 (see
  `docs/findings-deploy.md`). `bash scripts/deploy.sh` is the single deploy path.
- **The orbit.** The orbit reveal, its finale and the portfolio-code overlay
  were retired by Tim on 2026-11-17 for a page a referred client can read
  without playing it.

---

## 2026-11-18 — Vows with Tony joins the registry

Status: **committed** — branch `feat/redesign-index`. Live when the production
build stamp carries this commit or a later one; `bash scripts/verify-stamp.sh`
is the proof.

- Tim built a site for Vows with Tony, a wedding officiant and planner in Reno
  and Lake Tahoe, and on 2026-11-18 said it is live and belongs on the DDO
  site.
- `src/data/projects.ts`: one new entry at the end of the Design group, after
  Kailani. `slug` `vows-with-tony`, `name` "Vows with Tony", `pillar` Design,
  `status` `live`, `summary` "A site for a wedding officiant and planner in
  Reno and Lake Tahoe.", `detail` "Packages, reviews, a gallery and a booking
  inquiry form.", `href` `https://vowswithtony.forpono.com`. No other entry
  changes; the work index renders the row from the registry.
- Checked 2026-11-18: `https://vowswithtony.forpono.com/` answers 200.
- Checked 2026-11-17: the site carried `noindex, nofollow`, which keeps it out
  of search results and does not affect a direct link.
- The link check now covers 8 links.

## 2026-11-17 — the home page becomes a services-and-work index

Status: **committed** — branch `feat/redesign-index`. Live when the production
build stamp carries this commit or a later one; `bash scripts/verify-stamp.sh`
is the proof.

- Tim is sending referred clients to `ddotechsolutions.com`. On 2026-11-17 he
  chose a redesign from five mockups and edited its copy himself. The page
  stops being an orbit you play with and becomes a page you read top to
  bottom: header, hero, services, work, about, contact, footer.
- Tim's decisions, all built in: the contact address is
  `tim@ddotechsolutions.com`; the header says "DDO Tech Solutions", the footer
  says "© <year> DDO LLC, Honolulu, Hawaiʻi", and body copy says "DDO"; the
  audience is "teams", with no size attached; the orbit, its reveal, its
  finale and the `:)` portfolio-code overlay retire.
- `src/config/site.ts`: `brandName` "DDO Tech Solutions", new `shortName`
  "DDO", `legalName` "DDO LLC", new `location` "Honolulu, Hawaiʻi",
  `contactEmail` `tim@ddotechsolutions.com`. `domain` and `urls` unchanged.
- `src/app/layout.tsx`: description "Websites, tools, and less busywork for
  Hawaiʻi's teams." in metadata and Open Graph; Bricolage Grotesque (variable,
  with its optical-size axis; the CSS uses weights 500 and 700) and Inter (400,
  500, 600) through `next/font/google` as `--font-display` and `--font-sans`; the inline `js`-class script is gone (nothing reads it).
  `src/test/setup.ts` mocks `next/font/google` for tests.
- `src/app/globals.css` and `tailwind.config.ts`: the orbit palette and styles
  are replaced by the new twelve tokens (canvas, ink, muted, line, surface,
  accent, accent-strong, warn, quiet, grid, grid-dark, on-dark-muted) and only
  the styles the new page uses.
- Components: `SiteHeader`, `Hero`, `HeroGraphic` (client), `Services` with
  `ServicePictogram`, `WorkIndex` (new row markup with a status dot, same
  contract), `About`, `ContactPanel` (client), `SiteFooter`. New
  `src/data/services.ts` holds the services copy, ordered by `pillars`.
  `ContactLine` and its test are deleted; `ContactPanel` replaces it.
- Motion: the hero's ring marker points at the mouse, the two D shapes drift
  up to 7 units and an accent glow follows; the contact panel gets an accent
  spotlight; rows, pictograms and the three buttons have hover moves. Writes go
  through refs at most once per animation frame; reduced motion and non-mouse
  pointers leave everything at rest.
- Tests: `src/app/page.test.tsx` is rewritten for the new page (config, outbound
  and mailto links, no typed address in any app or component file, section
  order, services order, brand wording, static HTML, accessibility); the orbit
  tests retire with the orbit. New `ContactPanel.test.tsx`. `WorkIndex.test.tsx`
  and `projects.test.ts` are unchanged.
- The registry (`src/data/projects.ts`, `src/data/work.ts`) is not touched.
- `src/components/Orbit.tsx`, `src/data/orbit.ts` and `src/data/portfolio.ts`
  stay on disk, unimported, until the next commit deletes them.
- The next commit deletes `src/components/Orbit.tsx`, `src/data/orbit.ts`,
  `src/data/portfolio.ts` and `public/images/studio-workbench.png`, removes
  the `lucide-react` dependency, and drops `selectedWork`, `WorkItem` and the
  registry's `featured` flag, which only the orbit read.

## 2026-11-16 — the site moves to its own domain, ddotechsolutions.com

Status: **committed** — branch `chore/own-domain`. Live when the production
build stamp carries this commit or a later one; `bash scripts/verify-stamp.sh`
is the proof.

- `src/config/site.ts`: `domain` is `ddotechsolutions.com` and `urls.home` is
  `https://ddotechsolutions.com`, so the canonical and Open Graph URLs name
  the new address. The comment above `domain` points at the Domains section
  of `docs/deploy.md`. The `page.test.tsx` config assertion follows.
- `scripts/verify-stamp.sh` v2: `DEFAULT_URL` is
  `https://ddotechsolutions.com`. Nothing else in the script changes.
- Docs: `docs/deploy.md` names the new production domain, gains a "Domains"
  section (the hosts and their jobs, DNS, where redirects live, why the old
  host stays attached, three read-only checks), and its standalone link
  check targets the new address. `README.md` names the new domain.
- Outside the repo, Tim registered `ddotechsolutions.com` at Cloudflare
  Registrar, put it on the Vercel project with `www` redirecting 308 to the
  apex, and added two DNS-only records (a CNAME at the apex and one for
  `www`).
- After the deploy: `oddbackward.forpono.com` becomes a 308 to the apex, and
  forpono.com's link to the work index gets its own pull request.
- The contact address stays `tclum@forpono.com` by decision; a contact
  address on the new domain is an open question below.

## 2026-11-16 — link-check gate: the deploy refuses a staged page with a dead outbound link

Status: **deployed** — live build stamp `969bd64 2026-11-16T23:09:30Z`, on `main`.

- `https://risk.forpono.com` answered 404 under a Live tag in production until
  an outside audit noticed on 2026-11-13; no gate looked at the links the page
  ships. Write-up: [`docs/findings-deploy.md`](./findings-deploy.md)
  (2026-11-16 entry).
- `scripts/check-links.sh` v1 (new): every distinct http(s) `href` inside an
  `<a>` tag must answer exactly 200 after redirects (GET, 15s cap, up to two
  attempts). `<link>` and `mailto:` are outside the set; an empty set is a
  fail. Modes: `<page-url>`, `--stdin`, `--selftest` (11 offline fixtures
  through the same extractor, verdict and loop, with stub fetchers).
- `scripts/deploy.sh` v2: preflight refuses unless the check-links selftest
  is green; staged gate 4 pipes the staged root body through
  `check-links.sh --stdin` and refuses promotion on any failed link.
- `docs/deploy.md`: gate 4, the selftest line, and a "Link check" section with
  the standalone command and what the gate cannot see (a 200 with the wrong
  content passes).

## 2026-11-16 — contact line below the work index, visible without the reveal

Status: **deployed** — live build stamp `969bd64 2026-11-16T23:09:30Z`, on `main`.

- The page's only contact link was the "Get in touch" `mailto:` inside the
  DDO panel. With JavaScript on, that panel opens only after a visitor opens
  all three pillars and then clicks the center, so a visitor who skipped the
  reveal never learned how to reach Tim. (The no-JS fallback renders every
  panel, so crawlers already saw the link.) Tim is sending referred prospects
  to this page now; a redesign comes later, after a domain move.
- `src/components/ContactLine.tsx`: new server component rendered right after
  `<WorkIndex />` in `src/app/page.tsx`. One line, "Making, fixing, or
  simplifying something? Send the rough version to <address>.", where the
  address is a `mailto:` link whose text is `siteConfig.contactEmail`. It is
  in the exported HTML with no JavaScript.
- `src/app/globals.css`: `.contact-line` shares the work index's max width and
  horizontal padding, sits under a work-row hairline, uses ink and brass, and
  gives the link a visible focus outline. The work index's 96px bottom
  padding moved onto the contact line.
- Tests: `src/components/ContactLine.test.tsx` (one link, href and text from
  config, server component, no literal address) and one `page.test.tsx` test
  (link visible with no interaction, outside every `.info-panel`).
- The orbit and its reveal are unchanged.

## 2026-11-16 — registry truth: Risk Analytics past, Chef Chai in progress, founder link to /about

Status: **deployed** — live build stamp `969bd64 2026-11-16T23:09:30Z`, on `main`.

- Checked from outside on 2026-11-16 (HST): `https://risk.forpono.com` answers
  404, yet the registry marked Risk Analytics `live` with that `href`, so the
  work index and the Development panel showed a dead link under a Live tag.
- Checked 2026-11-16: `https://chef-chai.forpono.com` is a staged, noindex,
  pre-launch customer build (its own detail reads "Pre-launch build."). It was
  `live` only because the registry allows a link on `live` alone. The launch is
  on hold by Tim's decision, so the public link comes off until it launches.
- Checked 2026-11-16: "About the founder" opened `https://tclum.forpono.com`,
  which redirects to `/media`, a gallery of placeholder stock photos.
  `https://tclum.forpono.com/about` answers 200 with Tim's bio.
- `src/data/projects.ts`: `risk-analytics` moves to `past` and `chef-chai` to
  `in-progress`, both with `href` removed. Name, summary, detail and pillar
  unchanged; no other entry changes.
- `src/config/site.ts`: `urls.founder` is now
  `https://tclum.forpono.com/about` (the `page.test.tsx` config assertion
  follows).
- The link-check gate arrives two commits later on this branch.

## 2026-09-28 — Workflow Intel live; Optimization now has a clickable project

Status: **deployed** — live build stamp `c76b8a8 2026-09-29T03:13:57Z`, on `main`.

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

- **2026-11-17 — `task`: send as the new address.** Mail to
  `tim@ddotechsolutions.com` is forwarded by Cloudflare Email Routing, and
  replies leave from the forpono inbox until sending from the new address is
  set up.
- **2026-11-16 — `grilling`: run `check-links.sh` against production on a
  schedule.** A GitHub Actions cron running
  `bash scripts/check-links.sh https://ddotechsolutions.com`, plus the three
  host checks in the Domains section of `docs/deploy.md`, would turn a link
  or host that dies between deploys red. Recommended after the domain move;
  not built.
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

- None as of 2026-11-17.
