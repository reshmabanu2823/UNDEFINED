import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DebugService, DebugExecuteResponse } from '../../services/debugService';
import { useWorldStore } from '../../stores/worldStore';
import { soundEngine } from '../../services/soundEngine';
import { Terminal as TerminalIcon, X, CornerDownLeft, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';

interface DebugTerminalProps {
  isOpen?: boolean;
  onClose: () => void;
}

interface HistoryItem {
  id: string;
  command?: string;
  output: string;
  isError?: boolean;
  isSuccess?: boolean;
}

export const DebugTerminal: React.FC<DebugTerminalProps> = ({ onClose }) => {
  const [inputVal, setInputVal] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([
    {
      id: 'init-1',
      output: `=== NULL//ROOT KERNEL DEBUGGER [v4.19] ===
SESSION: AUTHORITATIVE_BACKEND_SYNC // FASTAPI GATEWAY
Type "help" for reference or "scan door_01" to inspect target.`,
    },
  ]);

  // Command history buffer for ArrowUp / ArrowDown navigation
  const [historyBuffer, setHistoryBuffer] = useState<string[]>([]);
  const [historyPointer, setHistoryPointer] = useState<number>(-1);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const terminalScrollRef = useRef<HTMLDivElement | null>(null);

  // Focus input automatically on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-scroll to bottom on new output
  useEffect(() => {
    if (terminalScrollRef.current) {
      terminalScrollRef.current.scrollTop = terminalScrollRef.current.scrollHeight;
    }
  }, [history, isProcessing]);

  // Authoritative Backend Command Execution
  const handleExecute = async (cmdToRun?: string) => {
    if (isProcessing) return;

    const command = (cmdToRun !== undefined ? cmdToRun : inputVal).trim();
    if (!command) return;

    soundEngine.playKeyTick();

    // Local UI clear
    if (command.toLowerCase() === 'clear') {
      setHistory([]);
      setInputVal('');
      setHistoryPointer(-1);
      return;
    }

    // Local UI exit
    if (command.toLowerCase() === 'exit') {
      setTimeout(() => {
        onClose();
      }, 200);
      return;
    }

    // Save to command history buffer
    setHistoryBuffer((prev) => [...prev, command]);
    setHistoryPointer(-1);
    setInputVal('');
    setIsProcessing(true);

    try {
      // Dispatch command to authoritative FastAPI backend
      const result: DebugExecuteResponse = await DebugService.executeCommand(command);

      if (result.success) {
        soundEngine.playKeyTick();

        // Mutate local Zustand state based on backend authoritative outcome
        if (result.state_changed) {
          const objId = (result.object_id || '').toLowerCase();
          const prop = (result.property || '').toLowerCase();
          const newVal = String(result.new_value || '').toUpperCase();

          if (objId === 'door_01' || command.toLowerCase().includes('door_01')) {
            if (prop === 'permission' && (newVal === 'ROOT' || newVal === 'ADMIN')) {
              useWorldStore.getState().triggerNullCorruptionEvent();
              setSuccessBanner('DOOR_01 UNLOCKED // PERMISSION: ROOT');
            } else if (prop === 'permission' && newVal === 'USER') {
              useWorldStore.getState().setDoorPermission('USER');
            }
          }
        }

        setHistory((prev) => [
          ...prev,
          {
            id: `log-${Date.now()}-${Math.random()}`,
            command: command,
            output: result.message || '[DEBUG] COMMAND ACCEPTED',
            isSuccess: true,
          },
        ]);
      } else {
        soundEngine.playWarning();

        // On failure, do NOT mutate local world state
        setHistory((prev) => [
          ...prev,
          {
            id: `log-${Date.now()}-${Math.random()}`,
            command: command,
            output: result.message || `ERROR: ${result.error_code || 'COMMAND_FAILED'}`,
            isError: true,
          },
        ]);
      }
    } catch (err: any) {
      soundEngine.playWarning();
      setHistory((prev) => [
        ...prev,
        {
          id: `log-${Date.now()}-${Math.random()}`,
          command: command,
          output: 'CONNECTION ERROR\nSYSTEM UNREACHABLE',
          isError: true,
        },
      ]);
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  // Keyboard navigation for history (ArrowUp / ArrowDown) and Escape
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyBuffer.length === 0) return;
      const nextPointer = historyPointer === -1 ? historyBuffer.length - 1 : Math.max(0, historyPointer - 1);
      setHistoryPointer(nextPointer);
      setInputVal(historyBuffer[nextPointer]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyPointer === -1) return;
      if (historyPointer < historyBuffer.length - 1) {
        const nextPointer = historyPointer + 1;
        setHistoryPointer(nextPointer);
        setInputVal(historyBuffer[nextPointer]);
      } else {
        setHistoryPointer(-1);
        setInputVal('');
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      soundEngine.playKeyTick();
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-[#05070B]/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8 font-mono text-[#E2F1FF] select-none"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Subtle CRT scanline overlay */}
      <div className="crt-overlay crt-scanlines opacity-25 pointer-events-none" />

      {/* Terminal Main Container */}
      <div className="relative z-10 max-w-5xl w-full mx-auto flex-1 flex flex-col bg-[#070B14]/85 border border-cyber-cyan/50 rounded-lg shadow-[0_0_50px_rgba(0,240,255,0.15)] overflow-hidden">
        {/* HEADER */}
        <header className="px-6 py-3.5 border-b border-cyber-border bg-[#05070B]/90 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <TerminalIcon className="w-4 h-4 text-cyber-cyan animate-pulse" />
            <span className="font-bold tracking-widest text-cyber-cyan glow-cyan-sm text-sm">
              DEBUG TERMINAL
            </span>
            <span className="text-cyber-textMuted">|</span>
            <span className="text-cyber-cyanDim flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-cyber-cyan animate-ping" />
              BACKEND: AUTHORITATIVE_SYNC
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              soundEngine.playKeyTick();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-cyber-surfaceAlt/80 hover:bg-cyber-purple/20 border border-cyber-border hover:border-cyber-cyan/60 rounded text-cyber-textBright text-xs transition-colors"
          >
            <span className="text-cyber-cyan font-bold">[ ESC ]</span>
            <span>CLOSE</span>
            <X className="w-3.5 h-3.5 ml-1" />
          </button>
        </header>

        {/* REWRITE SUCCESS NOTIFICATION BANNER */}
        <AnimatePresence>
          {successBanner && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-cyber-cyan/15 border-b border-cyber-cyan/60 px-6 py-2.5 flex items-center justify-between text-xs text-cyber-cyan font-bold"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyber-cyan" />
                <span>{successBanner}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="text-[11px] underline hover:text-white"
              >
                RETURN TO 3D ROOM &rarr;
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TERMINAL OUTPUT STREAM */}
        <div
          ref={terminalScrollRef}
          className="flex-1 p-6 overflow-y-auto space-y-4 font-mono text-sm leading-relaxed"
        >
          {history.map((item) => (
            <div key={item.id} className="space-y-1">
              {item.command && (
                <div className="flex items-center gap-2 text-cyber-cyan font-bold">
                  <span className="text-cyber-cyanDim">&gt;</span>
                  <span>{item.command}</span>
                </div>
              )}
              <pre
                className={`whitespace-pre-wrap font-mono pl-4 text-xs sm:text-sm ${
                  item.isError
                    ? 'text-cyber-red glow-red-sm'
                    : item.isSuccess
                    ? 'text-[#E2F1FF]'
                    : 'text-cyber-textDim'
                }`}
              >
                {item.output}
              </pre>
            </div>
          ))}

          {/* SUBTLE PROCESSING / EXECUTION SPINNER */}
          {isProcessing && (
            <div className="flex items-center gap-2 pl-4 text-xs text-cyber-cyan animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>[EXEC] QUERYING AUTHORITATIVE KERNEL PROTOCOL...</span>
            </div>
          )}
        </div>

        {/* QUICK COMMAND SHORTCUT BAR */}
        <div className="px-6 py-2 border-t border-cyber-border bg-[#05070B]/60 flex items-center gap-2 overflow-x-auto text-[11px] text-cyber-textMuted">
          <span className="shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyber-cyan" />
            <span>PRESETS:</span>
          </span>

          {[
            'scan door_01',
            'rewrite door_01.permission=root',
            'scan terminal_01',
            'scan memory_01',
            'scan',
            'clear',
          ].map((cmd) => (
            <button
              key={cmd}
              type="button"
              disabled={isProcessing}
              onClick={(e) => {
                e.stopPropagation();
                setInputVal(cmd);
                handleExecute(cmd);
              }}
              className="px-2.5 py-1 rounded border border-cyber-border bg-cyber-surface/60 hover:border-cyber-cyan hover:bg-cyber-cyan/10 hover:text-cyber-cyan transition-all shrink-0 font-mono disabled:opacity-50"
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* INPUT COMMAND PROMPT */}
        <div className="px-6 py-4 border-t border-cyber-border bg-[#05070B]/95 flex items-center gap-3">
          <span className="text-cyber-cyan font-bold text-lg select-none">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            disabled={isProcessing}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isProcessing
                ? 'Processing command...'
                : 'scan door_01  |  rewrite door_01.permission=root  |  help'
            }
            className="flex-1 bg-transparent border-none outline-none font-mono text-sm sm:text-base text-cyber-cyan tracking-wider placeholder:text-cyber-textMuted/60 disabled:opacity-50"
            autoFocus
            spellCheck={false}
          />
          <button
            type="button"
            disabled={isProcessing}
            onClick={(e) => {
              e.stopPropagation();
              handleExecute();
            }}
            className="px-4 py-2 bg-cyber-cyan/15 hover:bg-cyber-cyan/25 border border-cyber-cyan/60 rounded text-cyber-cyan text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CornerDownLeft className="w-3.5 h-3.5" />
            )}
            <span>{isProcessing ? 'PROCESSING' : 'EXECUTE'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default DebugTerminal;
