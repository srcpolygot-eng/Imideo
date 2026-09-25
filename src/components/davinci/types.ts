/** DaVinci-style node graph + color scopes (Video) */

export type NodeKind =
  | 'media'
  | 'color'
  | 'blur'
  | 'glow'
  | 'composite'
  | 'transform'
  | 'output'
  | 'secondary'
  | 'merge';

export interface NodeSocket {
  id: string;
  name: string;
  direction: 'in' | 'out';
  dataType: 'image' | 'mask' | 'number' | 'color';
}

export interface GraphNode {
  id: string;
  kind: NodeKind;
  title: string;
  x: number;
  y: number;
  params: Record<string, number | string | boolean>;
  inputs: NodeSocket[];
  outputs: NodeSocket[];
}

export interface GraphEdge {
  id: string;
  fromNode: string;
  fromSocket: string;
  toNode: string;
  toSocket: string;
}

export interface NodeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
}

export interface ScopeSample {
  r: number[];
  g: number[];
  b: number[];
  luma: number[];
}

export function uid(prefix = 'n'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function defaultNodeGraph(): NodeGraph {
  const mediaId = uid('media');
  const colorId = uid('color');
  const outId = uid('out');
  return {
    selectedNodeId: colorId,
    nodes: [
      {
        id: mediaId,
        kind: 'media',
        title: 'Media In',
        x: 40,
        y: 120,
        params: {},
        inputs: [],
        outputs: [{ id: 'out', name: 'Image', direction: 'out', dataType: 'image' }],
      },
      {
        id: colorId,
        kind: 'color',
        title: 'Primary Color',
        x: 260,
        y: 100,
        params: {
          lift: 0,
          gamma: 0,
          gain: 0,
          saturation: 100,
          temperature: 0,
          tint: 0,
          contrast: 100,
          brightness: 100,
        },
        inputs: [{ id: 'in', name: 'Image', direction: 'in', dataType: 'image' }],
        outputs: [{ id: 'out', name: 'Image', direction: 'out', dataType: 'image' }],
      },
      {
        id: outId,
        kind: 'output',
        title: 'Timeline Out',
        x: 500,
        y: 120,
        params: {},
        inputs: [{ id: 'in', name: 'Image', direction: 'in', dataType: 'image' }],
        outputs: [],
      },
    ],
    edges: [
      {
        id: uid('e'),
        fromNode: mediaId,
        fromSocket: 'out',
        toNode: colorId,
        toSocket: 'in',
      },
      {
        id: uid('e'),
        fromNode: colorId,
        fromSocket: 'out',
        toNode: outId,
        toSocket: 'in',
      },
    ],
  };
}

export function emptyScopes(): ScopeSample {
  const z = () => Array(256).fill(0);
  return { r: z(), g: z(), b: z(), luma: z() };
}

export function sampleScopesFromImageData(data: ImageData): ScopeSample {
  const s = emptyScopes();
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    s.r[r]++;
    s.g[g]++;
    s.b[b]++;
    const y = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    s.luma[y]++;
  }
  return s;
}
