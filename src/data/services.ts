import { siteConfig } from "@/config/site";
import { pillars, type Pillar } from "@/data/work";

/*
  The services copy, one entry per pillar. Order comes from `pillars`, which is
  built in PILLAR_ORDER, so the services and the work index always agree.
*/

export type Service = {
  pillar: Pillar;
  when: string;
  body: string;
};

const SERVICE_COPY: Record<Pillar, Omit<Service, "pillar">> = {
  Design: {
    when: "You need something that does not exist yet.",
    body: `Your business needs a new product made: a website, a booking page, a tool your customers will use. ${siteConfig.shortName} works out what it should be, then makes it.`,
  },
  Development: {
    when: "You have the product, and it needs more.",
    body: "New features on what you already run, or a new application built around it.",
  },
  Optimization: {
    when: "You have a product or a system, and it takes too much effort.",
    body: `${siteConfig.shortName} makes it more efficient: faster, fewer steps, less redundancy.`,
  },
};

export const services: Service[] = pillars.map(({ pillar }) => ({
  pillar,
  ...SERVICE_COPY[pillar],
}));
