import { About } from "@/components/About";
import { ContactPanel } from "@/components/ContactPanel";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { WorkIndex } from "@/components/WorkIndex";

export const dynamic = "force-static";

export default function Home() {
  return (
    <div className="page">
      <SiteHeader />
      <main>
        <Hero />
        <Services />
        <WorkIndex />
        <About />
        <ContactPanel />
      </main>
      <SiteFooter />
    </div>
  );
}
