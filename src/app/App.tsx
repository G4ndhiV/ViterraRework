import { Suspense } from "react";
import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { ViterraPageLoader } from "./components/ViterraPageLoader";
import { router } from "./router";
import { SiteContentProvider } from "../contexts/SiteContentContext";

export default function App() {
  return (
    <SiteContentProvider>
      <Suspense fallback={<ViterraPageLoader />}>
        <RouterProvider router={router} />
      </Suspense>
      <Toaster position="top-center" richColors closeButton />
    </SiteContentProvider>
  );
}