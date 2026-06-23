# oddbackward — project state

> Dated, newest-first log of what shipped and where things stand. Prepend new
> entries at the top.

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
