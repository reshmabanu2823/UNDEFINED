import React, { useState } from 'react';
import { MemoryFileData } from '../../stores/interactionStore';
import { Database, X, Sparkles, RefreshCw, AudioWaveform, FileCode } from 'lucide-react';
import { soundEngine } from '../../services/soundEngine';

interface MemoryViewerModalProps {
  data: MemoryFileData;
  onClose: () => void;
  onUpdateRecovery?: (newPercent: number) => void;
}

export const MemoryViewerModal: React.FC<MemoryViewerModalProps> = ({
  data,
  onClose,
  onUpdateRecovery,
}) => {
  const [recovery, setRecovery] = useState<number>(data.recoveryPercentage);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);

  const handleDecrypt = () => {
    if (isDecrypting || recovery >= 100) return;
    setIsDecrypting(true);
    soundEngine.playGlitch();

    setTimeout(() => {
      const nextVal = Math.min(100, Number((recovery + 18.5).toFixed(1)));
      setRecovery(nextVal);
      setIsDecrypting(false);
      soundEngine.playSystemLine();
      if (onUpdateRecovery) {
        onUpdateRecovery(nextVal);
      }
    }, 700);
  };

  return (
    <div className="p-6 bg-[#080C14] border border-cyber-purple/60 rounded-lg max-w-xl w-full font-mono text-[#E2F1FF] shadow-[0_0_60px_rgba(157,78,221,0.25)] relative">
      {/* Close button */}
      <button
        onClick={() => {
          soundEngine.playKeyTick();
          onClose();
        }}
        className="absolute top-4 right-4 p-1.5 text-cyber-textMuted hover:text-cyber-textBright hover:bg-cyber-surface rounded transition-colors"
        aria-label="Close memory viewer"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Top Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-cyber-border mb-5">
        <div className="w-10 h-10 rounded-full bg-cyber-purpleDim/30 border border-cyber-purple/60 flex items-center justify-center text-cyber-purple animate-pulse">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-widest text-cyber-purple glow-purple-sm">
            MEMORY VIEWER
          </h2>
          <div className="text-[11px] text-cyber-textMuted flex items-center gap-2">
            <FileCode className="w-3.5 h-3.5 text-cyber-cyan inline" />
            <span>FILENAME: {data.filename}</span>
          </div>
        </div>
      </div>

      {/* Recovery Status Bar */}
      <div className="p-4 bg-cyber-bg rounded border border-cyber-border mb-5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-cyber-textMuted uppercase tracking-wider">
            DATA RECOVERY PROGRESS
          </span>
          <span className="text-cyber-cyan font-bold glow-cyan-sm">
            {recovery.toFixed(1)}% RECOVERED
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-cyber-surfaceAlt rounded-full overflow-hidden border border-cyber-border">
          <div
            className="h-full bg-gradient-to-r from-cyber-purple to-cyber-cyan transition-all duration-500 rounded-full shadow-[0_0_10px_#00F0FF]"
            style={{ width: `${recovery}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-cyber-textMuted pt-1">
          <span>SOURCE: {data.author}</span>
          <span>TIMESTAMP: {data.recordedDate}</span>
        </div>
      </div>

      {/* Audio / Neural Waveform Animation */}
      <div className="p-3 bg-cyber-bg/70 rounded border border-cyber-border mb-4 flex items-center gap-3">
        <AudioWaveform className="w-5 h-5 text-cyber-cyan shrink-0 animate-pulse" />
        <div className="flex-1 flex items-center gap-1 h-6">
          {[40, 70, 25, 90, 60, 30, 85, 45, 95, 30, 65, 80, 50, 90, 40, 75, 35, 85, 60].map(
            (height, i) => (
              <div
                key={i}
                className="flex-1 bg-cyber-cyan/60 rounded-full transition-all duration-200"
                style={{ height: `${height}%` }}
              />
            )
          )}
        </div>
      </div>

      {/* Decrypted Excerpt Content */}
      <div className="p-4 bg-[#05070B] border border-cyber-border rounded text-xs text-cyber-textDim leading-relaxed mb-6 font-mono">
        <div className="text-cyber-textMuted uppercase text-[10px] mb-1.5 flex items-center gap-1">
          <span>TRANSCRIPTION STREAM</span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyber-cyan animate-ping" />
        </div>
        <p className="italic text-[#E2F1FF]">
          "{data.contentSnippet}"
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleDecrypt}
          disabled={isDecrypting || recovery >= 100}
          className={`flex-1 py-2.5 px-4 rounded border text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-2 ${
            recovery >= 100
              ? 'border-cyber-cyan/40 bg-cyber-cyan/10 text-cyber-cyan'
              : 'border-cyber-purple/60 bg-cyber-purpleDim/20 hover:bg-cyber-purpleDim/40 text-cyber-purple'
          }`}
        >
          {isDecrypting ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>RECONSTRUCTING NEURAL BLOCKS...</span>
            </>
          ) : recovery >= 100 ? (
            <span>MEMORY FULLY STABILIZED</span>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>RECONSTRUCT FRAGMENT (+18.5%)</span>
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

export default MemoryViewerModal;
