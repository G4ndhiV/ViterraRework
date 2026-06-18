import { useState, type Dispatch, type SetStateAction } from "react";
import type { CatalogPropertySortKey } from "../../lib/catalogPropertySort";

type Setter<T> = Dispatch<SetStateAction<T>>;

export type PropertiesFiltersState = {
  propertySearchQuery: string;
  setPropertySearchQuery: Setter<string>;
  propertyReferenceCodeQuery: string;
  setPropertyReferenceCodeQuery: Setter<string>;
  propertyOperationFilter: string;
  setPropertyOperationFilter: Setter<string>;
  propertyTypeFilter: string;
  setPropertyTypeFilter: Setter<string>;
  propertyLocationFilter: string;
  setPropertyLocationFilter: Setter<string>;
  /** Todas / solo destacadas (portada) / sin destacar. */
  propertyFeaturedFilter: "all" | "featured" | "normal";
  setPropertyFeaturedFilter: Setter<"all" | "featured" | "normal">;
  propertyCatalogSort: CatalogPropertySortKey;
  setPropertyCatalogSort: Setter<CatalogPropertySortKey>;
  propertyInventoryView: "cards" | "list" | "map";
  setPropertyInventoryView: Setter<"cards" | "list" | "map">;
};

/**
 * Estado de búsqueda/filtros/vista del catálogo de propiedades (solo UI, sin datos ni efectos).
 * Agrupa estos useState dispersos para reducir la superficie de estado del componente AdminWorkspace.
 */
export function usePropertiesFilters(): PropertiesFiltersState {
  const [propertySearchQuery, setPropertySearchQuery] = useState("");
  const [propertyReferenceCodeQuery, setPropertyReferenceCodeQuery] = useState("");
  const [propertyOperationFilter, setPropertyOperationFilter] = useState("all");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("all");
  const [propertyLocationFilter, setPropertyLocationFilter] = useState("all");
  const [propertyFeaturedFilter, setPropertyFeaturedFilter] = useState<"all" | "featured" | "normal">("all");
  const [propertyCatalogSort, setPropertyCatalogSort] = useState<CatalogPropertySortKey>("newest");
  const [propertyInventoryView, setPropertyInventoryView] = useState<"cards" | "list" | "map">("cards");

  return {
    propertySearchQuery,
    setPropertySearchQuery,
    propertyReferenceCodeQuery,
    setPropertyReferenceCodeQuery,
    propertyOperationFilter,
    setPropertyOperationFilter,
    propertyTypeFilter,
    setPropertyTypeFilter,
    propertyLocationFilter,
    setPropertyLocationFilter,
    propertyFeaturedFilter,
    setPropertyFeaturedFilter,
    propertyCatalogSort,
    setPropertyCatalogSort,
    propertyInventoryView,
    setPropertyInventoryView,
  };
}
