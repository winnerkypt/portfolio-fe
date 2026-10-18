import "@/styles/skills.css";
import { StarIcon } from "@/core/components/icons/icons";
import { SectionHeading } from "@/core/components/section-heading/section-heading";
import { skillGroups, toolbox } from "@/core/data/skills";
import type { SkillGroup } from "@/core/data/types/skills";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

const icons: Record<SkillGroup["id"], React.ReactNode> = {
  frontend: (
    <svg {...iconProps}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M3 9h18" />
    </svg>
  ),
  backend: (
    <svg {...iconProps}>
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </svg>
  ),
};

const slotSpeed: Record<SkillGroup["id"], number> = {
  frontend: 0.04,
  backend: 0.07,
};
const tapeSpeed: Record<SkillGroup["id"], number> = {
  frontend: 0.02,
  backend: -0.02,
};

export function Skills() {
  return (
    <section className="sec" id="skills">
      <div className="wrap">
        <div className="sec-head-slot" data-parallax="0.03">
          <SectionHeading
            label="Skills"
            lead="What I "
            mark="build with"
            lede="Day-to-day tools across frontend, backend, and the glue in between."
          />
        </div>
        <div className="stack">
          {skillGroups.map((group) => (
            <div
              className="stack-slot"
              data-parallax={slotSpeed[group.id]}
              key={group.id}
            >
              <article className={`stack-card ${group.id}`}>
                <span
                  className="tape sk-tape"
                  data-parallax={tapeSpeed[group.id]}
                  aria-hidden="true"
                />
                {group.id === "frontend" ? (
                  <StarIcon
                    className="sticker"
                    fill="var(--color-pink)"
                    stroke="var(--color-ink)"
                    parallax={-0.025}
                  />
                ) : null}
                <div className="sk-top">
                  <span className="sk-no">{group.no}</span>
                  <i aria-hidden="true">{icons[group.id]}</i>
                </div>
                <h3>{group.title}</h3>
                <p className="sk-sub">{group.sub}</p>
                <ul className="chips">
                  {group.chips.map((chip) => (
                    <li key={chip}>
                      <span className="chip-face">{chip}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          ))}
        </div>
        <div className="toolbox">
          <p className="toolbox-title">{toolbox.title}</p>
          <ul className="toolbox-list">
            {toolbox.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
