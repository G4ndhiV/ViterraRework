import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from "react";
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
  GripVertical,
  Target,
  Briefcase,
  Globe2,
  Building2,
  LayoutGrid,
  Table2,
  Filter,
  User as UserIcon,
  Link2,
  Download,
  Calendar,
  Settings,
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
  newLeadActivityId,
  newCustomStageId,
  type CustomKanbanStage,
} from "../data/leads";
import { LeadsKanbanBoard } from "../components/admin/LeadsKanbanBoard";
import { LeadPriorityBadge } from "../components/admin/LeadPriorityBadge";
import { AddLeadDialog } from "../components/admin/AddLeadDialog";
import { LeadDetailDialog } from "../components/admin/LeadDetailDialog";
import { PropertyFormDialog } from "../components/admin/PropertyFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { filterLeadsForUser, roleLabelEs } from "../lib/leadsAccess";
import { copyPublicPageUrl } from "../lib/copyPublicLink";
import { mockProperties } from "../data/properties";
import { Property } from "../components/PropertyCard";
import { Development, developments as seedDevelopments } from "../data/developments";
import { AGENDA_STORAGE_KEY } from "../data/agenda";
import { AdminAgendaModule } from "../components/admin/AdminAgendaModule";
import { AdminDevelopmentsManager } from "../components/admin/AdminDevelopmentsManager";
import { AdminCompanySettings } from "../components/admin/AdminCompanySettings";
import { AdminUsersManager } from "../components/admin/AdminUsersManager";
import { PipelineStageReorderRow } from "../components/admin/PipelineStageReorderRow";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
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
import { cn } from "../components/ui/utils";

type TabType =
  | "dashboard"
  | "leads"
  | "pipeline"
  | "agenda"
  | "properties"
  | "developments"
  | "company"
  | "messages";

function dashboardTimeGreetingEs(): string {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return "Buenos días";
  if (h >= 12 && h < 20) return "Buenas tardes";
  return "Buenas noches";
}

