import { useCallback, useEffect, useRef, useState } from "react";
import type { Property } from "../components/PropertyCard";
import { getSupabaseClient, syncSupabaseAuthSession } from "../lib/supabaseClient";
import { logTableCountHints } from "../lib/supabaseDiagnostics";
import { fetchCatalogProperties, rowToProperty, type PropertyRow } from "../lib/supabaseProperties";
import { withTimeout } from "../lib/withTimeout";

const CATALOG_FETCH_ATTEMPTS = 3;
/** Refresco de sesión en segundo plano (no bloquea el catálogo público). Si colgara, se corta solo. */
const SYNC_SESSION_TIMEOUT_MS = 8_000;
/** Por intento; si la red cuelga, no dejar "Cargando…" indefinidamente. */
const FETCH_PROPERTIES_TIMEOUT_MS = 25_000;

export function useCatalogProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchGenerationRef = useRef(0);

  const reload = useCallback(async () => {
    const gen = ++fetchGenerationRef.current;
    const client = getSupabaseClient();
    if (!client) {
      if (gen !== fetchGenerationRef.current) return;
      setProperties([]);
      setError("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      void withTimeout(syncSupabaseAuthSession(client), SYNC_SESSION_TIMEOUT_MS, "Sesión").catch(() => {});

      if (gen !== fetchGenerationRef.current) return;

      let lastErr: { message: string } | null = null;
      let rows: PropertyRow[] | undefined;

      for (let attempt = 0; attempt < CATALOG_FETCH_ATTEMPTS; attempt++) {
        try {
          const { data, error: qErr } = await withTimeout(
            fetchCatalogProperties(client),
            FETCH_PROPERTIES_TIMEOUT_MS,
            "Catálogo"
          );
          if (gen !== fetchGenerationRef.current) return;
          if (!qErr) {
            rows = (data ?? []) as PropertyRow[];
            lastErr = null;
            break;
          }
          lastErr = qErr;
        } catch (e) {
          lastErr = { message: e instanceof Error ? e.message : String(e) };
        }
        if (lastErr && attempt < CATALOG_FETCH_ATTEMPTS - 1) {
          await new Promise((r) => setTimeout(r, 320 * (attempt + 1)));
          if (gen !== fetchGenerationRef.current) return;
        }
      }

      if (gen !== fetchGenerationRef.current) return;

      if (lastErr) {
        setError(lastErr.message);
        setProperties([]);
      } else {
        const list = rows ?? [];
        setProperties(list.map((row) => rowToProperty(row)));
        if (import.meta.env.DEV && list.length === 0) {
          void logTableCountHints(client, "properties");
        }
      }
    } finally {
      if (gen === fetchGenerationRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { properties, loading, error, reload };
}
