"use client";

import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, closestCorners, pointerWithin, rectIntersection, useSensor, useSensors, useDroppable, MeasuringStrategy } from "@dnd-kit/core";
import type { CollisionDetection, DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState } from "react";
import type { CatalogItem, TierState } from "@/lib/types";
import type { Category } from "@/lib/types";
import { ITEMS } from "@/data/catalog";
import { Tile, Mark } from "@/components/tile";

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
  selectedId: string | null;
  poolFilter: string;
  catFilter: string;
  onCatFilter: (c: string) => void;
  poolHeader?: React.ReactNode;
  onMove: (id: string, toContainer: ContainerId, beforeId?: string) => void;
  onReorder: (container: ContainerId, from: number, to: number) => void;
  onSelect: (id: string) => void;
  onZoneClick: (container: ContainerId, beforeId?: string) => void;
  onSendBack: (id: string) => void;
  onRemove: (id: string) => void;
  onRowLabel: (i: number, field: "l" | "sub", value: string) => void;
  onRowColor: (i: number, color: string) => void;
  onRowDelete: (i: number) => void;
  onRowMove: (i: number, dir: -1 | 1) => void;
}

function RowLabel({ i, total, row, onLabel, onColor, onDelete, onMoveRow }: { i: number; total: number; row: TierState["rows"][number]; onLabel: BoardProps["onRowLabel"]; onColor: BoardProps["onRowColor"]; onDelete: BoardProps["onRowDelete"]; onMoveRow: BoardProps["onRowMove"] }) {
  const shrink = (e: React.FormEvent<HTMLSpanElement>) => {
    e.currentTarget.classList.toggle("long", (e.currentTarget.textContent?.length ?? 0) > 2);
  };
  return (
    <div className="tlabel" style={{ background: row.c }}>
      <input type="color" className="swatch" value={row.c} aria-label={`Color for tier ${row.l}`} onChange={(e) => onColor(i, e.target.value)} />
      <span
        className="ltr"
        role="textbox"
        aria-label={`Tier ${i + 1} name`}
        contentEditable="plaintext-only"
        suppressContentEditableWarning
        spellCheck={false}
        title="Click to rename tier"
        onInput={shrink}
        onBlur={(e) => {
          shrink(e);
          onLabel(i, "l", e.currentTarget.textContent?.trim() || "?");
        }}
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
        className="sub"
        role="textbox"
        aria-label={`Tier ${row.l} subtitle`}
        contentEditable="plaintext-only"
        suppressContentEditableWarning
        spellCheck={false}
        title="Click to edit label"
        onBlur={(e) => onLabel(i, "sub", e.currentTarget.textContent?.trim() || "")}
      >
        {row.sub}
      </span>
      <span className="cnt" aria-label={`${row.items.length} items`}>
        {row.items.length}
      </span>
      <div className="mvs">
        <button type="button" className="mv" aria-label={`Move tier ${row.l} up`} disabled={i === 0} onClick={() => onMoveRow(i, -1)}>
          ↑
        </button>
        <button type="button" className="mv" aria-label={`Move tier ${row.l} down`} disabled={i === total - 1} onClick={() => onMoveRow(i, 1)}>
          ↓
        </button>
      </div>
      <button type="button" className="del" aria-label={`Delete tier ${row.l}`} onClick={() => onDelete(i)}>
        ×
      </button>
    </div>
  );
}

