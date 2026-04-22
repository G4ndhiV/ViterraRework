import { useCallback, useEffect, useState } from "react";
import type { Development } from "../data/developments";
import type { Property } from "../components/PropertyCard";
import { getSupabaseClient, syncSupabaseAuthSession } from "../lib/supabaseClient";
import { fetchDevelopmentsWithUnits, fetchDevelopmentById } from "../lib/supabaseDevelopments";
import { fetchPropertiesByDevelopmentTokkoId } from "../lib/supabaseProperties";

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
