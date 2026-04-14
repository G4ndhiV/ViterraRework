import { RouterProvider } from "react-router";
import { router } from "./router";
import { AuthProvider } from "./contexts/AuthContext";
import { SiteContentProvider } from "../contexts/SiteContentContext";
import "../styles/index.css";

export default function App() {
  return (
    <SiteContentProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </SiteContentProvider>
  );
}