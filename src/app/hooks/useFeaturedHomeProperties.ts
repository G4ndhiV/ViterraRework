import { useCallback, useEffect, useRef, useState } from "react";
import type { Property } from "../components/PropertyCard";
import { getSupabaseClient } from "../lib/supabaseClient";
import {
  fetchFeaturedPropertiesForHome,
  rowToProperty,
  type PropertyRow,
} from "../lib/supabaseProperties";
import { withTimeout } from "../lib/withTimeout";

const CACHE_KEY = "viterra_home_featured_v1";

/** Objetivo de UX en portada: primera respuesta útil en &lt;1s cuando la red/colabora. */
const FEATURED_FAST_MS = 950;
const FEATURED_RELAXED_MS = 18_000;

function readCache(): Property[] | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { items?: Property[] };
    if (!Array.isArray(parsed.items) || parsed.items.length === 0) return null;
    return parsed.items;
  } catch {
    return null;
  }
}

function writeCache(items: Property[]) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), items }));
  } catch {
    /* quota / modo privado */
  }
}

/**
 * Destacadas del home: solo filas `featured=true` (máx. 4), caché para mostrar al instante al volver,
 * sin descargar el catálogo entero.
 */
export function useFeaturedHomeProperties() {
  const initialCache = useRef(readCache());
  const genRef = useRef(0);

  const [properties, setProperties] = useState<Property[]>(() => initialCache.current ?? []);
  const [loading, setLoading] = useState(() => (initialCache.current?.length ?? 0) === 0);
  const [error, setError] = useState<string | null>(null);

  const applyRows = useCallback((rows: PropertyRow[]) => {
    const list = rows.map((row) => rowToProperty(row));
    setProperties(list);
    if (list.length > 0) writeCache(list);
    else {
      try {
        sessionStorage.removeItem(CACHE_KEY);
      } catch {
        /* noop */
      }
    }
    setError(null);
  }, []);

  const reload = useCallback(async () => {
    const gen = ++genRef.current;
    const client = getSupabaseClient();
    if (!client) {
      if (gen === genRef.current) {
        setError("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY.");
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    setError(null);

    let last: Awaited<ReturnType<typeof fetchFeaturedPropertiesForHome>> | null = null;
    const chain = [
      () => withTimeout(fetchFeaturedPropertiesForHome(client), FEATURED_FAST_MS, "featured"),
      () => withTimeout(fetchFeaturedPropertiesForHome(client), FEATURED_RELAXED_MS, "featured"),
      () => fetchFeaturedPropertiesForHome(client),
    ];

    for (const fn of chain) {
      if (gen !== genRef.current) return;
      try {
        last = await fn();
        if (!last.error) break;
      } catch {
        last = null;
      }
    }

    if (gen !== genRef.current) return;

    if (last && !last.error && Array.isArray(last.data)) {
      applyRows(last.data as PropertyRow[]);
      setLoading(false);
      return;
    }

    const cached = readCache();
    if (cached?.length) {
      setProperties(cached);
      setError(null);
    } else {
      setProperties([]);
      setError(last?.error?.message ?? "No se pudieron cargar las propiedades destacadas.");
    }
    setLoading(false);
  }, [applyRows]);

  useEffect(() => {
    const gen = ++genRef.current;
    const client = getSupabaseClient();
    if (!client) {
      setLoading(false);
      setError("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY.");
      return;
    }

    const hadCache = (initialCache.current?.length ?? 0) > 0;
    if (hadCache) setLoading(false);

    void (async () => {
      let last: Awaited<ReturnType<typeof fetchFeaturedPropertiesForHome>> | null = null;
      const attempts = [
        () => withTimeout(fetchFeaturedPropertiesForHome(client), FEATURED_FAST_MS, "featured"),
        () => withTimeout(fetchFeaturedPropertiesForHome(client), FEATURED_RELAXED_MS, "featured"),
        () => fetchFeaturedPropertiesForHome(client),
      ];

      for (const fn of attempts) {
        if (gen !== genRef.current) return;
        try {
          last = await fn();
          if (last && !last.error) {
            applyRows((last.data ?? []) as PropertyRow[]);
            if (gen !== genRef.current) return;
            setLoading(false);
            return;
          }
        } catch {
          last = null;
        }
      }

      if (gen !== genRef.current) return;

      const cached = readCache();
      if (cached?.length) {
        setProperties(cached);
        setError(null);
      } else {
        setProperties([]);
        setError(last?.error?.message ?? "No se pudieron cargar las propiedades destacadas.");
      }
      setLoading(false);
    })();

    return () => {
      genRef.current++;
    };
  }, [applyRows]);

  return { properties, loading, error, reload };
}
