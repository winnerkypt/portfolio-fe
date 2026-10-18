import Image from "next/image";
import "@/styles/about.css";
import { SectionHeading } from "@/core/components/section-heading/section-heading";
import { profile } from "@/core/data/profile";
import { profileImage } from "@/core/data/profile-image";

export function About() {
  const { about } = profile;

  return (
    <section className="sec" id="about">
      <div className="wrap about-grid">
        <div className="portrait-wrap">
          <span className="portrait-circle" data-parallax="0.14" aria-hidden="true" />
          <span className="tape" data-parallax="0.065" aria-hidden="true" />
          <figure className="portrait" data-parallax="0.08">
            <Image
              src={profileImage.src}
              alt={`Portrait of ${profile.fullName}`}
              width={profileImage.width}
              height={profileImage.height}
              sizes="(max-width: 699px) 340px, 440px"
            />
          </figure>
        </div>
        <div className="about-text">
          <SectionHeading label="About" lead={about.heading.lead} mark={about.heading.mark} />
          <p className="big">
            {about.big} <span>{about.small}</span>
          </p>
          <dl className="facts">
            {about.facts.map((fact) => (
              <div key={fact.term}>
                <dt>{fact.term}</dt>
                <dd>{fact.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
