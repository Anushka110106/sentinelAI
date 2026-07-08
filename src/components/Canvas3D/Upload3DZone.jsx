import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { Suspense } from 'react';
import { ParticleSystem } from './ParticleSystem';

export function Upload3DZone({ isActive }) {
    return (
        <div className="w-full h-80 rounded-lg overflow-hidden border-2 border-indigo-500 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <Canvas
                camera={{ position: [0, 0, 30], fov: 75 }}
                gl={{ antialias: true, alpha: true }}
            >
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#4f46e5" />

                <Suspense fallback={null}>
                    {/* Animated particles */}
                    <ParticleSystem count={150} speed={0.03} />

                    {/* Center text */}
                    <Text
                        position={[0, 0, 0]}
                        fontSize={2}
                        color={isActive ? '#00ff88' : '#a5b4fc'}
                        anchorX="center"
                        anchorY="middle"
                    >
                        {isActive ? '✨ DROP HERE ✨' : '📄 Drag Files'}
                    </Text>

                    {/* Rotating ring */}
                    <mesh rotation={[0, 0, Date.now() * 0.001]}>
                        <torusGeometry args={[15, 0.5, 16, 100]} />
                        <meshStandardMaterial
                            color={isActive ? '#00ff88' : '#4f46e5'}
                            emissive={isActive ? '#00ff88' : '#4f46e5'}
                            emissiveIntensity={0.8}
                        />
                    </mesh>
                </Suspense>

                <OrbitControls autoRotate autoRotateSpeed={2} enableZoom={false} />
            </Canvas>
        </div>
    );
}
