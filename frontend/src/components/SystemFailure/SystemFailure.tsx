import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorldStore } from '../../stores/worldStore';
import { soundEngine } from '../../services/soundEngine';
import { GameSessionService } from '../../services/gameSessionService';
import { MemoryService, MemoryFragment } from '../../services/memoryService';
import {
  AlertOctagon,
  RotateCcw,
  ChevronRight,
  Database,
  LogOut,
  Sparkles,
  Terminal,
} from 'lucide-react';

interface SystemFailureProps {
  onReturnToMenu?: () => void;
}

type FailureOption = 'REBOOT' | 'RECOVER_MEMORY' | 'EXIT_SYSTEM';

export const SystemFailure: React.FC<SystemFailureProps> = ({ onReturnToMenu }) => {
  const isSystemFailure = useWorldStore((state) => state.isSystemFailure);
  const rebootSystem = useWorldStore((state) => state.rebootSystem);

  const [selectedOption, setSelectedOption] = useState<FailureOption>('REBOOT');
  const [showMemoryStats, setShowMemoryStats] = useState<boolean>(false);
  const [memories, setMemories] = useState<MemoryFragment[]>([]);
  const [isRebooting, setIsRebooting] = useState<boolean>(false);

  // Fetch memory stats on failure
  useEffect(() => {
    if (isSystemFailure) {
      soundEngine.playNullAwakeningSound();
      MemoryService.listMemories().then((res) => {
        setMemories(res);
      });
    }
  }, [isSystemFailure]);

  // Calculate memory recovery percentage
  const totalIntegrity = memories.reduce((acc, m) => acc + (m.discovered ? m.integrity : 0), 0);
  const maxPossibleIntegrity = Math.max(100, memories.length * 100);
  const recoveryPercentage = memories.length > 0
    ? Math.min(100, Math.round((totalIntegrity / maxPossibleIntegrity) * 100))
    : 34;

  if (!isSystemFailure) return null;

  const handleReboot = async () => {
    if (isRebooting) return;
    setIsRebooting(true);
    soundEngine.playBootTransition();

    // 1. Authoritative reload from backend if active session exists
    try {
      const sessionId = localStorage.getItem('null_root_session_id');
      if (sessionId) {
        const fullDetail = await GameSessionService.getSession(sessionId);
        if (fullDetail) {
          GameSessionService.applySessionToWorld(fullDetail);
        }
      }
    } catch (e) {
      console.warn('[SystemFailure] Failed to reload server state:', e);
    }

    // 2. Clear failure state & restore player
    rebootSystem();
    setIsRebooting(false);
  };

  const handleExit = () => {
    soundEngine.playKeyTick();
    rebootSystem();
    if (onReturnToMenu) {
      onReturnToMenu();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-[#050002]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 font-mono text-[#FF2A4D] select-none"
    >
      {/* Heavy CRT scanline and noise overlay */}
      <div className="crt-overlay crt-scanlines opacity-60 pointer-events-none" />
      <div className="crt-overlay crt-vignette opacity-90 pointer-events-none" />

      <motion.div
        initial={{ scale: 0.9, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-xl w-full text-center space-y-5 relative z-10 p-8 bg-[#090204]/95 border-2 border-cyber-red rounded-lg shadow-[0_0_100px_rgba(255,42,77,0.5)]"
      >
        {/* Warning Glyph */}
        <div className="w-16 h-16 mx-auto rounded-full bg-cyber-red/20 border-2 border-cyber-red flex items-center justify-center text-cyber-red animate-pulse">
          <AlertOctagon className="w-10 h-10" />
        </div>

        {/* 1. Header */}
        <div className="space-y-1.5">
          <h1 className="text-3xl sm:text-4xl font-black tracking-widest text-cyber-red glow-red-sm">
            SYSTEM FAILURE
          </h1>
          <h2 className="text-sm font-bold text-[#E2F1FF] tracking-widest">
            PLAYER PROCESS TERMINATED
          </h2>
        </div>

        {/* 2. Telemetry: Memory Recovery */}
        <div className="p-3 bg-cyber-red/10 border border-cyber-red/40 rounded flex items-center justify-between text-xs text-[#E2F1FF]">
          <span className="text-cyber-textMuted uppercase tracking-wider flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-cyber-cyan" />
            <span>MEMORY RECOVERY:</span>
          </span>
          <span className="font-bold text-cyber-cyan glow-cyan-sm">
            {recoveryPercentage}% RECOVERED
          </span>
        </div>

        {/* 3. Creepy Lore Output */}
        <div className="p-4 bg-[#050102] border border-cyber-red/30 rounded text-xs text-left font-mono space-y-1">
          <div className="text-cyber-red font-bold text-sm tracking-wider flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" />
            <span>NULL:</span>
          </div>
          <div className="text-cyber-textDim italic pl-5 animate-pulse">
            "PROCESS STILL RUNNING"
          </div>
        </div>

        {/* 4. Interactive Terminal Options */}
        {!showMemoryStats ? (
          <div className="space-y-2 pt-2 text-sm text-left font-mono">
            {/* OPTION: REBOOT */}
            <button
              onClick={handleReboot}
              onMouseEnter={() => {
                soundEngine.playKeyTick();
                setSelectedOption('REBOOT');
              }}
              className={`w-full p-3 rounded border text-left flex items-center justify-between transition-all ${
                selectedOption === 'REBOOT'
                  ? 'bg-cyber-red/25 border-cyber-red text-white shadow-[0_0_20px_rgba(255,42,77,0.4)]'
                  : 'bg-cyber-bg/60 border-cyber-border/60 text-cyber-textDim hover:border-cyber-red/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <ChevronRight
                  className={`w-4 h-4 ${
                    selectedOption === 'REBOOT' ? 'text-cyber-red animate-pulse' : 'opacity-0'
                  }`}
                />
                <span className="font-bold tracking-wider">&gt; REBOOT</span>
              </div>
              <RotateCcw className="w-4 h-4 text-cyber-textMuted" />
            </button>

            {/* OPTION: RECOVER MEMORY */}
            <button
              onClick={() => {
                soundEngine.playKeyTick();
                setShowMemoryStats(true);
              }}
              onMouseEnter={() => {
                soundEngine.playKeyTick();
                setSelectedOption('RECOVER_MEMORY');
              }}
              className={`w-full p-3 rounded border text-left flex items-center justify-between transition-all ${
                selectedOption === 'RECOVER_MEMORY'
                  ? 'bg-cyber-red/25 border-cyber-red text-white shadow-[0_0_20px_rgba(255,42,77,0.4)]'
                  : 'bg-cyber-bg/60 border-cyber-border/60 text-cyber-textDim hover:border-cyber-red/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <ChevronRight
                  className={`w-4 h-4 ${
                    selectedOption === 'RECOVER_MEMORY'
                      ? 'text-cyber-red animate-pulse'
                      : 'opacity-0'
                  }`}
                />
                <span className="font-bold tracking-wider">RECOVER MEMORY</span>
              </div>
              <Sparkles className="w-4 h-4 text-cyber-textMuted" />
            </button>

            {/* OPTION: EXIT SYSTEM */}
            <button
              onClick={handleExit}
              onMouseEnter={() => {
                soundEngine.playKeyTick();
                setSelectedOption('EXIT_SYSTEM');
              }}
              className={`w-full p-3 rounded border text-left flex items-center justify-between transition-all ${
                selectedOption === 'EXIT_SYSTEM'
                  ? 'bg-cyber-red/25 border-cyber-red text-white shadow-[0_0_20px_rgba(255,42,77,0.4)]'
                  : 'bg-cyber-bg/60 border-cyber-border/60 text-cyber-textDim hover:border-cyber-red/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <ChevronRight
                  className={`w-4 h-4 ${
                    selectedOption === 'EXIT_SYSTEM'
                      ? 'text-cyber-red animate-pulse'
                      : 'opacity-0'
                  }`}
                />
                <span className="font-bold tracking-wider">EXIT SYSTEM</span>
              </div>
              <LogOut className="w-4 h-4 text-cyber-textMuted" />
            </button>
          </div>
        ) : (
          /* RECOVERED MEMORY STATISTICS SUBVIEW */
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 pt-2 text-left text-xs font-mono"
            >
              <div className="p-3 bg-[#050102] border border-cyber-cyan/40 rounded space-y-2 max-h-40 overflow-y-auto">
                <div className="text-cyber-cyan font-bold flex items-center justify-between">
                  <span>CORTEX ARCHIVE STATUS</span>
                  <span>{recoveryPercentage}% RECOVERED</span>
                </div>
                {memories.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between text-[11px] py-0.5 border-b border-cyber-border/30"
                  >
                    <span className="text-[#E2F1FF]">{m.title}</span>
                    <span
                      className={
                        m.discovered ? 'text-cyber-cyan font-bold' : 'text-cyber-textMuted'
                      }
                    >
                      {m.discovered ? `${m.integrity}%` : 'ENCRYPTED'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleReboot}
                  className="flex-1 py-2.5 bg-cyber-red/25 hover:bg-cyber-red/40 border border-cyber-red rounded text-white font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>PROCEED TO REBOOT</span>
                </button>
                <button
                  onClick={() => setShowMemoryStats(false)}
                  className="py-2.5 px-4 bg-cyber-surface border border-cyber-border rounded text-cyber-textMuted hover:text-white text-xs font-bold transition-all"
                >
                  BACK
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SystemFailure;
