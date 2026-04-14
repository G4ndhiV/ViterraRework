import { createContext, useContext, useMemo, type ReactNode } from "react";

export type VisualSiteEditorContextValue = {
  enabled: boolean;
  activeBlockId: string | null;
  setActiveBlockId: (id: string | null) => void;
};

const VisualSiteEditorContext = createContext<VisualSiteEditorContextValue | null>(null);

export function VisualSiteEditorProvider({
  enabled,
  activeBlockId,
  setActiveBlockId,
  children,
}: {
  enabled: boolean;
  activeBlockId: string | null;
  setActiveBlockId: (id: string | null) => void;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({ enabled, activeBlockId, setActiveBlockId }),
    [enabled, activeBlockId, setActiveBlockId]
  );
  return <VisualSiteEditorContext.Provider value={value}>{children}</VisualSiteEditorContext.Provider>;
}

export function useVisualSiteEditorOptional() {
  return useContext(VisualSiteEditorContext);
}
