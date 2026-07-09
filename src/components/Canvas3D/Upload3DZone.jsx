import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { Suspense } from 'react';
import { ParticleSystem } from './ParticleSystem';

export function Upload3DZone({ isActive }) {
    return (
        <div className="w-full h-80 rounded-xl overflow-hidden border-2 border-earth-moss bg-gradient-to-br from-earth-dark via-earth-teal to-earth-dark">
            <Canvas
                camera={{ position: [0, 0, 30], fov: 75 }}
                gl={{ antialias: true, alpha: true }}
            >
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#839958" />

                <Suspense fallback={null}>
                    {/* Animated particles */}
                    <ParticleSystem count={150} speed={0.03} />

                    {/* Center text */}
                    <Text
                        position={[0, 0, 0]}
                        fontSize={2}
                        color={isActive ? '#F7F4D5' : '#839958'}
                        anchorX="center"
                        anchorY="middle"
                    >
                        {isActive ? '✨ DROP HERE ✨' : '📄 Drag & Drop PDFs'}
                    </Text>

                    {/* Rotating ring */}
                    <mesh rotation={[0, 0, Date.now() * 0.001]}>
                        <torusGeometry args={[15, 0.5, 16, 100]} />
                        <meshStandardMaterial
                            color={isActive ? '#F7F4D5' : '#839958'}
                            emissive={isActive ? '#F7F4D5' : '#839958'}
                            emissiveIntensity={0.8}
                        />
                    </mesh>
                </Suspense>

                <OrbitControls autoRotate autoRotateSpeed={2} enableZoom={false} />
            </Canvas>
        </div>
    );
}
