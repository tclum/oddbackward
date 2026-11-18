import type { Pillar } from "@/data/work";

/* Decorative: the pillar name sits right beside each one, so all three are aria-hidden. */
export function ServicePictogram({ pillar }: { pillar: Pillar }) {
  return (
    <svg className="service-icon" viewBox="0 0 72 72" aria-hidden="true" focusable="false">
      {pillar === "Design" && (
        <>
          <rect
            className="pg-ink-line"
            x="6"
            y="6"
            width="60"
            height="60"
            rx="8"
            fill="none"
            strokeWidth="2"
            strokeDasharray="5 6"
          />
          <path
            className="pg-accent-line"
            d="M36 22 v28 M22 36 h28"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </>
      )}
      {pillar === "Development" && (
        <>
          <rect className="pg-ink" x="6" y="26" width="40" height="40" rx="6" />
          <rect className="pg-accent-cut" x="38" y="6" width="28" height="28" rx="6" strokeWidth="3" />
        </>
      )}
      {pillar === "Optimization" && (
        <>
          <path
            className="pg-quiet-line"
            d="M6 22 c10 -18 14 18 24 0 s14 18 24 0 s8 6 12 0"
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            className="pg-accent-line"
            d="M6 52 H58 M48 42 l12 10 l-12 10"
            fill="none"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}
