"use client";

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { addDays, isWithinInterval } from "date-fns";
import { DayCell } from "@/components/planner/DayCell";
import { OverlayTask } from "@/components/planner/OverlayTask";
import type { Task } from "@/types/task";

export type PlannerGridProps = {
  days: Date[];
  filteredTasks: Task[];
  laneByTaskId: Record<string, number>;
  laneCount: number;
  activeTask: Task | null;
  setActiveTaskId: (id: string | null) => void;
  dragSelectStart: Date | null;
  dragSelectHover: Date | null;
  onMouseDownDay: (date: Date) => void;
  onMouseEnterDay: (date: Date) => void;
  onStartResize: (taskId: string, edge: "left" | "right") => void;
  onEdit: (task: Task) => void;
  onDragEndUpdate: (taskId: string, newStart: Date, newEnd: Date) => void;
  onShowTooltip: (task: Task, position: { x: number; y: number }) => void;
  onHideTooltip: () => void;
};

export function PlannerGrid({ days, filteredTasks, laneByTaskId, laneCount, activeTask, setActiveTaskId, dragSelectStart, dragSelectHover, onMouseDownDay, onMouseEnterDay, onStartResize, onEdit, onDragEndUpdate, onShowTooltip, onHideTooltip }: PlannerGridProps) {
  return (
    <DndContext
      onDragStart={(e: DragStartEvent) => setActiveTaskId(String(e.active.id))}
      onDragEnd={(e: DragEndEvent) => {
        const { over, active } = e;
        setActiveTaskId(null);
        if (!over) return;
        const taskId = String(active.id);
        const dayIso = String(over.id);
        const task = filteredTasks.find((t) => t.id === taskId);
        if (!task) return;
        const durationDays = Math.max(1, Math.ceil((new Date(task.end).getTime() - new Date(task.start).getTime()) / (1000 * 60 * 60 * 24)) + 1);
        const newStart = new Date(dayIso);
        const newEnd = addDays(newStart, durationDays - 1);
        onDragEndUpdate(taskId, newStart, newEnd);
      }}
    >
      <div className="w-full overflow-x-auto">
        <div className="min-w-[840px] grid grid-cols-7 gap-y-2 gap-x-0 select-none sm:min-w-0">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-xs sm:text-sm font-semibold text-center py-1">
              {d}
            </div>
          ))}
          {days.map((day) => {
          const dayIso = day.toISOString();
          const isRange = !!dragSelectStart && !!dragSelectHover &&
            isWithinInterval(day, {
              start: dragSelectStart < dragSelectHover ? dragSelectStart : dragSelectHover,
              end: dragSelectStart < dragSelectHover ? dragSelectHover : dragSelectStart,
            });
            return (
              <DayCell
                key={dayIso}
                date={day}
                dayId={dayIso}
                tasks={filteredTasks.filter((t) => isWithinInterval(day, { start: new Date(t.start), end: new Date(t.end) }))}
                laneByTaskId={laneByTaskId}
                laneCount={laneCount}
                onEdit={onEdit}
                onMouseDownDay={onMouseDownDay}
                onMouseEnterDay={onMouseEnterDay}
                isInSelectingRange={isRange}
                onStartResize={onStartResize}
                onShowTooltip={onShowTooltip}
                onHideTooltip={onHideTooltip}
              />
            );
          })}
        </div>
      </div>
      <DragOverlay dropAnimation={null}>{activeTask ? <OverlayTask task={activeTask} /> : null}</DragOverlay>
    </DndContext>
  );
}

