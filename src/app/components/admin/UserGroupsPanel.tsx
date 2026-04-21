"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit, Plus, Search, Trash2, Users } from "lucide-react";
import type { User, UserRole } from "../../contexts/AuthContext";
import {
  loadUserGroupsFromStorage,
  newUserGroupId,
  saveUserGroupsToStorage,
  type UserGroup,
  isValidGroupLeader,
} from "../../lib/userGroups";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "../ui/utils";

const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  lider_grupo: "Líder de grupo",
  asesor: "Asesor",
};

type Props = {
  users: User[];
  canManageGroups: boolean;
};

type GroupFormState = {
  name: string;
  leaderId: string;
  memberIds: string[];
};

function emptyForm(leaders: User[]): GroupFormState {
  const first = leaders[0];
  return {
    name: "",
    leaderId: first?.id ?? "",
    memberIds: first ? [first.id] : [],
  };
}

export function UserGroupsPanel({ users, canManageGroups }: Props) {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [groupListQuery, setGroupListQuery] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GroupFormState>(() => emptyForm([]));
  const [formError, setFormError] = useState("");

  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState<"all" | UserRole>("all");

  const [leaderSearch, setLeaderSearch] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<UserGroup | null>(null);

  useEffect(() => {
    setGroups(loadUserGroupsFromStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveUserGroupsToStorage(groups);
  }, [groups, hydrated]);

  const activeUsers = useMemo(() => users.filter((u) => u.isActive), [users]);

  const potentialLeaders = useMemo(
    () => activeUsers.filter((u) => u.role === "lider_grupo"),
    [activeUsers]
  );

  const leadersForSelect = useMemo(() => {
    const q = leaderSearch.trim().toLowerCase();
    if (!q) return potentialLeaders;
    return potentialLeaders.filter((u) => {
      const blob = [u.name, u.email, roleLabels[u.role]].join(" ").toLowerCase();
      return blob.includes(q);
    });
  }, [potentialLeaders, leaderSearch]);

  /** Incluye al líder actual aunque no cumpla filtro o esté inactivo (edición / corrección). */
  const leaderOptions = useMemo(() => {
    const cur = users.find((u) => u.id === form.leaderId);
    if (cur && !leadersForSelect.some((u) => u.id === cur.id)) {
      return [cur, ...leadersForSelect];
    }
    return leadersForSelect;
  }, [leadersForSelect, form.leaderId, users]);

  const filteredMembersForPicker = useMemo(() => {
    let list = activeUsers;
    if (memberRoleFilter !== "all") {
      list = list.filter((u) => u.role === memberRoleFilter);
    }
    const q = memberSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((u) => {
        const blob = [u.name, u.email, u.profile.phone, roleLabels[u.role]].join(" ").toLowerCase();
        return blob.includes(q);
      });
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [activeUsers, memberSearch, memberRoleFilter]);

  const selectedMembersPreview = useMemo(() => {
    const byId = new Map(users.map((u) => [u.id, u]));
    return Array.from(new Set(form.memberIds))
      .map((id) => byId.get(id))
      .filter((u): u is User => Boolean(u))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [users, form.memberIds]);

  const filteredGroups = useMemo(() => {
    const q = groupListQuery.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, groupListQuery]);

  const openCreate = () => {
    setEditingId(null);
    setFormError("");
    setMemberSearch("");
    setMemberRoleFilter("all");
    setLeaderSearch("");
    setForm(emptyForm(potentialLeaders));
    setDialogOpen(true);
  };

  const openEdit = (g: UserGroup) => {
    setEditingId(g.id);
    setFormError("");
    setMemberSearch("");
    setMemberRoleFilter("all");
    setLeaderSearch("");
    setForm({
      name: g.name,
      leaderId: g.leaderId,
      memberIds: [...g.memberIds],
    });
    setDialogOpen(true);
  };

  const toggleMember = (userId: string, checked: boolean) => {
    if (userId === form.leaderId) return;
    setForm((prev) => {
      const set = new Set(prev.memberIds);
      if (checked) set.add(userId);
      else set.delete(userId);
      return { ...prev, memberIds: Array.from(set) };
    });
  };

  const onLeaderChange = (nextLeaderId: string) => {
    setForm((prev) => {
      const set = new Set(prev.memberIds);
      set.add(nextLeaderId);
      return { ...prev, leaderId: nextLeaderId, memberIds: Array.from(set) };
    });
  };

  const submitGroup = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const name = form.name.trim();
    if (!name) {
      setFormError("Indica un nombre para el grupo.");
      return;
    }
    if (!form.leaderId) {
      setFormError("Selecciona un líder de grupo. Debe existir un usuario activo con rol «Líder de grupo».");
      return;
    }
    if (!isValidGroupLeader(form.leaderId, activeUsers)) {
      setFormError("El líder debe ser un usuario activo con rol «Líder de grupo».");
      return;
    }
    const memberIds = Array.from(new Set([...form.memberIds, form.leaderId]));

    const now = new Date().toISOString();
    if (editingId) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === editingId
            ? { ...g, name, leaderId: form.leaderId, memberIds }
            : g
        )
      );
    } else {
      const ng: UserGroup = {
        id: newUserGroupId(),
        name,
        leaderId: form.leaderId,
        memberIds,
        createdAt: now,
      };
      setGroups((prev) => [...prev, ng]);
    }
    setDialogOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setGroups((prev) => prev.filter((g) => g.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-slate-900">Equipos de trabajo</h2>
          <p className="mt-1 text-sm text-slate-600">
            Crea equipos, asigna miembros y define un único líder por grupo (rol «Líder de grupo»).
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {canManageGroups && (
            <button
              type="button"
              onClick={openCreate}
              disabled={potentialLeaders.length === 0}
              title={
                potentialLeaders.length === 0
                  ? "Necesitas al menos un usuario activo con rol Líder de grupo"
                  : undefined
              }
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-red-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Crear grupo
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
            value={groupListQuery}
            onChange={(e) => setGroupListQuery(e.target.value)}
            placeholder="Buscar grupo por nombre…"
            className="h-full min-h-[2.75rem] w-full rounded-xl border border-slate-200/90 bg-white py-2.5 pl-11 pr-4 text-sm text-brand-navy shadow-sm transition-all placeholder:text-slate-400 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
            style={{ fontWeight: 500 }}
            autoComplete="off"
            aria-label="Buscar equipos"
          />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Grupo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Líder
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Miembros
              </th>
              {canManageGroups && (
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredGroups.length === 0 ? (
              <tr>
                <td
                  colSpan={canManageGroups ? 4 : 3}
                  className="border-t border-slate-100 px-4 py-14 text-center text-sm text-slate-500"
                  style={{ fontWeight: 500 }}
                >
                  {groups.length === 0
                    ? "Aún no hay equipos. Crea uno para organizar a tu equipo."
                    : "No hay equipos que coincidan con la búsqueda."}
                </td>
              </tr>
            ) : (
              filteredGroups.map((g) => {
                const leader = users.find((u) => u.id === g.leaderId);
                const leaderOk = isValidGroupLeader(g.leaderId, activeUsers);
                return (
                  <tr key={g.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{g.name}</p>
                      <p className="text-xs text-slate-500">
                        Creado {new Date(g.createdAt).toLocaleDateString("es-MX")}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      <span className="font-medium">{leader?.name ?? "—"}</span>
                      {!leaderOk && (
                        <span className="ml-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                          Revisar líder
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-slate-400" aria-hidden />
                        {g.memberIds.length}
                      </span>
                    </td>
                    {canManageGroups && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(g)}
                            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                            title="Editar grupo"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(g)}
                            className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-700"
                            title="Eliminar grupo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="!flex h-[min(90vh,880px)] max-h-[90vh] w-full !max-w-5xl !flex-col !gap-0 !overflow-hidden border-slate-200 bg-white p-0 sm:!max-w-5xl">
          <div className="shrink-0 px-6 pb-3 pt-6 pr-14">
            <DialogHeader className="text-left">
              <DialogTitle className="text-lg font-semibold text-slate-900">
                {editingId ? "Editar grupo" : "Crear grupo"}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-600">
                Líder con rol «Líder de grupo». Miembros: busca y filtra a la derecha.
              </DialogDescription>
            </DialogHeader>
          </div>

          <form
            onSubmit={submitGroup}
            className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 pb-4"
          >
            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden md:flex-row md:gap-6 lg:gap-8">
              <div className="flex w-full shrink-0 flex-col gap-4 md:w-[min(100%,300px)] md:shrink-0 md:overflow-y-auto md:pr-1 lg:w-[min(100%,320px)]">
                <div className="space-y-1.5">
                  <Label htmlFor="group-name">Nombre del grupo</Label>
                  <Input
                    id="group-name"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Ej. Equipo norte"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Líder del grupo</Label>
                  <p className="text-[11px] leading-snug text-slate-500">
                    Solo «Líder de grupo» activos.
                  </p>
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      strokeWidth={1.75}
                    />
                    <Input
                      className="pl-9"
                      value={leaderSearch}
                      onChange={(e) => setLeaderSearch(e.target.value)}
                      placeholder="Buscar líder…"
                      autoComplete="off"
                    />
                  </div>
                  <Select value={form.leaderId} onValueChange={onLeaderChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona líder" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaderOptions.length === 0 ? (
                        <div className="px-2 py-3 text-sm text-slate-500">Sin coincidencias.</div>
                      ) : (
                        leaderOptions.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name} · {roleLabels[u.role]}
                            {!u.isActive ? " (inactivo)" : ""}
                            {u.role !== "lider_grupo" ? " — revisar rol" : ""}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Usuarios en este grupo</Label>
                  <p className="text-[11px] leading-snug text-slate-500">
                    Miembros ya asignados actualmente.
                  </p>
                  <div className="max-h-[19rem] overflow-y-auto rounded-lg border border-slate-200/90 bg-slate-50/50">
                    {selectedMembersPreview.length === 0 ? (
                      <p className="px-3 py-3 text-sm text-slate-500">Aun no hay usuarios asignados.</p>
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {selectedMembersPreview.map((u) => (
                          <li key={u.id} className="px-3 py-2">
                            <p className="text-sm text-slate-900" style={{ fontWeight: 600 }}>
                              {u.name}
                              {u.id === form.leaderId ? " · Lider" : ""}
                            </p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
                <div>
                  <Label>Miembros del grupo</Label>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                    El líder sigue incluido. Solo esta zona hace scroll.
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      className="pl-9"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="Buscar por nombre, correo o teléfono…"
                      autoComplete="off"
                    />
                  </div>
                  <Select
                    value={memberRoleFilter}
                    onValueChange={(v) => setMemberRoleFilter(v as "all" | UserRole)}
                  >
                    <SelectTrigger className="h-9 w-full shrink-0 sm:w-[200px]">
                      <SelectValue placeholder="Rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los roles</SelectItem>
                      {(Object.keys(roleLabels) as UserRole[]).map((r) => (
                        <SelectItem key={r} value={r}>
                          {roleLabels[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex min-h-0 flex-1 flex-col">
                  <ScrollArea className="h-[min(260px,calc(90vh-26rem))] rounded-lg border border-slate-200/90 md:h-full md:min-h-0">
                    <ul className="divide-y divide-slate-100 p-2">
                      {filteredMembersForPicker.length === 0 ? (
                        <li className="px-2 py-8 text-center text-sm text-slate-500">
                          Ningún usuario coincide con los filtros.
                        </li>
                      ) : (
                        filteredMembersForPicker.map((u) => {
                          const isLeader = u.id === form.leaderId;
                          const checked = isLeader || form.memberIds.includes(u.id);
                          return (
                            <li key={u.id}>
                              <label
                                className={cn(
                                  "flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-slate-50",
                                  isLeader && "bg-primary/[0.06]"
                                )}
                              >
                                <Checkbox
                                  checked={checked}
                                  disabled={isLeader}
                                  onCheckedChange={(v) => toggleMember(u.id, v === true)}
                                  className="mt-0.5"
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-medium text-slate-900">
                                    {u.name}
                                  </span>
                                  <span className="block text-xs text-slate-500">{u.email}</span>
                                  <span className="mt-0.5 inline-block text-[11px] font-medium text-slate-600">
                                    {roleLabels[u.role]}
                                    {isLeader ? " · Líder del grupo" : ""}
                                  </span>
                                </span>
                              </label>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </ScrollArea>
                </div>
              </div>
            </div>

            {formError && (
              <p className="mt-3 shrink-0 text-sm text-red-700">{formError}</p>
            )}

            <DialogFooter className="mt-4 shrink-0 gap-2 border-t border-slate-100 pt-4 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-brand-red-hover">
                {editingId ? "Guardar cambios" : "Crear grupo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="w-full max-w-md border-slate-200 bg-white p-6">
          {deleteTarget && (
            <>
              <DialogHeader className="text-left">
                <DialogTitle className="text-lg font-semibold text-slate-900">Eliminar grupo</DialogTitle>
                <DialogDescription className="text-sm text-slate-600">
                  Se eliminará el grupo <span className="font-semibold text-slate-800">{deleteTarget.name}</span>.
                  Los usuarios no se borran; solo deja de existir esta agrupación.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4 gap-2">
                <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={confirmDelete}
                >
                  Eliminar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
