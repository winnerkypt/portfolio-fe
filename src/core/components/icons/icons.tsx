interface IconProps {
  readonly className?: string;
}

interface StarProps extends IconProps {
  readonly fill?: string;
  readonly stroke?: string;
  readonly parallax?: number;
}

export function ArrowIcon({ className = "arr" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3 8h10M9 4l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StarIcon({ className, fill = "currentColor", stroke, parallax }: StarProps) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true" data-parallax={parallax}>
      <path
        d="M20 2.5l4.9 11.2 12.1 1.1-9.2 8 2.8 11.9L20 28.4 9.4 34.7l2.8-11.9-9.2-8 12.1-1.1z"
        fill={fill}
        stroke={stroke}
        strokeWidth={stroke ? 1.4 : undefined}
        strokeLinejoin="round"
      />
    </svg>
  );
}
