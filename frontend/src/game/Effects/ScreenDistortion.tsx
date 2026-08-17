import React from 'react';

interface ScreenDistortionProps {
  corruptionLevel?: number;
  isBlackout?: boolean;
}

export const ScreenDistortion: React.FC<ScreenDistortionProps> = ({
  corruptionLevel = 21,
  isBlackout = false,
}) => {
  const noiseOpacity = 0.02 + (corruptionLevel / 100) * 0.05;

  return (
    <>
      {/* Blackout overlay (during power surge) */}
      <div
        className={`fixed inset-0 bg-[#000000] z-50 pointer-events-none transition-opacity duration-300 ${
          isBlackout ? 'opacity-95' : 'opacity-0'
        }`}
      />

      {/* CRT Vignette */}
      <div className="crt-overlay crt-vignette opacity-70 pointer-events-none" />

      {/* Dynamic Digital Noise Texture */}
      <div
        className="crt-overlay crt-noise pointer-events-none transition-opacity duration-500"
        style={{ opacity: noiseOpacity }}
      />
    </>
  );
};

export default ScreenDistortion;
