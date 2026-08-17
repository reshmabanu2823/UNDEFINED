import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuestService, Quest, ObjectiveItem } from '../../services/questService';
import { useWorldStore } from '../../stores/worldStore';
import { gameWs } from '../../services/websocket';
import { CorruptedText } from '../../game/Effects/CorruptedText';
import {
  Target,
  CheckCircle2,
  Lock,
  Flame,
  ChevronRight,
  ListTodo,
} from 'lucide-react';

const INITIAL_OBJECTIVES: ObjectiveItem[] = [
  { id: 'FIND_TERMINAL_01', label: 'Find terminal_01', status: 'IN_PROGRESS' },
  { id: 'ACCESS_DOOR_01', label: 'Access door_01', status: 'LOCKED' },
  { id: 'GAIN_ROOT_PERMISSION', label: 'Gain ROOT permission', status: 'LOCKED' },
  { id: 'ENTER_SECTOR_02', label: 'Enter Sector 02', status: 'LOCKED' },
];

export const QuestHUD: React.FC = () => {
  const [quest, setQuest] = useState<Quest | null>(null);
  const [objectives, setObjectives] = useState<ObjectiveItem[]>(INITIAL_OBJECTIVES);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const corruptionLevel = useWorldStore((state) => state.corruptionLevel);
  const isDoorUnlocked = !useWorldStore((state) => state.door_01.locked);

  // 1. Initial Load from Authoritative Backend
  useEffect(() => {
    const fetchQuest = async () => {
      const list = await QuestService.listQuests();
      if (list.length > 0) {
        setQuest(list[0]);
        if (list[0].objectives && list[0].objectives.length > 0) {
          setObjectives(list[0].objectives);
        }
      }
    };
    fetchQuest();
  }, []);

  // 2. Subscribe to Real-Time WebSocket QUEST_UPDATED Events
  useEffect(() => {
    const unsub = gameWs.on('QUEST_UPDATED', (event) => {
      const payload = event.payload || {};
      if (payload.objectives) {
        setObjectives(payload.objectives);
      }
      if (payload.objective) {
        useWorldStore.getState().setObjective(payload.objective);
      }
    });

    return () => {
      unsub();
    };
  }, []);

  // 3. Fallback Reactive Sync with Door Unlock if offline
  useEffect(() => {
    if (isDoorUnlocked) {
      setObjectives((prev) =>
        prev.map((o) => {
          if (o.id === 'GAIN_ROOT_PERMISSION' || o.id === 'ACCESS_DOOR_01' || o.id === 'FIND_TERMINAL_01') {
            return { ...o, status: 'COMPLETED' };
          }
          if (o.id === 'ENTER_SECTOR_02') {
            return {
              ...o,
              status: corruptionLevel > 50 ? 'CORRUPTED' : 'IN_PROGRESS',
            };
          }
          return o;
        })
      );
    }
  }, [isDoorUnlocked, corruptionLevel]);

  const activeObjective =
    objectives.find((o) => o.status === 'IN_PROGRESS' || o.status === 'CORRUPTED')?.label ||
    (isDoorUnlocked ? 'Enter Sector 02' : 'Find terminal_01');

  const completedCount = objectives.filter((o) => o.status === 'COMPLETED').length;
  const progressPercent = Math.round((completedCount / objectives.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-3 bg-[#080C14]/92 border border-cyber-cyan/40 rounded shadow-[0_0_25px_rgba(0,240,255,0.15)] font-mono max-w-xs w-72 pointer-events-auto select-none"
    >
      {/* DIRECTIVE HEADER */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer group"
      >
        <div className="text-[10px] text-cyber-textMuted uppercase flex items-center gap-1.5">
          <Target className="w-3 h-3 text-cyber-cyan animate-pulse" />
          <span className="group-hover:text-cyber-cyan transition-colors">
            DIRECTIVE // {quest?.title || 'ACCESS SECTOR 02'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-cyber-cyanDim">
          <span>{progressPercent}%</span>
          <ListTodo className="w-3 h-3 text-cyber-cyanDim" />
        </div>
      </div>

      {/* CURRENT ACTIVE OBJECTIVE SUMMARY */}
      <div className="mt-1.5 pb-2 border-b border-cyber-border/60">
        <div className="text-xs font-bold text-cyber-cyan glow-cyan-sm flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan animate-ping inline-block shrink-0" />
          <span className="truncate">
            <CorruptedText text={activeObjective} corruptionLevel={corruptionLevel} />
          </span>
        </div>
      </div>

      {/* EXPANDED OBJECTIVES CHECKLIST */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-2.5 space-y-1.5 text-[11px]"
          >
            {objectives.map((obj) => {
              const isCompleted = obj.status === 'COMPLETED';
              const isInProgress = obj.status === 'IN_PROGRESS';
              const isCorrupted = obj.status === 'CORRUPTED';
              const isLocked = obj.status === 'LOCKED';

              return (
                <div
                  key={obj.id}
                  className={`flex items-center gap-2 px-1.5 py-0.5 rounded transition-all ${
                    isInProgress
                      ? 'bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan font-bold'
                      : isCorrupted
                      ? 'bg-cyber-red/10 border border-cyber-red/30 text-cyber-red font-bold animate-pulse'
                      : isCompleted
                      ? 'text-cyber-textMuted/70 line-through'
                      : 'text-cyber-textDim/50'
                  }`}
                >
                  {/* Status Glyphs */}
                  {isCompleted && (
                    <CheckCircle2 className="w-3 h-3 text-cyber-cyan inline shrink-0" />
                  )}
                  {isInProgress && (
                    <ChevronRight className="w-3 h-3 text-cyber-cyan animate-pulse inline shrink-0" />
                  )}
                  {isCorrupted && (
                    <Flame className="w-3 h-3 text-cyber-red animate-bounce inline shrink-0" />
                  )}
                  {isLocked && (
                    <Lock className="w-3 h-3 text-cyber-textDim/40 inline shrink-0" />
                  )}

                  <span className="truncate">
                    {isCorrupted ? (
                      <CorruptedText text={obj.label} corruptionLevel={corruptionLevel} />
                    ) : (
                      obj.label
                    )}
                  </span>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default QuestHUD;
