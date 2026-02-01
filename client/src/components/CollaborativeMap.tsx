'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { socket } from '@/lib/websocket';
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
    timestamp?: string;
}

interface CollaborativeMapProps {
    tripId: string;
    initialWaypoints: Waypoint[];
    startPoint: { lat: number; lng: number; name: string };
    endPoint?: { lat: number; lng: number; name: string };
    isReadOnly?: boolean;
}

function RoutingMachine({ waypoints, startPoint, endPoint }: { waypoints: Waypoint[], startPoint: any, endPoint?: any }) {
    const map = useMap();
    const routingControlRef = useRef<any>(null);

    useEffect(() => {
        if (!map) return;

        const points = [
            L.latLng(startPoint.lat, startPoint.lng),
            ...waypoints.map(wp => L.latLng(wp.lat, wp.lng)),
            ...(endPoint ? [L.latLng(endPoint.lat, endPoint.lng)] : [])
        ];

        if (routingControlRef.current) {
            routingControlRef.current.setWaypoints(points);
        } else {
            routingControlRef.current = (L as any).Routing.control({
                waypoints: points,
                lineOptions: {
                    styles: [{ color: '#6366f1', opacity: 0.8, weight: 6 }]
                },
                serviceUrl: 'https://router.project-osrm.org/route/v1',
                show: false, // Hide the itenerary text box
                addWaypoints: false,
                routeWhileDragging: false,
                fitSelectedRoutes: true,
                showAlternatives: false,
                createMarker: function () { return null; } // Hide default markers so we can use our custom ones
            }).addTo(map);
        }

        return () => {
            // Cleanup: Removing control can sometimes cause React lifecycle issues with Leaflet, keeping careful watch
        };
    }, [map, waypoints, startPoint, endPoint]);

    return null;
}

function MapEvents({ onMapClick }: { onMapClick: (e: L.LeafletMouseEvent) => void }) {
    useMapEvents({
        click: onMapClick,
    });
    return null;
}

const CollaborativeMap = ({ tripId, initialWaypoints, startPoint, endPoint, isReadOnly = false }: CollaborativeMapProps) => {
    const [waypoints, setWaypoints] = useState<Waypoint[]>(initialWaypoints || []);
    const [socketConnected, setSocketConnected] = useState(false);

    // Sync state with prop when data loads
    useEffect(() => {
        if (initialWaypoints && initialWaypoints.length > 0) {
            setWaypoints(initialWaypoints);
        }
    }, [initialWaypoints]);

    useEffect(() => {
        socket.on('connect', () => {
            setSocketConnected(true);
        });

        socket.on('map_update', (data: { waypoints: Waypoint[], updatedBy: string }) => {
            setWaypoints(data.waypoints);
        });

        return () => {
            socket.off('map_update');
        };
    }, []);

    // Auto-save waypoints when they change
    useEffect(() => {
        if (waypoints.length > 0 && !isReadOnly) {
            const timer = setTimeout(() => {
                socket.emit('map_action', { tripId, waypoints });
            }, 500); // Debounce for 500ms

            return () => clearTimeout(timer);
        }
    }, [waypoints, tripId, isReadOnly]);

    const handleMapClick = (e: L.LeafletMouseEvent) => {
        if (isReadOnly) return;

        const newWaypoint = {
            lat: e.latlng.lat,
            lng: e.latlng.lng,
            name: `Stop ${waypoints.length + 1}`,
            timestamp: new Date().toISOString()
        };

        const updatedWaypoints = [...waypoints, newWaypoint];
        setWaypoints(updatedWaypoints);

        socket.emit('map_action', {
            tripId,
            waypoints: updatedWaypoints
        });
    };

    const handleUndo = () => {
        if (isReadOnly || waypoints.length === 0) return;
        const updatedWaypoints = waypoints.slice(0, -1);
        setWaypoints(updatedWaypoints);
        socket.emit('map_action', { tripId, waypoints: updatedWaypoints });
    };

    const handleDeleteStop = (index: number) => {
        if (isReadOnly) return;
        const updatedWaypoints = waypoints.filter((_, i) => i !== index);
        setWaypoints(updatedWaypoints);
        socket.emit('map_action', { tripId, waypoints: updatedWaypoints });
    };

    const generateGoogleMapsUrl = () => {
        // Build Google Maps URL with all waypoints
        const origin = `${startPoint.lat},${startPoint.lng}`;
        const destination = endPoint ? `${endPoint.lat},${endPoint.lng}` : origin;

        // Format waypoints as lat,lng pairs separated by |
        const waypointsParam = waypoints.length > 0
            ? `&waypoints=${waypoints.map(wp => `${wp.lat},${wp.lng}`).join('|')}`
            : '';

        return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointsParam}&travelmode=driving`;
    };

    const handleShareGoogleMaps = () => {
        const url = generateGoogleMapsUrl();

        // Copy to clipboard
        navigator.clipboard.writeText(url).then(() => {
            toast.success('Google Maps link copied to clipboard!');
        }).catch(() => {
            toast.error('Failed to copy link');
        });
    };

    const handleOpenGoogleMaps = () => {
        const url = generateGoogleMapsUrl();
        window.open(url, '_blank');
        toast.success('Opening in Google Maps...');
    };

    return (
        <div className="h-full w-full relative z-0">
            <MapContainer
                center={[startPoint.lat, startPoint.lng]}
                zoom={6}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {/* Start Point Marker (Green S) */}
                <Marker position={[startPoint.lat, startPoint.lng]} icon={createCustomIcon('start')}>
                    <Popup>
                        <div className="font-bold">Start: {startPoint.name}</div>
                    </Popup>
                </Marker>

                {/* End Point Marker (Red E) */}
                {endPoint && (
                    <Marker position={[endPoint.lat, endPoint.lng]} icon={createCustomIcon('end')}>
                        <Popup>
                            <div className="font-bold">End: {endPoint.name}</div>
                        </Popup>
                    </Marker>
                )}

                {/* User Added Waypoints (Numbered) */}
                {waypoints.map((wp, idx) => (
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

                <RoutingMachine waypoints={waypoints} startPoint={startPoint} endPoint={endPoint} />
                <MapEvents onMapClick={handleMapClick} />
            </MapContainer>

            {/* Map Controls */}
            <div className="absolute bottom-4 left-4 z-[400] flex gap-2">
                {!isReadOnly && (
                    <button
                        onClick={handleUndo}
                        disabled={waypoints.length === 0}
                        className="bg-white dark:bg-dark-700 text-gray-700 dark:text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-dark-600 disabled:opacity-50 font-medium transition-colors"
                    >
                        Undo Last Stop
                    </button>
                )}

                {/* Share Buttons - Always visible */}
                <button
                    onClick={handleOpenGoogleMaps}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2"
                    title="Open in Google Maps"
                >
                    <ExternalLink size={18} />
                    Open in Google Maps
                </button>

                <button
                    onClick={handleShareGoogleMaps}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-green-700 font-medium transition-colors flex items-center gap-2"
                    title="Copy Google Maps link"
                >
                    <Share2 size={18} />
                    Share Link
                </button>
            </div>
        </div>
    );
};

export default CollaborativeMap;
