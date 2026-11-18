import { siteConfig } from "@/config/site";
import { HeroGraphic } from "@/components/HeroGraphic";

export function Hero() {
  return (
    <section id="top" className="hero">
      <div className="hero-copy">
        <h1 className="hero-title">Websites, tools, and less busywork for Hawaiʻi&apos;s teams.</h1>
        <div className="hero-actions">
          <a className="btn btn-accent cta" href={`mailto:${siteConfig.contactEmail}`}>
            Send the rough version
          </a>
          <a className="btn btn-outline cta" href="#work">
            See the work
          </a>
        </div>
      </div>
      <div className="hero-art">
        <HeroGraphic />
      </div>
    </section>
  );
}
