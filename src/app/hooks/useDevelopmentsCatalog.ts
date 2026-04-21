import { useCallback, useEffect, useState } from "react";
import type { Development } from "../data/developments";
import { getSupabaseClient, syncSupabaseAuthSession } from "../lib/supabaseClient";
import { fetchDevelopmentsWithUnits, fetchDevelopmentById } from "../lib/supabaseDevelopments";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!id) {
      setDevelopment(null);
      setLoading(false);
      return;
    }
    const client = getSupabaseClient();
    if (!client) {
      setDevelopment(null);
      setError("Faltan variables VITE_SUPABASE_*.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    await syncSupabaseAuthSession(client);
    const { data, error: qErr } = await fetchDevelopmentById(client, id, { publicOnly: true });
    if (qErr) {
      setError(qErr.message);
      setDevelopment(null);
    } else {
      setDevelopment(data);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { development, loading, error, reload };
}
