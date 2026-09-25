import { useEffect } from 'react';
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

export const ACCRA_DEFAULT = { lat: 5.6037, lng: -0.187 };

// OpenStreetMap blocks tile requests without a Referer header ("Access blocked"),
// and the old {s}.tile subdomains are deprecated, so use the single host and
// always send the origin. Override with VITE_MAP_TILE_URL to use another provider.
export const TILE_URL = import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export function MapTiles() {
  return (
    <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={19} referrerPolicy="strict-origin-when-cross-origin" />
  );
}

export const pinIcon = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;border-radius:9999px;background:#0d9488;border:3px solid white;box-shadow:0 0 0 2px #0d9488;"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const GEOFENCE_STYLE = { color: '#16a34a', weight: 2, fillColor: '#16a34a', fillOpacity: 0.12 };

export const round6 = (n) => Math.round(n * 1e6) / 1e6;

/** Returns {lat, lng} when both values are valid numbers, otherwise null. */
export function toPoint(lat, lng) {
  if (lat === '' || lng === '' || lat == null || lng == null) return null;
  const la = Number(lat);
  const ln = Number(lng);
  if (Number.isNaN(la) || Number.isNaN(ln) || Math.abs(la) > 90 || Math.abs(ln) > 180) return null;
  return { lat: la, lng: ln };
}

function PinController({ point, radius, onMove }) {
  useMapEvents({
    click(e) {
      onMove(e.latlng.lat, e.latlng.lng);
    },
  });
  if (!point) return null;
  return (
    <>
      {radius > 0 && <Circle center={[point.lat, point.lng]} radius={radius} pathOptions={GEOFENCE_STYLE} />}
      <Marker
        position={[point.lat, point.lng]}
        icon={pinIcon}
        draggable
        eventHandlers={{
          dragend: (e) => {
            const { lat, lng } = e.target.getLatLng();
            onMove(lat, lng);
          },
        }}
      />
    </>
  );
}

// Keeps the pin in view when the coordinates change from outside the map (typed inputs, modal).
function FollowPin({ point }) {
  const map = useMap();
  const lat = point?.lat;
  const lng = point?.lng;
  useEffect(() => {
    if (lat == null || lng == null) return;
    if (!map.getBounds().contains([lat, lng])) map.panTo([lat, lng]);
  }, [map, lat, lng]);
  return null;
}

/**
 * Leaflet map with a draggable pin and a green geofence circle.
 * Click the map or drag the pin to move it; onMove receives (lat, lng).
 */
export default function GeofenceMap({ lat, lng, radius, onMove, zoom, className = 'h-full w-full', children }) {
  const point = toPoint(lat, lng);
  const center = point ?? ACCRA_DEFAULT;
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={zoom ?? (point ? 16 : 13)} scrollWheelZoom className={className}>
      <MapTiles />
      <PinController point={point} radius={Number(radius) || 0} onMove={(la, ln) => onMove(round6(la), round6(ln))} />
      <FollowPin point={point} />
      {children}
    </MapContainer>
  );
}
