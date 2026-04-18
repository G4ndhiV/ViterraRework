export const WORKSPACE_ADMIN_SETTINGS_KEY = "viterra_workspace_admin_settings";

export interface WorkspaceAdminSettings {
  /** Nombre mostrado en exportaciones y cabeceras del panel */
  workspaceName: string;
  /** Moneda preferida para listados y nuevas altas (referencia) */
  defaultCurrency: "MXN" | "USD";
  /** Correo de contacto interno para alertas (opcional) */
  contactEmail: string;
}

export const DEFAULT_WORKSPACE_ADMIN_SETTINGS: WorkspaceAdminSettings = {
  workspaceName: "Viterra",
  defaultCurrency: "MXN",
  contactEmail: "",
};

export function loadWorkspaceAdminSettings(): WorkspaceAdminSettings {
  try {
    const raw = localStorage.getItem(WORKSPACE_ADMIN_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_WORKSPACE_ADMIN_SETTINGS };
    const o = JSON.parse(raw) as Partial<WorkspaceAdminSettings>;
    return {
      workspaceName:
        typeof o.workspaceName === "string" && o.workspaceName.trim()
          ? o.workspaceName.trim()
          : DEFAULT_WORKSPACE_ADMIN_SETTINGS.workspaceName,
      defaultCurrency: o.defaultCurrency === "USD" ? "USD" : "MXN",
      contactEmail: typeof o.contactEmail === "string" ? o.contactEmail : "",
    };
  } catch {
    return { ...DEFAULT_WORKSPACE_ADMIN_SETTINGS };
  }
}

export function saveWorkspaceAdminSettings(next: WorkspaceAdminSettings): void {
  localStorage.setItem(WORKSPACE_ADMIN_SETTINGS_KEY, JSON.stringify(next));
}

/** Claves locales que componen la “base” del CRM en este navegador */
export const CRM_LOCAL_STORAGE_KEYS: Array<{ key: string; label: string }> = [
  { key: "viterra_leads", label: "Leads y pipeline" },
  { key: "viterra_properties", label: "Propiedades (catálogo admin)" },
  { key: "viterra_admin_developments", label: "Desarrollos" },
  { key: "viterra_kanban_custom_stages", label: "Etapas personalizadas del Kanban" },
  { key: "viterra_kanban_stage_order", label: "Orden de columnas del pipeline" },
  { key: "viterra_kanban_stage_colors", label: "Colores de columnas del pipeline" },
  { key: "viterra_agenda_appointments", label: "Citas de la agenda" },
  { key: "viterra_site_content", label: "Contenido del sitio web" },
  { key: "viterra_admin_users", label: "Usuarios del CRM" },
  { key: "viterra_user_groups", label: "Grupos de trabajo (usuarios)" },
  { key: "viterra_admin_passwords", label: "Contraseñas (hash local)" },
  { key: WORKSPACE_ADMIN_SETTINGS_KEY, label: "Ajustes del espacio de trabajo" },
];
