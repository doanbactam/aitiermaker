"use client";

import type { ContainerId } from "@/components/board";
import { inkOnDark, tierBadgeInk, tierInk } from "@/lib/contrast";
import { Button } from "@/components/ui/button";
import { selBannerSticky } from "@/lib/ui-styles";

interface SelectionBarProps {
  count: number;
  names: string[];
  rows: readonly { l: string; c: string }[];
  onPlace: (container: ContainerId) => void;
  onClear: () => void;
}

export function SelectionBar({ count, names, rows, onPlace, onClear }: SelectionBarProps) {
  const showKeys = rows.length <= 9;
  return (
    <div className={selBannerSticky}>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="truncate text-[13px]" role="status" aria-live="polite">
          <b>{count}</b> selected{names.length ? `: ${names.join(", ")}` : ""}
          {showKeys && (
            <span className="hidden font-medium text-mut md:inline">
              {" "}
              · click a tier column or press 1–{rows.length} to place{rows.length < 9 ? ", 0 for Unranked" : ""}
            </span>
          )}
          {showKeys && (
            <span className="font-medium text-mut md:hidden"> · tap a tier column to place</span>
          )}
        </span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Move selection to">
          {rows.map((row, i) => {
            const dark = inkOnDark(row.c);
            const ink = tierInk(dark);
            const badge = tierBadgeInk(dark);
            return (
              <button
                key={i}
                type="button"
                className="relative grid min-h-[30px] min-w-[34px] max-sm:min-h-11 max-sm:min-w-11 place-items-center rounded-sm border px-2 font-mono text-xs font-extrabold transition-[scale,filter] duration-100 active:scale-96 hover:brightness-110"
                style={{ background: row.c, color: ink.color, borderColor: ink.borderColor }}
                onClick={() => onPlace(`row-${i}`)}
                title={`Move selection to ${row.l}${showKeys ? ` (${i + 1})` : ""}`}
                aria-label={`Move selection to tier ${row.l}`}
              >
                <span className="max-w-[13ch] truncate">{row.l}</span>
                {showKeys && i < 9 && (
                  <span className="absolute -top-1.5 -end-1 min-w-3.5 rounded px-[3px] text-[8px] font-extrabold leading-[14px]" style={badge}>
                    {i + 1}
                  </span>
                )}
              </button>
            );
          })}
          <button
            type="button"
            className="relative grid min-h-[30px] min-w-[34px] max-sm:min-h-11 max-sm:min-w-11 place-items-center rounded-sm border border-line2 bg-transparent px-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-mut transition-[scale,color] duration-100 active:scale-96 hover:text-fg"
            onClick={() => onPlace("pool")}
            title="Move selection back to Unranked (0)"
          >
            Unranked
            {showKeys && rows.length < 9 && (
              <span className="absolute -top-1.5 -end-1 min-w-3.5 rounded bg-panel2 px-[3px] text-[8px] font-extrabold leading-[14px] text-fg shadow-[inset_0_0_0_1px_var(--color-line2)]">0</span>
            )}
          </button>
        </div>
      </div>
      <Button className="w-full shrink-0 sm:w-auto" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}
