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

type TokkoUserAccessPayload = {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
};

/** Persiste rol/permisos en `tokko_users` (id primario; fallback por email). */
export async function upsertTokkoUserAccess(client: SupabaseClient, payload: TokkoUserAccessPayload) {
  const normalizedEmail = payload.email.trim().toLowerCase();
  const normalizedPermissions = Array.from(new Set(payload.permissions.map((p) => p.trim()).filter(Boolean)));
  const updateShape = {
    role: payload.role,
    permissions: normalizedPermissions,
    updated_at: new Date().toISOString(),
  };

  const byId = await client.from("tokko_users").update(updateShape).eq("id", payload.userId).select("id").maybeSingle();
  if (!byId.error && byId.data) return byId;

  const byEmail = await client
    .from("tokko_users")
    .update(updateShape)
    .ilike("email", normalizedEmail)
    .select("id")
    .maybeSingle();
  if (!byEmail.error && byEmail.data) return byEmail;

  return {
    data: null,
    error: {
      message:
        "No se pudo actualizar tokko_users por id/email. Revisa políticas RLS para UPDATE en esa tabla.",
    },
  };
}
