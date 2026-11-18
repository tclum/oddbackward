import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import { metadata } from "@/app/layout";
import { siteConfig } from "@/config/site";
import { projects } from "@/data/projects";
import { services } from "@/data/services";
import { pillars } from "@/data/work";

function renderHome() {
  render(React.createElement(Home));
}

const registryHrefs = projects
  .map((project) => project.href)
  .filter((href): href is string => typeof href === "string");

function sourceFilesUnder(dir: string): string[] {
  const found: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...sourceFilesUnder(full));
    } else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      found.push(full);
    }
  }
  return found;
}

describe("DDO home page", () => {
  it("keeps the config explicit", () => {
    expect({
      brandName: siteConfig.brandName,
      shortName: siteConfig.shortName,
      legalName: siteConfig.legalName,
      location: siteConfig.location,
      contactEmail: siteConfig.contactEmail,
      domain: siteConfig.domain,
      urls: siteConfig.urls,
    }).toEqual({
      brandName: "DDO Tech Solutions",
      shortName: "DDO",
      legalName: "DDO LLC",
      location: "Honolulu, Hawaiʻi",
      contactEmail: "tim@ddotechsolutions.com",
      domain: "ddotechsolutions.com",
      urls: {
        home: "https://ddotechsolutions.com",
        forpono: "https://forpono.com",
        founder: "https://tclum.forpono.com/about",
      },
    });
  });

  it("uses configured destinations for every outbound and mailto link", () => {
    renderHome();

    const allowed = new Set<string>([...Object.values(siteConfig.urls), ...registryHrefs]);
    const hrefs = [...document.querySelectorAll("a[href]")].map(
      (link) => link.getAttribute("href") ?? "",
    );

    const external = hrefs.filter((href) => href.startsWith("https://"));
    for (const href of external) {
      expect(allowed.has(href), `unconfigured outbound link ${href}`).toBe(true);
    }
    expect(external).toContain(siteConfig.urls.forpono);
    expect(external).toContain(siteConfig.urls.founder);

    const mailtos = hrefs.filter((href) => href.startsWith("mailto:"));
    expect(mailtos).toHaveLength(3);
    for (const href of mailtos) {
      expect(href).toBe(`mailto:${siteConfig.contactEmail}`);
    }
  });

  it("types no address into any app or component file", () => {
    const files = [
      ...sourceFilesUnder(path.join(process.cwd(), "src/app")),
      ...sourceFilesUnder(path.join(process.cwd(), "src/components")),
    ];
    expect(files.length).toBeGreaterThanOrEqual(6);

    const forbidden = [
      siteConfig.contactEmail,
      ...Object.values(siteConfig.urls).filter((url) => url !== siteConfig.urls.home),
      ...registryHrefs,
    ];
    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      for (const value of forbidden) {
        expect(source, `${path.relative(process.cwd(), file)} hardcodes ${value}`).not.toContain(
          value,
        );
      }
    }
  });

  it("orders the sections h1, services, work, about, contact, with one h1", () => {
    renderHome();

    const h1s = document.querySelectorAll("h1");
    expect(h1s).toHaveLength(1);

    const sequence = [
      h1s[0],
      document.getElementById("services"),
      document.getElementById("work"),
      document.getElementById("about"),
      document.getElementById("contact"),
    ];
    for (const el of sequence) expect(el).not.toBeNull();
    for (let i = 1; i < sequence.length; i += 1) {
      const position = sequence[i - 1]!.compareDocumentPosition(sequence[i]!);
      expect(position & Node.DOCUMENT_POSITION_FOLLOWING, `step ${i}`).toBeTruthy();
    }
  });

  it("lists one service row per pillar, in pillar order", () => {
    renderHome();

    const rows = [...document.querySelectorAll("#services .service-row")];
    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.querySelector("h3")?.textContent)).toEqual(
      pillars.map((block) => block.pillar),
    );
    expect(services.map((service) => service.pillar)).toEqual(
      pillars.map((block) => block.pillar),
    );
  });

  it("keeps the brand wording: no AI, LLC once in the footer, brand name in the header", () => {
    renderHome();

    const body = document.body.textContent ?? "";
    const metadataText = [metadata.title, metadata.description].join(" ");

    expect(`${body} ${metadataText}`).not.toMatch(/\bAI\b/);
    expect(metadataText).not.toMatch(/\bLLC\b/);
    expect(body.match(/\bLLC\b/g)).toHaveLength(1);

    const footer = document.querySelector("footer");
    expect(footer?.textContent).toContain(
      `© ${new Date().getFullYear()} DDO LLC, Honolulu, Hawaiʻi`,
    );

    const header = document.querySelector("header");
    expect(header?.textContent).toContain(siteConfig.brandName);
  });

  it("puts every project, service line and the contact address in the static HTML", () => {
    const html = renderToStaticMarkup(React.createElement(Home));
    // Entities aside, the static markup is the text a no-JS visitor reads.
    const text = html.replace(/&#x27;/g, "'").replace(/&amp;/g, "&");

    for (const project of projects) {
      expect(text, `${project.slug} missing from static HTML`).toContain(project.name);
    }
    for (const service of services) {
      expect(text).toContain(service.when);
      expect(text).toContain(service.body);
    }
    expect(text).toContain(siteConfig.contactEmail);
  });

  it("is accessible: a main landmark, named images, hidden pictograms", () => {
    renderHome();

    const main = screen.getByRole("main");
    const banners = screen.getAllByRole("banner");
    const footers = screen.getAllByRole("contentinfo");
    expect(banners).toHaveLength(1);
    expect(footers).toHaveLength(1);
    expect(main.contains(banners[0])).toBe(false);
    expect(main.contains(footers[0])).toBe(false);

    const images = screen.getAllByRole("img", { hidden: true });
    expect(images.length).toBeGreaterThan(0);
    for (const image of images) {
      expect(image).toHaveAccessibleName();
    }

    const pictograms = [...document.querySelectorAll("#services .service-icon")];
    expect(pictograms).toHaveLength(3);
    for (const pictogram of pictograms) {
      expect(pictogram.getAttribute("aria-hidden")).toBe("true");
      expect(images).not.toContain(pictogram);
    }
  });
});
