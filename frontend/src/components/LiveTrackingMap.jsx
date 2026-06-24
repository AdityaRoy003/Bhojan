import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── Fix default leaflet icons ──────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ── Custom icons ───────────────────────────────────────────────────────────
const createRiderIcon = (heading = 0) => L.divIcon({
    className: '',
    html: `
        <div style="
            width: 44px; height: 44px;
            background: linear-gradient(135deg, #f97316, #ef4444);
            border-radius: 50% 50% 50% 0;
            transform: rotate(${heading - 45}deg);
            box-shadow: 0 4px 20px rgba(239,68,68,0.5), 0 0 0 3px white;
            display: flex; align-items: center; justify-content: center;
            transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        ">
            <span style="transform: rotate(${45 - heading}deg); font-size: 18px; line-height:1;">🏍️</span>
        </div>
        <div style="
            width: 8px; height: 8px;
            background: rgba(239,68,68,0.3);
            border-radius: 50%;
            margin: 2px auto 0;
            animation: pulse 1.5s ease-in-out infinite;
        "></div>
        <style>
            @keyframes pulse { 0%,100%{transform:scale(1);opacity:0.7} 50%{transform:scale(2.5);opacity:0} }
        </style>
    `,
    iconSize: [44, 56],
    iconAnchor: [22, 50],
    popupAnchor: [0, -52],
});

const restaurantIcon = L.divIcon({
    className: '',
    html: `
        <div style="
            width: 40px; height: 40px;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            border-radius: 50%;
            box-shadow: 0 4px 15px rgba(245,158,11,0.4), 0 0 0 3px white;
            display: flex; align-items: center; justify-content: center;
            font-size: 18px;
        ">🏪</div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -42],
});

const customerIcon = L.divIcon({
    className: '',
    html: `
        <div style="
            width: 40px; height: 40px;
            background: linear-gradient(135deg, #10b981, #059669);
            border-radius: 50%;
            box-shadow: 0 4px 15px rgba(16,185,129,0.4), 0 0 0 3px white;
            display: flex; align-items: center; justify-content: center;
            font-size: 18px;
        ">🏠</div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -42],
});

// ── Smooth map re-centering component ─────────────────────────────────────
const SmoothMapCenter = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom, { animate: true, duration: 1.2 });
        }
    }, [center, zoom, map]);
    return null;
};

// ── Animated Rider Marker (interpolates between positions) ────────────────
const AnimatedRiderMarker = ({ position, heading, riderName }) => {
    const markerRef = useRef(null);
    const prevPosRef = useRef(position);
    const frameRef = useRef(null);
    const [displayPos, setDisplayPos] = useState(position);
    const [currentHeading, setCurrentHeading] = useState(heading);

    // Linear interpolation helper
    const lerp = (a, b, t) => a + (b - a) * t;

    useEffect(() => {
        if (!position) return;

        const startPos = prevPosRef.current || position;
        const endPos = position;
        const startTime = performance.now();
        const duration = 2000; // 2 second smooth glide

        if (frameRef.current) cancelAnimationFrame(frameRef.current);

        const animate = (now) => {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1);
            // Ease-in-out cubic
            const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

            const lat = lerp(startPos[0], endPos[0], ease);
            const lng = lerp(startPos[1], endPos[1], ease);

            setDisplayPos([lat, lng]);
            setCurrentHeading(heading);

            if (t < 1) {
                frameRef.current = requestAnimationFrame(animate);
            } else {
                prevPosRef.current = endPos;
            }
        };

        frameRef.current = requestAnimationFrame(animate);
        return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
    }, [position?.[0], position?.[1], heading]);

    if (!displayPos) return null;

    return (
        <Marker
            ref={markerRef}
            position={displayPos}
            icon={createRiderIcon(currentHeading)}
        >
            <Popup>
                <div style={{ fontFamily: 'sans-serif', minWidth: '120px' }}>
                    <p style={{ fontWeight: 800, margin: 0, fontSize: '13px' }}>🏍️ {riderName || 'Delivery Partner'}</p>
                    <p style={{ color: '#6b7280', margin: '2px 0 0', fontSize: '11px' }}>En route to you</p>
                </div>
            </Popup>
        </Marker>
    );
};

// ── Main LiveTrackingMap Component ────────────────────────────────────────
/**
 * Props:
 *  - mode: 'customer' | 'rider'
 *  - riderPosition: [lat, lng] | null
 *  - restaurantCoords: { lat, lng } | null
 *  - deliveryCoords: { lat, lng } | null
 *  - riderHeading: number (0-360)
 *  - riderName: string
 *  - shopName: string
 *  - deliveryAddress: string
 *  - liveMode: bool  (whether socket updates are flowing)
 *  - height: string (css, default '100%')
 */
