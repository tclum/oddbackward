import { siteConfig } from "@/config/site";

export function About() {
  return (
    <section id="about" className="about" aria-labelledby="about-title">
      <div className="about-copy">
        <h2 id="about-title" className="about-title">
          One person, start to finish
        </h2>
        <p className="about-text">
          No account manager and no handoff to a junior. Tim scopes the work, builds it, and walks
          you through it at the end. You keep your domain, your accounts, and your data.
        </p>
        <p className="about-link">
          <a href={siteConfig.urls.founder}>About the founder</a>
        </p>
      </div>
      <dl className="about-facts">
        <div>
          <dt>Where</dt>
          <dd>Honolulu, Hawaiʻi. In person on Oʻahu, remote everywhere else.</dd>
        </div>
        <div>
          <dt>Quotes</dt>
          <dd>A fixed price in writing, with general excise tax shown as its own line.</dd>
        </div>
        <div>
          <dt>Payment</dt>
          <dd>Half to start a build, the rest on delivery. Monthly work is billed monthly.</dd>
        </div>
      </dl>
    </section>
  );
}
