import React, { useState, useEffect } from 'react';

interface GlitchOverlayProps {
  corruptionLevel?: number;
}

export const GlitchOverlay: React.FC<GlitchOverlayProps> = ({ corruptionLevel = 21 }) => {
  const [glitchActive, setGlitchActive] = useState(false);
  const [sliceOffset, setSliceOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Frequency of glitch twitch scales with corruption
    const intervalMs = Math.max(300, 2500 - corruptionLevel * 25);

    const interval = setInterval(() => {
      if (Math.random() < corruptionLevel / 100) {
        setGlitchActive(true);
        setSliceOffset({
          x: (Math.random() - 0.5) * (corruptionLevel > 50 ? 8 : 3),
          y: (Math.random() - 0.5) * (corruptionLevel > 50 ? 6 : 2),
        });

        setTimeout(() => {
          setGlitchActive(false);
        }, 100 + Math.random() * 80);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [corruptionLevel]);

  if (!glitchActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden mix-blend-screen opacity-70">
      {/* Red Aberration Channel */}
      <div
        className="absolute inset-0 bg-[#FF2A4D]/10"
        style={{
          transform: `translate(${sliceOffset.x}px, ${sliceOffset.y}px)`,
        }}
      />
      {/* Cyan Aberration Channel */}
      <div
        className="absolute inset-0 bg-[#00F0FF]/10"
        style={{
          transform: `translate(${-sliceOffset.x}px, ${-sliceOffset.y}px)`,
        }}
      />
      {/* Corrupted Horizontal Scan Slice */}
      <div
        className="absolute w-full bg-cyber-red/20 border-t border-b border-cyber-red/40"
        style={{
          top: `${Math.random() * 80}%`,
          height: `${Math.random() * 40 + 15}px`,
          transform: `translateX(${sliceOffset.x * 2}px)`,
        }}
      />
    </div>
  );
};

export default GlitchOverlay;
