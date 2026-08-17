// State stores (Zustand / Redux / Context stores)
export interface GameStoreState {
  currentPage: 'boot' | 'menu' | 'game' | 'failure';
  isPaused: boolean;
}

export const initialGameState: GameStoreState = {
  currentPage: 'boot',
  isPaused: false,
};
