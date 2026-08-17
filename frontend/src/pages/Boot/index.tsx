import React from 'react';
import { BootScreen } from '../../components/BootScreen';

export interface BootPageProps {
  onComplete: () => void;
}

export const BootPage: React.FC<BootPageProps> = ({ onComplete }) => {
  return <BootScreen onComplete={onComplete} />;
};

export default BootPage;
