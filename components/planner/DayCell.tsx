"use client";

import { format, isSameDay } from "date-fns";
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
  onShowTooltip: (task: Task, position: { x: number; y: number }) => void;
  onHideTooltip: () => void;
};

export function DayCell({ date, dayId, tasks, laneByTaskId, onEdit, onMouseDownDay, onMouseEnterDay, isInSelectingRange, onStartResize, onShowTooltip, onHideTooltip }: DayCellProps) {
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
      className={`border rounded-md h-24 sm:h-28 p-0 relative ${isOver ? "ring-2 ring-sky-400" : ""} ${isInSelectingRange ? "bg-sky-50" : ""} ${isSameDay(date, new Date()) ? "ring-2 ring-blue-500 bg-blue-50 border-blue-300" : ""}`}
    >
      <div className={`text-xs pl-1 pt-1 ${isSameDay(date, new Date()) ? "text-blue-600 font-bold bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center" : "text-slate-500"}`}>
        {format(date, "d")}
      </div>
      <div className="absolute inset-x-0 bottom-1 top-6">
        {tasks.map((t) => (
          <TaskChip
            key={t.id}
            task={t}
            lane={laneByTaskId[t.id] ?? 0}
            currentDate={date}
            onEdit={onEdit}
            onStartResize={onStartResize}
            onShowTooltip={onShowTooltip}
            onHideTooltip={onHideTooltip}
          />
        ))}
      </div>
    </div>
  );
}

