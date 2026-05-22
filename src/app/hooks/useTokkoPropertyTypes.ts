import { useEffect, useMemo, useState } from "react";
import { mergePropertyTypeNames } from "../lib/propertyTypesCatalog";
import { fetchTokkoPropertyTypes } from "../lib/supabaseReference";
import { getSupabaseClient } from "../lib/supabaseClient";

/**
 * Tipos de inmueble del catálogo Tokko (`tokko_property_types`), más nombres
 * personalizados que existan en propiedades del sitio (`extraTypes`).
 */
export function useTokkoPropertyTypes(extraTypes: string[] = []) {
  const [types, setTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const extraKey = useMemo(
    () => mergePropertyTypeNames(extraTypes).join("\u0000"),
    [extraTypes]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const apply = (fromDb: string[]) => {
      if (cancelled) return;
      setTypes(mergePropertyTypeNames(fromDb, extraTypes));
      setLoading(false);
    };

    const client = getSupabaseClient();
    if (!client) {
      apply([]);
      return () => {
        cancelled = true;
      };
    }

    void fetchTokkoPropertyTypes(client).then(({ data, error }) => {
      if (cancelled) return;
      const fromDb =
        error || !data
          ? []
          : data
              .map((r) => r.name?.trim() ?? "")
              .filter((n) => n.length > 0);
      apply(fromDb);
    });

    return () => {
      cancelled = true;
    };
  }, [extraKey]);

  return { types, loading };
}
