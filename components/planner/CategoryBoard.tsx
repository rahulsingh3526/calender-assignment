"use client";

import { addDays, format } from "date-fns";
import { CATEGORIES } from "@/components/planner/constants";
import type { Task } from "@/types/task";

export type CategoryBoardProps = {
  day: Date;
  onChangeDay: (newDay: Date) => void;
  tasks: Task[];
  idOrder: Record<string, number>; // larger index means newer task
  onEdit: (task: Task) => void;
};

export function CategoryBoard({ day, onChangeDay, tasks, idOrder, onEdit }: CategoryBoardProps) {
  const tasksByCategory: Record<string, Task[]> = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = [];
    return acc;
  }, {} as Record<string, Task[]>);

  for (const t of tasks) {
    (tasksByCategory[t.category] ??= []).push(t);
  }

  for (const cat of CATEGORIES) {
    tasksByCategory[cat]?.sort((a, b) => (idOrder[b.id] ?? 0) - (idOrder[a.id] ?? 0));
  }

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {CATEGORIES.map((cat) => (
          <div key={cat} className="bg-gray-50 border rounded-lg p-3 min-h-[140px]">
            <div className="text-sm font-semibold mb-2">{cat}</div>
            <div className="flex flex-col gap-2">
              {(tasksByCategory[cat] ?? []).map((t) => (
                <button
                  key={t.id}
                  className="text-left w-full rounded-md border bg-white hover:bg-gray-50 px-3 py-2 shadow-sm"
                  onClick={() => onEdit(t)}
                  title="Edit task"
                >
                  <div className="text-sm font-medium truncate">{t.name}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {format(new Date(t.start), "yyyy-MM-dd")} 
                    <span className="mx-1">→</span>
                    {format(new Date(t.end), "yyyy-MM-dd")}
                  </div>
                </button>
              ))}
              {(tasksByCategory[cat] ?? []).length === 0 && (
                <div className="text-xs text-gray-400">No tasks</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

