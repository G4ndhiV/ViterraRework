/**
 * Crea cuentas en Supabase Auth para filas de `tokko_users` (mismo UUID que `id` en la tabla).
 *
 * Secrets (Dashboard → Edge Functions):
 * - SYNC_HTTP_SECRET              — mismo que tokko-sync: header `x-sync-secret` o Bearer
 * - SUPABASE_SERVICE_ROLE_KEY   — inyectado por Supabase en funciones
 * - SUPABASE_URL
 *
 * Obligatorio para ejecución real (dryRun: false):
 * - TOKKO_DEFAULT_AUTH_PASSWORD  — contraseña inicial común (los usuarios deben cambiarla al entrar)
 *
 * POST JSON:
 *   { "dryRun": true }   — solo cuenta candidatos, no crea usuarios
 *   { "dryRun": false }  — crea usuarios y marca must_change_password en tokko_users
 *
 * Invoke:
 *   curl -sS -X POST "$SUPABASE_URL/functions/v1/tokko-provision-auth-users" \
 *     -H "apikey: $SUPABASE_ANON_KEY" \
 *     -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
 *     -H "x-sync-secret: $SYNC_HTTP_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{"dryRun":true}'
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type SupabaseAdmin = ReturnType<typeof createClient>;

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sync-secret",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getEnv(name: string): string | undefined {
  const v = Deno.env.get(name);
  return v && v.length > 0 ? v : undefined;
}

function requireEnv(name: string): string {
  const v = getEnv(name);
  if (!v) throw new Error(`Missing required secret: ${name}`);
  return v;
}

function assertSecret(req: Request): void {
  const expected = requireEnv("SYNC_HTTP_SECRET");
  const fromHeader = (req.headers.get("x-sync-secret") ?? "").trim();
  const bearer = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (fromHeader === expected || bearer === expected) return;
  throw new Error("Unauthorized");
}

type TokkoUserRow = {
  id: string;
  tokko_user_id: string;
  name: string;
  email: string | null;
  deleted_at: string | null;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    assertSecret(req);

    const body = (await req.json().catch(() => ({}))) as { dryRun?: boolean };
    const dryRun = Boolean(body.dryRun);

    const defaultPassword = getEnv("TOKKO_DEFAULT_AUTH_PASSWORD");
    if (!dryRun && !defaultPassword) {
      return jsonResponse(
        { ok: false, error: "TOKKO_DEFAULT_AUTH_PASSWORD is required when dryRun is false" },
        400
      );
    }

    const supabaseUrl = requireEnv("SUPABASE_URL");
    const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabase: SupabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: rows, error: listError } = await supabase
      .from("tokko_users")
      .select("id, tokko_user_id, name, email, deleted_at")
      .not("email", "is", null);

    if (listError) {
      return jsonResponse({ ok: false, error: listError.message }, 500);
    }

    const candidates = (rows ?? []).filter((r) => {
      const email = (r.email ?? "").trim();
      if (!email) return false;
      const del = r.deleted_at;
      if (del != null && String(del).trim() !== "") return false;
      return true;
    }) as TokkoUserRow[];

    if (dryRun) {
      return jsonResponse({
        ok: true,
        dryRun: true,
        candidateCount: candidates.length,
      });
    }

    const created: string[] = [];
    const skipped: string[] = [];
    const errors: { email: string; message: string }[] = [];

    for (const row of candidates) {
      const email = row.email!.trim();
      const displayName = (row.name ?? "").trim() || email.split("@")[0] || "Usuario";

      const { error: createError } = await supabase.auth.admin.createUser({
        id: row.id,
        email,
        password: defaultPassword!,
        email_confirm: true,
        user_metadata: {
          full_name: displayName,
          name: displayName,
          tokko_user_id: row.tokko_user_id,
        },
      });

      if (createError) {
        const msg = createError.message;
        if (/already|registered|exists|duplicate/i.test(msg)) {
          skipped.push(email);
          continue;
        }
        errors.push({ email, message: msg });
        continue;
      }

      const { error: updError } = await supabase
        .from("tokko_users")
        .update({ must_change_password: true, updated_at: new Date().toISOString() })
        .eq("id", row.id);

      if (updError) {
        errors.push({ email, message: `auth ok pero DB: ${updError.message}` });
        continue;
      }

      created.push(email);
    }

    return jsonResponse({
      ok: true,
      dryRun: false,
      candidateCount: candidates.length,
      createdCount: created.length,
      skippedExistingCount: skipped.length,
      errorCount: errors.length,
      created,
      skippedExistingEmails: skipped,
      errors,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = msg === "Unauthorized" ? 401 : 500;
    return jsonResponse({ ok: false, error: msg }, status);
  }
});
