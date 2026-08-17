import { useState, useCallback } from 'react';

export type AppScreen = 'BOOT' | 'MENU' | 'GAME';

export function useAppNavigation(initialScreen: AppScreen = 'BOOT') {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(initialScreen);

  const goToBoot = useCallback(() => setCurrentScreen('BOOT'), []);
  const goToMenu = useCallback(() => setCurrentScreen('MENU'), []);
  const goToGame = useCallback(() => setCurrentScreen('GAME'), []);

  return {
    currentScreen,
    goToBoot,
    goToMenu,
    goToGame,
    setScreen: setCurrentScreen,
  };
}
