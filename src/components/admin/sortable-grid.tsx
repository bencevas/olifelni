"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { placeListing } from "@/app/admin/actions";

export type SortableItem = { id: string; card: ReactNode };

/**
 * The admin card grid, reorderable by dragging.
 *
 * Mouse: a drag starts after 8px of movement, so plain clicks on the buttons, links and
 * status select inside a card still work. Touch: press and hold for a quarter second, so
 * an ordinary swipe still scrolls the page — the owner mostly manages stock from a phone.
 */
export function SortableGrid({ items }: { items: SortableItem[] }) {
  const router = useRouter();
  const [, start] = useTransition();

  // Local order for an instant drop; reset whenever the server sends a different list
  // (filters, the order buttons, or the save after a drop).
  const serverKey = items.map((i) => i.id).join();
  const [order, setOrder] = useState({ key: serverKey, ids: items.map((i) => i.id) });
  if (order.key !== serverKey) setOrder({ key: serverKey, ids: items.map((i) => i.id) });

  // The click that ends a drag lands on whatever is under the pointer — usually the card's
  // own link. Swallow it, or every drop would open the edit page.
  const justDragged = useRef(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd({ active, over }: DragEndEvent) {
    justDragged.current = true;
    setTimeout(() => (justDragged.current = false), 0);
    if (!over || active.id === over.id) return;

    const from = order.ids.indexOf(String(active.id));
    const to = order.ids.indexOf(String(over.id));
    const ids = arrayMove(order.ids, from, to);
    setOrder({ key: order.key, ids });

    const at = ids.indexOf(String(active.id));
    start(async () => {
      try {
        await placeListing(String(active.id), ids[at - 1] ?? null, ids[at + 1] ?? null);
      } catch {
        router.refresh(); // put the grid back to what was actually saved
      }
    });
  }

  const cards = new Map(items.map((i) => [i.id, i.card]));

  return (
    <DndContext id="admin-grid" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={order.ids} strategy={rectSortingStrategy}>
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {order.ids.map((id) => (
            <Sortable key={id} id={id} justDragged={justDragged}>
              {cards.get(id)}
            </Sortable>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function Sortable({
  id,
  justDragged,
  children,
}: {
  id: string;
  justDragged: React.RefObject<boolean>;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <li
      ref={(el) => {
        setNodeRef(el);
        // Also the keyboard activator, so Enter on a link or button inside the card does
        // that, rather than picking the whole card up.
        setActivatorNodeRef(el);
      }}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      // Links and images are natively draggable, which would hijack the mouse drag.
      onDragStart={(e) => e.preventDefault()}
      onClickCapture={(e) => {
        if (justDragged.current) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      className={`relative flex touch-manipulation select-none flex-col [-webkit-touch-callout:none] overflow-hidden rounded-xl border border-rule-soft bg-surface ${
        isDragging ? "z-10 cursor-grabbing shadow-[0_18px_40px_-12px_rgba(13,14,17,0.45)] ring-2 ring-brand" : "cursor-grab"
      }`}
    >
      {children}
    </li>
  );
}
