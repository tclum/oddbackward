# oddbackward — project state

> Dated, newest-first log of what shipped and where things stand. Prepend new
> entries at the top.

## Destination

`oddbackward.forpono.com` states what DDO is in one screen and shows every
public project under Design, Development, Optimization with an honest status,
crawlable without interaction, on a provably-current build.

## Out of scope

- **Prebuilt deploys.** `npx vercel build --prod` + `npx vercel deploy
  --prebuilt --prod` break `/` routing for this static export on Vercel CLI 59
  — the prebuilt `.vercel/output/config.json` has no route mapping `/` to
  `/index`. See the 2026-09-19 incident below.

---

## 2026-09-19 — prebuilt deploy of `1afbf74` took prod down; ruled out; staged remote build is the new deploy path

Incident opened and closed 2026-09-19.

**What happened.** `npx vercel build --prod` + `npx vercel deploy --prebuilt
--prod` of `1afbf74` took production down for a few minutes: `/` served the
Next 404 page while `/index` returned 200. Rolled back to
`dpl_GdsyrvMFRr8kWTPyAMyKPBkFYbst` — production is healthy and has no build
stamp (the rolled-back deployment predates the stamp work).

**Cause.** The prebuilt `.vercel/output/config.json` has no route mapping `/`
to `/index` for this Next 15 static export on CLI 59. A remote build produces
that mapping; a prebuilt push does not.

**Controlled test.** Two previews of `1afbf74` with `vercel.json` present:
prebuilt `/` returned 404, remote-built `/` returned 200. That's a
one-variable difference, so prebuilt is ruled out for this project.

**New deploy path (this slice, branch `chore/staged-deploy`, not yet
deployed).** `bash scripts/deploy.sh` is the single deploy shape.

- `next.config.ts` — `buildStamp()` now returns `process.env.BUILD_STAMP`
  verbatim when it is a non-empty string, and falls back to the existing
  git-derived stamp otherwise. This is the only reason a Vercel remote build
  (which cannot see `.git`) can now produce a SHA-pinned artifact.
- `scripts/deploy.sh` — staged remote build with `--skip-domain` and
  `--build-env BUILD_STAMP="<sha> <iso>"`; three staged gates against the
  resulting URL (root `/` = 200, `/no-such-page-xyz` = 404, root body contains
  `<meta name="build-stamp">` whose content starts with the HEAD short SHA
  followed by a space, with no `-dirty` and no `nogit`); on green,
  `npx vercel promote` then `bash scripts/verify-stamp.sh` — the verify-stamp
  exit code is the script's exit code. `--selftest` drives the same assertion
  functions with offline fixtures (must-pass, root 404, root 302, missing-page
  200, SHA mismatch, `-dirty`, `nogit`, missing meta tag).
- `docs/deploy.md` — rewritten to make `bash scripts/deploy.sh` the single
  path, record the rollback shape (`npx vercel rollback <url> --yes` — after
  a rollback, production domains stop auto-assigning until a promote), and
  state why prebuilt is forbidden.

Status: **not yet deployed** — infra-only slice.

---

## 2026-09-19 — first deploy attempt of `2af38fa` refused by stamp gate

The first prebuilt deploy attempt of the `chore/build-stamp` work (HEAD
`2af38fa`) was refused by the build-stamp gate. Root cause: `npx vercel build
--prod` runs `npm install`, which rewrote `package-lock.json` (90 deleted lines,
all `"libc"` platform hints under `dependencies`); the working tree was no
longer clean, so `next.config.ts` appended `-dirty` to the stamp. The gate
correctly refused — the deployed artifact could not be pinned to a clean SHA.

**Fix (this slice, branch `chore/npm-ci-install`, not yet deployed):**

- `vercel.json` — `{"installCommand": "npm ci"}`. `npm ci` installs strictly
  from the lockfile and does not mutate it.
- `package-lock.json` — normalized (regenerated `libc` blocks removed) so the
  lockfile matches what `npm ci` will produce and the working tree stays clean.
- `docs/deploy.md` — new "Install" section documents the pin.

Not yet deployed: this slice is infra-only. Redeploy happens in a later slice
once the tree is clean and the stamp is expected to come up green.

**Update 2026-09-19 (later, same day):** the "safe deploy shape" assumed by
this entry (prebuilt) was ruled out later the same day — see the newer
2026-09-19 incident entry above. The `npm ci` pin still stands (a clean tree is
still a precondition of a clean stamp), but the deploy that follows it is now
`bash scripts/deploy.sh` (staged remote build), not prebuilt.

## Open questions

- **2026-09-19 — `research`: `npm ci` reports 8 vulnerabilities (1 critical).**
  The advisory line lands on every install and none of it has been triaged. Run
  `npm audit --omit=dev` to see whether any of the flagged packages actually
  reach the shipped static-export artifact — dev-only vulnerabilities in
  vitest/postcss tooling are a different risk class than a runtime dependency
  bundled into `out/`. Decide-then-act; do not silence the warning without
  triage.
- **2026-09-19 — Volta precedes nvm in non-interactive shells.** The agent
  shell started with Volta's Node 20.14.0 on `PATH` even after `nvm use` picked
  v22.23.2, so `node -v` still reported v20 and `npm test` hit
  `ERR_REQUIRE_ESM` from vitest until PATH was manually reordered. This is a
  machine-wide PATH-source ordering issue (Volta shims live at
  `/Users/timothylum/.volta/tools/image/node/20.14.0/bin` and appear before
  `/Users/timothylum/.nvm/versions/node/v22.23.2/bin`). Fix in a separate
  slice — decide whether to demote Volta, uninstall Volta's Node, or add a
  shell wrapper that sources nvm before Volta.

