import { ExtrudeGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, Path, Shape, ShapeGeometry, type Texture } from "three";

export const CARD_WIDTH = 3.4;
export const CARD_HEIGHT = 2.15;
const THICKNESS = 0.05;
const CORNER = 0.13;
const SLOT = { width: 0.44, height: 0.09 };
const CURVE_SEGMENTS = 12;

function cardShape(): Shape {
  const x = -CARD_WIDTH / 2;
  const y = -CARD_HEIGHT / 2;
  const w = CARD_WIDTH;
  const h = CARD_HEIGHT;
  const r = CORNER;
  const shape = new Shape();
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  shape.holes.push(slotPath());
  return shape;
}

function slotPath(): Path {
  const radius = SLOT.height / 2;
  const cy = CARD_HEIGHT / 2 - 0.17;
  const half = SLOT.width / 2;
  const slot = new Path();
  slot.moveTo(-half + radius, cy - radius);
  slot.lineTo(half - radius, cy - radius);
  slot.absarc(half - radius, cy, radius, -Math.PI / 2, Math.PI / 2, false);
  slot.lineTo(-half + radius, cy + radius);
  slot.absarc(-half + radius, cy, radius, Math.PI / 2, Math.PI * 1.5, false);
  return slot;
}

function face(shape: Shape, texture: Texture, back: boolean): Mesh {
  const geometry = new ShapeGeometry(shape, CURVE_SEGMENTS);
  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < position.count; i++) {
    uv.setXY(i, position.getX(i) / CARD_WIDTH + 0.5, position.getY(i) / CARD_HEIGHT + 0.5);
  }
  const mesh = new Mesh(geometry, new MeshBasicMaterial({ map: texture }));
  if (back) {
    mesh.rotation.y = Math.PI;
    mesh.position.z = -THICKNESS / 2 - 0.001;
  } else {
    mesh.position.z = THICKNESS / 2 + 0.001;
  }
  return mesh;
}

export function createCard(front: Texture, back: Texture): Group {
  const shape = cardShape();
  const edge = new MeshStandardMaterial({ color: 0x8a482d, roughness: 0.55 });
  const body = new Mesh(new ExtrudeGeometry(shape, { depth: THICKNESS, bevelEnabled: false, curveSegments: CURVE_SEGMENTS }), edge);
  body.position.z = -THICKNESS / 2;
  const card = new Group();
  card.add(body, face(shape, front, false), face(shape, back, true));
  card.traverse((o) => {
    o.castShadow = true;
  });
  card.rotation.order = "ZYX";
  return card;
}
