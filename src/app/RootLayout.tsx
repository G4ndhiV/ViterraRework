import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ScrollToTop } from "./components/ScrollToTop";

export function RootLayout() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const pageKey = `${location.pathname}${location.search}`;
  const skipFirstEnter = useRef(true);

  useEffect(() => {
    skipFirstEnter.current = false;
  }, []);

  const easeViterra = [0.22, 1, 0.36, 1] as const;

  const enterExit = reduceMotion
    ? {
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2, ease: "easeOut" as const },
      }
    : {
        /** Entrada: desde la derecha + fade · Salida: hacia la izquierda + fade */
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -36 },
        transition: { duration: 0.42, ease: easeViterra },
      };

  const initialEnter = skipFirstEnter.current
    ? false
    : reduceMotion
      ? { opacity: 0 }
      : { opacity: 0, x: 40 };

  return (
    <div className="relative isolate min-h-[100dvh] bg-brand-canvas">
      <ScrollToTop />
      {/*
        mode="sync" evita el hueco entre salida y entrada de mode="wait" (flash blanco).
        Capas absolutas para que dos rutas no dupliquen altura en el flujo.
      */}
      <AnimatePresence mode="sync">
        <motion.div
          key={pageKey}
          initial={initialEnter}
          animate={enterExit.animate}
          exit={enterExit.exit}
          transition={enterExit.transition}
          className="absolute left-0 right-0 top-0 z-10 min-h-[100dvh] w-full overflow-x-clip bg-brand-canvas"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
