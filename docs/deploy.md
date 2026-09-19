# oddbackward — deploy runbook (manual CLI)

> **This project has NO git-triggered deploy.** The git remote
> (`git@github.com:tclum/oddbackward.git`, added 2026-08-16) is version control
> only — it has no Vercel Git integration wired to it. Deploying is always a
> manual push from this clone via `bash scripts/deploy.sh`; pushing to `origin`
> does not deploy. `scripts/deploy.sh` is the single supported deploy path. Do
> not run `npx vercel deploy` (or `--prebuilt`) by hand — the script exists to
> keep the staged→verify→promote order deterministic.

## Project

- **Vercel project:** `oddbackward`
- **Org / team:** `tclum-4994s-projects` (`team_TrPpSMHZ5A2mFcihotFnEirq`)
- **Project id:** `prj_VXVVD97HWYjKpVpUpHyLVtYb5xCR`
- **Production domain:** `oddbackward.forpono.com` (also `oddbackward.vercel.app`)
- **Git remote:** `git@github.com:tclum/oddbackward.git` (no Vercel Git hook)
- **Clone:** `/Users/timothylum/Desktop/Developer/oddbackward`

## Build

Next.js 15 **static export** — `next.config.ts` sets `output: "export"` and
`images.unoptimized`. `next build` writes static assets to `out/`; the deploy
publishes those static assets (no server runtime).

## Install

The install phase is pinned to `npm ci` via `vercel.json` (`installCommand`).
`npm install` rewrites `package-lock.json` (dropping `"libc"` platform hints
under `dependencies`), which dirties the working tree during a local build and
trips the `-dirty` build stamp — the deploy gate then correctly refuses. `npm
ci` installs strictly from the lockfile and does not mutate it.

## Build stamp

`next.config.ts` reads `process.env.BUILD_STAMP` first: when it is a non-empty
string, that value is used verbatim as `NEXT_PUBLIC_BUILD_STAMP`. Only when the
env var is unset or empty does it fall back to computing a stamp from local
`.git` (`git rev-parse --short HEAD` + ISO timestamp, with `-dirty` if the tree
is unclean). The deploy path below always injects `BUILD_STAMP` into the remote
build so the artifact is SHA-pinned even though the Vercel builder cannot see
`.git`.

## Deploy: `bash scripts/deploy.sh`

The script is the whole deploy. It refuses to run outside the correct clone /
user / node version, refuses on an unclean tree or a `main` that is not at
`origin/main`, deploys a **staged** build (`--skip-domain`) with an injected
build stamp, runs three gates against the staged URL, only then promotes to
production, and only then runs `scripts/verify-stamp.sh` against the live
domain.

```bash
bash scripts/deploy.sh
```

The staged gates are:

1. `/` returns HTTP 200.
2. `/no-such-page-xyz` returns HTTP 404 (proves the 404 route is wired — this
   is the exact failure mode the 2026-09-19 prebuilt incident hid).
3. The body of `/` contains a `<meta name="build-stamp" content="…">` whose
   content starts with the current HEAD short SHA followed by a space, with no
   `-dirty` marker and no `nogit` marker.

Any staged failure prints `STAGED CHECK FAILED, production untouched: <URL>`
and exits without touching the production domain. On success, the script
promotes the staged URL and runs `bash scripts/verify-stamp.sh` — the
verify-stamp exit code is the script's exit code, so a red verify is a red
deploy.

Prove the gate functions themselves are honest (offline, no network, no
Vercel calls):

```bash
bash scripts/deploy.sh --selftest
bash scripts/verify-stamp.sh --selftest
```

## Prebuilt deploys are forbidden

`npx vercel build --prod` + `npx vercel deploy --prebuilt --prod` is **not**
used on this project. On 2026-09-19 that exact sequence took production down
for a few minutes: with `1afbf74` deployed as a prebuilt artifact, `/` served
the Next 404 page while `/index` returned 200. A controlled test on two
previews of `1afbf74` reproduced it — prebuilt `/` = 404, remote-built `/` =
200, both with `vercel.json` present. The prebuilt
`.vercel/output/config.json` has no route mapping `/` to `/index`. Prebuilt is
ruled out for this project; the remote build path in `scripts/deploy.sh` is
the only shape that produces a working `/`.

## Rollback

There is no git-trigger to revert. Roll back on the CLI to a previous known-
good deployment URL:

```bash
npx vercel rollback <previous-deployment-url> --yes
```

After a rollback, the production domains stop auto-assigning to new
deployments until an explicit `npx vercel promote <url> --yes` — so the next
`bash scripts/deploy.sh` run is what re-arms auto-assignment for future
deploys. (The 2026-09-19 rollback target was
`dpl_GdsyrvMFRr8kWTPyAMyKPBkFYbst`, kept here as an example, not a default.)
