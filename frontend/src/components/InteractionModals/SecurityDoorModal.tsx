import React from 'react';
import { SecurityDoorData } from '../../stores/interactionStore';
import { ShieldAlert, Lock, X } from 'lucide-react';
import { soundEngine } from '../../services/soundEngine';

interface SecurityDoorModalProps {
  data: SecurityDoorData;
  onClose: () => void;
}

export const SecurityDoorModal: React.FC<SecurityDoorModalProps> = ({ data, onClose }) => {
  return (
    <div className="p-6 bg-[#080C14] border border-cyber-red/60 rounded-lg max-w-lg w-full font-mono text-[#E2F1FF] shadow-[0_0_50px_rgba(255,42,77,0.25)] relative">
      {/* Close button */}
      <button
        onClick={() => {
          soundEngine.playKeyTick();
          onClose();
        }}
        className="absolute top-4 right-4 p-1.5 text-cyber-textMuted hover:text-cyber-textBright hover:bg-cyber-surface rounded transition-colors"
        aria-label="Close security panel"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-cyber-border mb-5">
        <div className="w-10 h-10 rounded-full bg-cyber-redDim/30 border border-cyber-red/60 flex items-center justify-center text-cyber-red animate-pulse">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-widest text-cyber-red glow-red-sm">
            SECURITY DOOR
          </h2>
          <div className="text-[11px] text-cyber-textMuted">SECTOR_00 // BLAST_GATE_ALPHA</div>
        </div>
      </div>

      {/* Status Box */}
      <div className="p-4 bg-cyber-bg rounded border border-cyber-border space-y-3 mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-cyber-textMuted">SECURITY DOOR</span>
          <span className="text-cyber-cyan font-bold">{data.displayName}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-cyber-textMuted">STATUS:</span>
          <span className="text-cyber-red font-bold glow-red-sm flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-cyber-red" />
            {data.status}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-cyber-textMuted">PERMISSION:</span>
          <span className="text-cyber-yellow font-bold">{data.permissionLevel}</span>
        </div>
      </div>

      {/* Access Denied Diagnostics */}
      <div className="p-3 bg-cyber-redDim/15 border border-cyber-red/40 rounded text-xs text-cyber-textDim space-y-1 mb-6">
        <div className="text-cyber-red font-bold">[!] ACCESS RESTRICTED</div>
        <div>Required clearance level: <span className="text-cyber-textBright font-bold">SYS_ROOT_L5</span></div>
        <div>Current operator identity has insufficient privileges. Bypass code is fragmented in corrupted memory files.</div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            soundEngine.playWarning();
          }}
          className="flex-1 py-2.5 px-4 rounded border border-cyber-red/50 bg-cyber-redDim/20 hover:bg-cyber-redDim/40 text-cyber-red text-xs font-bold tracking-wider transition-colors"
        >
          ATTEMPT OVERRIDE (FAILED)
        </button>
        <button
          onClick={() => {
            soundEngine.playKeyTick();
            onClose();
          }}
          className="flex-1 py-2.5 px-4 rounded border border-cyber-border bg-cyber-surface hover:bg-cyber-surfaceAlt text-cyber-textBright text-xs font-bold tracking-wider transition-colors"
        >
          DISMISS (ESC)
        </button>
      </div>
    </div>
  );
};

export default SecurityDoorModal;
