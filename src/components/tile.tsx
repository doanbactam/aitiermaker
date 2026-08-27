"use client";

import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import type { CatalogItem } from "@/lib/types";
import { MARKS } from "@/data/icons";
import { imageSources, fallbackSource, fbColor } from "@/lib/logos";
import { cn } from "@/lib/cn";
import { imgOutline } from "@/lib/ui-styles";

export function Mark({ mark, domain, name, size = 22 }: { mark?: string; domain: string; name?: string; size?: number }) {
  const m = mark ? MARKS[mark] : undefined;
  if (m) {
    const dark = parseInt(m.bg.slice(1, 3), 16) * 0.299 + parseInt(m.bg.slice(3, 5), 16) * 0.587 + parseInt(m.bg.slice(5, 7), 16) * 0.114 < 60;
    return (
      <span
        className={cn("grid shrink-0 place-items-center rounded-[5px]", dark && "shadow-[inset_0_0_0_1px_#2e2e35]")}
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
        <span className="grid size-full place-items-center rounded-[5px] text-xs font-extrabold text-[#101013]" style={{ background: fbColor(fbSrc) }}>
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
          fb.className = "grid size-full place-items-center rounded-[5px] text-xs font-extrabold text-[#101013]";
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

  return (
    <div
      ref={setNodeRef}
      data-id={id}
      className={cn(
        "group/tile relative inline-flex h-10 cursor-default touch-manipulation select-none items-center gap-1 rounded-lg border border-line bg-panel2 py-0 ps-1 pe-1.5 transition-[border-color,background] duration-150",
        "hover:border-line2 hover:bg-[color-mix(in_srgb,var(--color-panel2)_88%,var(--color-fg))]",
        "has-[:focus-visible]:border-line2",
        selected && "border-lime shadow-[0_0_0_1px_var(--color-lime)]",
        isDragging && "cursor-grabbing opacity-40",
        ghost && "pointer-events-none opacity-15",
      )}
      style={{ transform: CSS.Transform.toString(transform), transition, display: hidden ? "none" : undefined }}
      onClick={(e) => onClick(id, { shift: e.shiftKey, additive: e.metaKey || e.ctrlKey })}
      onDoubleClick={() => onSendBack(id)}
    >
      {removable && onRemove && (
        <button
          type="button"
          className={cn(
            "absolute -start-2 -top-2 grid size-7 place-items-center rounded-full border border-line2 bg-panel2 text-mut opacity-0 transition-[opacity,background,color,scale] duration-150",
            "group-hover/tile:opacity-100 focus-visible:opacity-100 hover:bg-panel hover:text-fg active:scale-96 touch-show",
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

      {/* The logo doubles as the select control: selection is the app's primary
          action, so it needs a real button. The tile root cannot take the role
          itself — it wraps a contenteditable name and two other buttons. */}
      <button
        type="button"
        className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md border-0 bg-transparent p-0 transition-[background-color] duration-150 hover:bg-hover"
        aria-pressed={selected}
        aria-label={`Select ${name}`}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onClick(id, { shift: e.shiftKey, additive: e.metaKey || e.ctrlKey });
        }}
      >
        <Mark mark={facts?.mark} domain={domain} name={name} />
      </button>

      <span
        className={cn(
          "cursor-text rounded px-0.5 text-[13px] font-semibold whitespace-nowrap outline-none",
          "focus:bg-hover focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-lime)_45%,transparent)]",
          "group-hover/tile:underline group-hover/tile:decoration-mut2/55 group-hover/tile:underline-offset-[3px] group-focus-within/tile:group-hover/tile:no-underline",
        )}
        role="textbox"
        aria-label={`Rename ${name}`}
        contentEditable="plaintext-only"
        suppressContentEditableWarning
        spellCheck={false}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onBlur={(e) => {
          const next = e.currentTarget.textContent?.trim() ?? "";
          if (next && next !== name) onRename(id, next);
          e.currentTarget.textContent = next && next !== name ? next : name;
        }}
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

      <button
        type="button"
        className="grid size-7 shrink-0 cursor-grab touch-none place-items-center rounded border-0 bg-transparent text-mut2 transition-[color,background-color] duration-150 group-hover/tile:text-mut hover:bg-hover active:cursor-grabbing"
        aria-label={`Drag ${name}`}
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={12} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
});
