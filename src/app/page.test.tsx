import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import { metadata } from "@/app/layout";
import { siteConfig } from "@/config/site";
import { orbitNodes, pillarIds } from "@/data/orbit";
import { pillars, selectedWork } from "@/data/work";

function renderHome() {
  render(React.createElement(Home));
}

function coreMarkText(): string {
  return (document.querySelector(".core-mark")?.textContent ?? "").trim();
}

function isPermutationOfDDO(value: string): boolean {
  return value.split("").sort().join("") === "DDO";
}

describe("DDO Hawaii Orbit", () => {
  it("opens with the orbit: a DDO center plus one node per pillar", () => {
    renderHome();

    // Center wordmark is the static, server-rendered "DDO".
    expect(coreMarkText()).toBe("DDO");
    expect(isPermutationOfDDO(coreMarkText())).toBe(true);
    expect(screen.getByRole("button", { name: "DDO" })).toBeInTheDocument();

    // One ring node per pillar, derived from data (N-parameterized).
    for (const pillar of pillars) {
      expect(screen.getByRole("button", { name: pillar.pillar })).toBeInTheDocument();
    }
    expect(orbitNodes.filter((n) => n.kind === "pillar")).toHaveLength(pillarIds.length);
  });

  it("opens an accessible panel with each node's content", async () => {
    const user = userEvent.setup();
    renderHome();

    // Center panel: brand intro, the three paths, founder + contact.
    await user.click(screen.getByRole("button", { name: "DDO" }));
    let dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Design. Development. Optimization.")).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Get in touch" })).toBeInTheDocument();
    expect(
      within(dialog).getByRole("link", { name: "Need a website? Visit Forpono" }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("DDO is run by Timothy Lum.")).toBeInTheDocument();
    expect(
      within(dialog).getByText("Bring the messy version. We can shape it from there."),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: /close/i }));

    // Each pillar panel: its one-liner (statement) + its proofs.
    for (const pillar of pillars) {
      await user.click(screen.getByRole("button", { name: pillar.pillar }));
      dialog = screen.getByRole("dialog");
      expect(within(dialog).getByText(pillar.statement)).toBeInTheDocument();
      for (const proof of pillar.proofs) {
        expect(within(dialog).getAllByText(proof.name).length).toBeGreaterThan(0);
      }
      await user.click(within(dialog).getByRole("button", { name: /close/i }));
    }
  });

  it("surfaces the selected work inside its pillar panel", async () => {
    const user = userEvent.setup();
    renderHome();

    for (const pillar of pillars) {
      const work = selectedWork.filter((item) => item.pillar === pillar.pillar);
      if (work.length === 0) continue;
      await user.click(screen.getByRole("button", { name: pillar.pillar }));
      const dialog = screen.getByRole("dialog");
      for (const item of work) {
        expect(within(dialog).getAllByText(item.title).length).toBeGreaterThan(0);
        expect(within(dialog).getByText(item.summary)).toBeInTheDocument();
      }
      await user.click(within(dialog).getByRole("button", { name: /close/i }));
    }
  });

  it("Escape closes the panel and returns focus to the node", async () => {
    const user = userEvent.setup();
    renderHome();

    const designNode = screen.getByRole("button", { name: "Design" });
    await user.click(designNode);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(designNode).toHaveFocus();
  });

  it("locks the center to ODD after all three pillars are opened", async () => {
    const user = userEvent.setup();
    renderHome();

    expect(coreMarkText()).toBe("DDO");

    for (const pillar of pillars) {
      await user.click(screen.getByRole("button", { name: pillar.pillar }));
      await user.click(screen.getByRole("button", { name: /close/i }));
    }

    await waitFor(() => expect(coreMarkText()).toBe("ODD"));
    expect(isPermutationOfDDO(coreMarkText())).toBe(true);
    expect(document.querySelector(".orbit-core.is-locked")).not.toBeNull();
  });

  it("uses configured destinations for every external and contact link", () => {
    renderHome();

    const configuredUrls = Object.values(siteConfig.urls);
    const links = screen.getAllByRole("link", { hidden: true });
    const externalHrefs = links
      .map((link) => link.getAttribute("href"))
      .filter((href): href is string => href?.startsWith("https://") ?? false);

    expect(externalHrefs.length).toBeGreaterThan(0);
    for (const href of externalHrefs) {
      expect(configuredUrls).toContain(href);
    }

    expect(externalHrefs).toContain(siteConfig.urls.forpono);
    expect(externalHrefs).toContain(siteConfig.urls.founder);
    expect(externalHrefs).toContain(siteConfig.urls.riskAnalytics);
    expect(
      links.some((link) => link.getAttribute("href") === `mailto:${siteConfig.contactEmail}`),
    ).toBe(true);
  });

  it("keeps required brand, legal, and proof config values explicit", () => {
    expect(siteConfig.brandName).toBe("DDO");
    expect(siteConfig.legalName).toBe("DDO");
    expect(siteConfig.legalName).not.toMatch(/\bLLC\b/i);
    expect(siteConfig.contactEmail).toBe("tclum@forpono.com");
    expect(siteConfig.contactEmail).not.toBe("timothy@forpono.com");
    expect(siteConfig.urls.forpono).toBe("https://forpono.com");
    expect(siteConfig.urls.founder).toBe("https://tclum.forpono.com");
    expect(siteConfig.urls.riskAnalytics).toBe("https://risk.forpono.com");

    const proofEntries = pillars.flatMap((pillar) =>
      pillar.proofs.map((proof) => `${pillar.pillar}:${proof.name}`),
    );

    expect(proofEntries).toEqual(
      expect.arrayContaining([
        "Design:Forpono",
        "Development:Risk Analytics",
        "Development:bus-finance",
        "Optimization:Flyer Bot",
        "Optimization:Interactive information avatar",
      ]),
    );

    for (const pillar of pillars) {
      expect(pillar.proofs.length).toBeGreaterThanOrEqual(1);
      expect(pillar.proofs.length).toBeLessThanOrEqual(3);
    }
  });

  it("keeps configured URLs and email out of components", () => {
    const filesToCheck = [
      "src/app/page.tsx",
      "src/app/layout.tsx",
      "src/components/Orbit.tsx",
    ];

    const forbiddenValues = [
      siteConfig.contactEmail,
      ...Object.values(siteConfig.urls).filter((url) => url !== siteConfig.urls.home),
    ];

    for (const file of filesToCheck) {
      const source = fs.readFileSync(path.join(process.cwd(), file), "utf8");
      for (const value of forbiddenValues) {
        expect(source, `${file} should not hardcode ${value}`).not.toContain(value);
      }
    }
  });

  it("has an accessible orbit, footer, and image alt text", () => {
    renderHome();

    expect(screen.getByRole("main")).toBeInTheDocument();
    // core + three pillar nodes are real buttons.
    expect(screen.getAllByRole("button").length).toBeGreaterThanOrEqual(4);
    // all panel headings exist in the static HTML (present though collapsed).
    expect(screen.getAllByRole("heading", { hidden: true }).length).toBeGreaterThanOrEqual(6);

    const images = screen.getAllByRole("img", { hidden: true });
    expect(images.length).toBeGreaterThan(0);
    for (const image of images) {
      expect(image).toHaveAccessibleName();
    }
  });

  it("does not use registered-entity wording or foreground the two-letter acronym", () => {
    renderHome();

    const visibleText = document.body.textContent ?? "";
    const metadataText = [metadata.title, metadata.description].join(" ");
    const combinedCustomerText = `${visibleText} ${metadataText}`;

    expect(combinedCustomerText).not.toMatch(/\bLLC\b/i);
    expect(combinedCustomerText).not.toMatch(/\bAI\b/);
    expect(screen.getByText(`© ${new Date().getFullYear()} DDO`)).toBeInTheDocument();
  });
});