---

## 2026-08-17 — build stamp closes the cannot-prove-what-shipped gap

oddbackward is the only project in this Developer tree whose deploy is manual
(`npx vercel --prod`) with no git-triggered pipeline. Until today, nothing tied
the live artifact back to a commit — a green test suite plus a screenshot was
the entire proof. Branch `chore/build-stamp` adds the missing link.

**What shipped** — built 2026-08-17, committed 2026-09-19 on branch
`chore/build-stamp` (not yet deployed):

- `next.config.ts` — computes a build stamp at build time (`git rev-parse
  --short HEAD` + ISO timestamp, plus a `-dirty` suffix if the working tree is
  not clean) and exposes it as `NEXT_PUBLIC_BUILD_STAMP`. The `-dirty` marker
  is load-bearing: a stamp that reports a clean SHA while shipping uncommitted
  code would be a gate that cannot fail, which is the defect class this exists
  to close.
- `src/app/layout.tsx` — renders `<meta name="build-stamp" content="…">` on
  every exported page via the `metadata.other` field.
- `scripts/verify-stamp.sh` — fetches the deployed page, extracts the meta
  tag, and asserts (a) the SHA matches `git rev-parse --short HEAD` in this
  clone, (b) the tag is present at all, (c) there is no `-dirty` marker,
  and (d) the URL was actually reachable (unreachable is a hard fail, never a
  skip). Modelled on `../el3vate-site/src/validate.js --selftest`: a
  `--selftest` mode drives one must-pass fixture and three must-fail fixtures
  (missing tag, mismatched SHA, dirty marker) through the same extraction path
  and prints `RESULT: pass` only when every gate behaved correctly.
- `docs/deploy.md` — makes the prebuilt sequence (`npx vercel build --prod`
  then `npx vercel deploy --prebuilt --prod`, then `bash scripts/verify-stamp.sh`)
  the single documented deploy path and calls out that a red result is a
  rollback conversation, not a retry.

**Operational caveat recorded here so it survives context resets:** the stamp
is baked at Next build time from the local `.git`. If `npx vercel --prod`
triggers a Vercel remote build that cannot see `.git`, the stamp will read
`nogit …` and this gate will always fail. The safe deploy shape is prebuilt:
`npx vercel build --prod && npx vercel deploy --prebuilt --prod` — the deploy
runbook now documents this.

**Update 2026-09-19:** the "safe deploy shape is prebuilt" claim above was
falsified on 2026-09-19 — a prebuilt deploy of `1afbf74` served the Next 404
page at `/` in production. See the 2026-09-19 incident entry above. The
build-stamp mechanism shipped in this slice still stands, but with an
addition: `next.config.ts` now honors `process.env.BUILD_STAMP` verbatim when
set, so the staged remote build in `scripts/deploy.sh` can inject a
SHA-pinned stamp without needing `.git` on the builder. `scripts/verify-stamp.sh`
is unchanged and is called at the end of the new deploy path.

---

## 2026-06-22 — v2 orbit reveal replaces v1, deployed to oddbackward.forpono.com

The site's center-reveal mechanic was rebuilt on branch `orbit-reveal-v2` (now
merged to `main`, fast-forward) and is the live production design as of this
deploy. v2 replaces the v1 Hawaii Orbit center reveal.

**What shipped** — the slices, commit range `4f49b81 → e1db191` on `main` (the
deadpan-copy commit through the founder-copy fix):

- **Deadpan copy pass** — structural copy tightening across the orbit + work data
  and components.
- **Portfolio-code easter egg** — the `:)` trigger + "time without e" code overlay
  resolving a 3-letter code against the portfolios registry.
- **v2 center reveal FSM** — `ODD → DDO` by opening three distinct pillars, with
  sparkle/glow effects accumulating (1st pillar → sparkle, 2nd → glow).
- **Non-modal bottom-dock pillar panels** — opening a pillar docks it as a panel
  above a bottom tab strip (one expanded at a time; re-expandable tabs).
- **Pillar fall + panel unfold + delayed dock-tab reveal** — a clicked pillar's
  node clone falls away, the panel unfolds upward, and its dock tab fades in only
  after the node is gone.
- **ODD↔DDO glyph morph** — the single O arcs front → back over the word while the
  two D's slide left one slot.
- **Held-until-dismissed finale** — clicking the DDO center opens a modal CTA
  popup carrying the center node's content (held until close / Escape / click-away,
  no auto-reset) — plus the **center a11y fix**: the center is now an
  always-mounted button, so focus never drops to `<body>`.
- **Sequenced title-card finale** — the words rise from the orbit center, grow,
  stack vertically across the top, hold, then fall and fade; only then the popup
  rises from the bottom.
- **Founder copy fixed** — the center founder line changed from "One person." to
  "A small team." (DDO is no longer a one-person studio).

**Parked / not done:**

- The `hawaii-orbit` (v1) and `orbit-reveal-v2` branches are kept as pointers, not
  deleted.
- A broader brand-copy / voice polish pass is still outstanding — the deadpan pass
  was structural, not a full voice pass.
- The "DNS Change Recommended" flag on the `oddbackward.forpono.com` domain is
  acknowledged and deferred: the domain validates and serves; the recommended
  record is a tidy-up, not a blocker.
