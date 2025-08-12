"use client";

import { format } from "date-fns";
import { useDroppable } from "@dnd-kit/core";
import type { Task } from "@/types/task";
import { TaskChip } from "@/components/planner/TaskChip";

export type DayCellProps = {
  date: Date;
  dayId: string;
  tasks: Task[];
  laneByTaskId: Record<string, number>;
  laneCount: number; // kept for API completeness; can be used for dynamic height in future
  onEdit: (task: Task) => void;
  onMouseDownDay: (date: Date) => void;
  onMouseEnterDay: (date: Date) => void;
  isInSelectingRange: boolean;
  onStartResize: (taskId: string, edge: "left" | "right") => void;
};

export function DayCell({ date, dayId, tasks, laneByTaskId, onEdit, onMouseDownDay, onMouseEnterDay, isInSelectingRange, onStartResize }: DayCellProps) {
  const { isOver, setNodeRef } = useDroppable({ id: dayId });

  return (
    <div
      id={dayId}
      ref={setNodeRef}
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        const target = e.target as HTMLElement | null;
        if (target && target.closest('[data-task-chip="true"]')) return;
        onMouseDownDay(date);
      }}
      onMouseEnter={() => onMouseEnterDay(date)}
      className={`border rounded-md h-28 p-0 relative ${isOver ? "ring-2 ring-sky-400" : ""} ${isInSelectingRange ? "bg-sky-50" : ""}`}
    >
      <div className="text-xs text-slate-500 pl-1 pt-1">{format(date, "d")}</div>
      <div className="absolute inset-x-0 bottom-1 top-6">
        {tasks.map((t) => (
          <TaskChip
            key={t.id}
            task={t}
            lane={laneByTaskId[t.id] ?? 0}
            currentDate={date}
            onEdit={onEdit}
            onStartResize={onStartResize}
          />
        ))}
      </div>
    </div>
  );
}

