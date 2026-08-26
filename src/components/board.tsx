"use client";

import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, closestCorners, pointerWithin, rectIntersection, useSensor, useSensors, useDroppable, MeasuringStrategy } from "@dnd-kit/core";
import type { CollisionDetection, DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Fragment, useRef, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CatalogItem, TierState } from "@/lib/types";
import type { Category } from "@/lib/types";
import { ITEMS } from "@/data/catalog";
import { Tile, Mark, type SelectOpts } from "@/components/tile";
import { cn } from "@/lib/cn";
import { chipBase, chipOn } from "@/lib/ui-styles";

export type ContainerId = string;

export const CAT_FILTERS: readonly [Category | "all", string][] = [
  ["all", "All"],
  ["chat", "Chat"],
  ["coding", "Coding"],
  ["image", "Image"],
  ["video", "Video"],
  ["audio", "Audio"],
  ["local", "Local"],
  ["infra", "Infra"],
];

interface BoardProps {
  state: TierState;
  names: Record<string, [string, string]>;
  factsOf: (id: string) => CatalogItem | undefined;
  selectedIds: readonly string[];
  poolFilter: string;
  catFilter: string;
  onCatFilter: (c: string) => void;
  poolHeader?: React.ReactNode;
  onMove: (id: string, toContainer: ContainerId, beforeId?: string) => void;
  onMoveMany: (ids: readonly string[], toContainer: ContainerId, beforeId?: string) => void;
  onReorder: (container: ContainerId, from: number, to: number) => void;
  onSelect: (id: string, opts: SelectOpts) => void;
  onSelectMany: (ids: string[]) => void;
  onZoneClick: (container: ContainerId, beforeId?: string) => void;
  onSendBack: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onRowLabel: (i: number, field: "l" | "sub", value: string) => void;
  onRowColor: (i: number, color: string) => void;
  onRowDelete: (i: number) => void;
  onRowMove: (i: number, dir: -1 | 1) => void;
  midSlot?: React.ReactNode;
}

const dropZoneClass = (isOver: boolean) =>
  cn(
    "relative flex min-h-[68px] flex-1 flex-wrap content-start gap-2 p-2.5",
    isOver && "bg-[color-mix(in_srgb,var(--color-lime)_5%,transparent)] shadow-[inset_0_0_0_1px_var(--color-lime)]",
  );

const actionBtn =
  "grid size-6 place-items-center rounded border-0 bg-transparent text-mut transition-[background,color,scale] duration-150 hover:bg-[color-mix(in_srgb,var(--color-fg)_8%,transparent)] hover:text-fg active:scale-96 disabled:cursor-default disabled:opacity-30 disabled:active:scale-100";

function RowLabel({ i, row, onLabel }: { i: number; row: TierState["rows"][number]; onLabel: BoardProps["onRowLabel"] }) {
  const long = row.l.length > 2;
  return (
    <div className="group/tlabel relative flex w-24 max-sm:w-[72px] max-sm:px-1 max-sm:py-2 shrink-0 cursor-default flex-col items-center justify-center gap-0.5 px-2 py-2.5" style={{ background: row.c }}>
      <span
        className={cn(
          "z-1 max-w-full cursor-text text-center font-black leading-none text-black/85 outline-none [overflow-wrap:anywhere] rounded-[3px] px-0.5 focus:shadow-[0_0_0_2px_rgba(0,0,0,0.28)]",
          long ? "text-[13px] leading-snug tracking-normal" : "text-[28px] max-sm:text-[22px]",
        )}
        role="textbox"
        aria-label={`Tier ${i + 1} name`}
        contentEditable="plaintext-only"
        suppressContentEditableWarning
        spellCheck={false}
        title="Click to rename tier"
        onInput={(e) => e.currentTarget.classList.toggle("text-[13px]", (e.currentTarget.textContent?.length ?? 0) > 2)}
        onBlur={(e) => onLabel(i, "l", e.currentTarget.textContent?.trim() || "?")}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
      >
        {row.l}
      </span>
      <span
        className={cn(
          "z-1 max-w-full min-h-0 cursor-text text-center font-mono text-[8px] font-bold uppercase tracking-[0.08em] text-black/50 outline-none [overflow-wrap:anywhere] rounded-[3px] px-0.5 max-sm:hidden focus:shadow-[0_0_0_2px_rgba(0,0,0,0.28)]",
          !row.sub && "empty:before:pointer-events-none empty:before:opacity-0 empty:before:content-[attr(data-ph)] group-hover/tlabel:empty:before:opacity-35 group-focus-within/tlabel:empty:before:opacity-35",
        )}
        role="textbox"
        aria-label={`Tier ${row.l} subtitle`}
        contentEditable="plaintext-only"
        suppressContentEditableWarning
        spellCheck={false}
        data-ph="label"
        title="Click to edit label"
        onBlur={(e) => onLabel(i, "sub", e.currentTarget.textContent?.trim() || "")}
      >
        {row.sub}
      </span>
    </div>
  );
}

