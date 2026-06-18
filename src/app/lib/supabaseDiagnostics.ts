import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * En desarrollo: compara filas totales vs `deleted_at IS NULL`.
 * Si `filasTotales` > 0 y `filasConDeletedAtNull` === 0, el sync (p. ej. Tokko) no deja NULL en `deleted_at`
 * y filtrar por NULL vacía el listado; las lecturas del CRM ya no dependen solo de ese filtro.
 */
export async function logTableCountHints(
  client: SupabaseClient,
  kind: "properties" | "leads" | "developments"
): Promise<void> {
  if (!import.meta.env.DEV) return;

  const total = await client.from(kind).select("id", { count: "exact", head: true });
  const notDeleted = await client
    .from(kind)
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);

  console.info(`[Viterra debug] tabla "${kind}"`, {
    filasTotales: total.count,
    filasConDeletedAtNull: notDeleted.count,
    errorTotal: total.error?.message,
    errorFiltro: notDeleted.error?.message,
  });
}
