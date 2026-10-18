import Image from "next/image";
import "@/styles/work.css";
import { SectionHeading } from "@/core/components/section-heading/section-heading";
import { projects } from "@/core/data/projects";
import { DrawerStage } from "./drawer-stage";
import { WorkClient } from "./work-client";

const COUNT_WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"] as const;
const countWord = COUNT_WORDS[projects.length] ?? String(projects.length);

export function Work() {
  return (
    <section className="sec" id="projects">
      <div className="wrap">
        <SectionHeading
          label="Selected work"
          lead="Pick a "
          mark="folder"
          lede={`${countWord} projects from the last few years. Pick a folder or a tab to open it.`}
        />
        <WorkClient projects={projects}>
          <DrawerStage label={`${countWord} project folders standing in a row`}>
            <Image
              src="/images/fallback/folders.webp"
              alt=""
              width={2225}
              height={653}
              sizes="(min-width: 1600px) 1600px, 100vw"
            />
          </DrawerStage>
        </WorkClient>
      </div>
    </section>
  );
}