function RowActions({ i, total, row, onColor, onDelete, onMoveRow }: { i: number; total: number; row: TierState["rows"][number]; onColor: BoardProps["onRowColor"]; onDelete: BoardProps["onRowDelete"]; onMoveRow: BoardProps["onRowMove"] }) {
  return (
    <div
      className={cn(
        "absolute end-1.5 top-1.5 z-2 flex items-center gap-px rounded-sm border border-line p-0.5",
        "bg-[color-mix(in_srgb,var(--color-panel2)_92%,transparent)] backdrop-blur-sm shadow-[0_4px_14px_rgba(0,0,0,0.22)]",
        "pointer-events-none invisible opacity-0 transition-opacity duration-150 ease-[cubic-bezier(0.2,0,0,1)]",
        "group-hover/trow:pointer-events-auto group-hover/trow:visible group-hover/trow:opacity-100",
        "group-focus-within/trow:pointer-events-auto group-focus-within/trow:visible group-focus-within/trow:opacity-100 touch-show",
      )}
      role="toolbar"
      aria-label={`Actions for tier ${row.l}`}
    >
      <label className="relative grid size-6 shrink-0 cursor-pointer place-items-center rounded text-mut transition-[background,color] hover:bg-[color-mix(in_srgb,var(--color-fg)_8%,transparent)] hover:text-fg" title="Change color">
        <span className="size-2.5 rounded-full shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-fg)_18%,transparent)]" style={{ background: row.c }} />
        <input type="color" value={row.c} aria-label={`Color for tier ${row.l}`} className="absolute inset-0 size-full cursor-pointer border-0 p-0 opacity-0" onChange={(e) => onColor(i, e.target.value)} />
      </label>
      <button type="button" className={actionBtn} aria-label={`Move tier ${row.l} up`} disabled={i === 0} onClick={() => onMoveRow(i, -1)}>
        <ChevronUp size={12} strokeWidth={2} aria-hidden="true" />
      </button>
      <button type="button" className={actionBtn} aria-label={`Move tier ${row.l} down`} disabled={i === total - 1} onClick={() => onMoveRow(i, 1)}>
        <ChevronDown size={12} strokeWidth={2} aria-hidden="true" />
      </button>
      <button type="button" className={cn(actionBtn, "hover:bg-[color-mix(in_srgb,#ff6b6b_18%,transparent)] hover:text-[#ffb4b4]")} aria-label={`Delete tier ${row.l}`} onClick={() => onDelete(i)}>
        <X size={12} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}

export function Board(props: BoardProps) {
  const { state, names, factsOf, selectedIds, poolFilter, catFilter, onCatFilter, poolHeader, onMove, onMoveMany, onReorder, onSelect, onSelectMany, onZoneClick, onSendBack, onRename, onRemove, onRowLabel, onRowColor, onRowDelete, onRowMove, midSlot } = props;
  const q = poolFilter.trim().toLowerCase();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragGroup, setDragGroup] = useState<string[]>([]);
  const dragGroupRef = useRef<string[]>([]);
  const lastOverRef = useRef<ContainerId | null>(null);
  const selected = new Set(selectedIds);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const containers: ContainerId[] = ["pool", ...state.rows.map((_, i) => `row-${i}`)];
  const itemsOf = (c: ContainerId): string[] => (c === "pool" ? state.pool : state.rows[Number(c.slice(4))].items);
  const containerOf = (id: string): ContainerId | null => {
    if (state.pool.includes(id)) return "pool";
    const i = state.rows.findIndex((r) => r.items.includes(id));
    return i >= 0 ? `row-${i}` : null;
  };

  const handleDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    setActiveId(id);
    lastOverRef.current = null;
    const from = containerOf(id);
    if (!from) {
      dragGroupRef.current = [id];
      setDragGroup([id]);
      return;
    }
    const group = selected.has(id) && selectedIds.length > 1 ? selectedIds.filter((sid) => containerOf(sid) === from) : [id];
    dragGroupRef.current = group;
    setDragGroup(group);
  };

  const collisionDetection: CollisionDetection = (args) => {
    if (!args.pointerCoordinates) return closestCorners(args);
    const within = pointerWithin(args);
    return within.length ? within : rectIntersection(args);
  };

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const aId = String(active.id);
    const overVal = String(over.id);
    if (overVal === aId) return;
    const from = containerOf(aId);
    const to = containers.includes(overVal) ? overVal : containerOf(overVal);
    if (!from || !to || from === to) return;
    const group = dragGroupRef.current;
    const target = itemsOf(to);
    const beforeId = target.includes(overVal) ? overVal : undefined;
    if (group.length > 1) {
      if (lastOverRef.current === to) return;
      lastOverRef.current = to;
      onMoveMany(group, to, beforeId);
      return;
    }
    onMove(aId, to, beforeId);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    setDragGroup([]);
    dragGroupRef.current = [];
    lastOverRef.current = null;
    const { active, over } = e;
    if (!over) return;
    const aId = String(active.id);
    const overVal = String(over.id);
    const cont = containerOf(aId);
    if (!cont || overVal === aId) return;
    if (containers.includes(overVal)) {
      if (overVal !== cont) onMove(aId, overVal);
      return;
    }
    const overCont = containerOf(overVal);
    if (overCont && overCont !== cont) {
      onMove(aId, overCont, overVal);
      return;
    }
    const target = itemsOf(cont);
    if (!target.includes(overVal)) return;
    const from = target.indexOf(aId);
    const to = target.indexOf(overVal);
    if (from !== to) onReorder(cont, from, to);
  };

  const renderTile = (id: string, hidden?: boolean, removable?: boolean) => {
    const inDragGroup = activeId !== null && dragGroup.includes(id) && id !== activeId;
    return (
      <Tile
        key={id}
        id={id}
        name={names[id]?.[0] ?? id}
        domain={names[id]?.[1] ?? ""}
        facts={factsOf(id)}
        selected={selected.has(id)}
        hidden={hidden}
        ghost={inDragGroup}
        removable={removable}
        onClick={onSelect}
        onSendBack={onSendBack}
        onRename={onRename}
        onRemove={onRemove}
      />
    );
  };

  const matchesFilter = (id: string) => {
    const okQ = !q || (names[id]?.[0] ?? "").toLowerCase().includes(q);
    const okC = catFilter === "all" || ITEMS[id]?.cat === catFilter;
    return okQ && okC;
  };
  const visiblePool = state.pool.filter(matchesFilter);
  const midAfterIndex = midSlot ? Math.floor((state.rows.length - 1) / 2) : -1;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setDragGroup([]);
        dragGroupRef.current = [];
        lastOverRef.current = null;
      }}
    >
      <section className="flex flex-col gap-control" aria-label="Tier rows">
        {state.rows.map((row, i) => (
          <Fragment key={`row-${i}`}>
            <Row id={`row-${i}`} rowIndex={i} row={row} empty={row.items.length === 0} rowsTotal={state.rows.length} onZoneClick={onZoneClick} onRowLabel={onRowLabel} onRowColor={onRowColor} onRowDelete={onRowDelete} onRowMove={onRowMove}>
              <SortableContext items={row.items} strategy={rectSortingStrategy}>
                {row.items.map((id) => renderTile(id))}
              </SortableContext>
            </Row>
            {i === midAfterIndex ? midSlot : null}
          </Fragment>
        ))}
      </section>

      <Pool
        zoneId="pool"
        onZoneClick={onZoneClick}
        header={poolHeader}
        toolbar={
          <>
            <div className="flex flex-wrap gap-inset" role="group" aria-label="Filter by category">
              {CAT_FILTERS.map(([c, label]) => (
                <button key={c} type="button" className={cn(chipBase, catFilter === c && chipOn)} aria-pressed={catFilter === c} onClick={() => onCatFilter(c)}>
                  {label}
                </button>
              ))}
            </div>
            <Button className="ms-auto" disabled={!visiblePool.length} onClick={() => onSelectMany(visiblePool)}>
              Select shown{visiblePool.length ? ` (${visiblePool.length})` : ""}
            </Button>
          </>
        }
        emptyLabel={
          state.pool.length === 0
            ? state.p === "blank"
              ? "Quick add above to create your first item."
              : "All ranked — add a custom item or reset."
            : visiblePool.length === 0
              ? `No matches${catFilter !== "all" ? ` in ${catFilter}` : ""} for “${poolFilter.trim()}”`
              : undefined
        }
        shown={visiblePool.length}
        total={state.pool.length}
      >
        <SortableContext items={state.pool} strategy={rectSortingStrategy}>
          {state.pool.map((id) => renderTile(id, !matchesFilter(id), true))}
        </SortableContext>
      </Pool>

      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
        {activeId ? (
          <div className="relative inline-flex h-10 cursor-grabbing items-center gap-2 rounded-lg border border-lime bg-panel2 py-0 ps-1.5 pe-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
            <Mark mark={factsOf(activeId)?.mark} domain={names[activeId]?.[1] ?? ""} name={names[activeId]?.[0]} />
            <span className="text-[13px] font-semibold whitespace-nowrap">{names[activeId]?.[0] ?? activeId}</span>
            {dragGroup.length > 1 && (
              <span className="absolute -end-2 -top-2 grid min-w-5 place-items-center rounded-full bg-lime px-[5px] font-mono text-[10px] font-extrabold text-on-lime shadow-[0_2px_8px_var(--theme-backdrop)]">
                {dragGroup.length}
              </span>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function Row({ id, rowIndex, row, rowsTotal, empty, children, onZoneClick, onRowLabel, onRowColor, onRowDelete, onRowMove }: { id: ContainerId; rowIndex: number; row: TierState["rows"][number]; rowsTotal: number; empty: boolean; children: React.ReactNode; onZoneClick: BoardProps["onZoneClick"]; onRowLabel: BoardProps["onRowLabel"]; onRowColor: BoardProps["onRowColor"]; onRowDelete: BoardProps["onRowDelete"]; onRowMove: BoardProps["onRowMove"] }) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: "container" } });
  return (
    <div ref={setNodeRef} className="group/trow flex overflow-hidden rounded-md border border-line bg-panel transition-[border-color] duration-150 focus-within:border-line2" data-row={rowIndex}>
      <RowLabel i={rowIndex} row={row} onLabel={onRowLabel} />
      <div className="relative min-w-0 flex-1">
        <RowActions i={rowIndex} total={rowsTotal} row={row} onColor={onRowColor} onDelete={onRowDelete} onMoveRow={onRowMove} />
        <div
          className={dropZoneClass(isOver)}
          data-zone={id}
          onClick={(e) => {
            if (!(e.target as HTMLElement).closest("[data-id]")) onZoneClick(id);
          }}
        >
          {empty && <span className="pointer-events-none absolute inset-0 grid place-items-center font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-mut2">{isOver ? "Drop" : "Drop items here"}</span>}
          {children}
        </div>
      </div>
    </div>
  );
}

