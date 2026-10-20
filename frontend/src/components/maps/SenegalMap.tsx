import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { 
  Target, Crosshair, Navigation2, Compass, ExternalLink, X, Search, 
  MapPin, RefreshCw, Radio, Users, Store, Building2, Map, Phone, 
  ChevronRight, Car, Layers, Eye, ShieldCheck, Zap
} from 'lucide-react';
import { Prospect, Client, Poulailler, GPSLocation } from '../../types';
import { searchSenegalAddressGPS, getExactLocationGPS } from '../../utils/senegalData';

// ─── Custom SVG Marker Icons (Google Maps / Waze Style) ──────────────────────
const makeIcon = (color: string, symbol: string, size = 34, isPulse = false) =>
  L.divIcon({
    className: '',
    html: `
      <div style="position:relative; width:${size}px; height:${size}px;">
        ${isPulse ? `<div style="position:absolute; inset:-8px; border-radius:50%; background:${color}; opacity:0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
        <div style="
          background: ${color}; width:${size}px; height:${size}px; border-radius:50% 50% 50% 0;
          transform: rotate(-45deg); border: 2.5px solid #ffffff;
          box-shadow: 0 6px 16px rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center;">
          <span style="transform: rotate(45deg); font-size:${size * 0.45}px; line-height:1; font-weight:900; color:#ffffff;">${symbol}</span>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  });

const prospectIcon  = makeIcon('#f59e0b', 'P', 34);
const clientIcon    = makeIcon('#10b981', 'C', 34);
const farmIcon      = makeIcon('#8b5cf6', 'F', 34);
const userIcon      = makeIcon('#3b82f6', '★', 38, true);
const depotIcon     = makeIcon('#ef4444', '🏢', 40);

// ─── Auto-recenter Component ──────────────────────────────────────────────────
const Recenter = ({ pos }: { pos: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    map.flyTo(pos, 15, { duration: 1.2 });
  }, [pos, map]);
  return null;
};

const MapResizeHandler = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

// ─── Click-to-capture GPS coords ─────────────────────────────────────────────
const ClickCapture = ({ onCapture }: { onCapture: (lat: number, lng: number) => void }) => {
  useMapEvents({ click(e) { onCapture(e.latlng.lat, e.latlng.lng); } });
  return null;
};

// ─── Haversine Distance Helper (in km) ───────────────────────────────────────
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

// ─── External Navigation Apps Launchers ───────────────────────────────────────
const openGMapsDirections = (destLat: number, destLng: number) => {
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`, '_blank');
};

const openWazeDirections = (destLat: number, destLng: number) => {
  window.open(`https://waze.com/ul?ll=${destLat},${destLng}&navigate=yes`, '_blank');
};

const openPhoneCall = (phone: string) => {
  window.open(`tel:${phone.replace(/\s+/g, '')}`, '_self');
};

// ─── Component Props ─────────────────────────────────────────────────────────
interface SenegalMapProps {
  prospects: Prospect[];
  clients: Client[];
  poulaillers: Poulailler[];
  onCaptureCoords?: (lat: number, lng: number) => void;
  onSelectProspect?: (p: Prospect) => void;
  onSelectClient?: (c: Client) => void;
}

type LayerType = 'vector' | 'satellite' | 'dark';
type EntityFilter = 'ALL' | 'PROSPECTS' | 'CLIENTS' | 'POULAILLERS';

const DEPOT = { lat: 14.7794, lng: -17.3129, name: 'Siège BS Distribution — Keur Massar' };

