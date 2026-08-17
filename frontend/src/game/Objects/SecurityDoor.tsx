import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore } from '../../stores/worldStore';

interface SecurityDoorProps {
  position: [number, number, number];
}

export const SecurityDoor: React.FC<SecurityDoorProps> = ({ position }) => {
  const door = useWorldStore((state) => state.door_01);
  const isUnlocked = !door.locked;

  const leftDoorRef = useRef<THREE.Mesh | null>(null);
  const rightDoorRef = useRef<THREE.Mesh | null>(null);
  const beaconRef = useRef<THREE.PointLight | null>(null);

  // Smoothly slide doors open when unlocked
  useFrame(({ clock }, delta) => {
    const targetLeftX = isUnlocked ? -1.5 : -0.55;
    const targetRightX = isUnlocked ? 1.5 : 0.55;

    if (leftDoorRef.current) {
      leftDoorRef.current.position.x = THREE.MathUtils.damp(
        leftDoorRef.current.position.x,
        targetLeftX,
        3.5,
        delta
      );
    }

    if (rightDoorRef.current) {
      rightDoorRef.current.position.x = THREE.MathUtils.damp(
        rightDoorRef.current.position.x,
        targetRightX,
        3.5,
        delta
      );
    }

    if (beaconRef.current) {
      const t = clock.getElapsedTime();
      beaconRef.current.intensity = isUnlocked
        ? 1.6 + Math.sin(t * 3.0) * 0.4
        : 1.0 + Math.sin(t * 5.0) * 0.8;
    }
  });

  return (
    <group position={position}>
      {/* Heavy Blast Door Outer Frame */}
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 3.6, 0.4]} />
        <meshStandardMaterial color="#0A0E17" roughness={0.3} metalness={0.9} />
      </mesh>

      {/* Door Cutout Inner Opening */}
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[2.2, 3.2, 0.45]} />
        <meshStandardMaterial color="#05070B" roughness={0.8} />
      </mesh>

      {/* Left Sliding Door Panel */}
      <mesh ref={leftDoorRef} position={[-0.55, 1.6, 0.05]} castShadow>
        <boxGeometry args={[1.05, 3.1, 0.15]} />
        <meshStandardMaterial
          color={isUnlocked ? '#0F2537' : '#101726'}
          roughness={0.35}
          metalness={0.9}
        />
      </mesh>

      {/* Right Sliding Door Panel */}
      <mesh ref={rightDoorRef} position={[0.55, 1.6, 0.05]} castShadow>
        <boxGeometry args={[1.05, 3.1, 0.15]} />
        <meshStandardMaterial
          color={isUnlocked ? '#0F2537' : '#101726'}
          roughness={0.35}
          metalness={0.9}
        />
      </mesh>

      {/* Central Hydraulic Seam / Glow Indicator */}
      <mesh position={[0, 1.6, 0.12]}>
        <boxGeometry args={[0.08, 3.0, 0.08]} />
        <meshStandardMaterial
          color={isUnlocked ? '#00F0FF' : '#FF2A4D'}
          emissive={isUnlocked ? '#00F0FF' : '#FF2A4D'}
          emissiveIntensity={isUnlocked ? 3.2 : 2.0}
        />
      </mesh>

      {/* Holographic Keypad Access Terminal (Right Wall) */}
      <group position={[1.45, 1.5, 0.2]}>
        <mesh>
          <boxGeometry args={[0.25, 0.4, 0.08]} />
          <meshStandardMaterial color="#080C14" metalness={0.9} />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[0.2, 0.32]} />
          <meshStandardMaterial
            color={isUnlocked ? '#00F0FF' : '#FF2A4D'}
            emissive={isUnlocked ? '#00F0FF' : '#FF2A4D'}
            emissiveIntensity={3.2}
          />
        </mesh>
      </group>

      {/* Overhead Beacon Light */}
      <mesh position={[0, 3.4, 0.25]}>
        <cylinderGeometry args={[0.1, 0.1, 0.12, 16]} />
        <meshStandardMaterial
          color={isUnlocked ? '#00F0FF' : '#FF2A4D'}
          emissive={isUnlocked ? '#00F0FF' : '#FF2A4D'}
          emissiveIntensity={3.5}
        />
      </mesh>

      <pointLight
        ref={beaconRef}
        position={[0, 3.3, 0.6]}
        color={isUnlocked ? '#00F0FF' : '#FF2A4D'}
        intensity={1.5}
        distance={4.5}
      />

      {/* Exit Area Beyond Door */}
      <group position={[0, 0, -4.0]}>
        <mesh position={[0, -0.05, 0]} receiveShadow>
          <planeGeometry args={[4, 6]} />
          <meshStandardMaterial color="#030508" metalness={0.9} />
        </mesh>
        <mesh position={[0, 2.0, -2.5]}>
          <cylinderGeometry args={[0.5, 0.5, 4.0, 16]} />
          <meshStandardMaterial
            color="#00F0FF"
            emissive="#00F0FF"
            emissiveIntensity={2.5}
            transparent
            opacity={0.85}
          />
        </mesh>
        <pointLight position={[0, 2.0, -2.0]} color="#00F0FF" intensity={2.5} distance={9.0} />
      </group>
    </group>
  );
};

export default SecurityDoor;
