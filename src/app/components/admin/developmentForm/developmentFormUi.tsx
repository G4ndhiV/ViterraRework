import {
  PropertyField,
  PropertyFieldGrid,
  PropertyFormSection,
  propertyFieldClass,
  propertyLabelClass,
  propertyTextareaClass,
} from "../propertyForm/propertyFormUi";

export {
  PropertyField as DevelopmentField,
  PropertyFieldGrid as DevelopmentFieldGrid,
  PropertyFormSection as DevelopmentFormSection,
  propertyFieldClass as developmentFieldClass,
  propertyLabelClass as developmentLabelClass,
  propertyTextareaClass as developmentTextareaClass,
};

export const DEVELOPMENT_FORM_STEPS = [
  { id: "medios" as const, label: "Medios", short: "Fotos del proyecto" },
  { id: "ficha" as const, label: "Ficha", short: "Nombre y estatus" },
  { id: "ubicacion" as const, label: "Ubicación", short: "Mapa y dirección" },
  { id: "descripcion" as const, label: "Descripción", short: "Tipo y texto" },
  { id: "amenidades" as const, label: "Amenidades", short: "Listas públicas" },
  { id: "contacto" as const, label: "Contacto", short: "Teléfono y email" },
  { id: "inventario" as const, label: "Inventario", short: "Propiedades vinculadas" },
] as const;

export type DevelopmentFormStepId = (typeof DEVELOPMENT_FORM_STEPS)[number]["id"];
