import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import type { CircleMarker, Layer, Map as LeafletMap, Marker } from "leaflet";
import L from "leaflet";
import { cn } from "../components/ui/utils";
import { MapSearchHeaderBar } from "../components/MapSearchHeaderBar";
import { MapSearchListingCard } from "../components/map/MapSearchListingCard";
import type { Property } from "../components/PropertyCard";
import { useCatalogProperties } from "../hooks/useCatalogProperties";
import {
  pointInZone,
  zoneFromLeafletLayer,
  decimateLatLngs,
  type SearchZone,
} from "../../lib/geoSearch";
import { Bath, Bed, ChevronDown, MapPin, Maximize2, Minimize2, Square, X } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

type MapFilters = {
  type: string;
  status: string;
  minPrice: string;
  maxPrice: string;
};

const MIN_STROKE_POINTS = 12;
const MAX_POLYGON_VERTICES = 320;
/** A partir de este zoom se muestran las etiquetas de precio (antes solo puntos rojos). */
const ZOOM_SHOW_PRICES = 14;
/** Desplazamiento al norte del punto para colocar la etiqueta encima del pin (sin taparlo). */
const PRICE_LABEL_LAT_OFFSET = 0.00012;
/** Debe coincidir con `iconSize[1]` del `L.divIcon` del precio en `syncMarkers`. */
const PRICE_MARKER_ICON_HEIGHT_PX = 36;
/** Espacio entre el borde inferior de la tarjeta flotante y la parte superior de la píldora de precio. */
const MAP_CARD_GAP_ABOVE_PRICE_PX = 10;
/** Espacio entre la base de la píldora y el borde superior de la tarjeta cuando la tarjeta va debajo. */
const MAP_CARD_GAP_BELOW_PRICE_PX = 10;
/** Con zoom bajo (solo puntos), separación del borde inferior de la tarjeta respecto al centro del punto. */
const MAP_CARD_GAP_ABOVE_DOT_PX = 18;
/** Separación del borde superior de la tarjeta respecto al punto cuando la tarjeta va debajo del punto. */
const MAP_CARD_GAP_BELOW_DOT_PX = 14;
/** Altura aproximada de la tarjeta (imagen + texto + CTA) para decidir si voltea arriba/abajo. */
const MAP_CARD_ESTIMATED_HEIGHT_PX = 360;
/** Margen respecto al borde del contenedor del mapa (volteo arriba/abajo). */
const MAP_CARD_VIEWPORT_PADDING_PX = 16;

type MapPopupPlacement = "above" | "below";

/** Volteo arriba/abajo según espacio dentro del pane del mapa; el recorte visual lo hace `overflow-hidden`. */
function pickMapCardPlacement(
  mapHeight: number,
  spec: { mode: "price"; pillBottomY: number } | { mode: "dot"; dotCenterY: number }
): MapPopupPlacement {
  const pad = MAP_CARD_VIEWPORT_PADDING_PX;
  const h = MAP_CARD_ESTIMATED_HEIGHT_PX;

  if (spec.mode === "price") {
    const { pillBottomY } = spec;
    const pillTop = pillBottomY - PRICE_MARKER_ICON_HEIGHT_PX;
    const bottomEdgeIfAbove = pillTop - MAP_CARD_GAP_ABOVE_PRICE_PX;
    const topEdgeIfAbove = bottomEdgeIfAbove - h;
    const fitsAbove = topEdgeIfAbove >= pad;

    const topEdgeIfBelow = pillBottomY + MAP_CARD_GAP_BELOW_PRICE_PX;
    const bottomEdgeIfBelow = topEdgeIfBelow + h;
    const fitsBelow = bottomEdgeIfBelow <= mapHeight - pad;

    if (fitsAbove && fitsBelow) return "above";
    if (fitsAbove && !fitsBelow) return "above";
    if (!fitsAbove && fitsBelow) return "below";
    const slackAbove = Math.max(0, topEdgeIfAbove - pad);
    const slackBelow = Math.max(0, mapHeight - pad - bottomEdgeIfBelow);
    return slackAbove >= slackBelow ? "above" : "below";
  }

  const { dotCenterY } = spec;
  const r = 18;
  const dotTop = dotCenterY - r;
  const dotBottom = dotCenterY + r;
  const bottomEdgeIfAbove = dotTop - MAP_CARD_GAP_ABOVE_DOT_PX;
  const topEdgeIfAbove = bottomEdgeIfAbove - h;
  const fitsAbove = topEdgeIfAbove >= pad;

  const topEdgeIfBelow = dotBottom + MAP_CARD_GAP_BELOW_DOT_PX;
  const bottomEdgeIfBelow = topEdgeIfBelow + h;
  const fitsBelow = bottomEdgeIfBelow <= mapHeight - pad;

  if (fitsAbove && fitsBelow) return "above";
  if (fitsAbove && !fitsBelow) return "above";
  if (!fitsAbove && fitsBelow) return "below";
  const slackAbove = Math.max(0, topEdgeIfAbove - pad);
  const slackBelow = Math.max(0, mapHeight - pad - bottomEdgeIfBelow);
  return slackAbove >= slackBelow ? "above" : "below";
}

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

