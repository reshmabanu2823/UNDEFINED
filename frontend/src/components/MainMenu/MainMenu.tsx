import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundEngine } from '../../services/soundEngine';
import { MenuItem } from './MenuItem';
import { BackgroundGridParticles } from './BackgroundGridParticles';
import { ShutdownSequence } from './ShutdownSequence';
import { SystemNoticeToast } from './SystemNoticeToast';
import { 
  Terminal, 
  Cpu, 
  Activity, 
  ShieldAlert, 
  Radio, 
  RotateCcw,
  Binary
} from 'lucide-react';

import { SaveLoadModal } from '../SaveLoadModal/SaveLoadModal';
import { GameSessionService } from '../../services/gameSessionService';

export interface MainMenuProps {
  onStartNewGame?: () => void;
  onReboot?: () => void;
}

interface MenuOption {
  id: string;
  label: string;
  subtext?: string;
  available: boolean;
}

const MENU_OPTIONS: MenuOption[] = [
  {
    id: 'continue',
    label: 'CONTINUE',
    subtext: 'RESTORE LAST SYNC POINT',
    available: true,
  },
  {
    id: 'new_game',
    label: 'NEW GAME',
    subtext: 'INITIALIZE FRESH NEURAL THREAD',
    available: true,
  },
  {
    id: 'load_game',
    label: 'LOAD GAME',
    subtext: 'QUERY MEMORY CORE ARCHIVE',
    available: true,
  },
  {
    id: 'settings',
    label: 'SETTINGS',
    subtext: 'CONFIGURE PROTOCOL & AUDIO MATRIX',
    available: false,
  },
  {
    id: 'exit',
    label: 'EXIT SYSTEM',
    subtext: 'TERMINATE ROOT PROCESS',
    available: true,
  },
];

