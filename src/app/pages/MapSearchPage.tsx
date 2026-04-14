import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import type { Layer, Map as LeafletMap } from "leaflet";
import L from "leaflet";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PropertyCard } from "../components/PropertyCard";
import type { Property } from "../components/PropertyCard";
import { mockProperties } from "../data/properties";
import {
  pointInZone,
  zoneFromLeafletLayer,
  decimateLatLngs,
  type SearchZone,
} from "../../lib/geoSearch";
import { ArrowLeft, MapPinned, Trash2, Search, Pencil } from "lucide-react";

type MapFilters = {
  type: string;
  status: string;
  minPrice: string;
  maxPrice: string;
};

const MIN_STROKE_POINTS = 12;
const MAX_POLYGON_VERTICES = 320;

function applyFilters(list: Property[], f: MapFilters, zone: SearchZone | null): Property[] {
  let out = [...list];
  if (f.type) {
    out = out.filter((p) => p.type.toLowerCase() === f.type.toLowerCase());
  }
  if (f.status) {
    out = out.filter((p) => p.status === f.status);
  }
  if (f.minPrice) {
    out = out.filter((p) => p.price >= Number(f.minPrice));
  }
  if (f.maxPrice) {
    out = out.filter((p) => p.price <= Number(f.maxPrice));
  }
  if (zone) {
    out = out.filter((p) => {
      if (!p.coordinates) return false;
      return pointInZone(L.latLng(p.coordinates.lat, p.coordinates.lng), zone);
    });
  }
  return out;
}

function statusFromSearchParams(searchParams: URLSearchParams): "" | "venta" | "alquiler" {
  const s = searchParams.get("status");
  return s === "venta" || s === "alquiler" ? s : "";
}