export const SenegalMap: React.FC<SenegalMapProps> = ({
  prospects, clients, poulaillers,
  onCaptureCoords
}) => {
  const [regionFilter, setRegionFilter]   = useState('TOUTES');
  const [entityFilter, setEntityFilter]   = useState<EntityFilter>('ALL');
  const [layer, setLayer]                 = useState<LayerType>('vector');
  const [userPos, setUserPos]             = useState<GPSLocation | null>(null);
  const [userSpeed, setUserSpeed]         = useState<number | null>(null);
  const [mapCenter, setMapCenter]         = useState<[number, number]>([DEPOT.lat, DEPOT.lng]);
  const [captureMode, setCaptureMode]     = useState(false);
  const [capturedPos, setCapturedPos]     = useState<[number, number] | null>(null);
  const [isTracking, setIsTracking]       = useState(false);
  const watchIdRef                        = useRef<number | null>(null);

  // Live Address Search
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: number; lng: number }>>([]);
  const [isSearching, setIsSearching]     = useState(false);

  // Itinerary & Route
  const [showItineraryPanel, setShowItineraryPanel] = useState(false);
  const [originType, setOriginType]                 = useState<'USER' | 'DEPOT'>('DEPOT');
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>('');
  const [routePolyline, setRoutePolyline]           = useState<[number, number][]>([]);
  const [routeDistanceKm, setRouteDistanceKm]       = useState<number>(0);
  const [routeDurationMin, setRouteDurationMin]     = useState<number>(0);
  const [destInfo, setDestInfo]                     = useState<{ name: string; type: string; phone?: string; address?: string; lat: number; lng: number } | null>(null);

  // Geolocate user once
  const geolocate = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc: GPSLocation = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: new Date().toISOString()
        };
        setUserPos(loc);
        if (pos.coords.speed !== null) setUserSpeed(Math.round(pos.coords.speed * 3.6)); // m/s to km/h
        setMapCenter([loc.latitude, loc.longitude]);
      },
      err => console.warn('GPS location error:', err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Real-Time GPS Tracking (Watch Position)
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsTracking(true);
    const id = navigator.geolocation.watchPosition(
      pos => {
        const loc: GPSLocation = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: new Date().toISOString()
        };
        setUserPos(loc);
        if (pos.coords.speed !== null) setUserSpeed(Math.round(pos.coords.speed * 3.6));
      },
      err => console.warn('Live tracking error:', err.message),
      { enableHighAccuracy: true, timeout: 5000 }
    );
    watchIdRef.current = id;
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  useEffect(() => {
    geolocate();
    return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, [geolocate]);

  // Address Search
  const handleAddressSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query || query.trim().length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    const results = await searchSenegalAddressGPS(query);
    setSearchResults(results);
    setIsSearching(false);
  };

  const selectSearchResult = (item: { display_name: string; lat: number; lng: number }) => {
    setMapCenter([item.lat, item.lng]);
    setCapturedPos([item.lat, item.lng]);
    onCaptureCoords?.(item.lat, item.lng);
    setSearchResults([]);
    setSearchQuery(item.display_name.split(',')[0]);
  };

  const handleRegionChange = (reg: string) => {
    setRegionFilter(reg);
    if (reg !== 'TOUTES') {
      const coords = getExactLocationGPS(reg);
      setMapCenter([coords.lat, coords.lng]);
    }
  };

  const handleCaptured = (lat: number, lng: number) => {
    if (!captureMode) return;
    setCapturedPos([lat, lng]);
    onCaptureCoords?.(lat, lng);
  };

  // Build Destination Targets
  const destinationTargets = [
    ...clients.filter(c => c.gps).map(c => ({ id: `cli-${c.id}`, name: `Client : ${c.raisonSociale} (${c.commune || c.region})`, type: 'Client', phone: c.telephone, address: `${c.adresse}, ${c.region}`, lat: c.gps!.latitude, lng: c.gps!.longitude })),
    ...prospects.filter(p => p.gps).map(p => ({ id: `pro-${p.id}`, name: `Prospect : ${p.nom} (${p.commune || p.region})`, type: 'Prospect', phone: p.telephone, address: `${p.adresse}, ${p.commune}`, lat: p.gps!.latitude, lng: p.gps!.longitude })),
    ...poulaillers.filter(f => f.gps).map(f => ({ id: `far-${f.id}`, name: `Poulailler : ${f.nom} (${f.region})`, type: 'Poulailler', phone: f.telephone, address: `Ferme ${f.region}`, lat: f.gps!.latitude, lng: f.gps!.longitude }))
  ];

  const calculateRouteToTarget = async (destId: string) => {
    const target = destinationTargets.find(t => t.id === destId);
    if (!target) return;
    setDestInfo(target);
    const startLat = originType === 'USER' && userPos ? userPos.latitude : DEPOT.lat;
    const startLng = originType === 'USER' && userPos ? userPos.longitude : DEPOT.lng;

    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${target.lng},${target.lat}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      if (data.routes?.length > 0) {
        const route = data.routes[0];
        const coordinates: [number, number][] = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
        setRoutePolyline(coordinates);
        setRouteDistanceKm(Math.round((route.distance / 1000) * 10) / 10);
        setRouteDurationMin(Math.round(route.duration / 60));
        setMapCenter([(startLat + target.lat) / 2, (startLng + target.lng) / 2]);
      } else throw new Error();
    } catch {
      const line: [number, number][] = [[startLat, startLng], [target.lat, target.lng]];
      const dist = calculateDistanceKm(startLat, startLng, target.lat, target.lng);
      setRoutePolyline(line);
      setRouteDistanceKm(dist);
      setRouteDurationMin(Math.round((dist / 35) * 60));
      setMapCenter([(startLat + target.lat) / 2, (startLng + target.lng) / 2]);
    }
  };

  const clearRoute = () => { setRoutePolyline([]); setSelectedDestinationId(''); setDestInfo(null); };

  const showProspects   = entityFilter === 'ALL' || entityFilter === 'PROSPECTS';
  const showClients     = entityFilter === 'ALL' || entityFilter === 'CLIENTS';
  const showPoulaillers = entityFilter === 'ALL' || entityFilter === 'POULAILLERS';

  const filtP = prospects.filter(p => (regionFilter === 'TOUTES' || p.region === regionFilter) && p.gps);
  const filtC = clients.filter(c => (regionFilter === 'TOUTES' || c.region === regionFilter) && c.gps);
  const filtF = poulaillers.filter(f => (regionFilter === 'TOUTES' || f.region === regionFilter) && f.gps);

  const tileUrls: Record<LayerType, string> = {
    vector: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
  };

  return (
    <div className="space-y-3 font-sans relative">

      {/* ── Top Live KPI Stats Bar ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-extrabold shadow-sm shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-amber-900 leading-none">{filtP.length}</p>
            <p className="text-[11px] text-amber-800 font-bold mt-0.5">Prospects GPS</p>
          </div>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-extrabold shadow-sm shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-emerald-900 leading-none">{filtC.length}</p>
            <p className="text-[11px] text-emerald-800 font-bold mt-0.5">Clients Livrés</p>
          </div>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/30 p-3 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-extrabold shadow-sm shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-purple-900 leading-none">{filtF.length}</p>
            <p className="text-[11px] text-purple-800 font-bold mt-0.5">Poulaillers GPS</p>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold shadow-sm shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-amber-900 leading-none">
              {isTracking ? `${userSpeed || 0} km/h` : 'Actif'}
            </p>
            <p className="text-[11px] text-amber-800 font-bold mt-0.5">GPS Temps Réel</p>
          </div>
        </div>
      </div>

      {/* ── Main GPS Map Container (Google Maps Pro Height & Layout) ──────── */}
      <div className="h-[550px] md:h-[650px] rounded-3xl overflow-hidden border border-slate-300 shadow-xl relative group">
        
        {/* Floating Top Control Bar (Search & Layers) */}
        <div className="absolute top-3 left-3 right-3 z-[400] space-y-2 pointer-events-none">
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Search Input Box */}
            <div className="relative flex-1 min-w-[240px] pointer-events-auto shadow-lg rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200">
              <div className="flex items-center gap-2.5 px-3.5 py-2.5">
                <Search className="w-4 h-4 text-amber-600 shrink-0" />
                <input
                  type="text"
                  placeholder="Rechercher un quartier, ville ou marché au Sénégal..."
                  value={searchQuery}
                  onChange={e => handleAddressSearch(e.target.value)}
                  className="w-full bg-transparent text-slate-900 font-extrabold text-xs focus:outline-none placeholder:font-medium placeholder:text-slate-400"
                />
                {isSearching && <RefreshCw className="w-4 h-4 text-amber-500 animate-spin shrink-0" />}
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Autocomplete Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl z-[500] max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {searchResults.map((res, i) => (
                    <button
                      key={i}
                      onClick={() => selectSearchResult(res)}
                      className="w-full text-left p-3 hover:bg-amber-50 font-bold text-slate-800 text-xs flex items-start gap-2.5 transition-all"
                    >
                      <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span className="truncate">{res.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Layer Switcher (Vector / Satellite / Dark) */}
            <div className="pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200 p-1 rounded-2xl shadow-lg flex items-center gap-1 shrink-0">
              <button
                onClick={() => setLayer('vector')}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                  layer === 'vector' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Plan Vector
              </button>
              <button
                onClick={() => setLayer('satellite')}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                  layer === 'satellite' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Satellite HD
              </button>
              <button
                onClick={() => setLayer('dark')}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                  layer === 'dark' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Nuit
              </button>
            </div>

            {/* Itinerary Button */}
            <button
              onClick={() => setShowItineraryPanel(s => !s)}
              className={`pointer-events-auto px-3.5 py-2.5 rounded-2xl font-extrabold text-xs shadow-lg flex items-center gap-1.5 transition-all shrink-0 ${
                showItineraryPanel ? 'bg-amber-600 text-white' : 'bg-white/95 text-amber-900 border border-slate-200 hover:bg-amber-50'
              }`}
            >
              <Navigation2 className="w-4 h-4 text-amber-600" />
              <span>Itinéraire</span>
            </button>
          </div>

          {/* Floating Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pointer-events-auto no-scrollbar">
            <select
              value={regionFilter}
              onChange={e => handleRegionChange(e.target.value)}
              className="bg-white/95 backdrop-blur-md text-slate-900 font-extrabold border border-slate-200 rounded-xl px-3 py-1.5 text-xs shadow-md focus:outline-none"
            >
              <option value="TOUTES">Toutes les Régions</option>
              {['Dakar','Thiès','Diourbel','Saint-Louis','Kaolack','Louga','Fatick','Ziguinchor'].map(r => (
                <option key={r}>{r}</option>
              ))}
            </select>

            {(['ALL', 'PROSPECTS', 'CLIENTS', 'POULAILLERS'] as EntityFilter[]).map(e => (
              <button
                key={e}
                onClick={() => setEntityFilter(e)}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs whitespace-nowrap shadow-md transition-all ${
                  entityFilter === e
                    ? 'bg-slate-900 text-white'
                    : 'bg-white/95 text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {e === 'ALL' ? 'Tous Marqueurs' : e === 'PROSPECTS' ? '🟡 Prospects' : e === 'CLIENTS' ? '🟢 Clients' : '🟣 Fermes'}
              </button>
            ))}
          </div>
        </div>

        {/* Floating Right Control Dock (GPS Locate, Live Tracking, Pin Capture) */}
        <div className="absolute bottom-6 right-4 z-[400] flex flex-col gap-2 pointer-events-auto">
          {/* Live Tracking Toggle */}
          <button
            onClick={isTracking ? stopTracking : startTracking}
            className={`w-12 h-12 rounded-2xl shadow-xl flex items-center justify-center transition-all ${
              isTracking ? 'bg-blue-600 text-white animate-pulse' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
            title="Activer/Désactiver le Suivi GPS en temps réel"
          >
            <Radio className="w-5 h-5" />
          </button>

          {/* Pin Capture Toggle */}
          <button
            onClick={() => setCaptureMode(m => !m)}
            className={`w-12 h-12 rounded-2xl shadow-xl flex items-center justify-center transition-all ${
              captureMode ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
            title="Capturer des coordonnées GPS par clic"
          >
            <Crosshair className="w-5 h-5" />
          </button>

          {/* Geolocate Button */}
          <button
            onClick={geolocate}
            className="w-12 h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl shadow-xl flex items-center justify-center transition-all active:scale-95"
            title="Recentrer sur ma position GPS"
          >
            <Target className="w-5 h-5" />
          </button>
        </div>

        {/* Leaflet Map */}
        <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            key={layer}
            url={tileUrls[layer]}
            maxZoom={19}
            maxNativeZoom={layer === 'satellite' ? 17 : 19}
            attribution={layer === 'satellite' ? 'Esri World Imagery' : '&copy; OpenStreetMap'}
          />
          <Recenter pos={mapCenter} />
          <MapResizeHandler />
          <ClickCapture onCapture={handleCaptured} />

          {/* OSRM Route Line */}
          {routePolyline.length > 0 && (
            <Polyline
              positions={routePolyline}
              pathOptions={{ color: '#d97706', weight: 6, opacity: 0.9, dashArray: '12, 8' }}
            />
          )}

          {/* HQ Depot Marker */}
          <Marker position={[DEPOT.lat, DEPOT.lng]} icon={depotIcon}>
            <Popup>
              <div className="p-3 text-xs space-y-2 font-sans min-w-[220px]">
                <span className="text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded uppercase">Siège social</span>
                <h4 className="font-extrabold text-slate-900 text-sm font-display">{DEPOT.name}</h4>
                <p className="text-slate-600 font-medium">Dépôt Logistique Principal & Hub de Distribution d'Œufs</p>
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => openGMapsDirections(DEPOT.lat, DEPOT.lng)}
                    className="w-full py-1.5 bg-emerald-600 text-white font-extrabold rounded-xl shadow-sm flex items-center justify-center gap-1.5 text-[11px]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Lancer Google Maps
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>

          {/* Live User Position */}
          {userPos && (
            <>
              <Marker position={[userPos.latitude, userPos.longitude]} icon={userIcon}>
                <Popup>
                  <div className="p-3 text-xs space-y-2 font-sans min-w-[200px]">
                    <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded uppercase">Ma Position</span>
                    <h4 className="font-extrabold text-slate-900 text-sm">Position GPS Actuelle</h4>
                    <p className="text-slate-700 font-bold">Précision : ±{Math.round(userPos.accuracy || 0)} mètres</p>
                    {isTracking && <p className="text-blue-600 font-extrabold animate-pulse">🔴 Suivi GPS en Temps Réel Actif</p>}
                  </div>
                </Popup>
              </Marker>
              {userPos.accuracy && (
                <Circle
                  center={[userPos.latitude, userPos.longitude]}
                  radius={userPos.accuracy}
                  pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.12 }}
                />
              )}
            </>
          )}

          {/* Captured Position Pin */}
          {capturedPos && (
            <Marker position={capturedPos} icon={makeIcon('#ef4444', '📍', 38)}>
              <Popup>
                <div className="p-2 text-xs font-sans">
                  <p className="font-extrabold text-red-600">Point GPS Capturé</p>
                  <p className="font-mono text-slate-700 mt-1">{capturedPos[0].toFixed(6)}, {capturedPos[1].toFixed(6)}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Prospects (Yellow) */}
          {showProspects && filtP.map(p => (
            <Marker key={p.id} position={[p.gps!.latitude, p.gps!.longitude]} icon={prospectIcon}>
              <Popup>
                <div className="p-3 text-xs space-y-2 font-sans min-w-[220px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded uppercase">Prospect</span>
                    <span className="text-amber-800 font-black text-[10px]">Score {p.scoring}%</span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-display">{p.nom}</h4>
                  <p className="text-slate-700 font-semibold">📞 {p.telephone}</p>
                  <p className="text-slate-600 font-medium">📍 {p.adresse}, {p.commune}</p>
                  
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => openPhoneCall(p.telephone)}
                      className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center justify-center gap-1 text-[10px]"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" /> Appeler
                    </button>
                    <button
                      onClick={() => openGMapsDirections(p.gps!.latitude, p.gps!.longitude)}
                      className="py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-sm flex items-center justify-center gap-1 text-[10px]"
                    >
                      <ExternalLink className="w-3 h-3" /> GPS
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Clients (Emerald Green) */}
          {showClients && filtC.map(c => (
            <Marker key={c.id} position={[c.gps!.latitude, c.gps!.longitude]} icon={clientIcon}>
              <Popup>
                <div className="p-3 text-xs space-y-2 font-sans min-w-[220px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded uppercase">{c.categorie}</span>
                    <span className={`text-[10px] font-black ${c.soldeCreance > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                      {c.soldeCreance > 0 ? `${c.soldeCreance.toLocaleString()} F Crédit` : 'Solde 0 F'}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-display">{c.raisonSociale}</h4>
                  <p className="text-slate-700 font-semibold">📞 {c.telephone}</p>
                  <p className="text-slate-600 font-medium">📍 {c.adresse}, {c.region}</p>

                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => openPhoneCall(c.telephone)}
                      className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center justify-center gap-1 text-[10px]"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" /> Appeler
                    </button>
                    <button
                      onClick={() => openGMapsDirections(c.gps!.latitude, c.gps!.longitude)}
                      className="py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-sm flex items-center justify-center gap-1 text-[10px]"
                    >
                      <ExternalLink className="w-3 h-3" /> GPS
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Poulaillers (Purple) */}
          {showPoulaillers && filtF.map(f => (
            <Marker key={f.id} position={[f.gps!.latitude, f.gps!.longitude]} icon={farmIcon}>
              <Popup>
                <div className="p-3 text-xs space-y-2 font-sans min-w-[220px]">
                  <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded uppercase">Ferme Partenaire</span>
                  <h4 className="font-extrabold text-slate-900 text-sm font-display">{f.nom}</h4>
                  <p className="text-slate-700 font-semibold">📞 {f.proprietaire} — {f.telephone}</p>
                  <p className="text-amber-800 font-extrabold">🥚 Production : {f.productionJournaliereOeufs.toLocaleString()} œufs/jour</p>

                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => openPhoneCall(f.telephone)}
                      className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center justify-center gap-1 text-[10px]"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" /> Appeler
                    </button>
                    <button
                      onClick={() => openGMapsDirections(f.gps!.latitude, f.gps!.longitude)}
                      className="py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-sm flex items-center justify-center gap-1 text-[10px]"
                    >
                      <ExternalLink className="w-3 h-3" /> GPS
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Floating Itinerary Navigation Card Modal */}
      {showItineraryPanel && (
        <div className="bg-white border border-amber-200 rounded-3xl p-4 md:p-5 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-600" />
              <h3 className="font-extrabold text-slate-900 text-sm md:text-base font-display">Calculateur d'Itinéraire Routier OSRM</h3>
            </div>
            <button onClick={() => setShowItineraryPanel(false)} className="p-1 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 font-extrabold mb-1">Point de Départ :</label>
              <select
                value={originType}
                onChange={e => setOriginType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
              >
                <option value="DEPOT">🏭 Dépôt Keur Massar (Siège BS)</option>
                <option value="USER">📍 Ma Position GPS Actuelle</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-extrabold mb-1">Destination Destinataire :</label>
              <select
                value={selectedDestinationId}
                onChange={e => {
                  setSelectedDestinationId(e.target.value);
                  calculateRouteToTarget(e.target.value);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
              >
                <option value="">-- Sélectionner un Client, Prospect ou Ferme --</option>
                {destinationTargets.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {destInfo && (
            <div className="p-4 bg-gradient-to-r from-amber-500/10 to-amber-600/10 rounded-2xl border border-amber-300/50 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-extrabold text-slate-900 text-sm block font-display">{destInfo.name}</span>
                <p className="text-xs text-slate-600 font-medium">{destInfo.address}</p>
                <div className="flex items-center gap-4 text-xs font-black text-amber-900 mt-2">
                  <span>🛣️ Distance : <strong>{routeDistanceKm} km</strong></span>
                  <span>⏱️ Temps Estimé : <strong>~{routeDurationMin} min</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openGMapsDirections(destInfo.lat, destInfo.lng)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md flex items-center gap-1.5 text-xs transition-all active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" /> Lancer Google Maps
                </button>
                <button
                  onClick={() => openWazeDirections(destInfo.lat, destInfo.lng)}
                  className="px-3.5 py-2 bg-sky-500 hover:bg-sky-600 text-white font-extrabold rounded-xl shadow-md flex items-center gap-1.5 text-xs transition-all active:scale-95"
                >
                  <Car className="w-4 h-4" /> Waze
                </button>
                <button
                  onClick={clearRoute}
                  className="px-3 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Effacer
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
