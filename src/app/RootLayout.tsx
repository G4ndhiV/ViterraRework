import { Outlet, useLocation } from "react-router";
import { AuthProvider } from "./contexts/AuthContext";
import { ScrollToTop } from "./components/ScrollToTop";

/**
 * Sin Motion/AnimatePresence en el shell: en Safari el contenedor absoluto + animación
 * de opacidad a veces dejaba la ruta invisible (pantalla blanca) sin errores en consola.
 *
 * Auth debajo del Router para poder omitir consultas a `tokko_users` en rutas públicas (landing).
 */
export function RootLayout() {
  const location = useLocation();
  const pageKey = `${location.pathname}${location.search}`;

  return (
    <div className="relative isolate min-h-[100dvh] bg-brand-canvas">
      <ScrollToTop />
      <AuthProvider>
        <div
          key={pageKey}
          className="min-h-[100dvh] w-full overflow-x-clip bg-brand-canvas"
        >
          <Outlet />
        </div>
      </AuthProvider>
    </div>
  );
}
