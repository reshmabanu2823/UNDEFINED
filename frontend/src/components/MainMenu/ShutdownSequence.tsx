import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Power, RotateCcw } from 'lucide-react';
import { soundEngine } from '../../services/soundEngine';

interface ShutdownSequenceProps {
  onCancel: () => void;
  onRestartBoot: () => void;
}

export const ShutdownSequence: React.FC<ShutdownSequenceProps> = ({ onCancel, onRestartBoot }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    soundEngine.playWarning();
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 5 ? '' : prev + '.'));
    }, 250);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#05070B]/95 backdrop-blur-md flex items-center justify-center p-6"
    >
      <div className="max-w-md w-full border border-cyber-red/50 bg-[#080C14] rounded-lg p-6 font-mono text-center shadow-[0_0_50px_rgba(255,42,77,0.2)]">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-cyber-redDim/30 border border-cyber-red/60 flex items-center justify-center text-cyber-red animate-pulse">
          <Power className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold tracking-widest text-cyber-red glow-red-sm mb-2">
          SYSTEM SHUTDOWN INITIATED
        </h3>

        <p className="text-xs text-cyber-textDim leading-relaxed mb-6">
          TERMINATING NEURAL LINK & FLUSHING QUANTUM RAM MEMORY BUFFERS{dots}
        </p>

        <div className="p-3 bg-cyber-bg border border-cyber-border rounded text-[11px] text-cyber-textMuted text-left mb-6 space-y-1">
          <div>[KERNEL]: Unmounting /sys/cortex_00... [DONE]</div>
          <div>[SOCKET]: Closing telemetry link 127.0.0.1:9042... [DONE]</div>
          <div>[STATUS]: System in standby mode. Browser session retained.</div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 rounded border border-cyber-border bg-cyber-surface hover:bg-cyber-surfaceAlt text-cyber-textBright text-xs font-bold tracking-wider transition-colors"
          >
            ABORT SHUTDOWN (ESC)
          </button>
          <button
            type="button"
            onClick={onRestartBoot}
            className="flex-1 py-2.5 px-4 rounded border border-cyber-cyan/60 bg-cyber-cyan/10 hover:bg-cyber-cyan/20 text-cyber-cyan text-xs font-bold tracking-wider transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            RESTART OS
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ShutdownSequence;
