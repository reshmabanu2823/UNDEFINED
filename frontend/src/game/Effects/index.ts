export interface Effect {
  id: string;
  type: string;
  duration: number;
}

export class EffectManager {
  private activeEffects: Effect[] = [];

  trigger(effect: Effect) {
    this.activeEffects.push(effect);
  }
}
