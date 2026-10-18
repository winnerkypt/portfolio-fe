import type { ContactLine } from "@/core/data/types/contact";
import type { Profile } from "@/core/data/types/profile";

export interface BadgeData {
  readonly fullName: string;
  readonly titleLines: readonly string[];
  readonly accent: string;
  readonly tagline: string;
  readonly location: string;
  readonly status: string;
  readonly github: string;
  readonly barcodeSeed: string;
  readonly lanyard: readonly [string, string];
  readonly back: {
    readonly eyebrow: string;
    readonly headline: string;
    readonly sub: string;
    readonly returnTo: string;
    readonly email: string;
    readonly phone: string;
    readonly stackLabel: string;
    readonly stack: readonly string[];
    readonly stamp: readonly string[];
  };
}

function textOf(lines: readonly ContactLine[], id: ContactLine["id"]): string {
  const line = lines.find((l) => l.id === id);
  if (!line) throw new Error(`Badge needs a ${id} contact line`);
  return line.text;
}

export function createBadgeData(profile: Profile, contacts: readonly ContactLine[]): BadgeData {
  const { badge } = profile;
  return {
    fullName: profile.fullName,
    titleLines: badge.titleLines,
    accent: badge.accent,
    tagline: badge.tagline,
    location: badge.location,
    status: badge.status,
    github: `github.com/${textOf(contacts, "github")}`,
    barcodeSeed: profile.fullName.toUpperCase().replace(/\s+/g, "-"),
    lanyard: [profile.name.toUpperCase(), badge.accent],
    back: {
      eyebrow: badge.back.eyebrow,
      headline: badge.back.headline,
      sub: badge.back.sub,
      returnTo: badge.back.returnTo,
      email: textOf(contacts, "email"),
      phone: textOf(contacts, "phone"),
      stackLabel: badge.back.stackLabel,
      stack: badge.back.stack,
      stamp: badge.back.stamp,
    },
  };
}
