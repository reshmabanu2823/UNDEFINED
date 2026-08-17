import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { InteractableType, interactionManager } from '../../stores/interactionStore';

interface InteractableProps {
  id: string;
  type: InteractableType;
  position?: [number, number, number];
  rotation?: [number, number, number];
  hitboxSize?: [number, number, number];
  hitboxOffset?: [number, number, number];
  children: React.ReactNode;
}

export const Interactable: React.FC<InteractableProps> = ({
  id,
  type,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  hitboxSize = [1.2, 2.0, 1.2],
  hitboxOffset = [0, 1.0, 0],
  children,
}) => {
  const groupRef = useRef<THREE.Group | null>(null);
  const ringRef = useRef<THREE.Mesh | null>(null);

  useFrame(({ clock }) => {
    const isTargeted = interactionManager.getTargeted()?.id === id;
    if (ringRef.current) {
      ringRef.current.visible = isTargeted;
      if (isTargeted) {
        const t = clock.getElapsedTime();
        ringRef.current.rotation.y = t * 1.5;
        (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.5 + Math.sin(t * 4.0) * 0.3;
      }
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Invisible Interactive Hitbox for Raycaster Detection */}
      <mesh
        position={hitboxOffset}
        userData={{ isInteractable: true, interactableId: id, interactableType: type }}
        visible={false}
      >
        <boxGeometry args={hitboxSize} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Target Focus Hologram Ring (shown when player aims at this object) */}
      <mesh
        ref={ringRef}
        position={[hitboxOffset[0], hitboxOffset[1] + hitboxSize[1] / 2 + 0.15, hitboxOffset[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      >
        <ringGeometry args={[0.25, 0.3, 16]} />
        <meshBasicMaterial
          color={type === 'DOOR' ? '#FF2A4D' : '#00F0FF'}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Actual Object Children Mesh */}
      {children}
    </group>
  );
};

export default Interactable;
