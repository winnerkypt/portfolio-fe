import { LightShadow, Material, Mesh, Object3D, Texture } from "three";

function disposeMaterial(material: Material): void {
  for (const value of Object.values(material)) {
    if (value instanceof Texture) value.dispose();
  }
  material.dispose();
}

export function disposeTree(root: Object3D): void {
  root.traverse((object) => {
    if ("shadow" in object && object.shadow instanceof LightShadow) object.shadow.dispose();
    if (!(object instanceof Mesh)) return;
    object.geometry.dispose();
    const materials: Material[] = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach(disposeMaterial);
  });
}
