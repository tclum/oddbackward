"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { OrbitNode } from "@/data/orbit";
import { resolvePortfolio } from "@/data/portfolio";

type OrbitProps = {
  nodes: OrbitNode[];
  pillarIds: string[];
  /** desktop dock edge for the panels; mobile always docks to the bottom. */
  dock?: "right" | "left";
};

type LetterOrder = "DDO" | "DOD" | "ODD";

const INTERMEDIATE_ORDERS: LetterOrder[] = ["DDO", "DOD"];

// Three letter-slots, echoing the three-glyph wordmark / 3-letter portfolio codes.
const CODE_LENGTH = 3;

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

export function Orbit({ nodes, pillarIds, dock = "right" }: OrbitProps) {
  const pillars = nodes.filter((node) => node.kind === "pillar");
  const center = nodes.find((node) => node.kind === "center");
  const pillarCount = pillarIds.length;

  const [mounted, setMounted] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pressed, setPressed] = useState<Set<string>>(new Set());
  const [order, setOrder] = useState<LetterOrder>("DDO");
  const [locked, setLocked] = useState(false);
  const [shuffling, setShuffling] = useState(false);

  // Portfolio-code easter egg — gated entirely on the `locked` latch (the ODD
  // reveal). No parallel "all opened" tracker.
  const [codeOpen, setCodeOpen] = useState(false);
  const [slots, setSlots] = useState<string[]>(() => Array(CODE_LENGTH).fill(""));
  const [codeFeedback, setCodeFeedback] = useState("");
  const [shaking, setShaking] = useState(false);

  const triggerRefs = useRef(new Map<string, HTMLButtonElement | null>());
  const closeRefs = useRef(new Map<string, HTMLButtonElement | null>());
  const panelRefs = useRef(new Map<string, HTMLElement | null>());
  const lastTriggerId = useRef<string | null>(null);
  const shuffleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const codeTriggerRef = useRef<HTMLButtonElement | null>(null);
  const codeOverlayRef = useRef<HTMLDivElement | null>(null);
  const slotRefs = useRef<(HTMLInputElement | null)[]>([]);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => () => {
    if (shuffleTimer.current) clearTimeout(shuffleTimer.current);
  }, []);

  const applyOrder = useCallback((next: LetterOrder) => {
    if (prefersReducedMotion()) {
      setOrder(next);
      return;
    }
    setShuffling(true);
    if (shuffleTimer.current) clearTimeout(shuffleTimer.current);
    shuffleTimer.current = setTimeout(() => {
      setOrder(next);
      setShuffling(false);
    }, 150);
  }, []);

  // Reveal is keyed to DISTINCT pillars: shuffle DDO/DOD on each new pillar, then
  // lock to ODD the moment all distinct pillars have been opened. ODD is reserved
  // for the lock so the reveal isn't spoiled early. The random intermediate runs
  // only after hydration; SSR/initial render is always the deterministic "DDO".
  const advanceReveal = useCallback(
    (nextPressedCount: number, currentOrder: LetterOrder) => {
      if (locked) return;
      if (nextPressedCount >= pillarCount) {
        setLocked(true);
        applyOrder("ODD");
        return;
      }
      const candidates = INTERMEDIATE_ORDERS.filter((o) => o !== currentOrder);
      const next = candidates[Math.floor(Math.random() * candidates.length)] ?? "DOD";
      applyOrder(next);
    },
    [applyOrder, locked, pillarCount],
  );

  const openNode = useCallback(
    (node: OrbitNode) => {
      document.documentElement.style.setProperty("--active-accent", node.accent);
      lastTriggerId.current = node.id;
      if (node.kind === "pillar") {
        // Shuffle on every pillar open; the lock is keyed to DISTINCT pillars.
        const alreadyOpened = pressed.has(node.id);
        const distinctCount = alreadyOpened ? pressed.size : pressed.size + 1;
        if (!alreadyOpened) {
          const next = new Set(pressed);
          next.add(node.id);
          setPressed(next);
        }
        advanceReveal(distinctCount, order);
      }
      setOpenId(node.id);
    },
    [advanceReveal, order, pressed],
  );

  const closePanel = useCallback(() => {
    setOpenId(null);
  }, []);

  // Manage focus across open/close. On open, focus moves to the panel's close
  // button; on close, it returns to the triggering node (after the re-render has
  // cleared `inert` from the orbit, so the node is focusable again).
  const prevOpenId = useRef<string | null>(null);
  useEffect(() => {
    if (openId) {
      closeRefs.current.get(openId)?.focus({ preventScroll: true });
    } else if (prevOpenId.current) {
      const id = lastTriggerId.current;
      if (id) triggerRefs.current.get(id)?.focus({ preventScroll: true });
    }
    prevOpenId.current = openId;
  }, [openId]);

  // Escape closes the open panel.
  useEffect(() => {
    if (!openId) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closePanel();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId, closePanel]);

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

  function onPanelKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    trapTab(event, panelRefs.current.get(openId ?? "") ?? null);
  }

  // ---- portfolio-code overlay ----

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

  // Focus into the overlay (first slot) on open; back to the :) trigger on close.
  const prevCodeOpen = useRef(false);
  useEffect(() => {
    if (codeOpen) {
      slotRefs.current[0]?.focus({ preventScroll: true });
    } else if (prevCodeOpen.current) {
      codeTriggerRef.current?.focus({ preventScroll: true });
    }
    prevCodeOpen.current = codeOpen;
  }, [codeOpen]);

  // Escape closes the overlay.
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

  const isOpen = openId !== null;
  // Any modal surface (a pillar/center panel or the code overlay) makes the
  // orbit background inert and pauses rotation.
  const anyOpen = isOpen || codeOpen;

  return (
    <>
      <div className="orbit-page" data-overlay-open={codeOpen ? "true" : undefined}>
        <section className="orbit-stage" aria-label="DDO pillar orbit" inert={anyOpen || undefined}>
          <div className="orbit-shell">
            <span className="orbit-rim" aria-hidden="true" />
            <div className="orbit-track">
              {pillars.map((node, index) => {
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
                    className={[
                      "pillar",
                      openId === node.id ? "is-active" : "",
                      pressed.has(node.id) ? "has-been-pressed" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    data-pillar={node.id}
                    style={style}
                    aria-label={node.nodeLabel}
                    aria-haspopup="dialog"
                    aria-expanded={openId === node.id}
                    aria-controls={`panel-${node.id}`}
                    ref={(el) => {
                      triggerRefs.current.set(node.id, el);
                    }}
                    onClick={() => openNode(node)}
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
              <button
                type="button"
                className={`orbit-core${locked ? " is-locked" : ""}`}
                aria-haspopup="dialog"
                aria-expanded={openId === center.id}
                aria-controls={`panel-${center.id}`}
                ref={(el) => {
                  triggerRefs.current.set(center.id, el);
                }}
                onClick={() => openNode(center)}
              >
                <span className="sr-only" aria-live="polite">
                  {locked ? `${order}. DDO, backwards.` : order}
                </span>
                <span className="core-label" aria-hidden="true">
                  Center
                </span>
                <strong className={`core-mark${shuffling ? " is-shuffling" : ""}`} aria-hidden="true">
                  {order.split("").map((letter, i) => (
                    <span className="core-letter" key={i}>
                      {letter}
                    </span>
                  ))}
                </strong>
                {locked ? (
                  <span className="core-caption" aria-hidden="true">
                    DDO, backwards.
                  </span>
                ) : null}
              </button>
            ) : null}
          </div>
        </section>

        {/* Easter-egg entry — appears only once the wordmark locks to ODD. */}
        {locked ? (
          <button
            type="button"
            className="code-trigger"
            ref={codeTriggerRef}
            inert={anyOpen || undefined}
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

      <footer className="orbit-footer" inert={anyOpen || undefined}>
        <p>&copy; {new Date().getFullYear()} DDO</p>
        <p>Design · Development · Optimization</p>
      </footer>

      <div
        className="panel-scrim"
        data-open={isOpen ? "true" : undefined}
        aria-hidden="true"
        onClick={closePanel}
      />

      {nodes.map((node) => (
        <aside
          key={node.id}
          id={`panel-${node.id}`}
          className="info-panel"
          data-dock={dock}
          data-open={openId === node.id ? "true" : undefined}
          hidden={mounted && openId !== node.id}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${node.id}-title`}
          ref={(el) => {
            panelRefs.current.set(node.id, el);
          }}
          onKeyDown={onPanelKeyDown}
        >
          <div className="panel-inner">
            <button
              type="button"
              className="close-panel"
              ref={(el) => {
                closeRefs.current.set(node.id, el);
              }}
              onClick={closePanel}
            >
              <span className="sr-only">Close {node.nodeLabel}</span>
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
      ))}

      {/* Portfolio-code overlay (enhanced path only — gated on the lock state). */}
      {locked ? (
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
