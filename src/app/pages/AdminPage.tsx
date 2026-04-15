import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Users,
  Home,
  MessageSquare,
  TrendingUp,
  Search,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  MapPin,
  LogOut,
  Plus,
  Bed,
  Bath,
  Square,
  Activity,
  Mail,
  Phone,
  ChevronRight,
  ChevronDown,
  Target,
  Briefcase,
  Globe2,
  LayoutGrid,
  Table2,
  Filter,
} from "lucide-react";
import { AdminSiteEditor } from "../components/admin/AdminSiteEditor";
import { useAuth } from "../contexts/AuthContext";
import {
  mockLeads,
  Lead,
  normalizeStoredLead,
  LEAD_STATUS_LABEL,
  BUILTIN_STATUS_ORDER,
  labelForLeadStatus,
  newCustomStageId,
  type CustomKanbanStage,
} from "../data/leads";
import { LeadsKanbanBoard } from "../components/admin/LeadsKanbanBoard";
import { LeadPriorityBadge } from "../components/admin/LeadPriorityBadge";
import { AddLeadDialog } from "../components/admin/AddLeadDialog";
import { LeadDetailDialog } from "../components/admin/LeadDetailDialog";
import { PropertyFormDialog } from "../components/admin/PropertyFormDialog";
import { filterLeadsForUser, roleLabelEs } from "../lib/leadsAccess";
import { mockProperties } from "../data/properties";
import { Property } from "../components/PropertyCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";

type TabType = "dashboard" | "leads" | "pipeline" | "properties" | "messages" | "site";

