import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import { metadata } from "@/app/layout";
import { RevealToggle } from "@/components/RevealToggle";
import { siteConfig } from "@/config/site";
import { pillars, selectedWork } from "@/data/work";

function renderHome() {
  render(React.createElement(Home));
}

describe("DDO landing page", () => {
  it("renders the required landing-page sections", () => {
    renderHome();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Design. Development. Optimization.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("What DDO does")).toBeInTheDocument();
    expect(screen.getByText("Selected work")).toBeInTheDocument();
    expect(screen.getByText("Why oddbackward?")).toBeInTheDocument();
    expect(screen.getAllByText("Founder").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Contact").length).toBeGreaterThan(0);
  });

  it("renders selected work from the data file", () => {
    renderHome();

    for (const item of selectedWork) {
      expect(screen.getByRole("heading", { name: item.title })).toBeInTheDocument();
      expect(screen.getByText(item.summary)).toBeInTheDocument();
    }
  });

  it("toggles the DDO to ODD reveal", async () => {
    const user = userEvent.setup();
    render(React.createElement(RevealToggle));

    const toggle = screen.getByRole("button", {
      name: "Toggle DDO backwards reveal",
    });

    expect(toggle).toHaveTextContent("DDO");
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    await user.click(toggle);

    expect(toggle).toHaveTextContent("ODD");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("yes — DDO, backwards.")).toBeInTheDocument();
  });

  it("uses configured destinations for every external and contact link", () => {
    renderHome();

    const configuredUrls = Object.values(siteConfig.urls);
    const links = screen.getAllByRole("link");
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
        "Optimization:PACE",
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
      "src/components/ExternalLink.tsx",
      "src/components/RevealToggle.tsx",
      "src/components/SectionHeader.tsx",
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

  it("has basic accessible structure and image alt text", () => {
    renderHome();

    expect(screen.getAllByRole("heading").length).toBeGreaterThanOrEqual(6);
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Footer navigation" })).toBeInTheDocument();

    const main = screen.getByRole("main");
    const images = within(main).getAllByRole("img");
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
