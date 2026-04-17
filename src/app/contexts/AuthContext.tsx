import { createContext, useContext, useMemo, useState, ReactNode } from "react";

export type UserRole = "admin" | "lider_grupo" | "asesor";
export type UserPermission =
  | "manage_leads"
  | "manage_properties"
  | "manage_developments"
  | "manage_users"
  | "edit_site";

export interface UserHistoryEntry {
  id: string;
  type: "created" | "updated" | "password_changed" | "permissions_changed" | "archived" | "reactivated";
  description: string;
  createdAt: string;
  actorName: string;
}

export interface UserProfile {
  phone: string;
  address: string;
  birthDate: string;
  workHistory: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: UserPermission[];
  profile: UserProfile;
  isActive: boolean;
  archivedAt?: string;
  archivedBy?: string;
  createdAt: string;
  updatedAt: string;
  history: UserHistoryEntry[];
}

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  permissions?: UserPermission[];
  profile?: Partial<UserProfile>;
}

interface UpdateUserInput {
  name?: string;
  email?: string;
  profile?: Partial<UserProfile>;
}

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  createUser: (input: CreateUserInput, actorName?: string) => { ok: boolean; message?: string };
  updateUser: (id: string, input: UpdateUserInput, actorName?: string) => void;
  updateUserPassword: (id: string, newPassword: string, actorName?: string) => void;
  updateUserPermissions: (id: string, role: UserRole, permissions: UserPermission[], actorName?: string) => void;
  archiveUser: (id: string, actorName?: string) => void;
  reactivateUser: (id: string, actorName?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = "viterra_admin_users";
const PASSWORDS_STORAGE_KEY = "viterra_admin_passwords";

const defaultPermissionsByRole: Record<UserRole, UserPermission[]> = {
  admin: ["manage_leads", "manage_properties", "manage_developments", "manage_users", "edit_site"],
  lider_grupo: ["manage_leads", "manage_properties", "manage_developments"],
  asesor: ["manage_leads"],
};

const baseSeedUsers: Array<{ email: string; password: string; user: Omit<User, "permissions" | "profile" | "isActive" | "createdAt" | "updatedAt" | "history"> & Partial<User> }> = [
  { email: "admin@viterra.com", password: "admin123", user: { id: "1", email: "admin@viterra.com", name: "Admin Viterra", role: "admin" } },
  { email: "lider@viterra.com", password: "lider123", user: { id: "2", email: "lider@viterra.com", name: "Patricia López", role: "lider_grupo" } },
  { email: "asesor@viterra.com", password: "asesor123", user: { id: "3", email: "asesor@viterra.com", name: "Laura Méndez", role: "asesor" } },
];

const newHistoryEntry = (
  type: UserHistoryEntry["type"],
  description: string,
  actorName: string
): UserHistoryEntry => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type,
  description,
  createdAt: new Date().toISOString(),
  actorName,
});

const normalizeRole = (role: string | undefined): UserRole => (role === "agente" ? "asesor" : (role as UserRole)) || "asesor";

const normalizeUser = (raw: Partial<User>): User => {
  const now = new Date().toISOString();
  const role = normalizeRole(raw.role);
  const profile = raw.profile ?? { phone: "", address: "", birthDate: "", workHistory: [] };
  return {
    id: raw.id ?? `${Date.now()}`,
    email: raw.email ?? "",
    name: raw.name ?? "",
    role,
    permissions: raw.permissions && raw.permissions.length > 0 ? raw.permissions : defaultPermissionsByRole[role],
    profile: {
      phone: profile.phone ?? "",
      address: profile.address ?? "",
      birthDate: profile.birthDate ?? "",
      workHistory: Array.isArray(profile.workHistory) ? profile.workHistory : [],
    },
    isActive: raw.isActive ?? true,
    archivedAt: raw.archivedAt,
    archivedBy: raw.archivedBy,
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
    history: Array.isArray(raw.history) ? raw.history : [],
  };
};

const seedUsers = (): User[] =>
  baseSeedUsers.map(({ user }) => {
    const normalized = normalizeUser(user);
    return {
      ...normalized,
      profile: {
        ...normalized.profile,
        workHistory:
          normalized.id === "1"
            ? ["Director Comercial (2019-Actualidad)", "Gerente de Ventas (2016-2019)"]
            : normalized.id === "2"
              ? ["Líder Regional (2021-Actualidad)", "Asesor Senior (2018-2021)"]
              : ["Asesora Inmobiliaria (2022-Actualidad)"],
      },
      history: [newHistoryEntry("created", "Usuario inicial del sistema", "Sistema")],
    };
  });

