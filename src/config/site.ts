export const siteConfig = {
  brandName: "DDO Tech Solutions",
  shortName: "DDO",
  legalName: "DDO LLC",
  location: "Honolulu, Hawaiʻi",
  // Where this address is served and redirected from: docs/deploy.md, "Domains".
  domain: "ddotechsolutions.com",
  contactEmail: "tim@ddotechsolutions.com",
  urls: {
    home: "https://ddotechsolutions.com",
    forpono: "https://forpono.com",
    founder: "https://tclum.forpono.com/about",
  },
} as const;

export type SiteUrlKey = keyof typeof siteConfig.urls;
