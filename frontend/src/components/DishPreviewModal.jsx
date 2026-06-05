import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

// ─── Procedural 3D Dish Scene ────────────────────────────────────────────────
const Dish3DCanvas = ({ dish }) => {
    const mountRef = useRef(null);

    useEffect(() => {
        if (!mountRef.current) return;
        const el = mountRef.current;
        const W = el.clientWidth || 400;
        const H = el.clientHeight || 300;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
        camera.position.set(0, 3.5, 6);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(W, H);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        el.appendChild(renderer.domElement);

        // Lighting
        scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const key = new THREE.DirectionalLight(0xffaa44, 2.5);
        key.position.set(4, 8, 4);
        key.castShadow = true;
        scene.add(key);
        const fill = new THREE.DirectionalLight(0x8855ff, 1.0);
        fill.position.set(-4, 2, -3);
        scene.add(fill);

        const geoms = [], mats = [];
        const g = (geo) => { geoms.push(geo); return geo; };
        const m = (mat) => { mats.push(mat); return mat; };
        const group = new THREE.Group();
        scene.add(group);

        // Detect dish type from name/tags
        const name = (dish?.name || '').toLowerCase();
        const tags = (dish?.dietaryTags || []).join(' ').toLowerCase();
        const isBurger = /burger|sandwich|bun/.test(name);
        const isPizza  = /pizza|slice/.test(name);
        const isBiryani = /biryani|rice|pulao/.test(name);
        const isIceCream = /ice.?cream|gelato|sundae/.test(name);

        if (isBurger) {
            // Bottom bun
            group.add(Object.assign(new THREE.Mesh(
                g(new THREE.CylinderGeometry(1.1, 1.1, 0.35, 32)),
                m(new THREE.MeshStandardMaterial({ color: 0xd4a055, roughness: 0.7 }))
            ), { position: new THREE.Vector3(0, 0, 0) }));
            // Patty
            group.add(Object.assign(new THREE.Mesh(
                g(new THREE.CylinderGeometry(1.0, 1.0, 0.25, 32)),
                m(new THREE.MeshStandardMaterial({ color: 0x5a2d0c, roughness: 0.8 }))
            ), { position: new THREE.Vector3(0, 0.32, 0) }));
            // Cheese
            group.add(Object.assign(new THREE.Mesh(
                g(new THREE.BoxGeometry(1.8, 0.08, 1.8)),
                m(new THREE.MeshStandardMaterial({ color: 0xf5c518, roughness: 0.4 }))
            ), { position: new THREE.Vector3(0, 0.52, 0) }));
            // Lettuce
            group.add(Object.assign(new THREE.Mesh(
                g(new THREE.CylinderGeometry(1.15, 1.15, 0.12, 32)),
                m(new THREE.MeshStandardMaterial({ color: 0x4a9e4a, roughness: 0.9 }))
            ), { position: new THREE.Vector3(0, 0.62, 0) }));
            // Top bun
            group.add(Object.assign(new THREE.Mesh(
                g(new THREE.SphereGeometry(1.1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)),
                m(new THREE.MeshStandardMaterial({ color: 0xd4a055, roughness: 0.6 }))
            ), { position: new THREE.Vector3(0, 0.75, 0) }));
        } else if (isPizza) {
            // Pizza base
            group.add(Object.assign(new THREE.Mesh(
                g(new THREE.CylinderGeometry(1.8, 1.8, 0.1, 32)),
                m(new THREE.MeshStandardMaterial({ color: 0xe8c08a, roughness: 0.8 }))
            )));
            // Sauce layer
            group.add(Object.assign(new THREE.Mesh(
                g(new THREE.CylinderGeometry(1.6, 1.6, 0.06, 32)),
                m(new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.6 }))
            ), { position: new THREE.Vector3(0, 0.08, 0) }));
            // Toppings: cheese blobs
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const blob = new THREE.Mesh(
                    g(new THREE.SphereGeometry(0.25, 8, 8)),
                    m(new THREE.MeshStandardMaterial({ color: 0xf5e642, roughness: 0.4 }))
                );
                blob.position.set(Math.cos(angle) * 0.9, 0.18, Math.sin(angle) * 0.9);
                group.add(blob);
            }
            // Pepperoni dots
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2 + 0.5;
                const pep = new THREE.Mesh(
                    g(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 16)),
                    m(new THREE.MeshStandardMaterial({ color: 0x8b1a1a, roughness: 0.6 }))
                );
                pep.position.set(Math.cos(angle) * 0.7, 0.16, Math.sin(angle) * 0.7);
                group.add(pep);
            }
        } else if (isBiryani) {
            // Bowl
            group.add(Object.assign(new THREE.Mesh(
                g(new THREE.SphereGeometry(1.4, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)),
                m(new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.5, metalness: 0.3 }))
            )));
            // Rice mound
            group.add(Object.assign(new THREE.Mesh(
                g(new THREE.SphereGeometry(1.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)),
                m(new THREE.MeshStandardMaterial({ color: 0xf5e6c8, roughness: 0.9 }))
            ), { position: new THREE.Vector3(0, 0, 0) }));
            // Saffron strands (orange dots)
            for (let i = 0; i < 8; i++) {
                const s = new THREE.Mesh(
                    g(new THREE.SphereGeometry(0.07, 6, 6)),
                    m(new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.6 }))
                );
                s.position.set((Math.random() - 0.5) * 1.8, 0.4, (Math.random() - 0.5) * 1.8);
                group.add(s);
            }
        } else if (isIceCream) {
            // Cone
            group.add(Object.assign(new THREE.Mesh(
                g(new THREE.ConeGeometry(0.8, 2, 32)),
                m(new THREE.MeshStandardMaterial({ color: 0xd4a055, roughness: 0.8 }))
            ), { position: new THREE.Vector3(0, -0.5, 0) }));
            // Scoop 1
            group.add(Object.assign(new THREE.Mesh(
                g(new THREE.SphereGeometry(0.9, 32, 32)),
                m(new THREE.MeshStandardMaterial({ color: 0xffc0cb, roughness: 0.3 }))
            ), { position: new THREE.Vector3(0, 0.9, 0) }));
            // Scoop 2
            group.add(Object.assign(new THREE.Mesh(
                g(new THREE.SphereGeometry(0.75, 32, 32)),
                m(new THREE.MeshStandardMaterial({ color: 0xd2691e, roughness: 0.3 }))
            ), { position: new THREE.Vector3(0, 1.9, 0) }));
        } else {
            // Default: glowing plate with floating veg
            group.add(Object.assign(new THREE.Mesh(
                g(new THREE.CylinderGeometry(1.8, 1.6, 0.15, 32)),
                m(new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.2, metalness: 0.7 }))
            )));
            // Amber ring
            group.add(Object.assign(new THREE.Mesh(
                g(new THREE.TorusGeometry(1.65, 0.04, 8, 64)),
                m(new THREE.MeshBasicMaterial({ color: 0xf59e0b }))
            ), { rotation: new THREE.Euler(Math.PI / 2, 0, 0), position: new THREE.Vector3(0, 0.08, 0) }));
            // Salad base
            group.add(Object.assign(new THREE.Mesh(
                g(new THREE.CylinderGeometry(1.5, 1.3, 0.3, 24)),
                m(new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.7 }))
            ), { position: new THREE.Vector3(0, 0.18, 0) }));
            // Tomatoes
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                const t = new THREE.Mesh(
                    g(new THREE.SphereGeometry(0.22, 16, 16)),
                    m(new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2 }))
                );
                t.position.set(Math.cos(angle) * 0.9, 0.45, Math.sin(angle) * 0.9);
                group.add(t);
            }
        }

        // ─ Mouse drag rotation ─────────────────────────────────
        let isDragging = false, lastX = 0;
        const onDown  = e => { isDragging = true; lastX = e.clientX ?? e.touches?.[0]?.clientX; };
        const onMove  = e => {
            if (!isDragging) return;
            const x = e.clientX ?? e.touches?.[0]?.clientX;
            group.rotation.y += (x - lastX) * 0.01;
            lastX = x;
        };
        const onUp    = () => { isDragging = false; };
        el.addEventListener('mousedown', onDown);
        el.addEventListener('mousemove', onMove);
        el.addEventListener('mouseup', onUp);
        el.addEventListener('touchstart', onDown, { passive: true });
        el.addEventListener('touchmove', onMove, { passive: true });
        el.addEventListener('touchend', onUp);

        // ─ Animation loop ────────────────────────────────────────
        let rafId;
        const clock = new THREE.Clock();
        const animate = () => {
            rafId = requestAnimationFrame(animate);
            const t = clock.getElapsedTime();
            if (!isDragging) group.rotation.y = t * 0.4;
            group.position.y = Math.sin(t * 1.2) * 0.12;
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(rafId);
            el.removeEventListener('mousedown', onDown);
            el.removeEventListener('mousemove', onMove);
            el.removeEventListener('mouseup', onUp);
            el.removeEventListener('touchstart', onDown);
            el.removeEventListener('touchmove', onMove);
            el.removeEventListener('touchend', onUp);
            geoms.forEach(g => g.dispose());
            mats.forEach(m => m.dispose());
            if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
            renderer.dispose();
        };
    }, [dish]);

    return (
        <div
            ref={mountRef}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            title="Drag to rotate"
        />
    );
};

