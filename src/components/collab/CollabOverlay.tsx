/** Live cursors overlay for collaborative Image Studio */

import React, { useEffect, useState } from 'react';
import { Users, Radio } from 'lucide-react';
import { CollabRoom, type CollabPresence } from './collabChannel';

interface Props {
  roomId?: string;
  userName?: string;
  enabled?: boolean;
  onRoomReady?: (room: CollabRoom | null) => void;
}

export const CollabOverlay: React.FC<Props> = ({
  roomId = 'imideo-canvas',
  userName = 'Creator',
  enabled = true,
  onRoomReady,
}) => {
  const [room, setRoom] = useState<CollabRoom | null>(null);
  const [others, setOthers] = useState<CollabPresence[]>([]);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!enabled) {
      room?.close();
      setRoom(null);
      onRoomReady?.(null);
      return;
    }
    const r = new CollabRoom(roomId, userName);
    setRoom(r);
    setJoined(true);
    onRoomReady?.(r);
    const unsub = r.subscribe(() => setOthers(r.getOthers()));
    const tick = setInterval(() => setOthers(r.getOthers()), 2000);
    return () => {
      unsub();
      clearInterval(tick);
      r.close();
      onRoomReady?.(null);
    };
  }, [roomId, userName, enabled]);

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {others.map((p) => (
        <div key={p.clientId} className="absolute transition-transform duration-75" style={{ transform: `translate(${p.x}px, ${p.y}px)`, left: 0, top: 0 }}>
          <svg width="16" height="20" viewBox="0 0 16 20" className="drop-shadow">
            <path d="M1 1 L1 15 L5 12 L8 18 L10 17 L7 11 L13 11 Z" fill={p.color} stroke="#fff" strokeWidth="0.8" />
          </svg>
          <span className="ml-3 -mt-1 inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold text-white shadow" style={{ background: p.color }}>{p.name}</span>
        </div>
      ))}
      <div className="pointer-events-auto absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-950/80 border border-zinc-700 text-[10px] text-zinc-300">
        {joined ? (<><Radio className="w-3 h-3 text-emerald-400" /><Users className="w-3 h-3" /><span>Live \u00b7 {others.length + 1} in room</span></>) : (<span className="text-zinc-500">Collab off</span>)}
      </div>
    </div>
  );
};

export default CollabOverlay;
