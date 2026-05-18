import type { LucideIcon } from "lucide-react";
import type { UserPermission } from "../../../contexts/AuthContext";
import {
  Building2,
  Globe2,
  Home,
  Shield,
  UserCircle2,
  Users,
} from "lucide-react";

export type ProfileDraft = {
  name: string;
  email: string;
  phone: string;
  cellphone: string;
  position: string;
  picture: string;
};

export const emptyProfileDraft: ProfileDraft = {
  name: "",
  email: "",
  phone: "",
  cellphone: "",
  position: "",
  picture: "",
};

export type ProfileTabId = "personal" | "performance" | "access";

export const PROFILE_TABS: Array<{ id: ProfileTabId; label: string }> = [
  { id: "personal", label: "Datos personales" },
  { id: "performance", label: "Equipo y rendimiento" },
  { id: "access", label: "Acceso y permisos" },
];

export const profilePermissionCards: Array<{
  value: UserPermission;
  label: string;
  description: string;
  Icon: LucideIcon;
}> = [
  {
    value: "manage_leads",
    label: "Leads",
    description: "CRM, pipeline y seguimiento de clientes",
    Icon: Users,
  },
  {
    value: "manage_properties",
    label: "Propiedades",
    description: "Catálogo y fichas de inmuebles",
    Icon: Home,
  },
  {
    value: "manage_developments",
    label: "Desarrollos",
    description: "Proyectos y desarrollos en el sitio",
    Icon: Building2,
  },
  {
    value: "manage_users",
    label: "Usuarios",
    description: "Alta, permisos y equipo",
    Icon: Shield,
  },
  {
    value: "manage_clients",
    label: "Clientes",
    description: "Fichas de clientes y relación con inventario",
    Icon: UserCircle2,
  },
  {
    value: "edit_site",
    label: "Sitio web",
    description: "Contenido y bloques del sitio público",
    Icon: Globe2,
  },
];

export const roleLabelByValue: Record<string, string> = {
  admin: "Administrador",
  lider_grupo: "Líder de grupo",
  asesor: "Asesor",
};