const seedPasswords = (): Record<string, string> =>
  baseSeedUsers.reduce<Record<string, string>>((acc, row) => {
    acc[row.user.id] = row.password;
    return acc;
  }, {});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    if (!saved) return seedUsers();
    try {
      const parsed = JSON.parse(saved) as Partial<User>[];
      return parsed.map(normalizeUser);
    } catch {
      return seedUsers();
    }
  });

  const [passwordByUserId, setPasswordByUserId] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(PASSWORDS_STORAGE_KEY);
    if (!saved) return seedPasswords();
    try {
      return JSON.parse(saved) as Record<string, string>;
    } catch {
      return seedPasswords();
    }
  });

  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("viterra_user");
    if (!savedUser) return null;
    try {
      return normalizeUser(JSON.parse(savedUser) as Partial<User>);
    } catch {
      return null;
    }
  });

  const persistUsers = (next: User[]) => {
    setUsers(next);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(next));
    if (user) {
      const refreshed = next.find((u) => u.id === user.id);
      if (!refreshed || !refreshed.isActive) {
        setUser(null);
        localStorage.removeItem("viterra_user");
        localStorage.removeItem("viterra_session_start");
      } else {
        setUser(refreshed);
        localStorage.setItem("viterra_user", JSON.stringify(refreshed));
      }
    }
  };

  const persistPasswords = (next: Record<string, string>) => {
    setPasswordByUserId(next);
    localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(next));
  };

  const appendHistory = (target: User, entry: UserHistoryEntry): User => ({
    ...target,
    updatedAt: entry.createdAt,
    history: [entry, ...target.history],
  });

  const login = (email: string, password: string): boolean => {
    const found = users.find((u) => u.email === email);
    if (!found || !found.isActive) return false;
    const savedPassword = passwordByUserId[found.id];
    if (!savedPassword || savedPassword !== password) return false;
    setUser(found);
    localStorage.setItem("viterra_user", JSON.stringify(found));
    localStorage.setItem("viterra_session_start", new Date().toISOString());
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("viterra_user");
    localStorage.removeItem("viterra_session_start");
  };

  const checkSessionExpiration = () => {
    const sessionStart = localStorage.getItem("viterra_session_start");
    if (!sessionStart) return;
    const elapsed = Date.now() - new Date(sessionStart).getTime();
    const eightHours = 8 * 60 * 60 * 1000;
    if (elapsed > eightHours) logout();
  };
  if (user) checkSessionExpiration();

  const createUser: AuthContextType["createUser"] = (input, actorName = "Admin") => {
    const normalizedEmail = input.email.trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return { ok: false, message: "Ya existe un usuario con ese correo." };
    }
    const now = new Date().toISOString();
    const id = `${Date.now()}`;
    const created = normalizeUser({
      id,
      name: input.name.trim(),
      email: normalizedEmail,
      role: input.role,
      permissions: input.permissions?.length ? input.permissions : defaultPermissionsByRole[input.role],
      profile: {
        phone: input.profile?.phone ?? "",
        address: input.profile?.address ?? "",
        birthDate: input.profile?.birthDate ?? "",
        workHistory: input.profile?.workHistory ?? [],
      },
      isActive: true,
      createdAt: now,
      updatedAt: now,
      history: [newHistoryEntry("created", "Usuario creado", actorName)],
    });
    persistUsers([...users, created]);
    persistPasswords({ ...passwordByUserId, [id]: input.password });
    return { ok: true };
  };

  const updateUser: AuthContextType["updateUser"] = (id, input, actorName = "Admin") => {
    persistUsers(
      users.map((item) => {
        if (item.id !== id) return item;
        const next = normalizeUser({
          ...item,
          ...input,
          profile: { ...item.profile, ...(input.profile ?? {}) },
        });
        return appendHistory(next, newHistoryEntry("updated", "Perfil actualizado", actorName));
      })
    );
  };

  const updateUserPassword: AuthContextType["updateUserPassword"] = (id, newPassword, actorName = "Admin") => {
    persistPasswords({ ...passwordByUserId, [id]: newPassword });
    persistUsers(
      users.map((item) =>
        item.id === id
          ? appendHistory(item, newHistoryEntry("password_changed", "Contraseña actualizada", actorName))
          : item
      )
    );
  };

  const updateUserPermissions: AuthContextType["updateUserPermissions"] = (id, role, permissions, actorName = "Admin") => {
    persistUsers(
      users.map((item) => {
        if (item.id !== id) return item;
        const next = normalizeUser({ ...item, role, permissions });
        return appendHistory(next, newHistoryEntry("permissions_changed", "Permisos o rol actualizados", actorName));
      })
    );
  };

  const archiveUser: AuthContextType["archiveUser"] = (id, actorName = "Admin") => {
    const now = new Date().toISOString();
    persistUsers(
      users.map((item) => {
        if (item.id !== id || !item.isActive) return item;
        const next = { ...item, isActive: false, archivedAt: now, archivedBy: actorName };
        return appendHistory(next, newHistoryEntry("archived", "Usuario archivado", actorName));
      })
    );
  };

  const reactivateUser: AuthContextType["reactivateUser"] = (id, actorName = "Admin") => {
    persistUsers(
      users.map((item) => {
        if (item.id !== id || item.isActive) return item;
        const next = { ...item, isActive: true, archivedAt: undefined, archivedBy: undefined };
        return appendHistory(next, newHistoryEntry("reactivated", "Usuario reactivado", actorName));
      })
    );
  };

  const value = useMemo(
    () => ({
      user,
      users,
      login,
      logout,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      createUser,
      updateUser,
      updateUserPassword,
      updateUserPermissions,
      archiveUser,
      reactivateUser,
    }),
    [user, users]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
