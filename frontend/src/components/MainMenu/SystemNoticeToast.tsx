import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

interface SystemNoticeProps {
  message: string | null;
  onDismiss: () => void;
}

export const SystemNoticeToast: React.FC<SystemNoticeProps> = ({ message, onDismiss }) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4"
        >
          <div className="bg-[#080C14] border border-cyber-yellow/60 rounded-md p-4 shadow-[0_0_30px_rgba(255,184,0,0.15)] flex items-start justify-between gap-3 font-mono">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-cyber-yellow shrink-0 mt-0.5 animate-pulse" />
              <div>
                <div className="text-xs font-bold text-cyber-yellow uppercase tracking-widest">
                  {message}
                </div>
                <div className="text-[11px] text-cyber-textDim mt-0.5">
                  Core snapshot not found in local sector memory. Protocol locked until game start.
                </div>
              </div>
            </div>

            <button
              onClick={onDismiss}
              className="text-cyber-textMuted hover:text-cyber-textBright transition-colors p-1"
              aria-label="Dismiss notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SystemNoticeToast;
