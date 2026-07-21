/**
 * @file missingColumnFallback.test.ts
 * @module Unit Tests – Resiliencia ante columnas inexistentes al guardar propiedades
 *
 * Cubre el fix del 400 (Bad Request) al guardar una propiedad cuando la BD no tiene una
 * columna que el código sí envía (schema drift, p. ej. `rental_price` sin migrar):
 * - missingColumnName: extrae el nombre desde errores PGRST204 (escritura) y 42703 (lectura).
 * - writeWithMissingColumnFallback: quita la columna faltante y reintenta; no enmascara
 *   otros errores (constraint, RLS) ni cicla.
 *
 * Ejecutar: npx vitest run src/__tests__/unit/properties/missingColumnFallback.test.ts
 */

import { describe, it, expect, vi } from "vitest";
import {
  missingColumnName,
  writeWithMissingColumnFallback,
} from "../../../app/lib/supabaseProperties";

describe("missingColumnName", () => {
  it("extrae la columna de un PGRST204 (schema cache de PostgREST al escribir)", () => {
    expect(
      missingColumnName({
        code: "PGRST204",
        message: "Could not find the 'rental_price' column of 'properties' in the schema cache",
      }),
    ).toBe("rental_price");
  });

  it("extrae la columna de un 42703 con nombre calificado por tabla", () => {
    expect(
      missingColumnName({ code: "42703", message: "column properties.rental_price does not exist" }),
    ).toBe("rental_price");
  });

  it("extrae la columna de un 42703 sin calificar y entrecomillada", () => {
    expect(
      missingColumnName({ code: "42703", message: 'column "rental_price" does not exist' }),
    ).toBe("rental_price");
  });

  it("devuelve null para errores que no son de columna inexistente", () => {
    expect(missingColumnName({ code: "23514", message: "violates check constraint" })).toBeNull();
    expect(missingColumnName({ code: "42501", message: "permission denied" })).toBeNull();
    expect(missingColumnName(null)).toBeNull();
  });
});

describe("writeWithMissingColumnFallback", () => {
  const ok = { data: [{ id: "1" }], error: null as null };

  it("no reintenta si la primera escritura tiene éxito", async () => {
    const run = vi.fn().mockResolvedValue(ok);
    const res = await writeWithMissingColumnFallback({ title: "Casa", rental_price: 100 }, run);
    expect(res.error).toBeNull();
    expect(run).toHaveBeenCalledTimes(1);
    // La fila se envió completa (sin quitar nada).
    expect(run.mock.calls[0][0]).toHaveProperty("rental_price", 100);
  });

  it("quita la columna faltante y reintenta con éxito (caso rental_price)", async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: "PGRST204",
          message: "Could not find the 'rental_price' column of 'properties' in the schema cache",
        },
      })
      .mockResolvedValueOnce(ok);

    const res = await writeWithMissingColumnFallback(
      { title: "Casa Nueva", price: 500, rental_price: 100 },
      run,
    );

    expect(res.error).toBeNull();
    expect(run).toHaveBeenCalledTimes(2);
    // El reintento ya no incluye rental_price, pero conserva el resto (título, precio).
    const retryRow = run.mock.calls[1][0];
    expect(retryRow).not.toHaveProperty("rental_price");
    expect(retryRow).toHaveProperty("title", "Casa Nueva");
    expect(retryRow).toHaveProperty("price", 500);
  });

  it("no enmascara un error que no es de columna faltante (constraint) y no cicla", async () => {
    const constraintErr = {
      data: null,
      error: { code: "23514", message: "new row violates check constraint properties_status_check" },
    };
    const run = vi.fn().mockResolvedValue(constraintErr);

    const res = await writeWithMissingColumnFallback({ status: "venta_y_alquiler" }, run);

    expect(res.error).toEqual(constraintErr.error);
    expect(run).toHaveBeenCalledTimes(1); // no reintenta
  });

  it("corta si la columna faltante no está en la fila (evita bucle infinito)", async () => {
    const run = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST204", message: "Could not find the 'otra' column of 'x' in the schema cache" },
    });

    const res = await writeWithMissingColumnFallback({ title: "Casa" }, run);

    expect(res.error).not.toBeNull();
    expect(run).toHaveBeenCalledTimes(1); // 'otra' no está en la fila → no reintenta
  });
});
