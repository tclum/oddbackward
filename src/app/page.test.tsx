import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import { metadata } from "@/app/layout";
import { siteConfig } from "@/config/site";
import { orbitNodes, pillarIds } from "@/data/orbit";
import { portfolios, resolvePortfolio } from "@/data/portfolio";
import { pillars, selectedWork } from "@/data/work";

const pillarNodes = orbitNodes.filter((n) => n.kind === "pillar");

function renderHome() {
  render(React.createElement(Home));
}

function coreMarkText(): string {
  return (document.querySelector(".core-mark")?.textContent ?? "").trim();
}

function centerWordsText(): string {
  return (document.querySelector(".core-words")?.textContent ?? "").trim();
}

function orbitRegion(): HTMLElement {
  return screen.getByRole("region", { name: "DDO pillar orbit" });
}

// Pillar nodes live in the orbit region; dock tabs share the same labels but live
// in the bottom strip — scope queries so the two never collide.
function pillarButton(name: string): HTMLElement {
  return within(orbitRegion()).getByRole("button", { name });
}

function dockStrip(): HTMLElement {
  return screen.getByRole("group", { name: "Open pillars" });
}

function tabButton(name: string): HTMLElement {
  return within(dockStrip()).getByRole("button", { name });
}

function panelEl(id: string): HTMLElement {
  const el = document.getElementById(`panel-${id}`);
  if (!el) throw new Error(`panel-${id} not found`);
  return el;
}

// Open all three distinct pillars — walks the reveal FSM to ddo. Non-modal now,
// so each pillar click just expands it (the prior one auto-minimizes); no close.
async function reachDdo(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  for (const pillar of pillars) {
    await user.click(pillarButton(pillar.pillar));
  }
  await waitFor(() => expect(coreMarkText()).toBe("DDO"));
}

