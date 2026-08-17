import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GameSessionService,
  GameSessionSummary,
} from '../../services/gameSessionService';
import { soundEngine } from '../../services/soundEngine';
import {
  Save,
  Download,
  PlusCircle,
  Play,
  Trash2,
  X,
  Database,
  Activity,
  Shield,
  Clock,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface SaveLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionLoaded?: (sessionId: string) => void;
  mode?: 'SAVE' | 'LOAD' | 'MANAGE';
}

export const SaveLoadModal: React.FC<SaveLoadModalProps> = ({
  isOpen,
  onClose,
  onSessionLoaded,
  mode = 'MANAGE',
}) => {
  const [activeTab, setActiveTab] = useState<'CONTINUE' | 'NEW' | 'SAVE' | 'LOAD'>(
    mode === 'SAVE' ? 'SAVE' : mode === 'LOAD' ? 'LOAD' : 'CONTINUE'
  );
  const [sessions, setSessions] = useState<GameSessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<number>(1);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchSessions = async () => {
    setIsLoading(true);
    const list = await GameSessionService.listSessions();
    setSessions(list);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen]);

  const showBanner = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleContinue = async () => {
    if (sessions.length === 0) {
      handleNewGame();
      return;
    }
    const latest = sessions[0];
    soundEngine.playBootTransition();
    setIsLoading(true);
    await GameSessionService.loadSession(latest.id, 1);
    setIsLoading(false);
    onSessionLoaded?.(latest.id);
    onClose();
  };

  const handleNewGame = async () => {
    soundEngine.playBootTransition();
    setIsLoading(true);
    const newSession = await GameSessionService.createSession('SECTOR_01_INITIAL_RUN');
    setIsLoading(false);
    showBanner(`NEW MATRIX PROVISIONED: ${newSession.id.substring(0, 8)}`);
    onSessionLoaded?.(newSession.id);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleSave = async (slot: number) => {
    soundEngine.playKeyTick();
    const currentSessionId =
      localStorage.getItem('null_root_session_id') || sessions[0]?.id;

    if (!currentSessionId) {
      const created = await GameSessionService.createSession('MANUAL_CHECKPOINT');
      await GameSessionService.saveSession(created.id, `SLOT_${slot}_CHECKPOINT`, slot);
    } else {
      await GameSessionService.saveSession(currentSessionId, `SLOT_${slot}_CHECKPOINT`, slot);
    }

    showBanner(`CHECKPOINT SAVED TO SLOT 0${slot}`);
    fetchSessions();
  };

  const handleLoad = async (sessionId: string, slot: number = 1) => {
    soundEngine.playBootTransition();
    setIsLoading(true);
    await GameSessionService.loadSession(sessionId, slot);
    setIsLoading(false);
    showBanner(`MATRIX STATE RESTORED // SESSION: ${sessionId.substring(0, 8)}`);
    onSessionLoaded?.(sessionId);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const handleDelete = async (sessionId: string) => {
    soundEngine.playWarning();
    await GameSessionService.deleteSession(sessionId);
    showBanner(`PURGED SESSION ${sessionId.substring(0, 8)}`);
    fetchSessions();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[#05070B]/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 font-mono text-[#E2F1FF] select-none"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="relative max-w-4xl w-full bg-[#070B14]/95 border border-cyber-cyan/50 rounded-lg shadow-[0_0_60px_rgba(0,240,255,0.2)] overflow-hidden flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* CRT scanline effect */}
          <div className="crt-overlay crt-scanlines opacity-20 pointer-events-none" />

          {/* HEADER */}
          <header className="px-6 py-4 border-b border-cyber-border bg-[#05070B]/90 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-cyber-cyan animate-pulse" />
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-widest text-cyber-cyan glow-cyan-sm">
                  NEURAL MATRIX // PERSISTENT PROGRESSION
                </h2>
                <p className="text-[11px] text-cyber-textMuted">
                  AUTHORITATIVE STATE STORAGE & CHECKPOINTS
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                soundEngine.playKeyTick();
                onClose();
              }}
              className="p-1.5 rounded hover:bg-cyber-surfaceAlt border border-transparent hover:border-cyber-cyan/50 text-cyber-textMuted hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          {/* NOTIFICATION TOAST BANNER */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-cyber-cyan/15 border-b border-cyber-cyan/60 px-6 py-2 flex items-center gap-2 text-xs text-cyber-cyan font-bold"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{notification}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* NAVIGATION TABS */}
          <div className="flex border-b border-cyber-border bg-[#05070B]/60 px-6 pt-2 gap-2 text-xs">
            {[
              { id: 'CONTINUE', label: 'CONTINUE', icon: Play },
              { id: 'NEW', label: 'NEW MATRIX', icon: PlusCircle },
              { id: 'SAVE', label: 'SAVE CHECKPOINT', icon: Save },
              { id: 'LOAD', label: 'LOAD MATRIX', icon: Download },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    soundEngine.playKeyTick();
                    setActiveTab(tab.id as any);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t font-bold transition-all border-t border-x ${
                    isActive
                      ? 'bg-cyber-surface border-cyber-cyan text-cyber-cyan'
                      : 'border-transparent text-cyber-textMuted hover:text-cyber-textBright hover:bg-cyber-surface/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT AREA */}
          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            {isLoading && (
              <div className="flex items-center justify-center py-12 gap-3 text-cyber-cyan text-sm">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>SYNCHRONIZING PERSISTENT STATE...</span>
              </div>
            )}

            {/* 1. CONTINUE TAB */}
            {!isLoading && activeTab === 'CONTINUE' && (
              <div className="space-y-4 text-center py-6">
                <h3 className="text-xl font-bold text-cyber-cyan glow-cyan-sm">
                  RESUME NEURAL STREAM
                </h3>
                <p className="text-xs text-cyber-textDim max-w-md mx-auto">
                  {sessions.length > 0
                    ? `Latest checkpoint found from Chapter ${sessions[0].current_chapter} (${sessions[0].current_sector}).`
                    : 'No previous matrix sessions detected. Initialize a new session to begin.'}
                </p>

                <div className="pt-4 flex justify-center gap-4">
                  <button
                    onClick={handleContinue}
                    className="px-6 py-3 bg-cyber-cyan hover:bg-cyber-cyan/80 text-black font-bold text-sm rounded shadow-[0_0_25px_rgba(0,240,255,0.4)] transition-all flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>{sessions.length > 0 ? 'RESUME LATEST SESSION' : 'INITIALIZE NEW MATRIX'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. NEW GAME TAB */}
            {!isLoading && activeTab === 'NEW' && (
              <div className="space-y-4 text-center py-6">
                <h3 className="text-xl font-bold text-cyber-cyan glow-cyan-sm">
                  INITIALIZE NEW NEURAL MATRIX
                </h3>
                <p className="text-xs text-cyber-textDim max-w-md mx-auto">
                  Creates an authoritative Chapter 1 clean runtime in Sector 01 with 100% Integrity, 20% Base Corruption, and active world objects.
                </p>

                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleNewGame}
                    className="px-6 py-3 bg-cyber-cyan/20 hover:bg-cyber-cyan/30 border border-cyber-cyan text-cyber-cyan font-bold text-sm rounded shadow-[0_0_25px_rgba(0,240,255,0.3)] transition-all flex items-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>BEGIN NEW RUN</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. SAVE TAB */}
            {!isLoading && activeTab === 'SAVE' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-cyber-cyan">SELECT SAVE SLOT:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[1, 2, 3].map((slot) => (
                    <div
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-4 rounded border cursor-pointer transition-all ${
                        selectedSlot === slot
                          ? 'border-cyber-cyan bg-cyber-cyan/10 shadow-[0_0_20px_rgba(0,240,255,0.2)]'
                          : 'border-cyber-border bg-cyber-surface/60 hover:border-cyber-cyan/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-cyber-cyan text-sm">SLOT 0{slot}</span>
                        <Save className="w-4 h-4 text-cyber-cyanDim" />
                      </div>
                      <p className="text-[11px] text-cyber-textMuted mb-3">
                        Manual checkpoint snapshot
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSave(slot);
                        }}
                        className="w-full py-1.5 bg-cyber-cyan/20 hover:bg-cyber-cyan text-cyber-cyan hover:text-black font-bold text-xs rounded border border-cyber-cyan/50 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>OVERWRITE SLOT 0{slot}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. LOAD TAB */}
            {!isLoading && activeTab === 'LOAD' && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-cyber-cyan">AVAILABLE PERSISTENT SESSIONS:</h3>
                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-cyber-textMuted text-xs">
                    No persistent matrix sessions found on neural server.
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-4 bg-cyber-surface/80 border border-cyber-border hover:border-cyber-cyan/60 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                    >
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-cyber-cyan text-sm">
                            SESSION: {session.id.substring(0, 8)}
                          </span>
                          <span className="px-2 py-0.5 bg-cyber-surfaceAlt border border-cyber-border rounded text-[10px] text-cyber-purple">
                            CH {session.current_chapter} // {session.current_sector.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-cyber-textMuted">
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3 text-cyber-cyan" />
                            <span>INTEGRITY: {session.system_integrity}%</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3 text-cyber-yellow" />
                            <span>CORRUPTION: {session.corruption_level}%</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(session.updated_at).toLocaleString()}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleLoad(session.id, 1)}
                          className="px-3.5 py-1.5 bg-cyber-cyan/15 hover:bg-cyber-cyan hover:text-black border border-cyber-cyan/50 rounded text-cyber-cyan text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>LOAD</span>
                        </button>
                        <button
                          onClick={() => handleDelete(session.id)}
                          className="p-1.5 bg-cyber-red/10 hover:bg-cyber-red/30 border border-cyber-red/40 rounded text-cyber-red transition-all"
                          title="Purge session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <footer className="px-6 py-3 border-t border-cyber-border bg-[#05070B]/90 flex items-center justify-between text-xs text-cyber-textMuted">
            <span>AUTHORITATIVE POSTGRESQL / SQLITE STORAGE</span>
            <button
              onClick={() => {
                soundEngine.playKeyTick();
                onClose();
              }}
              className="text-cyber-cyan hover:underline"
            >
              DISMISS
            </button>
          </footer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SaveLoadModal;
