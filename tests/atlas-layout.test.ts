import test from "node:test";
import assert from "node:assert/strict";
import { ATLAS_NODE_SIZE, ATLAS_RESOURCE_HEIGHT, ATLAS_RESOURCE_WIDTH, createAtlasLayout, fitAtlas, zoomAtlas } from "../lib/atlasLayout";

test("each supported track keeps expanded resource hit targets clear of skill nodes", () => {
  for (const count of [1, 2, 3, 4, 5, 6, 8]) {
    const skills = Array.from({ length: count }, (_, i) => ({ id: `skill-${i}`, resourceIds: Array.from({ length: 8 }, (_, j) => `resource-${i}-${j}`) }));
    for (const selected of skills) {
      const layout = createAtlasLayout(skills, selected.id);
      assert.ok(layout.resources.length > 0 && layout.resources.length <= 4);
      for (const resource of layout.resources) {
        for (const node of layout.nodes) {
          const overlaps = Math.abs(resource.x - node.x) < ATLAS_RESOURCE_WIDTH / 2 + ATLAS_NODE_SIZE / 2 && Math.abs(resource.y - node.y) < ATLAS_RESOURCE_HEIGHT / 2 + ATLAS_NODE_SIZE / 2;
          assert.equal(overlaps, false, `resource ${resource.id} covers ${node.id} in a ${count}-skill track`);
        }
      }
    }
  }
});

test("fitting a populated map keeps all skill circles and resource buttons inside the viewport", () => {
  const layout = createAtlasLayout(Array.from({ length: 5 }, (_, i) => ({ id: String(i), resourceIds: ["a", "b", "c", "d"] })), "0");
  const camera = fitAtlas(layout.bounds, 1050, 650);
  for (const node of [...layout.nodes.map(node => ({ ...node, width: ATLAS_NODE_SIZE, height: ATLAS_NODE_SIZE })), ...layout.resources.map(node => ({ ...node, width: ATLAS_RESOURCE_WIDTH, height: ATLAS_RESOURCE_HEIGHT }))]) {
    assert.ok((node.x - node.width / 2) * camera.scale + camera.x >= 0);
    assert.ok((node.x + node.width / 2) * camera.scale + camera.x <= 1050);
    assert.ok((node.y - node.height / 2) * camera.scale + camera.y >= 0);
    assert.ok((node.y + node.height / 2) * camera.scale + camera.y <= 650);
  }
});

test("zoom retains the exact world point beneath the cursor", () => {
  const camera = { x: 130, y: -65, scale: .7 };
  const cursor = { x: 448, y: 320 };
  const before = { x: (cursor.x - camera.x) / camera.scale, y: (cursor.y - camera.y) / camera.scale };
  const after = zoomAtlas(camera, 1.4, cursor);
  assert.ok(Math.abs((cursor.x - after.x) / after.scale - before.x) < 1e-9);
  assert.ok(Math.abs((cursor.y - after.y) / after.scale - before.y) < 1e-9);
  assert.equal(createAtlasLayout([], null).resources.length, 0);
});
