import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function ParticleSystem({ count = 100, speed = 0.02 }) {
    const pointsRef = useRef(null);
    const positionAttribute = useRef(null);

    useEffect(() => {
        if (!pointsRef.current) return;

        // Create particle geometry
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);

        for (let i = 0; i < count * 3; i += 3) {
            // Random positions
            positions[i] = (Math.random() - 0.5) * 40;
            positions[i + 1] = (Math.random() - 0.5) * 40;
            positions[i + 2] = (Math.random() - 0.5) * 40;

            // Random velocities
            velocities[i] = (Math.random() - 0.5) * speed;
            velocities[i + 1] = (Math.random() - 0.5) * speed;
            velocities[i + 2] = (Math.random() - 0.5) * speed;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        positionAttribute.current = geometry.getAttribute('position');
        geometry.userData.velocities = velocities;

        // Create material and points
        const material = new THREE.PointsMaterial({
            color: '#4f46e5',
            size: 0.5,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.8,
        });

        pointsRef.current.geometry = geometry;
        pointsRef.current.material = material;
    }, [count, speed]);

    // Animate particles
    useFrame(() => {
        if (!pointsRef.current || !positionAttribute.current) return;

        const positions = positionAttribute.current.array;
        const velocities = pointsRef.current.geometry.userData.velocities;

        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocities[i];
            positions[i + 1] += velocities[i + 1];
            positions[i + 2] += velocities[i + 2];

            // Wrap around
            if (Math.abs(positions[i]) > 20) velocities[i] *= -1;
            if (Math.abs(positions[i + 1]) > 20) velocities[i + 1] *= -1;
            if (Math.abs(positions[i + 2]) > 20) velocities[i + 2] *= -1;
        }

        positionAttribute.current.needsUpdate = true;
    });

    return <points ref={pointsRef} />;
}
