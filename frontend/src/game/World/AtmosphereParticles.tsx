import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const AtmosphereParticles: React.FC = () => {
  const pointsRef = useRef<THREE.Points | null>(null);

  const particleCount = 180;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);

    const cyan = new THREE.Color('#00F0FF');
    const purple = new THREE.Color('#9d4edd');

    for (let i = 0; i < particleCount; i++) {
      // Scatter within the room and corridor
      pos[i * 3] = (Math.random() - 0.5) * 12;      // X: -6 to 6
      pos[i * 3 + 1] = Math.random() * 3.4 + 0.2;  // Y: 0.2 to 3.6
      pos[i * 3 + 2] = (Math.random() - 0.5) * 22; // Z: -11 to 11

      const chosenColor = Math.random() > 0.4 ? cyan : purple;
      col[i * 3] = chosenColor.r;
      col[i * 3 + 1] = chosenColor.g;
      col[i * 3 + 2] = chosenColor.b;
    }

    return [pos, col];
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const time = clock.getElapsedTime();
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < particleCount; i++) {
      let y = posAttr.getY(i);
      y += Math.sin(time * 0.5 + i) * 0.002 - 0.001;

      if (y < 0.1) y = 3.4;
      if (y > 3.5) y = 0.2;

      posAttr.setY(i, y);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        vertexColors
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default AtmosphereParticles;
