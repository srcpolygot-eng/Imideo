/**
 * Collaborative multiplayer foundation (Image Studio)
 * Uses BroadcastChannel for same-origin multi-tab sync.
 */

export type CollabPresence = {
  clientId: string;
  name: string;
  color: string;
  x: number;
  y: number;
  tool?: string;
  updatedAt: number;
};

export type CollabLayerOp =
  | { type: 'cursor'; presence: CollabPresence }
  | { type: 'layer-add'; layerId: string; name: string; by: string }
  | { type: 'layer-update'; layerId: string; patch: Record<string, unknown>; by: string }
  | { type: 'layer-remove'; layerId: string; by: string }
  | { type: 'chat'; text: string; by: string; at: number }
  | { type: 'join'; presence: CollabPresence }
  | { type: 'leave'; clientId: string };

const COLORS = ['#f43f5e', '#a78bfa', '#34d399', '#fbbf24', '#60a5fa', '#fb7185'];

export function createClientId(): string {
  return `c_${Math.random().toString(36).slice(2, 10)}`;
}

export function randomCollabColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export class CollabRoom {
  readonly roomId: string;
  readonly clientId: string;
  readonly name: string;
  readonly color: string;
  private channel: BroadcastChannel | null = null;
  private listeners = new Set<(msg: CollabLayerOp) => void>();
  private presence = new Map<string, CollabPresence>();

  constructor(roomId: string, name = 'Guest') {
    this.roomId = roomId || 'imideo-default';
    this.clientId = createClientId();
    this.name = name;
    this.color = randomCollabColor();
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(`imideo-collab:${this.roomId}`);
      this.channel.onmessage = (ev) => {
        const msg = ev.data as CollabLayerOp;
        if (!msg || typeof msg !== 'object') return;
        if (msg.type === 'cursor' || msg.type === 'join') {
          this.presence.set(msg.presence.clientId, msg.presence);
        } else if (msg.type === 'leave') {
          this.presence.delete(msg.clientId);
        }
        this.listeners.forEach((fn) => fn(msg));
      };
      this.send({
        type: 'join',
        presence: {
          clientId: this.clientId,
          name: this.name,
          color: this.color,
          x: 0,
          y: 0,
          updatedAt: Date.now(),
        },
      });
    }
  }

  subscribe(fn: (msg: CollabLayerOp) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  send(msg: CollabLayerOp) {
    this.channel?.postMessage(msg);
  }

  broadcastCursor(x: number, y: number, tool?: string) {
    const presence: CollabPresence = {
      clientId: this.clientId,
      name: this.name,
      color: this.color,
      x,
      y,
      tool,
      updatedAt: Date.now(),
    };
    this.presence.set(this.clientId, presence);
    this.send({ type: 'cursor', presence });
  }

  getOthers(): CollabPresence[] {
    const now = Date.now();
    return [...this.presence.values()].filter(
      (p) => p.clientId !== this.clientId && now - p.updatedAt < 15000
    );
  }

  close() {
    this.send({ type: 'leave', clientId: this.clientId });
    this.channel?.close();
    this.channel = null;
  }
}
