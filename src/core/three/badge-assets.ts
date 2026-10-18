import type { Group } from "three";
import { contactLines } from "@/core/data/contacts";
import { profile } from "@/core/data/profile";
import { createBadgeData } from "@/core/lib/canvas/badge-data";
import { BADGE_SIZE, drawBadgeBack, drawBadgeFront, type BadgeImages } from "@/core/lib/canvas/badge-face";
import type { CanvasFonts } from "@/core/lib/canvas/fonts";
import { LANYARD_SIZE, drawLanyard } from "@/core/lib/canvas/lanyard-face";
import { createCard } from "./card-mesh";
import { createClip, createPin } from "./hardware-mesh";
import { createLanyard, type Lanyard } from "./lanyard-mesh";
import { drawnTexture } from "./textures";

export interface BadgeAssets {
  readonly card: Group;
  readonly clip: Group;
  readonly pin: Group;
  readonly lanyard: Lanyard;
  redraw(): void;
}

export function buildBadgeAssets(anisotropy: number, fonts: CanvasFonts, images: BadgeImages): BadgeAssets {
  const data = createBadgeData(profile, contactLines);
  const front = drawnTexture(BADGE_SIZE.width, BADGE_SIZE.height, anisotropy, (g) => drawBadgeFront(g, data, fonts, images));
  const back = drawnTexture(BADGE_SIZE.width, BADGE_SIZE.height, anisotropy, (g) => drawBadgeBack(g, data, fonts));
  const strap = drawnTexture(LANYARD_SIZE.width, LANYARD_SIZE.height, anisotropy, (g) => drawLanyard(g, data, fonts));
  const faces = [front, back, strap];
  return {
    card: createCard(front.texture, back.texture),
    clip: createClip(),
    pin: createPin(),
    lanyard: createLanyard(strap.texture),
    redraw: () => faces.forEach((face) => face.redraw()),
  };
}
