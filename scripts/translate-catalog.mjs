#!/usr/bin/env node
/**
 * Traducción automática ES→EN del catálogo y del contenido del CMS.
 *
 * Corre en Node (local o CI), nunca en el navegador: la ANTHROPIC_API_KEY no
 * lleva prefijo VITE_, así que Vite no la incluye en el bundle.
 *
 * Diseño:
 * - Solo traduce lo que cambió. Guarda un SHA-256 del texto original por campo;
 *   si el hash coincide con el almacenado, se salta (costo cero).
 * - Nunca pisa una corrección manual (`origin = 'manual'`).
 * - Usa el Batch API: la traducción no es sensible a latencia y sale a mitad de
 *   precio. Con --sync fuerza peticiones normales (útil para probar pocas).
 *
 * Uso:
 *   node scripts/translate-catalog.mjs --dry-run        # qué traduciría y cuánto cuesta
 *   node scripts/translate-catalog.mjs --limit 3 --sync # prueba pequeña, inmediata
 *   node scripts/translate-catalog.mjs                  # todo lo pendiente, vía batch
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

/* ─── Configuración ──────────────────────────────────────────────────────── */

const MODEL = "claude-opus-5";
const TARGET_LOCALE = "en";
const DEFAULT_SOURCE_LOCALE = "es";

/** Campos de texto libre que se traducen, por entidad. */
const FIELDS = {
  property: ["title", "publication_title", "description", "rich_description"],
  development: ["name", "description", "rich_description"],
};

/** Precio por millón de tokens (Batch API = mitad). Solo para estimar. */
const PRICE = { input: 5.0, output: 25.0 };

/* ─── Entorno ────────────────────────────────────────────────────────────── */

function loadEnv() {
  try {
    for (const line of readFileSync(".env", "utf8").split("\n")) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* sin .env: se usan las variables del entorno */
  }
}

function required(name) {
  const v = process.env[name]?.trim();
  if (!v) {
    console.error(`Falta ${name}. Defínela en .env o en el entorno.`);
    process.exit(1);
  }
  return v;
}

/* ─── Utilidades ─────────────────────────────────────────────────────────── */

const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("hex");

