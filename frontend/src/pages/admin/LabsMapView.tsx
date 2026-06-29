import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import { Star, TrendingUp, CalendarCheck, IndianRupee, ShieldCheck, Home, Percent, RefreshCw, X, MapPin } from "lucide-react";
import apiClient from "@/api/apiClient";
import { toast } from "sonner";

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY as string;
const LIBRARIES: ("places")[] = ["places"];

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
];

interface LabStat {
  id: string; name: string; address: string;
  lat: number | null; lng: number | null;
  rating: number; nabl: boolean; homeCollection: boolean; discount: number;
  todayBookings: number; todayRevenue: number; totalRevenue: number; totalBookings: number;
}

export default function LabsMapView() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_KEY,
    libraries: LIBRARIES,
    id: "google-maps-bookmypathology",
  });

  const [labs, setLabs] = useState<LabStat[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Hover & Selection State
  const [hoveredLab, setHoveredLab] = useState<LabStat | null>(null);
  const [selectedLab, setSelectedLab] = useState<LabStat | null>(null);
  
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Active Lab details to show
  const activeLab = selectedLab || hoveredLab;

  const showLabHover = (lab: LabStat) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setHoveredLab(lab);
  };

  const hideLabHover = useCallback(() => {
    hideTimer.current = setTimeout(() => setHoveredLab(null), 150);
  }, []);

  const selectLab = (lab: LabStat) => {
    setSelectedLab(lab);
    if (lab.lat && lab.lng && mapRef.current) {
      mapRef.current.panTo({ lat: lab.lat, lng: lab.lng });
      mapRef.current.setZoom(14);
    }
  };

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const fetchLabs = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/analytics/labs-map");
      setLabs(res.data);
    } catch { toast.error("Failed to load lab map data"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchLabs();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, []);

  // Fit map to all lab markers after data loads
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;
    const mappable = labs.filter(l => l.lat && l.lng);
    if (mappable.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    mappable.forEach(l => bounds.extend({ lat: l.lat!, lng: l.lng! }));
    mapRef.current.fitBounds(bounds, 60);
  }, [labs, isLoaded]);

  const mappableLabs = useMemo(() => labs.filter(l => l.lat && l.lng), [labs]);
  const unmappedLabs  = useMemo(() => labs.filter(l => !l.lat || !l.lng), [labs]);

  const mapCenter = useMemo<google.maps.LatLngLiteral>(
    () => ({ lat: 20.5937, lng: 78.9629 }),
    []
  );

  const mapOptions = useMemo<google.maps.MapOptions>(() => ({
    styles: MAP_STYLES,
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
    scrollwheel: true,
    gestureHandling: "greedy",
  }), []);

  // Helper to generate marker icons
  const getMarkerIcon = (isActive: boolean, isSelected: boolean) => {
    const color = isSelected ? "#ef4444" : (isActive ? "#4f46e5" : "#64748b");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
      <circle cx="20" cy="20" r="18" fill="${color}" opacity="0.95"/>
      <circle cx="20" cy="20" r="10" fill="white" opacity="0.95"/>
      <text x="20" y="24" text-anchor="middle" font-size="12">🧪</text>
      <polygon points="20,46 12,30 28,30" fill="${color}" opacity="0.95"/>
    </svg>`;
    return {
      url: `data:image/svg+xml;utf-8,` + encodeURIComponent(svg),
      anchor: isLoaded ? new window.google.maps.Point(20, 50) : undefined,
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Partner Labs — God View</h2>
          <p className="text-xs text-slate-400 mt-1">Live directory and analytics tracking powered by Google Maps</p>
        </div>
        <button onClick={fetchLabs} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {loadError ? (
        <div className="flex items-center justify-center h-[520px] rounded-2xl bg-red-50 border border-red-100">
          <div className="text-center">
            <p className="font-bold text-red-600 mb-1">Google Maps failed to load</p>
            <p className="text-xs text-red-400">Check that VITE_GOOGLE_MAPS_KEY is set in frontend/.env</p>
          </div>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-[520px] rounded-2xl bg-white border border-slate-100 shadow-soft">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="text-xs font-semibold text-slate-400">Loading Directory & Map…</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Side: Labs Directory List */}
          <div className="lg:col-span-4 flex flex-col space-y-4 max-h-[560px] overflow-y-auto pr-2 no-scrollbar">
            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Labs</span>
              <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{labs.length} Active</span>
            </div>
            
            <div className="space-y-3">
              {labs.map(lab => {
                const isSelected = selectedLab?.id === lab.id;
                const isHovered = hoveredLab?.id === lab.id;
                return (
                  <div
                    key={lab.id}
                    onClick={() => selectLab(lab)}
                    onMouseEnter={() => showLabHover(lab)}
                    onMouseLeave={hideLabHover}
                    className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      isSelected 
                        ? "bg-indigo-50/80 border-indigo-200 shadow-sm" 
                        : isHovered
                          ? "bg-slate-50/80 border-slate-200"
                          : "bg-white border-slate-100 hover:border-slate-200 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                          }`}>{lab.id}</span>
                          {lab.nabl && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-0.5">
                              NABL
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm leading-tight">{lab.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 flex items-center gap-0.5">
                          <MapPin size={10} className="shrink-0 text-slate-400" />
                          {lab.address}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold shrink-0">
                        <Star size={11} fill="currentColor" /> {lab.rating.toFixed(1)}
                      </div>
                    </div>

                    <div className="h-px bg-slate-100 my-3" />

                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                      <span>Today: <strong className="text-slate-800">{lab.todayBookings} bookings</strong></span>
                      <span className="text-emerald-600">₹{lab.todayRevenue.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Side: Map & Floating Glassmorphic Details Card */}
          <div className="lg:col-span-8 relative rounded-2xl border border-slate-100 shadow-soft overflow-hidden" style={{ minHeight: "560px" }}>
            {isLoaded && (
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={mapCenter}
                zoom={5}
                options={mapOptions}
                onLoad={onMapLoad}
              >
                {mappableLabs.map(lab => (
                  <MarkerF
                    key={lab.id}
                    position={{ lat: lab.lat!, lng: lab.lng! }}
                    icon={getMarkerIcon(lab.todayBookings > 0, selectedLab?.id === lab.id)}
                    onClick={() => selectLab(lab)}
                    onMouseOver={() => showLabHover(lab)}
                    onMouseOut={hideLabHover}
                  />
                ))}
              </GoogleMap>
            )}

            {/* Live badge overlay */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md border border-slate-100 pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">{mappableLabs.length} Labs Mapped</span>
            </div>

            {/* Glassmorphic details card overlay (shows on hover or select) */}
            {activeLab && (
              <div 
                className="absolute z-20 top-4 right-4 w-[290px] rounded-2xl border border-white/20 shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200"
                style={{ background: "rgba(15,23,42,0.88)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 tracking-widest">{activeLab.id}</span>
                      {activeLab.nabl && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                          <ShieldCheck size={9} /> NABL
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-black text-white leading-tight">{activeLab.name}</h3>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{activeLab.address}</p>
                  </div>
                  
                  {/* Close button if selected/locked open */}
                  {selectedLab && (
                    <button 
                      onClick={() => setSelectedLab(null)}
                      className="p-1 rounded-lg bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="h-px bg-white/10" />

                {/* Today Stats */}
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Today</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="flex items-center gap-1 text-emerald-400 mb-1"><CalendarCheck size={11} /><span className="text-[9px] font-black uppercase">Bookings</span></div>
                      <p className="text-xl font-black text-white">{activeLab.todayBookings}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="flex items-center gap-1 text-indigo-400 mb-1"><IndianRupee size={11} /><span className="text-[9px] font-black uppercase">Revenue</span></div>
                      <p className="text-xl font-black text-white">₹{activeLab.todayRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* All-time Stats */}
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">All-Time</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="flex items-center gap-1 text-blue-400 mb-1"><TrendingUp size={11} /><span className="text-[9px] font-black uppercase">Orders</span></div>
                      <p className="text-xl font-black text-white">{activeLab.totalBookings}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="flex items-center gap-1 text-rose-400 mb-1"><IndianRupee size={11} /><span className="text-[9px] font-black uppercase">Earned</span></div>
                      <p className="text-xl font-black text-white">₹{activeLab.totalRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex gap-2 flex-wrap">
                  {activeLab.homeCollection && (
                    <span className="flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                      <Home size={9} /> Home Collection
                    </span>
                  )}
                  {activeLab.discount > 0 && (
                    <span className="flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 uppercase">
                      <Percent size={9} /> {activeLab.discount}% Off
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Labs without coordinates */}
      {unmappedLabs.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <p className="text-xs font-bold text-amber-700 mb-3 uppercase tracking-wider">
            ⚠️ {unmappedLabs.length} lab{unmappedLabs.length > 1 ? "s" : ""} without geocoordinates
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {unmappedLabs.map(lab => (
              <div key={lab.id} onClick={() => selectLab(lab)} className="bg-white hover:border-amber-200 transition-colors cursor-pointer rounded-xl p-4 border border-amber-100 shadow-sm">
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{lab.id}</span>
                <p className="font-bold text-slate-800 text-sm mt-1">{lab.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{lab.address}</p>
                <div className="flex gap-3 mt-2 text-xs text-slate-500 font-semibold">
                  <span>📋 {lab.totalBookings} orders</span>
                  <span>💰 ₹{lab.totalRevenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
