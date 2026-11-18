import { STATUS_LABEL, pillars } from "@/data/work";

/*
  Static, crawlable list of every project under its pillar. Server component on
  purpose: the full list must be in the exported HTML with no JS. Only live
  proofs link out; everything else renders as plain text so an unfinished
  project can never look clickable. The status dot's color follows
  data-status in globals.css.
*/
export function WorkIndex() {
  return (
    <section id="work" className="work-index" aria-label="Work">
      {pillars.map((block) => (
        <div key={block.pillar} className="work-group" data-pillar={block.pillar}>
          <div className="work-group-head">
            <h3 className="work-pillar">{block.pillar}</h3>
            <p className="work-stmt">{block.statement}</p>
          </div>
          {block.proofs.map((proof) => {
            const isLive = proof.status === "live" && proof.href;
            const body = (
              <>
                <span className="work-name">{proof.name}</span>
                <span className="work-summary">{proof.summary}</span>
                <span className="work-tag" data-status={proof.status}>
                  <i className="work-dot" aria-hidden="true" />
                  {STATUS_LABEL[proof.status]}
                </span>
              </>
            );
            return isLive ? (
              <a
                key={proof.name}
                className="work-row is-live"
                href={proof.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {body}
              </a>
            ) : (
              <div key={proof.name} className="work-row">
                {body}
              </div>
            );
          })}
        </div>
      ))}
    </section>
  );
}
