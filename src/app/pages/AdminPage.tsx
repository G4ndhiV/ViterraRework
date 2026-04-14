import { useState, useEffect } from "react";
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
  Target,
  Briefcase,
  Columns3,
  Globe2,
} from "lucide-react";
import { AdminSiteEditor } from "../components/admin/AdminSiteEditor";
import { useAuth } from "../contexts/AuthContext";
import { mockLeads, Lead } from "../data/leads";
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
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Verificar autenticación y cargar datos
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const savedLeads = localStorage.getItem("viterra_leads");
    setLeads(savedLeads ? JSON.parse(savedLeads) : mockLeads);

    const savedProperties = localStorage.getItem("viterra_properties");
    setProperties(savedProperties ? JSON.parse(savedProperties) : mockProperties);
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
      setLeads(leads.filter(l => l.id !== id));
    }
  };

  const handleUpdateLeadStatus = (leadId: string, newStatus: Lead['status']) => {
    setLeads(leads.map(lead =>
      lead.id === leadId
        ? { ...lead, status: newStatus, updatedAt: new Date().toISOString() }
        : lead
    ));
  };

  // Stats calculations
  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === "Nuevo").length;
  const closedDeals = leads.filter(l => l.status === "Cerrado").length;
  const totalProperties = properties.length;
  const propertiesForSale = properties.filter(p => p.status === "venta").length;
  const propertiesForRent = properties.filter(p => p.status === "alquiler").length;

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lead.phone.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pipeline data por estado
  const pipelineColumns: { status: Lead['status']; leads: Lead[] }[] = [
    { status: 'Nuevo', leads: leads.filter(l => l.status === 'Nuevo') },
    { status: 'Contactado', leads: leads.filter(l => l.status === 'Contactado') },
    { status: 'Visita', leads: leads.filter(l => l.status === 'Visita') },
    { status: 'Propuesta', leads: leads.filter(l => l.status === 'Propuesta') },
    { status: 'Cerrado', leads: leads.filter(l => l.status === 'Cerrado') },
    { status: 'Perdido', leads: leads.filter(l => l.status === 'Perdido') }
  ];

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
    { name: "Website", value: leads.filter(l => l.source === "Website").length },
    { name: "Facebook", value: leads.filter(l => l.source === "Facebook").length },
    { name: "Instagram", value: leads.filter(l => l.source === "Instagram").length },
    { name: "Google", value: leads.filter(l => l.source === "Google").length },
    { name: "Referido", value: leads.filter(l => l.source === "Referido").length },
  ];

  const conversionRate = totalLeads > 0 ? ((closedDeals / totalLeads) * 100).toFixed(1) : "0";
  const totalValue = properties.reduce((sum, p) => sum + p.price, 0);
  const avgPropertyPrice = properties.length > 0 ? (totalValue / properties.length).toFixed(0) : "0";

  const getStatusColor = (status: Lead['status']) => {
    const colors = {
      Nuevo: "bg-slate-100 text-slate-700 border border-slate-200",
      Contactado: "bg-amber-50 text-amber-700 border border-amber-200",
      Visita: "bg-blue-50 text-blue-700 border border-blue-200",
      Propuesta: "bg-purple-50 text-purple-700 border border-purple-200",
      Cerrado: "bg-green-50 text-green-700 border border-green-200",
      Perdido: "bg-gray-100 text-gray-600 border border-gray-200"
    };
    return colors[status] || "bg-gray-100 text-gray-600";
  };

  const getPriorityColor = (priority: Lead["priority"]) => {
    const colors: Record<Lead["priority"], string> = {
      alta: "text-red-700 font-semibold",
      media: "text-amber-700 font-medium",
      baja: "text-slate-600 font-medium",
    };
    return colors[priority] ?? "text-slate-600";
  };

  if (!user) {
    return null;
  }

  return (
    <div className="viterra-page min-h-screen bg-slate-50" >
      {/* Misma línea visual que el header del sitio (inicio): navy, VITERRA + trazo rojo, Poppins */}
      <header
        className="sticky top-0 z-50 border-b border-white/10 bg-brand-navy text-white shadow-sm shadow-black/10"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[72px] items-center justify-between gap-4">
            <Link
              to="/"
              aria-label="Ir al inicio del sitio público"
              className="group flex min-w-0 items-center rounded-lg px-2 py-1.5 -ml-2 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy active:bg-white/[0.12]"
            >
              <div className="min-w-0 text-left">
                <span className="block font-light leading-tight tracking-[0.2em] text-white transition group-hover:text-white sm:text-lg">
                  VITERRA
                </span>
                <span className="relative my-2 block h-px w-[min(100%,11rem)] max-w-[11rem] overflow-hidden rounded-full" aria-hidden>
                  <span className="absolute inset-0 bg-white/50" />
                  <span className="absolute inset-0 origin-left bg-[#C8102E]" style={{ transform: "scaleX(0.55)" }} />
                </span>
                <p className="text-[10px] font-normal uppercase tracking-[0.22em] text-white/70 group-hover:text-white/85">
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
                aria-label={`Sesión: ${user.name}, ${user.role}`}
              >
                <div className="hidden min-w-0 text-right sm:block">
                  <p className="truncate text-sm font-semibold text-white" style={{ fontWeight: 600 }}>
                    {user.name}
                  </p>
                  <p className="truncate text-xs capitalize text-white/60" style={{ fontWeight: 500 }}>
                    {user.role}
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

      <div data-reveal className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {/* Tabs Navigation - Elegante */}
        <div className="mb-10">
          <nav className="flex gap-8 border-b border-slate-200">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`pb-4 px-1 font-medium transition-all border-b-2 -mb-px ${
                activeTab === "dashboard"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-900"
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
              className={`pb-4 px-1 font-medium transition-all border-b-2 -mb-px ${
                activeTab === "leads"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
              style={{ fontWeight: activeTab === "leads" ? 600 : 500 }}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4.5 h-4.5" strokeWidth={activeTab === "leads" ? 2 : 1.5} />
                Leads
                <span className="px-2 py-0.5 rounded-md text-xs bg-slate-100 text-slate-700 font-semibold" style={{ fontWeight: 600 }}>
                  {totalLeads}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("properties")}
              className={`pb-4 px-1 font-medium transition-all border-b-2 -mb-px ${
                activeTab === "properties"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
              style={{ fontWeight: activeTab === "properties" ? 600 : 500 }}
            >
              <div className="flex items-center gap-2.5">
                <Home className="w-4.5 h-4.5" strokeWidth={activeTab === "properties" ? 2 : 1.5} />
                Propiedades
                <span className="px-2 py-0.5 rounded-md text-xs bg-slate-100 text-slate-700 font-semibold" style={{ fontWeight: 600 }}>
                  {totalProperties}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={`pb-4 px-1 font-medium transition-all border-b-2 -mb-px ${
                activeTab === "messages"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-900"
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
              className={`pb-4 px-1 font-medium transition-all border-b-2 -mb-px ${
                activeTab === "site"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-900"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white border border-slate-200 rounded-lg p-6 hover:border-slate-300 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-slate-700" strokeWidth={1.5} />
                  </div>
                  <TrendingUp className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                </div>
                <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-medium" style={{ letterSpacing: '0.05em', fontWeight: 500 }}>Total Leads</p>
                <p className="text-3xl font-semibold text-slate-900 mb-1" style={{ fontWeight: 700 }}>{totalLeads}</p>
                <p className="text-xs text-slate-500" style={{ fontWeight: 500 }}>+{newLeads} este mes</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-6 hover:border-slate-300 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-slate-700" strokeWidth={1.5} />
                  </div>
                  <Activity className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                </div>
                <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-medium" style={{ letterSpacing: '0.05em', fontWeight: 500 }}>Conversión</p>
                <p className="text-3xl font-semibold text-slate-900 mb-1" style={{ fontWeight: 700 }}>{conversionRate}%</p>
                <p className="text-xs text-slate-500" style={{ fontWeight: 500 }}>{closedDeals} cerrados</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-6 hover:border-slate-300 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center">
                    <Home className="w-5 h-5 text-slate-700" strokeWidth={1.5} />
                  </div>
                  <Briefcase className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                </div>
                <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-medium" style={{ letterSpacing: '0.05em', fontWeight: 500 }}>Propiedades</p>
                <p className="text-3xl font-semibold text-slate-900 mb-1" style={{ fontWeight: 700 }}>{totalProperties}</p>
                <p className="text-xs text-slate-500" style={{ fontWeight: 500 }}>{propertiesForSale} venta · {propertiesForRent} alquiler</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-6 hover:border-slate-300 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-slate-700" strokeWidth={1.5} />
                  </div>
                  <TrendingUp className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                </div>
                <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-medium" style={{ letterSpacing: '0.05em', fontWeight: 500 }}>Valor Promedio</p>
                <p className="text-3xl font-semibold text-slate-900 mb-1" style={{ fontWeight: 700 }}>${parseInt(avgPropertyPrice).toLocaleString()}</p>
                <p className="text-xs text-slate-500" style={{ fontWeight: 500 }}>por propiedad</p>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Leads Trend */}
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <div className="mb-6">
                  <h3 className="text-base font-semibold text-slate-900" style={{ fontWeight: 600 }}>Tendencia de Leads</h3>
                  <p className="text-sm text-slate-500 mt-1" style={{ fontWeight: 500 }}>Últimos 6 meses</p>
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
                        fontFamily: 'Poppins, sans-serif',
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
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <div className="mb-6">
                  <h3 className="text-base font-semibold text-slate-900" style={{ fontWeight: 600 }}>Fuentes de Adquisición</h3>
                  <p className="text-sm text-slate-500 mt-1" style={{ fontWeight: 500 }}>Canales de origen</p>
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
                        fontFamily: 'Poppins, sans-serif',
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
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-semibold text-slate-900" style={{ fontWeight: 600 }}>Actividad Reciente</h3>
                  <button className="text-sm text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1" style={{ fontWeight: 500 }}>
                    Ver todos
                    <ChevronRight className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
                <div className="space-y-1">
                  {leads.slice(0, 5).map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
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
                        {lead.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-semibold text-slate-900" style={{ fontWeight: 600 }}>Propiedades Destacadas</h3>
                  <button className="text-sm text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1" style={{ fontWeight: 500 }}>
                    Ver todas
                    <ChevronRight className="w-4 h-4" strokeWidth={2} />
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
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex flex-col lg:flex-row justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-1" style={{ fontWeight: 600 }}>Gestión de Leads</h2>
                  <p className="text-sm text-slate-600" style={{ fontWeight: 500 }}>Administra y da seguimiento a tus clientes potenciales</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-slate-400" strokeWidth={1.5} />
                    <input
                      type="text"
                      placeholder="Buscar leads..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-sm"
                      style={{ fontWeight: 500 }}
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-sm bg-white"
                    style={{ fontWeight: 500 }}
                  >
                    <option value="all">Todos</option>
                    <option value="nuevo">Nuevos</option>
                    <option value="contactado">Contactados</option>
                    <option value="calificado">Calificados</option>
                    <option value="negociacion">Negociación</option>
                    <option value="cerrado">Cerrados</option>
                    <option value="perdido">Perdidos</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Leads Table */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ fontWeight: 600, letterSpacing: '0.05em' }}>
                        Lead
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ fontWeight: 600, letterSpacing: '0.05em' }}>
                        Contacto
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ fontWeight: 600, letterSpacing: '0.05em' }}>
                        Interés
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ fontWeight: 600, letterSpacing: '0.05em' }}>
                        Presupuesto
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ fontWeight: 600, letterSpacing: '0.05em' }}>
                        Estado
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ fontWeight: 600, letterSpacing: '0.05em' }}>
                        Prioridad
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider" style={{ fontWeight: 600, letterSpacing: '0.05em' }}>
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
                          <span className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize ${getStatusColor(lead.status)}`} style={{ fontWeight: 600 }}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm capitalize ${getPriorityColor(lead.priority)}`}>
                            {lead.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all" title="Ver">
                              <Eye className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all" title="Editar">
                              <Edit className="w-4 h-4" strokeWidth={1.5} />
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
                <button className="bg-[#C8102E] text-white px-5 py-2.5 rounded-lg hover:bg-[#a00d25] transition-all font-medium flex items-center gap-2" style={{ fontWeight: 600 }}>
                  <Plus className="w-4.5 h-4.5" strokeWidth={2} />
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
                        <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all" title="Ver">
                          <Eye className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all" title="Editar">
                          <Edit className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                        <button 
                          onClick={() => handleDeleteProperty(property.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" 
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
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
                  <button className="bg-[#C8102E] text-white px-6 py-2.5 rounded-lg hover:bg-[#a00d25] transition-all font-medium inline-flex items-center gap-2" style={{ fontWeight: 600 }}>
                    <Plus className="w-4.5 h-4.5" strokeWidth={2} />
                    Nueva Propiedad
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div className="bg-white border border-slate-200 rounded-lg p-20 text-center">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2" style={{ fontWeight: 600 }}>
                Centro de Mensajes
              </h3>
              <p className="text-sm text-slate-600" style={{ fontWeight: 500 }}>
                Gestiona todos los mensajes de contacto de tus clientes
              </p>
            </div>
          </div>
        )}

        {activeTab === "site" && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <AdminSiteEditor />
          </div>
        )}
      </div>
    </div>
  );
}
