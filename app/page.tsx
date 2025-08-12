"use client";

import { useMemo, useState, useEffect } from "react";
import { addDays, endOfMonth, format, isSameDay, isWithinInterval, startOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

type Category = "To Do" | "In Progress" | "Review" | "Completed";

type Task = {
  id: string;
  name: string;
  category: Category;
  start: string; // ISO date
  end: string;   // ISO date
};

const categories: Category[] = ["To Do", "In Progress", "Review", "Completed"];

function useLocalStorageState<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : defaultValue;
  });
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue] as const;
}

function daysGrid(baseDate: Date) {
  const start = startOfWeek(startOfMonth(baseDate), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(baseDate), { weekStartsOn: 0 });
  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
  return days;
}

function overlaps(task: Task, day: Date) {
  return isWithinInterval(day, { start: new Date(task.start), end: new Date(task.end) });
}

export default function PlannerPage() {
  const [currentMonth] = useState(new Date());
  const [tasks, setTasks] = useLocalStorageState<Task[]>("tasks", []);
  const [selection, setSelection] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftCategory, setDraftCategory] = useState<Category>("To Do");
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  // drag-to-select range state
  const [dragSelectStart, setDragSelectStart] = useState<Date | null>(null);
  const [dragSelectHover, setDragSelectHover] = useState<Date | null>(null);
  // edge-resize state
  const [resizing, setResizing] = useState<{ taskId: string | null; edge: "left" | "right" | null }>({
    taskId: null,
    edge: null,
  });
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  function startResize(taskId: string, edge: "left" | "right") {
    setResizing({ taskId, edge });
  }

  const [filterCategories, setFilterCategories] = useState<Category[]>(categories);
  const [filterWeeks, setFilterWeeks] = useState<1 | 2 | 3 | null>(null);
  const [search, setSearch] = useState("");

  const days = useMemo(() => daysGrid(currentMonth), [currentMonth]);

  const filteredTasks = useMemo(() => {
    const byCat = tasks.filter((t) => filterCategories.includes(t.category));
    const bySearch = byCat.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));
    if (!filterWeeks) return bySearch;
    const now = new Date();
    const horizon = addDays(now, filterWeeks * 7);
    return bySearch.filter((t) => isWithinInterval(new Date(t.start), { start: now, end: horizon }) || isWithinInterval(new Date(t.end), { start: now, end: horizon }));
  }, [tasks, filterCategories, filterWeeks, search]);

  function openCreateModal(rangeStart: Date, rangeEnd: Date) {
    setDraftName("");
    setDraftCategory("To Do");
    setSelection({ start: rangeStart, end: rangeEnd });
    setIsModalOpen(true);
  }

  // global mouseup to end select/resize
  useEffect(() => {
    function handleMouseUp() {
      if (dragSelectStart) {
        const start = dragSelectStart;
        const end = dragSelectHover ?? dragSelectStart;
        openCreateModal(start < end ? start : end, start < end ? end : start);
        setDragSelectStart(null);
        setDragSelectHover(null);
      }
      if (resizing.taskId) {
        setResizing({ taskId: null, edge: null });
      }
    }
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [dragSelectStart, dragSelectHover, resizing.taskId]);

  function createTask() {
    if (!selection.start || !selection.end) return;
    const newTask: Task = {
      id: Math.random().toString(36).slice(2),
      name: draftName || "Untitled Task",
      category: draftCategory,
      start: selection.start.toISOString(),
      end: selection.end.toISOString(),
    };
    setTasks((prev) => [...prev, newTask]);
    setIsModalOpen(false);
  }

  function openEdit(task: Task) {
    setEditTaskId(task.id);
    setDraftName(task.name);
    setDraftCategory(task.category);
    setIsEditOpen(true);
  }

  function saveEdit() {
    if (!editTaskId) return;
    setTasks((prev) => prev.map((t) => (t.id === editTaskId ? { ...t, name: draftName, category: draftCategory } : t)));
    setIsEditOpen(false);
    setEditTaskId(null);
  }

  function onDragStart(event: DragStartEvent) {
    setActiveTaskId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    const { over, active } = event;
    setActiveTaskId(null);
    if (!over) return;
    const taskId = String(active.id);
    const dayIso = String(over.id);
    setTasks((prev) => {
      const task = prev.find((t) => t.id === taskId);
      if (!task) return prev;
      const durationDays = Math.max(1, Math.ceil((new Date(task.end).getTime() - new Date(task.start).getTime()) / (1000 * 60 * 60 * 24)) + 1);
      const newStart = new Date(dayIso);
      const newEnd = addDays(newStart, durationDays - 1);
      return prev.map((t) => (t.id === taskId ? { ...t, start: newStart.toISOString(), end: newEnd.toISOString() } : t));
    });
  }

  function resizeTask(taskId: string, edge: "left" | "right", targetDay: Date) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const start = new Date(t.start);
        const end = new Date(t.end);
        if (edge === "left") {
          // only allow shrinking from the left; never extend earlier than current start
          if (targetDay > start) {
            const nextStart = targetDay <= end ? targetDay : end;
            return { ...t, start: nextStart.toISOString() };
          }
          return t;
        }
        // right edge: allow extension and shrinking forward
        const nextEnd = targetDay >= start ? targetDay : start;
        return { ...t, end: nextEnd.toISOString() };
      })
    );
  }

  return (
    <main className="min-h-screen p-6 md:p-10">
      <h1 className="text-2xl font-bold mb-4">Month View Task Planner</h1>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          className="border rounded-md px-3 py-2 w-full"
          placeholder="Search tasks by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2 items-center">
          {categories.map((c) => {
            const checked = filterCategories.includes(c);
            return (
              <label key={c} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) =>
                    setFilterCategories((prev) =>
                      e.target.checked ? [...prev, c] : prev.filter((x) => x !== c)
                    )
                  }
                />
                {c}
              </label>
            );
          })}
        </div>
        <div className="flex gap-2 items-center">
          {[1, 2, 3].map((w) => (
            <Button
              key={w}
              variant={filterWeeks === (w as 1 | 2 | 3) ? "primary" : "default"}
              onClick={() => setFilterWeeks(filterWeeks === (w as 1 | 2 | 3) ? null : (w as 1 | 2 | 3))}
              className="text-xs"
            >
              {`Within ${w} week${w > 1 ? "s" : ""}`}
            </Button>
          ))}
        </div>
      </div>

      <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-7 gap-y-2 gap-x-0 select-none">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-sm font-semibold text-center py-1">
              {d}
            </div>
          ))}
          {days.map((day) => {
            const dayIso = day.toISOString();
            return (
              <DayCell
                key={dayIso}
                date={day}
                dayId={dayIso}
                tasks={filteredTasks.filter((t) => overlaps(t, day))}
                onDragSelect={(start, end) => openCreateModal(start, end)}
                onResize={resizeTask}
                onEdit={openEdit}
                onMouseDownDay={(d) => {
                  setDragSelectStart(d);
                  setDragSelectHover(d);
                }}
                onMouseEnterDay={(d) => {
                  if (dragSelectStart) setDragSelectHover(d);
                  if (resizing.taskId && resizing.edge) resizeTask(resizing.taskId, resizing.edge, d);
                }}
                isInSelectingRange={
                  !!dragSelectStart && !!dragSelectHover &&
                  isWithinInterval(day, {
                    start: dragSelectStart < dragSelectHover ? dragSelectStart : dragSelectHover,
                    end: dragSelectStart < dragSelectHover ? dragSelectHover : dragSelectStart,
                  })
                }
                onStartResize={startResize}
              />
            );
          })}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeTaskId ? (
            <OverlayTask task={tasks.find((t) => t.id === activeTaskId)!} />
          ) : null}
        </DragOverlay>
      </DndContext>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <input
              className="border rounded-md px-3 py-2"
              placeholder="Task name"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
            />
            <select
              className="border rounded-md px-3 py-2"
              value={draftCategory}
              onChange={(e) => setDraftCategory(e.target.value as Category)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={createTask}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <input
              className="border rounded-md px-3 py-2"
              placeholder="Task name"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
            />
            <select
              className="border rounded-md px-3 py-2"
              value={draftCategory}
              onChange={(e) => setDraftCategory(e.target.value as Category)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={saveEdit}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

type DayCellProps = {
  date: Date;
  dayId: string;
  tasks: Task[];
  onDragSelect: (start: Date, end: Date) => void;
  onResize: (taskId: string, edge: "left" | "right", targetDay: Date) => void;
  onEdit: (task: Task) => void;
  onMouseDownDay: (date: Date) => void;
  onMouseEnterDay: (date: Date) => void;
  isInSelectingRange: boolean;
  onStartResize: (taskId: string, edge: "left" | "right") => void;
};

function DayCell({ date, dayId, tasks, onDragSelect, onResize, onEdit, onMouseDownDay, onMouseEnterDay, isInSelectingRange, onStartResize }: DayCellProps) {
  const { isOver, setNodeRef } = useDroppable({ id: dayId });

  return (
    <div
      id={dayId}
      ref={setNodeRef}
      onMouseDown={() => onMouseDownDay(date)}
      onMouseEnter={() => onMouseEnterDay(date)}
      className={`border rounded-md h-28 p-0 relative ${isOver ? "ring-2 ring-sky-400" : ""} ${isInSelectingRange ? "bg-sky-50" : ""}`}
    >
      <div className="text-xs text-slate-500 pl-1 pt-1">{format(date, "d")}</div>
      <div className="absolute inset-x-0 bottom-1 top-6 flex flex-col gap-1">
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} currentDate={date} onResize={onResize} onEdit={onEdit} onStartResize={onStartResize} />
        ))}
      </div>
    </div>
  );
}

