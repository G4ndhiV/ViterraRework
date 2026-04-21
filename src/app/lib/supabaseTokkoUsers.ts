import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Perfil sincronizado Tokko. `id` debe coincidir con `auth.users.id` si el sync enlaza filas 1:1.
 * Si no hay fila, se usa solo `user_metadata` en AuthContext.
 */
export async function fetchTokkoUserRow(client: SupabaseClient, userId: string) {
  const byId = await client.from("tokko_users").select("*").eq("id", userId).maybeSingle();
  if (!byId.error && byId.data) return byId;

  const session = (await client.auth.getUser()).data.user;
  const email = session?.email?.trim().toLowerCase();
  if (!email) return byId;

  return client.from("tokko_users").select("*").ilike("email", email).maybeSingle();
}

/** Listado para el módulo Equipo y accesos (respeta RLS del proyecto). */
export function fetchAllTokkoUsersForDirectory(client: SupabaseClient) {
  return client.from("tokko_users").select("*").order("email", { ascending: true, nullsFirst: false });
}
