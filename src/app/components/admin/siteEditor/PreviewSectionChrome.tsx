import type { ReactNode } from "react";
import { useVisualSiteEditorOptional } from "../../../../contexts/VisualSiteEditorContext";
import { cn } from "../../ui/utils";

/**
 * En modo editor visual: borde al seleccionar, franja izquierda para elegir bloque
 * (sin cubrir todo el contenido para no bloquear scroll ni enlaces).
 */
export function PreviewSectionChrome({
  blockId,
  label,
  children,
}: {
  blockId: string;
  label: string;
  children: ReactNode;
}) {
  const v = useVisualSiteEditorOptional();
  if (!v?.enabled) return <>{children}</>;

  const selected = v.activeBlockId === blockId;
  return (
    <div id={`viterra-block-${blockId}`} className={cn("relative h-full min-h-0 scroll-mt-4")}>
      <div
        className={cn(
          "relative h-full min-h-0 rounded-sm transition-[box-shadow] duration-150",
          selected && "z-[1] shadow-[0_0_0_2px_#C8102E,0_0_0_4px_rgba(255,255,255,0.95)]"
        )}
      >
        {children}
      </div>
      <button
        type="button"
        className="absolute left-0 top-0 z-[5] h-full w-2.5 cursor-pointer border-0 bg-[#C8102E]/0 p-0 transition-colors hover:bg-[#C8102E]/25"
        title={label}
        aria-label={`Editar ${label}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          v.setActiveBlockId(blockId);
        }}
      />
    </div>
  );
}