/** Un campo es traducible si tiene texto real, no una URL ni un número. */
function isTranslatable(value) {
  const t = String(value ?? "").trim();
  if (t.length < 2) return false;
  if (/^https?:\/\//i.test(t)) return false;
  return /[a-záéíóúñ]{3}/i.test(t);
}

/* ─── Prompt ─────────────────────────────────────────────────────────────── */

/**
 * Las instrucciones van en el system prompt para que el prompt caching las
 * cobre a una décima parte a partir de la segunda petición.
 */
const SYSTEM_PROMPT = `Eres un traductor profesional español→inglés especializado en bienes raíces de lujo en México.

Traduces fichas de propiedades y desarrollos para el sitio de Viterra Inmobiliaria, dirigido a compradores e inversionistas de habla inglesa.

REGLAS ABSOLUTAS:
1. NUNCA traduzcas nombres propios: "Viterra", nombres de fraccionamientos y desarrollos ("Bosques de Santa Anita", "Espacio Chapalita"), colonias, calles ni ciudades. Van tal cual.
2. Conserva intacto cualquier marcador entre llaves como {year} o {url}.
3. Si el texto trae HTML, conserva exactamente las mismas etiquetas y atributos; traduce solo el contenido de texto.
4. Si el texto empieza con un prefijo de icono tipo "#pool:", consérvalo sin cambios y traduce solo lo que sigue.
5. Conserva números, medidas y monedas tal cual. "120 m²" sigue siendo "120 m²". No conviertas pesos a dólares ni metros a pies.
6. Conserva los saltos de línea y la estructura de párrafos del original.

ESTILO:
- Inglés natural de bienes raíces, no traducción literal.
- Registro profesional y aspiracional, sin exageraciones que el original no tenga.
- Usa terminología inmobiliaria estadounidense: "master bedroom", "half bath", "lot", "gated community".

Devuelves únicamente el objeto JSON pedido, sin texto adicional.`;

function buildUserPrompt(fields) {
  const payload = Object.entries(fields)
    .map(([k, v]) => `<campo nombre="${k}">\n${v}\n</campo>`)
    .join("\n\n");
  return `Traduce al inglés el contenido de cada campo.\n\n${payload}`;
}

function buildSchema(fieldNames) {
  return {
    type: "json_schema",
    schema: {
      type: "object",
      properties: Object.fromEntries(
        fieldNames.map((f) => [f, { type: "string", description: `Traducción del campo ${f}` }]),
      ),
      required: fieldNames,
      additionalProperties: false,
    },
  };
}

/* ─── Recolección de trabajo pendiente ───────────────────────────────────── */

async function collectPending(supabase, { limit }) {
  const { data: existing, error: exErr } = await supabase
    .from("catalog_translations")
    .select("entity,entity_id,field,source_hash,origin")
    .eq("locale", TARGET_LOCALE);
  if (exErr) throw new Error(`Leyendo traducciones: ${exErr.message}`);

  const known = new Map();
  for (const r of existing ?? []) {
    known.set(`${r.entity}|${r.entity_id}|${r.field}`, r);
  }

  const jobs = [];
  let skippedFresh = 0;
  let skippedManual = 0;

  for (const [entity, fields] of Object.entries(FIELDS)) {
    const table = entity === "property" ? "properties" : "developments";
    const { data: rows, error } = await supabase
      .from(table)
      .select(["id", ...fields].join(","));
    if (error) throw new Error(`Leyendo ${table}: ${error.message}`);

    for (const row of rows ?? []) {
      const pending = {};
      for (const field of fields) {
        const source = String(row[field] ?? "");
        if (!isTranslatable(source)) continue;

        const prev = known.get(`${entity}|${row.id}|${field}`);
        if (prev?.origin === "manual") {
          skippedManual++;
          continue;
        }
        if (prev?.source_hash === sha256(source)) {
          skippedFresh++;
          continue;
        }
        pending[field] = source;
      }
      if (Object.keys(pending).length > 0) {
        jobs.push({ entity, entityId: row.id, fields: pending });
      }
    }
  }

  jobs.sort((a, b) => String(a.entityId).localeCompare(String(b.entityId)));
  return {
    jobs: typeof limit === "number" ? jobs.slice(0, limit) : jobs,
    skippedFresh,
    skippedManual,
  };
}

/* ─── Contenido del CMS (site_content_sections) ──────────────────────────── */

/**
 * Claves cuyo valor nunca se traduce aunque sea texto: identificadores, rutas,
 * iconos y slugs que el código compara literalmente.
 */
const CMS_SKIP_KEYS = new Set([
  "href",
  "url",
  "src",
  "slug",
  "icon",
  "iconKey",
  "platform",
  "id",
  "primaryListingHref",
  "heroImage",
  "searchImage",
  "image",
  "backgroundImage",
  "videoUrl",
]);

/**
 * Recorre el payload y devuelve las cadenas traducibles indexadas por su ruta
 * (`hero.title`, `cards.0.description`). Trabajar con rutas planas permite
 * pedirle al modelo un objeto JSON simple y luego reconstruir la estructura.
 */
function collectCmsStrings(node, path = "", out = {}) {
  if (typeof node === "string") {
    if (isTranslatable(node)) out[path] = node;
    return out;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => collectCmsStrings(v, path ? `${path}.${i}` : String(i), out));
    return out;
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (CMS_SKIP_KEYS.has(k)) continue;
      collectCmsStrings(v, path ? `${path}.${k}` : k, out);
    }
  }
  return out;
}

/** Aplica las traducciones sobre una copia del payload, respetando la forma. */
function applyCmsStrings(payload, translations) {
  const next = structuredClone(payload);
  for (const [path, text] of Object.entries(translations)) {
    const parts = path.split(".");
    let cur = next;
    for (let i = 0; i < parts.length - 1; i++) {
      cur = cur?.[parts[i]];
      if (cur == null) break;
    }
    const last = parts[parts.length - 1];
    if (cur != null && typeof cur === "object" && last in cur) cur[last] = text;
  }
  return next;
}

