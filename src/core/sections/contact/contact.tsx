import "@/styles/contact.css";
import { StarIcon } from "@/core/components/icons/icons";
import { contactLines } from "@/core/data/contacts";
import { profile } from "@/core/data/profile";
import { CopyButton } from "./copy-button";

function PostcardAddress() {
  return (
    <div className="pc-addr">
      <div className="stamp" data-parallax="0.02" aria-hidden="true">
        <div className="stamp-in">
          <StarIcon fill="var(--color-sand)" stroke="var(--color-ink)" />
          <b>K.</b>
          <small>BKK</small>
        </div>
      </div>
      <div className="postmark" aria-hidden="true">
        <span>BANGKOK</span>
        <b>2026</b>
      </div>
      <ul className="pc-lines">
        {contactLines.map((line) => (
          <li key={line.id}>
            <span className="pc-k">{line.label}</span>
            <a href={line.href} {...(line.external ? { target: "_blank", rel: "noreferrer noopener" } : {})}>
              {line.text}
              {line.external ? <i aria-hidden="true"> &#8599;</i> : null}
            </a>
            {line.copyable ? <CopyButton text={line.text} /> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Contact() {
  return (
    <section className="sec" id="contact">
      <div className="wrap">
        <div className="post-board">
          <div className="pb-grid" aria-hidden="true">
            <span className="pb-grid-layer" data-parallax="0.1" />
          </div>
          <article className="postcard">
            <span className="pc-tape t1" data-parallax="-0.02" aria-hidden="true" />
            <span className="pc-tape t2" data-parallax="0.03" aria-hidden="true" />
            <div className="pc-msg">
              <p className="pc-label">Contact</p>
              <h2>
                LET&apos;S
                <br />
                TALK
              </h2>
              <p className="pc-lede">{profile.contact.lede}</p>
              <p className="pc-sign">{profile.contact.sign}</p>
            </div>
            <PostcardAddress />
          </article>
          <StarIcon className="pb-star" fill="var(--color-pink)" stroke="var(--color-ink)" parallax={-0.025} />
        </div>
      </div>
    </section>
  );
}
