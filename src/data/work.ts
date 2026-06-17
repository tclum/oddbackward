import type { SiteUrlKey } from "@/config/site";

export type Pillar = "Design" | "Development" | "Optimization";

export type Proof = {
  name: string;
  summary: string;
  urlKey?: SiteUrlKey;
};

export type PillarBlock = {
  pillar: Pillar;
  statement: string;
  proofs: Proof[];
};

export type WorkItem = {
  title: string;
  pillar: Pillar;
  summary: string;
  detail: string;
  urlKey?: SiteUrlKey;
};

export const pillars: PillarBlock[] = [
  {
    pillar: "Design",
    statement: "Sites that fit the business.",
    proofs: [
      {
        name: "Forpono",
        summary: "A website starting point for small teams.",
        urlKey: "forpono",
      },
      {
        name: "Select work",
        summary: "Reserved for the next approved case study.",
      },
    ],
  },
  {
    pillar: "Development",
    statement: "Apps, dashboards, and tools for the real workflow.",
    proofs: [
      {
        name: "Risk Analytics",
        summary: "Analytics for public safety risk data.",
        urlKey: "riskAnalytics",
      },
      {
        name: "bus-finance",
        summary: "Finance planning for everyday decisions.",
      },
    ],
  },
  {
    pillar: "Optimization",
    statement: "Routine work, made lighter or automatic.",
    proofs: [
      {
        name: "Flyer Bot",
        summary: "One input. Flyer, post, email.",
      },
      {
        name: "Interactive information avatar",
        summary: "A voice guide for questions and answers.",
      },
    ],
  },
];

export const selectedWork: WorkItem[] = [
  {
    title: "Forpono",
    pillar: "Design",
    summary: "Website launch point for small teams.",
    detail: "Positioning, structure, and a usable web presence.",
    urlKey: "forpono",
  },
  {
    title: "Risk Analytics",
    pillar: "Development",
    summary: "Decision tools for public datasets.",
    detail: "Risk signals in one place, without extra data work.",
    urlKey: "riskAnalytics",
  },
  {
    title: "Flyer Bot",
    pillar: "Optimization",
    summary: "Promotion from one clean input.",
    detail: "Flyer, social post, and email from the same source.",
  },
  {
    title: "Interactive information avatar",
    pillar: "Optimization",
    summary: "A voice guide for questions and next steps.",
    detail: "Scattered knowledge in an ask-and-answer flow.",
  },
];
