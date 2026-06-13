"use client";

import { useState } from "react";

type RevealToggleProps = {
  className?: string;
};

export function RevealToggle({ className }: RevealToggleProps) {
  const [isOdd, setIsOdd] = useState(false);
  const wordmark = isOdd ? "ODD" : "DDO";

  return (
    <div className={className}>
      <button
        type="button"
        className="group inline-flex min-h-14 min-w-36 items-center justify-center rounded-card border border-line bg-surface px-5 py-3 text-3xl font-semibold tracking-[0.18em] text-ink shadow-soft transition hover:-translate-y-0.5 hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        aria-pressed={isOdd}
        aria-label="Toggle DDO backwards reveal"
        onClick={() => setIsOdd((current) => !current)}
      >
        <span className="transition duration-300 group-hover:scale-[1.03]">{wordmark}</span>
      </button>
      <p className="mt-3 text-sm text-current/70">yes &mdash; DDO, backwards.</p>
    </div>
  );
}
