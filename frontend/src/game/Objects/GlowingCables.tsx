import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const GlowingCables: React.FC = () => {
  const cyanMaterialRef = React.useRef<THREE.MeshStandardMaterial | null>(null);
  const purpleMaterialRef = React.useRef<THREE.MeshStandardMaterial | null>(null);

  // Generate curved cable geometries using CatmullRomCurve3
  const cableGeometries = useMemo(() => {
    // Floor cable 1 (Starting area to left server row)
    const curve1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.04, 6.5),
      new THREE.Vector3(-2.5, 0.04, 5.0),
      new THREE.Vector3(-3.8, 0.04, 2.0),
      new THREE.Vector3(-3.8, 0.04, -1.0),
    ]);

    // Floor cable 2 (Starting area to right server row & corridor)
    const curve2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.04, 6.5),
      new THREE.Vector3(2.5, 0.04, 4.5),
      new THREE.Vector3(3.8, 0.04, 1.5),
      new THREE.Vector3(0.6, 0.04, -2.5),
      new THREE.Vector3(0.6, 0.04, -11.0),
    ]);

    // Ceiling cable raceway (runs full length of room into corridor)
    const curveCeilingCyan = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.4, 3.4, 8.0),
      new THREE.Vector3(-0.4, 3.4, 0.0),
      new THREE.Vector3(-0.4, 3.4, -11.5),
    ]);

    const curveCeilingPurple = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.4, 3.4, 8.0),
      new THREE.Vector3(0.4, 3.4, 0.0),
      new THREE.Vector3(0.4, 3.4, -11.5),
    ]);

    return {
      geo1: new THREE.TubeGeometry(curve1, 32, 0.045, 8, false),
      geo2: new THREE.TubeGeometry(curve2, 48, 0.045, 8, false),
      geoCeilingCyan: new THREE.TubeGeometry(curveCeilingCyan, 32, 0.035, 8, false),
      geoCeilingPurple: new THREE.TubeGeometry(curveCeilingPurple, 32, 0.035, 8, false),
    };
  }, []);

  // Animate subtle emissive pulse along cables
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (cyanMaterialRef.current) {
      cyanMaterialRef.current.emissiveIntensity = 1.8 + Math.sin(t * 3.0) * 0.6;
    }
    if (purpleMaterialRef.current) {
      purpleMaterialRef.current.emissiveIntensity = 1.8 + Math.cos(t * 2.5) * 0.6;
    }
  });

  return (
    <group>
      {/* Floor Cable 1 (Cyan) */}
      <mesh geometry={cableGeometries.geo1}>
        <meshStandardMaterial
          ref={cyanMaterialRef}
          color="#00F0FF"
          emissive="#00F0FF"
          emissiveIntensity={2.0}
          roughness={0.2}
        />
      </mesh>

      {/* Floor Cable 2 (Purple) */}
      <mesh geometry={cableGeometries.geo2}>
        <meshStandardMaterial
          ref={purpleMaterialRef}
          color="#9d4edd"
          emissive="#9d4edd"
          emissiveIntensity={2.0}
          roughness={0.2}
        />
      </mesh>

      {/* Ceiling Cable 1 (Cyan) */}
      <mesh geometry={cableGeometries.geoCeilingCyan}>
        <meshStandardMaterial
          color="#00F0FF"
          emissive="#00F0FF"
          emissiveIntensity={2.2}
          roughness={0.2}
        />
      </mesh>

      {/* Ceiling Cable 2 (Purple) */}
      <mesh geometry={cableGeometries.geoCeilingPurple}>
        <meshStandardMaterial
          color="#9d4edd"
          emissive="#9d4edd"
          emissiveIntensity={2.2}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
};

export default GlowingCables;
