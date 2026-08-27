"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/cn";

const MAX_TITLE = 120;
const PLACEHOLDER = "Name this tier list…";
const DEFAULT_TITLE = "Untitled";

type BoardTitleProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function BoardTitle({ value, onChange, className }: BoardTitleProps) {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);

  const commit = () => {
    const next = draft.trim().slice(0, MAX_TITLE) || DEFAULT_TITLE;
    setDraft(next);
    if (next !== value) onChange(next);
  };

  return (
    <div className={cn("group/title min-w-0", className)}>
      <label htmlFor="board-title" className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-mut">
        List title
      </label>
      <div className="relative">
        <input
          id="board-title"
          type="text"
          value={focused ? draft : value}
          placeholder={PLACEHOLDER}
          maxLength={MAX_TITLE}
          autoComplete="off"
          spellCheck={false}
          aria-label="List title"
          className="board-title-input w-full min-w-0 truncate rounded-md border border-line bg-panel px-3 py-2.5 pe-10 text-[clamp(1.125rem,3vw,1.5rem)] font-bold leading-tight tracking-[-0.03em] text-fg placeholder:font-semibold placeholder:text-mut2 outline-none transition-[border-color,box-shadow,background-color] duration-150 hover:border-line2 focus:border-lime focus:outline-none focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--color-lime)_28%,transparent)] focus:bg-[color-mix(in_oklch,var(--color-lime)_5%,var(--color-panel))]"
          onFocus={(e) => {
            setFocused(true);
            setDraft(value);
            e.currentTarget.select();
          }}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setFocused(false);
            commit();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              setDraft(value);
              e.currentTarget.blur();
            }
          }}
        />
        <Pencil
          size={14}
          strokeWidth={2}
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-mut2 transition-[opacity,color] duration-150",
            focused ? "opacity-0" : "opacity-70 group-hover/title:opacity-100 group-hover/title:text-mut",
          )}
        />
      </div>
    </div>
  );
}
