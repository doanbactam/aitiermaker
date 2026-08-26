"use client";

import { useEffect, useRef, useState } from "react";

export interface ToolbarPreset {
  id: string;
  title: string;
}

interface ToolbarProps {
  presetId: string;
  presets: readonly ToolbarPreset[];
  onPreset: (id: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAddTier: (where: "top" | "bottom") => void;
  onAddItem: () => void;
  onShare: () => void;
  onExport: (mode: "download" | "copy") => void;
  onPostX: () => void;
  onDeal: () => void;
  onReset: () => void;
  busy: boolean;
}

/**
 * Header chrome. Owns the More menu's open state, outside-pointer dismissal
 * and Escape handling so the parent does not have to track either.
 */
export function Toolbar({ presetId, presets, onPreset, canUndo, canRedo, onUndo, onRedo, onAddTier, onAddItem, onShare, onExport, onPostX, onDeal, onReset, busy }: ToolbarProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  /** Every menu item closes the menu before acting. */
  const item = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-2 px-4 py-3">
      <span className="brand-mark" aria-hidden="true" />
      <span className="font-mono text-[13px] font-bold tracking-[0.08em]">AI TIER MAKER.</span>

      <select className="btn ml-2" value={presetId} onChange={(e) => onPreset(e.target.value)} aria-label="Choose preset">
        {presets.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <div className="btn-group" role="group" aria-label="History">
          <button type="button" className="btn btn-icon" onClick={onUndo} disabled={!canUndo} aria-label="Undo" title="Undo (Ctrl+Z)">
            ↶
          </button>
          <button type="button" className="btn btn-icon" onClick={onRedo} disabled={!canRedo} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">
            ↷
          </button>
        </div>

        <button type="button" className="btn" onClick={() => onAddTier("bottom")} title="Add a tier at the bottom">
          + Tier
        </button>
        <button type="button" className="btn" onClick={onAddItem} title="Add a custom item">
          + Item
        </button>
        <button type="button" className="btn btn-primary" onClick={onShare}>
          Share
        </button>

        <div className="relative" ref={menuRef}>
          <button type="button" className="btn" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((v) => !v)}>
            More
          </button>
          {open && (
            <div className="more-menu" role="menu">
              <button type="button" className="btn" role="menuitem" disabled={busy} onClick={item(() => onExport("download"))}>
                Download PNG
              </button>
              <button type="button" className="btn" role="menuitem" disabled={busy} onClick={item(() => onExport("copy"))}>
                Copy PNG
              </button>
              <button type="button" className="btn" role="menuitem" onClick={item(onPostX)}>
                Post on X
              </button>
              <span className="menu-sep" role="separator" />
              <button type="button" className="btn" role="menuitem" onClick={item(() => onAddTier("top"))}>
                + Tier on top
              </button>
              <button type="button" className="btn" role="menuitem" onClick={item(onDeal)}>
                Deal unranked
              </button>
              <span className="menu-sep" role="separator" />
              <button type="button" className="btn btn-danger" role="menuitem" onClick={item(onReset)}>
                Reset
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
