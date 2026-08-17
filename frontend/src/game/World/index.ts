export interface WorldConfig {
  id: string;
  name: string;
  gravity?: number;
  bounds?: { width: number; height: number };
}

export class World {
  config: WorldConfig;

  constructor(config?: Partial<WorldConfig>) {
    this.config = {
      id: 'world_sector_0',
      name: 'Default Sector',
      gravity: 9.8,
      bounds: { width: 1920, height: 1080 },
      ...config,
    };
  }
}
