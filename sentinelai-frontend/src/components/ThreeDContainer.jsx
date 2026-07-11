import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

export function ThreeDContainer({ children, className = "" }) {
    const x = useMotionValue(0.5);
    const y = useMotionValue(0.5);

    // Subtler rotation range (3.5 degrees max) to prevent text distortion and improve readability
    const rotateX = useSpring(useTransform(y, [0, 1], [3.5, -3.5]), { stiffness: 120, damping: 22 });
    const rotateY = useSpring(useTransform(x, [0, 1], [-3.5, 3.5]), { stiffness: 120, damping: 22 });

    function handleMouseMove(event) {
        const rect = event.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        x.set(mouseX / width);
        y.set(mouseY / height);
    }

    function handleMouseLeave() {
        x.set(0.5);
        y.set(0.5);
    }

    return (
        <div
            className="w-full h-full flex items-center justify-center"
            style={{ perspective: 1000 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: 'flat', // 'flat' renders much crisper text in Chrome/WebKit than 'preserve-3d'
                    willChange: 'transform',
                }}
                className={`w-full ${className}`}
            >
                {children}
            </motion.div>
        </div>
    );
}
