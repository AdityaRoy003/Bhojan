import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

const ThreeDIntroSplash = ({ onComplete }) => {
    const containerRef = useRef(null);
    const [showText, setShowText] = useState(false);
    const [fadeTextOut, setFadeTextOut] = useState(false);
    const isExplodingRef = useRef(false);

    useEffect(() => {
        if (!containerRef.current) return;

        // Check if intro has been seen in this session
        const hasSeenIntro = sessionStorage.getItem('bhojanIntroSeen');
        if (hasSeenIntro === 'true') {
            onComplete();
            return;
        }

        const container = containerRef.current;
        const width = window.innerWidth;
        const height = window.innerHeight;

        // 1. Scene & Camera Setup
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x030712, 0.08); // Mist fading into background

        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
        camera.position.set(0, 0, 30); // Start far away

        // 2. Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // 3. Create Particle Vortex
        const particleCount = 1000;
        const particleGeom = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        const particleData = [];

        // Color palette matching Bhojan branding
        const colorPalette = [
            new THREE.Color(0xf59e0b), // Amber-500
            new THREE.Color(0xf97316), // Orange-500
            new THREE.Color(0xef4444), // Red-500
            new THREE.Color(0xa855f7), // Purple-500
        ];

        for (let i = 0; i < particleCount; i++) {
            // Spiral formulation
            const angle = i * 0.12;
            const radius = Math.pow(i / particleCount, 0.5) * 12 + 0.5;
            const x = Math.cos(angle) * radius;
            const y = (Math.random() - 0.5) * 1.5 + (Math.sin(angle * 3) * 0.5);
            const z = Math.sin(angle) * radius;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // Assign color based on radius (hot center, cool edges)
            const colorIdx = Math.floor(Math.random() * colorPalette.length);
            const color = colorPalette[colorIdx];
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            particleData.push({
                angle: angle,
                radius: radius,
                speed: (0.01 + Math.random() * 0.02) * (1.5 - radius / 12), // faster near center
                yOffset: y,
                originalX: x,
                originalY: y,
                originalZ: z,
                velocityX: 0,
                velocityY: 0,
                velocityZ: 0
            });
        }

        particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // Create glowing circular texture
        const pCanvas = document.createElement('canvas');
        pCanvas.width = 32;
        pCanvas.height = 32;
        const ctx = pCanvas.getContext('2d');
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(245, 158, 11, 0.8)');
        gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
        const pTexture = new THREE.CanvasTexture(pCanvas);

        const particleMat = new THREE.PointsMaterial({
            size: 0.45,
            vertexColors: true,
            map: pTexture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particleSystem = new THREE.Points(particleGeom, particleMat);
        scene.add(particleSystem);

        // 4. Animation Timelines
        let animationId;
        const clock = new THREE.Clock();

        // Show text shortly after start
        const textTimeout = setTimeout(() => setShowText(true), 800);

        // Trigger scatter explosion at 2.6s
        const scatterTimeout = setTimeout(() => {
            isExplodingRef.current = true;
            setFadeTextOut(true);
        }, 2600);

        // Complete the sequence at 3.6s
        const completeTimeout = setTimeout(() => {
            sessionStorage.setItem('bhojanIntroSeen', 'true');
            onComplete();
        }, 3600);

        const animate = () => {
            animationId = requestAnimationFrame(animate);

            const elapsed = clock.getElapsedTime();
            const posAttr = particleGeom.getAttribute('position');

            if (!isExplodingRef.current) {
                // 1. Camera Zoom In & Tilt
                if (camera.position.z > 6) {
                    camera.position.z -= 0.28;
                }
                camera.rotation.z = elapsed * 0.15; // Slow rotation of camera

                // 2. Standard Vortex Spin
                for (let i = 0; i < particleCount; i++) {
                    const data = particleData[i];
                    data.angle += data.speed * (1 + elapsed * 0.5); // Spin faster over time
                    const x = Math.cos(data.angle) * data.radius;
                    const z = Math.sin(data.angle) * data.radius;

                    posAttr.setX(i, x);
                    posAttr.setY(i, data.yOffset + Math.sin(elapsed * 2 + i) * 0.05);
                    posAttr.setZ(i, z);
                }
            } else {
                // 3. Exploding/Scatter Physics (particles fly outwards away from center)
                particleMat.size *= 0.96; // Shrink particles as they explode
                particleMat.opacity *= 0.94; // Fade out

                for (let i = 0; i < particleCount; i++) {
                    const data = particleData[i];
                    const px = posAttr.getX(i);
                    const py = posAttr.getY(i);
                    const pz = posAttr.getZ(i);

                    // Compute radial vector
                    const dx = px;
                    const dy = py;
                    const dz = pz;
                    const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

                    // Apply outward explosion force
                    if (data.velocityX === 0) {
                        const force = (Math.random() * 0.4 + 0.3);
                        data.velocityX = (dx / len) * force;
                        data.velocityY = (dy / len) * force;
                        data.velocityZ = (dz / len) * force;
                    }

                    posAttr.setX(i, px + data.velocityX);
                    posAttr.setY(i, py + data.velocityY);
                    posAttr.setZ(i, pz + data.velocityZ);
                }
            }

            posAttr.needsUpdate = true;
            renderer.render(scene, camera);
        };

        animate();

        // 5. Resize Event
        const handleResize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        // 6. Clean up
        return () => {
            clearTimeout(textTimeout);
            clearTimeout(scatterTimeout);
            clearTimeout(completeTimeout);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);

            particleGeom.dispose();
            particleMat.dispose();
            pTexture.dispose();

            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [onComplete]);

    const handleSkip = () => {
        isExplodingRef.current = true;
        setFadeTextOut(true);
        sessionStorage.setItem('bhojanIntroSeen', 'true');
        setTimeout(onComplete, 600);
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-gray-950 overflow-hidden select-none">
            {/* Canvas Container */}
            <div ref={containerRef} className="absolute inset-0 w-full h-full" />

            {/* Cinematic Text Overlay */}
            <AnimatePresence>
                {showText && !fadeTextOut && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.2, filter: 'blur(10px)' }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none z-10"
                    >
                        <h1 className="text-7xl sm:text-9xl font-black tracking-[0.3em] text-white drop-shadow-[0_0_30px_rgba(245,158,11,0.3)] select-none pl-[0.3em]">
                            BHOJAN
                        </h1>
                        <p className="text-sm sm:text-lg font-black tracking-[0.6em] text-amber-500 uppercase mt-4 select-none pl-[0.6em]">
                            Taste. Delivered.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Skip Button */}
            <button
                onClick={handleSkip}
                className="absolute bottom-10 right-10 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-full px-6 py-2.5 text-xs font-black uppercase tracking-[0.2em] transition-all z-20 cursor-pointer shadow-lg hover:shadow-xl active:scale-95"
            >
                Skip Intro ⚡
            </button>
        </div>
    );
};

export default ThreeDIntroSplash;
