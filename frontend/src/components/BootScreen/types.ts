export type DiagnosticStatus = 'INFO' | 'OK' | 'WARNING' | 'ERROR' | 'ANOMALY';

export interface DiagnosticItem {
  id: string;
  label: string;
  dots: string;
  statusText: string;
  status: DiagnosticStatus;
  typeDelayMs: number;
  pauseAfterMs: number;
  highlightRed?: boolean;
}

export type BootStage = 
  | 'POWER_ON'
  | 'INITIALIZING'
  | 'RUNNING_DIAGNOSTICS'
  | 'ANOMALY_REVEAL'
  | 'READY_TO_CONTINUE'
  | 'TRANSITIONING';

export interface BootScreenProps {
  onComplete: () => void;
  allowSkip?: boolean;
}
