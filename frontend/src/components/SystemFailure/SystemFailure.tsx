import React from 'react';
import { motion } from 'framer-motion';
import { useWorldStore } from '../../stores/worldStore';
import { soundEngine } from '../../services/soundEngine';
import { AlertOctagon, RotateCcw } from 'lucide-react';

export const SystemFailure: React.FC = () => {
  const isSystemFailure = useWorldStore((state) => state.isSystemFailure);
  const rebootSystem = useWorldStore((state) => state.rebootSystem);

  if (!isSystemFailure) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-[#050002]/95 backdrop-blur-lg flex flex-col items-center justify-center p-6 font-mono text-[#FF2A4D] select-none"
    >
      {/* Heavy CRT scanline and noise overlay */}
      <div className="crt-overlay crt-scanlines opacity-50 pointer-events-none" />
      <div className="crt-overlay crt-vignette opacity-80 pointer-events-none" />

      <motion.div
        initial={{ scale: 0.9, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-xl w-full text-center space-y-6 relative z-10 p-8 bg-[#090204]/90 border-2 border-cyber-red rounded-lg shadow-[0_0_100px_rgba(255,42,77,0.5)]"
      >
        <div className="w-16 h-16 mx-auto rounded-full bg-cyber-red/20 border-2 border-cyber-red flex items-center justify-center text-cyber-red animate-pulse">
          <AlertOctagon className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-widest text-cyber-red glow-red-sm">
            CRITICAL KERNEL PANIC
          </h1>
          <div className="text-sm font-bold text-[#E2F1FF] tracking-wider">
            SYSTEM INTEGRITY: <span className="text-cyber-red">0%</span> // CORRUPTED
          </div>
        </div>

        <div className="p-4 bg-cyber-red/10 border border-cyber-red/40 rounded text-xs text-cyber-textDim text-left space-y-1">
          <div className="text-cyber-red font-bold">[!] FATAL MEMORY OVERFLOW</div>
          <div>Process <span className="text-cyber-textBright">NULL_FRAGMENT</span> caused an unrecoverable brain-link disconnect.</div>
          <div>Core dump saved to sector 00. Operator pulse suspended.</div>
        </div>

        <div className="pt-4">
          <button
            onClick={() => {
              soundEngine.playBootTransition();
              rebootSystem();
            }}
            className="px-8 py-3.5 bg-cyber-red/20 hover:bg-cyber-red/35 border-2 border-cyber-red rounded-lg text-[#E2F1FF] hover:text-white font-bold text-sm tracking-widest transition-all shadow-[0_0_30px_rgba(255,42,77,0.4)] flex items-center justify-center gap-2.5 mx-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>REBOOT SYSTEM</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SystemFailure;
