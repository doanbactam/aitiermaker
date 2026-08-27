"use client";

import { memo, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import type { CatalogItem } from "@/lib/types";
import { MARKS } from "@/data/icons";
import { imageSources, fallbackSource, fbColor, isLogoDevUrl } from "@/lib/logos";
import { cn } from "@/lib/cn";
import { imgOutline } from "@/lib/ui-styles";

export function Mark({ mark, domain, name, size = 22 }: { mark?: string; domain: string; name?: string; size?: number }) {
  const m = mark ? MARKS[mark] : undefined;
  if (m) {
    const dark = parseInt(m.bg.slice(1, 3), 16) * 0.299 + parseInt(m.bg.slice(3, 5), 16) * 0.587 + parseInt(m.bg.slice(5, 7), 16) * 0.114 < 60;
    return (
      <span
        className={cn("grid shrink-0 place-items-center rounded-[5px]", dark && "shadow-[inset_0_0_0_1px_var(--color-line2)]")}
        style={{ background: m.bg, width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" width={size - 8} height={size - 8} aria-hidden="true">
          <path d={m.path} fill={m.fg} />
        </svg>
      </span>
    );
  }

  const sources = imageSources(domain);
  const fbSrc = fallbackSource(name ?? "", domain);

  if (!sources.length) {
    return (
      <span className="grid shrink-0 place-items-center rounded-[5px]" style={{ width: size, height: size }}>
        <span className="grid size-full place-items-center rounded-[5px] text-xs font-extrabold text-on-lime" style={{ background: fbColor(fbSrc) }}>
          {fbSrc[0].toUpperCase()}
        </span>
      </span>
    );
  }

  return (
    <span className="grid shrink-0 place-items-center rounded-[5px]" style={{ width: size, height: size }}>
      <img
        src={sources[0]}
        alt=""
        width={size - 7}
        height={size - 7}
        loading="lazy"
        decoding="async"
        draggable={false}
        referrerPolicy={isLogoDevUrl(sources[0]) ? "origin" : undefined}
        className={cn("rounded-[3px] object-contain pointer-events-none", imgOutline)}
        data-step="0"
        onError={(e) => {
          const img = e.currentTarget;
          const step = Number(img.dataset.step) + 1;
          if (step < sources.length) {
            img.dataset.step = String(step);
            img.src = sources[step];
            return;
          }
          const fb = document.createElement("span");
          fb.className = "grid size-full place-items-center rounded-[5px] text-xs font-extrabold text-on-lime";
          fb.style.background = fbColor(fbSrc);
          fb.textContent = fbSrc[0].toUpperCase();
          img.replaceWith(fb);
        }}
      />
    </span>
  );
}

export type SelectOpts = { shift?: boolean; additive?: boolean };

interface TileProps {
  id: string;
  name: string;
  domain: string;
  facts?: CatalogItem;
  selected: boolean;
  hidden?: boolean;
  ghost?: boolean;
  removable?: boolean;
  onClick: (id: string, opts: SelectOpts) => void;
  onSendBack: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onRemove?: (id: string) => void;
}

export const Tile = memo(function Tile({ id, name, domain, facts, selected, hidden, ghost, removable, onClick, onSendBack, onRename, onRemove }: TileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, data: { type: "item" } });
  const [editing, setEditing] = useState(false);
  const editRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!editing || !editRef.current) return;
    editRef.current.focus();
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editRef.current);
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, [editing]);

  const pick = (e: MouseEvent | KeyboardEvent) => {
    onClick(id, { shift: e.shiftKey, additive: e.metaKey || e.ctrlKey });
  };

  const finishEdit = (el: HTMLSpanElement) => {
    const next = el.textContent?.trim() ?? "";
    if (next && next !== name) onRename(id, next);
    el.textContent = next && next !== name ? next : name;
    setEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      data-id={id}
      className={cn(
        "group/tile relative inline-flex min-h-11 touch-manipulation select-none items-stretch gap-0 rounded-lg border border-line bg-panel2 transition-[border-color,background] duration-150",
        "hover:border-line2 hover:bg-[color-mix(in_srgb,var(--color-panel2)_88%,var(--color-fg))]",
        "has-[:focus-visible]:border-line2",
        selected && "border-lime shadow-[0_0_0_1px_var(--color-lime)]",
        isDragging && "cursor-grabbing opacity-40",
        ghost && "pointer-events-none opacity-15",
      )}
      style={{ transform: CSS.Transform.toString(transform), transition, display: hidden ? "none" : undefined }}
    >
      {removable && onRemove && (
        <button
          type="button"
          className={cn(
            "absolute -start-2 -top-2 z-1 grid size-7 place-items-center rounded-full border border-line2 bg-panel2 text-mut opacity-0 transition-[opacity,background,color,scale] duration-150",
            "group-hover/tile:opacity-100 focus-visible:opacity-100 hover:bg-panel hover:text-fg active:scale-96 touch-show",
            "before:absolute before:-inset-2 before:rounded-full before:content-['']",
          )}
          aria-label={`Remove ${name} from board`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(id);
          }}
        >
          <X size={11} strokeWidth={2} aria-hidden="true" />
        </button>
      )}

      {editing ? (
        <span
          ref={editRef}
          className="flex min-h-11 min-w-0 flex-1 cursor-text items-center rounded-s-lg px-2 text-[13px] font-semibold outline-none [overflow-wrap:anywhere] focus:shadow-[inset_0_0_0_2px_color-mix(in_srgb,var(--color-lime)_45%,transparent)]"
          role="textbox"
          aria-label={`Rename ${name}`}
          contentEditable="plaintext-only"
          suppressContentEditableWarning
          spellCheck={false}
          onBlur={(e) => finishEdit(e.currentTarget)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
            if (e.key === "Escape") {
              e.currentTarget.textContent = name;
              e.currentTarget.blur();
            }
          }}
        >
          {name}
        </span>
      ) : (
        <button
          type="button"
          className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded-s-lg border-0 bg-transparent py-0 ps-1.5 pe-1 text-start transition-[background-color] duration-150 hover:bg-hover focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_color-mix(in_srgb,var(--color-lime)_45%,transparent)]"
          aria-pressed={selected}
          aria-label={selected ? `Deselect ${name}` : `Select ${name}`}
          onClick={pick}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setEditing(true);
          }}
        >
          <Mark mark={facts?.mark} domain={domain} name={name} />
          <span className="min-w-0 truncate text-[13px] font-semibold">{name}</span>
        </button>
      )}

      <button
        type="button"
        className="relative grid w-9 shrink-0 cursor-grab touch-none place-items-center rounded-e-lg border-0 border-s border-line bg-transparent text-mut2 transition-[color,background-color] duration-150 group-hover/tile:text-mut hover:bg-hover active:cursor-grabbing before:absolute before:-inset-2 before:rounded before:content-['']"
        aria-label={`Drag ${name}`}
        title="Drag · double-click to unrank"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onSendBack(id);
        }}
      >
        <GripVertical size={12} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
});
