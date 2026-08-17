import React from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SecurityDoorProps {
  position: [number, number, number];
}

export const SecurityDoor: React.FC<SecurityDoorProps> = ({ position }) => {
  const beaconRef = React.useRef<THREE.PointLight | null>(null);

  // Pulse red beacon light
  useFrame(({ clock }) => {
    if (beaconRef.current) {
      const t = clock.getElapsedTime();
      beaconRef.current.intensity = 1.0 + Math.sin(t * 5.0) * 0.8;
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

      {/* Left Door Panel */}
      <mesh position={[-0.55, 1.6, 0.05]} castShadow>
        <boxGeometry args={[1.05, 3.1, 0.15]} />
        <meshStandardMaterial color="#101726" roughness={0.4} metalness={0.85} />
      </mesh>

      {/* Right Door Panel */}
      <mesh position={[0.55, 1.6, 0.05]} castShadow>
        <boxGeometry args={[1.05, 3.1, 0.15]} />
        <meshStandardMaterial color="#101726" roughness={0.4} metalness={0.85} />
      </mesh>

      {/* Central Locking Hydraulic Seam */}
      <mesh position={[0, 1.6, 0.12]}>
        <boxGeometry args={[0.08, 3.0, 0.08]} />
        <meshStandardMaterial
          color="#FF2A4D"
          emissive="#FF2A4D"
          emissiveIntensity={2.0}
        />
      </mesh>

      {/* Holographic Red Keypad Access Terminal (Right Wall) */}
      <group position={[1.45, 1.5, 0.2]}>
        {/* Terminal Box */}
        <mesh>
          <boxGeometry args={[0.25, 0.4, 0.08]} />
          <meshStandardMaterial color="#080C14" metalness={0.9} />
        </mesh>
        {/* Holographic Glowing Display */}
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[0.2, 0.32]} />
          <meshStandardMaterial
            color="#FF2A4D"
            emissive="#FF2A4D"
            emissiveIntensity={3.0}
          />
        </mesh>
      </group>

      {/* Overhead Red Warning Beacon */}
      <mesh position={[0, 3.4, 0.25]}>
        <cylinderGeometry args={[0.1, 0.1, 0.12, 16]} />
        <meshStandardMaterial
          color="#FF2A4D"
          emissive="#FF2A4D"
          emissiveIntensity={3.5}
        />
      </mesh>

      <pointLight
        ref={beaconRef}
        position={[0, 3.3, 0.6]}
        color="#FF2A4D"
        intensity={1.5}
        distance={4.0}
      />

      {/* Visible Exit Area Beyond Locked Door (Seen through grating/opening) */}
      <group position={[0, 0, -4.0]}>
        {/* Exit Area Distant Floor */}
        <mesh position={[0, -0.05, 0]} receiveShadow>
          <planeGeometry args={[4, 6]} />
          <meshStandardMaterial color="#030508" metalness={0.9} />
        </mesh>
        {/* Distant Quantum Core Pillar / Exit Light */}
        <mesh position={[0, 2.0, -2.5]}>
          <cylinderGeometry args={[0.5, 0.5, 4.0, 16]} />
          <meshStandardMaterial
            color="#00F0FF"
            emissive="#00F0FF"
            emissiveIntensity={1.5}
            transparent
            opacity={0.7}
          />
        </mesh>
        <pointLight position={[0, 2.0, -2.0]} color="#00F0FF" intensity={2.0} distance={8.0} />
      </group>
    </group>
  );
};

export default SecurityDoor;
