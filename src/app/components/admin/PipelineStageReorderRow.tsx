import { useRef, type ReactNode } from "react";
import { useDrag, useDrop } from "react-dnd";

export const PIPELINE_STAGE_ROW_TYPE = "VITERRA_PIPELINE_STAGE_ROW";

type DragItem = { index: number };

/** Ref callback que react-dnd usa como asa de arrastre (evita interferencia de botones/inputs en la fila). */
export type PipelineStageDragHandleRef = (elementOrNode: HTMLDivElement | null) => void;

type Props = {
  index: number;
  moveRow: (fromIndex: number, toIndex: number) => void;
  canDrag: boolean;
  children: (connectDragHandle: PipelineStageDragHandleRef) => ReactNode;
};

/**
 * Reordenación vertical del pipeline: el drop es la fila completa; el drag debe iniciarse solo desde el asa
 * para que HTML5 DnD no sea absorbido por `<button>`, `<input type="color">`, etc.
 */
export function PipelineStageReorderRow({ index, moveRow, canDrag, children }: Props) {
  const dropRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: PIPELINE_STAGE_ROW_TYPE,
      item: (): DragItem => ({ index }),
      canDrag: () => canDrag,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [index, canDrag]
  );

  const [, drop] = useDrop(
    () => ({
      accept: PIPELINE_STAGE_ROW_TYPE,
      canDrop: () => canDrag,
      hover(item: DragItem, monitor) {
        if (!canDrag || !dropRef.current) return;
        const dragIndex = item.index;
        const hoverIndex = index;
        if (dragIndex === hoverIndex) return;

        const rect = dropRef.current.getBoundingClientRect();
        const client = monitor.getClientOffset();
        if (!client) return;
        const hoverY = client.y - rect.top;

        // Más sensible que 50%: cruza antes el borde de la fila y el reorden se siente menos “pegado”.
        const edgeFraction = 0.22;
        const topZone = rect.height * edgeFraction;
        const bottomZone = rect.height * (1 - edgeFraction);

        if (dragIndex < hoverIndex && hoverY < topZone) return;
        if (dragIndex > hoverIndex && hoverY > bottomZone) return;

        moveRow(dragIndex, hoverIndex);
        item.index = hoverIndex;
      },
    }),
    [index, moveRow, canDrag]
  );

  drop(dropRef);

  return (
    <div
      ref={dropRef}
      className={isDragging ? "opacity-60" : undefined}
      style={{ touchAction: canDrag ? "manipulation" : undefined }}
    >
      {children(drag)}
    </div>
  );
}
