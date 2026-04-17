import { useEffect, useMemo, useState, type ComponentType } from "react";
import {
  ArchiveRestore,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Edit,
  Globe2,
  History,
  Home,
  KeyRound,
  Mail,
  Phone,
  Plus,
  Search,
  Shield,
  UserPlus,
  Users,
} from "lucide-react";
import { User, UserHistoryEntry, UserPermission, UserRole } from "../../contexts/AuthContext";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "../ui/utils";

const userReadonlyFieldClass =
  "w-full rounded-lg border border-stone-200 bg-stone-50/50 px-3 py-2.5 text-sm text-brand-navy";

const permissionCards: Array<{
  value: UserPermission;
  label: string;
  description: string;
  Icon: ComponentType<{ className?: string; strokeWidth?: number }>;
}> = [
  {
    value: "manage_leads",
    label: "Leads",
    description: "CRM, pipeline y seguimiento de clientes",
    Icon: Users,
  },
  {
    value: "manage_properties",
    label: "Propiedades",
    description: "Catálogo y fichas de inmuebles",
    Icon: Home,
  },
  {
    value: "manage_developments",
    label: "Desarrollos",
    description: "Proyectos y desarrollos en el sitio",
    Icon: Building2,
  },
  {
    value: "manage_users",
    label: "Usuarios",
    description: "Alta, permisos y equipo",
    Icon: Shield,
  },
  {
    value: "edit_site",
    label: "Sitio web",
    description: "Contenido y bloques del sitio público",
    Icon: Globe2,
  },
];

function historyEventMeta(type: UserHistoryEntry["type"]) {
  const map: Record<
    UserHistoryEntry["type"],
    { title: string; Icon: ComponentType<{ className?: string; strokeWidth?: number }>; iconClass: string; badgeClass: string }
  > = {
    created: {
      title: "Usuario creado",
      Icon: Plus,
      iconClass: "text-emerald-600",
      badgeClass: "bg-emerald-100 text-emerald-700",
    },
    updated: {
      title: "Datos actualizados",
      Icon: History,
      iconClass: "text-amber-700",
      badgeClass: "bg-amber-100 text-amber-700",
    },
    password_changed: {
      title: "Contraseña",
      Icon: KeyRound,
      iconClass: "text-slate-600",
      badgeClass: "bg-slate-100 text-slate-700",
    },
    permissions_changed: {
      title: "Permisos o rol",
      Icon: Shield,
      iconClass: "text-primary",
      badgeClass: "bg-primary/10 text-primary",
    },
    archived: {
      title: "Archivado",
      Icon: ArchiveRestore,
      iconClass: "text-amber-800",
      badgeClass: "bg-amber-100 text-amber-800",
    },
    reactivated: {
      title: "Reactivado",
      Icon: CheckCircle2,
      iconClass: "text-emerald-700",
      badgeClass: "bg-emerald-100 text-emerald-800",
    },
  };
  return map[type];
}

function formatUserHistoryDate(iso: string) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  return new Date(t).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const historyTypeBadgeLabel: Record<UserHistoryEntry["type"], string> = {
  created: "Alta",
  updated: "Actualización",
  password_changed: "Contraseña",
  permissions_changed: "Permisos",
  archived: "Archivo",
  reactivated: "Reactivación",
};

interface Props {
  currentUser: User;
  users: User[];
  onCreateUser: (input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    permissions: UserPermission[];
    profile: { phone: string; address: string; birthDate: string; workHistory: string[] };
  }) => { ok: boolean; message?: string };
  onUpdateUser: (id: string, input: { name: string; email: string; profile: { phone: string; address: string; birthDate: string; workHistory: string[] } }) => void;
  onUpdatePassword: (id: string, password: string) => void;
  onUpdatePermissions: (id: string, role: UserRole, permissions: UserPermission[]) => void;
  onArchive: (id: string) => void;
  onReactivate: (id: string) => void;
  /** Abre el detalle de un usuario (p. ej. desde un lead); `nonce` fuerza reapertura si es el mismo id. */
  focusUser?: { id: string; nonce: number } | null;
  onFocusUserConsumed?: () => void;
  /** Tras cerrar el detalle de usuario (X, overlay o guardar), p. ej. volver al tab donde se abrió desde un lead. */
  onUserDetailClosed?: () => void;
}

