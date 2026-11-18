"use client";

import { useEffect, useRef } from "react";

/*
  The D, D, O blueprint. Server-rendered like any component; the client part
  only follows a mouse over the hero section. Positions are written straight to
  SVG attributes through refs, at most once per animation frame, and reduced
  motion or a non-mouse pointer leaves the drawing at rest.
*/

const VIEW_W = 520;
const VIEW_H = 460;
const RING_X = 412;
const RING_Y = 230;
const DRIFT = 7;
const MARKER_REST = `rotate(45 ${RING_X} ${RING_Y})`;

export function HeroGraphic() {
  const svgRef = useRef<SVGSVGElement>(null);
  const d1Ref = useRef<SVGGElement>(null);
  const d2Ref = useRef<SVGGElement>(null);
  const markerRef = useRef<SVGGElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const hero = svg?.closest("section");
    const d1 = d1Ref.current;
    const d2 = d2Ref.current;
    const marker = markerRef.current;
    const glow = glowRef.current;
    if (!svg || !hero || !d1 || !d2 || !marker || !glow) return;

    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let pointer: { x: number; y: number } | null = null;

    const rest = () => {
      marker.setAttribute("transform", MARKER_REST);
      d1.removeAttribute("transform");
      d2.removeAttribute("transform");
      glow.setAttribute("opacity", "0");
    };

    const paint = () => {
      frame = 0;
      if (!pointer) return;
      const art = svg.getBoundingClientRect();
      const box = hero.getBoundingClientRect();
      if (art.width === 0 || box.width === 0) return;
      const vx = ((pointer.x - art.left) / art.width) * VIEW_W;
      const vy = ((pointer.y - art.top) / art.height) * VIEW_H;
      const nx = ((pointer.x - box.left) / box.width - 0.5) * 2;
      const ny = ((pointer.y - box.top) / box.height - 0.5) * 2;
      const deg = (Math.atan2(vy - RING_Y, vx - RING_X) * 180) / Math.PI + 90;
      marker.setAttribute("transform", `rotate(${deg.toFixed(1)} ${RING_X} ${RING_Y})`);
      d1.setAttribute("transform", `translate(${(-nx * DRIFT).toFixed(1)} ${(-ny * DRIFT).toFixed(1)})`);
      d2.setAttribute("transform", `translate(${(nx * DRIFT).toFixed(1)} ${(ny * DRIFT).toFixed(1)})`);
      glow.setAttribute("cx", String(Math.round(vx)));
      glow.setAttribute("cy", String(Math.round(vy)));
      glow.setAttribute("opacity", "1");
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || still?.matches) return;
      pointer = { x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const onLeave = () => {
      pointer = null;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      rest();
    };

    hero.addEventListener("pointermove", onMove);
    hero.addEventListener("pointerleave", onLeave);
    return () => {
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      className="hero-graphic"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label="The letters D, D and O drawn as blueprint shapes on a dot grid: a solid D for Design, a hatched D for Development, and a ring for Optimization."
    >
      <defs>
        <pattern id="hero-dots" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle className="hg-grid" cx="2" cy="2" r="1.3" />
        </pattern>
        <pattern
          id="hero-hatch"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line className="hg-ink-line" x1="0" y1="0" x2="0" y2="10" strokeWidth="2" />
        </pattern>
        <radialGradient id="hero-glow">
          <stop className="hg-glow-stop" offset="0" stopOpacity="0.32" />
          <stop className="hg-glow-stop" offset="1" stopOpacity="0" />
        </radialGradient>
        <clipPath id="hero-clip">
          <rect x="0" y="0" width={VIEW_W} height={VIEW_H} rx="20" />
        </clipPath>
      </defs>
      <rect className="hg-surface" x="0" y="0" width={VIEW_W} height={VIEW_H} rx="20" />
      <rect x="0" y="0" width={VIEW_W} height={VIEW_H} rx="20" fill="url(#hero-dots)" />
      <g clipPath="url(#hero-clip)">
        <circle ref={glowRef} cx="260" cy="230" r="130" fill="url(#hero-glow)" opacity="0" />
      </g>
      <g className="hg-ink-line" fill="none" strokeWidth="1.5">
        <path d="M28 44 h20 M38 34 v20" />
        <path d="M472 44 h20 M482 34 v20" />
        <path d="M28 416 h20 M38 406 v20" />
        <path d="M472 416 h20 M482 406 v20" />
        <path d="M60 330 H460" strokeDasharray="3 6" />
      </g>
      <g ref={d1Ref}>
        <path className="hg-accent" d="M60 130 h50 a100 100 0 0 1 0 200 h-50 z" />
      </g>
      <g ref={d2Ref}>
        <path
          className="hg-ink-line"
          d="M200 130 h50 a100 100 0 0 1 0 200 h-50 z"
          fill="url(#hero-hatch)"
          strokeWidth="2.5"
        />
      </g>
      <circle className="hg-ring" cx={RING_X} cy={RING_Y} r="86" strokeWidth="28" />
      <g ref={markerRef} transform={MARKER_REST}>
        <path className="hg-accent-line" d="M412 230 L412 144" strokeWidth="2.5" />
        <circle className="hg-marker-head" cx="412" cy="144" r="11" strokeWidth="4" />
      </g>
      <circle className="hg-accent" cx={RING_X} cy={RING_Y} r="5" />
      <g className="hg-ink-line" fill="none" strokeWidth="1.5">
        <path d="M60 100 v-14 h150 v14" />
        <path d="M326 364 v14 h172 v-14" />
      </g>
      <g className="hg-label" fontSize="14" fontWeight="500">
        <text x="60" y="76">new</text>
        <text x="60" y="360">Design</text>
        <text x="200" y="360">Development</text>
        <text x="326" y="400">Optimization</text>
        <text x="498" y="360" textAnchor="end">
          leaner
        </text>
      </g>
    </svg>
  );
}
