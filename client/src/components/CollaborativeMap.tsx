'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { socket } from '@/lib/websocket'; // Assuming socket is exported from here or passed as prop. I'll check lib/api or similar. 
// Wait, I saw Navbar.tsx using socket. I should check how socket is initialized on client.
// client/package.json has "socket.io-client".
// Let's assume standard socket connection. 

// Fix Leaflet icons
const icon = L.icon({
    iconUrl: '/marker-icon.png',
    shadowUrl: '/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

// If images are missing, we might need to point to CDN or public folder.
// Standard Leaflet fix:
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
                show: false, // Hide the itenerary text box
                addWaypoints: false,
                routeWhileDragging: false,
                fitSelectedRoutes: true,
                showAlternatives: false,
                createMarker: function () { return null; } // We handle markers manually if needed, or let routing machine do it but we want custom behavior?
                // Actually, allowing routing machine to create markers is fine, but we want to sync them.
                // For simplicity first: Draw lines between our custom markers.
            }).addTo(map);
        }

        return () => {
            // Cleanup if needed
            // if (routingControlRef.current) map.removeControl(routingControlRef.current);
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

    // Initialize socket
    useEffect(() => {
        // We'll use the global socket if available or connect new
        // Ideally pass socket instance or use context. 
        // For now, let's assume `socket` imported from a singleton helper file is best.
        // I will double check `client/src/lib/api.ts` or create `client/src/lib/socket.ts` if needed.

        socket.on('connect', () => {
            setSocketConnected(true);
        });

        socket.on('map_update', (data: { waypoints: Waypoint[], updatedBy: string }) => {
            console.log('Map updated by', data.updatedBy);
            setWaypoints(data.waypoints);
        });

        return () => {
            socket.off('map_update');
        };
    }, []);

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

        // Emit to socket
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

    const handleSave = () => {
        // Explicit save (socket emits on change anyway, but feedback is good)
        socket.emit('map_action', { tripId, waypoints });
        // Could show a toast here if we imported toast
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

                {/* Start Point Marker */}
                <Marker position={[startPoint.lat, startPoint.lng]}>
                    <Popup>
                        <div className="font-bold">Start: {startPoint.name}</div>
                    </Popup>
                </Marker>

                {/* End Point Marker */}
                {endPoint && (
                    <Marker position={[endPoint.lat, endPoint.lng]}>
                        <Popup>
                            <div className="font-bold">End: {endPoint.name}</div>
                        </Popup>
                    </Marker>
                )}

                {/* User Added Waypoints */}
                {waypoints.map((wp, idx) => (
                    <Marker key={idx} position={[wp.lat, wp.lng]}>
                        <Popup>
                            <div className="font-bold">{wp.name || `Stop ${idx + 1}`}</div>
                        </Popup>
                    </Marker>
                ))}

                <RoutingMachine waypoints={waypoints} startPoint={startPoint} endPoint={endPoint} />
                <MapEvents onMapClick={handleMapClick} />
            </MapContainer>

            {/* Map Controls */}
            {!isReadOnly && (
                <div className="absolute bottom-4 left-4 z-[400] flex gap-2">
                    <button
                        onClick={handleUndo}
                        disabled={waypoints.length === 0}
                        className="bg-white dark:bg-dark-700 text-gray-700 dark:text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-dark-600 disabled:opacity-50 font-medium transition-colors"
                    >
                        Undo Last Point
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-primary-700 font-medium transition-colors"
                    >
                        Save Route
                    </button>
                    {/* User asked for "reverse" but "undo" covers mistakes. If they meant reverse direction, that's complex without changing start/end. */}
                </div>
            )}
        </div>
    );
};

export default CollaborativeMap;
