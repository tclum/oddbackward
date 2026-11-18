"use client";

import { useEffect, useRef } from "react";
import { siteConfig } from "@/config/site";

/*
  The dark contact panel. Server-rendered like any component; the client part
  only moves an accent spotlight under a mouse, written to custom properties
  through a ref at most once per animation frame. Reduced motion or a
  non-mouse pointer leaves it at rest.
*/
export function ContactPanel() {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let pointer: { x: number; y: number } | null = null;

    const paint = () => {
      frame = 0;
      if (!pointer) return;
      const box = panel.getBoundingClientRect();
      panel.style.setProperty("--spot-x", `${Math.round(pointer.x - box.left)}px`);
      panel.style.setProperty("--spot-y", `${Math.round(pointer.y - box.top)}px`);
      panel.dataset.spot = "on";
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
      delete panel.dataset.spot;
    };

    panel.addEventListener("pointermove", onMove);
    panel.addEventListener("pointerleave", onLeave);
    return () => {
      panel.removeEventListener("pointermove", onMove);
      panel.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={panelRef} id="contact" className="contact-panel" aria-labelledby="contact-title">
      <h2 id="contact-title" className="contact-title">
        Making, fixing, or simplifying something?
      </h2>
      <p className="contact-text">Send the rough version. Tim answers every message himself.</p>
      <a className="btn btn-light cta" href={`mailto:${siteConfig.contactEmail}`}>
        {siteConfig.contactEmail}
      </a>
    </section>
  );
}
