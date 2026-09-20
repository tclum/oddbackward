import { describe, expect, it } from "vitest";
import { projects } from "@/data/projects";
import { pillars } from "@/data/work";

const FORBIDDEN_TOKENS = ["chef's kiss", "chefs-kiss", "proquote", "comped"];

describe("project registry", () => {
  it("has unique slugs", () => {
    const slugs = projects.map((project) => project.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("carries an href if and only if status is live", () => {
    for (const project of projects) {
      if (project.status === "live") {
        expect(project.href, `${project.slug} is live and must have href`).toBeTypeOf("string");
      } else {
        expect(project.href, `${project.slug} is ${project.status} and must not have href`)
          .toBeUndefined();
      }
    }
  });

  it("routes every href through https to forpono.com or a *.forpono.com subdomain", () => {
    for (const project of projects) {
      if (!project.href) continue;
      const url = new URL(project.href);
      expect(url.protocol, `${project.slug} href protocol`).toBe("https:");
      expect(
        url.host === "forpono.com" || url.host.endsWith(".forpono.com"),
        `${project.slug} href host ${url.host} must be forpono.com or *.forpono.com`,
      ).toBe(true);
    }
  });

  it("populates every pillar with at least one project", () => {
    for (const pillar of pillars) {
      const count = projects.filter((project) => project.pillar === pillar.pillar).length;
      expect(count, `pillar ${pillar.pillar} has no projects`).toBeGreaterThan(0);
    }
  });

  it("carries none of the retired copy tokens anywhere in the serialized registry", () => {
    const haystack = JSON.stringify(projects).toLowerCase();
    for (const token of FORBIDDEN_TOKENS) {
      expect(haystack, `retired token "${token}" reappears in projects.ts`).not.toContain(token);
    }
  });

  it("derives pillar proofs count equal to the registry count per pillar", () => {
    for (const pillar of pillars) {
      const registryCount = projects.filter((project) => project.pillar === pillar.pillar).length;
      expect(pillar.proofs.length).toBe(registryCount);
    }
  });
});
