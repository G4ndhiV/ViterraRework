import { Link } from "react-router";
import { Home, ArrowLeft } from "lucide-react";
import { Reveal } from "../components/Reveal";

export function NotFoundPage() {
  return (
    <div className="viterra-page min-h-screen bg-brand-canvas flex items-center justify-center px-4">
      <Reveal className="text-center">
        <h1 className="text-9xl font-heading font-light text-primary mb-4">404</h1>
        <h2 className="text-3xl font-heading font-semibold text-brand-navy mb-4">
          Página no encontrada
        </h2>
        <p className="text-slate-600 mb-8 max-w-md mx-auto">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            to="/"
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-brand-red-hover transition-colors inline-flex items-center gap-2 font-medium"
          >
            <Home className="w-5 h-5" />
            Volver al inicio
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="border-2 border-brand-navy/20 text-brand-navy px-6 py-3 rounded-lg hover:bg-white/80 transition-colors inline-flex items-center gap-2 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver atrás
          </button>
        </div>
      </Reveal>
    </div>
  );
}
