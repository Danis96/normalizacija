import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { GripVertical } from 'lucide-react';

const ITEM_TYPE = 'DASHBOARD_SECTION';

interface DraggableDashboardItemProps {
  id: string;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  children: React.ReactNode;
}

interface DragItem {
  id: string;
  index: number;
}

export function DraggableDashboardItem({ id, index, moveItem, children }: DraggableDashboardItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: ITEM_TYPE,
    item: (): DragItem => ({ id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: ITEM_TYPE,
    hover: (item: DragItem, monitor) => {
      if (!ref.current) return;

      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveItem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  dragPreview(drop(ref));

  return (
    <div
      ref={ref}
      className={`relative group transition-all duration-200 ${
        isDragging ? 'opacity-40 scale-[0.98]' : 'opacity-100'
      } ${isOver && canDrop ? 'ring-4 ring-pink-400 ring-offset-2 rounded-2xl' : ''}`}
    >
      {/* Drag handle */}
      <div
        ref={drag}
        className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        title="Drag to reorder"
      >
        <div className="bg-gradient-to-b from-pink-400 to-purple-400 rounded-lg p-1.5 shadow-lg border-2 border-pink-300">
          <GripVertical className="w-5 h-5 text-white" />
        </div>
      </div>
      {children}
    </div>
  );
}
