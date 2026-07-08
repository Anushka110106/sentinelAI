import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

export function FloatingDocument({ position, rotation, filename, scale = 1 }) {
    const groupRef = useRef(null);
    const [hovered, setHovered] = useState(false);

    useFrame(({ mouse }) => {
        if (!groupRef.current) return;

        // Floating animation
        groupRef.current.position.y += Math.sin(Date.now() * 0.001) * 0.005;

        // Look at mouse on hover
        if (hovered) {
            groupRef.current.rotation.z += (mouse.x - groupRef.current.rotation.z) * 0.05;
            groupRef.current.rotation.x += (mouse.y - groupRef.current.rotation.x) * 0.05;
        } else {
            groupRef.current.rotation.x += 0.001;
            groupRef.current.rotation.y += 0.002;
        }
    });

    return (
        <group
            ref={groupRef}
            position={position}
            rotation={rotation}
            scale={hovered ? scale * 1.1 : scale}
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
        >
            {/* Document box */}
            <mesh>
                <boxGeometry args={[2, 3, 0.2]} />
                <meshStandardMaterial
                    color={hovered ? '#4f46e5' : '#6366f1'}
                    metalness={0.3}
                    roughness={0.4}
                    emissive={hovered ? '#4f46e5' : '#000000'}
                    emissiveIntensity={hovered ? 0.5 : 0}
                />
            </mesh>

            {/* Document text */}
            <Text
                position={[0, 0, 0.15]}
                fontSize={0.3}
                color="white"
                anchorX="center"
                anchorY="middle"
                maxWidth={1.8}
            >
                📄 {filename?.substring(0, 15)}
            </Text>

            {/* Glow effect on hover */}
            {hovered && (
                <mesh>
                    <boxGeometry args={[2.2, 3.2, 0.4]} />
                    <meshBasicMaterial
                        color="#4f46e5"
                        transparent
                        opacity={0.2}
                    />
                </mesh>
            )}
        </group>
    );
}
