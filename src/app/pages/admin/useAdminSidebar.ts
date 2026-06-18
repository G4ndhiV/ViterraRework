import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

const ADMIN_SIDEBAR_EXPANDED_KEY = "viterra-admin-sidebar-expanded";

function readStoredAdminSidebarExpanded(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(ADMIN_SIDEBAR_EXPANDED_KEY) !== "0";
  } catch {
    return true;
  }
}

export type AdminSidebarState = {
  /** Sidebar de escritorio expandido/colapsado (persistido en localStorage). */
  adminSidebarExpanded: boolean;
  setAdminSidebarExpanded: Dispatch<SetStateAction<boolean>>;
  /** Menú hamburguesa de módulos en móvil/iPad (<lg). */
  mobileMenuOpen: boolean;
  setMobileMenuOpen: Dispatch<SetStateAction<boolean>>;
};

/**
 * Estado de navegación del shell admin (sidebar de escritorio + drawer móvil), aislado de la
 * lógica de datos/permisos. Persiste el estado del sidebar y maneja Escape + bloqueo de scroll
 * del drawer móvil.
 */
export function useAdminSidebar(): AdminSidebarState {
  const [adminSidebarExpanded, setAdminSidebarExpanded] = useState(readStoredAdminSidebarExpanded);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(ADMIN_SIDEBAR_EXPANDED_KEY, adminSidebarExpanded ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [adminSidebarExpanded]);

  // Drawer móvil: cerrar con Escape y bloquear el scroll del fondo mientras está abierto.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileMenuOpen]);

  return { adminSidebarExpanded, setAdminSidebarExpanded, mobileMenuOpen, setMobileMenuOpen };
}
