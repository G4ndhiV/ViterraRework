import type { MouseEvent } from "react";
import type { SiteContent } from "../../../../data/siteContent";
import { PreviewCanvasProvider } from "../../../../contexts/PreviewCanvasContext";
import { SiteContentReadOverride } from "../../../../contexts/SiteContentContext";
import { VisualSiteEditorProvider } from "../../../../contexts/VisualSiteEditorContext";
import { AboutPage } from "../../../pages/AboutPage";
import { ContactPage } from "../../../pages/ContactPage";
import { DevelopmentsPage } from "../../../pages/DevelopmentsPage";
import { HomePage } from "../../../pages/HomePage";
import { ServicesPage } from "../../../pages/ServicesPage";

/** Sin segundo `<Router>`: la app ya usa `RouterProvider`; aquí solo montamos la página que toca. */
function PreviewPage({ path }: { path: string }) {
  switch (path) {
    case "/":
      return <HomePage />;
    case "/contacto":
      return <ContactPage />;
    case "/servicios":
      return <ServicesPage />;
    case "/nosotros":
      return <AboutPage />;
    case "/desarrollos":
      return <DevelopmentsPage />;
    default:
      return <HomePage />;
  }
}

/** Evita salir del admin al pulsar enlaces internos dentro de la vista previa */
function blockInternalNavigation(e: MouseEvent<HTMLDivElement>) {
  const el = (e.target as HTMLElement | null)?.closest?.("a[href]");
  if (!el) return;
  const href = el.getAttribute("href");
  if (href?.startsWith("/") && !href.startsWith("//")) {
    e.preventDefault();
    e.stopPropagation();
  }
}

export function SitePreviewCanvas({
  mergedContent,
  previewPath,
  activeBlockId,
  setActiveBlockId,
}: {
  mergedContent: SiteContent;
  previewPath: string;
  activeBlockId: string | null;
  setActiveBlockId: (id: string | null) => void;
}) {
  return (
    <SiteContentReadOverride content={mergedContent}>
      <VisualSiteEditorProvider enabled activeBlockId={activeBlockId} setActiveBlockId={setActiveBlockId}>
        <PreviewCanvasProvider>
          <div
            className="viterra-preview-canvas min-w-0 max-w-full overflow-x-hidden bg-white"
            onClickCapture={blockInternalNavigation}
          >
            <PreviewPage path={previewPath} />
          </div>
        </PreviewCanvasProvider>
      </VisualSiteEditorProvider>
    </SiteContentReadOverride>
  );
}
