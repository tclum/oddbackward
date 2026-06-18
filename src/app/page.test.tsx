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

function renderHome() {
  render(React.createElement(Home));
}

function coreMarkText(): string {
  return (document.querySelector(".core-mark")?.textContent ?? "").trim();
}

function centerWordsText(): string {
  return (document.querySelector(".core-words")?.textContent ?? "").trim();
}

// Open and close all three distinct pillars — the v2 path that walks the reveal
// FSM odd → exploring → ddo (center reads DDO; the :) trigger appears).
async function reachDdo(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  for (const pillar of pillars) {
    await user.click(screen.getByRole("button", { name: pillar.pillar }));
    await user.click(screen.getByRole("button", { name: /close/i }));
  }
  await waitFor(() => expect(coreMarkText()).toBe("DDO"));
}

describe("DDO Hawaii Orbit", () => {
  it("opens in the odd phase: an ODD center plus one node per pillar", () => {
    renderHome();

    // Center wordmark is the deterministic, server-rendered "ODD".
    expect(coreMarkText()).toBe("ODD");
    // Center is display-only (not a button) until the ddo phase.
    expect(screen.queryByRole("button", { name: /reveal/i })).not.toBeInTheDocument();

    // One ring node per pillar, derived from data (N-parameterized).
    for (const pillar of pillars) {
      expect(screen.getByRole("button", { name: pillar.pillar })).toBeInTheDocument();
    }
    expect(orbitNodes.filter((n) => n.kind === "pillar")).toHaveLength(pillarIds.length);
  });

  it("walks the reveal FSM: opening distinct pillars goes exploring → exploring → ddo", async () => {
    const user = userEvent.setup();
    renderHome();

    expect(coreMarkText()).toBe("ODD");
    expect(document.querySelector(".orbit-core.is-sparkle")).toBeNull();
    expect(document.querySelector(".orbit-core.is-glow")).toBeNull();

    // 1st distinct → exploring, sparkle, letters still ODD
    await user.click(screen.getByRole("button", { name: pillars[0].pillar }));
    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(coreMarkText()).toBe("ODD");
    expect(document.querySelector(".orbit-core.is-sparkle")).not.toBeNull();
    expect(document.querySelector(".orbit-core.is-glow")).toBeNull();

    // 2nd distinct → exploring, glow added, sparkle kept
    await user.click(screen.getByRole("button", { name: pillars[1].pillar }));
    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(coreMarkText()).toBe("ODD");
    expect(document.querySelector(".orbit-core.is-sparkle")).not.toBeNull();
    expect(document.querySelector(".orbit-core.is-glow")).not.toBeNull();

    // 3rd distinct → ddo, center reads DDO
    await user.click(screen.getByRole("button", { name: pillars[2].pillar }));
    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(coreMarkText()).toBe("DDO");
  });

  it("plays the finale on DDO click — shows the three words, then resets to ODD", async () => {
    const user = userEvent.setup();
    renderHome();
    await reachDdo(user);
    expect(coreMarkText()).toBe("DDO");

    await user.click(screen.getByRole("button", { name: /reveal/i }));

    // finale: the three pillar words (no letter mark)
    const words = centerWordsText();
    expect(words).toContain("Design");
    expect(words).toContain("Development");
    expect(words).toContain("Optimization");

    // auto-resets back to the odd start state
    await waitFor(() => expect(coreMarkText()).toBe("ODD"), { timeout: 4000 });
  }, 10000);

  it("gates :) on the ddo phase: hidden before, shown in ddo, gone after reset", async () => {
    const user = userEvent.setup();
    renderHome();

    expect(screen.queryByRole("button", { name: "Portfolio code" })).not.toBeInTheDocument();

    await reachDdo(user);
    expect(screen.getByRole("button", { name: "Portfolio code" })).toBeInTheDocument();

    // finale → reset clears the trigger
    await user.click(screen.getByRole("button", { name: /reveal/i }));
    await waitFor(() => expect(coreMarkText()).toBe("ODD"), { timeout: 4000 });
    expect(screen.queryByRole("button", { name: "Portfolio code" })).not.toBeInTheDocument();
  }, 10000);

  it("opens an accessible panel with each pillar's content", async () => {
    const user = userEvent.setup();
    renderHome();

    for (const pillar of pillars) {
      await user.click(screen.getByRole("button", { name: pillar.pillar }));
      const dialog = screen.getByRole("dialog");
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
    // real registry
    expect(resolvePortfolio("tim")).toEqual(portfolios[0]);
    expect(resolvePortfolio("  TIM  ")).toEqual(portfolios[0]); // normalized
    expect(resolvePortfolio("zzz")).toBeNull();

    // a fake multi-entry registry — proves the lookup isn't hardcoded to "tim"
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

  it("has an accessible orbit, footer, and image alt text", () => {
    renderHome();

    expect(screen.getByRole("main")).toBeInTheDocument();
    // the three pillar nodes are real buttons (the center is display-only until ddo).
    expect(screen.getAllByRole("button").length).toBeGreaterThanOrEqual(pillars.length);
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
