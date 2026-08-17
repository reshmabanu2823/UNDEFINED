import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BootScreenProps } from './types';
import { useBootSequence } from './useBootSequence';
import { Volume2, VolumeX, AlertTriangle, Terminal, Cpu, ShieldAlert, Activity } from 'lucide-react';

export const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
  const {
    stage,
    completedLines,
    currentTypingText,
    isGlitching,
    telemetryTicks,
    proceed,
    soundMuted,
    toggleSound,
    isReady,
    isTransitioning,
  } = useBootSequence(onComplete);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: 1.03,
        filter: 'brightness(2) contrast(1.4) blur(4px)',
        transition: { duration: 0.65, ease: 'easeInOut' },
      }}
      className={`relative w-screen h-screen bg-[#05070B] text-[#E2F1FF] font-mono select-none overflow-hidden flex flex-col justify-between cursor-pointer ${
        isGlitching ? 'animate-glitch' : ''
      }`}
      onClick={proceed}
      tabIndex={0}
      role="button"
      aria-label="Boot screen terminal - press any key to continue"
    >
      {/* CRT Visual Layers */}
      <div className="crt-overlay crt-scanlines" />
      <div className="crt-overlay crt-vignette" />
      <div className="crt-overlay crt-noise" />

      {/* Screen edge glow reflection */}
      <div className="absolute inset-0 border border-cyber-cyan/15 pointer-events-none shadow-[inset_0_0_80px_rgba(0,240,255,0.03)]" />

      {/* TOP HEADER: SYSTEM & TELEMETRY */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between border-b border-cyber-border bg-[#05070B]/80 backdrop-blur-sm text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-cyber-cyan animate-pulse shadow-[0_0_6px_#00F0FF]" />
            <span className="font-bold tracking-widest text-cyber-cyan glow-cyan-sm">
              UNDEFINED // OS
            </span>
          </div>
          <span className="text-cyber-textMuted hidden sm:inline">|</span>
          <span className="text-cyber-textDim hidden sm:inline flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-cyber-cyanDim inline" />
            KERNEL: 0x88F-NULL
          </span>
        </div>

        {/* Telemetry Stats */}
        <div className="flex items-center gap-5">
          <div className="hidden md:flex items-center gap-3 text-[11px] text-cyber-textMuted">
            <span>MEM: 0x{(4096 + telemetryTicks * 3).toString(16).toUpperCase()}</span>
            <span>CYC: {telemetryTicks.toString().padStart(4, '0')}</span>
            <span className="text-cyber-purple/80 flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyber-purple" />
              STATUS: {stage === 'TRANSITIONING' ? 'HANDSHAKE' : stage === 'READY_TO_CONTINUE' ? 'OVERRIDE' : 'BOOTING'}
            </span>
          </div>

          {/* Sound Toggle Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleSound();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded border border-cyber-border hover:border-cyber-cyan/50 hover:bg-cyber-cyan/10 transition-colors text-cyber-textDim text-[11px]"
            title="Toggle Sound Synthesizer"
          >
            {soundMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-cyber-red" />
                <span className="text-cyber-textMuted">MUTE</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-cyber-cyan" />
                <span className="text-cyber-cyan">AUDIO ON</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* CENTER TERMINAL DISPLAY */}
      <main className="relative z-10 flex-1 flex flex-col justify-center max-w-4xl w-full mx-auto px-6 sm:px-12 py-6">
        {/* Terminal Header Banner */}
        <div className="mb-6 flex items-baseline gap-3 border-b border-cyber-border/80 pb-3">
          <Terminal className="w-5 h-5 text-cyber-cyan" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-widest text-cyber-cyan glow-cyan-sm">
            NULL//ROOT
          </h1>
          <span className="text-xs text-cyber-purple tracking-widest uppercase font-mono px-2 py-0.5 border border-cyber-purple/40 rounded bg-cyber-purpleDim/20">
            SEC-LEVEL: UNRESTRICTED
          </span>
        </div>

        {/* Diagnostic Lines Container */}
        <div className="space-y-3.5 text-sm sm:text-base leading-relaxed tracking-wide min-h-[220px]">
          {/* Completed Diagnostic Items */}
          {completedLines.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between max-w-xl font-mono"
            >
              <div className="flex items-center gap-1">
                <span className="text-cyber-cyanDim select-none">&gt;</span>
                <span className="text-[#E2F1FF] font-medium">{item.label}</span>
                <span className="text-cyber-textMuted select-none tracking-widest">
                  {item.dots}
                </span>
              </div>

              <div className="font-bold flex items-center gap-1.5 pl-2">
                {item.status === 'WARNING' && (
                  <AlertTriangle className="w-3.5 h-3.5 text-cyber-red inline" />
                )}
                {item.status === 'ERROR' && (
                  <ShieldAlert className="w-3.5 h-3.5 text-cyber-red inline" />
                )}
                <span
                  className={
                    item.highlightRed
                      ? 'text-cyber-red glow-red-sm'
                      : 'text-cyber-cyan glow-cyan-sm'
                  }
                >
                  {item.statusText}
                </span>
              </div>
            </div>
          ))}

          {/* Currently Typing Line */}
          {currentTypingText && (
            <div className="flex items-center max-w-xl font-mono text-cyber-cyan">
              <span className="text-cyber-cyanDim mr-1">&gt;</span>
              <span>{currentTypingText}</span>
              <span className="inline-block w-2.5 h-4 bg-cyber-cyan ml-1 animate-flicker" />
            </div>
          )}

          {/* Idle Cursor before checks begin */}
          {stage === 'POWER_ON' && (
            <div className="flex items-center text-cyber-textMuted">
              <span className="mr-2">&gt;</span>
              <span className="inline-block w-2.5 h-4 bg-cyber-cyan animate-flicker" />
            </div>
          )}

          {/* ANOMALY REVEAL: NULL PROCESS FOUND */}
          <AnimatePresence>
            {(stage === 'ANOMALY_REVEAL' || stage === 'READY_TO_CONTINUE' || stage === 'TRANSITIONING') && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="mt-8 pt-4 border-t border-cyber-red/30"
              >
                <div
                  className="relative inline-flex items-center gap-3 px-4 py-2.5 bg-cyber-redDim/20 border border-cyber-red/60 rounded glow-red-sm glitch-layer"
                  data-text="NULL PROCESS FOUND"
                >
                  <ShieldAlert className="w-5 h-5 text-cyber-red shrink-0 animate-pulse" />
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                    <span className="font-bold tracking-widest text-cyber-red text-base sm:text-lg">
                      NULL PROCESS FOUND
                    </span>
                    <span className="text-[11px] text-cyber-red/80 font-mono">
                      PID: 0x00000000_CORE
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* INTERACTIVE PROMPT: PRESS ANY KEY */}
        <div className="mt-12 h-16 flex items-center">
          <AnimatePresence>
            {(isReady || isTransitioning) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full max-w-xl p-3.5 bg-cyber-surface/90 border border-cyber-cyan/30 rounded glow-cyan-box"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-cyber-cyan rounded-full animate-ping" />
                  <p className="text-sm font-semibold tracking-wider text-[#E2F1FF] flex items-center gap-2">
                    <span>PRESS ANY KEY TO CONTINUE</span>
                    <span className="inline-block w-2 h-4 bg-cyber-cyan animate-flicker" />
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-cyber-textDim">
                  <kbd className="px-2 py-0.5 bg-cyber-surfaceAlt border border-cyber-border rounded text-cyber-cyan">
                    ENTER
                  </kbd>
                  <kbd className="px-2 py-0.5 bg-cyber-surfaceAlt border border-cyber-border rounded text-cyber-cyan">
                    SPACE
                  </kbd>
                  <span className="text-cyber-textMuted">OR CLICK</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* BOTTOM FOOTER: HARDWARE CHECKS & CORRUPTION SIGNATURE */}
      <footer className="relative z-10 w-full px-6 py-3 border-t border-cyber-border bg-[#05070B]/90 text-[11px] text-cyber-textMuted flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <span className="text-cyber-textDim">ADDR: 0x7FFF08A1BEEF</span>
          <span className="hidden sm:inline">|</span>
          <span className="text-cyber-purple/90">PROTOCOL: ANOMALY_BYPASS_V2</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-cyber-textDim">HASH: SHA256//d9a8f2</span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyber-cyan/60" />
          <span>UNDEFINED // ROOT INITIALIZED</span>
        </div>
      </footer>
    </motion.div>
  );
};

export default BootScreen;
