export const siteConfig = {
  brandName: "DDO",
  legalName: "DDO",
  // Flip domain and home to oddbackward.com once that domain is live.
  domain: "oddbackward.forpono.com",
  contactEmail: "tclum@forpono.com",
  urls: {
    home: "https://oddbackward.forpono.com",
    forpono: "https://forpono.com",
    founder: "https://tclum.forpono.com",
  },
} as const;

export type SiteUrlKey = keyof typeof siteConfig.urls;
