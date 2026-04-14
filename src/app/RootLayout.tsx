import { Outlet, useLocation } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ScrollToTop } from "./components/ScrollToTop";

export function RootLayout() {
  const location = useLocation();
  const pageKey = location.pathname;

  return (
    <>
      <ScrollToTop />
      <AnimatePresence mode="wait">
        <motion.div
          key={pageKey}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-[100dvh] overflow-x-clip"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </>
  );
}
