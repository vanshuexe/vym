import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';

function AbstractShape() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef}>
        <torusKnotGeometry args={[1, 0.3, 128, 32]} />
        <MeshTransmissionMaterial 
          backside
          samples={4}
          thickness={0.5}
          chromaticAberration={0.05}
          anisotropy={0.1}
          distortion={0.2}
          distortionScale={0.5}
          temporalDistortion={0.1}
          ior={1.5}
          color="#06b6d4"
          attenuationDistance={1}
          attenuationColor="#ffffff"
        />
      </mesh>
    </Float>
  );
}

export function Hero3DObject() {
  return (
    <div className="w-full h-full min-h-[400px] lg:min-h-[500px]">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#06b6d4" />
        <directionalLight position={[-10, -10, -5]} intensity={1} color="#60a5fa" />
        
        <AbstractShape />
        
        <Environment preset="city" />
        <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2} far={4} color="#06b6d4" />
      </Canvas>
    </div>
  );
}
