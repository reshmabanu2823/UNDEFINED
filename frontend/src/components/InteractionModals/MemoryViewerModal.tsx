import React, { useState, useEffect } from 'react';
import { MemoryService, MemoryFragment, MemoryStatus } from '../../services/memoryService';
import { soundEngine } from '../../services/soundEngine';
import { useWorldStore } from '../../stores/worldStore';
import {
  Database,
  X,
  Sparkles,
  RefreshCw,
  AudioWaveform,
  FileCode,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Terminal,
} from 'lucide-react';

interface MemoryViewerModalProps {
  data?: {
    id: string;
    filename?: string;
    recoveryPercentage?: number;
  };
  onClose: () => void;
  onUpdateRecovery?: (newPercent: number) => void;
}

export const MemoryViewerModal: React.FC<MemoryViewerModalProps> = ({
  data,
  onClose,
  onUpdateRecovery,
}) => {
  const [memories, setMemories] = useState<MemoryFragment[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>(data?.filename || 'MEMORY_01.dat');
  const [activeMemory, setActiveMemory] = useState<MemoryFragment | null>(null);
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);

  // 1. Fetch & Auto-discover on mount
  useEffect(() => {
    const initMemories = async () => {
      // Auto-discover target memory
      const targetKey = data?.filename || 'MEMORY_01.dat';
      await MemoryService.discoverMemory(targetKey);

      // Fetch all memories
      const list = await MemoryService.listMemories();
      setMemories(list);

      const current = list.find((m) => m.memory_key.toLowerCase().includes(targetKey.toLowerCase().replace('.dat', ''))) || list[0];
      if (current) {
        setActiveMemory(current);
        setSelectedKey(current.memory_key);
      }
    };
    initMemories();
  }, [data?.filename]);

  // 2. Terminal Typewriter Animation when switching or loading memory
  useEffect(() => {
    if (!activeMemory) return;

    let index = 0;
    const fullText = activeMemory.content;
    setDisplayedText('');

    const interval = setInterval(() => {
      index++;
      setDisplayedText(fullText.substring(0, index));
      if (index % 3 === 0) {
        soundEngine.playKeyTick();
      }
      if (index >= fullText.length) {
        clearInterval(interval);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [activeMemory]);

  const currentStatus: MemoryStatus = activeMemory
    ? MemoryService.getStatus(activeMemory.integrity, activeMemory.discovered)
    : 'LOCKED';

  const handleSelectMemory = async (mem: MemoryFragment) => {
    soundEngine.playKeyTick();
    setSelectedKey(mem.memory_key);
    if (!mem.discovered) {
      const disc = await MemoryService.discoverMemory(mem.memory_key);
      if (disc) {
        setActiveMemory(disc);
        setMemories((prev) => prev.map((m) => (m.id === disc.id ? disc : m)));
        return;
      }
    }
    setActiveMemory(mem);
  };

  const handleReconstruct = () => {
    if (!activeMemory || isDecrypting || activeMemory.integrity >= 100) return;
    setIsDecrypting(true);
    soundEngine.playGlitch();

    setTimeout(() => {
      const nextVal = Math.min(100, Math.round(activeMemory.integrity + 25));
      const updated: MemoryFragment = { ...activeMemory, integrity: nextVal };
      setActiveMemory(updated);
      setMemories((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setIsDecrypting(false);
      soundEngine.playSystemLine();

      // Update Zustand
      useWorldStore.getState().addNotification({
        title: 'NEURAL CORE RECONSTRUCTED',
        message: `${updated.title}: Integrity restored to ${nextVal}%.`,
        type: 'SUCCESS',
      });
      if (onUpdateRecovery) {
        onUpdateRecovery(nextVal);
      }
    }, 600);
  };

  return (
    <div
      className={`p-6 bg-[#080C14] border rounded-lg max-w-2xl w-full font-mono text-[#E2F1FF] relative transition-all duration-300 ${
        currentStatus === 'RECOVERED'
          ? 'border-cyber-cyan/70 shadow-[0_0_60px_rgba(0,240,255,0.25)]'
          : currentStatus === 'PARTIAL'
          ? 'border-cyber-yellow/70 shadow-[0_0_60px_rgba(255,214,10,0.2)]'
          : currentStatus === 'CORRUPTED'
          ? 'border-cyber-red/70 shadow-[0_0_60px_rgba(255,42,77,0.25)]'
          : 'border-cyber-border shadow-[0_0_30px_rgba(255,255,255,0.05)]'
      }`}
    >
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
      <div className="flex items-center justify-between pb-4 border-b border-cyber-border mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center border animate-pulse ${
              currentStatus === 'RECOVERED'
                ? 'bg-cyber-cyan/10 border-cyber-cyan text-cyber-cyan'
                : currentStatus === 'PARTIAL'
                ? 'bg-cyber-yellow/10 border-cyber-yellow text-cyber-yellow'
                : 'bg-cyber-red/10 border-cyber-red text-cyber-red'
            }`}
          >
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-widest text-cyber-cyan glow-cyan-sm">
              NEURAL MEMORY ARCHIVE
            </h2>
            <div className="text-[11px] text-cyber-textMuted flex items-center gap-2">
              <FileCode className="w-3.5 h-3.5 text-cyber-cyan inline" />
              <span>KEY: {activeMemory?.memory_key || selectedKey}</span>
            </div>
          </div>
        </div>

        {/* Visual Classification Badge */}
        <div className="mr-8">
          {currentStatus === 'RECOVERED' && (
            <span className="px-2.5 py-1 rounded bg-cyber-cyan/20 border border-cyber-cyan text-cyber-cyan text-xs font-bold flex items-center gap-1 shadow-[0_0_12px_rgba(0,240,255,0.4)]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>RECOVERED (100%)</span>
            </span>
          )}
          {currentStatus === 'PARTIAL' && (
            <span className="px-2.5 py-1 rounded bg-cyber-yellow/20 border border-cyber-yellow text-cyber-yellow text-xs font-bold flex items-center gap-1 shadow-[0_0_12px_rgba(255,214,10,0.4)]">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>PARTIAL ({activeMemory?.integrity}%)</span>
            </span>
          )}
          {currentStatus === 'CORRUPTED' && (
            <span className="px-2.5 py-1 rounded bg-cyber-red/20 border border-cyber-red text-cyber-red text-xs font-bold flex items-center gap-1 shadow-[0_0_12px_rgba(255,42,77,0.4)] animate-pulse">
              <Flame className="w-3.5 h-3.5" />
              <span>CORRUPTED ({activeMemory?.integrity}%)</span>
            </span>
          )}
          {currentStatus === 'LOCKED' && (
            <span className="px-2.5 py-1 rounded bg-cyber-surfaceAlt border border-cyber-border text-cyber-textMuted text-xs font-bold flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              <span>LOCKED</span>
            </span>
          )}
        </div>
      </div>

      {/* MEMORY FRAGMENT SELECTOR TABS */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 text-xs">
        {memories.map((mem) => {
          const status = MemoryService.getStatus(mem.integrity, mem.discovered);
          const isSelected = activeMemory?.id === mem.id;
          return (
            <button
              key={mem.id}
              onClick={() => handleSelectMemory(mem)}
              className={`px-3 py-1.5 rounded border transition-all flex items-center gap-1.5 shrink-0 ${
                isSelected
                  ? 'bg-cyber-surface border-cyber-cyan text-cyber-cyan shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                  : 'bg-cyber-bg/70 border-cyber-border text-cyber-textMuted hover:border-cyber-cyan/50 hover:text-white'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  status === 'RECOVERED'
                    ? 'bg-cyber-cyan'
                    : status === 'PARTIAL'
                    ? 'bg-cyber-yellow'
                    : 'bg-cyber-red'
                }`}
              />
              <span className="font-bold">{mem.memory_key}</span>
              <span className="text-[10px] text-cyber-textMuted">({mem.integrity}%)</span>
            </button>
          );
        })}
      </div>

      {/* Recovery Status Bar */}
      <div className="p-3.5 bg-cyber-bg rounded border border-cyber-border mb-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-cyber-textMuted uppercase tracking-wider">
            {activeMemory?.title || 'SECTOR CORE ARCHIVE'}
          </span>
          <span
            className={`font-bold ${
              currentStatus === 'RECOVERED'
                ? 'text-cyber-cyan glow-cyan-sm'
                : currentStatus === 'PARTIAL'
                ? 'text-cyber-yellow'
                : 'text-cyber-red'
            }`}
          >
            INTEGRITY: {activeMemory?.integrity.toFixed(0)}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-cyber-surfaceAlt rounded-full overflow-hidden border border-cyber-border">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              currentStatus === 'RECOVERED'
                ? 'bg-gradient-to-r from-cyber-purple to-cyber-cyan shadow-[0_0_10px_#00F0FF]'
                : currentStatus === 'PARTIAL'
                ? 'bg-gradient-to-r from-cyber-yellow to-cyber-cyan shadow-[0_0_10px_#FFD60A]'
                : 'bg-gradient-to-r from-cyber-red to-cyber-purple shadow-[0_0_10px_#FF2A4D]'
            }`}
            style={{ width: `${activeMemory?.integrity || 0}%` }}
          />
        </div>
      </div>

      {/* Audio / Neural Waveform Animation */}
      <div className="p-2.5 bg-cyber-bg/70 rounded border border-cyber-border mb-4 flex items-center gap-3">
        <AudioWaveform className="w-4 h-4 text-cyber-cyan shrink-0 animate-pulse" />
        <div className="flex-1 flex items-center gap-1 h-5">
          {[40, 70, 25, 90, 60, 30, 85, 45, 95, 30, 65, 80, 50, 90, 40, 75, 35, 85, 60, 40, 80].map(
            (height, i) => (
              <div
                key={i}
                className={`flex-1 rounded-full transition-all duration-200 ${
                  currentStatus === 'RECOVERED'
                    ? 'bg-cyber-cyan/60'
                    : currentStatus === 'PARTIAL'
                    ? 'bg-cyber-yellow/60'
                    : 'bg-cyber-red/60'
                }`}
                style={{ height: `${height}%` }}
              />
            )
          )}
        </div>
      </div>

      {/* Decrypted Excerpt Content with Typewriter Animation */}
      <div className="p-4 bg-[#05070B] border border-cyber-border rounded text-sm text-cyber-textBright leading-relaxed mb-5 font-mono min-h-[90px] relative overflow-hidden">
        <div className="text-cyber-textMuted uppercase text-[10px] mb-2 flex items-center gap-1.5">
          <Terminal className="w-3 h-3 text-cyber-cyan" />
          <span>DECRYPTED STREAM:</span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyber-cyan animate-ping" />
        </div>
        <p className="italic text-[#E2F1FF] font-medium tracking-wide">
          "{displayedText}"
          {displayedText.length < (activeMemory?.content.length || 0) && (
            <span className="inline-block w-2 h-4 bg-cyber-cyan ml-1 animate-pulse" />
          )}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleReconstruct}
          disabled={isDecrypting || (activeMemory?.integrity || 0) >= 100}
          className={`flex-1 py-2.5 px-4 rounded border text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-2 ${
            (activeMemory?.integrity || 0) >= 100
              ? 'border-cyber-cyan/40 bg-cyber-cyan/10 text-cyber-cyan'
              : 'border-cyber-purple/60 bg-cyber-purpleDim/20 hover:bg-cyber-purpleDim/40 text-cyber-purple'
          }`}
        >
          {isDecrypting ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>RECONSTRUCTING NEURAL BLOCKS...</span>
            </>
          ) : (activeMemory?.integrity || 0) >= 100 ? (
            <span>MEMORY FULLY STABILIZED</span>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>RECONSTRUCT FRAGMENT (+25%)</span>
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
