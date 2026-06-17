import { siteConfig } from "@/config/site";
import { pillars, selectedWork } from "@/data/work";

/*
  Orbit data layer.

  The orbit is derived from data, never a fixed set of slots: one center node
  (the DDO brand) plus one orbital node PER pillar. Node count, ring angles, and
  the accent cycle are all computed from these arrays — add a fourth pillar and
  the ring, the panels, and the reveal lock-threshold all scale (Rule 2).

  URLs/email resolve from siteConfig here, so the presentational components never
  embed a config value.
*/

export type OrbitLink = {
  label: string;
  href: string;
  external: boolean;
  variant: "solid" | "outline";
  ariaLabel?: string;
};

export type OrbitProof = {
  name: string;
  summary: string;
  href?: string;
  ariaLabel?: string;
};

export type OrbitWork = {
  title: string;
  summary: string;
  detail: string;
  href?: string;
  ariaLabel?: string;
};

export type OrbitPair = { heading: string; body: string };

export type OrbitImage = { src: string; alt: string };

export type OrbitNode = {
  /** stable slug; node id + panel id + reveal key. */
  id: string;
  kind: "center" | "pillar";
  /** sequence label for pillars, e.g. "01". */
  number?: string;
  /** short label on the ring node. */
  nodeLabel: string;
  /** accent as a CSS color-token reference (e.g. "var(--color-brass)"); drives
   *  --active-accent / --pillar-accent when opened. No literal color lives here. */
  accent: string;
  /** panel content */
  kicker: string;
  title: string;
  copy: string;
  chips: string[];
  proofs: OrbitProof[];
  work: OrbitWork[];
  links: OrbitLink[];
  pairs: OrbitPair[];
  image?: OrbitImage;
};

// Accent cycle — references to the color tokens in globals.css, index-mapped so
// the palette is N-parameterized (cycles if a vertical adds more pillars).
const PILLAR_ACCENTS = [
  "var(--color-brass)",
  "var(--color-sage)",
  "var(--color-clay)",
  "var(--color-blue)",
  "var(--color-plum)",
];

const mailto = `mailto:${siteConfig.contactEmail}`;

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const centerNode: OrbitNode = {
  id: "ddo",
  kind: "center",
  nodeLabel: siteConfig.brandName,
  accent: "var(--color-brass)",
  kicker: "The studio",
  title: "Design. Development. Optimization.",
  copy: "Websites, apps, and automation for small teams.",
  chips: pillars.map((pillar) => pillar.pillar),
  proofs: [],
  work: [],
  links: [
    { label: "Get in touch", href: mailto, external: false, variant: "solid" },
    {
      label: "Need a website? Forpono",
      href: siteConfig.urls.forpono,
      external: true,
      variant: "outline",
      ariaLabel: "Need a website? Visit Forpono",
    },
    {
      label: "About the founder",
      href: siteConfig.urls.founder,
      external: true,
      variant: "outline",
      ariaLabel: "About the founder",
    },
  ],
  pairs: [
    {
      heading: "Run by Timothy Lum.",
      body: "One person. Senior attention. Less noise.",
    },
    {
      heading: "Send the rough version.",
      body: "What you are making, fixing, or simplifying.",
    },
  ],
  image: {
    src: "/images/studio-workbench.png",
    alt: "Desk with planning notes and a screen showing simple layout blocks",
  },
};

const pillarNodes: OrbitNode[] = pillars.map((pillar, index) => ({
  id: slugify(pillar.pillar),
  kind: "pillar",
  number: String(index + 1).padStart(2, "0"),
  nodeLabel: pillar.pillar,
  accent: PILLAR_ACCENTS[index % PILLAR_ACCENTS.length],
  kicker: `${String(index + 1).padStart(2, "0")} / Pillar`,
  title: pillar.pillar,
  copy: pillar.statement,
  chips: pillar.proofs.map((proof) => proof.name),
  proofs: pillar.proofs.map((proof) => ({
    name: proof.name,
    summary: proof.summary,
    href: proof.urlKey ? siteConfig.urls[proof.urlKey] : undefined,
    ariaLabel: proof.urlKey ? `${proof.name} website` : undefined,
  })),
  work: selectedWork
    .filter((item) => item.pillar === pillar.pillar)
    .map((item) => ({
      title: item.title,
      summary: item.summary,
      detail: item.detail,
      href: item.urlKey ? siteConfig.urls[item.urlKey] : undefined,
      ariaLabel: item.urlKey ? `${item.title} website` : undefined,
    })),
  links: [],
  pairs: [],
}));

/** Full node set: center hub first, then one node per pillar. */
export const orbitNodes: OrbitNode[] = [centerNode, ...pillarNodes];

/** The pillar ids whose distinct opening drives (and locks) the DDO→ODD reveal. */
export const pillarIds: string[] = pillarNodes.map((node) => node.id);
