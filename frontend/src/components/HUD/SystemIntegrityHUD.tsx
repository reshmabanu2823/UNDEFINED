import React from 'react';
import { useWorldStore } from '../../stores/worldStore';
import { Shield, ShieldAlert, AlertTriangle, Zap } from 'lucide-react';

export const SystemIntegrityHUD: React.FC = () => {
  const integrity = useWorldStore((state) => state.playerIntegrity);
  const enemyState = useWorldStore((state) => state.enemyState);
  const enemyDistance = useWorldStore((state) => state.enemyDistance);

  // Generate ASCII block progress bar (e.g. ██████████)
  const totalBlocks = 10;
  const filledBlocks = Math.round((integrity / 100) * totalBlocks);
  const emptyBlocks = totalBlocks - filledBlocks;
  const barString = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);

  const isLow = integrity < 30;
  const isMed = integrity >= 30 && integrity < 60;

  const barColor = isLow
    ? 'text-cyber-red glow-red-sm'
    : isMed
    ? 'text-cyber-yellow'
    : 'text-cyber-cyan glow-cyan-sm';

  const isThreatActive = enemyState === 'DETECT' || enemyState === 'CHASE' || enemyState === 'ATTACK';

  return (
    <div className="flex flex-col gap-1.5 font-mono pointer-events-none select-none">
      {/* System Integrity Bar */}
      <div className="p-3 bg-[#080C14]/90 border border-cyber-border/80 rounded shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between text-[10px] text-cyber-textMuted uppercase tracking-wider mb-1">
          <div className="flex items-center gap-1.5">
            {isLow ? (
              <ShieldAlert className="w-3.5 h-3.5 text-cyber-red animate-pulse" />
            ) : (
              <Shield className="w-3.5 h-3.5 text-cyber-cyan" />
            )}
            <span>SYSTEM INTEGRITY</span>
          </div>
          <span className={`font-bold font-mono text-xs ${barColor}`}>{integrity}%</span>
        </div>

        {/* ASCII Block Bar Display */}
        <div className={`font-mono text-xs tracking-widest ${barColor}`}>
          {barString}
        </div>
      </div>

      {/* Dynamic Enemy Threat Proximity Warning */}
      {isThreatActive && (
        <div
          className={`px-3 py-1.5 rounded border text-[11px] font-bold flex items-center justify-between gap-2 shadow-[0_0_25px_rgba(255,42,77,0.3)] ${
            enemyState === 'ATTACK'
              ? 'bg-cyber-red/20 border-cyber-red text-cyber-red animate-bounce'
              : enemyState === 'CHASE'
              ? 'bg-cyber-red/15 border-cyber-red/70 text-cyber-red animate-pulse'
              : 'bg-cyber-yellow/15 border-cyber-yellow/70 text-cyber-yellow'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>
              {enemyState === 'ATTACK'
                ? 'CRITICAL PROXIMITY // ATTACK'
                : enemyState === 'CHASE'
                ? 'THREAT PURSUIT // NULL_FRAGMENT'
                : 'THREAT DETECTED'}
            </span>
          </div>
          {enemyDistance < 50 && (
            <span className="text-[10px] font-mono text-white/90">
              {enemyDistance}m
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SystemIntegrityHUD;
