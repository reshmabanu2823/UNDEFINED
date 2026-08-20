import React from 'react';
import { useWorldStore } from '../../stores/worldStore';
import { Shield, ShieldAlert, AlertTriangle, Zap } from 'lucide-react';

export const SystemIntegrityHUD: React.FC = () => {
  const integrity = useWorldStore((state) => state.playerIntegrity);
  const corruptionLevel = useWorldStore((state) => state.corruptionLevel);
  const enemyState = useWorldStore((state) => state.enemyState);
  const enemyDistance = useWorldStore((state) => state.enemyDistance);

  // Generate 12-segment high-tech status bar
  const totalSegments = 12;
  const activeSegments = Math.round((integrity / 100) * totalSegments);

  const isLow = integrity < 30;
  const isMed = integrity >= 30 && integrity < 60;

  const statusColor = isLow
    ? 'text-cyber-red glow-red-sm'
    : isMed
    ? 'text-cyber-yellow'
    : 'text-cyber-cyan glow-cyan-sm';

  const isThreatActive = enemyState === 'DETECT' || enemyState === 'CHASE' || enemyState === 'ATTACK';

  return (
    <div className="flex flex-col gap-2 font-mono pointer-events-none select-none max-w-xs w-72">
      {/* System Integrity HUD Box */}
      <div className="p-3 bg-[#080C14]/92 border border-cyber-cyan/35 rounded-lg shadow-[0_0_25px_rgba(0,240,255,0.12)] backdrop-blur-md">
        <div className="flex items-center justify-between text-[10px] text-cyber-textMuted uppercase tracking-wider mb-1.5">
          <div className="flex items-center gap-1.5">
            {isLow ? (
              <ShieldAlert className="w-3.5 h-3.5 text-cyber-red animate-pulse" />
            ) : (
              <Shield className="w-3.5 h-3.5 text-cyber-cyan" />
            )}
            <span className="font-bold">SYSTEM INTEGRITY</span>
          </div>
          <span className={`font-bold font-mono text-xs ${statusColor}`}>{integrity}%</span>
        </div>

        {/* Segmented Neon Bar */}
        <div className="grid grid-cols-12 gap-1 h-2 my-1">
          {Array.from({ length: totalSegments }).map((_, i) => {
            const isFilled = i < activeSegments;
            return (
              <div
                key={i}
                className={`h-full rounded-sm transition-all duration-300 ${
                  isFilled
                    ? isLow
                      ? 'bg-cyber-red shadow-[0_0_6px_#FF2A4D]'
                      : isMed
                      ? 'bg-cyber-yellow shadow-[0_0_6px_#FFD60A]'
                      : 'bg-cyber-cyan shadow-[0_0_6px_#00F0FF]'
                    : 'bg-cyber-surfaceAlt/60 border border-cyber-border/40'
                }`}
              />
            );
          })}
        </div>

        {/* Secondary Telemetry: Corruption Bar */}
        <div className="mt-2 pt-1.5 border-t border-cyber-border/40 flex items-center justify-between text-[10px] text-cyber-textMuted">
          <div className="flex items-center gap-1">
            <Zap className={`w-3 h-3 ${corruptionLevel > 50 ? 'text-cyber-red' : 'text-cyber-yellow'}`} />
            <span>CORRUPTION INDEX:</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-cyber-surfaceAlt rounded-full overflow-hidden border border-cyber-border/50">
              <div
                className={`h-full transition-all duration-300 ${
                  corruptionLevel > 50
                    ? 'bg-gradient-to-r from-cyber-purple to-cyber-red'
                    : 'bg-gradient-to-r from-cyber-cyan to-cyber-yellow'
                }`}
                style={{ width: `${Math.min(100, corruptionLevel)}%` }}
              />
            </div>
            <span className={`font-bold text-[10px] ${corruptionLevel > 50 ? 'text-cyber-red' : 'text-cyber-yellow'}`}>
              {corruptionLevel}%
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Threat Proximity Banner */}
      {isThreatActive && (
        <div
          className={`px-3 py-2 rounded-lg border text-[11px] font-bold flex items-center justify-between gap-2 backdrop-blur-md shadow-[0_0_30px_rgba(255,42,77,0.35)] ${
            enemyState === 'ATTACK'
              ? 'bg-cyber-red/25 border-cyber-red text-cyber-red animate-bounce'
              : enemyState === 'CHASE'
              ? 'bg-cyber-red/20 border-cyber-red/80 text-cyber-red animate-pulse'
              : 'bg-cyber-yellow/20 border-cyber-yellow/80 text-cyber-yellow'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="tracking-wide">
              {enemyState === 'ATTACK'
                ? 'CRITICAL PROXIMITY // ATTACK'
                : enemyState === 'CHASE'
                ? 'THREAT PURSUIT // NULL_FRAGMENT'
                : 'THREAT DETECTED'}
            </span>
          </div>
          {enemyDistance < 50 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 border border-current">
              {enemyDistance}m
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SystemIntegrityHUD;
