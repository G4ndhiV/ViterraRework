import { useCallback, useEffect, useState } from "react";
import type { Property } from "../components/PropertyCard";
import { getSupabaseClient, syncSupabaseAuthSession } from "../lib/supabaseClient";
import { logTableCountHints } from "../lib/supabaseDiagnostics";
import { fetchCatalogProperties, rowToProperty, type PropertyRow } from "../lib/supabaseProperties";

export function useCatalogProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) {
      setProperties([]);
      setError("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    await syncSupabaseAuthSession(client);
    const { data, error: qErr } = await fetchCatalogProperties(client);
    if (qErr) {
      setError(qErr.message);
      setProperties([]);
    } else {
      const rows = data ?? [];
      setProperties(rows.map((row) => rowToProperty(row as PropertyRow)));
      if (import.meta.env.DEV && rows.length === 0) {
        void logTableCountHints(client, "properties");
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { properties, loading, error, reload };
}
