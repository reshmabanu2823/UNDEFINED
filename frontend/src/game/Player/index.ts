export interface PlayerState {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  position: { x: number; y: number; z?: number };
}

export class Player {
  state: PlayerState;

  constructor(initialState?: Partial<PlayerState>) {
    this.state = {
      id: 'player_01',
      name: 'Player',
      health: 100,
      maxHealth: 100,
      position: { x: 0, y: 0, z: 0 },
      ...initialState,
    };
  }
}