function TaskRow({ task, currentDate, onResize, onEdit, onStartResize }: { task: Task; currentDate: Date; onResize: DayCellProps["onResize"]; onEdit: (task: Task) => void; onStartResize: (taskId: string, edge: "left" | "right") => void }) {
  const start = new Date(task.start);
  const end = new Date(task.end);
  const isStart = isSameDay(currentDate, start);
  const isEnd = isSameDay(currentDate, end);

  const color: Record<Category, string> = {
    "To Do": "bg-slate-300",
    "In Progress": "bg-blue-300",
    Review: "bg-amber-300",
    Completed: "bg-emerald-300",
  };

  if (isStart) {
    return <DraggableTaskChip task={task} colorClass={color[task.category]} onResize={onResize} onEdit={onEdit} currentDate={currentDate} isEnd={isEnd} onStartResize={onStartResize} />;
  }
  return (
    <div className={`h-6 rounded-none flex items-center ${color[task.category]}`} onDoubleClick={() => onEdit(task)}>
      <div className="flex-1 px-2 text-xs truncate">{task.name}</div>
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

function DraggableTaskChip({ task, colorClass, onResize, onEdit, currentDate, isEnd, onStartResize }: { task: Task; colorClass: string; onResize: DayCellProps["onResize"]; onEdit: (task: Task) => void; currentDate: Date; isEnd: boolean; onStartResize: (taskId: string, edge: "left" | "right") => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      className={`h-6 ${isEnd ? "rounded-r-md" : "rounded-none"} rounded-l-md flex items-center ${colorClass} ${isDragging ? "opacity-70" : ""}`}
      style={{ transform: CSS.Translate.toString(transform) }}
      onDoubleClick={() => onEdit(task)}
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

function OverlayTask({ task }: { task: Task }) {
  const color: Record<Category, string> = {
    "To Do": "bg-slate-300",
    "In Progress": "bg-blue-300",
    Review: "bg-amber-300",
    Completed: "bg-emerald-300",
  };
  return (
    <div className={`h-6 rounded-md flex items-center ${color[task.category]} px-2 text-xs`}>{task.name}</div>
  );
}

