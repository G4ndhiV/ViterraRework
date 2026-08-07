import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { NEARBY_RADIUS_KM_OPTIONS } from "./NearbySearchEmpty";
import { cn } from "./ui/utils";

const GDL = { lat: 20.676208, lng: -103.34721 };

export type NearbyPinSelection = {
  lat: number;
  lng: number;
  km: number;
};

type Props = {
  /** Valor controlado opcional; si no, arranca en GDL + 5 km. */
  value?: NearbyPinSelection | null;
  onChange: (next: NearbyPinSelection) => void;
  className?: string;
};

/**
 * Mapa vacío: coloca un pin (clic) y ajusta el radio en km.
 * Pensado para el empty state de /renta y /venta.
 */
export function NearbyPinSearchPanel({ value, onChange, className }: Props) {
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapShellRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [km, setKm] = useState(value?.km ?? 5);
  const [pin, setPin] = useState({ lat: value?.lat ?? GDL.lat, lng: value?.lng ?? GDL.lng });
  /** Al reabrir con valor ya guardado, no re-emitir al montar (evita parpadeos). */
  const skipInitialEmitRef = useRef(value != null);

  useEffect(() => {
    if (skipInitialEmitRef.current) {
      skipInitialEmitRef.current = false;
      return;
    }
    onChangeRef.current({ lat: pin.lat, lng: pin.lng, km });
  }, [pin.lat, pin.lng, km]);

  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;

    const map = L.map(mapElRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([pin.lat, pin.lng], 12);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    // SVG: el sitio fuerza border-radius: 0 !important (un div redondo se veía cuadrado)
    const icon = L.divIcon({
      className: "viterra-nearby-pin",
      html: `
        <svg width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
          style="display:block;filter:drop-shadow(0 2px 4px rgba(0,0,0,.35))">
          <circle cx="11" cy="11" r="9" fill="#C8102E" stroke="#fff" stroke-width="3"/>
        </svg>
      `,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    const marker = L.marker([pin.lat, pin.lng], { icon, draggable: true }).addTo(map);
    const circle = L.circle([pin.lat, pin.lng], {
      radius: km * 1000,
      color: "#141c2e",
      weight: 2,
      fillColor: "#141c2e",
      fillOpacity: 0.1,
    }).addTo(map);

    marker.on("dragend", () => {
      const ll = marker.getLatLng();
      setPin({ lat: ll.lat, lng: ll.lng });
      circle.setLatLng(ll);
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      circle.setLatLng(e.latlng);
      setPin({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    mapRef.current = map;
    markerRef.current = marker;
    circleRef.current = circle;

    const invalidate = () => {
      map.invalidateSize({ animate: false });
    };
    const t1 = window.setTimeout(invalidate, 50);
    const t2 = window.setTimeout(invalidate, 280);

    const shell = mapShellRef.current;
    const ro =
      shell && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => invalidate())
        : null;
    if (shell && ro) ro.observe(shell);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      ro?.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
    // solo montaje
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const circle = circleRef.current;
    const map = mapRef.current;
    if (!circle || !map) return;
    circle.setRadius(km * 1000);
    circle.setLatLng([pin.lat, pin.lng]);
    markerRef.current?.setLatLng([pin.lat, pin.lng]);
    try {
      map.invalidateSize({ animate: false });
      map.fitBounds(circle.getBounds(), { padding: [24, 24], maxZoom: 14, animate: false });
    } catch {
      /* ignore */
    }
  }, [km, pin.lat, pin.lng]);

  return (
    <div className={cn("mx-auto w-full max-w-4xl text-left", className)}>
      <p className="mb-3 px-1 text-center text-[12px] leading-relaxed text-slate-500 sm:text-[13px]">
        Coloca un pin en el mapa (clic o arrastra) y ajusta el rango. Se buscan propiedades dentro del
        círculo, sin exigir la palabra clave anterior.
      </p>

      <div className="overflow-hidden border-2 border-slate-200 bg-white shadow-sm">
        {/* isolate + overflow: Leaflet no puede pintar encima del header ni salirse sobre los controles */}
        <div
          ref={mapShellRef}
          className={cn(
            "relative z-0 isolate w-full overflow-hidden bg-slate-100",
            "h-[min(36vh,260px)] sm:h-[min(40vh,320px)] md:h-[min(42vh,340px)]",
            "[&_.leaflet-control-zoom]:origin-top-left [&_.leaflet-control-zoom]:scale-90 sm:[&_.leaflet-control-zoom]:scale-100",
            "[&_.leaflet-bottom.leaflet-right]:max-w-[min(100%,14rem)] [&_.leaflet-control-attribution]:!text-[9px] sm:[&_.leaflet-control-attribution]:!text-[11px]"
          )}
        >
          <div
            ref={mapElRef}
            className="absolute inset-0 z-0 h-full w-full touch-manipulation [&_.leaflet-container]:!h-full [&_.leaflet-container]:!w-full [&_.leaflet-pane]:!z-auto"
            role="application"
            aria-label="Mapa para colocar pin de búsqueda cercana"
          />
        </div>

        <div className="flex flex-col gap-3 border-t-2 border-slate-200 bg-white px-3 py-3 sm:flex-row sm:items-center sm:gap-5 sm:px-4">
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Rango: {km} km
            </span>
            <input
              type="range"
              min={1}
              max={50}
              step={1}
              value={km}
              onChange={(e) => setKm(Number(e.target.value))}
              className="h-9 w-full accent-brand-navy"
              aria-valuemin={1}
              aria-valuemax={50}
              aria-valuenow={km}
              aria-label="Rango de búsqueda en kilómetros"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>1 km</span>
              <span>50 km</span>
            </div>
          </label>

          <div className="grid w-full grid-cols-3 gap-1.5 sm:max-w-[260px] sm:shrink-0">
            {NEARBY_RADIUS_KM_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setKm(n)}
                className={
                  km === n
                    ? "min-h-9 border border-brand-navy bg-brand-navy px-2 py-2 text-[11px] font-semibold text-white sm:px-2.5"
                    : "min-h-9 border border-slate-200 bg-white px-2 py-2 text-[11px] font-medium text-slate-700 hover:border-slate-300 sm:px-2.5"
                }
              >
                {n} km
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .viterra-nearby-pin {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
