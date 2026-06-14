import { Orbit } from "@/components/Orbit";
import { orbitNodes, pillarIds } from "@/data/orbit";

export const dynamic = "force-static";

export default function Home() {
  return (
    <main aria-label="DDO">
      <Orbit nodes={orbitNodes} pillarIds={pillarIds} dock="right" />
    </main>
  );
}
