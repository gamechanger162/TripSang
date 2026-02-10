'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
// Force hide routing machine container as we only want the path
import '@/styles/map-overrides.css';
import { socketManager } from '@/lib/socketManager';
import toast from 'react-hot-toast';
import { Share2, ExternalLink } from 'lucide-react';

// --- Custom Icon Generators ---

const createCustomIcon = (type: 'start' | 'end' | 'stop', number?: number) => {
    let bgColor = '';
    let label = '';
    let size = [30, 30] as [number, number];

    switch (type) {
        case 'start':
            bgColor = '#10b981'; // Green-500
            label = 'S';
            break;
        case 'end':
            bgColor = '#ef4444'; // Red-500
            label = 'E';
            break;
        case 'stop':
            bgColor = '#3b82f6'; // Blue-500
            label = number ? number.toString() : '';
            break;
    }

    const html = `
        <div style="
            background-color: ${bgColor};
            color: white;
            width: ${size[0]}px;
            height: ${size[1]}px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
            ${label}
        </div>
    `;

    return L.divIcon({
        className: 'custom-map-icon',
        html: html,
        iconSize: size,
        iconAnchor: [size[0] / 2, size[1] / 2],
        popupAnchor: [0, -size[1] / 2]
    });
};

interface Waypoint {
    lat: number;
    lng: number;
    name?: string;
}

interface CollaborativeMapProps {
    tripId: string;
    initialWaypoints?: Waypoint[];
    startPoint: { lat: number; lng: number; name: string };
    endPoint?: { lat: number; lng: number; name: string };
    isReadOnly?: boolean;
    shouldJoinRoom?: boolean; // New prop to control room joining
}

// Sub-component to handle map clicks
function MapEvents({ onMapClick, isReadOnly }: { onMapClick: (e: L.LeafletMouseEvent) => void, isReadOnly: boolean }) {
    useMapEvents({
        click: (e) => {
            if (!isReadOnly) {
                onMapClick(e);
            }
        },
    });
    return null;
}

// Inner component to handle routing logic with access to map instance
function RoutingController({
    waypoints,
    startPoint,
    endPoint,
    isReadOnly
}: {
    waypoints: Waypoint[],
    startPoint: { lat: number; lng: number, name: string },
    endPoint?: { lat: number; lng: number, name: string },
    isReadOnly: boolean
}) {
    const map = useMap();
    const routingControlRef = useRef<any>(null);

    // Initialize/Update Routing Machine
    useEffect(() => {
        // All routing logic relies on map being present and valid
        if (!map) return;

        // Clean up previous routing control safely
        const cleanupRouting = () => {
            if (routingControlRef.current) {
                try {
                    const control = routingControlRef.current;
                    // Prevent OSRM callback crash
                    if (control._clearLines) {
                        try { control._clearLines = () => { }; } catch (e) { }
                    }

                    // Only remove if map still exists and has this control layer
                    if (map && map.hasLayer && map.hasLayer(control)) {
                        map.removeControl(control);
                    }
                } catch (e) {
                    console.warn('Error cleaning up routing control:', e);
                }
                routingControlRef.current = null;
            }
        };

        cleanupRouting();

        // Define waypoints for routing
        // Format: [Start, ...Waypoints, End]
        const points = [
            L.latLng(startPoint.lat, startPoint.lng),
            ...waypoints.map(w => L.latLng(w.lat, w.lng))
        ];

        if (endPoint) {
            points.push(L.latLng(endPoint.lat, endPoint.lng));
        }

        // Create Routing Control
        try {
            routingControlRef.current = (L as any).Routing.control({
                waypoints: points,
                routeWhileDragging: !isReadOnly,
                show: false, // Hide the itinerary panel
                addWaypoints: !isReadOnly, // Allow adding waypoints by dragging line
                fitSelectedRoutes: true,
                lineOptions: {
                    styles: [{ color: '#00ffff', opacity: 0.7, weight: 5 }]
                },
                createMarker: function (i: number, wp: any, nWps: number) {
                    let type: 'start' | 'end' | 'stop' = 'stop';

                    if (i === 0) {
                        type = 'start';
                    } else if (i === nWps - 1 && endPoint) {
                        type = 'end';
                    }

                    return L.marker(wp.latLng, {
                        draggable: !isReadOnly,
                        icon: createCustomIcon(type, type === 'stop' ? i : undefined)
                    }).bindPopup(
                        type === 'start' ? `Start: ${startPoint.name}` :
                            type === 'end' ? `Destination: ${endPoint?.name}` :
                                `Stop ${i}`
                    );
                }
            }).addTo(map);

            // Hide the container explicitly via JS as well
            const container = routingControlRef.current.getContainer();
            if (container) {
                container.style.display = 'none';
            }

            // Listen for route changes
            if (!isReadOnly) {
                routingControlRef.current.on('routesfound', function (e: any) {
                    // Route found logic
                });
            }

        } catch (error) {
            console.error("Routing error:", error);
        }

        return () => {
            // We explicitly do NOT remove the control here if it's still needed, 
            // but for React usage we usually do. 
            // The crash happens if OSRM response comes back after removal.
            // We can't easily cancel OSRM request in leaflet-routing-machine v3.

            // Best effort cleanup
            if (map && routingControlRef.current) {
                try {
                    const control = routingControlRef.current;
                    // Monkey-patch _clearLines to prevent crash if a pending route request 
                    // returns after the control is removed.
                    if (control) {
                        try { control._clearLines = () => { }; } catch (e) { }
                    }

                    if (map.hasLayer && map.hasLayer(control)) {
                        map.removeControl(control);
                    }
                } catch (e) { }
            }
        };
        // Use primitive values for dependencies to avoid re-running on object reference change
        // JSON.stringify is a cheap way to compare deep objects for small data like waypoints
    }, [map, isReadOnly, startPoint.lat, startPoint.lng, endPoint?.lat, endPoint?.lng, JSON.stringify(waypoints)]);

    return null;
}

