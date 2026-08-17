export interface GameObject {
  id: string;
  type: string;
  position: { x: number; y: number; z?: number };
  interactive: boolean;
}

export class ObjectManager {
  private objects: Map<string, GameObject> = new Map();

  addObject(obj: GameObject) {
    this.objects.set(obj.id, obj);
  }

  getObject(id: string): GameObject | undefined {
    return this.objects.get(id);
  }
}