const LiveTrackingMap = ({
    mode = 'customer',
    riderPosition = null,
    restaurantCoords = null,
    deliveryCoords = null,
    riderHeading = 0,
    riderName = 'Delivery Partner',
    shopName = 'Restaurant',
    deliveryAddress = 'Your Location',
    liveMode = false,
    height = '100%',
}) => {
    // Build initial center: prefer rider, then restaurant, then fallback Delhi
    const getCenter = useCallback(() => {
        if (riderPosition) return riderPosition;
        if (restaurantCoords?.lat) return [restaurantCoords.lat, restaurantCoords.lng];
        if (deliveryCoords?.lat) return [deliveryCoords.lat, deliveryCoords.lng];
        return [28.6139, 77.2090];
    }, [riderPosition, restaurantCoords, deliveryCoords]);

    const initialCenter = getCenter();

    // Build polyline route: restaurant → rider → customer
    const polylinePoints = [];
    if (restaurantCoords?.lat) polylinePoints.push([restaurantCoords.lat, restaurantCoords.lng]);
    if (riderPosition) polylinePoints.push(riderPosition);
    if (deliveryCoords?.lat) polylinePoints.push([deliveryCoords.lat, deliveryCoords.lng]);

    // Completed segment (restaurant → rider)
    const completedLine = [];
    if (restaurantCoords?.lat) completedLine.push([restaurantCoords.lat, restaurantCoords.lng]);
    if (riderPosition) completedLine.push(riderPosition);

    // Remaining segment (rider → customer)
    const remainingLine = [];
    if (riderPosition) remainingLine.push(riderPosition);
    if (deliveryCoords?.lat) remainingLine.push([deliveryCoords.lat, deliveryCoords.lng]);

    return (
        <div style={{ height, width: '100%', position: 'relative', borderRadius: '0' }}>
            {/* LIVE badge */}
            {liveMode && (
                <div style={{
                    position: 'absolute', top: 12, left: 12, zIndex: 1000,
                    background: 'rgba(16,185,129,0.95)',
                    backdropFilter: 'blur(8px)',
                    color: 'white', borderRadius: '999px',
                    padding: '4px 12px', fontSize: '11px', fontWeight: 800,
                    display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 2px 12px rgba(16,185,129,0.4)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                }}>
                    <span style={{
                        width: 7, height: 7, borderRadius: '50%', background: '#fff',
                        animation: 'pulse-white 1.2s ease-in-out infinite',
                        display: 'inline-block',
                    }} />
                    Live
                </div>
            )}

            <style>{`
                @keyframes pulse-white {
                    0%,100%{opacity:1;transform:scale(1)}
                    50%{opacity:0.4;transform:scale(1.8)}
                }
            `}</style>

            <MapContainer
                center={initialCenter}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
                attributionControl={false}
            >
                {/* Dark tile layer (like Swiggy's map) */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />

                {/* Auto-pan map when rider moves */}
                {riderPosition && mode === 'customer' && (
                    <SmoothMapCenter center={riderPosition} zoom={15} />
                )}

                {/* Restaurant Pin */}
                {restaurantCoords?.lat && (
                    <Marker position={[restaurantCoords.lat, restaurantCoords.lng]} icon={restaurantIcon}>
                        <Popup>
                            <strong>🏪 {shopName}</strong>
                            <br />Pickup location
                        </Popup>
                    </Marker>
                )}

                {/* Customer Drop Pin */}
                {deliveryCoords?.lat && (
                    <Marker position={[deliveryCoords.lat, deliveryCoords.lng]} icon={customerIcon}>
                        <Popup>
                            <strong>🏠 Delivery Address</strong>
                            <br />{deliveryAddress}
                        </Popup>
                    </Marker>
                )}

                {/* Animated Rider Marker */}
                {riderPosition && (
                    <AnimatedRiderMarker
                        position={riderPosition}
                        heading={riderHeading}
                        riderName={riderName}
                    />
                )}

                {/* Completed route — solid orange */}
                {completedLine.length >= 2 && (
                    <Polyline
                        positions={completedLine}
                        pathOptions={{
                            color: '#f97316',
                            weight: 5,
                            opacity: 0.9,
                            lineCap: 'round',
                            lineJoin: 'round',
                        }}
                    />
                )}

                {/* Remaining route — dashed gray */}
                {remainingLine.length >= 2 && (
                    <Polyline
                        positions={remainingLine}
                        pathOptions={{
                            color: '#6b7280',
                            weight: 4,
                            opacity: 0.6,
                            dashArray: '10, 12',
                            lineCap: 'round',
                        }}
                    />
                )}
            </MapContainer>
        </div>
    );
};

export default LiveTrackingMap;
