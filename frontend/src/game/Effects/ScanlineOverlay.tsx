import React from 'react';

interface ScanlineOverlayProps {
  corruptionLevel?: number;
}

export const ScanlineOverlay: React.FC<ScanlineOverlayProps> = ({ corruptionLevel = 21 }) => {
  // Compute normalized intensity
  const opacity = 0.2 + (corruptionLevel / 100) * 0.25;

  return (
    <div
      className="crt-overlay crt-scanlines pointer-events-none transition-opacity duration-500"
      style={{ opacity }}
    />
  );
};

export default ScanlineOverlay;
