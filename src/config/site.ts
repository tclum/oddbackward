export const siteConfig = {
  brandName: "DDO",
  legalName: "Timothy C. Lum",
  domain: "oddbackward.com",
  contactEmail: "tclum@forpono.com",
  urls: {
    home: "https://oddbackward.com",
    forpono: "https://forpono.com",
    founder: "https://tclum.forpono.com",
    riskAnalytics: "https://risk.forpono.com",
  },
} as const;

export type SiteUrlKey = keyof typeof siteConfig.urls;
