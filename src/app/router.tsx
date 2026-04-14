import { createBrowserRouter } from "react-router";
import { RootLayout } from "./RootLayout";
import { HomePage } from "./pages/HomePage";
import { RentPage } from "./pages/RentPage";
import { SalePage } from "./pages/SalePage";
import { ServicesPage } from "./pages/ServicesPage";
import { PropertiesPage } from "./pages/PropertiesPage";
import { MapSearchPage } from "./pages/MapSearchPage";
import { PropertyDetailPage } from "./pages/PropertyDetailPage";
import { DevelopmentsPage } from "./pages/DevelopmentsPage";
import { DevelopmentDetailPage } from "./pages/DevelopmentDetailPage";
import { AboutPage } from "./pages/AboutPage";
import { ContactPage } from "./pages/ContactPage";
import { LoginPage } from "./pages/LoginPage";
import { AdminPage } from "./pages/AdminPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        Component: HomePage,
      },
      {
        path: "/renta",
        Component: RentPage,
      },
      {
        path: "/venta",
        Component: SalePage,
      },
      {
        path: "/servicios",
        Component: ServicesPage,
      },
      {
        path: "/propiedades/mapa",
        Component: MapSearchPage,
      },
      {
        path: "/propiedades",
        Component: PropertiesPage,
      },
      {
        path: "/propiedades/:id",
        Component: PropertyDetailPage,
      },
      {
        path: "/desarrollos",
        Component: DevelopmentsPage,
      },
      {
        path: "/desarrollos/:id",
        Component: DevelopmentDetailPage,
      },
      {
        path: "/nosotros",
        Component: AboutPage,
      },
      {
        path: "/contacto",
        Component: ContactPage,
      },
      {
        path: "/login",
        Component: LoginPage,
      },
      {
        path: "/admin",
        Component: AdminPage,
      },
      {
        path: "*",
        Component: NotFoundPage,
      },
    ],
  },
]);
