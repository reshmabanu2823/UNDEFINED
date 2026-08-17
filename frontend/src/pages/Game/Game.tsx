import React, { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { ServerRoom } from '../../game/World/ServerRoom';
import { FirstPersonPlayer } from '../../game/Player/FirstPersonPlayer';
import { soundEngine } from '../../services/soundEngine';
import { 
  ArrowLeft, 
  Terminal, 
  Cpu, 
  Compass, 
  MousePointer, 
  Lock,
  Radio
} from 'lucide-react';

export interface GameProps {
  onReturnToMenu?: () => void;
}

export const Game: React.FC<GameProps> = ({ onReturnToMenu }) => {
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [playerPosition, setPlayerPosition] = useState<{ x: number; y: number; z: number }>({
    x: 0,
    y: 1.65,
    z: 7.5,
  });

  const handlePositionChange = useCallback((pos: { x: number; y: number; z: number }) => {
    setPlayerPosition(pos);
  }, []);

  // Determine contextual zone and proximity notifications
  const isInCorridor = playerPosition.z < -2.0;
  const isNearSecurityDoor = playerPosition.z < -8.5;
  const isNearTerminal = Math.abs(playerPosition.z - 0.5) < 1.8 && Math.abs(playerPosition.x) < 3.5;

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
          <FirstPersonPlayer
            isLocked={isLocked}
            setIsLocked={setIsLocked}
            onPositionChange={handlePositionChange}
          />
        </Canvas>
      </div>

      {/* CRT Visual Layers */}
      <div className="crt-overlay crt-scanlines opacity-40 pointer-events-none" />
      <div className="crt-overlay crt-vignette opacity-70 pointer-events-none" />
      <div className="crt-overlay crt-noise opacity-30 pointer-events-none" />

      {/* CENTER CROSSHAIR */}
      <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
        <div className="relative w-7 h-7 flex items-center justify-center">
          {/* Cyan Tactical Crosshair */}
          <div className="w-1.5 h-1.5 rounded-full bg-cyber-cyan/90 shadow-[0_0_6px_#00F0FF]" />
          <div className="absolute top-0 w-0.5 h-1.5 bg-cyber-cyan/60" />
          <div className="absolute bottom-0 w-0.5 h-1.5 bg-cyber-cyan/60" />
          <div className="absolute left-0 h-0.5 w-1.5 bg-cyber-cyan/60" />
          <div className="absolute right-0 h-0.5 w-1.5 bg-cyber-cyan/60" />
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
            <span className="w-2 h-2 rounded-full bg-cyber-cyan animate-ping" />
            <span className="font-bold text-cyber-cyan glow-cyan-sm tracking-wider">
              UNDEFINED // RUNTIME ACTIVE
            </span>
          </div>
        </div>

        {/* Real-time Sector & Diagnostics */}
        <div className="flex items-center gap-5 text-cyber-textDim text-[11px]">
          <span className="hidden sm:flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-cyber-cyan" />
            <span>POS: [X: {playerPosition.x.toFixed(1)} | Z: {playerPosition.z.toFixed(1)}]</span>
          </span>

          <span className="text-cyber-cyan flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 inline" />
            <span>ZONE: {isInCorridor ? 'CORRIDOR_01' : 'SERVER_CORE_00'}</span>
          </span>
        </div>
      </header>

      {/* PROXIMITY INTERACTIVE ALERTS (Bottom-Center) */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <AnimatePresence>
          {isNearSecurityDoor && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="px-4 py-2 bg-[#080C14]/90 border border-cyber-red/70 rounded shadow-[0_0_20px_rgba(255,42,77,0.3)] flex items-center gap-2.5 text-xs text-cyber-red font-bold"
            >
              <Lock className="w-4 h-4 text-cyber-red animate-pulse" />
              <span>SECURITY BLAST DOOR LOCKED // ACCESS CLEARANCE REQUIRED</span>
            </motion.div>
          )}

          {isNearTerminal && !isNearSecurityDoor && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="px-4 py-2 bg-[#080C14]/90 border border-cyber-cyan/70 rounded shadow-[0_0_20px_rgba(0,240,255,0.25)] flex items-center gap-2.5 text-xs text-cyber-cyan font-bold"
            >
              <Terminal className="w-4 h-4 text-cyber-cyan" />
              <span>TERMINAL NODE ACCESSIBLE // DATA STREAM SYNCHRONIZED</span>
            </motion.div>
          )}
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
          <span className="text-cyber-cyan">SHIFT</span>
          <span>SPRINT</span>
        </div>

        <div className="flex items-center gap-2 text-cyber-textDim">
          <Radio className="w-3 h-3 text-cyber-cyan animate-pulse" />
          <span>NEURAL SYNC: 100%</span>
        </div>
      </footer>

      {/* CLICK TO ENGAGE POINTER LOCK PROMPT */}
      <AnimatePresence>
        {!isLocked && (
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
                Click anywhere on screen to capture mouse controls and explore the server room.
              </p>
              <div className="inline-block px-3 py-1 bg-cyber-surfaceAlt border border-cyber-border rounded text-[11px] text-cyber-textMuted">
                PRESS <span className="text-cyber-cyan">ESC</span> AT ANY TIME TO RELEASE MOUSE
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Game;
