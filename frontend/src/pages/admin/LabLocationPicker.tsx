import { useState, useRef, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Autocomplete, Marker } from "@react-google-maps/api";
import { MapPin, Navigation } from "lucide-react";

const LIBRARIES: ("places")[] = ["places"];
const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY as string;

export interface LocationData {
  address: string;
  lat: number;
  lng: number;
  pincode: string;
}

interface Props {
  onLocationSelect: (data: LocationData) => void;
}

export default function LabLocationPicker({ onLocationSelect }: Props) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_KEY,
    libraries: LIBRARIES,
    id: "google-maps-bookmypathology",
  });

  const [address, setAddress] = useState("");
  const [markerPos, setMarkerPos] = useState<{ lat: number; lng: number } | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [pincode, setPincode] = useState("");
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const extractPincode = (components: google.maps.GeocoderAddressComponent[]) =>
    components.find((c) => c.types.includes("postal_code"))?.long_name || "";

  const onPlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry?.location) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const formatted = place.formatted_address || "";
    const pc = extractPincode(place.address_components || []);

    setAddress(formatted);
    setMarkerPos({ lat, lng });
    setPincode(pc);
    setMapVisible(true);
    onLocationSelect({ address: formatted, lat, lng, pincode: pc });
  };

  const onMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPos({ lat, lng });

      // Reverse-geocode the dragged pin to update address + pincode
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          const newAddress = results[0].formatted_address;
          const pc = extractPincode(results[0].address_components);
          setAddress(newAddress);
          setPincode(pc);
          onLocationSelect({ address: newAddress, lat, lng, pincode: pc });
        }
      });
    },
    [onLocationSelect]
  );

  if (loadError) {
    return (
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Address</label>
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-500 font-medium">
          Google Maps failed to load — check VITE_GOOGLE_MAPS_KEY in frontend/.env and ensure Places API is enabled.
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Address</label>
        <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400 font-medium animate-pulse">
          Loading Google Maps…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Address</label>
        <Autocomplete
          onLoad={(ac) => (autocompleteRef.current = ac)}
          onPlaceChanged={onPlaceChanged}
          options={{ componentRestrictions: { country: "in" }, types: ["establishment", "geocode"] }}
        >
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Search lab name or address in India…"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-primary transition-all"
          />
        </Autocomplete>
        <p className="text-[10px] text-slate-400 font-medium">
          🔍 Type to search — select from dropdown, then drag the pin to fine-tune
        </p>
      </div>

      {/* Inline map — appears after address is selected */}
      {mapVisible && markerPos && (
        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: 260 }}>
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={markerPos}
            zoom={16}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              zoomControl: true,
              scrollwheel: true,
              gestureHandling: "greedy",
            }}
          >
            <Marker
              position={markerPos}
              draggable={true}
              onDragEnd={onMarkerDragEnd}
            />
          </GoogleMap>

          {/* Footer strip showing confirmed address + pincode */}
          <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex items-start gap-2">
            <MapPin size={13} className="text-primary mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-700 leading-snug line-clamp-1">{address}</p>
              {pincode && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Navigation size={9} className="text-slate-400" />
                  <span className="text-[10px] text-slate-400 font-bold">Pincode: {pincode}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
