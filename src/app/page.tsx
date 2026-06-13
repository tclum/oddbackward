import { ArrowRight, Mail } from "lucide-react";
import { ExternalLink } from "@/components/ExternalLink";
import { RevealToggle } from "@/components/RevealToggle";
import { SectionHeader } from "@/components/SectionHeader";
import { siteConfig } from "@/config/site";
import { pillars, selectedWork } from "@/data/work";

export const dynamic = "force-static";

const navItems = [
  { href: "#pillars", label: "Services" },
  { href: "#work", label: "Work" },
  { href: "#founder", label: "Founder" },
  { href: "#contact", label: "Contact" },
];

function urlFor(key: keyof typeof siteConfig.urls) {
  return siteConfig.urls[key];
}

export default function Home() {
  const year = new Date().getFullYear();

  return (
    <main>
      <header className="px-gutter pt-6">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex max-w-7xl items-center justify-between gap-6"
        >
          <a
            href="#top"
            className="text-lg font-semibold tracking-[0.18em] text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            {siteConfig.brandName}
          </a>
          <div className="hidden items-center gap-6 text-sm text-muted md:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      </header>

      <section id="top" className="px-gutter pb-section pt-16 md:pt-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)]">
          <div>
            <p className="mb-5 text-lg font-semibold tracking-[0.2em] text-accent">
              {siteConfig.brandName}
            </p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] text-ink md:text-7xl">
              Design. Development. Optimization.
            </h1>
            <p className="mt-7 max-w-2xl text-xl leading-9 text-muted">
              A little odd, on purpose &mdash; custom websites, apps, and automation
              for small businesses and teams.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-card bg-accent px-5 py-3 text-sm font-semibold text-accent-ink transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                <Mail aria-hidden="true" className="h-4 w-4" />
                Get in touch
              </a>
              <a
                href={urlFor("forpono")}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-card border border-line bg-surface px-5 py-3 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                Need a website? <span>Forpono</span>
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="relative">
            <img
              src="/images/studio-workbench.png"
              alt="Desk with planning notes and a screen showing simple layout blocks"
              className="aspect-[4/3] w-full rounded-card border border-line object-cover shadow-soft"
            />
          </div>
        </div>
      </section>

      <section id="pillars" className="border-y border-line bg-surface px-gutter py-section">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="What DDO does"
            title="Practical work across the full path from idea to improvement."
            intro="The offer is intentionally simple: make the thing clear, build the useful parts, then keep improving the work around it."
          />
          <div className="mt-14 space-y-12">
            {pillars.map((pillar) => (
              <article
                key={pillar.pillar}
                className="grid gap-8 border-t border-line pt-10 lg:grid-cols-[16rem_minmax(0,1fr)]"
              >
                <h3 className="text-2xl font-semibold text-ink">{pillar.pillar}</h3>
                <div>
                  <p className="max-w-3xl text-2xl leading-10 text-ink">
                    {pillar.statement}
                  </p>
                  <ul className="mt-8 grid gap-4 md:grid-cols-2">
                    {pillar.proofs.map((proof) => (
                      <li key={proof.name} className="border-l border-line pl-5">
                        {proof.urlKey ? (
                          <ExternalLink
                            href={urlFor(proof.urlKey)}
                            className="inline-flex items-center gap-1 font-semibold text-ink hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                            label={`${proof.name} website`}
                          >
                            {proof.name}
                          </ExternalLink>
                        ) : (
                          <p className="font-semibold text-ink">{proof.name}</p>
                        )}
                        <p className="mt-2 leading-7 text-muted">{proof.summary}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="work" className="px-gutter py-section">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Selected work"
            title="A few examples, chosen for depth instead of noise."
            intro="Each one points to a useful outcome: clearer presentation, better decisions, or less repeat work."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {selectedWork.map((item) => (
              <article
                key={item.title}
                className="rounded-card border border-line bg-surface p-6 shadow-soft"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">
                  {item.pillar}
                </p>
                <h3 className="mt-5 text-2xl font-semibold text-ink">{item.title}</h3>
                <p className="mt-3 text-lg leading-8 text-ink">{item.summary}</p>
                <p className="mt-4 leading-7 text-muted">{item.detail}</p>
                {item.urlKey ? (
                  <ExternalLink
                    href={urlFor(item.urlKey)}
                    className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-ink hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                    label={`${item.title} website`}
                  >
                    Visit project
                  </ExternalLink>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="reveal-heading" className="bg-ink px-gutter py-section text-surface">
        <div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-[1fr_auto]">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-surface/70">
              Why oddbackward?
            </p>
            <h2 id="reveal-heading" className="max-w-3xl text-3xl font-semibold md:text-5xl">
              A small reveal for a studio that likes useful work with a little sideways thinking.
            </h2>
          </div>
          <RevealToggle className="text-center" />
        </div>
      </section>

      <section
        id="founder"
        className="border-b border-line bg-surface px-gutter py-section"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeader
            eyebrow="Founder"
            title="DDO is run by Timothy Lum."
            intro="One person, senior-level attention, and a preference for useful things over loud things."
          />
          <ExternalLink
            href={urlFor("founder")}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-card border border-line bg-canvas px-5 py-3 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            label="About the founder"
          >
            About the founder
          </ExternalLink>
        </div>
      </section>

      <section id="contact" className="px-gutter py-section">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-accent">
              Contact
            </p>
            <h2 className="text-3xl font-semibold text-ink md:text-5xl">
              Bring the messy version. We can shape it from there.
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted">
              Send a note about what you are trying to make, fix, or simplify.
            </p>
            <a
              href={`mailto:${siteConfig.contactEmail}`}
              className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-card bg-accent px-5 py-3 text-sm font-semibold text-accent-ink transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <Mail aria-hidden="true" className="h-4 w-4" />
              {siteConfig.contactEmail}
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-line px-gutter py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <p>
            &copy; {year} {siteConfig.brandName}
          </p>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-4">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </main>
  );
}
