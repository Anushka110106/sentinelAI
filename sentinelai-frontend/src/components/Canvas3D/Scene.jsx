import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';

export function Scene3D({ children }) {
    return (
        <Canvas
            className="w-full h-full"
            camera={{ position: [0, 0, 50], fov: 75 }}
            gl={{ antialias: true, alpha: true }}
        >
            <PerspectiveCamera makeDefault position={[0, 0, 50]} />
            
            {/* Lighting */}
            <ambientLight intensity={0.6} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <pointLight position={[-10, -10, 10]} intensity={0.8} color="#4f46e5" />
            
            {/* Background stars */}
            <Stars radius={100} depth={50} count={5000} factor={4} />
            
            {/* Orbit controls for interaction */}
            <OrbitControls
                autoRotate
                autoRotateSpeed={0.5}
                enableZoom={true}
                enablePan={true}
            />
            
            <Suspense fallback={null}>
                {children}
            </Suspense>
        </Canvas>
    );
}
