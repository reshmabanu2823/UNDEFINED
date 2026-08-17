import React, { useState, useRef, useEffect } from 'react';
import { TerminalData } from '../../stores/interactionStore';
import { Terminal as TerminalIcon, X, Play } from 'lucide-react';
import { soundEngine } from '../../services/soundEngine';

interface DebugTerminalModalProps {
  data: TerminalData;
  onClose: () => void;
}

interface CommandLog {
  command?: string;
  output: string;
  isError?: boolean;
  isSuccess?: boolean;
}

export const DebugTerminalModal: React.FC<DebugTerminalModalProps> = ({ data, onClose }) => {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<CommandLog[]>([
    { output: '=== NULL//ROOT DEBUG TERMINAL v4.19 ===' },
    { output: 'Logged in as OPERATOR_0 // Clearance: USER_L1' },
    { output: 'Type "help" to view available diagnostic routines.' },
    ...data.logs.map((log) => ({ output: log })),
  ]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const executeCommand = (cmdStr: string) => {
    const trimmed = cmdStr.trim().toLowerCase();
    if (!trimmed) return;

    soundEngine.playKeyTick();
    const newLogs: CommandLog[] = [{ command: cmdStr, output: '' }];

    switch (trimmed) {
      case 'help':
        newLogs[0].output = `AVAILABLE PROTOCOLS:\n  status    - Check quantum core integrity\n  scan      - Scan sector 00 for anomalous threads\n  decrypt   - Attempt neural snapshot decryption\n  sysinfo   - Display system environment specs\n  clear     - Flush terminal console buffer\n  exit      - Close terminal connection`;
        break;
      case 'status':
        newLogs[0].output = `SYSTEM DIAGNOSTICS:\n  CORE INTEGRITY: 74.2% [CORRUPTING]\n  QUANTUM NODES:  32 ACTIVE / 4 COMPROMISED\n  SECURITY DOOR:  LOCKED (REQUIRES ROOT_L5)\n  MEMORY CORE:    1 UNSTABILIZED CORE FOUND ON WORKSTATION`;
        newLogs[0].isSuccess = true;
        break;
      case 'scan':
        soundEngine.playGlitch();
        newLogs[0].output = `SCANNING SECTOR 00...\n[!] ANOMALY FOUND: NULL PROCESS AT 0x00000000\n[!] TRACE LEAK: Memory core snapshot accessible at Desk Beta.`;
        newLogs[0].isError = true;
        break;
      case 'decrypt':
        soundEngine.playWarning();
        newLogs[0].output = `DECRYPTION ROUTINE INITIALIZED...\nERROR 0x99: Missing cryptographic key fragment. Locate MEMORY CORE in room to proceed.`;
        newLogs[0].isError = true;
        break;
      case 'sysinfo':
        newLogs[0].output = `KERNEL: 0x419_NULL-RELEASE\nHOST: QUANTUM-SECTOR-00\nTERMINAL TYPE: ${data.terminalType}\nACCESS LEVEL: ${data.accessLevel}`;
        break;
      case 'clear':
        setHistory([]);
        setInputVal('');
        return;
      case 'exit':
        onClose();
        return;
      default:
        newLogs[0].output = `Command not recognized: "${trimmed}". Type "help" for available routines.`;
        newLogs[0].isError = true;
    }

    setHistory((prev) => [...prev, ...newLogs]);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(inputVal);
    }
  };

  return (
    <div className="p-6 bg-[#080C14] border border-cyber-cyan/60 rounded-lg max-w-2xl w-full font-mono text-[#E2F1FF] shadow-[0_0_60px_rgba(0,240,255,0.2)] flex flex-col h-[520px] relative">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-cyber-border shrink-0 mb-4">
        <div className="flex items-center gap-3">
          <TerminalIcon className="w-5 h-5 text-cyber-cyan animate-pulse" />
          <div>
            <h2 className="text-lg font-bold tracking-widest text-cyber-cyan glow-cyan-sm">
              {data.displayName}
            </h2>
            <div className="text-[11px] text-cyber-textMuted flex items-center gap-2">
              <span>TYPE: {data.terminalType}</span>
              <span>&bull;</span>
              <span className="text-cyber-purple">{data.accessLevel}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            soundEngine.playKeyTick();
            onClose();
          }}
          className="p-1.5 text-cyber-textMuted hover:text-cyber-textBright hover:bg-cyber-surface rounded transition-colors"
          aria-label="Close terminal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Terminal Output Log Area */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-2 text-xs font-mono bg-cyber-bg/90 p-4 rounded border border-cyber-border">
        {history.map((item, idx) => (
          <div key={idx} className="space-y-0.5">
            {item.command && (
              <div className="flex items-center gap-1.5 text-cyber-cyan font-bold">
                <span className="text-cyber-cyanDim">&gt;</span>
                <span>{item.command}</span>
              </div>
            )}
            <pre
              className={`whitespace-pre-wrap leading-relaxed ${
                item.isError
                  ? 'text-cyber-red'
                  : item.isSuccess
                  ? 'text-cyber-cyan'
                  : 'text-cyber-textDim'
              }`}
            >
              {item.output}
            </pre>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Preset Command Buttons */}
      <div className="flex items-center gap-2 py-2 text-[11px] text-cyber-textMuted overflow-x-auto shrink-0">
        <span>QUICK CMD:</span>
        {['help', 'status', 'scan', 'decrypt', 'sysinfo'].map((cmd) => (
          <button
            key={cmd}
            type="button"
            onClick={() => executeCommand(cmd)}
            className="px-2.5 py-0.5 rounded border border-cyber-border bg-cyber-surface hover:border-cyber-cyan/50 hover:text-cyber-cyan transition-colors"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="pt-2 flex items-center gap-2 shrink-0 border-t border-cyber-border/80">
        <span className="text-cyber-cyan font-bold">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type terminal command (e.g. status, scan, help)..."
          className="flex-1 bg-cyber-surface border border-cyber-border/80 focus:border-cyber-cyan px-3 py-2 rounded text-xs text-[#E2F1FF] outline-none font-mono tracking-wide"
        />
        <button
          onClick={() => executeCommand(inputVal)}
          className="px-3.5 py-2 bg-cyber-cyan/10 border border-cyber-cyan/50 hover:bg-cyber-cyan/20 text-cyber-cyan rounded text-xs font-bold transition-colors flex items-center gap-1"
        >
          <Play className="w-3.5 h-3.5" />
          <span>EXEC</span>
        </button>
      </div>
    </div>
  );
};

export default DebugTerminalModal;