// ─── Main Modal ──────────────────────────────────────────────────────────────
const DishPreviewModal = ({ dish, onClose, onAddToCart }) => {
    const [viewMode, setViewMode] = useState('image'); // 'image' | '3d'

    if (!dish) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-[40px] overflow-hidden shadow-2xl relative"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex flex-col md:flex-row h-full max-h-[90vh] overflow-y-auto">

                    {/* Visual Section */}
                    <div className="w-full md:w-1/2 h-72 md:h-auto relative overflow-hidden bg-gray-950 flex flex-col">

                        {/* View Toggle */}
                        <div className="absolute top-4 left-4 z-10 flex bg-black/50 backdrop-blur-md rounded-full p-0.5 border border-white/20 text-[9px]">
                            <button
                                onClick={() => setViewMode('image')}
                                className={`px-3 py-1.5 rounded-full font-black uppercase tracking-widest transition-all ${viewMode === 'image' ? 'bg-white text-gray-900 shadow' : 'text-white/70 hover:text-white'}`}
                            >
                                📸 Photo
                            </button>
                            <button
                                onClick={() => setViewMode('3d')}
                                className={`px-3 py-1.5 rounded-full font-black uppercase tracking-widest transition-all ${viewMode === '3d' ? 'bg-white text-gray-900 shadow' : 'text-white/70 hover:text-white'}`}
                            >
                                🎲 3D View
                            </button>
                        </div>

                        <AnimatePresence mode="wait">
                            {viewMode === 'image' ? (
                                <motion.div
                                    key="img"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="w-full h-full"
                                >
                                    <motion.img
                                        src={dish.image}
                                        alt={dish.name}
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ duration: 0.5 }}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-white/10" />
                                    <motion.div
                                        initial={{ x: -50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="absolute top-14 left-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-3 text-white text-xs"
                                    >
                                        <p className="font-black uppercase tracking-[0.2em] text-[9px]">Type</p>
                                        <div className="mt-1 font-bold">
                                            {dish.isVeg !== undefined ? (dish.isVeg ? '🍀 Veg' : '🍗 Non-Veg') : (dish.foodType === 'Veg' ? '🍀 Veg' : '🍗 Non-Veg')}
                                        </div>
                                    </motion.div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="3d"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="w-full h-full flex flex-col items-center"
                                >
                                    <div className="flex-1 w-full">
                                        <Dish3DCanvas dish={dish} />
                                    </div>
                                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest pb-3">
                                        Drag to rotate · WebGL 3D Model
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 md:hidden w-9 h-9 bg-black/50 text-white rounded-full flex items-center justify-center font-bold text-sm z-10"
                        >✕</button>
                    </div>

                    {/* Info Section */}
                    <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                        <button
                            onClick={onClose}
                            className="hidden md:flex absolute top-8 right-8 w-10 h-10 bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-red-500 rounded-full items-center justify-center transition-colors font-bold"
                        >✕</button>

                        <div className="mb-8">
                            <span className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1.5 rounded-full">
                                Signature Dish
                            </span>
                            <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mt-4 mb-2">{dish.name}</h2>
                            <p className="text-2xl font-black text-primary">₹{dish.price}</p>
                        </div>

                        <div className="space-y-5 mb-10">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Description</label>
                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                    {dish.description || 'Delightful meal prepared with fresh ingredients.'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Calories</p>
                                    <p className="text-lg font-black text-gray-900 dark:text-white">~450 kcal</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prep Time</p>
                                    <p className="text-lg font-black text-gray-900 dark:text-white">15–20 min</p>
                                </div>
                            </div>

                            {dish.dietaryTags?.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {dish.dietaryTags.map(tag => (
                                        <span key={tag} className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-green-200 dark:border-green-700">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { onAddToCart?.(dish); onClose(); }}
                            className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-2xl shadow-red-200 dark:shadow-red-900/40 flex items-center justify-center gap-3"
                        >
                            <span>🛒 Add to Cart</span>
                            <span className="w-px h-4 bg-white/30" />
                            <span>₹{dish.price}</span>
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default DishPreviewModal;
