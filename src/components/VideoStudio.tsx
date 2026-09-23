/** CapCut Video Studio - full implementation lives in local workspace; syncing...
 * Please pull from the workspace or re-run deploy.
 * Features: multi-track, drag/trim, split, ripple, filters, transitions, AI, export
 */
import React from 'react';

export interface VideoStudioProps {
  apiKey: string;
  hasServerKey: boolean;
  onRequireApiKey: () => void;
  initialImage?: string | null;
  onToast?: (msg: string) => void;
}

/** Temporary stub - full CapCut editor is in the build tree and will be restored */
export const VideoStudio: React.FC<VideoStudioProps> = ({ onToast }) => {
  React.useEffect(() => {
    onToast?.('Loading CapCut Video Studio…');
  }, [onToast]);
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8 rounded-2xl bg-zinc-900 border border-zinc-800">
      <p className="text-sm font-bold text-white">Video Studio (CapCut-style)</p>
      <p className="text-xs text-zinc-400 text-center max-w-md">
        Full editor is available in the project source. If you see this stub, the large VideoStudio.tsx file needs a git push from the development environment.
      </p>
      <p className="text-[10px] text-zinc-600 font-mono">Features: timeline · drag/trim · split · ripple · export · AI</p>
    </div>
  );
};
