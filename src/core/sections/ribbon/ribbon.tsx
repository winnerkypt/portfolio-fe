import "@/styles/ribbon.css";
import { StarIcon } from "@/core/components/icons/icons";
import { profile } from "@/core/data/profile";

const loop = [0, 1] as const;

export function Ribbon() {
  return (
    <div className="ribbon-wrap" aria-hidden="true">
    <div className="ribbon">
      <div className="ribbon-track">
        {loop.map((copy) =>
          profile.ribbon.map((word, i) => (
            <span className="ribbon-item" key={`${copy}-${i}`}>
              <span className="ribbon-word">{word}</span>
              <StarIcon />
            </span>
          )),
        )}
      </div>
    </div>
    </div>
  );
}
