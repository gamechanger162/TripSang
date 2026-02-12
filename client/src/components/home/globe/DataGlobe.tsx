'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { CITY_DATA, latLngToVector3 } from './cityData';

/* ─── Constants ─────────────────────────────────────────────────── */
const GLOBE_RADIUS = 2;
const ROTATION_SPEED = (2 * Math.PI) / 120;
const HOVER_SPEED_FACTOR = 0.25;

// NASA Earth at Night texture (public domain, hosted by three-globe)
const EARTH_NIGHT_TEXTURE_URL =
    'https://unpkg.com/three-globe@2.31.1/example/img/earth-night.jpg';

/* ─── Label cities (major ones with connector lines + text) ───── */
const LABEL_CITIES = [
    { name: 'New York', lat: 40.7128, lng: -74.006 },
    { name: 'London', lat: 51.5074, lng: -0.1278 },
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
    { name: 'Shanghai', lat: 31.2304, lng: 121.4737 },
    { name: 'Mumbai', lat: 19.076, lng: 72.8777 },
    { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
    { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
    { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
    { name: 'São Paulo', lat: -23.5505, lng: -46.6333 },
    { name: 'Cape Town', lat: -33.9249, lng: 18.4241 },
    { name: 'Moscow', lat: 55.7558, lng: 37.6173 },
    { name: 'Beijing', lat: 39.9042, lng: 116.4074 },
    { name: 'Paris', lat: 48.8566, lng: 2.3522 },
    { name: 'Delhi', lat: 28.6139, lng: 77.209 },
    { name: 'Bangkok', lat: 13.7563, lng: 100.5018 },
    { name: 'Seoul', lat: 37.5665, lng: 126.978 },
    { name: 'Jakarta', lat: -6.2088, lng: 106.8456 },
    { name: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
    { name: 'Istanbul', lat: 41.0082, lng: 28.9784 },
    { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
    { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816 },
    { name: 'Kuala Lumpur', lat: 3.139, lng: 101.6869 },
    { name: 'Manila', lat: 14.5995, lng: 120.9842 },
    { name: 'Brisbane', lat: -27.4698, lng: 153.0251 },
    { name: 'Auckland', lat: -36.8485, lng: 174.7633 },
];

/* ─── Earth Sphere with night-lights texture ───────────────────── */
function EarthSphere({ texture }: { texture: THREE.Texture }) {
    return (
        <mesh>
            <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
            <meshBasicMaterial
                map={texture}
                toneMapped={false}
            />
        </mesh>
    );
}

/* ─── City glow dots (all cities from dataset) ─────────────────── */
function CityGlowDots() {
    const positions = useMemo(() => {
        const pos = new Float32Array(CITY_DATA.length * 3);
        CITY_DATA.forEach((city, i) => {
            const v = latLngToVector3(city.lat, city.lng, GLOBE_RADIUS + 0.03);
            pos[i * 3] = v.x;
            pos[i * 3 + 1] = v.y;
            pos[i * 3 + 2] = v.z;
        });
        return pos;
    }, []);

    return (
        <points>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            </bufferGeometry>
            <pointsMaterial
                color="#ffcc66"
                size={0.04}
                transparent
                opacity={0.9}
                sizeAttenuation
                depthWrite={false}
            />
        </points>
    );
}

/* ─── City labels with connector lines (3D Text via Drei) ──────── */
function CityLabel({
    name,
    lat,
    lng,
}: {
    name: string;
    lat: number;
    lng: number;
}) {
    const surfacePos = useMemo(
        () => latLngToVector3(lat, lng, GLOBE_RADIUS + 0.02),
        [lat, lng]
    );
    const labelPos = useMemo(
        () => latLngToVector3(lat, lng, GLOBE_RADIUS + 0.35),
        [lat, lng]
    );

    return (
        <group>
            {/* Connector line from surface to label */}
            <Line
                points={[surfacePos.toArray(), labelPos.toArray()]}
                color="#ffffff"
                lineWidth={0.5}
                transparent
                opacity={0.35}
            />

            {/* Small bright dot at line end */}
            <mesh position={labelPos}>
                <sphereGeometry args={[0.012, 6, 6]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
            </mesh>

            {/* City name text — Billboard keeps it facing the camera */}
            <Billboard
                position={[
                    labelPos.x + (labelPos.x > 0 ? 0.05 : -0.05),
                    labelPos.y,
                    labelPos.z + (labelPos.z > 0 ? 0.05 : -0.05),
                ]}
                follow
                lockX={false}
                lockY={false}
                lockZ={false}
            >
                <Text
                    fontSize={0.06}
                    color="#ffffff"
                    anchorX={labelPos.x > 0 ? 'left' : 'right'}
                    anchorY="middle"
                    fillOpacity={0.65}
                    outlineWidth={0.003}
                    outlineColor="#000000"
                >
                    {name}
                </Text>
            </Billboard>
        </group>
    );
}

function CityLabelsGroup() {
    return (
        <group>
            {LABEL_CITIES.map((city, i) => (
                <CityLabel key={i} name={city.name} lat={city.lat} lng={city.lng} />
            ))}
        </group>
    );
}

/* ─── Atmosphere ring glow ──────────────────────────────────────── */
function AtmosphereGlow() {
    const shaderArgs = useMemo(
        () => ({
            uniforms: {
                glowColor: { value: new THREE.Color('#1a6baa') },
                coefficient: { value: 0.6 },
                power: { value: 6.0 },
            },
            vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPositionNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        uniform vec3 glowColor;
        uniform float coefficient;
        uniform float power;
        varying vec3 vNormal;
        varying vec3 vPositionNormal;
        void main() {
          float intensity = pow(coefficient + dot(vPositionNormal, vNormal), power);
          gl_FragColor = vec4(glowColor, intensity * 0.2);
        }
      `,
        }),
        []
    );

    return (
        <mesh scale={[1.05, 1.05, 1.05]}>
            <sphereGeometry args={[GLOBE_RADIUS, 32, 32]} />
            <shaderMaterial
                args={[shaderArgs]}
                transparent
                side={THREE.BackSide}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </mesh>
    );
}

/* ─── Rotating Globe Group ──────────────────────────────────────── */
function GlobeGroup({ hovered }: { hovered: boolean }) {
    const groupRef = useRef<THREE.Group>(null!);
    const [texture, setTexture] = useState<THREE.Texture | null>(null);

    useEffect(() => {
        const loader = new THREE.TextureLoader();
        loader.load(EARTH_NIGHT_TEXTURE_URL, (tex) => {
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            setTexture(tex);
        });
    }, []);

    useFrame((_state, delta) => {
        if (!groupRef.current) return;
        const speed = hovered
            ? ROTATION_SPEED * HOVER_SPEED_FACTOR
            : ROTATION_SPEED;
        groupRef.current.rotation.y += speed * delta;
    });

    if (!texture) return null; // 🛑 Wait for texture load before rendering anything

    return (
        <group ref={groupRef} rotation={[0.25, 0, 0.1]}>
            <EarthSphere texture={texture} />
            <CityGlowDots />
            <CityLabelsGroup />
            <AtmosphereGlow />
        </group>
    );
}

/* ─── Scene (no controls — globe is non-interactive background) ──── */
function Scene({ hovered }: { hovered: boolean }) {
    return <GlobeGroup hovered={hovered} />;
}

/* ─── Public Export: Full Canvas Component ──────────────────────── */
export default function DataGlobe() {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                background: '#000000',
                pointerEvents: 'none',
                touchAction: 'none',
            }}
        >
            <Canvas
                camera={{ position: [0, 0, 5], fov: 45 }}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: 'high-performance',
                    toneMapping: THREE.NoToneMapping,
                }}
                dpr={[1, 1.5]}
                style={{ background: '#000000', pointerEvents: 'none', touchAction: 'none' }}
            >
                <Scene hovered={hovered} />
            </Canvas>
        </div>
    );
}
