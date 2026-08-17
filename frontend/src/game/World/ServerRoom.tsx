import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ServerRack } from '../Objects/ServerRack';
import { ComputerTerminal } from '../Objects/ComputerTerminal';
import { GlowingCables } from '../Objects/GlowingCables';
import { SecurityDoor } from '../Objects/SecurityDoor';
import { MemoryFileObject } from '../Objects/MemoryFileObject';
import { Interactable } from '../Objects/Interactable';
import { AtmosphereParticles } from './AtmosphereParticles';
import { NullFragment } from '../Enemies/NullFragment';
import { useWorldStore } from '../../stores/worldStore';

export const ServerRoom: React.FC = () => {
  const isBlackout = useWorldStore((state) => state.isBlackout);
  const corruptionLevel = useWorldStore((state) => state.corruptionLevel);

  const light1Ref = useRef<THREE.PointLight | null>(null);
  const light2Ref = useRef<THREE.PointLight | null>(null);
  const light3Ref = useRef<THREE.PointLight | null>(null);
  const light4Ref = useRef<THREE.PointLight | null>(null);

  // Environmental lighting reacts to corruption and blackout
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (isBlackout) {
      if (light1Ref.current) light1Ref.current.intensity = 0.0;
      if (light2Ref.current) light2Ref.current.intensity = 0.0;
      if (light3Ref.current) light3Ref.current.intensity = 0.0;
      if (light4Ref.current) light4Ref.current.intensity = 0.0;
      return;
    }

    // Dynamic flickering when corruption rises
    const flickerFactor = corruptionLevel > 50 ? (Math.sin(t * 15.0) > 0.8 ? 0.3 : 1.0) : 1.0;
    const colorShift = corruptionLevel > 50 && Math.sin(t * 8.0) > 0.7;

    if (light1Ref.current) {
      light1Ref.current.intensity = (0.9 + Math.sin(t * 2.0) * 0.15) * flickerFactor;
      light1Ref.current.color.set(colorShift ? '#FF2A4D' : '#00F0FF');
    }
    if (light2Ref.current) {
      light2Ref.current.intensity = (0.8 + Math.cos(t * 2.5) * 0.15) * flickerFactor;
      light2Ref.current.color.set(colorShift ? '#FF2A4D' : '#9d4edd');
    }
    if (light3Ref.current) {
      light3Ref.current.intensity = (0.7 + Math.sin(t * 3.0) * 0.2) * flickerFactor;
    }
    if (light4Ref.current) {
      light4Ref.current.intensity = (0.6 + Math.sin(t * 1.5) * 0.1) * flickerFactor;
    }
  });

  return (
    <group>
      {/* Fog & Environment Settings */}
      <fog attach="fog" args={['#030509', 3, 22]} />
      <ambientLight intensity={isBlackout ? 0.02 : 0.25} color="#0d1b2a" />

      {/* Main Overhead Lighting */}
      <pointLight ref={light1Ref} position={[0, 3.2, 5.0]} color="#00F0FF" intensity={0.9} distance={8} />
      <pointLight ref={light2Ref} position={[0, 3.2, 0.0]} color="#9d4edd" intensity={0.8} distance={7} />
      <pointLight ref={light3Ref} position={[0, 3.2, -6.0]} color="#00F0FF" intensity={0.7} distance={6} />
      <pointLight ref={light4Ref} position={[0, 3.2, -10.5]} color="#9d4edd" intensity={0.6} distance={5} />

      {/* FLOORS */}
      <mesh position={[0, 0, 3.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#070B12" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Corridor Floor */}
      <mesh position={[0, 0, -8.0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4, 11]} />
        <meshStandardMaterial color="#060910" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Glowing Floor Guide Strips */}
      <mesh position={[-1.7, 0.005, -2.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.06, 17]} />
        <meshStandardMaterial
          color={corruptionLevel > 50 ? '#FF2A4D' : '#00F0FF'}
          emissive={corruptionLevel > 50 ? '#FF2A4D' : '#00F0FF'}
          emissiveIntensity={2.5}
        />
      </mesh>
      <mesh position={[1.7, 0.005, -2.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.06, 17]} />
        <meshStandardMaterial
          color={corruptionLevel > 50 ? '#FF2A4D' : '#00F0FF'}
          emissive={corruptionLevel > 50 ? '#FF2A4D' : '#00F0FF'}
          emissiveIntensity={2.5}
        />
      </mesh>

      {/* CEILINGS */}
      <mesh position={[0, 3.6, 3.5]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#05070B" metalness={0.7} roughness={0.6} />
      </mesh>
      <mesh position={[0, 3.6, -8.0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 11]} />
        <meshStandardMaterial color="#05070B" metalness={0.7} roughness={0.6} />
      </mesh>

      {/* Ceiling Rafter Beams */}
      {[-2, 0, 2, 4, 6, 8].map((zPos) => (
        <mesh key={zPos} position={[0, 3.5, zPos]}>
          <boxGeometry args={[12, 0.15, 0.2]} />
          <meshStandardMaterial color="#0A0E17" metalness={0.9} roughness={0.4} />
        </mesh>
      ))}

      {/* WALLS */}
      <mesh position={[0, 1.8, 9.5]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[12, 3.6]} />
        <meshStandardMaterial color="#090E17" metalness={0.8} roughness={0.5} />
      </mesh>

      <mesh position={[-6.0, 1.8, 3.5]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[12, 3.6]} />
        <meshStandardMaterial color="#080C15" metalness={0.85} roughness={0.4} />
      </mesh>

      <mesh position={[6.0, 1.8, 3.5]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[12, 3.6]} />
        <meshStandardMaterial color="#080C15" metalness={0.85} roughness={0.4} />
      </mesh>

      {/* North Divider Walls */}
      <mesh position={[-4.0, 1.8, -2.5]} receiveShadow>
        <planeGeometry args={[4, 3.6]} />
        <meshStandardMaterial color="#090E17" metalness={0.8} roughness={0.5} />
      </mesh>
      <mesh position={[4.0, 1.8, -2.5]} receiveShadow>
        <planeGeometry args={[4, 3.6]} />
        <meshStandardMaterial color="#090E17" metalness={0.8} roughness={0.5} />
      </mesh>

      {/* Corridor Walls */}
      <mesh position={[-2.0, 1.8, -7.25]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[9.5, 3.6]} />
        <meshStandardMaterial color="#070B13" metalness={0.9} roughness={0.4} />
      </mesh>

      <mesh position={[2.0, 1.8, -7.25]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[9.5, 3.6]} />
        <meshStandardMaterial color="#070B13" metalness={0.9} roughness={0.4} />
      </mesh>

      {/* Wall Recessed Emissive Strips */}
      <mesh position={[-5.96, 2.2, 3.5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[11, 0.04]} />
        <meshStandardMaterial
          color={corruptionLevel > 50 ? '#FF2A4D' : '#00F0FF'}
          emissive={corruptionLevel > 50 ? '#FF2A4D' : '#00F0FF'}
          emissiveIntensity={2.5}
        />
      </mesh>
      <mesh position={[5.96, 2.2, 3.5]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[11, 0.04]} />
        <meshStandardMaterial color="#9d4edd" emissive="#9d4edd" emissiveIntensity={2.5} />
      </mesh>

      {/* 1. INTERACTABLE SERVER NODE (server_01) */}
      <Interactable
        id="server_01"
        type="SERVER"
        position={[-4.5, 0, 3.5]}
        rotation={[0, Math.PI / 2, 0]}
        hitboxSize={[1.4, 3.0, 1.4]}
        hitboxOffset={[0, 1.5, 0]}
      >
        <ServerRack position={[0, 0, 0]} />
      </Interactable>

      {/* Other Server Racks */}
      <ServerRack position={[-4.5, 0, 5.5]} rotation={[0, Math.PI / 2, 0]} />
      <ServerRack position={[-4.5, 0, 1.5]} rotation={[0, Math.PI / 2, 0]} />
      <ServerRack position={[4.5, 0, 5.5]} rotation={[0, -Math.PI / 2, 0]} />
      <ServerRack position={[4.5, 0, 3.5]} rotation={[0, -Math.PI / 2, 0]} />
      <ServerRack position={[4.5, 0, 1.5]} rotation={[0, -Math.PI / 2, 0]} />
      <ServerRack position={[-1.4, 0, -5.0]} rotation={[0, Math.PI / 2, 0]} />
      <ServerRack position={[1.4, 0, -8.0]} rotation={[0, -Math.PI / 2, 0]} />

      {/* 2. INTERACTABLE TERMINAL (terminal_01) */}
      <Interactable
        id="terminal_01"
        type="TERMINAL"
        position={[-2.2, 0, 0.5]}
        rotation={[0, 0.3, 0]}
        hitboxSize={[1.6, 2.0, 1.4]}
        hitboxOffset={[0, 1.0, 0]}
      >
        <ComputerTerminal position={[0, 0, 0]} terminalId="DEBUG_CORE" />
      </Interactable>

      {/* Right Terminal Console (with Memory File on Desk) */}
      <group position={[2.2, 0, 0.5]} rotation={[0, -0.3, 0]}>
        <ComputerTerminal position={[0, 0, 0]} terminalId="ARCHIVE_01" />
        
        {/* 3. INTERACTABLE MEMORY FILE (memory_01) */}
        <Interactable
          id="memory_01"
          type="MEMORY"
          position={[0.3, 0.95, 0.1]}
          hitboxSize={[0.7, 0.7, 0.7]}
          hitboxOffset={[0, 0.2, 0]}
        >
          <MemoryFileObject position={[0, 0, 0]} />
        </Interactable>
      </group>

      {/* Corridor Diagnostic Console */}
      <ComputerTerminal position={[1.3, 0, -4.5]} rotation={[0, -Math.PI / 2, 0]} terminalId="CORRIDOR_NODE" />

      {/* Glowing Cables */}
      <GlowingCables />

      {/* 1. NULL_FRAGMENT ENEMY PROTOTYPE (Corrupted Humanoid Entity) */}
      <NullFragment initialPosition={[0, 1.2, -6.5]} />

      {/* 4. INTERACTABLE SECURITY DOOR (door_01) */}
      <Interactable
        id="door_01"
        type="DOOR"
        position={[0, 0, -11.8]}
        hitboxSize={[3.2, 3.6, 1.5]}
        hitboxOffset={[0, 1.8, 0]}
      >
        <SecurityDoor position={[0, 0, 0]} />
      </Interactable>

      {/* Floating Atmosphere Particles */}
      <AtmosphereParticles />
    </group>
  );
};

export default ServerRoom;
