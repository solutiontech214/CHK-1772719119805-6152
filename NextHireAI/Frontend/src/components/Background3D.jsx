import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Particles({ color }) {
  const count = 1000;
  const mesh = useRef();
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 10 + Math.random() * 30;
      const speed = 0.005 + Math.random() / 500;
      const xFactor = -30 + Math.random() * 60;
      const yFactor = -30 + Math.random() * 60;
      const zFactor = -30 + Math.random() * 60;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor });
    }
    return temp;
  }, [count]);

  useFrame(() => {
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t += speed;
      const s = 0.5 + Math.cos(t) * 0.5;
      dummy.position.set(
        xFactor + Math.cos((t / 10) * factor),
        yFactor + Math.sin((t / 10) * factor),
        zFactor + Math.cos((t / 10) * factor)
      );
      dummy.scale.set(s, s, s);
      dummy.rotation.set(s * 5, s * 5, s * 5);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.rotation.y += 0.001;
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, count]}>
      <dodecahedronGeometry args={[0.08, 0]} />
      <meshPhysicalMaterial 
        color={color} 
        metalness={0.9} 
        roughness={0.1}
        envMapIntensity={1}
      />
    </instancedMesh>
  );
}

export default function Background3D() {
  const [themeColor, setThemeColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#050505');

  useEffect(() => {
    const updateColors = () => {
      const style = getComputedStyle(document.documentElement);
      setThemeColor(style.getPropertyValue('--accent-color').trim() || '#ffffff');
      setBgColor(style.getPropertyValue('--bg-color').trim() || '#050505');
    };

    updateColors();
    // Watch for theme changes
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, background: bgColor }}>
      <Canvas camera={{ fov: 75, position: [0, 0, 20] }}>
        <ambientLight intensity={1.5} color={themeColor} />
        <pointLight position={[10, 10, 10]} intensity={2.5} color={themeColor} />
        <Particles color={themeColor} />
      </Canvas>
      <div style={{
        position: 'absolute',
        top: 0, left: 0, width: '100%', height: '100%',
        background: `radial-gradient(circle at center, transparent 0%, ${bgColor} 100%)`,
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>
    </div>
  );
}
