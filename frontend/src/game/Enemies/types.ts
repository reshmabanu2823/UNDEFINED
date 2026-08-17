export type EnemyState = 'IDLE' | 'DETECT' | 'CHASE' | 'ATTACK' | 'LOST';

export interface EnemyConfig {
  id: string;
  name: string;
  speed: number;
  detectDistance: number;
  attackDistance: number;
  lostDistance: number;
  attackDamage: number;
  attackCooldownMs: number;
}

export const DEFAULT_NULL_FRAGMENT_CONFIG: EnemyConfig = {
  id: 'null_fragment_01',
  name: 'NULL_FRAGMENT',
  speed: 2.4,
  detectDistance: 8.0,
  attackDistance: 1.7,
  lostDistance: 12.0,
  attackDamage: 15,
  attackCooldownMs: 1200,
};
