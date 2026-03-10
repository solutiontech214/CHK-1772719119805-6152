import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function WaveBars({ active }) {
  const meshRef = useRef();
  const count = 40;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (i - count / 2) * 0.4;
      const speed = 0.1 + Math.random() * 0.2;
      const factor = 1 + Math.random() * 2;
      temp.push({ x, speed, factor });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    particles.forEach((particle, i) => {
      const { x, speed, factor } = particle;
      
      // If not active, gracefully shrink to zero
      let targetHeight = 0.1;
      if (active) {
        // Create a classic 'bell curve' distribution for the bars
        const distanceToCenter = Math.abs(i - count / 2) / (count / 2);
        const intensity = Math.pow(1 - distanceToCenter, 2);
        targetHeight = 0.1 + Math.sin(time * 10 * speed + i) * factor * intensity * 5;
        targetHeight = Math.max(0.1, targetHeight);
      }

      dummy.position.set(x, 0, 0);
      dummy.scale.set(0.15, targetHeight, 0.15);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
    </instancedMesh>
  );
}

export default function VoiceWave({ active }) {
  return (
    <div style={{ 
      width: '100%', 
      height: '100px', 
      background: 'rgba(255,255,255,0.02)', 
      borderRadius: '12px',
      overflow: 'hidden',
      marginBottom: '1.5rem',
      display: active ? 'block' : 'none',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 40 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <WaveBars active={active} />
      </Canvas>
    </div>
  );
}