function applySelectionToCircles(circleMap: Map<string, CircleMarker>, selectedId: string | null) {
  circleMap.forEach((layer, id) => {
    const sel = id === selectedId;
    layer.setStyle({
      radius: sel ? 16 : 9,
      fillColor: sel ? "#9f1239" : "#C8102E",
      color: "#ffffff",
      weight: sel ? 4 : 2,
      fillOpacity: sel ? 1 : 0.9,
    });
    if (sel) {
      layer.bringToFront();
    }
  });
}

function applySelectionToPriceMarkers(markerMap: Map<string, Marker>, selectedId: string | null) {
  markerMap.forEach((marker, id) => {
    const sel = id === selectedId;
    const pill = marker.getElement()?.querySelector(".viterra-map-price-pill");
    if (pill) {
      pill.classList.toggle("viterra-map-price-pill--selected", sel);
    }
    marker.setZIndexOffset(sel ? 1000 : 0);
  });
}

function makePriceMarkerElement(price: number, status: Property["status"]): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "viterra-map-price-marker-wrap";
  const pill = document.createElement("div");
  pill.className = "viterra-map-price-pill";
  pill.textContent = status === "alquiler" ? `$${price.toLocaleString()} /mes` : `$${price.toLocaleString()}`;
  wrap.appendChild(pill);
  return wrap;
}

function statusFromSearchParams(searchParams: URLSearchParams): "" | "venta" | "alquiler" {
  const s = searchParams.get("status");
  return s === "venta" || s === "alquiler" ? s : "";
}