export function Board(props: BoardProps) {
  const { state, names, factsOf, selectedId, poolFilter, catFilter, onCatFilter, poolHeader, onMove, onReorder, onSelect, onZoneClick, onSendBack, onRemove, onRowLabel, onRowColor, onRowDelete, onRowMove } = props;
  const q = poolFilter.trim().toLowerCase();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const containers: ContainerId[] = ["pool", ...state.rows.map((_, i) => `row-${i}`)];
  const itemsOf = (c: ContainerId): string[] => (c === "pool" ? state.pool : state.rows[Number(c.slice(4))].items);
  const containerOf = (id: string): ContainerId | null => {
    if (state.pool.includes(id)) return "pool";
    const i = state.rows.findIndex((r) => r.items.includes(id));
    return i >= 0 ? `row-${i}` : null;
  };

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

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
    const target = itemsOf(to);
    const beforeId = target.includes(overVal) ? overVal : undefined;
    onMove(aId, to, beforeId);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
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

  const renderTile = (id: string, hidden?: boolean, removable?: boolean) => (
    <Tile
      key={id}
      id={id}
      name={names[id]?.[0] ?? id}
      domain={names[id]?.[1] ?? ""}
      facts={factsOf(id)}
      selected={selectedId === id}
      hidden={hidden}
      removable={removable}
      onClick={onSelect}
      onSendBack={onSendBack}
      onRemove={onRemove}
    />
  );

  const matchesFilter = (id: string) => {
    const okQ = !q || (names[id]?.[0] ?? "").toLowerCase().includes(q);
    const okC = catFilter === "all" || ITEMS[id]?.cat === catFilter;
    return okQ && okC;
  };
  const visiblePool = state.pool.filter(matchesFilter);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <section className="board flex flex-col gap-2.5" aria-label="Tier rows">
        {state.rows.map((row, i) => (
          <Row key={`row-${i}`} id={`row-${i}`} rowIndex={i} row={row} empty={row.items.length === 0} rowsTotal={state.rows.length} onZoneClick={onZoneClick} onRowLabel={onRowLabel} onRowColor={onRowColor} onRowDelete={onRowDelete} onRowMove={onRowMove}>
            <SortableContext items={row.items} strategy={rectSortingStrategy}>
              {row.items.map((id) => renderTile(id))}
            </SortableContext>
          </Row>
        ))}
      </section>

      <Pool
        zoneId="pool"
        onZoneClick={onZoneClick}
        header={poolHeader}
        toolbar={
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
            {CAT_FILTERS.map(([c, label]) => (
              <button key={c} type="button" className={`chip${catFilter === c ? " on" : ""}`} aria-pressed={catFilter === c} onClick={() => onCatFilter(c)}>
                {label}
              </button>
            ))}
          </div>
        }
        emptyLabel={
          state.pool.length === 0
            ? state.p === "blank"
              ? "Type a name above to add your first item."
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
          <div className="tile" style={{ cursor: "grabbing", boxShadow: "0 12px 32px rgba(0,0,0,.5)", borderColor: "#c8f04b" }}>
            <Mark mark={factsOf(activeId)?.mark} domain={names[activeId]?.[1] ?? ""} name={names[activeId]?.[0]} />
            <span className="nm">{names[activeId]?.[0] ?? activeId}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function Row({
  id,
  rowIndex,
  row,
  rowsTotal,
  empty,
  children,
  onZoneClick,
  onRowLabel,
  onRowColor,
  onRowDelete,
  onRowMove,
}: {
  id: ContainerId;
  rowIndex: number;
  row: TierState["rows"][number];
  rowsTotal: number;
  empty: boolean;
  children: React.ReactNode;
  onZoneClick: BoardProps["onZoneClick"];
  onRowLabel: BoardProps["onRowLabel"];
  onRowColor: BoardProps["onRowColor"];
  onRowDelete: BoardProps["onRowDelete"];
  onRowMove: BoardProps["onRowMove"];
}) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: "container" } });
  return (
    <div ref={setNodeRef} className="trow" data-row={rowIndex}>
      <RowLabel i={rowIndex} total={rowsTotal} row={row} onLabel={onRowLabel} onColor={onRowColor} onDelete={onRowDelete} onMoveRow={onRowMove} />
      <div
        className={`dz${isOver ? " over" : ""}`}
        data-zone={id}
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest(".tile")) onZoneClick(id);
        }}
      >
        {empty && <span className="place-hint">{isOver ? "Drop" : "Drop items here"}</span>}
        {children}
      </div>
    </div>
  );
}

function Pool({
  zoneId,
  children,
  onZoneClick,
  header,
  toolbar,
  emptyLabel,
  shown,
  total,
}: {
  zoneId: ContainerId;
  children: React.ReactNode;
  onZoneClick: BoardProps["onZoneClick"];
  header?: React.ReactNode;
  toolbar?: React.ReactNode;
  emptyLabel?: string;
  shown: number;
  total: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: zoneId, data: { type: "container" } });
  return (
    <section className="mt-4 rounded-[10px] border border-[#26262e] bg-[#111114] p-3.5">
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <h2 className="font-mono text-[13px] font-bold uppercase tracking-[0.08em] text-[#8b8f98]">Unranked</h2>
        <span className="rounded-full bg-[#18181d] px-2 py-0.5 font-mono text-[11px] text-[#8b8f98]" aria-label={`${shown} unranked items shown`}>
          {shown}
          {shown !== total ? ` / ${total}` : ""}
        </span>
        <div className="ml-auto">{header}</div>
      </div>
      {toolbar}
      <div
        ref={setNodeRef}
        className={`dz min-h-[86px]!${isOver ? " over" : ""}`}
        data-zone={zoneId}
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest(".tile")) onZoneClick(zoneId);
        }}
      >
        {emptyLabel && <span className="place-hint">{emptyLabel}</span>}
        {children}
      </div>
    </section>
  );
}
