import { useEffect, useState } from "react";
import { getSupabaseClient } from "../lib/supabaseClient";

/** Solo `price` + `status` para el slider del buscador — sin traer todo el catálogo a la portada. */
export function useCatalogPriceSlices() {
  const [slices, setSlices] = useState<{ venta: number[]; alquiler: number[] }>({
    venta: [],
    alquiler: [],
  });

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;

    void client
      .from("properties")
      .select("price, status")
      .then(({ data, error }) => {
        if (error || !data?.length) return;
        const venta: number[] = [];
        const alquiler: number[] = [];
        for (const row of data as { price: unknown; status: unknown }[]) {
          const p = Number(row.price ?? 0);
          if (!Number.isFinite(p) || p < 0) continue;
          const st = String(row.status ?? "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          if (st.includes("alquiler") || st.includes("rent") || st === "renta") alquiler.push(p);
          else venta.push(p);
        }
        setSlices({ venta, alquiler });
      });
  }, []);

  return slices;
}
