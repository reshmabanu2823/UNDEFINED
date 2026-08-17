import React, { useState, useEffect } from 'react';

interface CorruptedTextProps {
  text: string;
  corruptionLevel?: number; // 0 - 100
  className?: string;
}

const GLITCH_CHARS = '01#@!§Øµ█▓░¿><_/*&';

export const CorruptedText: React.FC<CorruptedTextProps> = ({
  text,
  corruptionLevel = 21,
  className = '',
}) => {
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    // If corruption is low, glitch infrequently. If high, glitch more frequently
    const glitchProbability = (corruptionLevel / 100) * 0.25;

    const interval = setInterval(() => {
      if (Math.random() < glitchProbability) {
        const chars = text.split('');
        const corruptCount = Math.max(1, Math.floor(chars.length * (corruptionLevel / 100) * 0.2));

        for (let i = 0; i < corruptCount; i++) {
          const randIdx = Math.floor(Math.random() * chars.length);
          if (chars[randIdx] !== ' ') {
            chars[randIdx] = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
          }
        }
        setDisplayText(chars.join(''));

        // Restore quickly
        setTimeout(() => {
          setDisplayText(text);
        }, 120);
      }
    }, 400 - Math.min(250, corruptionLevel * 3));

    return () => clearInterval(interval);
  }, [text, corruptionLevel]);

  return <span className={className}>{displayText}</span>;
};

export default CorruptedText;
