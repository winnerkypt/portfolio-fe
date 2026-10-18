import Image from "next/image";

export function BadgeFallback() {
  return (
    <Image
      className="badge-fallback"
      src="/images/fallback/badge.webp"
      alt=""
      width={1113}
      height={992}
      sizes="(min-width: 900px) 600px, min(560px, 84vw)"
      priority
      fetchPriority="high"
    />
  );
}
