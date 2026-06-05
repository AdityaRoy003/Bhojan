import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeDHeroScene = () => {
    const containerRef = useRef(null);
    const mouseRef = useRef({ x: 0, y: 0 });
    const targetMouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth || 400;
        const height = container.clientHeight || 500;

        // 1. Scene setup
        const scene = new THREE.Scene();

        // 2. Camera setup
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        // Start zoomed out for intro animation
        camera.position.set(0, 5, 12);
        camera.lookAt(0, 0, 0);

        // 3. Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        // Keep track of resources for disposal
        const geometries = [];
        const materials = [];

        const trackGeometry = (g) => { geometries.push(g); return g; };
        const trackMaterial = (m) => { materials.push(m); return m; };

        // 4. Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffaa44, 2.5); // Warm amber light
        mainLight.position.set(5, 8, 5);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 1024;
        mainLight.shadow.mapSize.height = 1024;
        scene.add(mainLight);

        const fillLight = new THREE.DirectionalLight(0xcc55ff, 1.2); // Purple fill light from opposite side
        fillLight.position.set(-5, 2, -3);
        scene.add(fillLight);

        const rimLight = new THREE.PointLight(0xff3300, 3, 10); // Red glow from below
        rimLight.position.set(0, -3, 0);
        scene.add(rimLight);

        // 5. Create 3D Plate Group
        const plateGroup = new THREE.Group();
        scene.add(plateGroup);

        // A. The Plate
        const plateGeom = trackGeometry(new THREE.CylinderGeometry(2.5, 2, 0.15, 32));
        const plateMat = trackMaterial(new THREE.MeshStandardMaterial({
            color: 0x111827, // Slate-900 gray
            roughness: 0.15,
            metalness: 0.8,
            flatShading: false
        }));
        const plateMesh = new THREE.Mesh(plateGeom, plateMat);
        plateMesh.receiveShadow = true;
        plateMesh.castShadow = true;
        plateGroup.add(plateMesh);

        // B. Inner plate rim (glowing accent line)
        const ringGeom = trackGeometry(new THREE.TorusGeometry(2.3, 0.03, 8, 64));
        const ringMat = trackMaterial(new THREE.MeshBasicMaterial({
            color: 0xf59e0b, // Amber-500
        }));
        const ringMesh = new THREE.Mesh(ringGeom, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        ringMesh.position.y = 0.08;
        plateGroup.add(ringMesh);

        // C. Procedural Food - A Salad Bowl Base
        const saladGeom = trackGeometry(new THREE.CylinderGeometry(2.1, 1.8, 0.4, 24));
        const saladMat = trackMaterial(new THREE.MeshStandardMaterial({
            color: 0x10b981, // Emerald green
            roughness: 0.6,
            bumpScale: 0.1
        }));
        const saladMesh = new THREE.Mesh(saladGeom, saladMat);
        saladMesh.position.y = 0.2;
        plateGroup.add(saladMesh);

        // D. Individual Food Pieces (sprinkled on top)
        const foodItems = [];

        // Red Cherry Tomatoes (Spheres)
        const tomatoGeom = trackGeometry(new THREE.SphereGeometry(0.25, 16, 16));
        const tomatoMat = trackMaterial(new THREE.MeshStandardMaterial({
            color: 0xef4444, // Red
            roughness: 0.1,
            metalness: 0.1
        }));

        for (let i = 0; i < 4; i++) {
            const tomato = new THREE.Mesh(tomatoGeom, tomatoMat);
            const angle = (i / 4) * Math.PI * 2 + 0.3;
            const radius = 1.2 + Math.random() * 0.4;
            tomato.position.set(Math.cos(angle) * radius, 0.4 + Math.random() * 0.1, Math.sin(angle) * radius);
            tomato.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            tomato.castShadow = true;
            plateGroup.add(tomato);
            foodItems.push(tomato);
        }

        // Golden Croutons / Paneer Cubes (Boxes)
        const croutonGeom = trackGeometry(new THREE.BoxGeometry(0.35, 0.35, 0.35));
        const croutonMat = trackMaterial(new THREE.MeshStandardMaterial({
            color: 0xf59e0b, // Gold/Amber
            roughness: 0.4,
        }));

        for (let i = 0; i < 5; i++) {
            const crouton = new THREE.Mesh(croutonGeom, croutonMat);
            const angle = (i / 5) * Math.PI * 2 + 1.1;
            const radius = 0.8 + Math.random() * 0.3;
            crouton.position.set(Math.cos(angle) * radius, 0.45 + Math.random() * 0.1, Math.sin(angle) * radius);
            crouton.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            crouton.castShadow = true;
            plateGroup.add(crouton);
            foodItems.push(crouton);
        }

        // Avocado slices (Torus segments or custom curved shapes)
        const avocadoGeom = trackGeometry(new THREE.TorusGeometry(0.5, 0.15, 8, 12, Math.PI));
        const avocadoMat = trackMaterial(new THREE.MeshStandardMaterial({
            color: 0x84cc16, // Lime green
            roughness: 0.8
        }));

        for (let i = 0; i < 3; i++) {
            const avocado = new THREE.Mesh(avocadoGeom, avocadoMat);
            const angle = (i / 3) * Math.PI * 2 + 2.0;
            avocado.position.set(Math.cos(angle) * 1.3, 0.35, Math.sin(angle) * 1.3);
            avocado.rotation.set(Math.PI / 2, 0, angle + Math.PI / 2);
            avocado.castShadow = true;
            plateGroup.add(avocado);
            foodItems.push(avocado);
        }

        // 6. Floating Savory Particles (Aroma/Steam)
        const particleCount = 70;
        const particleGeom = trackGeometry(new THREE.BufferGeometry());
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const randoms = [];

        for (let i = 0; i < particleCount; i++) {
            // Distribute around the plate rising up
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * 3.5;
            const x = Math.cos(angle) * r;
            const y = Math.random() * 6 - 2; // vertically from -2 to 4
            const z = Math.sin(angle) * r;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            sizes[i] = Math.random() * 0.12 + 0.04;
            randoms.push({
                speedY: Math.random() * 0.01 + 0.005,
                angleSpeed: Math.random() * 0.02,
                radius: r,
                angle: angle,
                baseY: Math.random() * 3 - 1
            });
        }

        particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Create a custom soft circular particle texture dynamically using Canvas
        const pCanvas = document.createElement('canvas');
        pCanvas.width = 16;
        pCanvas.height = 16;
        const ctx = pCanvas.getContext('2d');
        const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        gradient.addColorStop(0, 'rgba(245, 158, 11, 1)'); // Glowing amber center
        gradient.addColorStop(0.3, 'rgba(239, 68, 68, 0.8)'); // Hot orange-red inner glow
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Fade out
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 16, 16);
        const pTexture = new THREE.CanvasTexture(pCanvas);

        const particleMat = trackMaterial(new THREE.PointsMaterial({
            size: 0.25,
            map: pTexture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            opacity: 0.85
        }));

        const particles = new THREE.Points(particleGeom, particleMat);
        scene.add(particles);

        // 7. Interaction and Parallax
        const onMouseMove = (event) => {
            const rect = container.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            targetMouseRef.current = { x, y };
        };

        window.addEventListener('mousemove', onMouseMove);

        // 8. Animation & Render loop
        let animationId;
        let clock = new THREE.Clock();

        const animate = () => {
            animationId = requestAnimationFrame(animate);

            const elapsedTime = clock.getElapsedTime();

            // Smooth interpolation for mouse movements
            mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * 0.08;
            mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * 0.08;

            // Camera Intro Sequence (slowly zoom into perfect viewing position)
            if (camera.position.z > 8.0) {
                camera.position.z -= 0.05;
                camera.position.y -= 0.035;
            }

            // Subtly rotate and float the plate group
            plateGroup.rotation.y = elapsedTime * 0.25 + mouseRef.current.x * 0.4;
            plateGroup.rotation.x = 0.35 + Math.sin(elapsedTime * 0.7) * 0.05 + mouseRef.current.y * -0.25;
            plateGroup.position.y = Math.sin(elapsedTime * 1.2) * 0.15;

            // Subtly animate individual food items for dynamic floaty look
            foodItems.forEach((item, index) => {
                item.position.y += Math.sin(elapsedTime * 2.0 + index) * 0.0015;
                item.rotation.y += 0.002 * (index % 2 === 0 ? 1 : -1);
            });

            // Animate floating aroma particles
            const posAttr = particleGeom.getAttribute('position');
            for (let i = 0; i < particleCount; i++) {
                const rInfo = randoms[i];
                // Move particles upwards
                let y = posAttr.getY(i);
                y += rInfo.speedY;
                if (y > 4.5) {
                    y = -2; // Reset at bottom
                }
                posAttr.setY(i, y);

                // Revolve around Y-axis
                rInfo.angle += rInfo.angleSpeed;
                const x = Math.cos(rInfo.angle) * (rInfo.radius + Math.sin(elapsedTime + i) * 0.1);
                const z = Math.sin(rInfo.angle) * (rInfo.radius + Math.sin(elapsedTime + i) * 0.1);
                posAttr.setX(i, x);
                posAttr.setZ(i, z);
            }
            posAttr.needsUpdate = true;

            // Camera subtle lag behind mouse
            camera.position.x = mouseRef.current.x * 1.5;
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
        };

        animate();

        // 9. Resize handler
        const handleResize = () => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };

        const resizeObserver = new ResizeObserver(() => {
            handleResize();
        });
        resizeObserver.observe(container);

        // 10. Clean up
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            resizeObserver.disconnect();
            cancelAnimationFrame(animationId);

            // Clean up WebGL resources
            geometries.forEach(g => g.dispose());
            materials.forEach(m => m.dispose());
            pTexture.dispose();

            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, []);

    return (
        <div 
            ref={containerRef} 
            className="w-full h-full min-h-[350px] md:min-h-[500px] relative z-20 pointer-events-auto"
            style={{ touchAction: 'none' }}
        />
    );
};

export default ThreeDHeroScene;
