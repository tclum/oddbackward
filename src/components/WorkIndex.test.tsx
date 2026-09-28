import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WorkIndex } from "@/components/WorkIndex";
import { projects } from "@/data/projects";
import { STATUS_LABEL } from "@/data/work";

function workSection(): HTMLElement {
  render(React.createElement(WorkIndex));
  const section = document.getElementById("work");
  if (!section) throw new Error("#work section not rendered");
  return section;
}

function rowsNamed(section: HTMLElement, name: string): Element[] {
  return [...section.querySelectorAll(".work-row")].filter(
    (row) => row.querySelector(".work-name")?.textContent === name,
  );
}

describe("WorkIndex", () => {
  it("lists every registry project exactly once", () => {
    const section = workSection();
    for (const project of projects) {
      expect(rowsNamed(section, project.name), `${project.slug} row count`).toHaveLength(1);
    }
    expect(section.querySelectorAll(".work-row")).toHaveLength(projects.length);
  });

  it("links only live projects, each to its registry href", () => {
    const section = workSection();
    const live = projects.filter((project) => project.status === "live");
    const anchors = [...section.querySelectorAll("a")];

    expect(anchors).toHaveLength(live.length);
    for (const project of live) {
      const [row] = rowsNamed(section, project.name);
      expect(row.tagName, `${project.slug} should render as a link`).toBe("A");
      expect(row.getAttribute("href")).toBe(project.href);
      expect(row.getAttribute("target")).toBe("_blank");
      expect(row.getAttribute("rel")).toBe("noopener noreferrer");
    }
    for (const project of projects.filter((p) => p.status !== "live")) {
      const [row] = rowsNamed(section, project.name);
      expect(row.tagName, `${project.slug} must not render as a link`).not.toBe("A");
      expect(row.querySelector("a")).toBeNull();
    }
  });

  it("shows each project's status label from STATUS_LABEL", () => {
    const section = workSection();
    for (const project of projects) {
      const [row] = rowsNamed(section, project.name);
      expect(row.querySelector(".work-tag")?.textContent, `${project.slug} status`).toBe(
        STATUS_LABEL[project.status],
      );
    }
  });

  it("is a server component that hardcodes no project name or forpono.com URL", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/components/WorkIndex.tsx"),
      "utf8",
    );
    expect(source).not.toContain("use client");
    expect(source).not.toContain("forpono.com");
    for (const project of projects) {
      expect(source, `WorkIndex.tsx hardcodes "${project.name}"`).not.toContain(project.name);
    }
  });
});