export function AdminPage() {
  const navigate = useNavigate();
  const {
    user,
    users,
    logout,
    isAuthenticated,
    createUser,
    updateUser,
    updateUserPassword,
    updateUserPermissions,
    archiveUser,
    reactivateUser,
  } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [companySubtab, setCompanySubtab] = useState<"users" | "site" | "leadStages" | "settings">("users");
  const [stageDraftLabel, setStageDraftLabel] = useState("");
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [developments, setDevelopments] = useState<Development[]>([]);
  const [propertySearchQuery, setPropertySearchQuery] = useState("");
  const [propertyOperationFilter, setPropertyOperationFilter] = useState("all");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("all");
  const [propertyCurrencyFilter, setPropertyCurrencyFilter] = useState("MXN");
  const [propertyMaxPrice, setPropertyMaxPrice] = useState("");
  const [propertyLocationFilter, setPropertyLocationFilter] = useState("all");
  const [adminHeaderQuery, setAdminHeaderQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [leadsView, setLeadsView] = useState<"kanban" | "table">("kanban");
  const [customKanbanStages, setCustomKanbanStages] = useState<CustomKanbanStage[]>([]);
  const [pipelineStageOrder, setPipelineStageOrder] = useState<string[]>([]);
  const [leadDialog, setLeadDialog] = useState<{ lead: Lead; mode: "view" | "edit" } | null>(null);
  const [usersPanelFocus, setUsersPanelFocus] = useState<{ id: string; nonce: number } | null>(null);
  /** Si se abrió la ficha desde un lead (CRM), al cerrar restauramos tab y diálogo del lead. */
  const pendingReturnFromUserDetailRef = useRef<{
    tab: TabType;
    companySubtab: "users" | "site" | "leadStages" | "settings";
    leadsView: "kanban" | "table";
    leadDialog: { lead: Lead; mode: "view" | "edit" } | null;
  } | null>(null);
  const [dashboardRouteSearchOpen, setDashboardRouteSearchOpen] = useState(false);
  const [propertyForm, setPropertyForm] = useState<{
    mode: "create" | "edit";
    property: Property | null;
  } | null>(null);
  const [deletePipelineStage, setDeletePipelineStage] = useState<{ id: string; label: string } | null>(
    null
  );
  const [deletePropertyId, setDeletePropertyId] = useState<string | null>(null);
  const dashboardHeaderRef = useRef<HTMLElement | null>(null);
  const [dashboardHeaderHeightPx, setDashboardHeaderHeightPx] = useState(0);

  useLayoutEffect(() => {
    if (activeTab !== "dashboard") {
      setDashboardHeaderHeightPx(0);
      return;
    }
    const el = dashboardHeaderRef.current;
    if (!el) return;

    const measure = () => {
      setDashboardHeaderHeightPx(Math.ceil(el.getBoundingClientRect().height));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [activeTab, user?.name]);

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

    const savedDevelopments = localStorage.getItem("viterra_admin_developments");
    setDevelopments(savedDevelopments ? JSON.parse(savedDevelopments) : seedDevelopments);

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

    const savedStageOrder = localStorage.getItem("viterra_kanban_stage_order");
    if (savedStageOrder) {
      try {
        const parsed = JSON.parse(savedStageOrder) as unknown;
        if (Array.isArray(parsed)) {
          setPipelineStageOrder(parsed.filter((x): x is string => typeof x === "string"));
        }
      } catch {
        /* ignore */
      }
    }
  }, [navigate, isAuthenticated]);

  useEffect(() => {
    document.body.classList.add("admin-crm-montserrat");
    return () => {
      document.body.classList.remove("admin-crm-montserrat");
    };
  }, []);

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
    if (developments.length > 0) {
      localStorage.setItem("viterra_admin_developments", JSON.stringify(developments));
    }
  }, [developments]);

  useEffect(() => {
    localStorage.setItem("viterra_kanban_custom_stages", JSON.stringify(customKanbanStages));
  }, [customKanbanStages]);

  const allStageIds = useMemo(
    () => [...BUILTIN_STATUS_ORDER, ...customKanbanStages.map((s) => s.id)],
    [customKanbanStages]
  );

  useEffect(() => {
    setPipelineStageOrder((prev) => {
      const normalized = [
        ...prev.filter((id) => allStageIds.includes(id)),
        ...allStageIds.filter((id) => !prev.includes(id)),
      ];
      if (normalized.length === prev.length && normalized.every((id, idx) => id === prev[idx])) {
        return prev;
      }
      return normalized;
    });
  }, [allStageIds]);

  useEffect(() => {
    localStorage.setItem("viterra_kanban_stage_order", JSON.stringify(pipelineStageOrder));
  }, [pipelineStageOrder]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const requestDeleteProperty = (id: string) => {
    setDeletePropertyId(id);
  };

  const executeDeleteProperty = useCallback(() => {
    if (!deletePropertyId) return;
    setProperties((prev) => prev.filter((p) => p.id !== deletePropertyId));
    setPropertyForm((f) => (f?.property?.id === deletePropertyId ? null : f));
    setDeletePropertyId(null);
  }, [deletePropertyId]);

  const handleDeleteLead = (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar este lead?")) {
      setLeads((prev) => prev.filter((l) => l.id !== id));
      setLeadDialog((d) => (d?.lead.id === id ? null : d));
    }
  };

  const handleDeleteDevelopment = useCallback((id: string) => {
    setDevelopments((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const handleSaveDevelopment = useCallback((payload: Development) => {
    setDevelopments((prev) => {
      const exists = prev.some((row) => row.id === payload.id);
      return exists ? prev.map((row) => (row.id === payload.id ? payload : row)) : [...prev, payload];
    });
  }, []);

  const leadColumnStatuses = useMemo(
    () =>
      pipelineStageOrder.length > 0
        ? pipelineStageOrder
        : [...BUILTIN_STATUS_ORDER, ...customKanbanStages.map((s) => s.id)],
    [pipelineStageOrder, customKanbanStages]
  );

  const statusSelectOptions = useMemo(
    () =>
      leadColumnStatuses.map((id) => {
        if (Object.prototype.hasOwnProperty.call(LEAD_STATUS_LABEL, id)) {
          return { value: id, label: LEAD_STATUS_LABEL[id as keyof typeof LEAD_STATUS_LABEL] };
        }
        const custom = customKanbanStages.find((s) => s.id === id);
        return { value: id, label: custom?.label ?? id };
      }),
    [leadColumnStatuses, customKanbanStages]
  );

  const resolveStatusLabel = useCallback(
    (s: string) => labelForLeadStatus(s, customKanbanStages),
    [customKanbanStages]
  );

  const handleUpdateLeadStatus = useCallback((leadId: string, newStatus: string) => {
    const updatedAt = new Date().toISOString();
    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id !== leadId) return lead;
        if (lead.status === newStatus) return lead;
        const prevLabel = resolveStatusLabel(lead.status);
        const nextLabel = resolveStatusLabel(newStatus);
        return {
          ...lead,
          status: newStatus,
          updatedAt,
          activity: [
            {
              id: newLeadActivityId(),
              type: "status_change",
              createdAt: updatedAt,
              description: `Se movió de ${prevLabel} a ${nextLabel}`,
            },
            ...(lead.activity ?? []),
          ],
        };
      })
    );
    setLeadDialog((d) =>
      d && d.lead.id === leadId
        ? { ...d, lead: { ...d.lead, status: newStatus, updatedAt } }
        : d
    );
  }, [resolveStatusLabel]);

  const handleAddKanbanStage = useCallback((label: string) => {
    const id = newCustomStageId();
    setCustomKanbanStages((prev) => [...prev, { id, label }]);
    setPipelineStageOrder((prev) => [...prev, id]);
  }, []);

  const handleUpdateKanbanStage = useCallback((stageId: string, label: string) => {
    setCustomKanbanStages((prev) =>
      prev.map((stage) => (stage.id === stageId ? { ...stage, label } : stage))
    );
  }, []);

  const executeDeleteKanbanStage = useCallback((stageId: string, stageLabel: string) => {
    const updatedAt = new Date().toISOString();
    setCustomKanbanStages((prev) => prev.filter((item) => item.id !== stageId));
    setPipelineStageOrder((prev) => prev.filter((id) => id !== stageId));
    setLeads((prev) =>
      prev.map((lead) =>
        lead.status !== stageId
          ? lead
          : {
              ...lead,
              status: "nuevo",
              updatedAt,
              activity: [
                {
                  id: newLeadActivityId(),
                  type: "status_change",
                  createdAt: updatedAt,
                  description: `La columna ${stageLabel} se eliminó y el lead volvió a Nuevo`,
                },
                ...(lead.activity ?? []),
              ],
            }
      )
    );
    setLeadDialog((current) =>
      current && current.lead.status === stageId
        ? {
            ...current,
            lead: {
              ...current.lead,
              status: "nuevo",
              updatedAt,
            },
          }
        : current
    );
  }, []);

  const requestDeletePipelineStage = useCallback((stageId: string, label: string) => {
    setDeletePipelineStage({ id: stageId, label });
  }, []);

  const handleReorderPipelineRows = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      setPipelineStageOrder((prev) => {
        const base = prev.length > 0 ? prev : allStageIds;
        if (
          dragIndex === hoverIndex ||
          dragIndex < 0 ||
          hoverIndex < 0 ||
          dragIndex >= base.length ||
          hoverIndex >= base.length
        ) {
          return prev;
        }
        const next = [...base];
        const [removed] = next.splice(dragIndex, 1);
        next.splice(hoverIndex, 0, removed);
        return next;
      });
    },
    [allStageIds]
  );

  const handleAddLead = useCallback((lead: Lead) => {
    const createdAt = new Date().toISOString();
    setLeads((prev) => [
      ...prev,
      {
        ...lead,
        activity:
          lead.activity && lead.activity.length > 0
            ? lead.activity
            : [
                {
                  id: newLeadActivityId(),
                  type: "created",
                  createdAt,
                  description: "Lead creado",
                },
              ],
      },
    ]);
  }, []);

  const handleSaveLead = useCallback((updated: Lead) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== updated.id) return l;
        const baseActivity = updated.activity ?? l.activity ?? [];
        const hasNewActivity = baseActivity.length > (l.activity ?? []).length;
        return {
          ...updated,
          activity: hasNewActivity
            ? baseActivity
            : [
                {
                  id: newLeadActivityId(),
                  type: "updated",
                  createdAt: new Date().toISOString(),
                  description: "Se actualizaron los datos del lead",
                },
                ...baseActivity,
              ],
        };
      })
    );
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

  const handleViewTeamMember = useCallback((userId: string) => {
    pendingReturnFromUserDetailRef.current = {
      tab: activeTab,
      companySubtab,
      leadsView,
      leadDialog: leadDialog ? { lead: leadDialog.lead, mode: leadDialog.mode } : null,
    };
    setUsersPanelFocus({ id: userId, nonce: Date.now() });
    setActiveTab("company");
    setCompanySubtab("users");
    setLeadDialog(null);
  }, [activeTab, companySubtab, leadsView, leadDialog]);

  const handleUserDetailClosed = useCallback(() => {
    const ctx = pendingReturnFromUserDetailRef.current;
    pendingReturnFromUserDetailRef.current = null;
    if (!ctx) return;
    setActiveTab(ctx.tab);
    setCompanySubtab(ctx.companySubtab);
    setLeadsView(ctx.leadsView);
    if (ctx.leadDialog) {
      const fresh = leads.find((l) => l.id === ctx.leadDialog.lead.id) ?? ctx.leadDialog.lead;
      setLeadDialog({ lead: fresh, mode: ctx.leadDialog.mode });
    } else {
      setLeadDialog(null);
    }
  }, [leads]);

  const handleUsersPanelFocusConsumed = useCallback(() => {
    setUsersPanelFocus(null);
  }, []);

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

  const filteredProperties = properties.filter((property) => {
    const q = propertySearchQuery.trim().toLowerCase();
    const matchesSearch = !q || (
      property.title.toLowerCase().includes(q) ||
      property.location.toLowerCase().includes(q) ||
      property.type.toLowerCase().includes(q) ||
      property.status.toLowerCase().includes(q)
    );
    const matchesOperation =
      propertyOperationFilter === "all" || property.status === propertyOperationFilter;
    const matchesType =
      propertyTypeFilter === "all" || property.type === propertyTypeFilter;
    const matchesLocation =
      propertyLocationFilter === "all" || property.location === propertyLocationFilter;

    const rawMax = Number(propertyMaxPrice);
    const normalizedPrice =
      propertyCurrencyFilter === "USD" ? property.price : property.price * 17;
    const matchesMaxPrice =
      propertyMaxPrice.trim() === "" || Number.isNaN(rawMax) || normalizedPrice <= rawMax;

    return (
      matchesSearch &&
      matchesOperation &&
      matchesType &&
      matchesLocation &&
      matchesMaxPrice
    );
  });
  const propertyTypeOptions = useMemo(
    () => Array.from(new Set(properties.map((p) => p.type).filter(Boolean))),
    [properties]
  );
  const propertyLocationOptions = useMemo(
    () => Array.from(new Set(properties.map((p) => p.location).filter(Boolean))),
    [properties]
  );

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

  const adminNavigationRoutes = useMemo(
    () => [
      {
        id: "dashboard",
        title: "Dashboard",
        description: "Resumen general del CRM",
        keywords: ["inicio", "resumen", "dashboard", "panel"],
        action: () => setActiveTab("dashboard"),
      },
      {
        id: "leads",
        title: "Leads",
        description: "Pipeline y seguimiento comercial",
        keywords: ["lead", "clientes", "pipeline", "kanban", "prospectos"],
        action: () => setActiveTab("leads"),
      },
      {
        id: "agenda",
        title: "Agenda",
        description: "Calendario semanal y mensual de citas",
        keywords: ["agenda", "calendario", "citas", "semana", "horario"],
        action: () => setActiveTab("agenda"),
      },
      {
        id: "properties",
        title: "Propiedades",
        description: "Catálogo y administración de propiedades",
        keywords: ["propiedades", "inmuebles", "venta", "renta"],
        action: () => setActiveTab("properties"),
      },
      {
        id: "developments",
        title: "Desarrollos",
        description: "Gestión de desarrollos propios",
        keywords: ["desarrollos", "proyectos", "desarrollo"],
        action: () => setActiveTab("developments"),
      },
      {
        id: "company-users",
        title: "Mi empresa · Usuarios",
        description: "Administración de usuarios y permisos",
        keywords: ["usuarios", "mi empresa", "permisos", "roles", "equipo"],
        action: () => {
          setActiveTab("company");
          setCompanySubtab("users");
        },
      },
      {
        id: "company-site",
        title: "Mi empresa · Editar sitio",
        description: "Editor visual del sitio web",
        keywords: ["editar sitio", "sitio", "web", "editor", "contenido"],
        action: () => {
          setActiveTab("company");
          setCompanySubtab("site");
        },
      },
      {
        id: "company-pipeline",
        title: "Mi empresa · Pipeline de leads",
        description: "Configura estados y orden del pipeline",
        keywords: ["estados", "columnas", "pipeline de leads", "kanban", "orden"],
        action: () => {
          setActiveTab("company");
          setCompanySubtab("leadStages");
        },
      },
      {
        id: "company-settings",
        title: "Mi empresa · Configuración",
        description: "Espacio de trabajo, copias de seguridad y datos locales",
        keywords: ["configuración", "ajustes", "respaldo", "localStorage", "mi empresa"],
        action: () => {
          setActiveTab("company");
          setCompanySubtab("settings");
        },
      },
      {
        id: "messages",
        title: "Mensajes",
        description: "Accesos al centro de mensajes",
        keywords: ["mensajes", "contacto", "correo"],
        action: () => setActiveTab("messages"),
      },
      {
        id: "site-home",
        title: "Sitio público · Inicio",
        description: "Ir a la página principal del sitio",
        keywords: ["sitio", "home", "inicio público", "web"],
        action: () => navigate("/"),
      },
      {
        id: "site-properties",
        title: "Sitio público · Propiedades",
        description: "Ir al catálogo público de propiedades",
        keywords: ["sitio propiedades", "catálogo", "propiedades públicas"],
        action: () => navigate("/propiedades"),
      },
      {
        id: "site-developments",
        title: "Sitio público · Desarrollos",
        description: "Ir a la página pública de desarrollos",
        keywords: ["sitio desarrollos", "desarrollos públicos"],
        action: () => navigate("/desarrollos"),
      },
      {
        id: "site-contact",
        title: "Sitio público · Contacto",
        description: "Ir al formulario de contacto",
        keywords: ["contacto", "formulario", "mensaje", "sitio contacto"],
        action: () => navigate("/contacto"),
      },
    ],
    [navigate]
  );

  const headerSearchValue = adminHeaderQuery;
  const headerSearchPlaceholder = "Buscar ruta, módulo, sección o usuario…";

  const filteredAdminRoutes = useMemo(() => {
    const query = adminHeaderQuery.trim().toLowerCase();
    if (!query) return adminNavigationRoutes.slice(0, 6);

    return adminNavigationRoutes
      .filter((route) => {
        const haystack = [route.title, route.description, ...route.keywords].join(" ").toLowerCase();
        return haystack.includes(query);
      })
      .slice(0, 8);
  }, [adminHeaderQuery, adminNavigationRoutes]);

  const filteredDashboardUsers = useMemo(() => {
    const q = adminHeaderQuery.trim().toLowerCase();
    const active = users.filter((u) => u.isActive);
    const sorted = [...active].sort((a, b) => a.name.localeCompare(b.name, "es"));
    if (!q) return sorted.slice(0, 8);
    return sorted
      .filter((u) => {
        const roleLabel = roleLabelEs(u.role).toLowerCase();
        const haystack = [u.name, u.email, roleLabel, u.id].join(" ").toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 8);
  }, [adminHeaderQuery, users]);

  const hasDashboardSearchResults =
    filteredAdminRoutes.length > 0 || filteredDashboardUsers.length > 0;

  const handleHeaderSearchChange = (value: string) => {
    setAdminHeaderQuery(value);
  };

  const handleDashboardRouteSelect = (route: (typeof adminNavigationRoutes)[number]) => {
    route.action();
    setAdminHeaderQuery("");
    setDashboardRouteSearchOpen(false);
  };

  const handleDashboardUserSelect = (userId: string) => {
    handleViewTeamMember(userId);
    setAdminHeaderQuery("");
    setDashboardRouteSearchOpen(false);
  };

  return (
    <div className="viterra-page viterra-crm min-h-screen bg-gradient-to-b from-[#f7f5f2] via-slate-50 to-slate-100">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-[14.5rem] lg:flex-col lg:border-r lg:border-brand-gold/20 lg:bg-brand-navy lg:text-white">
        <div className="border-b border-white/15 px-5 py-5">
          <Link
            to="/"
            aria-label="Ir al inicio del sitio público"
            className="group block rounded-lg px-2 py-1.5 transition-colors hover:bg-white/10"
          >
            <span className="font-heading block font-light leading-tight tracking-[0.22em] text-white sm:text-lg">
              VITERRA
            </span>
            <span className="relative my-2 block h-px w-[11rem] overflow-hidden rounded-full" aria-hidden>
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
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <p className="px-2 pb-2 text-[11px] uppercase tracking-[0.14em] text-white/55" style={{ fontWeight: 600 }}>
            Módulos admin
          </p>
          <nav className="space-y-1.5" aria-label="Navegación del panel admin">
                <button
                  type="button"
                  onClick={() => setActiveTab("dashboard")}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    activeTab === "dashboard" ? "bg-white text-brand-navy" : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" strokeWidth={activeTab === "dashboard" ? 2 : 1.75} />
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("leads")}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    activeTab === "leads" ? "bg-white text-brand-navy" : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Users className="h-4 w-4" strokeWidth={activeTab === "leads" ? 2 : 1.75} />
                  Leads
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("agenda")}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    activeTab === "agenda" ? "bg-white text-brand-navy" : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Calendar className="h-4 w-4" strokeWidth={activeTab === "agenda" ? 2 : 1.75} />
                  Agenda
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("properties")}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    activeTab === "properties" ? "bg-white text-brand-navy" : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Home className="h-4 w-4" strokeWidth={activeTab === "properties" ? 2 : 1.75} />
                  Propiedades
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("developments")}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    activeTab === "developments" ? "bg-white text-brand-navy" : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Building2 className="h-4 w-4" strokeWidth={activeTab === "developments" ? 2 : 1.75} />
                  Desarrollos
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("company")}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    activeTab === "company" ? "bg-white text-brand-navy" : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Briefcase className="h-4 w-4" strokeWidth={activeTab === "company" ? 2 : 1.75} />
                  Mi empresa
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("messages")}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    activeTab === "messages" ? "bg-white text-brand-navy" : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <MessageSquare className="h-4 w-4" strokeWidth={activeTab === "messages" ? 2 : 1.75} />
                  Mensajes
                </button>
          </nav>
        </div>
        <div className="border-t border-white/15 px-5 py-4">
          <p className="truncate text-sm text-white" style={{ fontWeight: 600 }}>{user.name}</p>
          <p className="truncate text-[11px] uppercase tracking-[0.08em] text-white/65">
            {roleLabelEs(user.role)}
          </p>
        </div>
      </aside>

      <div
        data-reveal
        className={`px-4 pb-4 sm:px-6 lg:pl-[16.5rem] lg:pr-8 ${activeTab !== "dashboard" ? "pt-4 sm:pt-4" : ""}`}
        style={
          activeTab === "dashboard"
            ? {
                paddingTop:
                  dashboardHeaderHeightPx > 0
                    ? `calc(0.75rem + ${dashboardHeaderHeightPx}px + 1.5rem)`
                    : "15rem",
              }
            : undefined
        }
      >
        {activeTab === "dashboard" && (
          <header
            ref={dashboardHeaderRef}
            className="fixed left-4 right-4 top-3 z-50 overflow-visible rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white/95 via-white/95 to-slate-50/90 shadow-[0_24px_60px_-18px_rgba(20,28,46,0.22)] ring-1 ring-slate-900/[0.04] backdrop-blur-md sm:left-6 sm:right-6 lg:left-[16.5rem] lg:right-8"
          >
            <div
              className="h-1.5 w-full shrink-0 bg-gradient-to-r from-brand-gold via-primary to-brand-burgundy"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-16 top-14 h-40 w-40 rounded-full bg-gradient-to-br from-primary/[0.1] to-transparent blur-3xl"
              aria-hidden
            />
            <div className="relative px-4 py-4 sm:px-5 sm:py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary"
                    style={{ fontWeight: 600 }}
                  >
                    Panel Viterra
                  </p>
                  <h2
                    className="font-heading mt-1.5 text-[1.25rem] leading-tight text-brand-navy sm:text-[1.45rem]"
                    style={{ fontWeight: 600 }}
                  >
                    {dashboardTimeGreetingEs()}
                    {user?.name?.trim()
                      ? `, ${user.name.trim().split(/\s+/)[0]}`
                      : ""}
                  </h2>
                  <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-slate-600 sm:text-sm" style={{ fontWeight: 500 }}>
                    Bienvenido al panel. Aquí ves el resumen de leads, propiedades y el pulso del negocio.
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end sm:gap-3">
                  <Link
                    to="/"
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-brand-navy"
                    style={{ fontWeight: 600 }}
                  >
                    <Globe2 className="h-4 w-4" strokeWidth={1.8} />
                    Ir al sitio
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                    style={{ fontWeight: 600 }}
                  >
                    <LogOut className="h-4 w-4" strokeWidth={1.8} />
                    Cerrar sesión
                  </button>
                </div>
              </div>

              <div className="relative mt-4 min-w-0">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
                <input
                  type="search"
                  value={headerSearchValue}
                  onChange={(e) => handleHeaderSearchChange(e.target.value)}
                  onFocus={() => setDashboardRouteSearchOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (filteredAdminRoutes[0]) {
                        e.preventDefault();
                        handleDashboardRouteSelect(filteredAdminRoutes[0]);
                      } else if (filteredDashboardUsers[0]) {
                        e.preventDefault();
                        handleDashboardUserSelect(filteredDashboardUsers[0].id);
                      }
                    }
                    if (e.key === "Escape") {
                      setDashboardRouteSearchOpen(false);
                    }
                  }}
                  onBlur={() => {
                    window.setTimeout(() => setDashboardRouteSearchOpen(false), 120);
                  }}
                  placeholder={headerSearchPlaceholder}
                  className="h-10 w-full rounded-xl border border-slate-200/90 bg-white py-2.5 pl-10 pr-3 text-sm text-brand-navy shadow-sm placeholder:text-slate-400 focus:border-primary/45 focus:outline-none focus:ring-2 focus:ring-primary/15"
                  aria-label="Buscar rutas, módulos o usuarios del equipo"
                />
                {dashboardRouteSearchOpen && hasDashboardSearchResults && (
                  <div className="absolute left-0 right-0 top-[calc(100%+0.6rem)] z-[60] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_60px_-18px_rgba(20,28,46,0.2)]">
                    <div className="max-h-[min(24rem,70vh)] overflow-y-auto">
                      {filteredAdminRoutes.length > 0 && (
                        <>
                          <div className="sticky top-0 z-[1] border-b border-slate-100 bg-white px-4 py-2 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                            Rutas sugeridas
                          </div>
                          <div className="py-1.5">
                            {filteredAdminRoutes.map((route) => (
                              <button
                                key={route.id}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleDashboardRouteSelect(route)}
                                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm text-brand-navy" style={{ fontWeight: 600 }}>
                                    {route.title}
                                  </p>
                                  <p className="truncate text-xs text-slate-500">{route.description}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.8} />
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                      {filteredDashboardUsers.length > 0 && (
                        <>
                          <div className="sticky top-0 z-[1] border-b border-slate-100 bg-white px-4 py-2 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                            Usuarios del equipo
                          </div>
                          <div className="py-1.5">
                            {filteredDashboardUsers.map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleDashboardUserSelect(u.id)}
                                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                              >
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <UserIcon className="h-4 w-4" strokeWidth={2} aria-hidden />
                                  </span>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm text-brand-navy" style={{ fontWeight: 600 }}>
                                      {u.name}
                                    </p>
                                    <p className="truncate text-xs text-slate-500">{u.email}</p>
                                    <p className="truncate text-[11px] text-slate-400">{roleLabelEs(u.role)}</p>
                                  </div>
                                </div>
                                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.8} />
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>
        )}

        <div className="mb-6 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm lg:hidden">
          <p className="px-2 pb-2 text-[11px] uppercase tracking-[0.14em] text-slate-500" style={{ fontWeight: 600 }}>
            Módulos admin
          </p>
          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="Navegación del panel admin">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "leads", label: "Leads", icon: Users },
              { id: "agenda", label: "Agenda", icon: Calendar },
              { id: "properties", label: "Propiedades", icon: Home },
              { id: "developments", label: "Desarrollos", icon: Building2 },
              { id: "company", label: "Mi empresa", icon: Briefcase },
              { id: "messages", label: "Mensajes", icon: MessageSquare },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id as TabType)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                  activeTab === item.id ? "bg-brand-navy text-white" : "bg-slate-50 text-slate-700"
                }`}
              >
                <item.icon className="h-4 w-4" strokeWidth={1.75} />
                {item.label}
              </button>
            ))}
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

        {activeTab === "agenda" && <AdminAgendaModule />}

        {/* Properties Tab */}
        {activeTab === "properties" && (
          <div className="space-y-6">
            {/* Properties Header */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white via-white to-slate-50/90 shadow-[0_24px_60px_-18px_rgba(20,28,46,0.14)] ring-1 ring-slate-900/[0.04]">
              <div
                className="h-1.5 w-full bg-gradient-to-r from-brand-gold via-primary to-brand-burgundy"
                aria-hidden
              />
              <div className="p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-1" style={{ fontWeight: 600 }}>Gestión de Propiedades</h2>
                  <p className="text-sm text-slate-600" style={{ fontWeight: 500 }}>
                    Filtra, edita y publica propiedades del catálogo.
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
              <div className="mt-4 relative">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                  <select
                    value={propertyOperationFilter}
                    onChange={(e) => setPropertyOperationFilter(e.target.value)}
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                  >
                    <option value="all">Operación</option>
                    <option value="venta">Venta</option>
                    <option value="alquiler">Alquiler</option>
                  </select>
                  <select
                    value={propertyTypeFilter}
                    onChange={(e) => setPropertyTypeFilter(e.target.value)}
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                  >
                    <option value="all">Tipo de propiedad</option>
                    {propertyTypeOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <select
                    value={propertyCurrencyFilter}
                    onChange={(e) => setPropertyCurrencyFilter(e.target.value)}
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                  >
                    <option value="MXN">MXN</option>
                    <option value="USD">USD</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    value={propertyMaxPrice}
                    onChange={(e) => setPropertyMaxPrice(e.target.value)}
                    placeholder="Sin límite"
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-500"
                  />
                  <select
                    value={propertyLocationFilter}
                    onChange={(e) => setPropertyLocationFilter(e.target.value)}
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                  >
                    <option value="all">Ubicación</option>
                    {propertyLocationOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-3 relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
                <input
                  type="search"
                  value={propertySearchQuery}
                  onChange={(e) => setPropertySearchQuery(e.target.value)}
                  placeholder="Buscar propiedades por título..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-navy placeholder:text-slate-400 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                />
              </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_8px_30px_-8px_rgba(20,28,46,0.1)] ring-1 ring-black/[0.02] transition-all hover:shadow-[0_12px_40px_-10px_rgba(20,28,46,0.14)]">
                <div className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-primary to-brand-burgundy opacity-90" aria-hidden />
                <div className="mb-4 flex items-start justify-between pl-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white shadow-sm">
                    <Home className="h-5 w-5 text-brand-navy" strokeWidth={1.5} />
                  </div>
                  <TrendingUp className="h-4 w-4 text-brand-gold/90" strokeWidth={1.5} />
                </div>
                <p className="font-heading mb-1 text-[11px] uppercase tracking-[0.14em] text-slate-500" style={{ fontWeight: 600 }}>
                  Total propiedades
                </p>
                <p className="font-heading mb-1 text-3xl text-brand-navy" style={{ fontWeight: 700 }}>
                  {totalProperties}
                </p>
                <p className="text-xs text-slate-500" style={{ fontWeight: 500 }}>
                  Inventario en el panel
                </p>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_8px_30px_-8px_rgba(20,28,46,0.1)] ring-1 ring-black/[0.02] transition-all hover:shadow-[0_12px_40px_-10px_rgba(20,28,46,0.14)]">
                <div className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-brand-burgundy to-brand-gold opacity-90" aria-hidden />
                <div className="mb-4 flex items-start justify-between pl-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white shadow-sm">
                    <Target className="h-5 w-5 text-brand-navy" strokeWidth={1.5} />
                  </div>
                  <Activity className="h-4 w-4 text-brand-gold/90" strokeWidth={1.5} />
                </div>
                <p className="font-heading mb-1 text-[11px] uppercase tracking-[0.14em] text-slate-500" style={{ fontWeight: 600 }}>
                  En venta
                </p>
                <p className="font-heading mb-1 text-3xl text-brand-navy" style={{ fontWeight: 700 }}>
                  {propertiesForSale}
                </p>
                <p className="text-xs text-slate-500" style={{ fontWeight: 500 }}>
                  Listadas como venta
                </p>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_8px_30px_-8px_rgba(20,28,46,0.1)] ring-1 ring-black/[0.02] transition-all hover:shadow-[0_12px_40px_-10px_rgba(20,28,46,0.14)]">
                <div className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-brand-navy to-slate-600 opacity-90" aria-hidden />
                <div className="mb-4 flex items-start justify-between pl-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white shadow-sm">
                    <MapPin className="h-5 w-5 text-brand-navy" strokeWidth={1.5} />
                  </div>
                  <Briefcase className="h-4 w-4 text-brand-gold/90" strokeWidth={1.5} />
                </div>
                <p className="font-heading mb-1 text-[11px] uppercase tracking-[0.14em] text-slate-500" style={{ fontWeight: 600 }}>
                  En alquiler
                </p>
                <p className="font-heading mb-1 text-3xl text-brand-navy" style={{ fontWeight: 700 }}>
                  {propertiesForRent}
                </p>
                <p className="text-xs text-slate-500" style={{ fontWeight: 500 }}>
                  Listadas como alquiler
                </p>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_8px_30px_-8px_rgba(20,28,46,0.1)] ring-1 ring-black/[0.02] transition-all hover:shadow-[0_12px_40px_-10px_rgba(20,28,46,0.14)]">
                <div className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-brand-gold to-primary opacity-90" aria-hidden />
                <div className="mb-4 flex items-start justify-between pl-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white shadow-sm">
                    <DollarSign className="h-5 w-5 text-brand-navy" strokeWidth={1.5} />
                  </div>
                  <TrendingUp className="h-4 w-4 text-brand-gold/90" strokeWidth={1.5} />
                </div>
                <p className="font-heading mb-1 text-[11px] uppercase tracking-[0.14em] text-slate-500" style={{ fontWeight: 600 }}>
                  Valor promedio
                </p>
                <p className="font-heading mb-1 text-3xl text-brand-navy" style={{ fontWeight: 700 }}>
                  ${parseInt(avgPropertyPrice, 10).toLocaleString()}
                </p>
                <p className="text-xs text-slate-500" style={{ fontWeight: 500 }}>
                  Por propiedad (precio listado)
                </p>
              </div>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <div key={property.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-all group">
                  <button
                    type="button"
                    onClick={() => setPropertyForm({ mode: "edit", property })}
                    className="relative block h-48 w-full cursor-pointer overflow-hidden bg-slate-100 p-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50"
                    aria-label={`Abrir ficha: ${property.title}`}
                  >
                    <img
                      src={property.image}
                      alt=""
                      className="pointer-events-none h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="pointer-events-none absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white/95 backdrop-blur-sm text-slate-900 border border-slate-200" style={{ fontWeight: 600 }}>
                        {property.status.toUpperCase()}
                      </span>
                    </div>
                  </button>
                  
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
                          onClick={() => copyPublicPageUrl(`/propiedades/${property.id}`)}
                          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
                          title="Copiar enlace público"
                          aria-label="Copiar enlace público"
                        >
                          <Link2 className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
                          title="Exportar información (próximamente)"
                          aria-label="Exportar información"
                        >
                          <Download className="h-4 w-4" strokeWidth={1.5} />
                        </button>
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
                          onClick={() => requestDeleteProperty(property.id)}
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

            {filteredProperties.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-lg p-20 text-center">
                <div className="max-w-sm mx-auto">
                  <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center mx-auto mb-6">
                    <Home className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2" style={{ fontWeight: 600 }}>
                    {properties.length === 0 ? "No hay propiedades" : "Sin resultados"}
                  </h3>
                  <p className="text-sm text-slate-600 mb-6" style={{ fontWeight: 500 }}>
                    {properties.length === 0
                      ? "Comienza agregando tu primera propiedad al catálogo"
                      : "Prueba con otro término de búsqueda."}
                  </p>
                  {properties.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setPropertyForm({ mode: "create", property: null })}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#C8102E] px-6 py-2.5 font-medium text-white transition-all hover:bg-[#a00d25]"
                      style={{ fontWeight: 600 }}
                    >
                      <Plus className="h-4.5 w-4.5" strokeWidth={2} />
                      Nueva Propiedad
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "developments" && (
          <AdminDevelopmentsManager
            developments={developments}
            onSave={handleSaveDevelopment}
            onDelete={handleDeleteDevelopment}
          />
        )}

        {activeTab === "company" && (
          <div className="space-y-5">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white via-white to-slate-50/90 shadow-[0_24px_60px_-18px_rgba(20,28,46,0.14)] ring-1 ring-slate-900/[0.04]">
              <div
                className="h-1.5 w-full bg-gradient-to-r from-brand-gold via-primary to-brand-burgundy"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -right-20 top-8 h-56 w-56 rounded-full bg-gradient-to-br from-primary/[0.07] to-transparent blur-3xl"
                aria-hidden
              />
              <div className="relative px-5 pb-6 pt-6 md:px-8 md:pb-7 md:pt-7">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary"
                  style={{ fontWeight: 600 }}
                >
                  Centro de administración
                </p>
                <h2 className="font-heading mt-2 text-2xl tracking-tight text-brand-navy sm:text-3xl" style={{ fontWeight: 700 }}>
                  Mi empresa
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600" style={{ fontWeight: 500 }}>
                  Equipo, sitio, embudo comercial y ajustes del espacio de trabajo. Elige un área para continuar.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
              {(
                [
                  {
                    id: "users" as const,
                    title: "Equipo y accesos",
                    desc: "Usuarios del CRM, roles y permisos.",
                    icon: Users,
                  },
                  {
                    id: "site" as const,
                    title: "Sitio web",
                    desc: "Contenido y bloques del sitio público.",
                    icon: Globe2,
                  },
                  {
                    id: "leadStages" as const,
                    title: "Pipeline de ventas",
                    desc: "Columnas del Kanban y etapas personalizadas.",
                    icon: LayoutGrid,
                  },
                  {
                    id: "settings" as const,
                    title: "Configuración",
                    desc: "Espacio de trabajo, respaldos y accesos.",
                    icon: Settings,
                  },
                ] as const
              ).map((item) => {
                const active = companySubtab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCompanySubtab(item.id)}
                    className={cn(
                      "group flex w-full flex-row items-center gap-3 rounded-xl border px-3 py-2 text-left transition-all duration-200",
                      active
                        ? "border-primary/35 bg-gradient-to-br from-primary/[0.07] via-white to-white shadow-[0_12px_32px_-16px_rgba(200,16,46,0.25)] ring-2 ring-primary/15"
                        : "border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-md",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
                        active
                          ? "border-primary/25 bg-primary/10 text-primary"
                          : "border-slate-200/90 bg-slate-50 text-slate-600 group-hover:border-slate-300 group-hover:bg-white",
                      )}
                    >
                      <item.icon className="h-4 w-4" strokeWidth={active ? 2 : 1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "font-heading text-sm leading-tight",
                          active ? "text-brand-navy" : "text-slate-900",
                        )}
                        style={{ fontWeight: 600 }}
                      >
                        {item.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-500" style={{ fontWeight: 500 }}>
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_48px_-28px_rgba(20,28,46,0.14)] ring-1 ring-black/[0.03]">
              {companySubtab === "users" && user && (
                <div className="p-5 md:p-8">
                  <AdminUsersManager
                    currentUser={user}
                    users={users}
                    onCreateUser={(input) => createUser(input, user.name)}
                    onUpdateUser={(id, input) => updateUser(id, input, user.name)}
                    onUpdatePassword={(id, password) => updateUserPassword(id, password, user.name)}
                    onUpdatePermissions={(id, role, permissions) =>
                      updateUserPermissions(id, role, permissions, user.name)
                    }
                    onArchive={(id) => archiveUser(id, user.name)}
                    onReactivate={(id) => reactivateUser(id, user.name)}
                    focusUser={usersPanelFocus}
                    onFocusUserConsumed={handleUsersPanelFocusConsumed}
                    onUserDetailClosed={handleUserDetailClosed}
                  />
                </div>
              )}
              {companySubtab === "site" && (
                <div className="p-5 md:p-8">
                  <AdminSiteEditor />
                </div>
              )}
              {companySubtab === "settings" && (
                <AdminCompanySettings
                  counts={{
                    leads: leads.length,
                    properties: properties.length,
                    developments: developments.length,
                    users: users.length,
                    agenda: (() => {
                      try {
                        const raw = localStorage.getItem(AGENDA_STORAGE_KEY);
                        if (!raw) return 0;
                        const p = JSON.parse(raw) as unknown;
                        return Array.isArray(p) ? p.length : 0;
                      } catch {
                        return 0;
                      }
                    })(),
                  }}
                  onNavigate={(spec) => {
                    if (spec.type === "tab") {
                      setActiveTab(spec.tab);
                    } else {
                      setActiveTab("company");
                      setCompanySubtab(spec.sub);
                    }
                  }}
                />
              )}
              {companySubtab === "leadStages" && (
                <div className="flex flex-col gap-6 p-5 md:p-8">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-primary" style={{ fontWeight: 600 }}>
                        Embudo comercial
                      </p>
                      <h3 className="mt-1 text-2xl text-brand-navy" style={{ fontWeight: 600 }}>
                        Pipeline de leads
                      </h3>
                      <p className="mt-2 text-sm text-slate-600" style={{ fontWeight: 500 }}>
                        Reordena, crea, edita o elimina estados del pipeline. El orden impacta directamente las columnas del Kanban.
                      </p>
                    </div>
                    <div className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_auto] lg:max-w-xl">
                      <input
                        type="text"
                        value={stageDraftLabel}
                        onChange={(e) => setStageDraftLabel(e.target.value)}
                        placeholder="Nueva columna del pipeline"
                        className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-brand-navy placeholder:text-slate-400 focus:border-primary/45 focus:outline-none focus:ring-2 focus:ring-primary/15"
                        disabled={user.role !== "admin"}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const label = stageDraftLabel.trim();
                          if (!label) return;
                          handleAddKanbanStage(label);
                          setStageDraftLabel("");
                        }}
                        disabled={user.role !== "admin" || !stageDraftLabel.trim()}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm text-white transition hover:bg-brand-red-hover disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ fontWeight: 600 }}
                      >
                        <Plus className="h-4 w-4" strokeWidth={2} />
                        Agregar estado
                      </button>
                    </div>
                  </div>

                  {user.role !== "admin" && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      Solo los administradores pueden modificar las columnas del pipeline.
                    </div>
                  )}

                  <section className="rounded-2xl border border-slate-200/70 bg-slate-50/40 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-base text-brand-navy" style={{ fontWeight: 600 }}>Orden de columnas del pipeline</h4>
                        <p className="mt-1 text-sm text-slate-500">
                          Arrastra cada fila para ordenar las columnas del Kanban (estados del sistema y personalizados).
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500 ring-1 ring-slate-200">
                        {leadColumnStatuses.length} estados
                      </span>
                    </div>

                    <DndProvider backend={HTML5Backend}>
                    <div className="mt-4 space-y-3">
                      {leadColumnStatuses.map((stageId, index) => {
                        const customStage = customKanbanStages.find((stage) => stage.id === stageId);
                        const isBuiltin = Object.prototype.hasOwnProperty.call(LEAD_STATUS_LABEL, stageId);
                        const stageLabel = isBuiltin
                          ? LEAD_STATUS_LABEL[stageId as keyof typeof LEAD_STATUS_LABEL]
                          : customStage?.label ?? stageId;
                        const isEditing = editingStageId === stageId;
                        const leadsInStage = leads.filter((lead) => lead.status === stageId).length;

                        return (
                          <PipelineStageReorderRow
                            key={stageId}
                            index={index}
                            moveRow={handleReorderPipelineRows}
                            canDrag={user.role === "admin"}
                          >
                          <div
                            className={`rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 ${
                              user.role === "admin" ? "cursor-grab active:cursor-grabbing" : ""
                            }`}
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                              {user.role === "admin" && (
                                <div
                                  className="flex shrink-0 items-center justify-center text-slate-400 lg:pt-0.5"
                                  aria-hidden
                                >
                                  <GripVertical className="h-5 w-5" strokeWidth={1.75} />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={stageDraftLabel}
                                    onChange={(e) => setStageDraftLabel(e.target.value)}
                                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-brand-navy focus:border-primary/45 focus:outline-none focus:ring-2 focus:ring-primary/15"
                                    disabled={user.role !== "admin"}
                                  />
                                ) : (
                                  <>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-sm text-brand-navy" style={{ fontWeight: 600 }}>
                                        {stageLabel}
                                      </p>
                                      <span
                                        className={`rounded-full px-2.5 py-0.5 text-[11px] uppercase tracking-[0.08em] ${
                                          isBuiltin ? "bg-slate-100 text-slate-600" : "bg-primary/10 text-primary"
                                        }`}
                                      >
                                        {isBuiltin ? "Sistema" : "Personalizado"}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">
                                      Clave: {stageId} · {leadsInStage} lead{leadsInStage === 1 ? "" : "s"} en esta etapa
                                    </p>
                                  </>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {isEditing ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const label = stageDraftLabel.trim();
                                        if (!label) return;
                                        handleUpdateKanbanStage(stageId, label);
                                        setEditingStageId(null);
                                        setStageDraftLabel("");
                                      }}
                                      disabled={user.role !== "admin" || !stageDraftLabel.trim()}
                                      className="inline-flex items-center rounded-lg bg-brand-navy px-3 py-2 text-xs text-white transition hover:bg-[#1e2a45] disabled:cursor-not-allowed disabled:opacity-50"
                                      style={{ fontWeight: 600 }}
                                    >
                                      Guardar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingStageId(null);
                                        setStageDraftLabel("");
                                      }}
                                      className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 transition hover:bg-slate-50"
                                      style={{ fontWeight: 600 }}
                                    >
                                      Cancelar
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    {!isBuiltin && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingStageId(stageId);
                                            setStageDraftLabel(stageLabel);
                                          }}
                                          disabled={user.role !== "admin"}
                                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                          style={{ fontWeight: 600 }}
                                        >
                                          <Edit className="h-3.5 w-3.5" strokeWidth={1.8} />
                                          Editar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => requestDeletePipelineStage(stageId, stageLabel)}
                                          disabled={user.role !== "admin"}
                                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                          style={{ fontWeight: 600 }}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                                          Eliminar
                                        </button>
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          </PipelineStageReorderRow>
                        );
                      })}
                    </div>
                    </DndProvider>
                  </section>
                </div>
              )}
            </section>
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
          teamUsers={users}
          currentUserId={user?.id ?? ""}
          onViewTeamMember={handleViewTeamMember}
        />

        <AlertDialog
          open={!!deletePipelineStage}
          onOpenChange={(open) => {
            if (!open) setDeletePipelineStage(null);
          }}
        >
          <AlertDialogContent className="max-w-md gap-0 overflow-hidden rounded-2xl border border-stone-200/90 p-0 shadow-[0_24px_60px_-18px_rgba(20,28,46,0.22)] sm:max-w-md">
            <div
              className="h-1.5 w-full bg-gradient-to-r from-brand-gold via-primary to-brand-burgundy"
              aria-hidden
            />
            <div className="px-6 pb-2 pt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary" style={{ fontWeight: 600 }}>
                CRM · Pipeline
              </p>
              <AlertDialogHeader className="mt-2 space-y-2 text-left">
                <AlertDialogTitle className="font-heading text-xl text-brand-navy" style={{ fontWeight: 600 }}>
                  ¿Eliminar esta columna?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-relaxed text-slate-600" style={{ fontWeight: 500 }}>
                  Vas a eliminar la columna{" "}
                  <span className="font-semibold text-brand-navy">«{deletePipelineStage?.label}»</span>. Los leads que
                  estén en esta etapa volverán al estado <span className="font-semibold text-brand-navy">Nuevo</span>.
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            <AlertDialogFooter className="flex-col-reverse gap-2 border-t border-stone-200/80 bg-stone-50/90 px-6 py-4 sm:flex-row sm:justify-end">
              <AlertDialogCancel className="mt-0 border-stone-300 bg-white text-slate-700 hover:bg-stone-50 hover:text-slate-800">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-primary text-primary-foreground hover:bg-brand-red-hover"
                style={{ fontWeight: 600 }}
                onClick={() => {
                  if (deletePipelineStage) {
                    executeDeleteKanbanStage(deletePipelineStage.id, deletePipelineStage.label);
                    setDeletePipelineStage(null);
                  }
                }}
              >
                Eliminar columna
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={!!deletePropertyId}
          onOpenChange={(open) => {
            if (!open) setDeletePropertyId(null);
          }}
        >
          <AlertDialogContent className="max-w-md gap-0 overflow-hidden rounded-2xl border border-stone-200/90 p-0 shadow-[0_24px_60px_-18px_rgba(20,28,46,0.22)] sm:max-w-md">
            <div
              className="h-1.5 w-full bg-gradient-to-r from-brand-gold via-primary to-brand-burgundy"
              aria-hidden
            />
            <div className="px-6 pb-2 pt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary" style={{ fontWeight: 600 }}>
                Panel admin · Propiedades
              </p>
              <AlertDialogHeader className="mt-2 space-y-2 text-left">
                <AlertDialogTitle className="font-heading text-xl text-brand-navy" style={{ fontWeight: 600 }}>
                  ¿Eliminar esta propiedad?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-relaxed text-slate-600" style={{ fontWeight: 500 }}>
                  {deletePropertyId ? (
                    <>
                      Vas a eliminar{" "}
                      <span className="font-semibold text-brand-navy">
                        «{properties.find((p) => p.id === deletePropertyId)?.title ?? "esta propiedad"}»
                      </span>
                      . Esta acción no se puede deshacer y la ficha dejará de mostrarse en el catálogo público.
                    </>
                  ) : (
                    "Esta acción no se puede deshacer."
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            <AlertDialogFooter className="flex-col-reverse gap-2 border-t border-stone-200/80 bg-stone-50/90 px-6 py-4 sm:flex-row sm:justify-end">
              <AlertDialogCancel className="mt-0 border-stone-300 bg-white text-slate-700 hover:bg-stone-50 hover:text-slate-800">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-primary text-primary-foreground hover:bg-brand-red-hover"
                style={{ fontWeight: 600 }}
                onClick={executeDeleteProperty}
              >
                Eliminar propiedad
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
