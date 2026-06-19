"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { OrbitNode } from "@/data/orbit";
import { resolvePortfolio } from "@/data/portfolio";

type OrbitProps = {
  nodes: OrbitNode[];
  pillarIds: string[];
};

// Three letter-slots, echoing the three-glyph wordmark / 3-letter portfolio codes.
const CODE_LENGTH = 3;

// How long the finale words hold before the FSM resets to the odd start state.
const FINALE_MS = 2000;

// ---- center reveal FSM (v2) ----
// Direction is ODD -> DDO. odd is the deterministic start state (also what SSR
// renders). Opening distinct pillars walks odd -> exploring -> ddo; clicking the
// center in ddo plays the finale, which resets to odd.
type Phase = "odd" | "exploring" | "ddo" | "finale";

type RevealState = { phase: Phase; opened: Set<string> };

type RevealAction =
  | { type: "OPEN_PILLAR"; id: string }
  | { type: "CENTER_CLICK" }
  | { type: "RESET" };

function makeRevealReducer(pillarCount: number) {
  return function revealReducer(state: RevealState, action: RevealAction): RevealState {
    switch (action.type) {
      case "OPEN_PILLAR": {
        if (state.phase === "finale") return state;
        const opened = new Set(state.opened);
        opened.add(action.id);
        const phase: Phase = opened.size >= pillarCount ? "ddo" : "exploring";
        return { phase, opened };
      }
      case "CENTER_CLICK":
        return state.phase === "ddo" ? { phase: "finale", opened: state.opened } : state;
      case "RESET":
        return { phase: "odd", opened: new Set() };
      default:
        return state;
    }
  };
}

// ---- pillar dock (non-modal disclosure) ----
// An ordered list (one entry per opened pillar, max = pillar count) with exactly
// one entry expanded at a time. Replaces the single modal openId.
type DockEntry = { id: string; state: "expanded" | "minimized" };

type DockAction =
  | { type: "EXPAND"; id: string }
  | { type: "MINIMIZE" }
  | { type: "RESET" };

function dockReducer(docked: DockEntry[], action: DockAction): DockEntry[] {
  switch (action.type) {
    case "EXPAND": {
      const exists = docked.some((d) => d.id === action.id);
      const base = exists ? docked : [...docked, { id: action.id, state: "minimized" as const }];
      return base.map((d) => ({ ...d, state: d.id === action.id ? "expanded" : "minimized" }));
    }
    case "MINIMIZE":
      return docked.map((d) => ({ ...d, state: "minimized" as const }));
    case "RESET":
      return [];
    default:
      return docked;
  }
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function focusableWithin(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => el.offsetParent !== null || el === document.activeElement);
}

