import { createContext, useContext } from "react";
import type { AuthContextType } from "./authContextTypes";

/**
 * Contexto en módulo aparte del `AuthProvider` para que Vite Fast Refresh no sustituya
 * `createContext` al recargar solo AuthContext.tsx (síntoma: "useAuth must be used within an AuthProvider").
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
