import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContactPanel } from "@/components/ContactPanel";
import { siteConfig } from "@/config/site";

describe("ContactPanel", () => {
  it("renders exactly one mailto link that shows the configured address", () => {
    const { container } = render(React.createElement(ContactPanel));
    const links = container.querySelectorAll("a");

    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe(`mailto:${siteConfig.contactEmail}`);
    expect(links[0].textContent).toBe(siteConfig.contactEmail);
  });

  it("types no address into its source", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/components/ContactPanel.tsx"),
      "utf8",
    );
    expect(source).not.toContain(siteConfig.contactEmail);
  });
});
