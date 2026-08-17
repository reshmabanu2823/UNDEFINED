import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore } from '../../stores/worldStore';

interface NullEntitySilhouetteProps {
  position?: [number, number, number];
}

export const NullEntitySilhouette: React.FC<NullEntitySilhouetteProps> = ({
  position = [0, 1.6, -7.5],
}) => {
  const isVisible = useWorldStore((state) => state.nullEntityVisible);
  const groupRef = useRef<THREE.Group | null>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    if (isVisible) {
      // Glitch twitching jitter
      groupRef.current.position.x = (Math.random() - 0.5) * 0.15;
      groupRef.current.position.y = 1.6 + Math.sin(t * 8.0) * 0.05;
      groupRef.current.scale.setScalar(1 + (Math.random() - 0.5) * 0.08);
    }
  });

  if (!isVisible) return null;

  return (
    <group ref={groupRef} position={position}>
      {/* Head */}
      <mesh position={[0, 0.75, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial
          color="#000000"
          emissive="#FF2A4D"
          emissiveIntensity={1.8}
          transparent
          opacity={0.85}
          roughness={0.2}
        />
      </mesh>

      {/* Torso */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.2, 0.28, 0.8, 16]} />
        <meshStandardMaterial
          color="#05070B"
          emissive="#9D00FF"
          emissiveIntensity={1.5}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Holographic Glitch Rings */}
      <mesh position={[0, 0.4, 0]} rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[0.35, 0.02, 8, 24]} />
        <meshStandardMaterial
          color="#00F0FF"
          emissive="#00F0FF"
          emissiveIntensity={3.0}
          transparent
          opacity={0.7}
        />
      </mesh>

      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 5, 0, 0]}>
        <torusGeometry args={[0.4, 0.02, 8, 24]} />
        <meshStandardMaterial
          color="#FF2A4D"
          emissive="#FF2A4D"
          emissiveIntensity={3.0}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Shadow Aura Light */}
      <pointLight position={[0, 0.5, 0]} color="#FF2A4D" intensity={2.5} distance={5.0} />
    </group>
  );
};

export default NullEntitySilhouette;