function Pool({ zoneId, children, onZoneClick, header, toolbar, emptyLabel, shown, total }: { zoneId: ContainerId; children: React.ReactNode; onZoneClick: BoardProps["onZoneClick"]; header?: React.ReactNode; toolbar?: React.ReactNode; emptyLabel?: string; shown: number; total: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: zoneId, data: { type: "container" } });
  return (
    <section className="mt-group rounded-md border border-line bg-panel p-group">
      <div className="mb-control flex flex-wrap items-center gap-x-group gap-y-control">
        <div className="flex shrink-0 items-center gap-inset">
          <h2 className="font-mono text-[13px] font-bold uppercase tracking-[0.08em] text-mut">Unranked</h2>
          <span className="rounded-full bg-panel2 px-2 py-0.5 font-mono text-[11px] text-mut" aria-label={`${shown} unranked items shown`}>
            {shown}
            {shown !== total ? ` / ${total}` : ""}
          </span>
        </div>
        {header && <div className="flex min-w-[min(100%,280px)] max-sm:w-full flex-1 flex-wrap gap-inset [&>label]:min-w-[140px] [&>label]:flex-1">{header}</div>}
      </div>
      {toolbar && <div className="mb-control flex flex-wrap items-center gap-control">{toolbar}</div>}
      <div
        ref={setNodeRef}
        className={cn(dropZoneClass(isOver), "min-h-[86px]!")}
        data-zone={zoneId}
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest("[data-id]")) onZoneClick(zoneId);
        }}
      >
        {emptyLabel && <span className="pointer-events-none absolute inset-0 grid place-items-center px-4 text-center font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-mut2">{emptyLabel}</span>}
        {children}
      </div>
    </section>
  );
}
