import type { Metadata } from "next";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteNav from "@/components/layout/SiteNav";
import { SceneBackdrop } from "@/components/scene";
import Crew from "@/components/sections/Crew";
import FinalCta from "@/components/sections/FinalCta";
import Hero from "@/components/sections/Hero";
import Logistics from "@/components/sections/Logistics";
import Packs from "@/components/sections/Packs";
import Phygital from "@/components/sections/Phygital";
import Proof from "@/components/sections/Proof";

export const metadata: Metadata = {
  title: "Del pixel al pendón: publicidad phygital con GPS · Miri Ads",
  description:
    "Packs digitales de publicidad y una red física uberizada con evidencia geolocalizada: cada pendón, volante y ruta queda demostrado con GPS en tu dashboard.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <SceneBackdrop />
      <SiteNav />
      <main className="relative">
        <Hero />
        <Packs />
        <Phygital />
        <Logistics />
        <Proof />
        <Crew />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
