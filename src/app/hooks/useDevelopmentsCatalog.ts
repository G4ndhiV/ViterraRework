import { useCallback, useEffect, useRef, useState } from "react";
import type { Development } from "../data/developments";
import type { Property } from "../components/PropertyCard";
import { getSupabaseClient, syncSupabaseAuthSession } from "../lib/supabaseClient";
import {
  fetchDevelopmentsWithUnits,
  fetchDevelopmentsPage,
  fetchDevelopmentById,
} from "../lib/supabaseDevelopments";
import { fetchPropertiesByDevelopmentTokkoId } from "../lib/supabaseProperties";

/** Tamaño de página al listar desarrollos en el sitio público (scroll infinito). */
export const DEVELOPMENTS_CATALOG_PAGE_SIZE = 8;

export function useDevelopmentsCatalog(publicOnly = false) {
  const [developments, setDevelopments] = useState<Development[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) {
      setDevelopments([]);
      setError("Faltan variables VITE_SUPABASE_*.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    await syncSupabaseAuthSession(client);
    const { data, error: qErr } = await fetchDevelopmentsWithUnits(client, { publicOnly });
    if (qErr) {
      setError(qErr.message);
      setDevelopments([]);
    } else {
      setDevelopments(data ?? []);
    }
    setLoading(false);
  }, [publicOnly]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { developments, loading, error, reload };
}

/**
 * Catálogo público con páginas: primera carga rápida, el resto al acercarse al final del scroll.
 */
export function useDevelopmentsCatalogInfinite(publicOnly = false, pageSize = DEVELOPMENTS_CATALOG_PAGE_SIZE) {
  const [developments, setDevelopments] = useState<Development[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const linkedRef = useRef<Map<string, number> | undefined>(undefined);
  const loadingMoreRef = useRef(false);

  const loadPage = useCallback(
    async (offset: number, append: boolean) => {
      const client = getSupabaseClient();
      if (!client) {
        setError("Faltan variables VITE_SUPABASE_*.");
        setInitialLoading(false);
        setHasMore(false);
        return;
      }
      await syncSupabaseAuthSession(client);
      const { data, error: qErr, linkedByTokko } = await fetchDevelopmentsPage(client, {
        publicOnly,
        limit: pageSize,
        offset,
        linkedByTokko: linkedRef.current,
      });
      if (linkedByTokko) {
        linkedRef.current = linkedByTokko;
      }
      if (qErr) {
        if (append) {
          setLoadMoreError(qErr.message);
        } else {
          setError(qErr.message);
          setDevelopments([]);
          setHasMore(false);
        }
        return;
      }
      setLoadMoreError(null);
      if (append) {
        setDevelopments((prev) => {
          const seen = new Set(prev.map((d) => d.id));
          const next = [...prev];
          for (const d of data ?? []) {
            if (!seen.has(d.id)) {
              seen.add(d.id);
              next.push(d);
            }
          }
          return next;
        });
      } else {
        setDevelopments(data ?? []);
      }
      const batch = data ?? [];
      if (batch.length < pageSize) {
        setHasMore(false);
      }
    },
    [publicOnly, pageSize]
  );

  useEffect(() => {
    linkedRef.current = undefined;
    setDevelopments([]);
    setError(null);
    setLoadMoreError(null);
    setHasMore(true);
    setInitialLoading(true);
    void (async () => {
      try {
        await loadPage(0, false);
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMoreRef.current || initialLoading) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const offset = developments.length;
      await loadPage(offset, true);
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [developments.length, hasMore, initialLoading, loadPage]);

  return {
    developments,
    initialLoading,
    loadingMore,
    error,
    loadMoreError,
    hasMore,
    loadMore,
    reload: async () => {
      linkedRef.current = undefined;
      setDevelopments([]);
      setHasMore(true);
      setError(null);
      setLoadMoreError(null);
      setInitialLoading(true);
      try {
        await loadPage(0, false);
      } finally {
        setInitialLoading(false);
      }
    },
  };
}

export function useDevelopmentDetail(id: string | undefined) {
  const [development, setDevelopment] = useState<Development | null>(null);
  const [linkedProperties, setLinkedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!id) {
      setDevelopment(null);
      setLinkedProperties([]);
      setLoading(false);
      return;
    }
    const client = getSupabaseClient();
    if (!client) {
      setDevelopment(null);
      setLinkedProperties([]);
      setError("Faltan variables VITE_SUPABASE_*.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setLinkedProperties([]);
    await syncSupabaseAuthSession(client);
    const { data, error: qErr } = await fetchDevelopmentById(client, id, { publicOnly: true });
    if (qErr) {
      setError(qErr.message);
      setDevelopment(null);
      setLinkedProperties([]);
      setLoading(false);
      return;
    }
    setDevelopment(data);
    if (data?.tokkoId) {
      const { data: props, error: pErr } = await fetchPropertiesByDevelopmentTokkoId(client, data.tokkoId);
      if (pErr) {
        setLinkedProperties([]);
      } else {
        setLinkedProperties(props ?? []);
      }
    } else {
      setLinkedProperties([]);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { development, linkedProperties, loading, error, reload };
}
