import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NullFragmentAI } from './NullFragmentAI';
import { useWorldStore } from '../../stores/worldStore';

interface NullFragmentProps {
  initialPosition?: [number, number, number];
}

export const NullFragment: React.FC<NullFragmentProps> = ({
  initialPosition = [0, 1.2, -6.5],
}) => {
  const groupRef = useRef<THREE.Group | null>(null);
  const coreRef = useRef<THREE.Mesh | null>(null);
  const fragmentsRef = useRef<THREE.Group | null>(null);
  const pointLightRef = useRef<THREE.PointLight | null>(null);

  // Instantiated AI Controller
  const ai = useMemo(() => new NullFragmentAI(initialPosition), [initialPosition]);

  // Fragment orbit angles
  const fragments = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      radius: 0.4 + Math.random() * 0.45,
      speed: (Math.random() - 0.5) * 4.0,
      yOffset: (Math.random() - 0.5) * 0.9,
      size: 0.04 + Math.random() * 0.05,
      color: i % 3 === 0 ? '#FF2A4D' : i % 2 === 0 ? '#00F0FF' : '#9D00FF',
    }));
  }, []);

  useFrame(({ clock }, delta) => {
    const playerPos = useWorldStore.getState().playerPosition;
    const isSystemFailure = useWorldStore.getState().isSystemFailure;

    if (isSystemFailure) return;

    // 1. Update State Machine
    const { state, position, rotationY, isAttacking } = ai.update(delta, playerPos);

    if (groupRef.current) {
      const t = clock.getElapsedTime();

      // Floating hover bobbing motion
      const hoverY = position.y + Math.sin(t * 3.5) * 0.1;
      groupRef.current.position.set(position.x, hoverY, position.z);
      groupRef.current.rotation.y = rotationY;

      // Glitch twitch when chasing / attacking
      if (state === 'CHASE' || state === 'ATTACK') {
        groupRef.current.position.x += (Math.random() - 0.5) * 0.04;
        groupRef.current.position.z += (Math.random() - 0.5) * 0.04;
      }
    }

    // 2. Rotate Digital Floating Fragments
    if (fragmentsRef.current) {
      const t = clock.getElapsedTime();
      fragmentsRef.current.rotation.y = t * 1.5;
      fragmentsRef.current.rotation.x = Math.sin(t * 0.8) * 0.3;
    }

    // 3. Dynamic Aura Light & Corruption Surge
    if (pointLightRef.current) {
      const isAggro = state === 'CHASE' || state === 'ATTACK';
      pointLightRef.current.color.set(isAggro ? '#FF2A4D' : '#9D00FF');
      pointLightRef.current.intensity = isAttacking ? 4.5 : isAggro ? 2.5 : 1.2;
    }
  });

  return (
    <group ref={groupRef} position={initialPosition}>
      {/* Head */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <boxGeometry args={[0.26, 0.28, 0.26]} />
        <meshStandardMaterial
          color="#050811"
          emissive="#FF2A4D"
          emissiveIntensity={1.8}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {/* Torso */}
      <mesh ref={coreRef} position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.34, 0.6, 0.22]} />
        <meshStandardMaterial
          color="#030509"
          emissive="#9D00FF"
          emissiveIntensity={1.5}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Floating Arm Fragments (Left & Right) */}
      <mesh position={[-0.32, 0.2, 0]}>
        <boxGeometry args={[0.1, 0.45, 0.1]} />
        <meshStandardMaterial color="#0A0E17" emissive="#00F0FF" emissiveIntensity={2.0} />
      </mesh>
      <mesh position={[0.32, 0.2, 0]}>
        <boxGeometry args={[0.1, 0.45, 0.1]} />
        <meshStandardMaterial color="#0A0E17" emissive="#00F0FF" emissiveIntensity={2.0} />
      </mesh>

      {/* Floating Digital Orbit Fragments */}
      <group ref={fragmentsRef}>
        {fragments.map((frag) => (
          <mesh
            key={frag.id}
            position={[
              Math.cos(frag.radius * 4) * frag.radius,
              frag.yOffset,
              Math.sin(frag.radius * 4) * frag.radius,
            ]}
          >
            <boxGeometry args={[frag.size, frag.size, frag.size]} />
            <meshStandardMaterial
              color={frag.color}
              emissive={frag.color}
              emissiveIntensity={3.5}
            />
          </mesh>
        ))}
      </group>

      {/* Digital Base Ground Shadow Aura */}
      <mesh position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.45, 16]} />
        <meshStandardMaterial
          color="#000000"
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Dynamic Light Aura */}
      <pointLight ref={pointLightRef} position={[0, 0.4, 0]} distance={4.5} intensity={1.5} />
    </group>
  );
};

export default NullFragment;