export function MapSearchPage() {
  const { properties: catalogProperties } = useCatalogProperties();
  const [searchParams] = useSearchParams();
  const mapEl = useRef<HTMLDivElement>(null);
  const mapShellRef = useRef<HTMLDivElement>(null);
  const filtersSectionRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const drawnRef = useRef<Layer | null>(null);
  const mapDotsGroupRef = useRef<L.LayerGroup | null>(null);
  const mapPricesGroupRef = useRef<L.LayerGroup | null>(null);
  const circleByPropertyIdRef = useRef<Map<string, CircleMarker>>(new Map());
  const priceMarkerByPropertyIdRef = useRef<Map<string, Marker>>(new Map());
  const [mapFs, setMapFs] = useState(false);
  /** Coords del contenedor Leaflet (px) + volteo; la tarjeta va dentro del mapa con `overflow-hidden` (estilo Airbnb). */
  const [mapPopupPos, setMapPopupPos] = useState<{
    x: number;
    y: number;
    placement: MapPopupPlacement;
  } | null>(null);
  const drawingModeRef = useRef(false);
  const cancelPartialStrokeRef = useRef<(() => void) | null>(null);

  const [zone, setZone] = useState<SearchZone | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  /** Propiedad cuya tarjeta está enfocada; el marcador correspondiente se resalta en el mapa. */
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const selectedPropertyIdRef = useRef<string | null>(null);
  selectedPropertyIdRef.current = selectedPropertyId;
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

  const results = useMemo(
    () => applyFilters(catalogProperties, filters, zone),
    [catalogProperties, filters, zone]
  );

  const selectedProperty = useMemo(
    () => (selectedPropertyId ? results.find((p) => p.id === selectedPropertyId) ?? null : null),
    [results, selectedPropertyId]
  );

  const syncMarkers = useCallback((list: Property[]) => {
    const dots = mapDotsGroupRef.current;
    const prices = mapPricesGroupRef.current;
    const map = mapRef.current;
    if (!dots || !prices || !map) return;
    dots.clearLayers();
    prices.clearLayers();
    circleByPropertyIdRef.current.clear();
    priceMarkerByPropertyIdRef.current.clear();

    list.forEach((p) => {
      if (!p.coordinates) return;
      const { lat, lng } = p.coordinates;

      const circle = L.circleMarker([lat, lng], {
        radius: 9,
        fillColor: "#C8102E",
        color: "#fff",
        weight: 2,
        fillOpacity: 0.9,
      });
      circleByPropertyIdRef.current.set(p.id, circle);
      circle.on("click", (e: L.LeafletMouseEvent) => {
        if (e.originalEvent) {
          L.DomEvent.stopPropagation(e.originalEvent);
        }
        setSelectedPropertyId(p.id);
      });
      dots.addLayer(circle);

      const el = makePriceMarkerElement(p.price, p.status);
      const icon = L.divIcon({
        html: el,
        className: "viterra-map-divicon-root",
        iconSize: [96, 36],
        iconAnchor: [48, 36],
      });
      const priceLatLng = L.latLng(lat + PRICE_LABEL_LAT_OFFSET, lng);
      const pm = L.marker(priceLatLng, { icon });
      priceMarkerByPropertyIdRef.current.set(p.id, pm);
      pm.on("click", (e: L.LeafletMouseEvent) => {
        if (e.originalEvent) {
          L.DomEvent.stopPropagation(e.originalEvent);
        }
        setSelectedPropertyId(p.id);
      });
      prices.addLayer(pm);
    });

    applySelectionToCircles(circleByPropertyIdRef.current, selectedPropertyIdRef.current);
    applySelectionToPriceMarkers(priceMarkerByPropertyIdRef.current, selectedPropertyIdRef.current);

    const z = map.getZoom();
    if (z >= ZOOM_SHOW_PRICES) {
      if (!map.hasLayer(prices)) prices.addTo(map);
      if (map.hasLayer(dots)) map.removeLayer(dots);
    } else {
      if (!map.hasLayer(dots)) dots.addTo(map);
      if (map.hasLayer(prices)) map.removeLayer(prices);
    }
  }, []);

  useEffect(() => {
    syncMarkers(results);
  }, [results, syncMarkers]);

  useEffect(() => {
    if (selectedPropertyId && !results.some((p) => p.id === selectedPropertyId)) {
      setSelectedPropertyId(null);
    }
  }, [results, selectedPropertyId]);

  useLayoutEffect(() => {
    applySelectionToCircles(circleByPropertyIdRef.current, selectedPropertyId);
    applySelectionToPriceMarkers(priceMarkerByPropertyIdRef.current, selectedPropertyId);
  }, [selectedPropertyId, results]);

  useEffect(() => {
    if (!selectedProperty?.coordinates) {
      setMapPopupPos(null);
      return;
    }
    const map = mapRef.current;
    if (!map) {
      setMapPopupPos(null);
      return;
    }
    const { lat, lng } = selectedProperty.coordinates;
    const update = () => {
      const m = mapRef.current;
      if (!m) return;
      const mapH = m.getSize().y;
      const z = m.getZoom();
      if (z >= ZOOM_SHOW_PRICES) {
        const pillBottom = m.latLngToContainerPoint(L.latLng(lat + PRICE_LABEL_LAT_OFFSET, lng));
        const pillTop = pillBottom.y - PRICE_MARKER_ICON_HEIGHT_PX;
        const pl = pickMapCardPlacement(mapH, { mode: "price", pillBottomY: pillBottom.y });
        const y =
          pl === "above"
            ? pillTop - MAP_CARD_GAP_ABOVE_PRICE_PX
            : pillBottom.y + MAP_CARD_GAP_BELOW_PRICE_PX;
        setMapPopupPos({
          x: pillBottom.x,
          y,
          placement: pl,
        });
      } else {
        const dot = m.latLngToContainerPoint(L.latLng(lat, lng));
        const pl = pickMapCardPlacement(mapH, { mode: "dot", dotCenterY: dot.y });
        const y =
          pl === "above"
            ? dot.y - MAP_CARD_GAP_ABOVE_DOT_PX
            : dot.y + MAP_CARD_GAP_BELOW_DOT_PX;
        setMapPopupPos({
          x: dot.x,
          y,
          placement: pl,
        });
      }
    };
    update();
    map.on("moveend zoomend move resize", update);
    window.addEventListener("resize", update);
    return () => {
      map.off("moveend zoomend move resize", update);
      window.removeEventListener("resize", update);
    };
  }, [selectedProperty, results]);

  useEffect(() => {
    const onFs = () => setMapFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

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

      const map = L.map(mapEl.current, { zoomControl: false }).setView([20.6736, -103.3445], 12);
      mapInstance = map;
      mapRef.current = map;

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO',
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);

      const dotsGroup = L.layerGroup().addTo(map);
      const pricesGroup = L.layerGroup();
      mapDotsGroupRef.current = dotsGroup;
      mapPricesGroupRef.current = pricesGroup;

      const onZoomEnd = () => {
        const z = map.getZoom();
        if (z >= ZOOM_SHOW_PRICES) {
          if (!map.hasLayer(pricesGroup)) pricesGroup.addTo(map);
          if (map.hasLayer(dotsGroup)) map.removeLayer(dotsGroup);
        } else {
          if (!map.hasLayer(dotsGroup)) dotsGroup.addTo(map);
          if (map.hasLayer(pricesGroup)) map.removeLayer(pricesGroup);
        }
      };
      map.on("zoomend", onZoomEnd);

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
      (map as unknown as { __viterraZoomCleanup?: () => void }).__viterraZoomCleanup = () => {
        map.off("zoomend", onZoomEnd);
      };
    };

    run();

    return () => {
      cancelled = true;
      const m = mapRef.current;
      if (m) {
        const cleanup = (m as unknown as { __viterraPointerCleanup?: () => void }).__viterraPointerCleanup;
        cleanup?.();
        (m as unknown as { __viterraZoomCleanup?: () => void }).__viterraZoomCleanup?.();
      }
      mapDotsGroupRef.current = null;
      mapPricesGroupRef.current = null;
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
            className="w-full rounded-none border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 shadow-inner focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/25"
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
            className="w-full rounded-none border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 shadow-inner focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/25"
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
            className="w-full rounded-none border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/25"
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
            className="w-full rounded-none border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/25"
            style={{ fontWeight: 500 }}
          />
        </div>
      </div>
    </>
  );

  return (
    <div className="viterra-page map-search-page flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-white text-slate-900">
      <div data-reveal className="flex min-h-0 flex-1 flex-col lg:flex-row lg:overflow-hidden">
        <aside className="flex min-h-0 w-full flex-col border-slate-200 bg-white lg:w-1/2 lg:max-w-[50vw] lg:border-r lg:border-slate-200">
          <div className="shrink-0 border-b-2 border-brand-navy/15 bg-gradient-to-b from-[#f4f2ef] to-white px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-heading text-[22px] font-semibold leading-tight tracking-tight text-brand-navy">
                  {results.length} {results.length === 1 ? "alojamiento" : "alojamientos"}
                </p>
                <p className="mt-0.5 text-[13px] font-medium text-brand-navy/65">
                  {zone ? "Solo en el área dibujada en el mapa" : "Guadalajara y zona metropolitana"}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Link
                  to="/renta"
                  className="hidden text-[13px] font-semibold text-primary underline-offset-2 hover:underline sm:inline"
                >
                  Ver lista
                </Link>
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
                  className={cn(
                    "font-heading inline-flex items-center justify-center rounded-none px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] shadow-lg transition-all sm:text-xs",
                    isDrawingMode
                      ? "border-2 border-primary bg-white text-primary shadow-none ring-2 ring-primary/25 hover:bg-red-50"
                      : "bg-primary text-white shadow-primary/35 hover:bg-brand-red-hover hover:shadow-xl"
                  )}
                >
                  {isDrawingMode ? "Cancelar" : "Dibujar zona"}
                </button>
                {zone && (
                  <button
                    type="button"
                    onClick={clearZone}
                    className="font-heading rounded-none border-2 border-brand-navy/25 bg-white px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-navy shadow-sm transition-colors hover:border-primary hover:text-primary sm:text-xs"
                  >
                    Quitar área
                  </button>
                )}
              </div>
            </div>
            {isDrawingMode && (
              <p className="mt-3 rounded-none border border-primary/30 bg-primary/10 px-3 py-2 text-[12px] font-medium text-brand-navy">
                Mantén pulsado y dibuja en el mapa · Esc para salir
              </p>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div
              ref={filtersSectionRef}
              id="map-search-filters"
              className="border-b border-brand-navy/10 bg-[#eceae6]/50 px-4 py-4 sm:px-5"
            >
              <details className="group overflow-hidden rounded-none border-2 border-brand-navy/25 bg-white shadow-[0_4px_20px_-4px_rgba(20,28,46,0.18)] open:shadow-[0_8px_28px_-6px_rgba(20,28,46,0.22)]">
                <summary className="flex cursor-pointer list-none items-center justify-between bg-brand-navy px-4 py-3.5 marker:content-none [&::-webkit-details-marker]:hidden sm:py-4">
                  <span className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-white">
                    Filtros
                  </span>
                  <ChevronDown
                    className="h-5 w-5 shrink-0 text-white/90 transition-transform duration-200 group-open:rotate-180"
                    strokeWidth={2}
                    aria-hidden
                  />
                </summary>
                <div className="border-t-2 border-primary/20 bg-white px-4 pb-4 pt-4">{filterFields}</div>
              </details>
            </div>

            <div className="grid grid-cols-1 gap-8 px-4 py-6 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-8 sm:px-5 lg:py-8">
              {results.map((property) => (
                <MapSearchListingCard
                  key={property.id}
                  property={property}
                  selected={selectedPropertyId === property.id}
                  onSelect={() => setSelectedPropertyId(property.id)}
                />
              ))}
            </div>

            {results.length === 0 && (
              <div className="px-4 pb-16 pt-4 text-center sm:px-5">
                <p className="text-[15px] font-semibold text-slate-900">Sin resultados</p>
                <p className="mt-1 text-[13px] text-slate-500">Prueba otros filtros o dibuja otra área en el mapa.</p>
              </div>
            )}
          </div>
        </aside>

        <div
          ref={mapShellRef}
          className="relative isolate flex min-h-[42vh] min-w-0 flex-1 flex-col border-t border-slate-200 bg-slate-100 lg:min-h-0 lg:w-1/2 lg:border-l lg:border-t-0"
        >
          <MapSearchHeaderBar />
          <div className="relative z-0 min-h-0 w-full flex-1 overflow-hidden lg:min-h-0">
            <div
              ref={mapEl}
              className="absolute inset-0 z-0 bg-slate-300 [&_.leaflet-container]:!filter-none [&_.leaflet-tile-pane]:!filter-none"
            />

            <button
              type="button"
              className="absolute right-3 top-3 z-[1002] flex h-9 w-9 items-center justify-center rounded-none border-2 border-slate-200 bg-white text-slate-800 shadow-md transition-colors hover:bg-slate-50"
              aria-label={mapFs ? "Salir de pantalla completa" : "Pantalla completa"}
              onClick={() => {
                const shell = mapShellRef.current;
                if (!shell) return;
                if (!document.fullscreenElement) {
                  void shell.requestFullscreen();
                } else {
                  void document.exitFullscreen();
                }
              }}
            >
              {mapFs ? (
                <Minimize2 className="h-4 w-4" strokeWidth={2} aria-hidden />
              ) : (
                <Maximize2 className="h-4 w-4" strokeWidth={2} aria-hidden />
              )}
            </button>

            {selectedProperty && mapPopupPos && (
              <div className="pointer-events-none absolute inset-0 z-[1001] overflow-hidden">
                <div
                  className="pointer-events-auto absolute w-[min(320px,calc(100vw-2rem))] max-w-[320px] overflow-hidden border-2 border-slate-300 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.22)]"
                  style={{
                    left: mapPopupPos.x,
                    top: mapPopupPos.y,
                    transform:
                      mapPopupPos.placement === "above" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
                  }}
                >
                  <div className="relative h-[120px] shrink-0 overflow-hidden sm:h-[128px]">
                    <ImageWithFallback
                      src={selectedProperty.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                    <button
                      type="button"
                      aria-label="Cerrar vista de propiedad"
                      onClick={() => setSelectedPropertyId(null)}
                      className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center border border-white/40 bg-black/50 text-white transition-colors hover:bg-black/70"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    </button>
                    <div className="absolute bottom-2 left-2 flex max-w-[calc(100%-2.5rem)] flex-wrap gap-1">
                      <span className="bg-primary px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-white">
                        {selectedProperty.status === "venta" ? "En venta" : "En alquiler"}
                      </span>
                      <span className="border border-white/60 bg-white px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-brand-navy">
                        {selectedProperty.type}
                      </span>
                    </div>
                  </div>

                  <div className="border-t-4 border-primary bg-white px-3 pb-3 pt-3 sm:px-3.5 sm:pb-3.5 sm:pt-3.5">
                    <h3 className="font-heading line-clamp-2 text-[0.9rem] font-semibold leading-snug text-brand-navy">
                      {selectedProperty.title}
                    </h3>
                    <div className="mt-1 flex items-start gap-1 text-[10px] leading-snug text-slate-600 sm:text-[11px]">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary" strokeWidth={1.5} />
                      <span className="line-clamp-2">{selectedProperty.location}</span>
                    </div>

                    <div className="mt-2.5 flex border border-slate-300 bg-slate-50/90 text-[9px] text-slate-800 sm:text-[10px]">
                      <div className="flex flex-1 flex-col items-center gap-0.5 border-r border-slate-300 py-2">
                        <Bed className="h-3 w-3 text-brand-navy" strokeWidth={1.5} />
                        <span className="font-medium tabular-nums">{selectedProperty.bedrooms} rec.</span>
                      </div>
                      <div className="flex flex-1 flex-col items-center gap-0.5 border-r border-slate-300 py-2">
                        <Bath className="h-3 w-3 text-brand-navy" strokeWidth={1.5} />
                        <span className="font-medium tabular-nums">{selectedProperty.bathrooms} baños</span>
                      </div>
                      <div className="flex flex-1 flex-col items-center gap-0.5 py-2">
                        <Square className="h-3 w-3 text-brand-navy" strokeWidth={1.5} />
                        <span className="font-medium tabular-nums">{selectedProperty.area} m²</span>
                      </div>
                    </div>

                    <div className="mt-2.5 border border-slate-200 px-2.5 py-2">
                      <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-500">Precio</p>
                      <p className="font-heading mt-0.5 text-base font-semibold tabular-nums text-brand-navy sm:text-lg">
                        ${selectedProperty.price.toLocaleString()}
                        {selectedProperty.status === "alquiler" && (
                          <span className="ml-1 text-[10px] font-medium not-italic text-slate-600">/ mes</span>
                        )}
                      </p>
                    </div>

                    <Link
                      to={`/propiedades/${selectedProperty.id}`}
                      className="font-heading mt-2.5 flex w-full items-center justify-center border-2 border-primary bg-primary py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-brand-red-hover"
                    >
                      Ver ficha
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {isDrawingMode && (
              <div className="pointer-events-none absolute inset-x-0 top-4 z-[1000] flex justify-center px-4">
                <div className="max-w-md rounded-none border border-white/15 bg-slate-900 px-5 py-2.5 text-center text-[13px] font-medium text-white shadow-lg">
                  Dibuja el contorno en el mapa y suelta para aplicar
                </div>
              </div>
            )}

            {zone && !isDrawingMode && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1000] flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
                <div className="pointer-events-auto flex w-full max-w-md flex-col gap-2 rounded-none border-2 border-slate-200 bg-white p-2 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] sm:flex-row sm:p-2">
                  <button
                    type="button"
                    onClick={redrawZone}
                    className="font-heading flex flex-1 items-center justify-center rounded-none bg-primary px-4 py-2.5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-brand-red-hover"
                  >
                    Redibujar zona
                  </button>
                  <button
                    type="button"
                    onClick={clearZone}
                    className="font-heading flex flex-1 items-center justify-center rounded-none border-2 border-slate-200 bg-white px-4 py-2.5 text-[12px] font-semibold text-slate-800 transition-colors hover:border-slate-300"
                  >
                    Quitar zona
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
