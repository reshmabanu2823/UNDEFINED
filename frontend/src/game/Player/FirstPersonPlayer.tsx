import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { usePlayerControls } from './usePlayerControls';
import { useWorldStore } from '../../stores/worldStore';

interface FirstPersonPlayerProps {
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
}

export const FirstPersonPlayer: React.FC<FirstPersonPlayerProps> = ({
  isLocked,
  setIsLocked,
}) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const movement = usePlayerControls();

  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());

  // Spawn position inside the starting area of the server room
  useEffect(() => {
    camera.position.set(0, 1.65, 7.5);
    camera.rotation.set(0, 0, 0);
  }, [camera]);

  const isGameplayFrozen = useWorldStore((state) => state.isGameplayFrozen);
  const isBlackout = useWorldStore((state) => state.isBlackout);

  useFrame((_, delta) => {
    if (!isLocked || isGameplayFrozen || isBlackout) return;

    const baseSpeed = movement.sprint ? 7.5 : 4.5;
    const friction = 10.0;

    // Dampen previous velocity
    velocity.current.x -= velocity.current.x * friction * delta;
    velocity.current.z -= velocity.current.z * friction * delta;

    // Movement directions
    direction.current.z = Number(movement.forward) - Number(movement.backward);
    direction.current.x = Number(movement.right) - Number(movement.left);
    direction.current.normalize();

    if (movement.forward || movement.backward) {
      velocity.current.z -= direction.current.z * baseSpeed * 10.0 * delta;
    }
    if (movement.left || movement.right) {
      velocity.current.x -= direction.current.x * baseSpeed * 10.0 * delta;
    }

    // Move camera relative to direction
    if (controlsRef.current) {
      controlsRef.current.moveRight(-velocity.current.x * delta);
      controlsRef.current.moveForward(-velocity.current.z * delta);
    }

    // Lock camera height (eye-level)
    camera.position.y = 1.65;

    // Environment Collision Bounding Boxes
    const isDoorLocked = useWorldStore.getState().door_01.locked;
    const pos = camera.position;

    if (pos.z > -2.0) {
      // Inside Main Room
      pos.x = Math.max(-5.3, Math.min(5.3, pos.x));
      pos.z = Math.max(-2.0, Math.min(8.6, pos.z));
    } else {
      // Inside Corridor
      pos.x = Math.max(-1.6, Math.min(1.6, pos.x));
      // If locked, stop at door (-11.2). If unlocked, allow walking through into exit area (-15.2)
      const minZ = isDoorLocked ? -11.2 : -15.2;
      pos.z = Math.max(minZ, Math.min(-2.0, pos.z));
    }

    // Sync position to world store
    useWorldStore.getState().setPlayerPosition({
      x: Number(camera.position.x.toFixed(2)),
      y: Number(camera.position.y.toFixed(2)),
      z: Number(camera.position.z.toFixed(2)),
    });
  });

  return (
    <PointerLockControls
      ref={controlsRef}
      onLock={() => setIsLocked(true)}
      onUnlock={() => setIsLocked(false)}
    />
  );
};

export default FirstPersonPlayer;
