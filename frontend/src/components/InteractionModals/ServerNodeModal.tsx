import React, { useState } from 'react';
import { ServerNodeData } from '../../stores/interactionStore';
import { Cpu, X, Activity, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { soundEngine } from '../../services/soundEngine';

interface ServerNodeModalProps {
  data: ServerNodeData;
  onClose: () => void;
}

export const ServerNodeModal: React.FC<ServerNodeModalProps> = ({ data, onClose }) => {
  const [integrity, setIntegrity] = useState<number>(data.integrity);
  const [isFlushing, setIsFlushing] = useState<boolean>(false);

  const handleFlushCore = () => {
    if (isFlushing) return;
    setIsFlushing(true);
    soundEngine.playBootTransition();

    setTimeout(() => {
      setIntegrity(89.6);
      setIsFlushing(false);
    }, 800);
  };

  return (
    <div className="p-6 bg-[#080C14] border border-cyber-cyan/60 rounded-lg max-w-xl w-full font-mono text-[#E2F1FF] shadow-[0_0_60px_rgba(0,240,255,0.25)] relative">
      {/* Close button */}
      <button
        onClick={() => {
          soundEngine.playKeyTick();
          onClose();
        }}
        className="absolute top-4 right-4 p-1.5 text-cyber-textMuted hover:text-cyber-textBright hover:bg-cyber-surface rounded transition-colors"
        aria-label="Close server node panel"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Top Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-cyber-border mb-5">
        <div className="w-10 h-10 rounded-full bg-cyber-cyanDim/30 border border-cyber-cyan/60 flex items-center justify-center text-cyber-cyan animate-pulse">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-widest text-cyber-cyan glow-cyan-sm">
            {data.displayName}
          </h2>
          <div className="text-[11px] text-cyber-textMuted">SECTOR: {data.sector}</div>
        </div>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-3.5 bg-cyber-bg rounded border border-cyber-border">
          <div className="text-[11px] text-cyber-textMuted uppercase mb-1">SYSTEM STATUS</div>
          <div className="text-sm font-bold text-cyber-red flex items-center gap-1.5 glow-red-sm">
            <AlertTriangle className="w-4 h-4" />
            {data.systemStatus}
          </div>
        </div>

        <div className="p-3.5 bg-cyber-bg rounded border border-cyber-border">
          <div className="text-[11px] text-cyber-textMuted uppercase mb-1">CORE INTEGRITY</div>
          <div className="text-sm font-bold text-cyber-cyan flex items-center gap-1.5 glow-cyan-sm">
            <Activity className="w-4 h-4" />
            {integrity.toFixed(1)}% STABLE
          </div>
        </div>
      </div>

      {/* Hardware Telemetry Output */}
      <div className="p-3.5 bg-cyber-bg/80 rounded border border-cyber-border text-xs space-y-2 mb-6 text-cyber-textDim">
        <div className="flex items-center justify-between">
          <span>ALLOCATED QUANTUM CORES:</span>
          <span className="text-cyber-textBright font-bold">{data.allocatedCores} THREADS</span>
        </div>
        <div className="flex items-center justify-between">
          <span>MEMORY TEMPERATURE:</span>
          <span className="text-cyber-yellow font-bold">48.2 &deg;C</span>
        </div>
        <div className="flex items-center justify-between">
          <span>NULL CORRUPTION INDEX:</span>
          <span className="text-cyber-red font-bold">HIGH RISK</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleFlushCore}
          disabled={isFlushing}
          className="flex-1 py-2.5 px-4 rounded border border-cyber-cyan/60 bg-cyber-cyan/10 hover:bg-cyber-cyan/20 text-cyber-cyan text-xs font-bold tracking-wider transition-colors flex items-center justify-center gap-2"
        >
          {isFlushing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>FLUSHING QUANTUM THREADS...</span>
            </>
          ) : integrity > 70 ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>CORE STABILIZED</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>RESTART SERVER NODE THREADS</span>
            </>
          )}
        </button>
        <button
          onClick={() => {
            soundEngine.playKeyTick();
            onClose();
          }}
          className="py-2.5 px-5 rounded border border-cyber-border bg-cyber-surface hover:bg-cyber-surfaceAlt text-cyber-textBright text-xs font-bold tracking-wider transition-colors"
        >
          CLOSE (ESC)
        </button>
      </div>
    </div>
  );
};

export default ServerNodeModal;