export default function CollaborativeMap({
    tripId,
    initialWaypoints = [],
    startPoint,
    endPoint,
    isReadOnly = false,
    shouldJoinRoom = false
}: CollaborativeMapProps) {
    const [waypoints, setWaypoints] = useState<Waypoint[]>(initialWaypoints);
    const mapRef = useRef<L.Map | null>(null);

    // Socket Connection for Real-time Updates
    useEffect(() => {
        // If this component acts as a standalone viewer (e.g. from TripDetails),
        // it needs to join the room.
        if (shouldJoinRoom && tripId) {
            socketManager.joinRoom(tripId, 'squad');
        }

        const handleMapUpdate = (data: { waypoints: Waypoint[], updatedBy: string }) => {
            setWaypoints(data.waypoints);
            if (data.updatedBy) {
                toast.success(`${data.updatedBy} updated the route`, {
                    icon: '🗺️',
                    position: 'bottom-center',
                    style: {
                        background: 'rgba(0, 0, 0, 0.8)',
                        color: '#fff',
                    }
                });
            }
        };

        socketManager.on('map_update', handleMapUpdate);

        return () => {
            socketManager.off('map_update', handleMapUpdate);

            // Only leave if we were the one who joined specifically for this map
            if (shouldJoinRoom && tripId) {
                socketManager.leaveRoom(tripId, 'squad');
            }
        };
    }, [tripId, shouldJoinRoom]);

    const handleMapClick = (e: L.LeafletMouseEvent) => {
        if (isReadOnly) return;

        const newWaypoint = {
            lat: e.latlng.lat,
            lng: e.latlng.lng,
            name: `Stop ${waypoints.length + 1}`
        };

        const updatedWaypoints = [...waypoints, newWaypoint];
        setWaypoints(updatedWaypoints);

        // Emit to socket
        socketManager.emit('map_action', {
            tripId,
            waypoints: updatedWaypoints
        });
    };

    const handleDeleteStop = (index: number) => {
        if (isReadOnly) return;
        const updatedWaypoints = waypoints.filter((_, i) => i !== index);
        setWaypoints(updatedWaypoints);
        socketManager.emit('map_action', { tripId, waypoints: updatedWaypoints });
    };

    const handleUndo = () => {
        if (isReadOnly || waypoints.length === 0) return;
        const updatedWaypoints = waypoints.slice(0, -1);
        setWaypoints(updatedWaypoints);
        socketManager.emit('map_action', { tripId, waypoints: updatedWaypoints });
    };

    const openInGoogleMaps = () => {
        if (!startPoint || !endPoint) return;

        let url = `https://www.google.com/maps/dir/?api=1&origin=${startPoint.lat},${startPoint.lng}&destination=${endPoint.lat},${endPoint.lng}`;

        if (waypoints.length > 0) {
            const waypointsStr = waypoints.map(w => `${w.lat},${w.lng}`).join('|');
            url += `&waypoints=${waypointsStr}`;
        }

        window.open(url, '_blank');
    };

    // Parse coordinates to ensure they are numbers (handle string numbers)
    const secureStartPoint = {
        ...startPoint,
        lat: Number(startPoint.lat),
        lng: Number(startPoint.lng)
    };

    const secureEndPoint = endPoint ? {
        ...endPoint,
        lat: Number(endPoint.lat),
        lng: Number(endPoint.lng)
    } : undefined;

    // Safety check for startPoint
    if (!secureStartPoint || isNaN(secureStartPoint.lat) || isNaN(secureStartPoint.lng)) {
        console.error('Invalid startPoint:', startPoint);
        return <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-900/50">Invalid start coordinates</div>;
    }

    // Debug logging
    // console.log('CollaborativeMap rendering:', { startPoint: secureStartPoint, endPoint: secureEndPoint, waypoints });

    return (
        <div className="relative w-full h-full">
            <MapContainer
                center={[secureStartPoint.lat, secureStartPoint.lng]}
                zoom={6}
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" // Light mode standard
                // For dark mode map, we'd use a different provider or filter
                // className="map-tiles"
                />

                <MapEvents onMapClick={handleMapClick} isReadOnly={isReadOnly} />

                <RoutingController
                    waypoints={waypoints}
                    startPoint={secureStartPoint}
                    endPoint={secureEndPoint}
                    isReadOnly={isReadOnly}
                />

                {/* Explicit Markers for fallback/instant feedback */}
                {/* Start Point Marker (Green S) */}
                <Marker position={[secureStartPoint.lat, secureStartPoint.lng]} icon={createCustomIcon('start')}>
                    <Popup>
                        <div className="font-bold">Start: {secureStartPoint.name}</div>
                    </Popup>
                </Marker>

                {/* End Point Marker (Red E) */}
                {secureEndPoint && (
                    <Marker position={[secureEndPoint.lat, secureEndPoint.lng]} icon={createCustomIcon('end')}>
                        <Popup>
                            <div className="font-bold">Dest: {secureEndPoint.name}</div>
                        </Popup>
                    </Marker>
                )}

                {/* User Added Waypoints (Numbered) */}
                {waypoints.filter(wp => wp && typeof wp.lat === 'number' && typeof wp.lng === 'number').map((wp, idx) => (
                    <Marker key={idx} position={[wp.lat, wp.lng]} icon={createCustomIcon('stop', idx + 1)}>
                        <Popup>
                            <div className="flex flex-col gap-2">
                                <div className="font-bold">{wp.name || `Stop ${idx + 1}`}</div>
                                {!isReadOnly && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent map click
                                            handleDeleteStop(idx);
                                        }}
                                        className="bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600 transition-colors w-full"
                                    >
                                        Delete Stop
                                    </button>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Floating Action Buttons */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[400]">
                <button
                    onClick={openInGoogleMaps}
                    className="p-3 bg-white text-gray-800 rounded-full shadow-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
                    title="Open in Google Maps"
                >
                    <ExternalLink size={20} />
                </button>
            </div>

            {/* Legend/Info Overlay */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-lg z-[400] max-w-xs">
                <h4 className="font-bold text-gray-800 text-sm mb-1">Route Info</h4>
                <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span>Start: {startPoint.name}</span>
                    </div>
                    {waypoints.length > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span>{waypoints.length} Stop{waypoints.length !== 1 ? 's' : ''}</span>
                        </div>
                    )}
                    {endPoint && (
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span>End: {endPoint.name}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

