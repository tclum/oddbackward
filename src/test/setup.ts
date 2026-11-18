import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// next/font/google is resolved by the Next compiler at build time; outside Next
// its exports are empty. Tests import layout.tsx for its metadata, so stand the
// two loaders in with inert objects.
vi.mock("next/font/google", () => {
  const font = () => ({ className: "", variable: "", style: { fontFamily: "" } });
  return { Bricolage_Grotesque: font, Inter: font };
});
