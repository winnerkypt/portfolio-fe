import "@/styles/hero.css";
import { ArrowIcon } from "@/core/components/icons/icons";
import { profile } from "@/core/data/profile";
import { BadgeFallback } from "./badge-fallback";
import { BadgeStage } from "./badge-stage";

const badgeLabel = `ID badge for ${profile.fullName}, ${profile.role} portfolio. Drag to swing it, tap to flip.`;

export function Hero() {
  const { headline, nowBuilding } = profile;

  return (
    <section className="hero">
      <div className="stage-panel">
        <div className="pin-note" aria-hidden="true">
          <b>{nowBuilding.title}</b>
          <p>{nowBuilding.text}</p>
        </div>
        <div className="hero-copy">
          <p className="kicker">{profile.kicker}</p>
          <h1>
            {headline.lead}
            <span className="hl2">{headline.highlight}</span>
          </h1>
          <p className="lede">{profile.lede}</p>
          <div className="cta-row">
            <a className="btn btn-brand" href="#projects">
              See my work
              <ArrowIcon />
            </a>
            <a className="btn btn-ghost" href="#contact">
              Contact
            </a>
          </div>
          <p className="drag-hint">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 3l14 8-6 2-3 6z" />
            </svg>
            Drag my badge, tap to flip it
            <svg className="hint-arrow" viewBox="0 0 220 90" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 72C60 88 150 72 200 22" />
              <path className="hint-head" d="M186 25L200 22L196 35" />
            </svg>
          </p>
        </div>
        <BadgeStage label={badgeLabel}>
          <BadgeFallback />
        </BadgeStage>
      </div>
    </section>
  );
}
