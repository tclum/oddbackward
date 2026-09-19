import type { NextConfig } from "next";
import { execSync } from "node:child_process";

function buildStamp(): string {
  let sha = "nogit";
  let dirty = "";
  try {
    sha = execSync("git rev-parse --short HEAD").toString().trim();
    if (execSync("git status --porcelain").toString().trim() !== "") dirty = "-dirty";
  } catch {}
  return `${sha}${dirty} ${new Date().toISOString()}`;
}

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BUILD_STAMP: buildStamp(),
  },
};

export default nextConfig;
