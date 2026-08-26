"use client";

import type { ContainerId } from "@/components/board";

interface SelectionBarProps {
  count: number;
  /** Already truncated by the caller; empty when the selection is large. */
  names: string[];
  rows: readonly { l: string; c: string }[];
  onPlace: (container: ContainerId) => void;
  onClear: () => void;
}

/**
 * Summary of the current selection plus a one-click destination for it.
 *
 * The chips matter more than the count: placing a selection used to require
 * scrolling back to the tier you wanted and clicking its drop zone. The bar is
 * sticky, so the destinations stay reachable while scrolling the pool.
 */
export function SelectionBar({ count, names, rows, onPlace, onClear }: SelectionBarProps) {
  return (
    <div className="sel-banner sel-sticky" role="status" aria-live="polite">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="truncate text-[13px]">
          <b>{count}</b> selected{names.length ? `: ${names.join(", ")}` : ""}
        </span>
        <div className="place-chips" role="group" aria-label="Move selection to">
          {rows.map((row, i) => (
            <button key={i} type="button" className="place-chip" style={{ background: row.c }} onClick={() => onPlace(`row-${i}`)} title={`Move selection to ${row.l}`} aria-label={`Move selection to tier ${row.l}`}>
              {row.l}
            </button>
          ))}
          <button type="button" className="place-chip ghost" onClick={() => onPlace("pool")} title="Move selection back to Unranked">
            Unranked
          </button>
        </div>
      </div>
      <button type="button" className="btn shrink-0" onClick={onClear}>
        Clear
      </button>
    </div>
  );
}
