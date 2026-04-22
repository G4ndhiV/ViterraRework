export type UserRole = "admin" | "lider_grupo" | "asesor";
export type UserPermission =
  | "manage_leads"
  | "manage_properties"
  | "manage_developments"
  | "manage_users"
  | "manage_clients"
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
  /** Id numérico Tokko (`tokko_users.tokko_user_id`); en leads viene en `assigned_to_user_id` desde el sync. */
  tokkoUserId?: string;
  /** Fila `tokko_users.must_change_password`: obliga cambio de contraseña en primer acceso. */
  mustChangePassword?: boolean;
  archivedAt?: string;
  archivedBy?: string;
  createdAt: string;
  updatedAt: string;
  history: UserHistoryEntry[];
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  permissions?: UserPermission[];
  profile?: Partial<UserProfile>;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  profile?: Partial<UserProfile>;
}

export interface AuthContextType {
  user: User | null;
  users: User[];
  /** `true` tras resolver la sesión de Supabase (o si no hay cliente). Evita redirigir a login antes de restaurar sesión. */
  authReady: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; message?: string; mustChangePassword?: boolean }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  createUser: (input: CreateUserInput, actorName?: string) => { ok: boolean; message?: string };
  updateUser: (id: string, input: UpdateUserInput, actorName?: string) => void;
  updateUserPassword: (id: string, newPassword: string, actorName?: string) => void;
  updateUserPermissions: (id: string, role: UserRole, permissions: UserPermission[], actorName?: string) => void;
  archiveUser: (id: string, actorName?: string) => void;
  reactivateUser: (id: string, actorName?: string) => void;
}