export function AdminPage() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [leadsView, setLeadsView] = useState<"kanban" | "table">("kanban");
  const [customKanbanStages, setCustomKanbanStages] = useState<CustomKanbanStage[]>([]);
  const [leadDialog, setLeadDialog] = useState<{ lead: Lead; mode: "view" | "edit" } | null>(null);
  const [propertyForm, setPropertyForm] = useState<{
    mode: "create" | "edit";
    property: Property | null;
  } | null>(null);

  // Verificar autenticación y cargar datos
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const savedLeads = localStorage.getItem("viterra_leads");
    if (savedLeads) {
      try {
        const parsed = JSON.parse(savedLeads) as unknown[];
        setLeads(parsed.map((row) => normalizeStoredLead(row as Record<string, unknown>)));
      } catch {
        setLeads(mockLeads);
      }
    } else {
      setLeads(mockLeads);
    }

    const savedProperties = localStorage.getItem("viterra_properties");
    setProperties(savedProperties ? JSON.parse(savedProperties) : mockProperties);

    const savedStages = localStorage.getItem("viterra_kanban_custom_stages");
    if (savedStages) {
      try {
        const parsed = JSON.parse(savedStages) as unknown;
        if (Array.isArray(parsed)) {
          setCustomKanbanStages(
            parsed.filter(
              (x): x is CustomKanbanStage =>
                typeof x === "object" &&
                x !== null &&
                typeof (x as CustomKanbanStage).id === "string" &&
                typeof (x as CustomKanbanStage).label === "string"
            )
          );
        }
      } catch {
        /* ignore */
      }
    }
  }, [navigate, isAuthenticated]);

  useEffect(() => {
    if (leads.length > 0) {
      localStorage.setItem("viterra_leads", JSON.stringify(leads));
    }
  }, [leads]);

  useEffect(() => {
    if (properties.length > 0) {
      localStorage.setItem("viterra_properties", JSON.stringify(properties));
    }
  }, [properties]);

  useEffect(() => {
    localStorage.setItem("viterra_kanban_custom_stages", JSON.stringify(customKanbanStages));
  }, [customKanbanStages]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleDeleteProperty = (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar esta propiedad?")) {
      setProperties(properties.filter(p => p.id !== id));
    }
  };

  const handleDeleteLead = (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar este lead?")) {
      setLeads((prev) => prev.filter((l) => l.id !== id));
      setLeadDialog((d) => (d?.lead.id === id ? null : d));
    }
  };

  const handleUpdateLeadStatus = useCallback((leadId: string, newStatus: string) => {
    const updatedAt = new Date().toISOString();
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId ? { ...lead, status: newStatus, updatedAt } : lead
      )
    );
    setLeadDialog((d) =>
      d && d.lead.id === leadId
        ? { ...d, lead: { ...d.lead, status: newStatus, updatedAt } }
        : d
    );
  }, []);

  const leadColumnStatuses = useMemo(
    () => [...BUILTIN_STATUS_ORDER, ...customKanbanStages.map((s) => s.id)],
    [customKanbanStages]
  );

  const statusSelectOptions = useMemo(
    () => [
      ...BUILTIN_STATUS_ORDER.map((s) => ({ value: s, label: LEAD_STATUS_LABEL[s] })),
      ...customKanbanStages.map((s) => ({ value: s.id, label: s.label })),
    ],
    [customKanbanStages]
  );

  const resolveStatusLabel = useCallback(
    (s: string) => labelForLeadStatus(s, customKanbanStages),
    [customKanbanStages]
  );

  const handleAddKanbanStage = useCallback((label: string) => {
    const id = newCustomStageId();
    setCustomKanbanStages((prev) => [...prev, { id, label }]);
  }, []);

  const handleAddLead = useCallback((lead: Lead) => {
    setLeads((prev) => [...prev, lead]);
  }, []);

  const handleSaveLead = useCallback((updated: Lead) => {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setLeadDialog((d) =>
      d && d.lead.id === updated.id ? { ...d, lead: updated } : d
    );
  }, []);

  const nextPropertyId = useMemo(
    () => String(Math.max(0, ...properties.map((p) => parseInt(p.id, 10) || 0)) + 1),
    [properties]
  );

  const handleSaveProperty = useCallback((p: Property) => {
    setProperties((prev) => {
      const exists = prev.some((x) => x.id === p.id);
      if (exists) return prev.map((x) => (x.id === p.id ? p : x));
      return [...prev, p];
    });
  }, []);

  const leadsForUser = useMemo(() => filterLeadsForUser(leads, user), [leads, user]);

  const openLeadDetail = useCallback(
    (lead: Lead, mode: "view" | "edit") => {
      const full = leads.find((l) => l.id === lead.id) ?? lead;
      setLeadDialog({ lead: full, mode });
    },
    [leads]
  );

  // Stats calculations (respetan rol: el asesor solo cuenta sus leads)
  const totalLeads = leadsForUser.length;
  const newLeads = leadsForUser.filter((l) => l.status === "nuevo").length;
  const closedDeals = leadsForUser.filter((l) => l.status === "cerrado").length;
  const totalProperties = properties.length;
  const propertiesForSale = properties.filter(p => p.status === "venta").length;
  const propertiesForRent = properties.filter(p => p.status === "alquiler").length;

  const filteredLeads = leadsForUser.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Datos para gráficas - tonos elegantes
  const trendData = [
    { month: "Ene", leads: 12, conversiones: 3 },
    { month: "Feb", leads: 15, conversiones: 4 },
    { month: "Mar", leads: 18, conversiones: 5 },
    { month: "Abr", leads: 14, conversiones: 3 },
    { month: "May", leads: 20, conversiones: 6 },
    { month: "Jun", leads: 25, conversiones: 8 },
  ];

  const leadsBySourceData = [
    { name: "Website", value: leadsForUser.filter((l) => l.source === "Website").length },
    { name: "Facebook", value: leadsForUser.filter((l) => l.source === "Facebook").length },
    { name: "Instagram", value: leadsForUser.filter((l) => l.source === "Instagram").length },
    { name: "Google", value: leadsForUser.filter((l) => l.source === "Google").length },
    { name: "Referido", value: leadsForUser.filter((l) => l.source === "Referido").length },
  ];

  const conversionRate = totalLeads > 0 ? ((closedDeals / totalLeads) * 100).toFixed(1) : "0";
  const totalValue = properties.reduce((sum, p) => sum + p.price, 0);
  const avgPropertyPrice = properties.length > 0 ? (totalValue / properties.length).toFixed(0) : "0";

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      nuevo: "bg-slate-100 text-slate-700 border border-slate-200",
      contactado: "bg-amber-50 text-amber-700 border border-amber-200",
      calificado: "bg-sky-50 text-sky-800 border border-sky-200",
      negociacion: "bg-purple-50 text-purple-700 border border-purple-200",
      cerrado: "bg-green-50 text-green-700 border border-green-200",
      perdido: "bg-gray-100 text-gray-600 border border-gray-200",
    };
    return colors[status] ?? "bg-indigo-50 text-indigo-800 border border-indigo-200";
  };

  if (!user) {
    return null;
  }

  return (
    <div className="viterra-page viterra-crm min-h-screen bg-gradient-to-b from-[#f7f5f2] via-slate-50 to-slate-100">
      <header className="sticky top-0 z-50 border-b border-brand-gold/15 bg-brand-navy text-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.35)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[72px] items-center justify-between gap-4">
            <Link
              to="/"
              aria-label="Ir al inicio del sitio público"
              className="group flex min-w-0 items-center rounded-lg px-2 py-1.5 -ml-2 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy active:bg-white/[0.12]"
            >
              <div className="min-w-0 text-left">
                <span className="font-heading block font-light leading-tight tracking-[0.22em] text-white transition group-hover:text-white sm:text-lg">
                  VITERRA
                </span>
                <span className="relative my-2 block h-px w-[min(100%,11rem)] max-w-[11rem] overflow-hidden rounded-full" aria-hidden>
                  <span className="absolute inset-0 bg-white/50" />
                  <span className="absolute inset-0 origin-left bg-[#C8102E]" style={{ transform: "scaleX(0.55)" }} />
                </span>
                <p
                  className="text-[10px] font-normal uppercase tracking-[0.26em] text-white/72 group-hover:text-white/88"
                  style={{
                    fontFamily: 'Perpetua, "Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif',
                  }}
                >
                  CRM System
                </p>
              </div>
            </Link>

            <nav className="flex items-center gap-2 sm:gap-4 md:gap-6" aria-label="Acciones de cuenta">
              <Link
                to="/"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-white/90 underline-offset-4 transition-colors hover:bg-white/10 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:inline"
                style={{ fontWeight: 500 }}
              >
                Volver al sitio
              </Link>

              <div
                className="flex items-center gap-3 border-l border-white/20 pl-3 sm:pl-6"
                aria-label={`Sesión: ${user.name}, ${roleLabelEs(user.role)}`}
              >
                <div className="hidden min-w-0 text-right sm:block">
                  <p className="truncate text-sm font-semibold text-white" style={{ fontWeight: 600 }}>
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-white/60" style={{ fontWeight: 500 }}>
                    {roleLabelEs(user.role)}
                  </p>
                </div>
                <div
                  className="flex h-10 w-10 shrink-0 cursor-default items-center justify-center rounded-lg border border-white/20 bg-white/10 transition hover:border-white/35 hover:bg-white/15"
                  title={user.name}
                >
                  <span className="text-sm font-semibold text-white" style={{ fontWeight: 600 }}>
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg p-2.5 text-white/75 transition-all hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45 active:bg-white/[0.14]"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </nav>
          </div>
        </div>
      </header>

      <div data-reveal className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-10">
          <nav className="flex flex-wrap gap-6 border-b border-slate-200/90 sm:gap-8 md:gap-10">
            <button
              onClick={() => setActiveTab("dashboard")}
              type="button"
              className={`font-heading pb-4 px-1 text-sm transition-all border-b-2 -mb-px ${
                activeTab === "dashboard"
                  ? "border-primary text-brand-navy"
                  : "border-transparent text-slate-500 hover:text-brand-navy"
              }`}
              style={{ fontWeight: activeTab === "dashboard" ? 600 : 500 }}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4.5 h-4.5" strokeWidth={activeTab === "dashboard" ? 2 : 1.5} />
                Dashboard
              </div>
            </button>
            <button
              onClick={() => setActiveTab("leads")}
              type="button"
              className={`font-heading pb-4 px-1 text-sm transition-all border-b-2 -mb-px ${
                activeTab === "leads"
                  ? "border-primary text-brand-navy"
                  : "border-transparent text-slate-500 hover:text-brand-navy"
              }`}
              style={{ fontWeight: activeTab === "leads" ? 600 : 500 }}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4.5 h-4.5" strokeWidth={activeTab === "leads" ? 2 : 1.5} />
                Leads
                <span
                  className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary ring-1 ring-primary/15"
                  style={{ fontWeight: 600 }}
                >
                  {totalLeads}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("properties")}
              type="button"
              className={`font-heading pb-4 px-1 text-sm transition-all border-b-2 -mb-px ${
                activeTab === "properties"
                  ? "border-primary text-brand-navy"
                  : "border-transparent text-slate-500 hover:text-brand-navy"
              }`}
              style={{ fontWeight: activeTab === "properties" ? 600 : 500 }}
            >
              <div className="flex items-center gap-2.5">
                <Home className="w-4.5 h-4.5" strokeWidth={activeTab === "properties" ? 2 : 1.5} />
                Propiedades
                <span
                  className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-xs font-semibold text-brand-navy ring-1 ring-slate-300/60"
                  style={{ fontWeight: 600 }}
                >
                  {totalProperties}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              type="button"
              className={`font-heading pb-4 px-1 text-sm transition-all border-b-2 -mb-px ${
                activeTab === "messages"
                  ? "border-primary text-brand-navy"
                  : "border-transparent text-slate-500 hover:text-brand-navy"
              }`}
              style={{ fontWeight: activeTab === "messages" ? 600 : 500 }}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4.5 h-4.5" strokeWidth={activeTab === "messages" ? 2 : 1.5} />
                Mensajes
              </div>
            </button>
            <button
              onClick={() => setActiveTab("site")}
              type="button"
              className={`font-heading pb-4 px-1 text-sm transition-all border-b-2 -mb-px ${
                activeTab === "site"
                  ? "border-primary text-brand-navy"
                  : "border-transparent text-slate-500 hover:text-brand-navy"
              }`}
              style={{ fontWeight: activeTab === "site" ? 600 : 500 }}
            >
              <div className="flex items-center gap-2.5">
                <Globe2 className="w-4.5 h-4.5" strokeWidth={activeTab === "site" ? 2 : 1.5} />
                Editar sitio
              </div>
            </button>
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Stats Cards - Elegantes y minimalistas */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_8px_30px_-8px_rgba(20,28,46,0.1)] ring-1 ring-black/[0.02] transition-all hover:shadow-[0_12px_40px_-10px_rgba(20,28,46,0.14)]">
                <div className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-primary to-brand-burgundy opacity-90" aria-hidden />
                <div className="flex items-start justify-between pl-1 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white shadow-sm">
                    <Users className="h-5 w-5 text-brand-navy" strokeWidth={1.5} />
                  </div>
                  <TrendingUp className="h-4 w-4 text-brand-gold/90" strokeWidth={1.5} />
                </div>
                <p className="font-heading mb-1 text-[11px] uppercase tracking-[0.14em] text-slate-500" style={{ fontWeight: 600 }}>Total Leads</p>
                <p className="font-heading text-3xl text-brand-navy mb-1" style={{ fontWeight: 700 }}>{totalLeads}</p>
                <p className="text-xs text-slate-500" style={{ fontWeight: 500 }}>+{newLeads} este mes</p>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_8px_30px_-8px_rgba(20,28,46,0.1)] ring-1 ring-black/[0.02] transition-all hover:shadow-[0_12px_40px_-10px_rgba(20,28,46,0.14)]">
                <div className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-brand-burgundy to-brand-gold opacity-90" aria-hidden />
                <div className="flex items-start justify-between pl-1 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white shadow-sm">
                    <Target className="h-5 w-5 text-brand-navy" strokeWidth={1.5} />
                  </div>
                  <Activity className="h-4 w-4 text-brand-gold/90" strokeWidth={1.5} />
                </div>
                <p className="font-heading mb-1 text-[11px] uppercase tracking-[0.14em] text-slate-500" style={{ fontWeight: 600 }}>Conversión</p>
                <p className="font-heading text-3xl text-brand-navy mb-1" style={{ fontWeight: 700 }}>{conversionRate}%</p>
                <p className="text-xs text-slate-500" style={{ fontWeight: 500 }}>{closedDeals} cerrados</p>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_8px_30px_-8px_rgba(20,28,46,0.1)] ring-1 ring-black/[0.02] transition-all hover:shadow-[0_12px_40px_-10px_rgba(20,28,46,0.14)]">
                <div className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-brand-navy to-slate-600 opacity-90" aria-hidden />
                <div className="flex items-start justify-between pl-1 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white shadow-sm">
                    <Home className="h-5 w-5 text-brand-navy" strokeWidth={1.5} />
                  </div>
                  <Briefcase className="h-4 w-4 text-brand-gold/90" strokeWidth={1.5} />
                </div>
                <p className="font-heading mb-1 text-[11px] uppercase tracking-[0.14em] text-slate-500" style={{ fontWeight: 600 }}>Propiedades</p>
                <p className="font-heading text-3xl text-brand-navy mb-1" style={{ fontWeight: 700 }}>{totalProperties}</p>
                <p className="text-xs text-slate-500" style={{ fontWeight: 500 }}>{propertiesForSale} venta · {propertiesForRent} alquiler</p>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_8px_30px_-8px_rgba(20,28,46,0.1)] ring-1 ring-black/[0.02] transition-all hover:shadow-[0_12px_40px_-10px_rgba(20,28,46,0.14)]">
                <div className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-brand-gold to-primary opacity-90" aria-hidden />
                <div className="flex items-start justify-between pl-1 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white shadow-sm">
                    <DollarSign className="h-5 w-5 text-brand-navy" strokeWidth={1.5} />
                  </div>
                  <TrendingUp className="h-4 w-4 text-brand-gold/90" strokeWidth={1.5} />
                </div>
                <p className="font-heading mb-1 text-[11px] uppercase tracking-[0.14em] text-slate-500" style={{ fontWeight: 600 }}>Valor Promedio</p>
                <p className="font-heading text-3xl text-brand-navy mb-1" style={{ fontWeight: 700 }}>${parseInt(avgPropertyPrice).toLocaleString()}</p>
                <p className="text-xs text-slate-500" style={{ fontWeight: 500 }}>por propiedad</p>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Leads Trend */}
              <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_8px_30px_-8px_rgba(20,28,46,0.08)] ring-1 ring-black/[0.02]">
                <div className="mb-6">
                  <h3 className="font-heading text-base text-brand-navy" style={{ fontWeight: 600 }}>Tendencia de Leads</h3>
                  <p className="mt-1 text-sm text-slate-500" style={{ fontWeight: 500 }}>Últimos 6 meses</p>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorLeadsElegant" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#141c2e" stopOpacity={0.12}/>
                        <stop offset="95%" stopColor="#141c2e" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorConversionElegant" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7f1d1d" stopOpacity={0.12}/>
                        <stop offset="95%" stopColor="#7f1d1d" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '12px', fontWeight: 500 }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '12px', fontWeight: 500 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        fontFamily: '"Poppins", system-ui, sans-serif',
                        fontSize: '13px',
                        fontWeight: 500
                      }} 
                    />
                    <Area type="monotone" dataKey="leads" stroke="#141c2e" strokeWidth={2} fillOpacity={1} fill="url(#colorLeadsElegant)" name="Leads" />
                    <Area type="monotone" dataKey="conversiones" stroke="#7f1d1d" strokeWidth={2} fillOpacity={1} fill="url(#colorConversionElegant)" name="Conversiones" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Leads by Source */}
              <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_8px_30px_-8px_rgba(20,28,46,0.08)] ring-1 ring-black/[0.02]">
                <div className="mb-6">
                  <h3 className="font-heading text-base text-brand-navy" style={{ fontWeight: 600 }}>Fuentes de Adquisición</h3>
                  <p className="mt-1 text-sm text-slate-500" style={{ fontWeight: 500 }}>Canales de origen</p>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={leadsBySourceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '12px', fontWeight: 500 }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '12px', fontWeight: 500 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        fontFamily: '"Poppins", system-ui, sans-serif',
                        fontSize: '13px',
                        fontWeight: 500
                      }} 
                    />
                    <Bar dataKey="value" fill="#141c2e" radius={[6, 6, 0, 0]} name="Leads" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_8px_30px_-8px_rgba(20,28,46,0.08)] ring-1 ring-black/[0.02]">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="font-heading text-base text-brand-navy" style={{ fontWeight: 600 }}>Actividad Reciente</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("leads")}
                    className="flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-brand-navy"
                    style={{ fontWeight: 500 }}
                  >
                    Ver todos
                    <ChevronRight className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
                <div className="space-y-1">
                  {leadsForUser.slice(0, 5).map((lead) => (
                    <button
                      key={lead.id}
                      type="button"
                      onClick={() => openLeadDetail(lead, "view")}
                      className="flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-semibold text-slate-700" style={{ fontWeight: 600 }}>
                            {lead.name.split(" ").map(n => n[0]).join("")}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900" style={{ fontWeight: 600 }}>{lead.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5" style={{ fontWeight: 500 }}>{lead.email}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(lead.status)}`} style={{ fontWeight: 600 }}>
                        {resolveStatusLabel(lead.status)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_8px_30px_-8px_rgba(20,28,46,0.08)] ring-1 ring-black/[0.02]">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="font-heading text-base text-brand-navy" style={{ fontWeight: 600 }}>Propiedades Destacadas</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("properties")}
                    className="flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-brand-navy"
                    style={{ fontWeight: 500 }}
                  >
                    Ver todas
                    <ChevronRight className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
                <div className="space-y-1">
                  {properties.slice(0, 5).map((property) => (
                    <div key={property.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                          <img
                            src={property.image}
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900" style={{ fontWeight: 600 }}>{property.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5" style={{ fontWeight: 500 }}>{property.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900" style={{ fontWeight: 600 }}>${property.price.toLocaleString()}</p>
                        <span className="text-xs text-slate-500 uppercase tracking-wide" style={{ fontWeight: 500, letterSpacing: '0.05em' }}>
                          {property.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leads Tab */}
        {activeTab === "leads" && (
          <div className="space-y-6">
            {/* Leads Header */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white via-white to-slate-50/90 shadow-[0_24px_60px_-18px_rgba(20,28,46,0.14)] ring-1 ring-slate-900/[0.04]">
              <div
                className="h-1.5 w-full bg-gradient-to-r from-brand-gold via-primary to-brand-burgundy"
                aria-hidden
              />
              <div className="pointer-events-none absolute -right-20 top-8 h-56 w-56 rounded-full bg-gradient-to-br from-primary/[0.07] to-transparent blur-3xl" aria-hidden />
              <div className="relative px-5 pb-6 pt-6 md:px-8 md:pb-7 md:pt-7">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
                  <div className="min-w-0 max-w-xl">
                    <p
                      className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary"
                      style={{ fontWeight: 600 }}
                    >
                      Pipeline CRM
                    </p>
                    <h2
                      className="font-heading mt-2 text-[1.65rem] leading-tight text-brand-navy md:text-[1.85rem]"
                      style={{ fontWeight: 600 }}
                    >
                      Gestión de leads
                    </h2>
                    <p className="mt-2.5 text-sm leading-relaxed text-slate-600" style={{ fontWeight: 500 }}>
                      Administra y da seguimiento a tus clientes potenciales con vista Kanban o tabla.
                    </p>
                    {user.role === "asesor" && (
                      <p className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-900/90" style={{ fontWeight: 500 }}>
                        Solo ves los leads asignados a tu usuario.
                      </p>
                    )}
                  </div>

                  <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:justify-end">
                    <div
                      className="inline-flex rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1 shadow-[inset_0_1px_2px_rgba(20,28,46,0.06)]"
                      role="group"
                      aria-label="Vista de leads"
                    >
                      <button
                        type="button"
                        onClick={() => setLeadsView("kanban")}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] transition-all sm:text-[13px] ${
                          leadsView === "kanban"
                            ? "bg-brand-navy text-white shadow-md shadow-brand-navy/25"
                            : "text-slate-600 hover:bg-white/80 hover:text-brand-navy"
                        }`}
                        style={{ fontWeight: 600 }}
                      >
                        <LayoutGrid className="h-4 w-4 shrink-0" strokeWidth={2} />
                        Kanban
                      </button>
                      <button
                        type="button"
                        onClick={() => setLeadsView("table")}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] transition-all sm:text-[13px] ${
                          leadsView === "table"
                            ? "bg-brand-navy text-white shadow-md shadow-brand-navy/25"
                            : "text-slate-600 hover:bg-white/80 hover:text-brand-navy"
                        }`}
                        style={{ fontWeight: 600 }}
                      >
                        <Table2 className="h-4 w-4 shrink-0" strokeWidth={2} />
                        Tabla
                      </button>
                    </div>

                    {user.role === "lider_grupo" && (
                      <button
                        type="button"
                        onClick={() => {
                          const name = window.prompt("Nombre de la nueva etapa del embudo");
                          if (name?.trim()) handleAddKanbanStage(name.trim());
                        }}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-brand-navy shadow-sm transition-all hover:border-brand-navy/25 hover:bg-slate-50 sm:flex-initial sm:text-[13px]"
                        style={{ fontWeight: 600 }}
                        title="Solo líderes de grupo pueden añadir columnas al tablero"
                      >
                        <Plus className="h-4 w-4 shrink-0" strokeWidth={2} />
                        Nueva etapa
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setAddLeadOpen(true)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-brand-red-hover hover:shadow-xl sm:flex-initial"
                      style={{ fontWeight: 600 }}
                    >
                      <Plus className="h-4 w-4 shrink-0" strokeWidth={2} />
                      Nuevo lead
                    </button>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 border-t border-slate-200/80 pt-6 sm:flex-row sm:items-stretch">
                  <div className="relative min-h-[2.75rem] flex-1">
                    <Search
                      className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
                      strokeWidth={1.75}
                    />
                    <input
                      type="search"
                      placeholder="Buscar por nombre, correo o teléfono…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-full min-h-[2.75rem] w-full rounded-2xl border border-slate-200/90 bg-white py-3 pl-12 pr-4 text-sm text-brand-navy shadow-sm transition-all placeholder:text-slate-400 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
                      style={{ fontWeight: 500 }}
                      autoComplete="off"
                    />
                  </div>
                  <div className="relative sm:w-[min(100%,220px)]">
                    <Filter
                      className="pointer-events-none absolute left-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-slate-400"
                      strokeWidth={1.75}
                    />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="h-full min-h-[2.75rem] w-full appearance-none rounded-2xl border border-slate-200/90 bg-white py-3 pl-10 pr-10 text-sm text-brand-navy shadow-sm transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
                      style={{ fontWeight: 500 }}
                    >
                      <option value="all">Todos los estados</option>
                      {statusSelectOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>
                      <ChevronDown className="h-4 w-4" strokeWidth={2} />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <AddLeadDialog
              open={addLeadOpen}
              onOpenChange={setAddLeadOpen}
              allLeads={leads}
              onAddLead={handleAddLead}
              user={user}
              customKanbanStages={customKanbanStages}
            />

            {leadsView === "kanban" && (
              <LeadsKanbanBoard
                leads={filteredLeads}
                columnStatuses={leadColumnStatuses}
                statusLabel={resolveStatusLabel}
                onStatusChange={handleUpdateLeadStatus}
                onLeadOpen={(l) => openLeadDetail(l, "view")}
                canAddStage={user.role === "lider_grupo"}
                onAddStage={handleAddKanbanStage}
              />
            )}

            {/* Leads Table */}
            {leadsView === "table" && (
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_8px_32px_-10px_rgba(20,28,46,0.1)] ring-1 ring-black/[0.02]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-200/90 bg-gradient-to-r from-slate-50/95 to-white">
                    <tr>
                      <th className="font-heading px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-navy/75" style={{ fontWeight: 600 }}>
                        Lead
                      </th>
                      <th className="font-heading px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-navy/75" style={{ fontWeight: 600 }}>
                        Contacto
                      </th>
                      <th className="font-heading px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-navy/75" style={{ fontWeight: 600 }}>
                        Interés
                      </th>
                      <th className="font-heading px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-navy/75" style={{ fontWeight: 600 }}>
                        Presupuesto
                      </th>
                      <th className="font-heading px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-navy/75" style={{ fontWeight: 600 }}>
                        Estado
                      </th>
                      <th className="font-heading px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-navy/75" style={{ fontWeight: 600 }}>
                        Prioridad
                      </th>
                      <th className="font-heading px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-navy/75" style={{ fontWeight: 600 }}>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-slate-700" style={{ fontWeight: 600 }}>
                                {lead.name.split(" ").map(n => n[0]).join("")}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-slate-900" style={{ fontWeight: 600 }}>{lead.name}</div>
                              <div className="text-xs text-slate-500 mt-0.5" style={{ fontWeight: 500 }}>{lead.source}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs text-slate-700 flex items-center gap-1.5" style={{ fontWeight: 500 }}>
                            <Mail className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
                            {lead.email}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1" style={{ fontWeight: 500 }}>
                            <Phone className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
                            {lead.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900 capitalize" style={{ fontWeight: 600 }}>{lead.interest}</div>
                          <div className="text-xs text-slate-500 mt-0.5" style={{ fontWeight: 500 }}>{lead.propertyType}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-slate-900" style={{ fontWeight: 600 }}>
                            ${lead.budget.toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5" style={{ fontWeight: 500 }}>{lead.location}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={lead.status}
                            onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
                            className={`max-w-[10.5rem] cursor-pointer rounded-lg border border-slate-200/80 py-1.5 pl-2 pr-6 text-xs font-medium ${getStatusColor(lead.status)}`}
                            style={{ fontWeight: 600 }}
                            aria-label={`Cambiar estado de ${lead.name}`}
                          >
                            {statusSelectOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <LeadPriorityBadge stars={lead.priorityStars} size="md" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openLeadDetail(lead, "view")}
                              className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
                              title="Ver"
                            >
                              <Eye className="h-4 w-4" strokeWidth={1.5} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openLeadDetail(lead, "edit")}
                              className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" strokeWidth={1.5} />
                            </button>
                            <button 
                              onClick={() => handleDeleteLead(lead.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" 
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredLeads.length === 0 && (
                <div className="text-center py-16">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" strokeWidth={1.5} />
                  <p className="text-slate-500 text-sm" style={{ fontWeight: 500 }}>No se encontraron leads</p>
                </div>
              )}
            </div>
            )}
          </div>
        )}

        {/* Properties Tab */}
        {activeTab === "properties" && (
          <div className="space-y-6">
            {/* Properties Header */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-1" style={{ fontWeight: 600 }}>Gestión de Propiedades</h2>
                  <p className="text-sm text-slate-600" style={{ fontWeight: 500 }}>
                    {propertiesForSale} en venta · {propertiesForRent} en alquiler · {totalProperties} total
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPropertyForm({ mode: "create", property: null })}
                  className="flex items-center gap-2 rounded-lg bg-[#C8102E] px-5 py-2.5 font-medium text-white transition-all hover:bg-[#a00d25]"
                  style={{ fontWeight: 600 }}
                >
                  <Plus className="h-4.5 w-4.5" strokeWidth={2} />
                  Nueva Propiedad
                </button>
              </div>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <div key={property.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-all group">
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    <img
                      src={property.image}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white/95 backdrop-blur-sm text-slate-900 border border-slate-200" style={{ fontWeight: 600 }}>
                        {property.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <span className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2 block" style={{ letterSpacing: '0.05em', fontWeight: 500 }}>
                      {property.type}
                    </span>
                    <h3 className="font-semibold text-slate-900 mb-2" style={{ fontWeight: 600 }}>{property.title}</h3>
                    <p className="text-sm text-slate-600 mb-4 flex items-center gap-1.5" style={{ fontWeight: 500 }}>
                      <MapPin className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
                      {property.location}
                    </p>
                    
                    <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-200">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Bed className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                        <span className="text-sm font-medium" style={{ fontWeight: 500 }}>{property.bedrooms}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Bath className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                        <span className="text-sm font-medium" style={{ fontWeight: 500 }}>{property.bathrooms}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Square className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                        <span className="text-sm font-medium" style={{ fontWeight: 500 }}>{property.area}m²</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5 uppercase tracking-wide" style={{ letterSpacing: '0.05em', fontWeight: 500 }}>Precio</p>
                        <p className="text-xl font-semibold text-slate-900" style={{ fontWeight: 700 }}>
                          ${property.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/propiedades/${property.id}`)}
                          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
                          title="Ver en el sitio"
                        >
                          <Eye className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPropertyForm({ mode: "edit", property })}
                          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProperty(property.id)}
                          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {properties.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-lg p-20 text-center">
                <div className="max-w-sm mx-auto">
                  <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center mx-auto mb-6">
                    <Home className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2" style={{ fontWeight: 600 }}>
                    No hay propiedades
                  </h3>
                  <p className="text-sm text-slate-600 mb-6" style={{ fontWeight: 500 }}>
                    Comienza agregando tu primera propiedad al catálogo
                  </p>
                  <button
                    type="button"
                    onClick={() => setPropertyForm({ mode: "create", property: null })}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#C8102E] px-6 py-2.5 font-medium text-white transition-all hover:bg-[#a00d25]"
                    style={{ fontWeight: 600 }}
                  >
                    <Plus className="h-4.5 w-4.5" strokeWidth={2} />
                    Nueva Propiedad
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-12 text-center shadow-[0_8px_32px_-10px_rgba(20,28,46,0.1)] md:p-20">
            <div className="mx-auto max-w-md">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                <MessageSquare className="h-8 w-8 text-slate-400" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading mb-2 text-lg text-brand-navy" style={{ fontWeight: 600 }}>
                Centro de Mensajes
              </h3>
              <p className="mb-8 text-sm text-slate-600" style={{ fontWeight: 500 }}>
                Los envíos del formulario de contacto del sitio pueden revisarse en la página pública o por correo.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  to="/contacto"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-brand-red-hover"
                  style={{ fontWeight: 600 }}
                >
                  Ir al formulario de contacto
                  <ChevronRight className="h-4 w-4" strokeWidth={2} />
                </Link>
                <a
                  href="mailto:contacto@viterra.com"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-brand-navy transition-colors hover:bg-slate-50"
                  style={{ fontWeight: 600 }}
                >
                  Abrir cliente de correo
                </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === "site" && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <AdminSiteEditor />
          </div>
        )}

        <LeadDetailDialog
          open={!!leadDialog}
          onOpenChange={(o) => {
            if (!o) setLeadDialog(null);
          }}
          lead={leadDialog?.lead ?? null}
          defaultMode={leadDialog?.mode ?? "view"}
          statusOptions={statusSelectOptions}
          onStatusChange={handleUpdateLeadStatus}
          onSave={handleSaveLead}
          onDelete={handleDeleteLead}
        />

        <PropertyFormDialog
          key={
            propertyForm
              ? `${propertyForm.mode}-${propertyForm.property?.id ?? "new"}`
              : "closed"
          }
          open={!!propertyForm}
          onOpenChange={(o) => {
            if (!o) setPropertyForm(null);
          }}
          mode={propertyForm?.mode ?? "create"}
          property={propertyForm?.mode === "edit" ? propertyForm.property : null}
          newId={nextPropertyId}
          onSave={handleSaveProperty}
        />
      </div>
    </div>
  );
}
