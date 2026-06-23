# oddbackward — deploy runbook (manual CLI)

> **This project has NO git-triggered deploy.** There is no git remote and no
> Vercel Git integration. Deploying is always a manual `npx vercel --prod` from
> the clone. Git is version control only — it does not deploy. This runbook is the
> canonical deploy reference.

## Project

- **Vercel project:** `oddbackward`
- **Org / team:** `tclum-4994s-projects` (`team_TrPpSMHZ5A2mFcihotFnEirq`)
- **Project id:** `prj_VXVVD97HWYjKpVpUpHyLVtYb5xCR`
- **Production domain:** `oddbackward.forpono.com` (also `oddbackward.vercel.app`)
- **Clone:** `/Users/paceai1/Desktop/Developer/oddbackward`

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
3. **Deploy to production** (from the clone):
   ```bash
   npx vercel --prod
   ```
4. **Verify the new build is live:**
   ```bash
   curl -sI https://oddbackward.forpono.com | head -1     # expect: HTTP/2 200
   # spot-check the new content is present, e.g.:
   curl -s https://oddbackward.forpono.com | grep -c "data-pillar"
   ```

## Rollback

There is no git-trigger to revert. Roll back via the **Vercel dashboard**:
Deployments → pick a previous good deployment → **Promote to Production**.