export function MapSearchPage() {
  const [searchParams] = useSearchParams();
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const drawnRef = useRef<Layer | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const drawingModeRef = useRef(false);
  const cancelPartialStrokeRef = useRef<(() => void) | null>(null);

  const [zone, setZone] = useState<SearchZone | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [filters, setFilters] = useState<MapFilters>(() => ({
    type: "",
    status: statusFromSearchParams(searchParams),
    minPrice: "",
    maxPrice: "",
  }));

  useEffect(() => {
    drawingModeRef.current = isDrawingMode;
  }, [isDrawingMode]);

  useEffect(() => {
    const st = statusFromSearchParams(searchParams);
    setFilters((f) => ({ ...f, status: st }));
  }, [searchParams]);

  const results = useMemo(() => applyFilters(mockProperties, filters, zone), [filters, zone]);

  const syncMarkers = useCallback((list: Property[]) => {
    const group = markersRef.current;
    const map = mapRef.current;
    if (!group || !map) return;
    group.clearLayers();
    list.forEach((p) => {
      if (!p.coordinates) return;
      const m = L.circleMarker([p.coordinates.lat, p.coordinates.lng], {
        radius: 9,
        fillColor: "#C8102E",
        color: "#fff",
        weight: 2,
        fillOpacity: 0.9,
      });
      m.bindPopup(
        `<div style="font-family:Poppins,sans-serif;min-width:180px"><strong>${p.title}</strong><br/><span style="color:#64748b">${p.location}</span><br/><a href="/propiedades/${p.id}" style="color:#C8102E;font-weight:600">Ver ficha</a></div>`
      );
      group.addLayer(m);
    });
  }, []);

  useEffect(() => {
    syncMarkers(results);
  }, [results, syncMarkers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (isDrawingMode) map.doubleClickZoom.disable();
    else map.doubleClickZoom.enable();
    const el = map.getContainer();
    el.style.touchAction = isDrawingMode ? "none" : "manipulation";
  }, [isDrawingMode]);

  useEffect(() => {
    const el = mapEl.current;
    if (!el) return;

    let cancelled = false;
    let mapInstance: LeafletMap | undefined;

    const run = async () => {
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !mapEl.current) return;

      const map = L.map(mapEl.current, { zoomControl: true }).setView([20.6736, -103.3445], 12);
      mapInstance = map;
      mapRef.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO',
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);

      const markers = L.layerGroup().addTo(map);
      markersRef.current = markers;

      const container = map.getContainer();

      let strokeActive = false;
      let strokePts: L.LatLng[] = [];
      let tempLine: L.Polyline | null = null;

      const clearPartial = () => {
        strokeActive = false;
        strokePts = [];
        if (tempLine) {
          map.removeLayer(tempLine);
          tempLine = null;
        }
        if (map.dragging) map.dragging.enable();
      };

      cancelPartialStrokeRef.current = clearPartial;

      const finalizeStroke = () => {
        if (!strokeActive) return;
        strokeActive = false;
        if (tempLine) {
          map.removeLayer(tempLine);
          tempLine = null;
        }
        if (map.dragging) map.dragging.enable();

        const raw = strokePts;
        strokePts = [];

        if (raw.length < MIN_STROKE_POINTS) {
          clearPartial();
          return;
        }

        const prev = drawnRef.current;
        if (prev && map.hasLayer(prev)) {
          map.removeLayer(prev);
        }
        drawnRef.current = null;

        const ring = decimateLatLngs(raw, MAX_POLYGON_VERTICES);
        const poly = L.polygon(ring, {
          color: "#C8102E",
          weight: 2,
          fillColor: "#C8102E",
          fillOpacity: 0.14,
          lineJoin: "round",
          lineCap: "round",
        });
        poly.addTo(map);
        drawnRef.current = poly;
        const z = zoneFromLeafletLayer(poly);
        setZone(z);
        drawingModeRef.current = false;
        setIsDrawingMode(false);
      };

      const onPointerDown = (ev: PointerEvent) => {
        if (!drawingModeRef.current) return;
        if (ev.pointerType === "mouse" && ev.button !== 0) return;

        ev.preventDefault();
        clearPartial();

        const latlng = map.mouseEventToLatLng(ev);
        strokeActive = true;
        strokePts = [latlng];
        tempLine = L.polyline(strokePts, {
          color: "#C8102E",
          weight: 2.5,
          opacity: 0.95,
          lineJoin: "round",
          lineCap: "round",
        }).addTo(map);
        map.dragging.disable();
        try {
          container.setPointerCapture(ev.pointerId);
        } catch {
          /* ignore */
        }
      };

      const onPointerMove = (ev: PointerEvent) => {
        if (!strokeActive) return;
        ev.preventDefault();
        const latlng = map.mouseEventToLatLng(ev);
        strokePts.push(latlng);
        tempLine?.setLatLngs(strokePts);
      };

      const onPointerUp = (ev: PointerEvent) => {
        if (!strokeActive) return;
        ev.preventDefault();
        try {
          container.releasePointerCapture(ev.pointerId);
        } catch {
          /* ignore */
        }
        finalizeStroke();
      };

      const onPointerCancel = (ev: PointerEvent) => {
        if (!strokeActive) return;
        try {
          container.releasePointerCapture(ev.pointerId);
        } catch {
          /* ignore */
        }
        clearPartial();
      };

      container.addEventListener("pointerdown", onPointerDown);
      container.addEventListener("pointermove", onPointerMove);
      container.addEventListener("pointerup", onPointerUp);
      container.addEventListener("pointercancel", onPointerCancel);

      setTimeout(() => map.invalidateSize(), 200);

      const cleanupPointer = () => {
        container.removeEventListener("pointerdown", onPointerDown);
        container.removeEventListener("pointermove", onPointerMove);
        container.removeEventListener("pointerup", onPointerUp);
        container.removeEventListener("pointercancel", onPointerCancel);
        clearPartial();
        cancelPartialStrokeRef.current = null;
      };

      (map as unknown as { __viterraPointerCleanup?: () => void }).__viterraPointerCleanup =
        cleanupPointer;
    };

    run();

    return () => {
      cancelled = true;
      const m = mapRef.current;
      if (m) {
        const cleanup = (m as unknown as { __viterraPointerCleanup?: () => void }).__viterraPointerCleanup;
        cleanup?.();
      }
      markersRef.current = null;
      drawnRef.current = null;
      mapRef.current = null;
      mapInstance?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mapa: un solo montaje
  }, []);

  useEffect(() => {
    if (!isDrawingMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cancelPartialStrokeRef.current?.();
        drawingModeRef.current = false;
        setIsDrawingMode(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isDrawingMode]);

  const clearZone = () => {
    cancelPartialStrokeRef.current?.();
    const map = mapRef.current;
    const layer = drawnRef.current;
    if (map && layer && map.hasLayer(layer)) {
      map.removeLayer(layer);
    }
    drawnRef.current = null;
    setZone(null);
    drawingModeRef.current = false;
    setIsDrawingMode(false);
  };

  return (
    <div className="viterra-page min-h-screen flex flex-col bg-neutral-50">
      <Header />

      <div data-reveal className="flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
        <aside className="w-full lg:w-[400px] shrink-0 border-b lg:border-b-0 lg:border-r border-neutral-200 bg-white p-6 lg:p-8 flex flex-col gap-6 overflow-y-auto max-h-[48vh] lg:max-h-none">
          <div>
            <Link
              to="/propiedades"
              className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-primary mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al listado
            </Link>
            <h1 className="font-heading text-2xl font-light text-neutral-900 tracking-tight flex items-center gap-2">
              <MapPinned className="w-7 h-7 text-primary" strokeWidth={1.25} />
              Búsqueda en mapa
            </h1>
            <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
              Pulse <strong>Dibujar mi zona</strong>, luego <strong>arrastre con el dedo o el ratón</strong> sobre el mapa
              rodeando el área que le interesa. Al soltar, se muestran solo las propiedades dentro de ese trazo. Sin
              cuadros ni herramientas complicadas.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                if (isDrawingMode) {
                  cancelPartialStrokeRef.current?.();
                  drawingModeRef.current = false;
                  setIsDrawingMode(false);
                } else {
                  drawingModeRef.current = true;
                  setIsDrawingMode(true);
                }
              }}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                isDrawingMode
                  ? "border-2 border-primary bg-white text-primary hover:bg-brand-canvas"
                  : "bg-primary text-primary-foreground hover:bg-brand-red-hover"
              }`}
            >
              <Pencil className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
              {isDrawingMode ? "Cancelar dibujo" : "Dibujar mi zona"}
            </button>
            <p className="text-xs text-neutral-500 leading-snug">
              {isDrawingMode
                ? "Mantenga pulsado y trace un contorno cerrado sobre el mapa. Suelte para ver resultados. Tecla Esc para salir."
                : "Puede volver a dibujar en cualquier momento; el trazo anterior se sustituye."}
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 p-4 space-y-4 bg-[#faf9f7]">
            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-medium">Filtros</p>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">Tipo</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters((s) => ({ ...s, type: e.target.value }))}
                className="w-full px-3 py-2.5 border border-neutral-300 rounded-md text-sm bg-white"
              >
                <option value="">Todos</option>
                <option value="casa">Casa</option>
                <option value="apartamento">Apartamento</option>
                <option value="villa">Villa</option>
                <option value="penthouse">Penthouse</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">Estado</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters((s) => ({ ...s, status: e.target.value }))}
                className="w-full px-3 py-2.5 border border-neutral-300 rounded-md text-sm bg-white"
              >
                <option value="">Todos</option>
                <option value="venta">Venta</option>
                <option value="alquiler">Alquiler</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">Precio mín.</label>
                <input
                  type="number"
                  placeholder="$0"
                  value={filters.minPrice}
                  onChange={(e) => setFilters((s) => ({ ...s, minPrice: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-md text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">Precio máx.</label>
                <input
                  type="number"
                  placeholder="Máx."
                  value={filters.maxPrice}
                  onChange={(e) => setFilters((s) => ({ ...s, maxPrice: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-md text-sm bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="text-sm text-neutral-700">
              <span className="font-semibold text-neutral-900">{results.length}</span> resultado
              {results.length !== 1 ? "s" : ""}
              {zone ? " en zona" : ""}
            </div>
            <button
              type="button"
              onClick={clearZone}
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-neutral-600 border border-neutral-300 px-3 py-2 rounded-md hover:border-primary hover:text-primary transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Quitar zona
            </button>
          </div>

          {!zone && !isDrawingMode && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200/80 rounded-md px-3 py-2">
              Todavía no hay zona: se listan todas las propiedades que cumplen los filtros. Use{" "}
              <strong>Dibujar mi zona</strong> y trace sobre el mapa para acotar por ubicación.
            </p>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
            {results.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
            {results.length === 0 && (
              <div className="text-center py-10 text-neutral-500 text-sm border border-dashed border-neutral-300 rounded-lg">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No hay propiedades en esta zona con los filtros elegidos.
              </div>
            )}
          </div>
        </aside>

        <div className="flex-1 min-h-[52vh] lg:min-h-0 relative">
          <div ref={mapEl} className="absolute inset-0 z-0 bg-neutral-200" />
          {isDrawingMode && (
            <div className="pointer-events-none absolute inset-x-0 top-3 z-[1000] flex justify-center px-4">
              <div className="max-w-md rounded-lg bg-brand-navy/92 px-4 py-2.5 text-center text-sm text-white shadow-lg">
                Arrastre sobre el mapa para rodear la zona. Suelte para aplicar.
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
