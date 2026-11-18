import { siteConfig } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="site-brand" href="#top">
        {siteConfig.brandName}
      </a>
      <nav className="site-nav" aria-label="Sections">
        <a href="#services">Services</a>
        <a href="#work">Work</a>
        <a href="#about">About</a>
        <a className="btn btn-ink" href={`mailto:${siteConfig.contactEmail}`}>
          Contact
        </a>
      </nav>
    </header>
  );
}
