import { projects, type ProjectStatus } from "@/data/projects";

export type Pillar = "Design" | "Development" | "Optimization";

export type Proof = {
  name: string;
  summary: string;
  status: ProjectStatus;
  href?: string;
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
  href?: string;
};

const PILLAR_STATEMENTS: Record<Pillar, string> = {
  Design: "Sites that fit the business.",
  Development: "Apps, dashboards, and tools for the real workflow.",
  Optimization: "Routine work, made lighter or automatic.",
};

// The only place a status becomes visible copy; the work index reads labels here.
export const STATUS_LABEL: Record<ProjectStatus, string> = {
  live: "Live",
  "in-progress": "In progress",
  recording: "Demo soon",
  past: "Past",
};

const PILLAR_ORDER: Pillar[] = ["Design", "Development", "Optimization"];

export const pillars: PillarBlock[] = PILLAR_ORDER.map((pillar) => ({
  pillar,
  statement: PILLAR_STATEMENTS[pillar],
  proofs: projects
    .filter((project) => project.pillar === pillar)
    .map((project) => ({
      name: project.name,
      summary: project.summary,
      status: project.status,
      href: project.href,
    })),
}));

export const selectedWork: WorkItem[] = projects
  .filter((project) => project.featured)
  .map((project) => ({
    title: project.name,
    pillar: project.pillar,
    summary: project.summary,
    detail: project.detail,
    href: project.href,
  }));
