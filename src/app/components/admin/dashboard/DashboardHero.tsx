import { Globe2, LogOut } from "lucide-react";
import { Link } from "react-router";
import { displayFirstNameForGreeting } from "../../../lib/dashboardOps";
import { dashboardTimeGreetingEs } from "../../../lib/leadFunnel";

type Props = {
  userName?: string;
  userEmail?: string;
  contextLine: string;
  onLogout: () => void;
};

export function DashboardHero({ userName, userEmail, contextLine, onLogout }: Props) {
  const first = displayFirstNameForGreeting(userName, userEmail);
  const greeting = dashboardTimeGreetingEs();

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-navy via-[#182338] to-[#1e2a45] text-white shadow-[0_24px_60px_-20px_rgba(20,28,46,0.45)] ring-1 ring-white/10">
      <div className="h-1 w-full bg-gradient-to-r from-brand-gold via-primary to-brand-burgundy" aria-hidden />
      <div
        className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-7">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/55">Tu día en Viterra</p>
          <h1 className="font-heading mt-1 text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
            {greeting}
            {first ? `, ${first}` : ", equipo"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">{contextLine}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            to="/"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/35 bg-white/10 px-3 text-sm text-white transition hover:bg-white/20"
            style={{ fontWeight: 600 }}
          >
            <Globe2 className="h-4 w-4" strokeWidth={1.8} />
            Ir al sitio
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/35 bg-white/10 px-3 text-sm text-white transition hover:bg-white/20"
            style={{ fontWeight: 600 }}
          >
            <LogOut className="h-4 w-4" strokeWidth={1.8} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </section>
  );
}
