import type { Property } from "../components/PropertyCard";

export const INVENTORY_KEYS = ["disponible", "enApartado", "vendida", "renta"] as const;
export type InventoryKey = (typeof INVENTORY_KEYS)[number];

export const INVENTORY_LABELS: Record<InventoryKey, string> = {
  disponible: "Disponible",
  enApartado: "Apartado",
  vendida: "Vendida",
  renta: "Renta",
};

export function countPropertyInventory(properties: Property[]) {
  const acc: Record<InventoryKey, number> = {
    disponible: 0,
    enApartado: 0,
    vendida: 0,
    renta: 0,
  };
  for (const p of properties) {
    const inv = p.listingInventory ?? "disponible";
    if (inv === "disponible") acc.disponible += 1;
    else if (inv === "en_apartado") acc.enApartado += 1;
    else if (inv === "vendida") acc.vendida += 1;
    else acc.renta += 1;
  }
  const total = acc.disponible + acc.enApartado + acc.vendida + acc.renta;
  return { acc, total };
}
