"use client";

import { Button } from "@/components/ui/button";
import type { Category } from "@/types/task";

export function Filters({ search, setSearch, categories, selectedCategories, setSelectedCategories, filterWeeks, setFilterWeeks, }: {
  search: string;
  setSearch: (value: string) => void;
  categories: Category[];
  selectedCategories: Category[];
  setSelectedCategories: (value: Category[]) => void;
  filterWeeks: 1 | 2 | 3 | null;
  setFilterWeeks: (value: 1 | 2 | 3 | null) => void;
}) {
  return (
    <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
      <input
        className="border rounded-md px-3 py-2 w-full"
        placeholder="Search tasks by name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="flex flex-wrap gap-2 items-center">
        {categories.map((c) => {
          const checked = selectedCategories.includes(c);
          return (
            <label key={c} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) =>
                  setSelectedCategories(
                    e.target.checked ? [...selectedCategories, c] : selectedCategories.filter((x) => x !== c)
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
  );
}