async function collectCmsPending(supabase) {
  const { data, error } = await supabase
    .from("site_content_sections")
    .select("page,locale,payload,source_hash,manual_override");
  if (error) throw new Error(`Leyendo site_content_sections: ${error.message}`);

  const es = new Map();
  const target = new Map();
  for (const row of data ?? []) {
    if (row.locale === DEFAULT_SOURCE_LOCALE) es.set(row.page, row);
    else if (row.locale === TARGET_LOCALE) target.set(row.page, row);
  }

  const jobs = [];
  let skippedFresh = 0;
  let skippedManual = 0;

  for (const [page, esRow] of es) {
    const strings = collectCmsStrings(esRow.payload ?? {});
    if (Object.keys(strings).length === 0) continue;

    const hash = sha256(JSON.stringify(esRow.payload ?? {}));
    const existing = target.get(page);
    if (existing?.manual_override) {
      skippedManual++;
      continue;
    }
    if (existing?.source_hash === hash) {
      skippedFresh++;
      continue;
    }
    jobs.push({ page, payload: esRow.payload ?? {}, strings, hash });
  }
  return { jobs, skippedFresh, skippedManual };
}

function cmsRequestFor(job) {
  const paths = Object.keys(job.strings);
  const listado = paths.map((p) => `<campo nombre="${p}">\n${job.strings[p]}\n</campo>`).join("\n\n");
  return {
    model: MODEL,
    max_tokens: 16000,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: Object.fromEntries(paths.map((p) => [p, { type: "string" }])),
          required: paths,
          additionalProperties: false,
        },
      },
    },
    messages: [
      {
        role: "user",
        content: `Traduce al inglés el contenido de cada campo. Son textos de la interfaz del sitio (títulos, subtítulos, etiquetas de botones): mantén la brevedad del original, no lo alargues.\n\n${listado}`,
      },
    ],
  };
}

async function runCms(anthropic, supabase, jobs) {
  let saved = 0;
  for (const [i, job] of jobs.entries()) {
    process.stdout.write(`  [${i + 1}/${jobs.length}] página "${job.page}" … `);
    const message = await anthropic.messages.create(cmsRequestFor(job));
    const translated = parseTranslated(message);
    if (!translated) {
      console.log("sin JSON válido, se omite");
      continue;
    }
    const payload = applyCmsStrings(job.payload, translated);
    const { error } = await supabase.from("site_content_sections").upsert(
      {
        page: job.page,
        locale: TARGET_LOCALE,
        payload,
        source_hash: job.hash,
        manual_override: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "page,locale" },
    );
    if (error) {
      console.log(`error al guardar: ${error.message}`);
      continue;
    }
    saved++;
    console.log(`ok (${Object.keys(translated).length} cadenas)`);
  }
  return saved;
}

/* ─── Estimación ─────────────────────────────────────────────────────────── */

function estimate(jobs, { batch }) {
  const words = jobs.reduce(
    (acc, j) => acc + Object.values(j.fields).join(" ").split(/\s+/).filter(Boolean).length,
    0,
  );
  const tin = words * 1.45;
  const tout = words * 1.3;
  const f = batch ? 0.5 : 1;
  return {
    words,
    usd: ((tin / 1e6) * PRICE.input + (tout / 1e6) * PRICE.output) * f,
  };
}

/* ─── Persistencia ───────────────────────────────────────────────────────── */

async function saveTranslations(supabase, job, translated) {
  const rows = Object.entries(translated)
    .filter(([field]) => job.fields[field] !== undefined)
    .map(([field, text]) => ({
      entity: job.entity,
      entity_id: job.entityId,
      field,
      locale: TARGET_LOCALE,
      translated: text,
      source_hash: sha256(job.fields[field]),
      origin: "machine",
    }));
  if (rows.length === 0) return 0;
  const { error } = await supabase
    .from("catalog_translations")
    .upsert(rows, { onConflict: "entity,entity_id,field,locale" });
  if (error) throw new Error(`Guardando traducción: ${error.message}`);
  return rows.length;
}

/* ─── Ejecución ──────────────────────────────────────────────────────────── */

function requestFor(job) {
  const names = Object.keys(job.fields);
  return {
    model: MODEL,
    max_tokens: 16000,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    output_config: { format: buildSchema(names) },
    messages: [{ role: "user", content: buildUserPrompt(job.fields) }],
  };
}

function parseTranslated(message) {
  const block = message?.content?.find((b) => b.type === "text");
  if (!block) return null;
  try {
    return JSON.parse(block.text);
  } catch {
    return null;
  }
}

