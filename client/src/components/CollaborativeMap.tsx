'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import '@/styles/map-overrides.css';
import { socketManager } from '@/lib/socketManager';
import toast from 'react-hot-toast';
import { ExternalLink, X } from 'lucide-react';

// --- Custom Icon ---
const createCustomIcon = (type: 'start' | 'end' | 'stop', number?: number) => {
    const bgColor = type === 'start' ? '#10b981' : type === 'end' ? '#ef4444' : '#3b82f6';
    const label = type === 'start' ? 'S' : type === 'end' ? 'E' : (number?.toString() || '');

    return L.divIcon({
        className: 'custom-map-icon',
        html: `<div style="background:${bgColor};color:#fff;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,.3)">${label}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
    });
};

interface Waypoint { lat: number; lng: number; name?: string; }

interface CollaborativeMapProps {
    tripId: string;
    initialWaypoints?: Waypoint[];
    startPoint: { lat: number; lng: number; name: string };
    endPoint?: { lat: number; lng: number; name: string };
    isReadOnly?: boolean;
    shouldJoinRoom?: boolean;
    onClose?: () => void;
}

// Build L.LatLng array from start + waypoints + end
function buildRoutePoints(
    start: { lat: number; lng: number },
    waypoints: Waypoint[],
    end?: { lat: number; lng: number }
) {
    const pts = [L.latLng(start.lat, start.lng), ...waypoints.map(w => L.latLng(w.lat, w.lng))];
    if (end) pts.push(L.latLng(end.lat, end.lng));
    return pts;
}

// ═══════════════════════════════════════════════════════════════
// MapController — handles EVERYTHING inside the map:
//   1) Route line + markers (via leaflet-routing-machine)
//   2) Click-to-add-waypoint
// Created ONCE, updated via setWaypoints — avoids React Strict Mode issues
// ═══════════════════════════════════════════════════════════════
function MapController({
    startPoint,
    endPoint,
    waypoints,
    isReadOnly,
    onClickRef,
    onDeleteRef
}: {
    startPoint: { lat: number; lng: number; name: string };
    endPoint?: { lat: number; lng: number; name: string };
    waypoints: Waypoint[];
    isReadOnly: boolean;
    onClickRef: React.MutableRefObject<(e: L.LeafletMouseEvent) => void>;
    onDeleteRef: React.MutableRefObject<(index: number) => void>;
}) {
    const map = useMap();
    const controlRef = useRef<any>(null);
    const isInitializedRef = useRef(false);

    // ── 1) Click handler: register directly on map ──
    useEffect(() => {
        if (!map) return;
        const handler = (e: L.LeafletMouseEvent) => onClickRef.current(e);
        map.on('click', handler);
        return () => { map.off('click', handler); };
    }, [map, onClickRef]);

    // ── 2) Create routing control ONCE on mount ──
    useEffect(() => {
        if (!map || isInitializedRef.current) return;
        isInitializedRef.current = true;

        const points = buildRoutePoints(startPoint, waypoints, endPoint);

        try {
            const control = (L as any).Routing.control({
                waypoints: points,
                routeWhileDragging: false,
                show: false,
                addWaypoints: false,
                fitSelectedRoutes: true,
                draggableWaypoints: false,
                lineOptions: {
                    styles: [{ color: '#00ffff', opacity: 0.7, weight: 5 }],
                    addWaypoints: false
                },
                createMarker: function (i: number, wp: any, nWps: number) {
                    let type: 'start' | 'end' | 'stop' = 'stop';
                    if (i === 0) type = 'start';
                    else if (i === nWps - 1 && endPoint) type = 'end';

                    const marker = L.marker(wp.latLng, {
                        draggable: false,
                        icon: createCustomIcon(type, type === 'stop' ? i : undefined)
                    });

                    // Native DOM popup
                    const div = document.createElement('div');
                    div.style.cssText = 'display:flex;flex-direction:column;gap:8px;min-width:130px';
                    const lbl = document.createElement('strong');
                    lbl.style.fontSize = '14px';
                    lbl.textContent =
                        type === 'start' ? `Start: ${startPoint.name}` :
                            type === 'end' ? `Dest: ${endPoint?.name || ''}` :
                                `Stop ${i}`;
                    div.appendChild(lbl);

                    if (type === 'stop' && !isReadOnly) {
                        const wpIdx = i - 1;
                        const btn = document.createElement('button');
                        btn.textContent = '🗑 Delete Stop';
                        btn.style.cssText = 'background:#ef4444;color:#fff;font-size:12px;padding:6px 10px;border-radius:6px;border:none;cursor:pointer;width:100%;font-weight:600';
                        btn.onmouseover = () => { btn.style.background = '#dc2626'; };
                        btn.onmouseout = () => { btn.style.background = '#ef4444'; };
                        btn.onclick = (ev) => { ev.stopPropagation(); ev.preventDefault(); onDeleteRef.current(wpIdx); };
                        div.appendChild(btn);
                    }

                    marker.bindPopup(div, { closeButton: true, minWidth: 140 });
                    return marker;
                }
            }).addTo(map);

            // Hide itinerary panel
            const c = control.getContainer();
            if (c) c.style.display = 'none';

            controlRef.current = control;
        } catch (err) {
            console.error('Routing init error:', err);
        }

        // Cleanup ONLY on unmount
        return () => {
            isInitializedRef.current = false;
            const ctrl = controlRef.current;
            if (ctrl && map) {
                try {
                    ctrl._clearLines = () => { };
                    ctrl._clearAlts = () => { };
                    if (ctrl._plan) ctrl._plan._routeSelected = () => { };
                    if (ctrl._line) try { map.removeLayer(ctrl._line); } catch (e) { }
                    map.removeControl(ctrl);
                } catch (e) { }
            }
            controlRef.current = null;
        };
    }, [map]); // ← depends ONLY on map — create once!

    // ── 3) Update waypoints via setWaypoints (no destroy/recreate) ──
    useEffect(() => {
        const ctrl = controlRef.current;
        if (!ctrl) return;
        const points = buildRoutePoints(startPoint, waypoints, endPoint);
        ctrl.setWaypoints(points);
    }, [startPoint.lat, startPoint.lng, endPoint?.lat, endPoint?.lng, JSON.stringify(waypoints)]);

    return null;
}

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════
export default function CollaborativeMap({
    tripId,
    initialWaypoints = [],
    startPoint,
    endPoint,
    isReadOnly = false,
    shouldJoinRoom = false,
    onClose
}: CollaborativeMapProps) {
    const [waypoints, setWaypoints] = useState<Waypoint[]>(initialWaypoints);
    const mapRef = useRef<L.Map | null>(null);

    // Refs for stable callbacks (never stale inside Leaflet handlers)
    const wpRef = useRef(waypoints);
    wpRef.current = waypoints;
    const readOnlyRef = useRef(isReadOnly);
    readOnlyRef.current = isReadOnly;

    // Socket
    useEffect(() => {
        if (shouldJoinRoom && tripId) socketManager.joinRoom(tripId, 'squad');
        const onUpdate = (data: { waypoints: Waypoint[]; updatedBy: string }) => {
            setWaypoints(data.waypoints);
            if (data.updatedBy) toast.success(`${data.updatedBy} updated the route`, { icon: '🗺️', position: 'bottom-center', style: { background: 'rgba(0,0,0,.8)', color: '#fff' } });
        };
        socketManager.on('map_update', onUpdate);
        return () => {
            socketManager.off('map_update', onUpdate);
            if (shouldJoinRoom && tripId) socketManager.leaveRoom(tripId, 'squad');
        };
    }, [tripId, shouldJoinRoom]);

    // Click ref
    const onClickRef = useRef((e: L.LeafletMouseEvent) => {
        if (readOnlyRef.current) return;
        const cur = wpRef.current;
        const updated = [...cur, { lat: e.latlng.lat, lng: e.latlng.lng, name: `Stop ${cur.length + 1}` }];
        setWaypoints(updated);
        socketManager.emit('map_action', { tripId, waypoints: updated });
    });
    // Keep ref.current fresh
    onClickRef.current = (e: L.LeafletMouseEvent) => {
        if (readOnlyRef.current) return;
        const cur = wpRef.current;
        const updated = [...cur, { lat: e.latlng.lat, lng: e.latlng.lng, name: `Stop ${cur.length + 1}` }];
        setWaypoints(updated);
        socketManager.emit('map_action', { tripId, waypoints: updated });
    };

    // Delete ref
    const onDeleteRef = useRef((idx: number) => {
        if (readOnlyRef.current) return;
        const updated = wpRef.current.filter((_, i) => i !== idx);
        setWaypoints(updated);
        socketManager.emit('map_action', { tripId, waypoints: updated });
    });
    onDeleteRef.current = (idx: number) => {
        if (readOnlyRef.current) return;
        const updated = wpRef.current.filter((_, i) => i !== idx);
        setWaypoints(updated);
        socketManager.emit('map_action', { tripId, waypoints: updated });
    };

    const handleUndo = useCallback(() => {
        if (isReadOnly || wpRef.current.length === 0) return;
        const updated = wpRef.current.slice(0, -1);
        setWaypoints(updated);
        socketManager.emit('map_action', { tripId, waypoints: updated });
    }, [isReadOnly, tripId]);

    const openInGoogleMaps = useCallback(() => {
        if (!startPoint || !endPoint) return;
        let url = `https://www.google.com/maps/dir/?api=1&origin=${startPoint.lat},${startPoint.lng}&destination=${endPoint.lat},${endPoint.lng}`;
        if (wpRef.current.length > 0) url += `&waypoints=${wpRef.current.map(w => `${w.lat},${w.lng}`).join('|')}`;
        window.open(url, '_blank');
    }, [startPoint, endPoint]);

    const safeSP = { ...startPoint, lat: Number(startPoint.lat), lng: Number(startPoint.lng) };
    const safeEP = endPoint ? { ...endPoint, lat: Number(endPoint.lat), lng: Number(endPoint.lng) } : undefined;

    if (isNaN(safeSP.lat) || isNaN(safeSP.lng)) {
        return <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-900/50">Invalid start coordinates</div>;
    }

    return (
        <div className="relative w-full h-full">
            <MapContainer center={[safeSP.lat, safeSP.lng]} zoom={6} style={{ height: '100%', width: '100%' }} ref={mapRef}>
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapController
                    startPoint={safeSP}
                    endPoint={safeEP}
                    waypoints={waypoints}
                    isReadOnly={isReadOnly}
                    onClickRef={onClickRef}
                    onDeleteRef={onDeleteRef}
                />
            </MapContainer>

            {/* Close */}
            {onClose && (
                <button onClick={onClose} className="absolute top-4 right-4 z-[500] w-10 h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors border border-white/10 shadow-lg" title="Close Map">
                    <X size={20} />
                </button>
            )}

            {/* Floating buttons */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[400]">
                {!isReadOnly && waypoints.length > 0 && (
                    <button onClick={handleUndo} className="p-3 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors flex items-center justify-center" title="Undo last stop">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>
                    </button>
                )}
                <button onClick={openInGoogleMaps} className="p-3 bg-white text-gray-800 rounded-full shadow-lg hover:bg-gray-100 transition-colors flex items-center justify-center" title="Open in Google Maps">
                    <ExternalLink size={20} />
                </button>
            </div>

            {/* Legend */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-lg z-[400] max-w-xs">
                <h4 className="font-bold text-gray-800 text-sm mb-1">Route Info</h4>
                <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span>Start: {startPoint.name}</span></div>
                    {waypoints.length > 0 && <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /><span>{waypoints.length} Stop{waypoints.length !== 1 ? 's' : ''}</span></div>}
                    {endPoint && <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span>End: {endPoint.name}</span></div>}
                </div>
            </div>
        </div>
    );
}