export function Orbit({ nodes, pillarIds }: OrbitProps) {
  const pillars = nodes.filter((node) => node.kind === "pillar");
  const center = nodes.find((node) => node.kind === "center");
  const pillarCount = pillarIds.length;
  const pillarWords = pillars.map((node) => node.nodeLabel);

  const [mounted, setMounted] = useState(false);

  // Center reveal FSM.
  const revealReducer = useMemo(() => makeRevealReducer(pillarCount), [pillarCount]);
  const [reveal, dispatch] = useReducer(revealReducer, undefined, () => ({
    phase: "odd" as Phase,
    opened: new Set<string>(),
  }));
  const { phase } = reveal;
  const sparkle = reveal.opened.size >= 1; // 1st distinct pillar
  const glow = reveal.opened.size >= 2; // 2nd distinct pillar (keeps sparkle)

  // Pillar dock.
  const [docked, dockDispatch] = useReducer(dockReducer, []);
  const expandedId = docked.find((d) => d.state === "expanded")?.id ?? null;

  // Portfolio-code easter egg — gated on the `ddo` phase.
  const [codeOpen, setCodeOpen] = useState(false);
  const [slots, setSlots] = useState<string[]>(() => Array(CODE_LENGTH).fill(""));
  const [codeFeedback, setCodeFeedback] = useState("");
  const [shaking, setShaking] = useState(false);

  const panelRefs = useRef(new Map<string, HTMLElement | null>());
  const tabRefs = useRef(new Map<string, HTMLButtonElement | null>());
  const codeTriggerRef = useRef<HTMLButtonElement | null>(null);
  const codeOverlayRef = useRef<HTMLDivElement | null>(null);
  const slotRefs = useRef<(HTMLInputElement | null)[]>([]);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  // Drive the black-background theme off the phase (client-only; SSR stays teal).
  useEffect(() => {
    document.documentElement.dataset.phase = phase;
  }, [phase]);
  useEffect(
    () => () => {
      delete document.documentElement.dataset.phase;
    },
    [],
  );

  // Finale holds the three words, then resets to the odd start state.
  useEffect(() => {
    if (phase !== "finale") return;
    const timer = setTimeout(() => dispatch({ type: "RESET" }), FINALE_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  // The odd start state has no dock — clear it whenever the FSM returns to odd.
  useEffect(() => {
    if (phase === "odd") dockDispatch({ type: "RESET" });
  }, [phase]);

  // Open a pillar: advance the reveal AND dock it expanded (others minimize).
  const openPillar = useCallback((node: OrbitNode) => {
    document.documentElement.style.setProperty("--active-accent", node.accent);
    dispatch({ type: "OPEN_PILLAR", id: node.id });
    dockDispatch({ type: "EXPAND", id: node.id });
  }, []);

  const minimize = useCallback(() => dockDispatch({ type: "MINIMIZE" }), []);

  // Move focus to the expanded panel on expand; back to its tab on minimize.
  const prevExpandedId = useRef<string | null>(null);
  useEffect(() => {
    if (!mounted) return;
    if (expandedId) {
      panelRefs.current.get(expandedId)?.focus({ preventScroll: true });
    } else if (prevExpandedId.current) {
      tabRefs.current.get(prevExpandedId.current)?.focus({ preventScroll: true });
    }
    prevExpandedId.current = expandedId;
  }, [expandedId, mounted]);

  // Escape minimizes the expanded panel (non-modal — the orbit stays live).
  useEffect(() => {
    if (!expandedId) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        minimize();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expandedId, minimize]);

  // Clicking empty space / the orbit (not a pillar, tab, panel, or the easter egg)
  // minimizes the expanded panel.
  useEffect(() => {
    if (!expandedId) return;
    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target?.closest(".info-panel") ||
        target?.closest(".dock-strip") ||
        target?.closest(".pillar") ||
        target?.closest(".code-trigger") ||
        target?.closest(".code-overlay")
      ) {
        return;
      }
      minimize();
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [expandedId, minimize]);

  function trapTab(event: React.KeyboardEvent<HTMLElement>, root: HTMLElement | null) {
    if (event.key !== "Tab" || !root) return;
    const focusables = focusableWithin(root);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  // ---- portfolio-code overlay (modal — unchanged) ----

  const openCode = useCallback(() => {
    setCodeFeedback("");
    setSlots(Array(CODE_LENGTH).fill(""));
    setCodeOpen(true);
  }, []);

  const closeCode = useCallback(() => setCodeOpen(false), []);

  const submitCode = useCallback((value: string) => {
    const match = resolvePortfolio(value);
    if (match) {
      setCodeFeedback(`opening ${match.name}'s portfolio`);
      window.open(match.portfolioUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setCodeFeedback("not quite");
    setSlots(Array(CODE_LENGTH).fill(""));
    if (!prefersReducedMotion()) {
      setShaking(true);
      if (shakeTimer.current) clearTimeout(shakeTimer.current);
      shakeTimer.current = setTimeout(() => setShaking(false), 420);
    }
    slotRefs.current[0]?.focus({ preventScroll: true });
  }, []);

  function onSlotChange(index: number, raw: string) {
    const ch = raw.slice(-1).toLowerCase().replace(/[^a-z]/g, "");
    const next = [...slots];
    next[index] = ch;
    setSlots(next);
    if (ch && index < CODE_LENGTH - 1) {
      slotRefs.current[index + 1]?.focus({ preventScroll: true });
    } else if (ch && index === CODE_LENGTH - 1 && next.every(Boolean)) {
      submitCode(next.join(""));
    }
  }

  function onSlotKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      submitCode(slots.join(""));
    } else if (event.key === "Backspace" && !slots[index] && index > 0) {
      event.preventDefault();
      const next = [...slots];
      next[index - 1] = "";
      setSlots(next);
      slotRefs.current[index - 1]?.focus({ preventScroll: true });
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      slotRefs.current[index - 1]?.focus({ preventScroll: true });
    } else if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      event.preventDefault();
      slotRefs.current[index + 1]?.focus({ preventScroll: true });
    }
  }

  function onCodeSubmit(event: React.FormEvent) {
    event.preventDefault();
    submitCode(slots.join(""));
  }

  const prevCodeOpen = useRef(false);
  useEffect(() => {
    if (codeOpen) {
      slotRefs.current[0]?.focus({ preventScroll: true });
    } else if (prevCodeOpen.current) {
      codeTriggerRef.current?.focus({ preventScroll: true });
    }
    prevCodeOpen.current = codeOpen;
  }, [codeOpen]);

  useEffect(() => {
    if (!codeOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeCode();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [codeOpen, closeCode]);

  useEffect(() => () => {
    if (shakeTimer.current) clearTimeout(shakeTimer.current);
  }, []);

  // Only the code overlay is modal: it inerts the orbit and pauses rotation.
  const showCode = phase === "ddo";

  const centerLetters = phase === "ddo" ? "DDO" : "ODD"; // odd / exploring → ODD
  const centerAnnounce =
    phase === "finale" ? `${pillarWords.join(". ")}.` : phase === "ddo" ? "DDO" : "ODD";
  const coreClassName = ["orbit-core", sparkle ? "is-sparkle" : "", glow ? "is-glow" : ""]
    .filter(Boolean)
    .join(" ");
  const coreContent = (
    <>
      <span className="sr-only" aria-live="polite">
        {centerAnnounce}
      </span>
      <span className="core-sparkles" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <span className="core-spark" key={i} />
        ))}
      </span>
      <span className="core-label" aria-hidden="true">
        Center
      </span>
      {phase === "finale" ? (
        <span className="core-words" aria-hidden="true">
          {pillarWords.map((word) => (
            <span className="core-word" key={word}>
              {word}
            </span>
          ))}
        </span>
      ) : (
        <strong className="core-mark" aria-hidden="true">
          {centerLetters.split("").map((letter, i) => (
            <span className="core-letter" key={i}>
              {letter}
            </span>
          ))}
        </strong>
      )}
    </>
  );

  return (
    <>
      <div className="orbit-page" data-overlay-open={codeOpen ? "true" : undefined}>
        <section className="orbit-stage" aria-label="DDO pillar orbit" inert={codeOpen || undefined}>
          <div className="orbit-shell">
            <span className="orbit-rim" aria-hidden="true" />
            <div className="orbit-track">
              {pillars.map((node, index) => {
                // A docked pillar has left the orbit (it lives in the dock now).
                // Keep the remaining pillars at their ORIGINAL angles — the angle
                // derives from the full-list index, so a gap is left where a
                // pillar departed rather than re-spacing the others.
                if (docked.some((d) => d.id === node.id)) return null;
                const angle = index * (360 / pillars.length);
                const style = {
                  "--angle": `${angle}deg`,
                  "--angle-inverse": `${-angle}deg`,
                  "--pillar-accent": node.accent,
                } as CSSProperties;
                return (
                  <button
                    key={node.id}
                    type="button"
                    className="pillar"
                    data-pillar={node.id}
                    style={style}
                    aria-label={node.nodeLabel}
                    aria-expanded={expandedId === node.id}
                    aria-controls={`panel-${node.id}`}
                    onClick={() => openPillar(node)}
                  >
                    <span className="pillar-label">
                      <small>{node.number}</small>
                      {node.nodeLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            {center ? (
              phase === "ddo" ? (
                <button
                  type="button"
                  className={coreClassName}
                  aria-label="Reveal Design, Development, Optimization"
                  onClick={() => dispatch({ type: "CENTER_CLICK" })}
                >
                  {coreContent}
                </button>
              ) : (
                <div className={coreClassName}>{coreContent}</div>
              )
            ) : null}
          </div>
        </section>

        {/* Easter-egg entry — visible only in the ddo phase; clears on reset. */}
        {showCode ? (
          <button
            type="button"
            className="code-trigger"
            ref={codeTriggerRef}
            inert={codeOpen || undefined}
            aria-haspopup="dialog"
            aria-expanded={codeOpen}
            aria-controls="code-overlay"
            aria-label="Portfolio code"
            onClick={openCode}
          >
            <span aria-hidden="true">:)</span>
          </button>
        ) : null}
      </div>

      <footer className="orbit-footer" inert={codeOpen || undefined}>
        <p>&copy; {new Date().getFullYear()} DDO</p>
        <p>Design · Development · Optimization</p>
      </footer>

      {/* Bottom dock strip — client-only; one tab per opened pillar. */}
      {mounted && docked.length > 0 ? (
        <div className="dock-strip" role="group" aria-label="Open pillars">
          {docked.map((entry) => {
            const node = pillars.find((p) => p.id === entry.id);
            if (!node) return null;
            return (
              <button
                key={entry.id}
                type="button"
                className="dock-tab"
                data-state={entry.state}
                aria-expanded={entry.state === "expanded"}
                aria-controls={`panel-${entry.id}`}
                ref={(el) => {
                  tabRefs.current.set(entry.id, el);
                }}
                onClick={() =>
                  dockDispatch(
                    entry.state === "expanded" ? { type: "MINIMIZE" } : { type: "EXPAND", id: entry.id },
                  )
                }
              >
                {node.nodeLabel}
              </button>
            );
          })}
        </div>
      ) : null}

      {/*
        Pillar/center content panels. Base (no-JS) = static stacked readable blocks
        (the fallback + SSR parity). Under `.js` they're hidden unless docked
        expanded, when they render as a non-modal labelled region above the dock
        strip. The center panel is never docked (display-only); its content lives
        on as the no-JS fallback block.
      */}
      {nodes.map((node) => {
        const entry = docked.find((d) => d.id === node.id);
        return (
          <aside
            key={node.id}
            id={`panel-${node.id}`}
            className="info-panel"
            data-state={entry?.state}
            role="region"
            aria-labelledby={`${node.id}-title`}
            tabIndex={-1}
            ref={(el) => {
              panelRefs.current.set(node.id, el);
            }}
          >
            <div className="panel-inner">
              <button type="button" className="close-panel" onClick={minimize}>
                <span className="sr-only">Minimize {node.nodeLabel}</span>
              </button>

              <p className="panel-kicker">{node.kicker}</p>
              <h2 className="panel-title" id={`${node.id}-title`}>
                {node.title}
              </h2>
              <p className="panel-copy">{node.copy}</p>
              <div className="panel-rule" aria-hidden="true" />

              {node.links.length > 0 ? (
                <div className="panel-actions">
                  {node.links.map((link) => (
                    <a
                      key={link.href}
                      className="panel-link"
                      data-variant={link.variant}
                      href={link.href}
                      aria-label={link.ariaLabel}
                      {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              ) : null}

              {node.image ? (
                <img className="panel-image" src={node.image.src} alt={node.image.alt} />
              ) : null}

              {node.pairs.length > 0 ? (
                <div className="panel-pair">
                  {node.pairs.map((pair) => (
                    <div key={pair.heading}>
                      <h4>{pair.heading}</h4>
                      <p>{pair.body}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {node.proofs.length > 0 ? (
                <div className="panel-section">
                  <h3>Proofs</h3>
                  <ul className="panel-proofs">
                    {node.proofs.map((proof) => (
                      <li key={proof.name}>
                        {proof.href ? (
                          <a
                            className="proof-name"
                            href={proof.href}
                            aria-label={proof.ariaLabel}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {proof.name}
                          </a>
                        ) : (
                          <span className="proof-name">{proof.name}</span>
                        )}
                        <span className="proof-summary">{proof.summary}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {node.work.length > 0 ? (
                <div className="panel-section">
                  <h3>Selected work</h3>
                  <div className="panel-pair">
                    {node.work.map((item) => (
                      <div key={item.title}>
                        <h4>{item.title}</h4>
                        <p>{item.summary}</p>
                        <p>{item.detail}</p>
                        {item.href ? (
                          <a
                            className="proof-name"
                            href={item.href}
                            aria-label={item.ariaLabel}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Visit project
                          </a>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {node.chips.length > 0 ? (
                <ul className="panel-list" aria-label="Keywords">
                  {node.chips.map((chip) => (
                    <li key={chip}>{chip}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </aside>
        );
      })}

      {/* Portfolio-code overlay (enhanced path only — gated on the ddo phase). */}
      {showCode ? (
        <div
          className="code-overlay"
          id="code-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="code-overlay-title"
          data-open={codeOpen ? "true" : undefined}
          hidden={!codeOpen}
          ref={codeOverlayRef}
          onKeyDown={(event) => trapTab(event, codeOverlayRef.current)}
        >
          <div className="code-overlay-scrim" aria-hidden="true" onClick={closeCode} />
          <div className={`code-overlay-card${shaking ? " is-shaking" : ""}`}>
            <button type="button" className="close-panel" onClick={closeCode}>
              <span className="sr-only">Close portfolio code</span>
            </button>
            <h2 className="code-prompt" id="code-overlay-title">
              time without e
            </h2>
            <form className="code-form" onSubmit={onCodeSubmit}>
              <div className="code-slots">
                {slots.map((value, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      slotRefs.current[index] = el;
                    }}
                    className="code-slot"
                    type="text"
                    inputMode="text"
                    maxLength={1}
                    value={value}
                    aria-label={`Letter ${index + 1} of ${CODE_LENGTH}`}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    onChange={(event) => onSlotChange(index, event.target.value)}
                    onKeyDown={(event) => onSlotKeyDown(index, event)}
                  />
                ))}
              </div>
              <p className="code-feedback" role="status" aria-live="polite">
                {codeFeedback}
              </p>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