async function runSync(anthropic, supabase, jobs) {
  let saved = 0;
  for (const [i, job] of jobs.entries()) {
    process.stdout.write(`  [${i + 1}/${jobs.length}] ${job.entity} ${job.entityId} … `);
    const message = await anthropic.messages.create(requestFor(job));
    const translated = parseTranslated(message);
    if (!translated) {
      console.log("sin JSON válido, se omite");
      continue;
    }
    saved += await saveTranslations(supabase, job, translated);
    console.log(`ok (${Object.keys(translated).length} campos)`);
  }
  return saved;
}

async function runBatch(anthropic, supabase, jobs) {
  const byCustomId = new Map();
  const requests = jobs.map((job, i) => {
    const customId = `job-${i}`;
    byCustomId.set(customId, job);
    return { custom_id: customId, params: requestFor(job) };
  });

  console.log(`  Enviando lote de ${requests.length} peticiones…`);
  const batch = await anthropic.messages.batches.create({ requests });
  console.log(`  Batch ${batch.id} creado. Esperando (suele tardar minutos)…`);

  let status = batch;
  while (status.processing_status !== "ended") {
    await new Promise((r) => setTimeout(r, 20_000));
    status = await anthropic.messages.batches.retrieve(batch.id);
    const c = status.request_counts;
    process.stdout.write(
      `\r  procesando: ${c.processing} · ok: ${c.succeeded} · error: ${c.errored}   `,
    );
  }
  console.log("\n  Lote terminado. Guardando…");

  let saved = 0;
  let failed = 0;
  for await (const result of await anthropic.messages.batches.results(batch.id)) {
    const job = byCustomId.get(result.custom_id);
    if (!job) continue;
    if (result.result.type !== "succeeded") {
      failed++;
      continue;
    }
    const translated = parseTranslated(result.result.message);
    if (!translated) {
      failed++;
      continue;
    }
    saved += await saveTranslations(supabase, job, translated);
  }
  if (failed > 0) console.log(`  ${failed} peticiones sin resultado utilizable.`);
  return saved;
}

/* ─── Main ───────────────────────────────────────────────────────────────── */

async function main() {
  loadEnv();
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const sync = args.includes("--sync");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? Number(args[limitIdx + 1]) : undefined;

  const supabase = createClient(
    required("VITE_SUPABASE_URL"),
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || required("VITE_SUPABASE_ANON_KEY"),
    { auth: { persistSession: false } },
  );

  /* ── Contenido del CMS ── */
  if (!args.includes("--solo-catalogo")) {
    console.log("CMS (site_content_sections):");
    const cms = await collectCmsPending(supabase);
    console.log(`  al día: ${cms.skippedFresh} · corregidas a mano: ${cms.skippedManual} · pendientes: ${cms.jobs.length}`);
    if (cms.jobs.length > 0 && !dryRun) {
      const anthropicCms = new Anthropic({ apiKey: required("ANTHROPIC_API_KEY") });
      const n = await runCms(anthropicCms, supabase, cms.jobs);
      console.log(`  ${n} páginas traducidas.`);
    }
    console.log("");
  }

  console.log("Catálogo (propiedades y desarrollos):");
  const { jobs, skippedFresh, skippedManual } = await collectPending(supabase, { limit });

  console.log(`  ya traducidos y al día: ${skippedFresh}`);
  console.log(`  corregidos a mano (intactos): ${skippedManual}`);
  console.log(`  fichas por traducir: ${jobs.length}`);

  if (jobs.length === 0) {
    console.log("\nNada que hacer. Todo al día.");
    return;
  }

  const est = estimate(jobs, { batch: !sync });
  console.log(`  palabras: ${est.words.toLocaleString()}`);
  console.log(`  costo estimado: $${est.usd.toFixed(2)} USD${sync ? "" : " (Batch API)"}`);

  if (dryRun) {
    console.log("\n--dry-run: no se llamó a la API ni se escribió nada.");
    return;
  }

  const anthropic = new Anthropic({ apiKey: required("ANTHROPIC_API_KEY") });
  console.log("");
  const saved = sync
    ? await runSync(anthropic, supabase, jobs)
    : await runBatch(anthropic, supabase, jobs);

  console.log(`\nListo. ${saved} campos traducidos y guardados.`);
}

main().catch((err) => {
  console.error("\nError:", err.message);
  process.exit(1);
});
