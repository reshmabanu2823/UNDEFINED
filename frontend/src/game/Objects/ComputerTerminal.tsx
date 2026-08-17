import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ComputerTerminalProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  terminalId?: string;
}

export const ComputerTerminal: React.FC<ComputerTerminalProps> = ({
  position,
  rotation = [0, 0, 0],
  terminalId = 'TERM_01',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const lineOffsetRef = useRef<number>(0);

  // Create dynamic terminal screen canvas
  const canvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 384;
    return c;
  }, []);

  useEffect(() => {
    canvasRef.current = canvas;
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    textureRef.current = tex;
  }, [canvas]);

  // Animate terminal screen text
  useFrame(({ clock }) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const time = clock.getElapsedTime();
    lineOffsetRef.current = (lineOffsetRef.current + 0.5) % 300;

    // Background
    ctx.fillStyle = '#05070B';
    ctx.fillRect(0, 0, 512, 384);

    // Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    for (let y = 0; y < 384; y += 4) {
      ctx.fillRect(0, y, 512, 2);
    }

    // Header Bar
    ctx.fillStyle = '#00F0FF';
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillText(`NULL//ROOT :: [${terminalId}]`, 24, 40);

    ctx.fillStyle = '#526580';
    ctx.font = '16px "JetBrains Mono", monospace';
    ctx.fillText('STATUS: ONLINE // MEMORY RUNTIME', 24, 70);

    ctx.strokeStyle = '#152238';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(24, 85);
    ctx.lineTo(488, 85);
    ctx.stroke();

    // Data streams & memory dump lines
    const logLines = [
      `0x7FFF08: SYSCALL_RECV [ANOMALY_SIG]`,
      `0x7FFF10: RAM ALLOC: 0x4F89E10B`,
      `0x7FFF18: CORRUPT SECTOR IN 0x00_NULL`,
      `0x7FFF20: NETWORK PACKETS: ${(Math.floor(time * 60) % 9999).toString().padStart(4, '0')} FPS`,
      `0x7FFF28: THREAD POOL: 32 QUANTUM NODES`,
      `0x7FFF30: ACCESS CLEARANCE: RESTRICTED`,
    ];

    ctx.fillStyle = '#E2F1FF';
    ctx.font = '15px "JetBrains Mono", monospace';
    logLines.forEach((line, idx) => {
      ctx.fillText(line, 24, 120 + idx * 30);
    });

    // Blinking prompt cursor
    if (Math.floor(time * 3) % 2 === 0) {
      ctx.fillStyle = '#00F0FF';
      ctx.fillRect(24, 310, 16, 22);
    }
    ctx.fillStyle = '#00F0FF';
    ctx.fillText('> OPERATOR LINK READY', 48, 328);

    if (textureRef.current) {
      textureRef.current.needsUpdate = true;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Terminal Desk Stand */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.9, 0.7]} />
        <meshStandardMaterial color="#0A0E17" roughness={0.5} metalness={0.8} />
      </mesh>

      {/* Desk Surface Top */}
      <mesh position={[0, 0.92, 0]} receiveShadow>
        <boxGeometry args={[1.3, 0.05, 0.8]} />
        <meshStandardMaterial color="#152238" roughness={0.3} metalness={0.9} />
      </mesh>

      {/* Keyboard Panel */}
      <mesh position={[0, 0.96, 0.15]} rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[0.6, 0.02, 0.25]} />
        <meshStandardMaterial color="#080C14" roughness={0.6} />
      </mesh>

      {/* Monitor Bezel */}
      <mesh position={[0, 1.45, -0.15]} rotation={[-0.12, 0, 0]} castShadow>
        <boxGeometry args={[0.9, 0.65, 0.06]} />
        <meshStandardMaterial color="#05070B" roughness={0.4} metalness={0.9} />
      </mesh>

      {/* Monitor Screen Surface */}
      {textureRef.current && (
        <mesh position={[0, 1.45, -0.11]} rotation={[-0.12, 0, 0]}>
          <planeGeometry args={[0.82, 0.58]} />
          <meshBasicMaterial map={textureRef.current} />
        </mesh>
      )}

      {/* Monitor Screen Soft Glow */}
      <pointLight
        position={[0, 1.45, 0.2]}
        color="#00F0FF"
        intensity={0.6}
        distance={2.2}
      />
    </group>
  );
};

export default ComputerTerminal;
