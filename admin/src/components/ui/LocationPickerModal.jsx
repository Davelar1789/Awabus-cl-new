import { useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Crosshair, LocateFixed, MapPin } from 'lucide-react';
import Modal from './Modal.jsx';
import Button from './Button.jsx';

export const ACCRA_DEFAULT = { lat: 5.6037, lng: -0.187 };

const pinIcon = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;border-radius:9999px;background:#0d9488;border:3px solid white;box-shadow:0 0 0 2px #0d9488;"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const round6 = (n) => Math.round(n * 1e6) / 1e6;

const toPoint = (lat, lng) => {
  const la = Number(lat);
  const ln = Number(lng);
  if (lat === '' || lng === '' || lat == null || lng == null || Number.isNaN(la) || Number.isNaN(ln)) return null;
  return { lat: la, lng: ln };
};

function PinController({ point, onMove }) {
  useMapEvents({
    click(e) {
      onMove({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return (
    <Marker
      position={[point.lat, point.lng]}
      icon={pinIcon}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const { lat, lng } = e.target.getLatLng();
          onMove({ lat, lng });
        },
      }}
    />
  );
}

// Exposes the Leaflet map instance to the parent so toolbar buttons can fly around.
function MapHandle({ onReady }) {
  const map = useMap();
  useEffect(() => {
    onReady(map);
    // The modal animates in, so make sure tiles fill the final container size.
    const t = setTimeout(() => map.invalidateSize(), 50);
    return () => clearTimeout(t);
  }, [map, onReady]);
  return null;
}

/**
 * Pop-up map for choosing a coordinate. Click the map or drag the pin to move it,
 * use the zoom controls / scroll wheel to zoom, then "Use this location" to apply.
 */
export default function LocationPickerModal({ open, onClose, lat, lng, onConfirm, title = 'Pick location on map' }) {
  const initial = toPoint(lat, lng);
  const [point, setPoint] = useState(initial ?? ACCRA_DEFAULT);
  const [map, setMap] = useState(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState('');

  // Reset to the current field values every time the modal opens.
  useEffect(() => {
    if (open) {
      setPoint(toPoint(lat, lng) ?? ACCRA_DEFAULT);
      setGeoError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const zoomToPin = () => map?.flyTo([point.lat, point.lng], 18);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by this browser.');
      return;
    }
    setLocating(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPoint(next);
        map?.flyTo([next.lat, next.lng], 17);
        setLocating(false);
      },
      () => {
        setGeoError('Could not get your current location.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              onConfirm(round6(point.lat), round6(point.lng));
              onClose();
            }}
          >
            <MapPin className="h-4 w-4" />
            Use this location
          </Button>
        </>
      }
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Click the map or drag the pin. Scroll or use +/− to zoom.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={zoomToPin}>
            <Crosshair className="h-4 w-4" />
            Zoom to pin
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={useMyLocation} loading={locating}>
            {!locating && <LocateFixed className="h-4 w-4" />}
            My location
          </Button>
        </div>
      </div>

      <div className="h-[60vh] max-h-[520px] min-h-[300px]">
        <MapContainer center={[point.lat, point.lng]} zoom={initial ? 16 : 13} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <MapHandle onReady={setMap} />
          <PinController point={point} onMove={setPoint} />
        </MapContainer>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span className="text-slate-500 dark:text-slate-400">
          Latitude: <span className="font-semibold text-slate-800 dark:text-slate-100">{round6(point.lat)}</span>
        </span>
        <span className="text-slate-500 dark:text-slate-400">
          Longitude: <span className="font-semibold text-slate-800 dark:text-slate-100">{round6(point.lng)}</span>
        </span>
      </div>
      {geoError && <p className="mt-2 text-sm text-red-600">{geoError}</p>}
    </Modal>
  );
}
