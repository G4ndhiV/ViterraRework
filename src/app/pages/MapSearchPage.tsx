import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import type { Layer, Map as LeafletMap } from "leaflet";
import L from "leaflet";
import { MapSearchHeaderBar } from "../components/MapSearchHeaderBar";
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
import {
  ArrowLeft,
  MapPinned,
  Trash2,
  Search,
  Pencil,
  SlidersHorizontal,
  Info,
  RotateCcw,
  ChevronDown,
} from "lucide-react";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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
  const [zoneFiltersOpen, setZoneFiltersOpen] = useState(false);
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

  useEffect(() => {
    if (!zone) setZoneFiltersOpen(false);
  }, [zone]);

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
      const priceStr = `$${p.price.toLocaleString()}`;
      const imgBlock = p.image
        ? `<div class="viterra-map-popup__img"><img src="${escapeHtml(p.image)}" alt="" loading="lazy"/></div>`
        : `<div class="viterra-map-popup__img viterra-map-popup__img--placeholder" aria-hidden="true"></div>`;
      m.bindPopup(
        `<div class="viterra-map-popup">
          ${imgBlock}
          <div class="viterra-map-popup__body">
            <div class="viterra-map-popup__title">${escapeHtml(p.title)}</div>
            <div class="viterra-map-popup__loc">${escapeHtml(p.location)}</div>
            <div class="viterra-map-popup__price">${escapeHtml(priceStr)}</div>
            <a class="viterra-map-popup__cta" href="/propiedades/${escapeHtml(p.id)}">Ver ficha</a>
          </div>
        </div>`,
        { maxWidth: 280, className: "viterra-map-popup-wrap", closeButton: true }
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

  const redrawZone = () => {
    cancelPartialStrokeRef.current?.();
    const map = mapRef.current;
    const layer = drawnRef.current;
    if (map && layer && map.hasLayer(layer)) {
      map.removeLayer(layer);
    }
    drawnRef.current = null;
    setZone(null);
    drawingModeRef.current = true;
    setIsDrawingMode(true);
  };

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const t = window.setTimeout(() => map.invalidateSize(), 220);
    return () => window.clearTimeout(t);
  }, [zone]);

  const filterFields = (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500" style={{ fontWeight: 600 }}>
            Tipo
          </label>
          <select
            value={filters.type}
            onChange={(e) => setFilters((s) => ({ ...s, type: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 shadow-inner focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/25"
            style={{ fontWeight: 500 }}
          >
            <option value="">Todos los tipos</option>
            <option value="casa">Casa</option>
            <option value="apartamento">Apartamento</option>
            <option value="villa">Villa</option>
            <option value="penthouse">Penthouse</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500" style={{ fontWeight: 600 }}>
            Operación
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilters((s) => ({ ...s, status: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 shadow-inner focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/25"
            style={{ fontWeight: 500 }}
          >
            <option value="">Venta y alquiler</option>
            <option value="venta">Solo venta</option>
            <option value="alquiler">Solo alquiler</option>
          </select>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500" style={{ fontWeight: 600 }}>
            Precio mín.
          </label>
          <input
            type="number"
            placeholder="0"
            value={filters.minPrice}
            onChange={(e) => setFilters((s) => ({ ...s, minPrice: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/25"
            style={{ fontWeight: 500 }}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500" style={{ fontWeight: 600 }}>
            Precio máx.
          </label>
          <input
            type="number"
            placeholder="Sin límite"
            value={filters.maxPrice}
            onChange={(e) => setFilters((s) => ({ ...s, maxPrice: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/25"
            style={{ fontWeight: 500 }}
          />
        </div>
      </div>
    </>
  );

  return (
    <div className="viterra-page map-search-page flex min-h-screen flex-col bg-[#eceae6]">
      <div
        data-reveal
        className="flex min-h-0 flex-1 flex-col lg:max-h-[100dvh] lg:min-h-[100dvh] lg:flex-row lg:overflow-hidden"
      >
        {/* Panel izquierdo: altura viewport desde arriba (sin header global) */}
        <aside className="flex w-full shrink-0 flex-col border-b border-slate-200/90 bg-gradient-to-b from-white via-white to-[#f4f2ef] p-0 pt-[env(safe-area-inset-top,0px)] shadow-[4px_0_24px_-8px_rgba(20,28,46,0.12)] lg:z-10 lg:max-h-[100dvh] lg:min-h-[100dvh] lg:w-[400px] lg:shrink-0 lg:overflow-hidden lg:border-b-0 lg:border-r lg:border-slate-200/80 lg:pt-[env(safe-area-inset-top,0px)] xl:w-[420px]">
          {!zone && (
            <div className="shrink-0 border-b border-slate-200/80 bg-brand-navy px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))] text-white lg:pt-4">
              <Link
                to="/propiedades"
                className="mb-3 inline-flex items-center gap-2 text-xs font-medium text-white/80 transition-colors hover:text-white"
                style={{ fontWeight: 500 }}
              >
                <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
                Volver al listado
              </Link>
              <h1 className="font-heading flex items-center gap-2.5 text-xl font-semibold tracking-tight md:text-[1.35rem]" style={{ fontWeight: 600 }}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                  <MapPinned className="h-5 w-5 text-[#f0c0c8]" strokeWidth={1.5} />
                </span>
                Búsqueda en mapa
              </h1>
              <p className="mt-2 text-xs leading-relaxed text-white/75" style={{ fontWeight: 500 }}>
                Ajusta filtros y dibuja una zona en el mapa; las coincidencias aparecerán en este panel.
              </p>
            </div>
          )}

          {!zone ? (
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
              <details className="group overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
                <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
                  <Info className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                  <span className="font-heading text-xs font-semibold uppercase tracking-[0.14em] text-brand-navy">
                    Cómo usar el mapa
                  </span>
                </summary>
                <p className="border-t border-slate-100 px-4 pb-3 pt-2 text-xs leading-relaxed text-slate-600" style={{ fontWeight: 500 }}>
                  Pulse <strong className="text-slate-800">Dibujar mi zona</strong>, trace un contorno sobre el mapa y suelte. Solo se listan inmuebles dentro del área. Puede borrar la zona y volver a dibujar.
                </p>
              </details>

              <div>
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
                  className={`font-heading flex w-full items-center justify-center gap-2.5 rounded-xl px-4 py-3.5 text-sm font-semibold tracking-wide shadow-lg transition-all ${
                    isDrawingMode
                      ? "border-2 border-primary bg-white text-primary shadow-none hover:bg-brand-canvas"
                      : "bg-primary text-white shadow-primary/25 hover:bg-brand-red-hover hover:shadow-xl"
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  <Pencil className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                  {isDrawingMode ? "Cancelar dibujo" : "Dibujar mi zona"}
                </button>
                <p className="mt-2 text-center text-[11px] leading-snug text-slate-500" style={{ fontWeight: 500 }}>
                  {isDrawingMode ? "Mantenga pulsado y trace · Esc para salir" : "Sin zona dibujada solo aplican tipo, estado y precio"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.04]">
                <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <SlidersHorizontal className="h-4 w-4 text-primary" strokeWidth={2} />
                  <span className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-brand-navy">
                    Filtros
                  </span>
                </div>
                {filterFields}
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-5 pt-[max(1.25rem,env(safe-area-inset-top))] lg:pt-5">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-0.5">
                <div className="flex items-baseline justify-between gap-2 border-b border-slate-200/80 pb-2">
                  <h2 className="font-heading text-sm font-semibold text-brand-navy" style={{ fontWeight: 600 }}>
                    Resultados en zona
                  </h2>
                  <span className="inline-flex min-h-[1.5rem] min-w-[1.5rem] items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-white">
                    {results.length}
                  </span>
                </div>
                {results.map((property) => (
                  <div
                    key={property.id}
                    className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-900/5 ring-1 ring-slate-900/[0.03]"
                  >
                    <PropertyCard property={property} />
                  </div>
                ))}
                {results.length === 0 && (
                  <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white/90 px-4 py-10 text-center">
                    <Search className="mx-auto mb-2 h-9 w-9 text-slate-300" strokeWidth={1.25} />
                    <p className="font-heading text-sm font-semibold text-brand-navy" style={{ fontWeight: 600 }}>
                      Sin coincidencias en esta zona
                    </p>
                    <p className="mt-1 text-xs text-slate-600" style={{ fontWeight: 500 }}>
                      Cambia filtros o redibuja la zona.
                    </p>
                  </div>
                )}
              </div>

              <details
                className="shrink-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.04]"
                onToggle={(e) => setZoneFiltersOpen(e.currentTarget.open)}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex min-w-0 items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                    <span className="font-heading text-xs font-bold uppercase tracking-[0.18em] text-brand-navy">
                      Cambiar filtros
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-primary transition-transform duration-200 ease-out ${zoneFiltersOpen ? "rotate-180" : ""}`}
                    strokeWidth={2}
                    aria-hidden
                  />
                </summary>
                <div className="border-t border-slate-100 px-4 pb-4 pt-1">{filterFields}</div>
              </details>
            </div>
          )}
        </aside>

        {/* Mapa + barra superior; el menú es overlay y no desplaza el mapa */}
        <div className="relative isolate flex min-h-0 min-w-0 flex-1 flex-col bg-slate-200/60 lg:min-h-0 lg:max-h-[100dvh] lg:border-l lg:border-slate-200/80">
          <MapSearchHeaderBar />
          <div className="relative z-0 min-h-[min(48vh,480px)] w-full flex-1 lg:min-h-0">
            <div
              ref={mapEl}
              className="absolute inset-0 z-0 bg-slate-300 [&_.leaflet-container]:!filter-none [&_.leaflet-tile-pane]:!filter-none"
            />
            {isDrawingMode && (
              <div className="pointer-events-none absolute inset-x-0 top-4 z-[1000] flex justify-center px-4">
                <div className="max-w-md rounded-2xl bg-brand-navy px-5 py-3 text-center text-sm text-white shadow-2xl ring-1 ring-white/10" style={{ fontWeight: 500 }}>
                  Arrastre sobre el mapa para marcar la zona. Suelte para aplicar.
                </div>
              </div>
            )}

            {zone && !isDrawingMode && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1000] flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
                <div className="pointer-events-auto flex w-full max-w-lg flex-col gap-2 rounded-2xl border border-slate-200/90 bg-white/95 p-2.5 shadow-[0_-8px_32px_-8px_rgba(20,28,46,0.35)] backdrop-blur-sm sm:flex-row sm:items-stretch sm:justify-center sm:gap-2 sm:p-2">
                  <button
                    type="button"
                    onClick={redrawZone}
                    className="font-heading flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white shadow-md transition-colors hover:bg-brand-red-hover sm:py-3 sm:text-xs"
                    style={{ fontWeight: 600 }}
                  >
                    <RotateCcw className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                    Redibujar zona
                  </button>
                  <button
                    type="button"
                    onClick={clearZone}
                    className="font-heading flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-700 transition-colors hover:border-primary hover:text-primary sm:py-3 sm:text-xs"
                    style={{ fontWeight: 600 }}
                  >
                    <Trash2 className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                    Quitar zona
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
