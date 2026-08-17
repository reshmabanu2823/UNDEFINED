import React from 'react';
import { useWorldStore } from '../../stores/worldStore';
import { ShieldAlert, Lock, Unlock, X } from 'lucide-react';
import { soundEngine } from '../../services/soundEngine';

interface SecurityDoorModalProps {
  onClose: () => void;
}

export const SecurityDoorModal: React.FC<SecurityDoorModalProps> = ({ onClose }) => {
  const door = useWorldStore((state) => state.door_01);
  const isUnlocked = !door.locked;

  return (
    <div
      className={`p-6 bg-[#080C14] border rounded-lg max-w-lg w-full font-mono text-[#E2F1FF] relative ${
        isUnlocked
          ? 'border-cyber-cyan/60 shadow-[0_0_50px_rgba(0,240,255,0.25)]'
          : 'border-cyber-red/60 shadow-[0_0_50px_rgba(255,42,77,0.25)]'
      }`}
    >
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
        <div
          className={`w-10 h-10 rounded-full border flex items-center justify-center ${
            isUnlocked
              ? 'bg-cyber-cyanDim/30 border-cyber-cyan/60 text-cyber-cyan'
              : 'bg-cyber-redDim/30 border-cyber-red/60 text-cyber-red animate-pulse'
          }`}
        >
          {isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
        </div>
        <div>
          <h2
            className={`text-xl font-bold tracking-widest ${
              isUnlocked ? 'text-cyber-cyan glow-cyan-sm' : 'text-cyber-red glow-red-sm'
            }`}
          >
            SECURITY DOOR
          </h2>
          <div className="text-[11px] text-cyber-textMuted">SECTOR_00 // BLAST_GATE_ALPHA</div>
        </div>
      </div>

      {/* Status Box */}
      <div className="p-4 bg-cyber-bg rounded border border-cyber-border space-y-3 mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-cyber-textMuted">SECURITY DOOR</span>
          <span className="text-cyber-cyan font-bold">{door.displayName}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-cyber-textMuted">STATUS:</span>
          <span
            className={`font-bold flex items-center gap-1.5 ${
              isUnlocked ? 'text-cyber-cyan glow-cyan-sm' : 'text-cyber-red glow-red-sm'
            }`}
          >
            {isUnlocked ? <Unlock className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            {door.status}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-cyber-textMuted">PERMISSION:</span>
          <span
            className={`font-bold ${
              door.permission === 'ROOT' ? 'text-cyber-cyan glow-cyan-sm' : 'text-cyber-yellow'
            }`}
          >
            {door.permission}
          </span>
        </div>
      </div>

      {/* Access Diagnostics */}
      {isUnlocked ? (
        <div className="p-3 bg-cyber-cyanDim/20 border border-cyber-cyan/40 rounded text-xs text-cyber-textDim space-y-1 mb-6">
          <div className="text-cyber-cyan font-bold">[!] ACCESS GRANTED // PERMISSION: ROOT</div>
          <div>Hydraulic locks retracted. Operator may now proceed into Sector 02.</div>
        </div>
      ) : (
        <div className="p-3 bg-cyber-redDim/15 border border-cyber-red/40 rounded text-xs text-cyber-textDim space-y-1 mb-6">
          <div className="text-cyber-red font-bold">[!] ACCESS RESTRICTED</div>
          <div>
            Required clearance level: <span className="text-cyber-textBright font-bold">ROOT</span>
          </div>
          <div>
            Access terminal_01 to rewrite security permissions or locate bypass keys.
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!isUnlocked && (
          <button
            onClick={() => {
              soundEngine.playWarning();
            }}
            className="flex-1 py-2.5 px-4 rounded border border-cyber-red/50 bg-cyber-redDim/20 hover:bg-cyber-redDim/40 text-cyber-red text-xs font-bold tracking-wider transition-colors"
          >
            MANUAL OVERRIDE (LOCKED)
          </button>
        )}
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
