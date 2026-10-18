import { describe, expect, it, vi } from "vitest";
import { DirectionalLight, Group, Mesh, MeshBasicMaterial, PlaneGeometry, Texture } from "three";
import { disposeTree } from "./dispose";

describe("disposeTree", () => {
  it("disposes geometries, materials and their textures", () => {
    const map = new Texture();
    const material = new MeshBasicMaterial({ map });
    const geometry = new PlaneGeometry();
    const root = new Group().add(new Mesh(geometry, material));
    const spies = [vi.spyOn(map, "dispose"), vi.spyOn(material, "dispose"), vi.spyOn(geometry, "dispose")];

    disposeTree(root);

    spies.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1));
  });

  it("disposes light shadow maps", () => {
    const light = new DirectionalLight();
    const spy = vi.spyOn(light.shadow, "dispose");

    disposeTree(new Group().add(light));

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
