# DDO

Standalone marketing site for DDO at `ddotechsolutions.com`.

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

The project registry lives in `src/data/projects.ts`; the work index and the
pillar statements read it through `src/data/work.ts`.

The services copy lives in `src/data/services.ts`.

Colors are tokens in `src/app/globals.css` and `tailwind.config.ts`.
