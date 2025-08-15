"use client";

import { addDays, format } from "date-fns";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useDraggable, useDroppable } from "@dnd-kit/core";
import { useState, useMemo } from "react";
import { CATEGORIES } from "@/components/planner/constants";
import type { Category, Task } from "@/types/task";

export type CategoryBoardProps = {
  day: Date;
  onChangeDay: (newDay: Date) => void;
  tasks: Task[];
  idOrder: Record<string, number>; // larger index means newer task
  onEdit: (task: Task) => void;
  onMoveCategory?: (taskId: string, newCategory: Category, insertBeforeTaskId?: string) => void;
};

export function CategoryBoard({ day, onChangeDay, tasks, idOrder, onEdit, onMoveCategory }: CategoryBoardProps) {
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);
  const taskById = useMemo(() => {
    const map: Record<string, Task> = {};
    for (const t of tasks) map[t.id] = t;
    return map;
  }, [tasks]);
  const tasksByCategory: Record<string, Task[]> = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = [];
    return acc;
  }, {} as Record<string, Task[]>);

  for (const t of tasks) {
    (tasksByCategory[t.category] ??= []).push(t);
  }

  // Respect the provided order of tasks; do not sort here so drop insertion is preserved

  return (
    <section className="mb-4 sm:mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg sm:text-xl font-semibold">Tasks on {format(day, "PPP")}</h2>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 text-xs sm:text-sm rounded-lg bg-gray-100 hover:bg-gray-200"
            onClick={() => onChangeDay(addDays(day, -1))}
          >
            Prev
          </button>
          <button
            className="px-3 py-1 text-xs sm:text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600"
            onClick={() => onChangeDay(new Date())}
          >
            Today
          </button>
          <button
            className="px-3 py-1 text-xs sm:text-sm rounded-lg bg-gray-100 hover:bg-gray-200"
            onClick={() => onChangeDay(addDays(day, 1))}
          >
            Next
          </button>
        </div>
      </div>

      <DndContext
        onDragStart={(e: DragStartEvent) => {
          const activeId = String(e.active.id);
          const taskId = activeId.startsWith("task:") ? activeId.slice(5) : activeId;
          setActiveDragTask(taskById[taskId] ?? null);
        }}
        onDragEnd={(e: DragEndEvent) => {
          if (!onMoveCategory) return;
          const overId = e.over?.id ? String(e.over.id) : null;
          const activeId = String(e.active.id);
          if (!overId) return;
          const taskId = activeId.startsWith("task:") ? activeId.slice(5) : activeId;
          
          if (overId.startsWith("cat:")) {
            // dropped into empty space in a category
            const newCategory = overId.slice(4) as Category;
            onMoveCategory(taskId, newCategory, undefined); // undefined = append
          } else if (overId.startsWith("task:")) {
            // dropped on another task
            const overTaskId = overId.slice(5);
            const overTask = taskById[overTaskId];
            if (!overTask) return;
            const newCategory = overTask.category;
            onMoveCategory(taskId, newCategory, overTaskId); // insert before this task id
          }
          
          setActiveDragTask(null);
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {CATEGORIES.map((cat) => (
            <CategoryColumn key={cat} category={cat} tasks={tasksByCategory[cat] ?? []} onEdit={onEdit} />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeDragTask ? (
            <div className="text-left w-56 rounded-md border bg-white px-3 py-2 shadow-lg ring-1 ring-black/10">
              <div className="text-sm font-medium truncate">{activeDragTask.name}</div>
              <div className="text-xs text-gray-500 truncate">
                {format(new Date(activeDragTask.start), "yyyy-MM-dd")} <span className="mx-1">→</span> {format(new Date(activeDragTask.end), "yyyy-MM-dd")}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
}

function CategoryColumn({ category, tasks, onEdit }: { category: Category; tasks: Task[]; onEdit: (task: Task) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `cat:${category}` });
  return (
    <div ref={setNodeRef} className={`bg-gray-50 border rounded-lg p-3 min-h-[140px] ${isOver ? "ring-2 ring-sky-400" : ""}`}>
      <div className="text-sm font-semibold mb-2">{category}</div>
      <div className="flex flex-col gap-2">
        {tasks.map((t) => (
          <SortableContext key={t.id} task={t} onEdit={onEdit} />
        ))}
        {tasks.length === 0 && <div className="text-xs text-gray-400">No tasks</div>}
      </div>
    </div>
  );
}

function SortableContext({ task, onEdit }: { task: Task; onEdit: (task: Task) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `task:${task.id}` });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `task:${task.id}` });
  return (
    <div
       ref={(node) => {
        setNodeRef(node);
        setDropRef(node); // <-- add this so the card is droppable
      }}
      className={`text-left w-full rounded-md border bg-white hover:bg-gray-50 px-3 py-2 shadow-sm ${isDragging ? "opacity-70" : ""}`}
      onClick={() => onEdit(task)}
      {...listeners}
      {...attributes}
    >
      <div className="text-sm font-medium truncate">{task.name}</div>
      <div className="text-xs text-gray-500 truncate">
        {format(new Date(task.start), "yyyy-MM-dd")} <span className="mx-1">→</span> {format(new Date(task.end), "yyyy-MM-dd")}
      </div>
    </div>
  );
}

