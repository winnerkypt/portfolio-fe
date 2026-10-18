import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry, TorusGeometry } from "three";

export function createClip(): Group {
  const metal = new MeshStandardMaterial({ color: 0xc9c2b6, metalness: 0.85, roughness: 0.3 });
  const body = new Mesh(
    new BoxGeometry(0.42, 0.2, 0.1),
    new MeshStandardMaterial({ color: 0x2c1d16, roughness: 0.45, metalness: 0.1 }),
  );
  body.position.y = -0.04;
  const ring = new Mesh(new TorusGeometry(0.11, 0.028, 10, 24), metal);
  ring.position.y = 0.1;
  const clip = new Group();
  clip.add(body, ring);
  clip.traverse((o) => {
    o.castShadow = true;
  });
  clip.rotation.order = "ZYX";
  return clip;
}

export function createPin(): Group {
  const metal = new MeshStandardMaterial({ color: 0xc9c2b6, metalness: 0.85, roughness: 0.3 });
  const base = new Mesh(new CylinderGeometry(0.07, 0.085, 0.04, 24), metal);
  base.rotation.x = Math.PI / 2;
  const head = new Mesh(new SphereGeometry(0.09, 24, 16), new MeshStandardMaterial({ color: 0xf08282, roughness: 0.4 }));
  head.position.z = 0.1;
  const pin = new Group();
  pin.add(base, head);
  pin.traverse((o) => {
    o.castShadow = true;
  });
  return pin;
}
