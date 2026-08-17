import React from 'react';
import { motion } from 'framer-motion';
import { HUD } from '../../components/HUD';
import { Map } from '../../components/Map';
import { Inventory } from '../../components/Inventory';
import { Quest } from '../../components/Quest';
import { DebugTerminal } from '../../components/DebugTerminal';
import { ArrowLeft, Terminal, Cpu, ShieldAlert } from 'lucide-react';
import { soundEngine } from '../../services/soundEngine';

export interface GamePageProps {
  onReturnToMenu?: () => void;
}

export const GamePage: React.FC<GamePageProps> = ({ onReturnToMenu }) => {
  return (
    <motion.main
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(6px)' }}
      transition={{ duration: 0.5 }}
      className="relative w-screen h-screen bg-[#05070B] text-[#E2F1FF] font-mono select-none overflow-hidden flex flex-col justify-between"
    >
      {/* CRT Visual Layers */}
      <div className="crt-overlay crt-scanlines" />
      <div className="crt-overlay crt-vignette" />
      <div className="crt-overlay crt-noise" />

      {/* Top Game Navigation & Status Header */}
      <header className="relative z-10 w-full px-6 py-3 border-b border-cyber-border bg-[#05070B]/90 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          {onReturnToMenu && (
            <button
              onClick={() => {
                soundEngine.playKeyTick();
                onReturnToMenu();
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-cyber-surfaceAlt border border-cyber-border hover:border-cyber-cyan/50 hover:bg-cyber-cyan/10 rounded text-cyber-cyan transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>MAIN MENU (ESC)</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyber-cyan animate-ping" />
            <span className="font-bold text-cyber-cyan glow-cyan-sm">
              UNDEFINED // SESSION ACTIVE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-cyber-textDim text-[11px]">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-cyber-cyanDim" />
            ZONE: SECTOR_00_ANOMALY
          </span>
          <span className="text-cyber-red flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            CORRUPTION: LIVE
          </span>
        </div>
      </header>

      {/* Center Game Viewport & HUD */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-6 overflow-hidden">
        {/* Game Simulation Viewport */}
        <div className="lg:col-span-8 bg-[#070B12] border border-cyber-border rounded-lg flex flex-col justify-between p-6 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs border-b border-cyber-border/60 pb-3">
            <div className="flex items-center gap-2 text-cyber-cyan">
              <Terminal className="w-4 h-4" />
              <span>NEURAL SIMULATION RUNTIME</span>
            </div>
            <span className="text-cyber-textMuted font-mono">FRAME: 60 FPS</span>
          </div>

          <div className="my-auto text-center space-y-3">
            <div className="inline-block p-4 rounded-full bg-cyber-cyan/5 border border-cyber-cyan/30 text-cyber-cyan animate-pulse">
              <Cpu className="w-10 h-10 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-[#E2F1FF] tracking-wider">
              SECTOR 00 : INITIALIZED
            </h2>
            <p className="text-xs text-cyber-textDim max-w-md mx-auto leading-relaxed">
              Operator consciousness synced with NULL process. The psychological puzzle engine is now running.
            </p>
          </div>

          <HUD />
        </div>

        {/* Tactical Game Sidebar */}
        <aside className="lg:col-span-4 flex flex-col gap-4">
          <Map />
          <Inventory />
          <Quest />
        </aside>
      </div>

      <div className="relative z-10 px-6 pb-3">
        <DebugTerminal />
      </div>
    </motion.main>
  );
};

export default GamePage;
