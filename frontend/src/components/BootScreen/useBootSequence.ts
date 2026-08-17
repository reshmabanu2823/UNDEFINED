import { useState, useEffect, useCallback, useRef } from 'react';
import { DiagnosticItem, BootStage } from './types';
import { soundEngine } from '../../services/soundEngine';

const DIAGNOSTIC_SEQUENCE: DiagnosticItem[] = [
  {
    id: 'init',
    label: 'SYSTEM INITIALIZING...',
    dots: '',
    statusText: '',
    status: 'INFO',
    typeDelayMs: 25,
    pauseAfterMs: 300,
  },
  {
    id: 'memory',
    label: 'MEMORY CHECK',
    dots: '.............',
    statusText: ' OK',
    status: 'OK',
    typeDelayMs: 20,
    pauseAfterMs: 220,
  },
  {
    id: 'network',
    label: 'NETWORK',
    dots: '.................',
    statusText: ' CONNECTED',
    status: 'OK',
    typeDelayMs: 20,
    pauseAfterMs: 220,
  },
  {
    id: 'security',
    label: 'SECURITY',
    dots: '................',
    statusText: ' WARNING',
    status: 'WARNING',
    typeDelayMs: 20,
    pauseAfterMs: 350,
    highlightRed: true,
  },
  {
    id: 'corruption',
    label: 'CORRUPTION',
    dots: '..............',
    statusText: ' DETECTED',
    status: 'ERROR',
    typeDelayMs: 22,
    pauseAfterMs: 500,
    highlightRed: true,
  },
];

export function useBootSequence(onComplete: () => void) {
  const [stage, setStage] = useState<BootStage>('POWER_ON');
  const [completedLines, setCompletedLines] = useState<DiagnosticItem[]>([]);
  const [currentTypingText, setCurrentTypingText] = useState<string>('');
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(-1);
  const [isGlitching, setIsGlitching] = useState<boolean>(false);
  const [telemetryTicks, setTelemetryTicks] = useState<number>(0);
  const [soundMuted, setSoundMuted] = useState<boolean>(false);

  const isTransitioningRef = useRef(false);

  // Toggle sound
  const toggleSound = useCallback(() => {
    setSoundMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  // Handle user progression (Enter, Space, or Click)
  const proceed = useCallback(() => {
    if (stage === 'READY_TO_CONTINUE' && !isTransitioningRef.current) {
      isTransitioningRef.current = true;
      setStage('TRANSITIONING');
      soundEngine.playBootTransition();
      
      setTimeout(() => {
        onComplete();
      }, 750);
    }
  }, [stage, onComplete]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stage === 'READY_TO_CONTINUE') {
        if (e.key === 'Enter' || e.key === ' ' || e.key.length === 1) {
          proceed();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage, proceed]);

  // Telemetry tick effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetryTicks((t) => (t + 1) % 10000);
    }, 120);
    return () => clearInterval(interval);
  }, []);

  // Initial power on delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setStage('RUNNING_DIAGNOSTICS');
      setCurrentLineIndex(0);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  // Sequential typing of diagnostic items
  useEffect(() => {
    if (stage !== 'RUNNING_DIAGNOSTICS' || currentLineIndex < 0) return;

    if (currentLineIndex >= DIAGNOSTIC_SEQUENCE.length) {
      // Diagnostic checks finished -> Anomaly Reveal
      const timer = setTimeout(() => {
        setStage('ANOMALY_REVEAL');
        setIsGlitching(true);
        soundEngine.playGlitch();

        setTimeout(() => {
          setIsGlitching(false);
          setStage('READY_TO_CONTINUE');
        }, 600);
      }, 350);

      return () => clearTimeout(timer);
    }

    const currentItem = DIAGNOSTIC_SEQUENCE[currentLineIndex];
    const fullLineStr = currentItem.label + currentItem.dots;
    let charIdx = 0;
    setCurrentTypingText('');

    const charTimer = setInterval(() => {
      charIdx++;
      setCurrentTypingText(fullLineStr.slice(0, charIdx));
      soundEngine.playKeyTick();

      if (charIdx >= fullLineStr.length) {
        clearInterval(charTimer);

        // Status reveal delay
        setTimeout(() => {
          if (currentItem.highlightRed) {
            soundEngine.playWarning();
          } else {
            soundEngine.playSystemLine();
          }

          setCompletedLines((prev) => [...prev, currentItem]);
          setCurrentTypingText('');

          // Move to next line
          setTimeout(() => {
            setCurrentLineIndex((prev) => prev + 1);
          }, currentItem.pauseAfterMs);
        }, 120);
      }
    }, currentItem.typeDelayMs);

    return () => clearInterval(charTimer);
  }, [stage, currentLineIndex]);

  return {
    stage,
    completedLines,
    currentTypingText,
    isGlitching,
    telemetryTicks,
    proceed,
    soundMuted,
    toggleSound,
    isReady: stage === 'READY_TO_CONTINUE',
    isTransitioning: stage === 'TRANSITIONING',
  };
}
