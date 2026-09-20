import type { Pillar } from "@/data/work";

/*
  Single source of project facts. Every proof and every selected-work entry is
  derived from this array — nothing else in the tree hardcodes a project name,
  URL, or status. The invariant `href present iff status === "live"` is asserted
  in projects.test.ts so a linkable in-progress entry cannot ship.
*/

export type ProjectStatus = "live" | "recording" | "in-progress" | "past";

export type Project = {
  slug: string;
  name: string;
  pillar: Pillar;
  status: ProjectStatus;
  summary: string;
  detail: string;
  href?: string;
  featured?: boolean;
};

export const projects: Project[] = [
  // Design
  {
    slug: "forpono",
    name: "Forpono",
    pillar: "Design",
    status: "live",
    summary: "A website builder for Hawaiʻi small businesses.",
    detail: "Multi-tenant and white-label. One platform, many sites.",
    href: "https://forpono.com",
    featured: true,
  },
  {
    slug: "bikini-n-beanz",
    name: "Bikini N Beanz",
    pillar: "Design",
    status: "live",
    summary: "A live client site on Forpono.",
    detail: "Designed, built, and launched on the platform.",
    href: "https://bikininbeanz.forpono.com",
  },
  {
    slug: "chef-chai",
    name: "Chef Chai",
    pillar: "Design",
    status: "live",
    summary: "A restaurant site on Forpono.",
    detail: "Pre-launch build.",
    href: "https://chef-chai.forpono.com",
  },
  {
    slug: "el3vate",
    name: "EL3vate",
    pillar: "Design",
    status: "live",
    summary: "A resource site for a UH Mānoa faculty program.",
    detail: "Content in, static site out, every build gated.",
    href: "https://el3vate.forpono.com",
  },
  {
    slug: "kailani",
    name: "Kailani",
    pillar: "Design",
    status: "in-progress",
    summary: "A fashion marketplace.",
    detail: "Web app up. API in progress.",
  },

  // Development
  {
    slug: "bead-explorer",
    name: "Hawaiʻi BEAD Explorer",
    pillar: "Development",
    status: "live",
    summary: "Questions answered from Hawaiʻi's public broadband documents.",
    detail: "Every answer carries its verbatim source.",
    href: "https://bead.forpono.com",
    featured: true,
  },
  {
    slug: "risk-analytics",
    name: "Risk Analytics",
    pillar: "Development",
    status: "live",
    summary: "Analytics for public safety risk data.",
    detail: "Risk signals in one place, without extra data work.",
    href: "https://risk.forpono.com",
  },
  {
    slug: "air-hub",
    name: "AIR Hub",
    pillar: "Development",
    status: "live",
    summary: "The hub for a student builder bootcamp.",
    detail: "Cohorts, a live session queue, tutorials, a project registry.",
    href: "https://air.forpono.com",
  },
  {
    slug: "desktop-pet",
    name: "Desktop Pet",
    pillar: "Development",
    status: "recording",
    summary: "A desktop companion app.",
    detail: "Cross-platform. Tauri, React, SQLite.",
  },

  // Optimization
  {
    slug: "workflow-intel",
    name: "Workflow Intel",
    pillar: "Optimization",
    status: "in-progress",
    summary: "A pipeline that reads the field, scores what matters, and writes the weekly brief.",
    detail: "Private for now.",
  },
  {
    slug: "flyer-bot",
    name: "Flyer Bot",
    pillar: "Optimization",
    status: "in-progress",
    summary: "One input. Flyer, post, email.",
    detail: "Flyer, social post, and email from the same source.",
    featured: true,
  },
  {
    slug: "pace-bot",
    name: "PACE Bot",
    pillar: "Optimization",
    status: "past",
    summary: "A voice guide for questions and answers.",
    detail: "Built for a university program. No longer running.",
    featured: true,
  },
];