describe("DDO Hawaii Orbit", () => {
  it("opens in the odd phase: an ODD center plus one node per pillar", () => {
    renderHome();

    expect(coreMarkText()).toBe("ODD");
    // Center is display-only (not a button) until the ddo phase.
    expect(screen.queryByRole("button", { name: /reveal/i })).not.toBeInTheDocument();

    for (const pillar of pillars) {
      expect(pillarButton(pillar.pillar)).toBeInTheDocument();
    }
    expect(pillarNodes).toHaveLength(pillarIds.length);
  });

  it("walks the reveal FSM: opening distinct pillars goes exploring → exploring → ddo", async () => {
    const user = userEvent.setup();
    renderHome();

    expect(coreMarkText()).toBe("ODD");
    expect(document.querySelector(".orbit-core.is-sparkle")).toBeNull();
    expect(document.querySelector(".orbit-core.is-glow")).toBeNull();

    await user.click(pillarButton(pillarNodes[0].nodeLabel));
    expect(coreMarkText()).toBe("ODD");
    expect(document.querySelector(".orbit-core.is-sparkle")).not.toBeNull();
    expect(document.querySelector(".orbit-core.is-glow")).toBeNull();

    await user.click(pillarButton(pillarNodes[1].nodeLabel));
    expect(coreMarkText()).toBe("ODD");
    expect(document.querySelector(".orbit-core.is-sparkle")).not.toBeNull();
    expect(document.querySelector(".orbit-core.is-glow")).not.toBeNull();

    await user.click(pillarButton(pillarNodes[2].nodeLabel));
    expect(coreMarkText()).toBe("DDO");
  });

  it("plays the finale on DDO click — words + CTA popup, held until dismissed", async () => {
    const user = userEvent.setup();
    renderHome();
    await reachDdo(user);
    expect(coreMarkText()).toBe("DDO");

    await user.click(screen.getByRole("button", { name: /reveal/i }));

    // the three words at the center (the mark is gone in finale)
    expect(coreMarkText()).toBe("");
    const words = centerWordsText();
    expect(words).toContain("Design");
    expect(words).toContain("Development");
    expect(words).toContain("Optimization");

    // the finale popup surfaces the center node's CTA content, and holds (no
    // auto-reset — the dialog is still present after the click).
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("link", { name: "Get in touch" })).toBeInTheDocument();
    expect(
      within(dialog).getByRole("link", { name: "Need a website? Visit Forpono" }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Run by Timothy Lum.")).toBeInTheDocument();

    // dismiss via the close button → back to the odd start state
    await user.click(within(dialog).getByRole("button", { name: /close/i }));
    await waitFor(() => expect(coreMarkText()).toBe("ODD"));
  }, 10000);

  it("gates :) on the ddo phase: hidden before, shown in ddo, gone after finale dismiss", async () => {
    const user = userEvent.setup();
    renderHome();

    expect(screen.queryByRole("button", { name: "Portfolio code" })).not.toBeInTheDocument();

    await reachDdo(user);
    expect(screen.getByRole("button", { name: "Portfolio code" })).toBeInTheDocument();

    // enter the finale, then dismiss it with Escape → reset to odd
    await user.click(screen.getByRole("button", { name: /reveal/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");

    await waitFor(() => expect(coreMarkText()).toBe("ODD"));
    expect(screen.queryByRole("button", { name: "Portfolio code" })).not.toBeInTheDocument();
  }, 10000);

  it("docks a clicked pillar as an expanded labelled region with its content", async () => {
    const user = userEvent.setup();
    renderHome();
    const node = pillarNodes[0];

    await user.click(pillarButton(node.nodeLabel));

    const panel = panelEl(node.id);
    expect(panel).toHaveAttribute("data-state", "expanded");
    expect(panel).toHaveAttribute("role", "region");
    expect(within(panel).getByText(node.title)).toBeInTheDocument(); // its one-liner

    const tab = tabButton(node.nodeLabel);
    expect(tab).toHaveAttribute("aria-expanded", "true");
  });

  it("keeps exactly one pillar expanded at a time", async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(pillarButton(pillarNodes[0].nodeLabel));
    await user.click(pillarButton(pillarNodes[1].nodeLabel));

    expect(panelEl(pillarNodes[0].id)).toHaveAttribute("data-state", "minimized");
    expect(panelEl(pillarNodes[1].id)).toHaveAttribute("data-state", "expanded");
    expect(tabButton(pillarNodes[0].nodeLabel)).toHaveAttribute("aria-expanded", "false");
    expect(tabButton(pillarNodes[1].nodeLabel)).toHaveAttribute("aria-expanded", "true");
  });

  it("accumulates up to three tabs and re-expands from a tab", async () => {
    const user = userEvent.setup();
    renderHome();

    for (const node of pillarNodes) {
      await user.click(pillarButton(node.nodeLabel));
    }
    expect(within(dockStrip()).getAllByRole("button")).toHaveLength(pillarNodes.length);
    expect(panelEl(pillarNodes[2].id)).toHaveAttribute("data-state", "expanded");

    // re-expand the first pillar from its tab; the prior one minimizes
    await user.click(tabButton(pillarNodes[0].nodeLabel));
    expect(panelEl(pillarNodes[0].id)).toHaveAttribute("data-state", "expanded");
    expect(panelEl(pillarNodes[2].id)).toHaveAttribute("data-state", "minimized");
  });

  it("Escape minimizes the expanded panel and leaves the orbit live", async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(pillarButton(pillarNodes[0].nodeLabel));
    expect(panelEl(pillarNodes[0].id)).toHaveAttribute("data-state", "expanded");

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(panelEl(pillarNodes[0].id)).toHaveAttribute("data-state", "minimized"),
    );
    expect(orbitRegion()).toBeInTheDocument();
    expect(tabButton(pillarNodes[0].nodeLabel)).toHaveAttribute("aria-expanded", "false");
  });

  it("surfaces the selected work inside its pillar panel", async () => {
    const user = userEvent.setup();
    renderHome();

    for (const node of pillarNodes) {
      const work = selectedWork.filter((item) => item.pillar === node.nodeLabel);
      if (work.length === 0) continue;
      await user.click(pillarButton(node.nodeLabel));
      const panel = panelEl(node.id);
      for (const item of work) {
        expect(within(panel).getAllByText(item.title).length).toBeGreaterThan(0);
        expect(within(panel).getByText(item.summary)).toBeInTheDocument();
      }
    }
  });

  it("opens the portfolio-code overlay with three letter slots", async () => {
    const user = userEvent.setup();
    renderHome();
    await reachDdo(user);

    await user.click(screen.getByRole("button", { name: "Portfolio code" }));
    const dialog = screen.getByRole("dialog", { name: "time without e" });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getAllByRole("textbox")).toHaveLength(3);
  });

  it("resolves a correct code to the registry portfolioUrl", async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    renderHome();
    await reachDdo(user);

    await user.click(screen.getByRole("button", { name: "Portfolio code" }));
    await user.keyboard("tim");

    expect(openSpy).toHaveBeenCalledWith(
      portfolios[0].portfolioUrl,
      "_blank",
      "noopener,noreferrer",
    );
    openSpy.mockRestore();
  });

  it("gives dry retry feedback for a wrong code and does not navigate", async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    renderHome();
    await reachDdo(user);

    await user.click(screen.getByRole("button", { name: "Portfolio code" }));
    await user.keyboard("zzz");

    expect(await screen.findByText("not quite")).toBeInTheDocument();
    expect(openSpy).not.toHaveBeenCalled();

    const dialog = screen.getByRole("dialog", { name: "time without e" });
    for (const slot of within(dialog).getAllByRole("textbox")) {
      expect(slot).toHaveValue("");
    }
    openSpy.mockRestore();
  });

  it("looks up codes generically over the registry (a second entry resolves too)", () => {
    expect(resolvePortfolio("tim")).toEqual(portfolios[0]);
    expect(resolvePortfolio("  TIM  ")).toEqual(portfolios[0]); // normalized
    expect(resolvePortfolio("zzz")).toBeNull();

    const fake = [
      { code: "abc", name: "Ada B.", portfolioUrl: "https://ada.example" },
      { code: "xyz", name: "Xan Y.", portfolioUrl: "https://xan.example" },
    ];
    expect(resolvePortfolio("abc", fake)?.portfolioUrl).toBe("https://ada.example");
    expect(resolvePortfolio("XYZ ", fake)?.portfolioUrl).toBe("https://xan.example");
    expect(resolvePortfolio("tim", fake)).toBeNull();
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

  it("renders all pillar content in the static HTML (no-JS fallback); dock is client-only", () => {
    renderHome();

    // every pillar's content region is present (the stacked no-JS fallback)
    for (const node of pillarNodes) {
      const panel = panelEl(node.id);
      expect(within(panel).getByText(node.title)).toBeInTheDocument();
    }
    // the dock chrome only exists after a client interaction
    expect(screen.queryByRole("group", { name: "Open pillars" })).not.toBeInTheDocument();
  });

  it("has an accessible orbit, footer, and image alt text", () => {
    renderHome();

    expect(screen.getByRole("main")).toBeInTheDocument();
    // the three pillar nodes are real buttons (the center is display-only until ddo).
    expect(within(orbitRegion()).getAllByRole("button").length).toBeGreaterThanOrEqual(
      pillars.length,
    );
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
