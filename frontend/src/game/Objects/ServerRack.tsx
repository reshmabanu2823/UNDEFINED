import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ServerRackProps {
  position: [number, number, number];
  rotation?: [number, number, number];
}

export const ServerRack: React.FC<ServerRackProps> = ({ position, rotation = [0, 0, 0] }) => {
  const ledRef = React.useRef<THREE.InstancedMesh | null>(null);

  // Generate random blink offsets for LED indicators
  const ledData = useMemo(() => {
    const data = [];
    const rows = 12;
    const cols = 4;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isCyan = Math.random() > 0.35;
        const isRed = !isCyan && Math.random() > 0.5;
        data.push({
          x: (c - 1.5) * 0.14,
          y: (r - 5.5) * 0.22,
          z: 0.46,
          color: isRed ? new THREE.Color('#FF2A4D') : isCyan ? new THREE.Color('#00F0FF') : new THREE.Color('#9d4edd'),
          blinkSpeed: Math.random() * 4 + 2,
          blinkPhase: Math.random() * Math.PI * 2,
        });
      }
    }
    return data;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    if (!ledRef.current) return;
    const time = clock.getElapsedTime();

    ledData.forEach((led, i) => {
      dummy.position.set(led.x, led.y, led.z);
      const intensity = Math.sin(time * led.blinkSpeed + led.blinkPhase) > 0.2 ? 1 : 0.15;
      dummy.scale.set(intensity, intensity, intensity);
      dummy.updateMatrix();
      ledRef.current!.setMatrixAt(i, dummy.matrix);
    });
    ledRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Outer Metallic Frame */}
      <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 2.8, 0.9]} />
        <meshStandardMaterial
          color="#0A0E17"
          roughness={0.4}
          metalness={0.85}
        />
      </mesh>

      {/* Front Recessed Server Bay */}
      <mesh position={[0, 1.4, 0.05]}>
        <boxGeometry args={[0.78, 2.68, 0.82]} />
        <meshStandardMaterial
          color="#05070B"
          roughness={0.7}
          metalness={0.9}
        />
      </mesh>

      {/* Top Emissive Server Status Strip */}
      <mesh position={[0, 2.65, 0.44]}>
        <boxGeometry args={[0.65, 0.04, 0.02]} />
        <meshStandardMaterial
          color="#00F0FF"
          emissive="#00F0FF"
          emissiveIntensity={2.5}
        />
      </mesh>

      {/* Internal Stacked Blade Dividers */}
      {[...Array(11)].map((_, i) => (
        <mesh key={i} position={[0, 0.25 + i * 0.22, 0.44]}>
          <boxGeometry args={[0.72, 0.02, 0.02]} />
          <meshStandardMaterial color="#152238" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}

      {/* Instanced Server LED Lights */}
      <instancedMesh
        ref={ledRef}
        args={[undefined, undefined, ledData.length]}
        position={[0, 1.4, 0]}
      >
        <boxGeometry args={[0.03, 0.03, 0.03]} />
        <meshBasicMaterial color="#00F0FF" />
      </instancedMesh>

      {/* Subtle point light in front of rack */}
      <pointLight
        position={[0, 1.4, 0.8]}
        color="#00F0FF"
        intensity={0.4}
        distance={2.5}
      />
    </group>
  );
};

export default ServerRack;
