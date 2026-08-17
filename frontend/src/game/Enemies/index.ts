export interface Enemy {
  id: string;
  type: string;
  health: number;
  damage: number;
  position: { x: number; y: number; z?: number };
}

export class EnemyManager {
  private enemies: Map<string, Enemy> = new Map();

  addEnemy(enemy: Enemy) {
    this.enemies.set(enemy.id, enemy);
  }

  getEnemy(id: string): Enemy | undefined {
    return this.enemies.get(id);
  }
}
