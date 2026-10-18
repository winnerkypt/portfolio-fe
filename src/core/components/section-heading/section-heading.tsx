import type { ReactNode } from "react";

interface SectionHeadingProps {
  readonly label: string;
  readonly lead: string;
  readonly mark: string;
  readonly lede?: ReactNode;
}

export function SectionHeading({ label, lead, mark, lede }: SectionHeadingProps) {
  return (
    <div className="sec-head">
      <p className="label">{label}</p>
      <h2>
        {lead}
        <mark>{mark}</mark>
      </h2>
      {lede ? <p className="sec-lede">{lede}</p> : null}
    </div>
  );
}
