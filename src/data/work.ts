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
    statement: "Websites and brand-facing design that look like you, not a template.",
    proofs: [
      {
        name: "Forpono",
        summary: "A focused website path for small teams that need a clear place to start.",
        urlKey: "forpono",
      },
      {
        name: "Select work",
        summary: "A flexible slot for the next owner-approved case study.",
      },
    ],
  },
  {
    pillar: "Development",
    statement: "Custom apps, dashboards, and data tools built around your actual workflow.",
    proofs: [
      {
        name: "Risk Analytics",
        summary: "Decision-support analytics built on large public safety datasets.",
        urlKey: "riskAnalytics",
      },
      {
        name: "bus-finance",
        summary: "An autonomous finance agent shaped around practical planning work.",
      },
    ],
  },
  {
    pillar: "Optimization",
    statement: "The repetitive work you do every day, made to run smoother - or run itself.",
    proofs: [
      {
        name: "Flyer Bot",
        summary: "One input turns into a flyer, social post, and email across channels.",
      },
      {
        name: "Interactive information avatar",
        summary: "A voice-friendly guide that helps people ask questions and find useful information faster.",
      },
    ],
  },
];

export const selectedWork: WorkItem[] = [
  {
    title: "Forpono",
    pillar: "Design",
    summary: "A clear website starting point for small teams.",
    detail:
      "Positioning, structure, and practical web presence for owners who need something useful before they need something sprawling.",
    urlKey: "forpono",
  },
  {
    title: "Risk Analytics",
    pillar: "Development",
    summary: "Decision-support tools for complex public datasets.",
    detail:
      "A focused analytics experience that helps people explore risk signals without needing to become data engineers first.",
    urlKey: "riskAnalytics",
  },
  {
    title: "Flyer Bot",
    pillar: "Optimization",
    summary: "A repeatable promotion workflow from one clean input.",
    detail:
      "Transforms recurring outreach work into a smoother path across print, social, and email formats.",
  },
  {
    title: "Interactive information avatar",
    pillar: "Optimization",
    summary: "A conversational guide for faster answers and clearer next steps.",
    detail:
      "An interactive voice and information avatar that turns scattered knowledge into a simpler ask-and-answer experience.",
  },
];
