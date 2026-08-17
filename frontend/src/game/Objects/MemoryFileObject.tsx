import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MemoryFileObjectProps {
  position?: [number, number, number];
}

export const MemoryFileObject: React.FC<MemoryFileObjectProps> = ({
  position = [0, 0, 0],
}) => {
  const crystalRef = useRef<THREE.Mesh | null>(null);
  const ringRef = useRef<THREE.Mesh | null>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (crystalRef.current) {
      crystalRef.current.rotation.y = t * 1.2;
      crystalRef.current.rotation.x = Math.sin(t * 0.8) * 0.2;
      crystalRef.current.position.y = 0.15 + Math.sin(t * 2.0) * 0.04;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = -t * 1.5;
    }
  });

  return (
    <group position={position}>
      {/* Datapad Base */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.3, 0.04, 0.24]} />
        <meshStandardMaterial color="#0A0E17" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Floating Holographic Memory Crystal */}
      <mesh ref={crystalRef} position={[0, 0.15, 0]}>
        <octahedronGeometry args={[0.09, 0]} />
        <meshStandardMaterial
          color="#9d4edd"
          emissive="#9d4edd"
          emissiveIntensity={2.5}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* Holographic Gyro Ring */}
      <mesh ref={ringRef} position={[0, 0.15, 0]} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[0.13, 0.008, 8, 24]} />
        <meshStandardMaterial
          color="#00F0FF"
          emissive="#00F0FF"
          emissiveIntensity={2.0}
        />
      </mesh>

      <pointLight position={[0, 0.2, 0]} color="#9d4edd" intensity={0.6} distance={1.8} />
    </group>
  );
};

export default MemoryFileObject;
