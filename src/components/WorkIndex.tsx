import { STATUS_LABEL, pillars } from "@/data/work";

/*
  Static, crawlable list of every project under its pillar (layout A, ledger).
  Server component on purpose: the full list must be in the exported HTML with
  no JS. Only live proofs link out; everything else renders as plain text so an
  unfinished project can never look clickable.
*/
export function WorkIndex() {
  return (
    <section id="work" className="work-index" aria-labelledby="work-title">
      <h2 id="work-title" className="work-title">
        Work
      </h2>
      <div className="work-cols">
        {pillars.map((block) => (
          <div key={block.pillar} className="work-col" data-pillar={block.pillar}>
            <h3 className="work-pillar">{block.pillar}</h3>
            <p className="work-stmt">{block.statement}</p>
            {block.proofs.map((proof) => {
              const isLive = proof.status === "live" && proof.href;
              const body = (
                <>
                  <span className="work-row-top">
                    <span className="work-name">{proof.name}</span>
                    <span className={isLive ? "work-tag is-live" : "work-tag"}>
                      {STATUS_LABEL[proof.status]}
                    </span>
                  </span>
                  <span className="work-summary">{proof.summary}</span>
                </>
              );
              return isLive ? (
                <a
                  key={proof.name}
                  className="work-row"
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
      </div>
    </section>
  );
}
