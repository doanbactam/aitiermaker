"use client";

import type { ContainerId } from "@/components/board";
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
            <span className="font-medium text-mut">
              {" "}
              · press 1–{rows.length} to place{rows.length < 9 ? ", 0 for Unranked" : ""}
            </span>
          )}
        </span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Move selection to">
          {rows.map((row, i) => (
            <button
              key={i}
              type="button"
              className="relative grid min-h-[30px] min-w-[34px] max-sm:min-h-[34px] max-sm:min-w-[38px] place-items-center rounded-sm border border-black/30 px-2 font-mono text-xs font-extrabold text-black/80 transition-[transform,filter] duration-100 active:scale-96 hover:brightness-110"
              style={{ background: row.c }}
              onClick={() => onPlace(`row-${i}`)}
              title={`Move selection to ${row.l}${showKeys ? ` (${i + 1})` : ""}`}
              aria-label={`Move selection to tier ${row.l}`}
            >
              {row.l}
              {showKeys && i < 9 && (
                <span className="absolute -top-1.5 -end-1 min-w-3.5 rounded px-[3px] bg-black/70 text-[8px] font-extrabold leading-[14px] text-white/90">
                  {i + 1}
                </span>
              )}
            </button>
          ))}
          <button
            type="button"
            className="relative grid min-h-[30px] min-w-[34px] max-sm:min-h-[34px] max-sm:min-w-[38px] place-items-center rounded-sm border border-line2 bg-transparent px-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-mut transition-[transform,color] duration-100 active:scale-96 hover:text-fg"
            onClick={() => onPlace("pool")}
            title="Move selection back to Unranked (0)"
          >
            Unranked
            {showKeys && rows.length < 9 && (
              <span className="absolute -top-1.5 -end-1 min-w-3.5 rounded px-[3px] bg-black/70 text-[8px] font-extrabold leading-[14px] text-white/90">0</span>
            )}
          </button>
        </div>
      </div>
      <Button className="shrink-0" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}
