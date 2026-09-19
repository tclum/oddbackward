# oddbackward — deploy runbook (manual CLI)

> **This project has NO git-triggered deploy.** The git remote
> (`git@github.com:tclum/oddbackward.git`, added 2026-08-16) is version control
> only — it has no Vercel Git integration wired to it. Deploying is always a
> manual **prebuilt** push from this clone (`npx vercel build --prod` then
> `npx vercel deploy --prebuilt --prod`); pushing to `origin` does not deploy.
> A bare `npx vercel --prod` triggers a Vercel remote build that cannot see
> `.git`, stamps the artifact `nogit …`, and makes the verify-stamp gate fail
> every time — never use it. This runbook is the canonical deploy reference.

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

## Deploy steps

1. **On `main`, clean tree, full gate green:**
   ```bash
   git branch --show-current      # expect: main
   git status                     # expect: clean
   npx tsc --noEmit               # clean
   npm test                       # expect 19 passing
   npm run build                  # expect Exporting (2/2)
   git diff --check               # clean
   ```
2. **Confirm the deploy identity:**
   ```bash
   npx vercel whoami              # expect: tclum-4994 (team tclum-4994s-projects)
   ```
3. **Build locally, then deploy the prebuilt artifact** (from the clone). This
   is the only supported deploy shape — the build stamp is computed by
   `next.config.ts` from the local `.git` at build time, so a Vercel remote
   build cannot see it and stamps the artifact `nogit …`, which makes the
   verify-stamp gate below fail every time. A bare `npx vercel --prod` is not
   used.
   ```bash
   npx vercel build --prod
   npx vercel deploy --prebuilt --prod
   ```
4. **Verify the new build is live:**
   ```bash
   curl -sI https://oddbackward.forpono.com | head -1     # expect: HTTP/2 200
   # spot-check the new content is present, e.g.:
   curl -s https://oddbackward.forpono.com | grep -c "data-pillar"
   ```
5. **Verify the deployed artifact matches this clone (build-stamp gate):**
   ```bash
   bash scripts/verify-stamp.sh                # expect: RESULT: pass
   ```
   The script compares the `<meta name="build-stamp">` served by production
   against `git rev-parse --short HEAD` from this clone, and fails on any
   mismatch, missing tag, `-dirty` marker, or unreachable host. **A red result
   is a rollback conversation, not a retry** — the deployed artifact does not
   demonstrably match a commit in this tree. Prove the selftest itself is
   honest with `bash scripts/verify-stamp.sh --selftest`.

## Rollback

There is no git-trigger to revert. Roll back via the **Vercel dashboard**:
Deployments → pick a previous good deployment → **Promote to Production**.
