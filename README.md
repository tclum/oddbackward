# DDO

Standalone marketing site for DDO at `oddbackward.com`.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Vitest
- Static export-ready build

## Local commands

```bash
npm install
npm run dev
npm test
npm run build
```

## Editing

Shared site values live in `src/config/site.ts`.

Selected work and pillar proof points live in `src/data/work.ts`.

The visual system is intentionally neutral and tokenized in `src/app/globals.css` and
`tailwind.config.ts` so final art direction can be swapped later without rewriting
components.
