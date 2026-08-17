import React, { useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { BootPage } from './pages/Boot';
import { MenuPage } from './pages/Menu';
import { GamePage } from './pages/Game';

export type ScreenState = 'BOOT' | 'MENU' | 'GAME';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('BOOT');

  const handleBootComplete = useCallback(() => {
    setCurrentScreen('MENU');
  }, []);

  const handleStartGame = useCallback(() => {
    setCurrentScreen('GAME');
  }, []);

  const handleReturnToMenu = useCallback(() => {
    setCurrentScreen('MENU');
  }, []);

  const handleReboot = useCallback(() => {
    setCurrentScreen('BOOT');
  }, []);

  // Keyboard shortcut to return to menu from game
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentScreen === 'GAME') {
        setCurrentScreen('MENU');
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [currentScreen]);

  return (
    <div className="relative w-screen h-screen bg-[#05070B] overflow-hidden">
      <AnimatePresence mode="wait">
        {currentScreen === 'BOOT' && (
          <BootPage key="screen-boot" onComplete={handleBootComplete} />
        )}
        {currentScreen === 'MENU' && (
          <MenuPage
            key="screen-menu"
            onStartNewGame={handleStartGame}
            onReboot={handleReboot}
          />
        )}
        {currentScreen === 'GAME' && (
          <GamePage
            key="screen-game"
            onReturnToMenu={handleReturnToMenu}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
