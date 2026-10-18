import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  RepeatWrapping,
  Vector3,
  type Texture,
} from "three";

const SEGMENTS = 64;
const HALF_WIDTH = 0.085;
const TEXTURE_REPEAT_LENGTH = 1.1;
const LIFT = 0.02;
const ANCHOR_LIFT = 0.02;
const ARC_DIVISIONS = 32;

const sample = new Vector3();

export interface Lanyard {
  readonly mesh: Mesh;
  update(anchorX: number, anchorY: number, rope: ArrayLike<number>): void;
}

function ribbonIndices(): Uint16Array {
  const indices = new Uint16Array(SEGMENTS * 6);
  for (let i = 0; i < SEGMENTS; i++) {
    const a = i * 2;
    const o = i * 6;
    indices[o] = a;
    indices[o + 1] = a + 1;
    indices[o + 2] = a + 2;
    indices[o + 3] = a + 1;
    indices[o + 4] = a + 3;
    indices[o + 5] = a + 2;
  }
  return indices;
}

function facingNormals(): Float32Array {
  const normals = new Float32Array((SEGMENTS + 1) * 6);
  for (let i = 2; i < normals.length; i += 3) normals[i] = 1;
  return normals;
}

interface Ribbon {
  readonly geometry: BufferGeometry;
  readonly positions: Float32Array;
  readonly uvs: Float32Array;
}

function createRibbon(): Ribbon {
  const positions = new Float32Array((SEGMENTS + 1) * 6);
  const uvs = new Float32Array((SEGMENTS + 1) * 4);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new BufferAttribute(facingNormals(), 3));
  geometry.setAttribute("uv", new BufferAttribute(uvs, 2));
  geometry.setIndex(new BufferAttribute(ribbonIndices(), 1));
  return { geometry, positions, uvs };
}

function createCurve(count: number): CatmullRomCurve3 {
  const curve = new CatmullRomCurve3(Array.from({ length: count }, () => new Vector3()));
  curve.arcLengthDivisions = ARC_DIVISIONS;
  return curve;
}

function sampleCurve(curve: CatmullRomCurve3, samples: Float32Array): void {
  for (let i = 0; i <= SEGMENTS; i++) {
    curve.getPointAt(i / SEGMENTS, sample);
    const o = i * 3;
    samples[o] = sample.x;
    samples[o + 1] = sample.y;
    samples[o + 2] = sample.z;
  }
}

function writeRibbon({ positions, uvs }: Ribbon, samples: Float32Array, length: number): void {
  for (let i = 0; i <= SEGMENTS; i++) {
    const before = Math.max(0, i - 1) * 3;
    const after = Math.min(SEGMENTS, i + 1) * 3;
    const tx = samples[after] - samples[before];
    const ty = samples[after + 1] - samples[before + 1];
    const inverse = 1 / (Math.hypot(tx, ty, samples[after + 2] - samples[before + 2]) || 1);
    const sx = -ty * inverse * HALF_WIDTH;
    const sy = tx * inverse * HALF_WIDTH;
    const x = samples[i * 3];
    const y = samples[i * 3 + 1];
    const z = samples[i * 3 + 2] + LIFT;
    const o = i * 6;
    positions[o] = x - sx;
    positions[o + 1] = y - sy;
    positions[o + 2] = z;
    positions[o + 3] = x + sx;
    positions[o + 4] = y + sy;
    positions[o + 5] = z;
    const u = ((i / SEGMENTS) * length) / TEXTURE_REPEAT_LENGTH;
    const v = i * 4;
    uvs[v] = u;
    uvs[v + 1] = 0;
    uvs[v + 2] = u;
    uvs[v + 3] = 1;
  }
}

function loadPoints(curve: CatmullRomCurve3, anchorX: number, anchorY: number, rope: ArrayLike<number>): void {
  curve.points[0].set(anchorX, anchorY + ANCHOR_LIFT, 0);
  for (let i = 1; i < curve.points.length; i++) {
    curve.points[i].set(rope[(i - 1) * 3], rope[(i - 1) * 3 + 1], rope[(i - 1) * 3 + 2]);
  }
}

export function createLanyard(texture: Texture): Lanyard {
  texture.wrapS = RepeatWrapping;
  const ribbon = createRibbon();
  const samples = new Float32Array((SEGMENTS + 1) * 3);
  const mesh = new Mesh(ribbon.geometry, new MeshStandardMaterial({ map: texture, roughness: 0.75, side: DoubleSide }));
  mesh.castShadow = true;
  mesh.frustumCulled = false;

  // The curve and its control points are built once: allocating a new CatmullRomCurve3 per frame is per-frame GC.
  let curve: CatmullRomCurve3 | null = null;

  return {
    mesh,
    update(anchorX, anchorY, rope) {
      const count = rope.length / 3 + 1;
      if (!curve || curve.points.length !== count) curve = createCurve(count);
      loadPoints(curve, anchorX, anchorY, rope);
      curve.updateArcLengths();
      sampleCurve(curve, samples);
      writeRibbon(ribbon, samples, curve.getLength());
      ribbon.geometry.attributes.position.needsUpdate = true;
      ribbon.geometry.attributes.uv.needsUpdate = true;
    },
  };
}
