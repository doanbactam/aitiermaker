"use client";

import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Popover } from "@base-ui-components/react/popover";
import type { CatalogItem } from "@/lib/types";
import { MARKS } from "@/data/icons";
import { logoProviders, fbColor } from "@/lib/logos";
import { fmtCtx } from "@/lib/state";

export function Mark({ mark, domain, name, size = 22 }: { mark?: string; domain: string; name?: string; size?: number }) {
  const m = mark ? MARKS[mark] : undefined;
  if (m) {
    const dark = parseInt(m.bg.slice(1, 3), 16) * 0.299 + parseInt(m.bg.slice(3, 5), 16) * 0.587 + parseInt(m.bg.slice(5, 7), 16) * 0.114 < 60;
    return (
      <span className={`mk${dark ? " dark" : ""}`} style={{ background: m.bg, width: size, height: size }}>
        <svg viewBox="0 0 24 24" width={size - 8} height={size - 8} aria-hidden="true">
          <path d={m.path} fill={m.fg} />
        </svg>
      </span>
    );
  }
  if (!domain) {
    const src = name || "?";
    return (
      <span className="mk" style={{ width: size, height: size }}>
        <span className="fb" style={{ background: fbColor(src) }}>
          {src[0].toUpperCase()}
        </span>
      </span>
    );
  }
  return (
    <span className="mk" style={{ width: size, height: size }}>
      <img
        src={logoProviders(domain)[0]}
        alt=""
        draggable={false}
        data-step="0"
        data-domain={domain}
        onError={(e) => {
          const img = e.currentTarget;
          const step = Number(img.dataset.step) + 1;
          const list = logoProviders(img.dataset.domain!);
          if (step < list.length) {
            img.dataset.step = String(step);
            img.src = list[step];
          } else {
            const fb = document.createElement("span");
            fb.className = "fb";
            fb.style.background = fbColor(img.dataset.domain!);
            fb.textContent = img.dataset.domain![0].toUpperCase();
            img.replaceWith(fb);
          }
        }}
      />
    </span>
  );
}

interface TileProps {
  id: string;
  name: string;
  domain: string;
  facts?: CatalogItem;
  selected: boolean;
  hidden?: boolean;
  onClick: (id: string) => void;
  onSendBack: (id: string) => void;
}

export const Tile = memo(function Tile({ id, name, domain, facts, selected, hidden, onClick, onSendBack }: TileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, data: { type: "item" } });

  return (
    <div
      ref={setNodeRef}
      data-id={id}
      className={`tile${selected ? " sel" : ""}${isDragging ? " dragging" : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition, display: hidden ? "none" : undefined }}
      {...attributes}
      {...listeners}
      onClick={() => onClick(id)}
      onDoubleClick={() => onSendBack(id)}
      aria-label={name}
      aria-pressed={selected}
      aria-grabbed={isDragging}
      title={`${name} — drag to rank, click then click a tier, double-click to unrank`}
    >
      <Mark mark={facts?.mark} domain={domain} name={name} />
      <span className="nm">{name}</span>
      <svg className="grip" viewBox="0 0 24 24" width={12} height={12} aria-hidden="true" fill="currentColor">
        <circle cx="9" cy="5" r="1.7" />
        <circle cx="15" cy="5" r="1.7" />
        <circle cx="9" cy="12" r="1.7" />
        <circle cx="15" cy="12" r="1.7" />
        <circle cx="9" cy="19" r="1.7" />
        <circle cx="15" cy="19" r="1.7" />
      </svg>
      {facts && (
        <Popover.Root>
          <Popover.Trigger
            className="info-btn absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full border border-[#3a3a42] bg-[#26262c] font-mono text-[9px] font-bold text-[#a0a4ac] opacity-0 transition-opacity [div.tile:hover_&]:opacity-100 focus:opacity-100 cursor-pointer leading-none"
            aria-label={`Facts: ${name}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            i
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner sideOffset={8}>
              <Popover.Popup className="factspop">
                <p className="text-[13px] font-bold text-white">
                  {facts.name} <span className="font-normal text-[#8b8f98]">· {facts.vendor}</span>
                </p>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 font-mono text-[11px]">
                  <dt className="text-[#8b8f98] uppercase tracking-wider">License</dt>
                  <dd className="font-semibold">{facts.license ?? "—"}</dd>
                  <dt className="text-[#8b8f98] uppercase tracking-wider">Context</dt>
                  <dd className="font-semibold">{fmtCtx(facts.ctx)}</dd>
                  <dt className="text-[#8b8f98] uppercase tracking-wider">Price</dt>
                  <dd className="font-semibold">{facts.price ? `$${facts.price.in} / $${facts.price.out} MTok` : "—"}</dd>
                  <dt className="text-[#8b8f98] uppercase tracking-wider">Elo ref</dt>
                  <dd className="font-semibold">{facts.elo ?? "—"}</dd>
                  <dt className="text-[#8b8f98] uppercase tracking-wider">Updated</dt>
                  <dd className="font-semibold">{facts.updated}</dd>
                </dl>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      )}
    </div>
  );
});
