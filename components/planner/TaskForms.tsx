"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Category } from "@/types/task";

export function CreateTaskDialog({ open, onOpenChange, draftName, setDraftName, draftCategory, setDraftCategory, categories, onCreate, }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftName: string;
  setDraftName: (name: string) => void;
  draftCategory: Category;
  setDraftCategory: (category: Category) => void;
  categories: Category[];
  onCreate: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <input
            className="border rounded-md px-3 py-2 bg-white text-black"
            placeholder="Task name"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
          />
          <select
            className="border rounded-md px-3 py-2 bg-white text-black"
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
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onCreate}>
              Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EditTaskDialog({ open, onOpenChange, draftName, setDraftName, draftCategory, setDraftCategory, categories, onSave, }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftName: string;
  setDraftName: (name: string) => void;
  draftCategory: Category;
  setDraftCategory: (category: Category) => void;
  categories: Category[];
  onSave: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <input
            className="border rounded-md px-3 py-2 bg-white text-black"
            placeholder="Task name"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
          />
          <select
            className="border rounded-md px-3 py-2 bg-white text-black"
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
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onSave}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

