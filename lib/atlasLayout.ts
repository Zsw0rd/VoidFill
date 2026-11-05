// The map uses real learning records. Decorative terrain is a separate image.
export type AtlasPoint = { x: number; y: number };
export type AtlasBounds = { left: number; top: number; right: number; bottom: number };
type AtlasInput = { id: string; resourceIds: string[] };

export const ATLAS_NODE_SIZE = 216;
export const ATLAS_RESOURCE_WIDTH = 284;
export const ATLAS_RESOURCE_HEIGHT = 70;
export const ATLAS_VISIBLE_RESOURCES = 3;

export function createAtlasLayout(skills: AtlasInput[], selectedId: string | null) {
  const count = skills.length;
  const radius = Math.max(280, count * 50);
  const angles = count === 1 ? [-30] : count === 2 ? [-145, -35]
    : count === 3 ? [-150, -30, 90]
    : Array.from({ length: count }, (_, i) => -135 + i * 360 / count);
  const nodes = skills.map((skill, i) => {
    const angle = angles[i] * Math.PI / 180;
    return { ...skill, angle, x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * .78 };
  });
  const selected = nodes.find(node => node.id === selectedId) || nodes[0];
  const resourceIds = selected?.resourceIds.slice(0, ATLAS_VISIBLE_RESOURCES) || [];
  const resources = resourceIds.map((id, i) => {
    const ux = Math.cos(selected.angle), uy = Math.sin(selected.angle);
    if (Math.abs(ux) < .5) {
      const columns = Math.min(resourceIds.length, 2);
      const column = i % columns, row = Math.floor(i / columns);
      return {
        id, x: selected.x + (column - (columns - 1) / 2) * (ATLAS_RESOURCE_WIDTH + 24),
        y: selected.y + Math.sign(uy) * (ATLAS_NODE_SIZE / 2 + 110 + row * 92),
      };
    }
    return {
      id, x: selected.x + Math.sign(ux) * (ATLAS_NODE_SIZE / 2 + ATLAS_RESOURCE_WIDTH / 2 + 54),
      y: selected.y + uy * 100 + (i - (resourceIds.length - 1) / 2) * 90,
    };
  });
  const vertical = selected && Math.abs(Math.cos(selected.angle)) < .5;
  const more = selected && resources.length && selected.resourceIds.length > resources.length ? {
    x: vertical ? selected.x : resources[resources.length - 1].x,
    y: vertical && Math.sin(selected.angle) < 0 ? Math.min(...resources.map(node => node.y)) - 76 : Math.max(...resources.map(node => node.y)) + 51,
  } : null;
  const rectangles = [
    { left: -90, right: 90, top: -84, bottom: 84 },
    ...nodes.map(node => ({ left: node.x - 116, right: node.x + 116, top: node.y - 116, bottom: node.y + 156 })),
    ...resources.map(node => ({ left: node.x - ATLAS_RESOURCE_WIDTH / 2, right: node.x + ATLAS_RESOURCE_WIDTH / 2, top: node.y - ATLAS_RESOURCE_HEIGHT / 2, bottom: node.y + ATLAS_RESOURCE_HEIGHT / 2 })),
    ...(more ? [{ left: more.x - 103, right: more.x + 103, top: more.y, bottom: more.y + 31 }] : []),
  ];
  const bounds = {
    left: Math.min(...rectangles.map(r => r.left)) - 24,
    right: Math.max(...rectangles.map(r => r.right)) + 24,
    top: Math.min(...rectangles.map(r => r.top)) - 16,
    bottom: Math.max(...rectangles.map(r => r.bottom)) + 24,
  };
  return { nodes, resources, selected, bounds, radius, more };
}

export function fitAtlas(bounds: AtlasBounds, width: number, height: number) {
  const scale = Math.min((Math.max(width, 1) - 48) / (bounds.right - bounds.left), (Math.max(height, 1) - 72) / (bounds.bottom - bounds.top), 1);
  const safeScale = Math.max(.12, scale);
  return { scale: safeScale, x: width / 2 - (bounds.left + bounds.right) / 2 * safeScale, y: height / 2 - (bounds.top + bounds.bottom) / 2 * safeScale };
}

// Keep the world point under the cursor stationary while zooming.
export function zoomAtlas(camera: { x: number; y: number; scale: number }, scale: number, point: AtlasPoint) {
  return { scale, x: point.x - (point.x - camera.x) * scale / camera.scale, y: point.y - (point.y - camera.y) * scale / camera.scale };
}
