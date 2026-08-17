import { useEffect } from 'react';

export function useGameLoop(callback: (delta: number) => void, active: boolean = true) {
  useEffect(() => {
    if (!active) return;
    let lastTime = performance.now();
    let frameId: number;

    const loop = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      callback(delta);
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [callback, active]);
}
