import Image from "next/image";
import type { Ref } from "react";
import { ArrowIcon } from "@/core/components/icons/icons";
import type { Project } from "@/core/data/types/project";
import type { CasePhase } from "@/core/lib/case-state";
import { formatCaseNo } from "@/core/lib/case-no";
import { hostOf } from "@/core/lib/host-of";

interface CaseSpreadProps {
  readonly project: Project;
  readonly index: number;
  readonly total: number;
  readonly phase?: CasePhase;
  readonly pings?: number;
  readonly ref?: Ref<HTMLDivElement>;
}

function CasePrint({ project }: { readonly project: Project }) {
  return (
    <figure className="cs-print" data-parallax="0.05">
      <svg className="cs-clip" viewBox="0 0 26 64" aria-hidden="true">
        <path
          d="M8 50 V12 a5 5 0 0 1 10 0 V54 a8 8 0 0 1 -16 0 V18"
          fill="none"
          stroke="var(--color-faint)"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      </svg>
      <span className="cs-tape" aria-hidden="true" />
      <div className="cs-img">
        <Image
          src={project.image}
          alt={`Screenshot of ${project.name}`}
          width={2880}
          height={1800}
          sizes="(max-width: 860px) 90vw, 560px"
        />
      </div>
      <figcaption>
        <span aria-hidden="true">&#8599;</span> <span>{hostOf(project.link)}</span>
      </figcaption>
    </figure>
  );
}

function CaseFields({ project }: { readonly project: Project }) {
  return (
    <dl className="cs-fields">
      <div>
        <dt>Brief</dt>
        <dd>{project.desc}</dd>
      </div>
      <div>
        <dt>Stack</dt>
        <dd>
          <ul className="chips cs-tags">
            {project.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </dd>
      </div>
    </dl>
  );
}

export function CaseSpread({ project, index, total, phase = "in", pings = 0, ref }: CaseSpreadProps) {
  return (
    <div className="case-spread" data-phase={phase} ref={ref}>
      {pings > 0 ? <span className="cs-ping" key={pings} aria-hidden="true" /> : null}
      <CasePrint project={project} />
      <article className="cs-notes" data-parallax="-0.03">
        <div className="cs-body">
          <div className="cs-head">
            <span className="cs-no">{formatCaseNo(index, total)}</span>
            <span className="cs-year">
              Filed <span>{project.year}</span>
            </span>
          </div>
          <h3>{project.name}</h3>
          <CaseFields project={project} />
          <a className="btn btn-brand" href={project.link} target="_blank" rel="noreferrer noopener">
            Visit live site
            <ArrowIcon />
          </a>
        </div>
      </article>
    </div>
  );
}
