import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { ServerRoom } from '../../game/World/ServerRoom';
import { FirstPersonPlayer } from '../../game/Player/FirstPersonPlayer';
import { InteractionRaycaster } from '../../game/Player/InteractionRaycaster';
import { InteractionModalContainer } from '../../components/InteractionModals/InteractionModalContainer';
import { useInteractionState } from '../../stores/interactionStore';
import { useWorldStore } from '../../stores/worldStore';
import { soundEngine } from '../../services/soundEngine';
import { 
  ArrowLeft, 
  Cpu, 
  Compass, 
  MousePointer, 
  Radio,
  Sparkles,
  Target,
  CheckCircle2,
  Activity,
  AlertTriangle
} from 'lucide-react';

// Reusable Corruption Effects
import { GlitchOverlay } from '../../game/Effects/GlitchOverlay';
import { ScanlineOverlay } from '../../game/Effects/ScanlineOverlay';
import { ScreenDistortion } from '../../game/Effects/ScreenDistortion';
import { CorruptedText } from '../../game/Effects/CorruptedText';
import { WarningOverlay } from '../../game/Effects/WarningOverlay';

export interface GameProps {
  onReturnToMenu?: () => void;
}

export const Game: React.FC<GameProps> = ({ onReturnToMenu }) => {
  const [isLocked, setIsLocked] = useState<boolean>(false);

  const { targeted, activeModal } = useInteractionState();

  // Centralized Zustand World State
  const playerPosition = useWorldStore((state) => state.playerPosition);
  const currentObjective = useWorldStore((state) => state.currentObjective);
  const isDoorUnlocked = !useWorldStore((state) => state.door_01.locked);
  const notifications = useWorldStore((state) => state.notifications);
  const dismissNotification = useWorldStore((state) => state.dismissNotification);

  // Global Corruption State
  const corruptionLevel = useWorldStore((state) => state.corruptionLevel);
  const isBlackout = useWorldStore((state) => state.isBlackout);
  const nullEventStage = useWorldStore((state) => state.nullEventStage);

  const isInCorridor = playerPosition.z < -2.0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(8px)' }}
      transition={{ duration: 0.5 }}
      className="relative w-screen h-screen bg-[#030509] text-[#E2F1FF] font-mono select-none overflow-hidden"
    >
      {/* 3D R3F Canvas Viewport */}
      <div className="absolute inset-0 z-0">
        <Canvas
          shadows
          camera={{ fov: 75, near: 0.1, far: 100, position: [0, 1.65, 7.5] }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
        >
          <ServerRoom />
          <InteractionRaycaster />
          <FirstPersonPlayer
            isLocked={isLocked && !activeModal && !isBlackout}
            setIsLocked={setIsLocked}
          />
        </Canvas>
      </div>

      {/* REUSABLE VISUAL CORRUPTION EFFECTS */}
      <ScanlineOverlay corruptionLevel={corruptionLevel} />
      <GlitchOverlay corruptionLevel={corruptionLevel} />
      <ScreenDistortion corruptionLevel={corruptionLevel} isBlackout={isBlackout} />
      <WarningOverlay stage={nullEventStage} corruptionLevel={corruptionLevel} />

      {/* CENTER CROSSHAIR & INTERACTION PROMPT */}
      <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
        <div className="relative flex flex-col items-center justify-center">
          {/* Tactical Center Crosshair with target-lock state */}
          <div
            className={`w-2 h-2 rounded-full transition-all duration-150 ${
              targeted
                ? 'scale-150 bg-cyber-cyan shadow-[0_0_12px_#00F0FF]'
                : 'bg-cyber-cyan/80 shadow-[0_0_6px_#00F0FF]'
            }`}
          />
          <div className="absolute top-[-10px] w-0.5 h-2 bg-cyber-cyan/60" />
          <div className="absolute bottom-[-10px] w-0.5 h-2 bg-cyber-cyan/60" />
          <div className="absolute left-[-10px] h-0.5 w-2 bg-cyber-cyan/60" />
          <div className="absolute right-[-10px] h-0.5 w-2 bg-cyber-cyan/60" />

          {/* DYNAMIC HUD INTERACTION PROMPT (When looking at an interactable) */}
          <AnimatePresence>
            {targeted && !activeModal && !isBlackout && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className="absolute top-8 px-4 py-2 bg-[#080C14]/95 border border-cyber-cyan/70 rounded shadow-[0_0_25px_rgba(0,240,255,0.3)] flex items-center gap-2.5 whitespace-nowrap pointer-events-none"
              >
                <div className="px-1.5 py-0.5 bg-cyber-cyan/20 border border-cyber-cyan rounded text-xs font-bold text-cyber-cyan animate-pulse">
                  E
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold tracking-wider text-cyber-cyan">
                    [E] INTERACT
                  </span>
                  <span className="text-[10px] text-cyber-textDim font-mono">
                    <CorruptedText text={targeted.displayName} corruptionLevel={corruptionLevel} />
                  </span>
                </div>
                <Sparkles className="w-3.5 h-3.5 text-cyber-cyan animate-spin" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* TOP HUD HEADER */}
      <header className="relative z-20 w-full px-6 py-3 border-b border-cyber-border/80 bg-[#05070B]/80 backdrop-blur-sm flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          {onReturnToMenu && (
            <button
              onClick={() => {
                soundEngine.playKeyTick();
                onReturnToMenu();
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-cyber-surfaceAlt hover:bg-cyber-purple/20 border border-cyber-border hover:border-cyber-purple/60 rounded text-cyber-purple transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>MAIN MENU (ESC)</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                corruptionLevel > 50 ? 'bg-cyber-red animate-ping' : 'bg-cyber-cyan animate-ping'
              }`}
            />
            <span
              className={`font-bold tracking-wider ${
                corruptionLevel > 50
                  ? 'text-cyber-red glow-red-sm'
                  : 'text-cyber-cyan glow-cyan-sm'
              }`}
            >
              <CorruptedText text="UNDEFINED // RUNTIME" corruptionLevel={corruptionLevel} />
            </span>
          </div>
        </div>

        {/* Real-time Telemetry & Corruption Gauge */}
        <div className="flex items-center gap-6 text-[11px]">
          {/* CORRUPTION METER */}
          <div className="flex items-center gap-2 px-3 py-1 bg-cyber-surfaceAlt border border-cyber-border rounded">
            <Activity
              className={`w-3.5 h-3.5 ${
                corruptionLevel > 50 ? 'text-cyber-red animate-pulse' : 'text-cyber-yellow'
              }`}
            />
            <span className="text-cyber-textMuted">CORRUPTION:</span>
            <span
              className={`font-bold font-mono ${
                corruptionLevel > 50 ? 'text-cyber-red glow-red-sm' : 'text-cyber-yellow'
              }`}
            >
              {corruptionLevel}%
            </span>
            {corruptionLevel > 50 && (
              <AlertTriangle className="w-3 h-3 text-cyber-red inline animate-bounce" />
            )}
          </div>

          <span className="hidden sm:flex items-center gap-1 text-cyber-textDim">
            <Compass className="w-3.5 h-3.5 text-cyber-cyan" />
            <span>POS: [X: {playerPosition.x.toFixed(1)} | Z: {playerPosition.z.toFixed(1)}]</span>
          </span>

          <span className="text-cyber-cyan flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 inline" />
            <span>ZONE: {isInCorridor ? 'CORRIDOR_01' : 'SERVER_CORE_00'}</span>
          </span>
        </div>
      </header>

      {/* TACTICAL OBJECTIVE TRACKER (Top-Left under Header) */}
      <div className="absolute top-16 left-6 z-20 pointer-events-none">
        <motion.div
          key={currentObjective}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-3 bg-[#080C14]/90 border border-cyber-cyan/40 rounded shadow-[0_0_20px_rgba(0,240,255,0.15)] font-mono max-w-xs"
        >
          <div className="text-[10px] text-cyber-textMuted uppercase flex items-center gap-1.5 mb-1">
            <Target className="w-3 h-3 text-cyber-cyan" />
            <span>DIRECTIVE // OBJECTIVE</span>
          </div>
          <div className="text-xs font-bold text-cyber-cyan glow-cyan-sm flex items-center gap-2">
            {isDoorUnlocked ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-cyber-cyan inline shrink-0" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-cyber-yellow inline-block animate-pulse shrink-0" />
            )}
            <span>
              <CorruptedText text={currentObjective} corruptionLevel={corruptionLevel} />
            </span>
          </div>
        </motion.div>
      </div>

      {/* WORLD REAL-TIME NOTIFICATIONS (Top-Right) */}
      <div className="absolute top-16 right-6 z-30 space-y-2 pointer-events-none max-w-sm">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-3 bg-[#080C14]/95 border border-cyber-cyan/60 rounded shadow-[0_0_20px_rgba(0,240,255,0.25)] font-mono pointer-events-auto flex items-start justify-between gap-3"
            >
              <div>
                <div className="text-xs font-bold text-cyber-cyan tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan animate-ping" />
                  {notif.title}
                </div>
                <div className="text-[11px] text-cyber-textDim mt-0.5 leading-relaxed">
                  {notif.message}
                </div>
              </div>
              <button
                onClick={() => dismissNotification(notif.id)}
                className="text-cyber-textMuted hover:text-white p-0.5"
                aria-label="Dismiss notification"
              >
                &times;
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* BOTTOM CONTROLS / STATUS BAR */}
      <footer className="absolute bottom-0 left-0 right-0 z-20 px-6 py-2.5 border-t border-cyber-border bg-[#05070B]/85 backdrop-blur-sm text-[11px] text-cyber-textMuted flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-cyber-cyan">W A S D</span>
          <span>MOVE</span>
          <span>&bull;</span>
          <span className="text-cyber-cyan">MOUSE</span>
          <span>LOOK</span>
          <span>&bull;</span>
          <span className="text-cyber-cyan">E</span>
          <span>INTERACT</span>
          <span>&bull;</span>
          <span className="text-cyber-cyan">SHIFT</span>
          <span>SPRINT</span>
        </div>

        <div className="flex items-center gap-2 text-cyber-textDim">
          <Radio className="w-3 h-3 text-cyber-cyan animate-pulse" />
          <span>DOOR: {isDoorUnlocked ? 'UNLOCKED (ROOT)' : 'LOCKED (USER)'}</span>
        </div>
      </footer>

      {/* CLICK TO ENGAGE POINTER LOCK PROMPT */}
      <AnimatePresence>
        {!isLocked && !activeModal && !isBlackout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-[#05070B]/60 backdrop-blur-[2px] flex items-center justify-center cursor-pointer"
            onClick={() => soundEngine.playKeyTick()}
          >
            <div className="p-6 bg-cyber-surface/95 border border-cyber-cyan/50 rounded-lg max-w-md text-center shadow-[0_0_40px_rgba(0,240,255,0.2)]">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-cyber-cyan/10 border border-cyber-cyan/50 flex items-center justify-center text-cyber-cyan animate-pulse">
                <MousePointer className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold tracking-widest text-cyber-cyan glow-cyan-sm mb-1.5">
                ENGAGE OPERATOR LINK
              </h3>
              <p className="text-xs text-cyber-textDim mb-4">
                Click anywhere to control camera & walk through the server room. Aim at objects and press <span className="text-cyber-cyan font-bold">[E]</span> to interact.
              </p>
              <div className="inline-block px-3 py-1 bg-cyber-surfaceAlt border border-cyber-border rounded text-[11px] text-cyber-textMuted">
                PRESS <span className="text-cyber-cyan">ESC</span> AT ANY TIME TO RELEASE MOUSE
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INTERACTIVE MODAL DIALOGS */}
      <InteractionModalContainer />
    </motion.div>
  );
};

export default Game;
