import React from 'react';
import { MainMenu } from '../../components/MainMenu';

export interface MenuPageProps {
  onStartNewGame?: () => void;
  onReboot?: () => void;
}

export const MenuPage: React.FC<MenuPageProps> = ({ onStartNewGame, onReboot }) => {
  return <MainMenu onStartNewGame={onStartNewGame} onReboot={onReboot} />;
};

export default MenuPage;