export const MainMenu: React.FC<MainMenuProps> = ({ onStartNewGame, onReboot }) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [isShuttingDown, setIsShuttingDown] = useState<boolean>(false);
  const [telemetryCount, setTelemetryCount] = useState<number>(1024);
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
  const [saveModalMode, setSaveModalMode] = useState<'SAVE' | 'LOAD' | 'MANAGE'>('LOAD');

  // Diagnostic hex telemetry ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetryCount((prev) => (prev + 1) % 9999);
    }, 150);
    return () => clearInterval(timer);
  }, []);

  const handleAction = useCallback(async (option: MenuOption) => {
    if (option.id === 'continue') {
      soundEngine.playKeyTick();
      const sessions = await GameSessionService.listSessions();
      if (sessions.length > 0) {
        soundEngine.playBootTransition();
        await GameSessionService.loadSession(sessions[0].id, 1);
        onStartNewGame?.();
      } else {
        setSaveModalMode('CONTINUE' as any);
        setSaveModalOpen(true);
      }
    } else if (option.id === 'new_game') {
      soundEngine.playBootTransition();
      try {
        await GameSessionService.createSession('INITIAL_RUN');
      } catch (e) {
        console.warn('Session startup notice:', e);
      }
      if (onStartNewGame) {
        onStartNewGame();
      }
    } else if (option.id === 'load_game') {
      soundEngine.playKeyTick();
      setSaveModalMode('LOAD');
      setSaveModalOpen(true);
    } else if (option.id === 'exit') {
      soundEngine.playGlitch();
      setIsShuttingDown(true);
    } else {
      soundEngine.playWarning();
      setNoticeMessage(`FUNCTION UNAVAILABLE // [${option.label}] PROTOCOL LOCKED`);
    }
  }, [onStartNewGame]);

  // Keyboard navigation (ArrowUp, ArrowDown, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isShuttingDown) {
        if (e.key === 'Escape') {
          setIsShuttingDown(false);
        }
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        soundEngine.playKeyTick();
        setSelectedIndex((prev) => (prev + 1) % MENU_OPTIONS.length);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        soundEngine.playKeyTick();
        setSelectedIndex((prev) => (prev - 1 + MENU_OPTIONS.length) % MENU_OPTIONS.length);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const currentOption = MENU_OPTIONS[selectedIndex];
        handleAction(currentOption);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, isShuttingDown, handleAction]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
      transition={{ duration: 0.45 }}
      className="relative w-screen h-screen bg-[#05070B] text-[#E2F1FF] font-mono select-none overflow-hidden flex flex-col justify-between"
    >
      {/* Background Animated Grid and Subtle Floating Cyber Particles */}
      <BackgroundGridParticles />

      {/* CRT Visual Layers */}
      <div className="crt-overlay crt-scanlines" />
      <div className="crt-overlay crt-vignette" />
      <div className="crt-overlay crt-noise" />

      {/* Outer ambient boundary glow */}
      <div className="absolute inset-0 border border-cyber-cyan/15 pointer-events-none shadow-[inset_0_0_90px_rgba(0,240,255,0.02)]" />

      {/* TOP SYSTEM DIAGNOSTICS BAR */}
      <header className="relative z-10 w-full px-6 py-3.5 flex items-center justify-between border-b border-cyber-border/80 bg-[#05070B]/85 backdrop-blur-sm text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-cyber-cyan animate-pulse shadow-[0_0_8px_#00F0FF]" />
            <span className="font-bold tracking-widest text-cyber-cyan glow-cyan-sm">
              UNDEFINED // OS
            </span>
          </div>
          <span className="text-cyber-textMuted hidden sm:inline">|</span>
          <span className="text-cyber-textDim hidden sm:inline flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyber-cyanDim inline" />
            KERNEL: 0x419_NULL
          </span>
          <span className="text-cyber-textMuted hidden md:inline">|</span>
          <span className="text-cyber-purple hidden md:inline flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 inline" />
            CORRUPTION: 74.2% DETECTED
          </span>
        </div>

        {/* Top Right System Actions */}
        <div className="flex items-center gap-4 text-[11px]">
          <span className="hidden lg:inline text-cyber-textMuted flex items-center gap-1">
            <Radio className="w-3 h-3 text-cyber-cyan" />
            QUANTUM SYNC: ACTIVE
          </span>

          {onReboot && (
            <button
              onClick={() => {
                soundEngine.playBootTransition();
                onReboot();
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-cyber-surfaceAlt/60 hover:bg-cyber-purple/20 border border-cyber-border hover:border-cyber-purple/60 rounded text-cyber-purple text-xs transition-all"
              title="Return to Boot Screen"
            >
              <RotateCcw className="w-3 h-3" />
              <span>REBOOT</span>
            </button>
          )}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl w-full mx-auto px-6 sm:px-12 py-8 items-center">
        {/* Left-of-Center: Title & Command Menu */}
        <div className="lg:col-span-7 lg:pl-4 space-y-8">
          {/* Large but Elegant Title */}
          <div>
            <div className="flex items-center gap-2 text-xs text-cyber-cyanDim tracking-widest uppercase mb-1.5 font-mono">
              <Terminal className="w-3.5 h-3.5 text-cyber-cyan" />
              <span>SYSTEM COMMAND SHELL // v4.19</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-black tracking-widest text-[#E2F1FF] drop-shadow-[0_0_20px_rgba(0,240,255,0.25)] flex items-center gap-3">
              <span className="text-cyber-cyan glow-cyan-sm">NULL</span>
              <span className="text-cyber-textMuted font-light">//</span>
              <span className="text-[#E2F1FF]">ROOT</span>
            </h1>

            <p className="text-xs sm:text-sm text-cyber-textDim mt-2 font-mono tracking-wide max-w-md">
              Awaiting operator command instruction. Select execution protocol below.
            </p>
          </div>

          {/* Reusable Menu List */}
          <nav className="space-y-2 max-w-md" aria-label="Main system menu">
            {MENU_OPTIONS.map((option, index) => {
              const isSelected = selectedIndex === index;

              return (
                <MenuItem
                  key={option.id}
                  id={option.id}
                  label={option.label}
                  subtext={option.subtext}
                  isSelected={isSelected}
                  onSelect={() => {
                    setSelectedIndex(index);
                    handleAction(option);
                  }}
                  onHover={() => {
                    if (selectedIndex !== index) {
                      soundEngine.playKeyTick();
                      setSelectedIndex(index);
                    }
                  }}
                />
              );
            })}
          </nav>

          {/* Navigation Controls Hint */}
          <div className="pt-2 flex items-center gap-3 text-[11px] text-cyber-textMuted border-t border-cyber-border/40 max-w-md">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-cyber-surfaceAlt border border-cyber-border rounded text-cyber-cyan">
                &uarr;
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-cyber-surfaceAlt border border-cyber-border rounded text-cyber-cyan">
                &darr;
              </kbd>
              <span>NAVIGATE</span>
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-cyber-surfaceAlt border border-cyber-border rounded text-cyber-cyan">
                ENTER
              </kbd>
              <span>EXECUTE</span>
            </span>
          </div>
        </div>

        {/* Right Side: OS Diagnostic Telemetry Sidebar */}
        <div className="hidden lg:block lg:col-span-5 space-y-4">
          {/* Active Command Telemetry Card */}
          <div className="bg-cyber-surface/70 border border-cyber-border rounded-lg p-5 backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-cyber-border mb-3.5">
              <span className="text-xs font-bold text-cyber-cyan flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyber-cyan" />
                COMMAND TELEMETRY
              </span>
              <span className="text-[10px] text-cyber-textMuted">0x{telemetryCount.toString(16).toUpperCase()}</span>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-2.5 bg-cyber-bg/80 rounded border border-cyber-border/60">
                <div className="text-[10px] text-cyber-textMuted uppercase mb-1">TARGET PROCESS</div>
                <div className="text-cyber-cyan font-bold glow-cyan-sm">
                  {MENU_OPTIONS[selectedIndex]?.label}
                </div>
                <div className="text-[11px] text-cyber-textDim mt-0.5">
                  {MENU_OPTIONS[selectedIndex]?.subtext}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-cyber-bg/50 rounded border border-cyber-border/60">
                  <div className="text-cyber-textMuted text-[10px]">AUTH LEVEL</div>
                  <div className="text-[#E2F1FF] font-semibold">ROOT_0</div>
                </div>
                <div className="p-2.5 bg-cyber-bg/50 rounded border border-cyber-border/60">
                  <div className="text-cyber-textMuted text-[10px]">INTEGRITY</div>
                  <div className="text-cyber-yellow font-semibold">PARTIAL</div>
                </div>
              </div>

              {/* Memory Hex Matrix Snippet */}
              <div className="p-2.5 bg-cyber-bg/80 rounded border border-cyber-border/60 font-mono text-[10px] text-cyber-textMuted space-y-0.5">
                <div className="text-cyber-cyanDim flex items-center gap-1">
                  <Binary className="w-3 h-3 text-cyber-cyanDim inline" />
                  <span>MEMORY MAP DUMP</span>
                </div>
                <div>0x0000: 4E 55 4C 4C 2F 2F 52 4F</div>
                <div>0x0008: 4F 54 20 53 59 53 54 45</div>
                <div className="text-cyber-red">0x0010: [CORRUPTION DETECTED]</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* BOTTOM STATUS FOOTER */}
      <footer className="relative z-10 w-full px-6 py-2.5 border-t border-cyber-border bg-[#05070B]/90 text-[11px] text-cyber-textMuted flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-cyber-textDim">TERMINAL: TTY_01</span>
          <span className="hidden sm:inline">&bull;</span>
          <span className="hidden sm:inline text-cyber-purple">SECTOR 00_CORE</span>
        </div>
        <div className="text-cyber-textDim">UNDEFINED // OS v4.19</div>
      </footer>

      {/* UNAVAILABLE NOTICE TOAST */}
      <SystemNoticeToast
        message={noticeMessage}
        onDismiss={() => setNoticeMessage(null)}
      />

      {/* SHUTDOWN SEQUENCE MODAL */}
      <AnimatePresence>
        {isShuttingDown && (
          <ShutdownSequence
            onCancel={() => setIsShuttingDown(false)}
            onRestartBoot={() => {
              setIsShuttingDown(false);
              if (onReboot) onReboot();
            }}
          />
        )}
      </AnimatePresence>

      {/* SAVE / LOAD / MANAGE SESSIONS MODAL */}
      <SaveLoadModal
        isOpen={saveModalOpen}
        mode={saveModalMode}
        onClose={() => setSaveModalOpen(false)}
        onSessionLoaded={() => {
          setSaveModalOpen(false);
          onStartNewGame?.();
        }}
      />
    </motion.div>
  );
};

export default MainMenu;
