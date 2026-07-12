import { useEffect, useRef, useState } from 'react';

// Animated counter that counts up to a target value
export function AnimatedCounter({ value, duration = 1200, prefix = '', suffix = '' }) {
    const [display, setDisplay] = useState(0);
    const frameRef = useRef(null);

    useEffect(() => {
        const start = 0;
        const end = typeof value === 'number' ? value : parseInt(value, 10) || 0;
        const startTime = performance.now();

        function step(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(start + (end - start) * eased));
            if (progress < 1) {
                frameRef.current = requestAnimationFrame(step);
            }
        }

        frameRef.current = requestAnimationFrame(step);
        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
        };
    }, [value, duration]);

    return <>{prefix}{display.toLocaleString()}{suffix}</>;
}
