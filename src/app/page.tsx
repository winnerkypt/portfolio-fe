import { MotionReveal } from "@/core/components/motion-reveal/motion-reveal";
import { Navbar } from "@/core/components/navbar/navbar";
import { ScrollMotion } from "@/core/components/scroll-motion/scroll-motion";
import { About } from "@/core/sections/about/about";
import { Contact } from "@/core/sections/contact/contact";
import { Hero } from "@/core/sections/hero/hero";
import { Ribbon } from "@/core/sections/ribbon/ribbon";
import { Skills } from "@/core/sections/skills/skills";
import { Work } from "@/core/sections/work/work";

export default function Home() {
  return (
    <>
      <a href="#top" className="skip-link">
        Skip to content
      </a>
      <Navbar />
      <MotionReveal />
      <ScrollMotion />
      <main id="top">
        <Hero />
        <Ribbon />
        <About />
        <Skills />
        <Work />
        <Contact />
      </main>
    </>
  );
}
