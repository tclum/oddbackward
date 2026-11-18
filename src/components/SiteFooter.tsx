import { siteConfig } from "@/config/site";

export function SiteFooter() {
  const line = `© ${new Date().getFullYear()} ${siteConfig.legalName}, ${siteConfig.location}`;
  return (
    <footer className="site-footer">
      <span>{line}</span>
      <a href={siteConfig.urls.forpono}>Need a website? Forpono</a>
    </footer>
  );
}
