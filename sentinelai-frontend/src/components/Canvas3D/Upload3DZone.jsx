import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { Suspense } from 'react';
import { ParticleSystem } from './ParticleSystem';

export function Upload3DZone({ isActive, className = "h-40" }) {
    return (
        <div className={`w-full ${className} rounded-xl overflow-hidden border border-indigo-500/30 bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950`}>
            <Canvas
                camera={{ position: [0, 0, 30], fov: 75 }}
                gl={{ antialias: true, alpha: true }}
            >
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#6366f1" />

                <Suspense fallback={null}>
                    {/* Animated particles */}
                    <ParticleSystem count={150} speed={0.03} />

                    {/* Center text */}
                    <Text
                        position={[0, 0, 0]}
                        fontSize={2.5}
                        color={isActive ? '#ffffff' : '#a5b4fc'}
                        anchorX="center"
                        anchorY="middle"
                    >
                        {isActive ? '✨ DROP HERE ✨' : '📄 Drag & Drop PDFs'}
                    </Text>

                    {/* Rotating ring */}
                    <mesh rotation={[0, 0, Date.now() * 0.001]}>
                        <torusGeometry args={[15, 0.4, 16, 100]} />
                        <meshStandardMaterial
                            color={isActive ? '#ffffff' : '#6366f1'}
                            emissive={isActive ? '#ffffff' : '#4f46e5'}
                            emissiveIntensity={0.8}
                        />
                    </mesh>
                </Suspense>

                <OrbitControls autoRotate autoRotateSpeed={2} enableZoom={false} />
            </Canvas>
        </div>
    );
}
