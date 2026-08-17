import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NullEventStage } from '../../stores/worldStore';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

interface WarningOverlayProps {
  stage: NullEventStage;
  corruptionLevel: number;
}

export const WarningOverlay: React.FC<WarningOverlayProps> = ({ stage, corruptionLevel }) => {
  if (stage !== 'WARNING' && stage !== 'NULL_MESSAGE') {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-6 bg-[#05070B]/75 backdrop-blur-[3px]"
      >
        <div className="max-w-xl w-full text-center font-mono space-y-6">
          {stage === 'WARNING' && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="p-6 bg-[#080C14]/95 border-2 border-cyber-red rounded-lg shadow-[0_0_80px_rgba(255,42,77,0.4)] relative overflow-hidden"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-cyber-redDim/40 border border-cyber-red flex items-center justify-center text-cyber-red animate-pulse">
                <ShieldAlert className="w-7 h-7" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-widest text-cyber-red glow-red-sm mb-2">
                SYSTEM WARNING
              </h2>

              <p className="text-sm sm:text-base font-bold tracking-wider text-[#E2F1FF] flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4 text-cyber-red animate-bounce" />
                <span>UNKNOWN PROCESS DETECTED</span>
              </p>

              <div className="mt-4 pt-3 border-t border-cyber-red/30 flex items-center justify-between text-xs text-cyber-textMuted">
                <span>PID: 0x00000000_NULL</span>
                <span className="text-cyber-red font-bold animate-pulse">
                  CORRUPTION: {corruptionLevel}%
                </span>
              </div>
            </motion.div>
          )}

          {stage === 'NULL_MESSAGE' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="p-8 bg-[#05070B]/95 border border-cyber-cyan rounded-lg shadow-[0_0_100px_rgba(0,240,255,0.35)] relative"
            >
              <div className="text-left space-y-3 font-mono">
                <div className="text-xs font-bold text-cyber-cyan tracking-widest flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 bg-cyber-cyan animate-ping rounded-full" />
                  <span>NULL:</span>
                </div>

                <div className="text-3xl sm:text-5xl font-black tracking-widest text-[#E2F1FF] glow-cyan-sm pl-4">
                  hello.
                  <span className="inline-block w-3 h-8 bg-cyber-cyan ml-2 animate-flicker" />
                </div>
              </div>

              <div className="mt-6 text-right text-[11px] text-cyber-textMuted">
                <span>MEMORY INTRUSION // CORTEX COMPROMISED</span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WarningOverlay;
