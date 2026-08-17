import React from 'react';
import { ServerRack } from '../Objects/ServerRack';
import { ComputerTerminal } from '../Objects/ComputerTerminal';
import { GlowingCables } from '../Objects/GlowingCables';
import { SecurityDoor } from '../Objects/SecurityDoor';
import { AtmosphereParticles } from './AtmosphereParticles';

export const ServerRoom: React.FC = () => {
  return (
    <group>
      {/* Fog & Environment Settings */}
      <fog attach="fog" args={['#030509', 3, 22]} />
      <ambientLight intensity={0.25} color="#0d1b2a" />

      {/* Main Overhead Lighting (Cyan & Subtle Purple) */}
      <pointLight position={[0, 3.2, 5.0]} color="#00F0FF" intensity={0.9} distance={8} />
      <pointLight position={[0, 3.2, 0.0]} color="#9d4edd" intensity={0.8} distance={7} />
      <pointLight position={[0, 3.2, -6.0]} color="#00F0FF" intensity={0.7} distance={6} />
      <pointLight position={[0, 3.2, -10.5]} color="#9d4edd" intensity={0.6} distance={5} />

      {/* FLOORS */}
      {/* Main Room Floor (12m wide, 12m deep) */}
      <mesh position={[0, 0, 3.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial
          color="#070B12"
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>

      {/* Corridor Floor (4m wide, 12m long) */}
      <mesh position={[0, 0, -8.0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4, 11]} />
        <meshStandardMaterial
          color="#060910"
          metalness={0.9}
          roughness={0.3}
        />
      </mesh>

      {/* Glowing Floor Guide Strips (Cyan) */}
      <mesh position={[-1.7, 0.005, -2.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.06, 17]} />
        <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={2.5} />
      </mesh>
      <mesh position={[1.7, 0.005, -2.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.06, 17]} />
        <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={2.5} />
      </mesh>

      {/* CEILINGS */}
      {/* Main Room Ceiling */}
      <mesh position={[0, 3.6, 3.5]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#05070B" metalness={0.7} roughness={0.6} />
      </mesh>
      {/* Corridor Ceiling */}
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
      {/* Back Wall (South behind starting area at Z = 9.5) */}
      <mesh position={[0, 1.8, 9.5]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[12, 3.6]} />
        <meshStandardMaterial color="#090E17" metalness={0.8} roughness={0.5} />
      </mesh>

      {/* Main Room Left Wall (West at X = -6.0) */}
      <mesh position={[-6.0, 1.8, 3.5]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[12, 3.6]} />
        <meshStandardMaterial color="#080C15" metalness={0.85} roughness={0.4} />
      </mesh>

      {/* Main Room Right Wall (East at X = 6.0) */}
      <mesh position={[6.0, 1.8, 3.5]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[12, 3.6]} />
        <meshStandardMaterial color="#080C15" metalness={0.85} roughness={0.4} />
      </mesh>

      {/* North Divider Walls (Main room to Corridor at Z = -2.5) */}
      {/* Left divider wall */}
      <mesh position={[-4.0, 1.8, -2.5]} receiveShadow>
        <planeGeometry args={[4, 3.6]} />
        <meshStandardMaterial color="#090E17" metalness={0.8} roughness={0.5} />
      </mesh>
      {/* Right divider wall */}
      <mesh position={[4.0, 1.8, -2.5]} receiveShadow>
        <planeGeometry args={[4, 3.6]} />
        <meshStandardMaterial color="#090E17" metalness={0.8} roughness={0.5} />
      </mesh>

      {/* Corridor Left Wall (X = -2.0, Z from -2.5 to -12.0) */}
      <mesh position={[-2.0, 1.8, -7.25]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[9.5, 3.6]} />
        <meshStandardMaterial color="#070B13" metalness={0.9} roughness={0.4} />
      </mesh>

      {/* Corridor Right Wall (X = 2.0, Z from -2.5 to -12.0) */}
      <mesh position={[2.0, 1.8, -7.25]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[9.5, 3.6]} />
        <meshStandardMaterial color="#070B13" metalness={0.9} roughness={0.4} />
      </mesh>

      {/* Wall Recessed Emissive Strips */}
      <mesh position={[-5.96, 2.2, 3.5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[11, 0.04]} />
        <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={2.5} />
      </mesh>
      <mesh position={[5.96, 2.2, 3.5]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[11, 0.04]} />
        <meshStandardMaterial color="#9d4edd" emissive="#9d4edd" emissiveIntensity={2.5} />
      </mesh>

      {/* 2. SERVER RACKS */}
      {/* Left Server Bank Row (3 racks) */}
      <ServerRack position={[-4.5, 0, 5.5]} rotation={[0, Math.PI / 2, 0]} />
      <ServerRack position={[-4.5, 0, 3.5]} rotation={[0, Math.PI / 2, 0]} />
      <ServerRack position={[-4.5, 0, 1.5]} rotation={[0, Math.PI / 2, 0]} />

      {/* Right Server Bank Row (3 racks) */}
      <ServerRack position={[4.5, 0, 5.5]} rotation={[0, -Math.PI / 2, 0]} />
      <ServerRack position={[4.5, 0, 3.5]} rotation={[0, -Math.PI / 2, 0]} />
      <ServerRack position={[4.5, 0, 1.5]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Corridor Server Units */}
      <ServerRack position={[-1.4, 0, -5.0]} rotation={[0, Math.PI / 2, 0]} />
      <ServerRack position={[1.4, 0, -8.0]} rotation={[0, -Math.PI / 2, 0]} />

      {/* 3. COMPUTER TERMINALS WITH ANIMATED SCREENS */}
      {/* Main Terminal Left */}
      <ComputerTerminal position={[-2.2, 0, 0.5]} rotation={[0, 0.3, 0]} terminalId="TERMINAL_ALPHA" />
      {/* Main Terminal Right */}
      <ComputerTerminal position={[2.2, 0, 0.5]} rotation={[0, -0.3, 0]} terminalId="TERMINAL_BETA" />
      {/* Corridor Diagnostic Console */}
      <ComputerTerminal position={[1.3, 0, -4.5]} rotation={[0, -Math.PI / 2, 0]} terminalId="CORRIDOR_NODE" />

      {/* 4. GLOWING CABLES (Floor & Ceiling Conduits) */}
      <GlowingCables />

      {/* 5. LOCKED SECURITY DOOR & EXIT AREA */}
      <SecurityDoor position={[0, 0, -11.8]} />

      {/* 6. FLOATING ATMOSPHERIC PARTICLES */}
      <AtmosphereParticles />
    </group>
  );
};

export default ServerRoom;
