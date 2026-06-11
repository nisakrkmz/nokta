import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber/native';
import { useGLTF } from '@react-three/drei/native';
import * as THREE from 'three';

export default function Avatar({ isTalking, audioLevel, persona }) {
  const robotHeadRef = useRef();
  const robotEyeLeftRef = useRef();
  const robotEyeRightRef = useRef();

  // Safely load GLB model in Expo environment
  let gltf = null;
  try {
    gltf = useGLTF(require('../assets/avatar.glb'));
  } catch (err) {
    console.warn("GLB load failed, falling back to procedural mascot:", err);
  }

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const talkFactor = isTalking ? audioLevel : 0;

    // 1. If GLTF is loaded, animate its morph targets for visemes/lipsync
    if (gltf && gltf.scene) {
      gltf.scene.traverse((child) => {
        if (child.isMesh && child.morphTargetInfluences && child.morphTargetDictionary) {
          // Adjust morph targets for lipsync (jawOpen, mouthOpen, visemes)
          const targetNames = ['jawOpen', 'mouthOpen', 'mouthSmile', 'viseme_aa', 'viseme_O'];
          targetNames.forEach(name => {
            const index = child.morphTargetDictionary[name];
            if (index !== undefined) {
              // Smoothly interpolate the influence
              let targetWeight = talkFactor * 1.2;
              if (isTalking && name !== 'mouthSmile') {
                targetWeight += Math.sin(time * 20) * 0.1;
              }
              // Lerp with 0.15 katsayısı (Expert Bridge'de sınıf arkadaşının tavsiyesi!)
              child.morphTargetInfluences[index] = THREE.MathUtils.lerp(
                child.morphTargetInfluences[index],
                Math.max(0, Math.min(1, targetWeight)),
                0.15
              );
            }
          });
        }
      });
      
      // Rotate the GLB model head slightly based on time for breathing effect
      gltf.scene.rotation.y = Math.sin(time * 0.8) * 0.05;
      gltf.scene.rotation.x = Math.cos(time * 0.5) * 0.03;
      
      // Persona specific scaling/rotation offsets
      if (persona === 'JUNIOR') {
        gltf.scene.scale.set(0.9, 0.9, 0.9);
        gltf.scene.position.y = -1.1;
      } else {
        gltf.scene.scale.set(1.1, 1.1, 1.1);
        gltf.scene.position.y = -1.0;
      }
    }

    // 2. Animate the procedural robot fallback mascot
    if (robotHeadRef.current) {
      robotHeadRef.current.position.y = (Math.sin(time * 1.5) * 0.05);
      robotHeadRef.current.rotation.z = Math.sin(time) * 0.03;
    }
    
    if (robotEyeLeftRef.current && robotEyeRightRef.current) {
      const eyeScale = isTalking ? 1 + audioLevel * 0.6 : 1;
      const blink = Math.sin(time * 0.5) > 0.98 ? 0.1 : eyeScale;
      robotEyeLeftRef.current.scale.set(1, blink, 1);
      robotEyeRightRef.current.scale.set(1, blink, 1);
    }
  });

  // If GLTF loaded successfully, render the GLB model
  if (gltf && gltf.scene) {
    return (
      <group>
        <ambientLight intensity={1.5} />
        <directionalLight position={[2, 4, 2]} intensity={1.8} />
        <pointLight position={[-2, 2, -2]} intensity={0.8} />
        <primitive object={gltf.scene} />
      </group>
    );
  }

  // Fallback procedural robot mascot (original implementation)
  return (
    <group position={[0, -0.5, 0]}>
      <ambientLight intensity={1.5} />
      <pointLight position={[5, 5, 5]} intensity={2} />
      
      <group ref={robotHeadRef}>
        {/* Main Head */}
        <mesh>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color={persona === 'JUNIOR' ? "#ffd700" : "#ffffff"} roughness={0.1} />
        </mesh>

        {/* Visor */}
        <mesh position={[0, 0, 0.5]}>
           <sphereGeometry args={[0.92, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
           <meshStandardMaterial color="#111" />
        </mesh>

        {/* Eyes */}
        <group position={[0, 0, 0.95]}>
          <mesh ref={robotEyeLeftRef} position={[-0.35, 0, 0]}>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshBasicMaterial color={persona === 'JUNIOR' ? "#ff00ff" : "#00ffff"} />
          </mesh>
          <mesh ref={robotEyeRightRef} position={[0.35, 0, 0]}>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshBasicMaterial color={persona === 'JUNIOR' ? "#ff00ff" : "#00ffff"} />
          </mesh>
        </group>
      </group>

      {/* Body */}
      <mesh position={[0, -1.2, 0]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial color="#eee" />
      </mesh>
    </group>
  );
}
