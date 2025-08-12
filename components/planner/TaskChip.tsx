"use client";

import { CSS } from "@dnd-kit/utilities";
import { useDraggable } from "@dnd-kit/core";
import { isSameDay } from "date-fns";
import { useState } from "react";
import type { Category, Task } from "@/types/task";

export type TaskChipProps = {
  task: Task;
  lane: number;
  currentDate: Date;
  onStartResize: (taskId: string, edge: "left" | "right") => void;
  onEdit: (task: Task) => void;
  onShowTooltip: (task: Task, position: { x: number; y: number }) => void;
  onHideTooltip: () => void;
};

const categoryColorClass: Record<Category, string> = {
  "To Do": "bg-slate-300",
  "In Progress": "bg-blue-300",
  Review: "bg-amber-300",
  Completed: "bg-emerald-300",
};

export function TaskChip({ task, lane, currentDate, onStartResize, onEdit, onShowTooltip, onHideTooltip }: TaskChipProps) {
  const start = new Date(task.start);
  const end = new Date(task.end);
  const isStart = isSameDay(currentDate, start);
  const isEnd = isSameDay(currentDate, end);

  const handleMouseEnter = (e: React.MouseEvent) => {
    onShowTooltip(task, { x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    onShowTooltip(task, { x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    onHideTooltip();
  };

  if (isStart) {
    return (
      <DraggableTaskChip
        task={task}
        lane={lane}
        colorClass={categoryColorClass[task.category]}
        isEnd={isEnd}
        onStartResize={onStartResize}
        onEdit={onEdit}
        onShowTooltip={onShowTooltip}
        onHideTooltip={onHideTooltip}
      />
    );
  }
  return (
    <div
      data-task-chip="true"
      className={`h-6 rounded-none flex items-center absolute left-0 right-0`}
      style={{ top: `${lane * (24 + 4)}px`, backgroundColor: undefined }}
      onDoubleClick={() => onEdit(task)}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`${categoryColorClass[task.category]} w-full h-full flex items-center`}>
        {/* Continuation segment: keep color bar but omit repeated text */}
        <div className="flex-1 px-2 text-xs truncate" aria-hidden="true" />
        {isEnd && (
          <button
            className="w-2 h-full cursor-ew-resize rounded-r-md bg-black/20"
            onMouseDown={(e) => {
              e.stopPropagation();
              onStartResize(task.id, "right");
            }}
            onClick={(e) => e.stopPropagation()}
            title="Resize end"
          />
        )}
      </div>
    </div>
  );
}

function DraggableTaskChip({ task, lane, colorClass, isEnd, onStartResize, onEdit, onShowTooltip, onHideTooltip }: { 
  task: Task; 
  lane: number; 
  colorClass: string; 
  isEnd: boolean; 
  onStartResize: (taskId: string, edge: "left" | "right") => void; 
  onEdit: (task: Task) => void;
  onShowTooltip: (task: Task, position: { x: number; y: number }) => void;
  onHideTooltip: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });

  const handleMouseEnter = (e: React.MouseEvent) => {
    onShowTooltip(task, { x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    onShowTooltip(task, { x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    onHideTooltip();
  };

  return (
    <div
      ref={setNodeRef}
      data-task-chip="true"
      className={`h-6 ${isEnd ? "rounded-r-md" : "rounded-none"} rounded-l-md flex items-center absolute left-0 right-0 ${colorClass} ${isDragging ? "opacity-70" : ""}`}
      style={{ transform: CSS.Translate.toString(transform), top: `${lane * (24 + 4)}px` }}
      onDoubleClick={() => onEdit(task)}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className="w-2 h-full cursor-ew-resize rounded-l-md bg-black/20"
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartResize(task.id, "left");
        }}
        onClick={(e) => e.stopPropagation()}
        title="Resize start"
      />
      <div className="flex-1 px-2 text-xs truncate cursor-grab active:cursor-grabbing" {...listeners} {...attributes}>
        {task.name}
      </div>
      {isEnd && (
        <button
          className="w-2 h-full cursor-ew-resize rounded-r-md bg-black/20"
          onMouseDown={(e) => {
            e.stopPropagation();
            onStartResize(task.id, "right");
          }}
          onClick={(e) => e.stopPropagation()}
          title="Resize end"
        />
      )}
    </div>
  );
}

