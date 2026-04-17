import { useRef, type ReactNode } from "react";
import { useDrag, useDrop } from "react-dnd";

export const PIPELINE_STAGE_ROW_TYPE = "VITERRA_PIPELINE_STAGE_ROW";

type DragItem = { index: number };

type Props = {
  index: number;
  moveRow: (fromIndex: number, toIndex: number) => void;
  canDrag: boolean;
  children: ReactNode;
};

export function PipelineStageReorderRow({ index, moveRow, canDrag, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

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
        if (!canDrag || !ref.current) return;
        const dragIndex = item.index;
        const hoverIndex = index;
        if (dragIndex === hoverIndex) return;

        const rect = ref.current.getBoundingClientRect();
        const mid = (rect.bottom - rect.top) / 2;
        const client = monitor.getClientOffset();
        if (!client) return;
        const hoverY = client.y - rect.top;

        if (dragIndex < hoverIndex && hoverY < mid) return;
        if (dragIndex > hoverIndex && hoverY > mid) return;

        moveRow(dragIndex, hoverIndex);
        item.index = hoverIndex;
      },
    }),
    [index, moveRow, canDrag]
  );

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={isDragging ? "opacity-60" : undefined}
      style={{ touchAction: canDrag ? "none" : undefined }}
    >
      {children}
    </div>
  );
}
