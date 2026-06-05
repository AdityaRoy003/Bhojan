import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeDDeliveryCanvas = ({ currentStatus }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth || 400;
        const height = container.clientHeight || 300;

        // 1. Scene & Camera
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
        camera.position.set(0, 5, 12);
        camera.lookAt(0, 0, 0);

        // 2. Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        const geometries = [];
        const materials = [];

        const trackGeometry = (g) => { geometries.push(g); return g; };
        const trackMaterial = (m) => { materials.push(m); return m; };

        // 3. Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(3, 8, 4);
        scene.add(dirLight);

        const pointLight = new THREE.PointLight(0xffaa44, 2, 8);
        pointLight.position.set(-3.5, 1, 0); // Light up the restaurant
        scene.add(pointLight);

        const houseLight = new THREE.PointLight(0x10b981, 2, 8);
        houseLight.position.set(3.5, 1, 0); // Light up the house
        scene.add(houseLight);

        // 4. Nodes (Restaurant & House)
        const nodesGroup = new THREE.Group();
        scene.add(nodesGroup);

        // Restaurant Node (X = -3.5)
        const restGroup = new THREE.Group();
        restGroup.position.set(-3.5, 0, 0);

        const restBaseGeom = trackGeometry(new THREE.CylinderGeometry(0.6, 0.6, 0.3, 16));
        const restBaseMat = trackMaterial(new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.5 }));
        const restBase = new THREE.Mesh(restBaseGeom, restBaseMat);
        restGroup.add(restBase);

        const restRoofGeom = trackGeometry(new THREE.ConeGeometry(0.7, 0.5, 4));
        const restRoofMat = trackMaterial(new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 })); // Orange roof
        const restRoof = new THREE.Mesh(restRoofGeom, restRoofMat);
        restRoof.position.y = 0.4;
        restRoof.rotation.y = Math.PI / 4;
        restGroup.add(restRoof);

        nodesGroup.add(restGroup);

        // House Node (X = 3.5)
        const houseGroup = new THREE.Group();
        houseGroup.position.set(3.5, 0, 0);

        const houseBaseGeom = trackGeometry(new THREE.BoxGeometry(0.8, 0.6, 0.8));
        const houseBaseMat = trackMaterial(new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 }));
        const houseBase = new THREE.Mesh(houseBaseGeom, houseBaseMat);
        houseBase.position.y = 0.15;
        houseGroup.add(houseBase);

        const houseRoofGeom = trackGeometry(new THREE.ConeGeometry(0.7, 0.5, 4));
        const houseRoofMat = trackMaterial(new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5 })); // Dark roof
        const houseRoof = new THREE.Mesh(houseRoofGeom, houseRoofMat);
        houseRoof.position.y = 0.65;
        houseRoof.rotation.y = Math.PI / 4;
        houseGroup.add(houseRoof);

        nodesGroup.add(houseGroup);

        // 5. Spline Route Curve (S-shaped curve connecting nodes)
        const p0 = new THREE.Vector3(-3.5, 0.15, 0);
        const p1 = new THREE.Vector3(-1.8, 0.15, -1.2);
        const p2 = new THREE.Vector3(1.8, 0.15, 1.2);
        const p3 = new THREE.Vector3(3.5, 0.15, 0);
        const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);

        // Path Tube
        const pathGeom = trackGeometry(new THREE.TubeGeometry(curve, 64, 0.05, 8, false));
        const pathMat = trackMaterial(new THREE.MeshStandardMaterial({
            color: 0xe5e7eb, // Light gray base path
            roughness: 0.5,
            metalness: 0.2
        }));
        const pathMesh = new THREE.Mesh(pathGeom, pathMat);
        scene.add(pathMesh);

        // Glowing progress overlay (colored curve tube)
        // We will create a material that we can dynamically alter or texture
        const progressMat = trackMaterial(new THREE.MeshBasicMaterial({
            color: 0xf97316, // Orange progress
            transparent: true,
            opacity: 0.8
        }));

        // 6. Courier Marker (glowing capsule/sphere)
        const courierGroup = new THREE.Group();
        scene.add(courierGroup);

        const courierGeom = trackGeometry(new THREE.SphereGeometry(0.2, 16, 16));
        const courierMat = trackMaterial(new THREE.MeshBasicMaterial({ color: 0xf59e0b })); // Glowing gold
        const courierMesh = new THREE.Mesh(courierGeom, courierMat);
        courierGroup.add(courierMesh);

        // Small ring around courier
        const courierRingGeom = trackGeometry(new THREE.TorusGeometry(0.35, 0.02, 4, 32));
        const courierRingMat = trackMaterial(new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.8 }));
        const courierRing = new THREE.Mesh(courierRingGeom, courierRingMat);
        courierRing.rotation.x = Math.PI / 2;
        courierGroup.add(courierRing);

        // 7. Milestone Indicators
        const milestonePoints = [0, 0.33, 0.66, 1.0];
        const milestones = [];
        const milestoneRings = [];

        const msGeom = trackGeometry(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 16));
        const ringTorusGeom = trackGeometry(new THREE.TorusGeometry(0.3, 0.015, 4, 32));

        milestonePoints.forEach((t, index) => {
            const pt = curve.getPointAt(t);

            // Base dot
            const isCompleted = getMilestoneCompleted(index, currentStatus);
            const msMat = trackMaterial(new THREE.MeshBasicMaterial({
                color: isCompleted ? 0xef4444 : 0x9ca3af // Red if completed, gray if not
            }));
            const msMesh = new THREE.Mesh(msGeom, msMat);
            msMesh.position.copy(pt);
            scene.add(msMesh);
            milestones.push({ mesh: msMesh, completed: isCompleted });

            // Ripple Ring
            if (isMilestoneActive(index, currentStatus)) {
                const ringMat = trackMaterial(new THREE.MeshBasicMaterial({
                    color: 0xf59e0b,
                    transparent: true,
                    opacity: 0.8
                }));
                const ringMesh = new THREE.Mesh(ringTorusGeom, ringMat);
                ringMesh.position.copy(pt);
                ringMesh.rotation.x = Math.PI / 2;
                scene.add(ringMesh);
                milestoneRings.push(ringMesh);
            }
        });

        // 8. Dynamic Particle Systems for Special States
        // cooking steam if preparing, confetti/stars if delivered
        const particlesCount = 20;
        const partGeom = trackGeometry(new THREE.BufferGeometry());
        const partPos = new Float32Array(particlesCount * 3);
        const partSpeeds = [];

        let particlesActive = false;
        let pColor = 0xffffff;
        let pCenter = new THREE.Vector3();

        if (currentStatus === 'Preparing') {
            particlesActive = true;
            pColor = 0xffaa44; // Orange sparks
            pCenter.copy(p0); // Emit from restaurant
        } else if (currentStatus === 'Delivered') {
            particlesActive = true;
            pColor = 0x10b981; // Green confetti
            pCenter.copy(p3); // Emit from house
        }

        for (let i = 0; i < particlesCount; i++) {
            partPos[i * 3] = pCenter.x + (Math.random() - 0.5) * 0.5;
            partPos[i * 3 + 1] = pCenter.y + 0.2;
            partPos[i * 3 + 2] = pCenter.z + (Math.random() - 0.5) * 0.5;
            partSpeeds.push({
                x: (Math.random() - 0.5) * 0.015,
                y: Math.random() * 0.02 + 0.01,
                z: (Math.random() - 0.5) * 0.015
            });
        }

        partGeom.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
        const partMat = trackMaterial(new THREE.PointsMaterial({
            size: 0.15,
            color: pColor,
            transparent: true,
            opacity: 0.85
        }));
        const statusParticles = new THREE.Points(partGeom, partMat);

        if (particlesActive) {
            scene.add(statusParticles);
        }

        // Helper to check completion status
        function getMilestoneCompleted(idx, status) {
            const statusOrder = ['Placed', 'Preparing', 'OutForDelivery', 'Delivered'];
            const currentIdx = statusOrder.indexOf(status);
            return idx <= currentIdx;
        }

        function isMilestoneActive(idx, status) {
            const statusOrder = ['Placed', 'Preparing', 'OutForDelivery', 'Delivered'];
            const currentIdx = statusOrder.indexOf(status);
            return idx === currentIdx && status !== 'Delivered'; // ripple active milestone
        }

        // 9. Animation Loop
        let animationId;
        let clock = new THREE.Clock();

        const animate = () => {
            animationId = requestAnimationFrame(animate);
            const elapsedTime = clock.getElapsedTime();

            // Rotate nodes slowly
            restGroup.rotation.y = elapsedTime * 0.4;
            houseGroup.rotation.y = elapsedTime * 0.3;

            // Slow rotate the whole scene slightly for depth
            scene.rotation.y = Math.sin(elapsedTime * 0.3) * 0.15;

            // Determine target position of courier on the curve
            let targetT = 0;
            switch (currentStatus) {
                case 'Placed':
                    targetT = 0.0;
                    break;
                case 'Preparing':
                    targetT = 0.15;
                    break;
                case 'OutForDelivery':
                    // Make it glide smoothly back and forth between 0.33 and 0.9
                    targetT = 0.33 + 0.52 * (0.5 + 0.5 * Math.sin(elapsedTime * 1.5));
                    break;
                case 'Delivered':
                    targetT = 1.0;
                    break;
                default:
                    targetT = 0.0;
            }

            // Interpolate courier location
            const courierPos = curve.getPointAt(targetT);
            courierGroup.position.copy(courierPos);

            // Pulsate courier ring
            courierRing.scale.setScalar(1 + Math.sin(elapsedTime * 6) * 0.25);
            courierRing.rotation.z += 0.05;

            // Pulsate milestone active rings
            milestoneRings.forEach(ring => {
                const scaleVal = 1 + (elapsedTime * 1.5) % 1.5;
                ring.scale.setScalar(scaleVal);
                ring.material.opacity = 1 - (scaleVal - 1) / 1.5;
            });

            // Animate particles
            if (particlesActive) {
                const positionsAttr = partGeom.getAttribute('position');
                for (let i = 0; i < particlesCount; i++) {
                    let px = positionsAttr.getX(i);
                    let py = positionsAttr.getY(i);
                    let pz = positionsAttr.getZ(i);

                    const speed = partSpeeds[i];
                    px += speed.x;
                    py += speed.y;
                    pz += speed.z;

                    // Reset when floating too high
                    if (py > 2.5) {
                        px = pCenter.x + (Math.random() - 0.5) * 0.5;
                        py = pCenter.y + 0.2;
                        pz = pCenter.z + (Math.random() - 0.5) * 0.5;
                    }

                    positionsAttr.setX(i, px);
                    positionsAttr.setY(i, py);
                    positionsAttr.setZ(i, pz);
                }
                positionsAttr.needsUpdate = true;
            }

            renderer.render(scene, camera);
        };

        animate();

        // 10. Resize
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

        // 11. Cleanup
        return () => {
            resizeObserver.disconnect();
            cancelAnimationFrame(animationId);

            geometries.forEach(g => g.dispose());
            materials.forEach(m => m.dispose());

            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [currentStatus]);

    return (
        <div 
            ref={containerRef} 
            className="w-full h-64 md:h-72 bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 rounded-3xl border border-gray-800 shadow-xl overflow-hidden relative"
        />
    );
};

export default ThreeDDeliveryCanvas;