type RoleOption = UserRole;

const roleOptions: Array<{ value: RoleOption; label: string }> = [
  { value: "admin", label: "Administrador" },
  { value: "lider_grupo", label: "Líder de grupo" },
  { value: "asesor", label: "Asesor" },
];

export function AdminUsersManager({
  currentUser,
  users,
  onCreateUser,
  onUpdateUser,
  onUpdatePassword,
  onUpdatePermissions,
  onArchive,
  onReactivate,
  focusUser,
  onFocusUserConsumed,
  onUserDetailClosed,
}: Props) {
  const [showArchived, setShowArchived] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creatingOpen, setCreatingOpen] = useState(false);
  const [passwordModal, setPasswordModal] = useState<User | null>(null);
  const [archiveCandidate, setArchiveCandidate] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    birthDate: "",
    workHistory: "",
    password: "",
    role: "asesor" as UserRole,
    permissions: ["manage_leads"] as UserPermission[],
  });

  const filteredUsers = useMemo(() => {
    let list = users.filter((u) => (showArchived ? !u.isActive : u.isActive));
    if (roleFilter !== "all") {
      list = list.filter((u) => u.role === roleFilter);
    }
    const q = userSearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((u) => {
        const blob = [
          u.name,
          u.email,
          u.profile.phone,
          u.profile.address,
          roleOptions.find((r) => r.value === u.role)?.label ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return blob.includes(q);
      });
    }
    return list;
  }, [users, showArchived, roleFilter, userSearchQuery]);

  const closeUserDetail = () => {
    setSelectedUser(null);
    onUserDetailClosed?.();
  };

  useEffect(() => {
    if (!focusUser) return;
    const u = users.find((x) => x.id === focusUser.id);
    if (u) setSelectedUser(u);
    onFocusUserConsumed?.();
  }, [focusUser?.nonce, focusUser?.id, users, onFocusUserConsumed]);

  const sortedUserHistory = useMemo(() => {
    if (!selectedUser) return [];
    return [...selectedUser.history].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [selectedUser]);

  const submitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const result = onCreateUser({
      name: createForm.name,
      email: createForm.email,
      password: createForm.password,
      role: createForm.role,
      permissions: createForm.permissions,
      profile: {
        phone: createForm.phone,
        address: createForm.address,
        birthDate: createForm.birthDate,
        workHistory: createForm.workHistory
          .split("\n")
          .map((row) => row.trim())
          .filter(Boolean),
      },
    });
    if (!result.ok) {
      setError(result.message || "No se pudo crear el usuario.");
      return;
    }
    setCreatingOpen(false);
    setCreateForm({
      name: "",
      email: "",
      phone: "",
      address: "",
      birthDate: "",
      workHistory: "",
      password: "",
      role: "asesor",
      permissions: ["manage_leads"],
    });
  };

  const canManageUsers = currentUser.role === "admin";

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-slate-900">Mi empresa · Usuarios</h2>
            <p className="mt-1 text-sm text-slate-600">
              Gestiona usuarios, permisos y consulta historial de usuarios archivados.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowArchived((p) => !p)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {showArchived ? "Ver activos" : "Ver archivados"}
            </button>
            {canManageUsers && (
              <button
                type="button"
                onClick={() => setCreatingOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-red-hover"
              >
                <UserPlus className="h-4 w-4" />
                Crear usuario
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-200/80 pt-6 sm:flex-row sm:items-stretch">
          <div className="relative min-h-[2.75rem] flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
              strokeWidth={1.75}
              aria-hidden
            />
            <input
              type="search"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, correo, teléfono o rol…"
              className="h-full min-h-[2.75rem] w-full rounded-xl border border-slate-200/90 bg-white py-2.5 pl-11 pr-4 text-sm text-brand-navy shadow-sm transition-all placeholder:text-slate-400 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
              style={{ fontWeight: 500 }}
              autoComplete="off"
              aria-label="Buscar usuarios"
            />
          </div>
          <Select
            value={roleFilter}
            onValueChange={(v) => setRoleFilter(v as "all" | UserRole)}
          >
            <SelectTrigger className="h-[2.75rem] w-full rounded-xl border-slate-200/90 bg-white shadow-sm sm:w-[min(100%,220px)]">
              <SelectValue placeholder="Rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              {roleOptions.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Usuario</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Contacto</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Rol</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Permisos</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="border-t border-slate-100 px-4 py-14 text-center text-sm text-slate-500" style={{ fontWeight: 500 }}>
                  No hay usuarios que coincidan con la búsqueda o el filtro de rol.
                </td>
              </tr>
            ) : (
            filteredUsers.map((user) => (
              <tr key={user.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <button type="button" onClick={() => setSelectedUser(user)} className="text-left">
                    <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">
                      {user.isActive ? "Activo" : `Archivado ${new Date(user.archivedAt || "").toLocaleDateString()}`}
                    </p>
                  </button>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  <p>{user.email}</p>
                  <p className="text-xs text-slate-500">{user.profile.phone || "Sin teléfono"}</p>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">{roleOptions.find((r) => r.value === user.role)?.label}</td>
                <td className="px-4 py-3 text-xs text-slate-700">{user.permissions.join(", ")}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button type="button" onClick={() => setSelectedUser(user)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800" title="Detalle">
                      <Edit className="h-4 w-4" />
                    </button>
                    {canManageUsers && (
                      <button type="button" onClick={() => setPasswordModal(user)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800" title="Cambiar contraseña">
                        <KeyRound className="h-4 w-4" />
                      </button>
                    )}
                    {canManageUsers && user.id !== currentUser.id && (
                      user.isActive ? (
                        <button
                          type="button"
                          onClick={() => setArchiveCandidate(user)}
                          className="rounded-md p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700"
                          title="Archivar"
                        >
                          <ArchiveRestore className="h-4 w-4" />
                        </button>
                      ) : (
                        <button type="button" onClick={() => onReactivate(user.id)} className="rounded-md p-2 text-slate-500 hover:bg-green-50 hover:text-green-700" title="Reactivar">
                          <ArchiveRestore className="h-4 w-4" />
                        </button>
                      )
                    )}
                  </div>
                </td>
              </tr>
            ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={creatingOpen} onOpenChange={setCreatingOpen}>
        <DialogContent className="w-full max-w-2xl border-slate-200 bg-white p-6">
          <div className="mb-5">
            <DialogHeader className="text-left">
              <DialogTitle className="text-lg font-semibold text-slate-900">Crear usuario</DialogTitle>
            </DialogHeader>
          </div>
            <form onSubmit={submitCreate} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input required className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Nombre" value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} />
              <input required type="email" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Correo" value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} />
              <input required type="password" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Contraseña" value={createForm.password} onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))} />
              <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Teléfono" value={createForm.phone} onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))} />
              <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2" placeholder="Dirección" value={createForm.address} onChange={(e) => setCreateForm((p) => ({ ...p, address: e.target.value }))} />
              <input type="date" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={createForm.birthDate} onChange={(e) => setCreateForm((p) => ({ ...p, birthDate: e.target.value }))} />
              <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={createForm.role} onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value as UserRole }))}>
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <textarea className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2" rows={3} placeholder="Historial de trabajo (una línea por puesto)" value={createForm.workHistory} onChange={(e) => setCreateForm((p) => ({ ...p, workHistory: e.target.value }))} />
              <div className="md:col-span-2 rounded-lg border border-slate-200 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Permisos</p>
                <div className="grid grid-cols-2 gap-2">
                  {permissionCards.map((permission) => (
                    <label key={permission.value} className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={createForm.permissions.includes(permission.value)}
                        onChange={(e) => {
                          setCreateForm((prev) => ({
                            ...prev,
                            permissions: e.target.checked
                              ? [...prev.permissions, permission.value]
                              : prev.permissions.filter((item) => item !== permission.value),
                          }));
                        }}
                      />
                      {permission.label}
                    </label>
                  ))}
                </div>
              </div>
              {error && <p className="text-sm text-red-700 md:col-span-2">{error}</p>}
              <div className="md:col-span-2 flex justify-end gap-2">
                <button type="button" onClick={() => setCreatingOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-red-hover">
                  <Plus className="h-4 w-4" />
                  Guardar usuario
                </button>
              </div>
            </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!archiveCandidate} onOpenChange={(open) => !open && setArchiveCandidate(null)}>
        <DialogContent className="w-full max-w-md border-slate-200 bg-white p-6">
          {archiveCandidate && (
            <>
              <DialogHeader className="text-left">
                <DialogTitle className="text-lg font-semibold text-slate-900">Archivar usuario</DialogTitle>
                <DialogDescription className="text-sm text-slate-600">
                  Esta acción moverá a <span className="font-semibold text-slate-800">{archiveCandidate.name}</span> al historial de usuarios archivados.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 rounded-lg border border-amber-200/70 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Puedes reactivarlo después desde “Ver archivados”.
              </div>
              <DialogFooter className="mt-5 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setArchiveCandidate(null)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="bg-primary text-primary-foreground hover:bg-brand-red-hover"
                  onClick={() => {
                    onArchive(archiveCandidate.id);
                    setArchiveCandidate(null);
                  }}
                >
                  Archivar usuario
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedUser}
        onOpenChange={(open) => {
          if (!open) closeUserDetail();
        }}
        key={selectedUser?.id ?? "user-detail"}
      >
        <DialogContent
          hideCloseButton
          className={cn(
            "!fixed !inset-0 !left-0 !top-0 z-50 flex !h-[100dvh] !max-h-[100dvh] !w-full !max-w-none !translate-x-0 !translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-white p-0 shadow-none duration-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:!zoom-in-100 data-[state=closed]:!zoom-out-100 sm:!max-w-none"
          )}
        >
          {selectedUser && (
            <>
              <div className="h-0.5 shrink-0 bg-gradient-to-r from-brand-gold/90 via-primary to-brand-burgundy/90" aria-hidden />
              <div className="shrink-0 border-b border-stone-200/80 bg-stone-50/90 px-4 py-4 sm:px-5">
                <DialogHeader className="gap-0 p-0 text-left">
                  <p className="text-[11px] text-slate-500" style={{ fontWeight: 500 }}>
                    <span className="text-primary/90">Mi empresa</span>
                    <span className="text-slate-400"> · </span>
                    Detalle de usuario
                  </p>
                  <div className="mt-3 flex flex-col gap-4 min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-between min-[1100px]:gap-6">
                    <div className="min-w-0 flex-1">
                      <DialogTitle
                        className="font-heading truncate text-3xl leading-tight tracking-tight text-brand-navy sm:text-4xl"
                        style={{ fontWeight: 700, textShadow: "0 1px 0 rgba(255,255,255,0.5)" }}
                      >
                        {selectedUser.name}
                      </DialogTitle>
                      <p className="mt-1.5 text-sm text-slate-600" style={{ fontWeight: 500 }}>
                        {selectedUser.isActive ? (
                          <span className="text-emerald-700">Activo</span>
                        ) : (
                          <span className="text-amber-800">
                            Archivado
                            {selectedUser.archivedAt
                              ? ` · ${new Date(selectedUser.archivedAt).toLocaleDateString()}`
                              : ""}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex w-full shrink-0 flex-col gap-2 min-[1100px]:w-auto min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-end min-[1100px]:gap-3">
                      <DialogClose asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 w-fit shrink-0 border-stone-300 bg-white px-4 text-slate-700 hover:bg-stone-50 hover:text-slate-800"
                          style={{ fontWeight: 600 }}
                        >
                          Cerrar
                        </Button>
                      </DialogClose>
                      {canManageUsers && (
                        <Button
                          type="button"
                          className="h-10 w-full min-w-[10rem] bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-brand-red-hover min-[1100px]:w-auto"
                          onClick={() => {
                            if (!selectedUser) return;
                            onUpdateUser(selectedUser.id, {
                              name: selectedUser.name,
                              email: selectedUser.email,
                              profile: selectedUser.profile,
                            });
                            onUpdatePermissions(selectedUser.id, selectedUser.role, selectedUser.permissions);
                            closeUserDetail();
                          }}
                        >
                          Guardar cambios
                        </Button>
                      )}
                    </div>
                  </div>
                  <DialogDescription className="sr-only">
                    Usuario {selectedUser.name}, rol {roleOptions.find((r) => r.value === selectedUser.role)?.label}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-gradient-to-b from-stone-100/95 to-stone-100/80">
                <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
                  <div className="mx-auto w-full max-w-[min(100%,88rem)]">
                    <div className="grid grid-cols-1 gap-8 text-sm lg:grid-cols-12 lg:items-start lg:gap-8 xl:gap-10">
                      <div className="flex min-w-0 flex-col gap-6 lg:col-span-7">
                        <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
                          <h3 className="text-sm text-slate-700" style={{ fontWeight: 600 }}>
                            Contacto y datos personales
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            Medios de contacto e identificación del usuario en el sistema.
                          </p>

                          <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <div className="group rounded-2xl border border-stone-200/80 bg-gradient-to-br from-white via-white to-primary/[0.04] p-5 shadow-sm transition-shadow hover:shadow-md">
                              <div className="flex items-start gap-4">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15">
                                  <Mail className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Correo
                                  </p>
                                  <a
                                    href={`mailto:${encodeURIComponent(selectedUser.email)}`}
                                    className="mt-1 block break-all text-[15px] text-primary transition-colors hover:underline"
                                    style={{ fontWeight: 600 }}
                                  >
                                    {selectedUser.email}
                                  </a>
                                </div>
                              </div>
                            </div>
                            <div className="group rounded-2xl border border-stone-200/80 bg-gradient-to-br from-white via-white to-brand-navy/[0.06] p-5 shadow-sm transition-shadow hover:shadow-md">
                              <div className="flex items-start gap-4">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-navy/10 text-brand-navy ring-1 ring-brand-navy/15">
                                  <Phone className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Teléfono
                                  </p>
                                  {selectedUser.profile.phone ? (
                                    <a
                                      href={`tel:${selectedUser.profile.phone.replace(/\s/g, "")}`}
                                      className="mt-1 block text-[15px] text-brand-navy transition-colors group-hover:text-primary"
                                      style={{ fontWeight: 600 }}
                                    >
                                      {selectedUser.profile.phone}
                                    </a>
                                  ) : (
                                    <p className="mt-1 text-[15px] text-slate-400" style={{ fontWeight: 500 }}>
                                      Sin capturar
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-6 border-t border-stone-200/80 pt-6">
                            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                              Identificación y domicilio
                            </p>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              <div className="space-y-1.5">
                                <Label className="text-xs text-slate-500" style={{ fontWeight: 500 }}>
                                  ID interno
                                </Label>
                                <div className={userReadonlyFieldClass} style={{ fontWeight: 500 }}>
                                  <span className="font-mono text-slate-800">{selectedUser.id}</span>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs text-slate-500" style={{ fontWeight: 500 }}>
                                  Dirección
                                </Label>
                                <div className={userReadonlyFieldClass} style={{ fontWeight: 500 }}>
                                  {selectedUser.profile.address || "—"}
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs text-slate-500" style={{ fontWeight: 500 }}>
                                  Fecha de nacimiento
                                </Label>
                                <div className={userReadonlyFieldClass} style={{ fontWeight: 500 }}>
                                  {selectedUser.profile.birthDate || "—"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </section>

                        {canManageUsers && (
                          <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-brand-navy" strokeWidth={1.75} />
                              <h3 className="text-sm text-slate-700" style={{ fontWeight: 600 }}>
                                Rol y permisos
                              </h3>
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-slate-500">
                              Define el rol y los módulos a los que puede acceder. Guarda con el botón superior
                              derecho.
                            </p>
                            <div className="mt-4 space-y-1.5">
                              <Label className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
                                Rol
                              </Label>
                              <select
                                value={selectedUser.role}
                                onChange={(e) => {
                                  const nextRole = e.target.value as UserRole;
                                  setSelectedUser((prev) => (prev ? { ...prev, role: nextRole } : prev));
                                }}
                                className="w-1/2 max-w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-brand-navy transition-colors focus:border-primary/35 focus:outline-none focus:ring-2 focus:ring-primary/15"
                                style={{ fontWeight: 600 }}
                                aria-label="Rol del usuario"
                              >
                                {roleOptions.map((role) => (
                                  <option key={role.value} value={role.value}>
                                    {role.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <p className="mb-1 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Módulos
                            </p>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {permissionCards.map((card) => {
                                const on = selectedUser.permissions.includes(card.value);
                                const CardIcon = card.Icon;
                                return (
                                  <button
                                    key={card.value}
                                    type="button"
                                    onClick={() => {
                                      setSelectedUser((prev) => {
                                        if (!prev) return prev;
                                        return {
                                          ...prev,
                                          permissions: on
                                            ? prev.permissions.filter((p) => p !== card.value)
                                            : [...prev.permissions, card.value],
                                        };
                                      });
                                    }}
                                    className={cn(
                                      "relative flex w-full flex-col gap-1 rounded-xl border p-3.5 text-left transition-all",
                                      on
                                        ? "border-primary/45 bg-gradient-to-br from-primary/[0.08] via-white to-white shadow-sm ring-1 ring-primary/25"
                                        : "border-stone-200/90 bg-stone-50/30 hover:border-stone-300 hover:bg-white"
                                    )}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <span
                                        className={cn(
                                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
                                          on
                                            ? "bg-primary/15 text-primary ring-primary/20"
                                            : "bg-stone-100 text-slate-600 ring-stone-200/80"
                                        )}
                                      >
                                        <CardIcon className="h-4 w-4" strokeWidth={1.75} />
                                      </span>
                                      {on ? (
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                                          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                                        </span>
                                      ) : (
                                        <span className="h-6 w-6 shrink-0 rounded-full border border-stone-200 bg-white" />
                                      )}
                                    </div>
                                    <span className="text-sm text-brand-navy" style={{ fontWeight: 700 }}>
                                      {card.label}
                                    </span>
                                    <span className="text-[11px] leading-snug text-slate-500">
                                      {card.description}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </section>
                        )}

                        {!canManageUsers && (
                          <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
                            <h3 className="text-sm text-slate-700" style={{ fontWeight: 600 }}>
                              Rol y permisos
                            </h3>
                            <p className="mt-2 text-sm text-slate-600">
                              <span className="text-slate-500">Rol:</span>{" "}
                              <span style={{ fontWeight: 600 }} className="text-brand-navy">
                                {roleOptions.find((r) => r.value === selectedUser.role)?.label}
                              </span>
                            </p>
                            <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Módulos
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {selectedUser.permissions.length === 0 ? (
                                <p className="text-sm text-slate-500">Sin permisos adicionales.</p>
                              ) : (
                                selectedUser.permissions.map((perm) => {
                                  const meta = permissionCards.find((c) => c.value === perm);
                                  return (
                                    <span
                                      key={perm}
                                      className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-brand-navy"
                                    >
                                      {meta?.label ?? perm}
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </section>
                        )}

                        <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
                          <h3 className="text-sm text-slate-700" style={{ fontWeight: 600 }}>
                            Trayectoria laboral
                          </h3>
                          {selectedUser.profile.workHistory.length === 0 ? (
                            <p className="mt-4 rounded-xl border border-dashed border-stone-200 bg-stone-50/50 px-4 py-8 text-center text-sm text-slate-500">
                              Sin puestos registrados.
                            </p>
                          ) : (
                            <ul className="mt-4 space-y-2">
                              {selectedUser.profile.workHistory.map((item, idx) => (
                                <li
                                  key={`${item}-${idx}`}
                                  className="rounded-xl border border-stone-200/90 bg-stone-50/40 px-4 py-3 text-sm text-slate-800 ring-1 ring-stone-100"
                                  style={{ fontWeight: 500 }}
                                >
                                  {item}
                                </li>
                              ))}
                            </ul>
                          )}
                        </section>
                      </div>

                      <aside className="lg:sticky lg:top-2 lg:col-span-5 lg:self-start">
                        <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
                          <h3 className="flex items-center gap-2 text-sm text-slate-700" style={{ fontWeight: 600 }}>
                            <History className="h-4 w-4 text-primary" strokeWidth={1.9} aria-hidden />
                            Actividad
                          </h3>
                          <div className="mt-4 space-y-3">
                            {sortedUserHistory.length === 0 ? (
                              <p className="rounded-xl border border-dashed border-stone-200 bg-stone-50/50 px-4 py-8 text-center text-sm text-slate-500">
                                Sin actividad registrada.
                              </p>
                            ) : (
                              <div className="relative pl-8">
                                <div className="absolute bottom-3 left-[15px] top-3 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />
                                <div className="space-y-4">
                                  {sortedUserHistory.map((entry) => {
                                    const meta = historyEventMeta(entry.type);
                                    const Icon = meta.Icon;
                                    return (
                                      <article
                                        key={entry.id}
                                        className="relative rounded-xl border border-stone-200/90 bg-stone-50/40 p-4 shadow-sm"
                                      >
                                        <span className="absolute -left-8 top-4 inline-flex h-7 w-7 items-center justify-center rounded-full border border-stone-200 bg-white shadow-sm">
                                          <Icon className={cn("h-3.5 w-3.5", meta.iconClass)} strokeWidth={2} />
                                        </span>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <p className="text-sm text-brand-navy" style={{ fontWeight: 700 }}>
                                            {meta.title}
                                          </p>
                                          <span
                                            className={cn(
                                              "rounded-full px-2 py-0.5 text-[11px]",
                                              meta.badgeClass
                                            )}
                                          >
                                            {historyTypeBadgeLabel[entry.type]}
                                          </span>
                                        </div>
                                        <p className="mt-1.5 text-sm text-slate-700">{entry.description}</p>
                                        <p className="mt-2 inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                          <span className="inline-flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {formatUserHistoryDate(entry.createdAt)}
                                          </span>
                                          <span className="text-slate-400">·</span>
                                          <span>{entry.actorName}</span>
                                        </p>
                                      </article>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </section>
                      </aside>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!passwordModal} onOpenChange={(open) => !open && setPasswordModal(null)}>
        <DialogContent className="w-full max-w-md border-slate-200 bg-white p-6">
          {passwordModal && (
            <>
            <h3 className="text-lg font-semibold text-slate-900">Cambiar contraseña</h3>
            <p className="mt-1 text-sm text-slate-600">{passwordModal.name}</p>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Nueva contraseña"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setPasswordModal(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</button>
              <button
                type="button"
                onClick={() => {
                  if (newPassword.trim().length < 4) return;
                  onUpdatePassword(passwordModal.id, newPassword.trim());
                  setPasswordModal(null);
                  setNewPassword("");
                }}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-red-hover"
              >
                Actualizar
              </button>
            </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
