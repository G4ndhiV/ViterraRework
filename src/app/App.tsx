import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "./router";
import { SiteContentProvider } from "../contexts/SiteContentContext";

export default function App() {
  return (
    <SiteContentProvider>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors closeButton />
    </SiteContentProvider>
  );
}