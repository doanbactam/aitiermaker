"use client";

import type { ReactElement } from "react";
import { Menu } from "@base-ui/react/menu";
import { Toolbar as ToolbarUI } from "@base-ui/react/toolbar";
import { ChevronDown, Copy, Download, Layers, MoreHorizontal, Plus, Redo2, RotateCcw, Undo2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "@/components/theme-toggle";
import { btnGroup, layoutShell, menuItem, popupSurface } from "@/lib/ui-styles";

interface ToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAddTier: () => void;
  onAddItem: () => void;
  onPostX: () => void;
  onExport: (mode: "download" | "copy") => void;
  onReset: () => void;
  busy: boolean;
}

function ExportMenuItems({ busy, onExport }: { busy: boolean; onExport: (mode: "download" | "copy") => void }) {
  return (
    <>
      <Menu.Item className={cn(menuItem, "gap-2")} disabled={busy} onClick={() => onExport("download")}>
        <Download size={14} strokeWidth={2} aria-hidden="true" />
        Download PNG
      </Menu.Item>
      <Menu.Item className={cn(menuItem, "gap-2")} disabled={busy} onClick={() => onExport("copy")}>
        <Copy size={14} strokeWidth={2} aria-hidden="true" />
        Copy PNG
      </Menu.Item>
    </>
  );
}

function ExportMenu({ busy, onExport, trigger }: { busy: boolean; onExport: (mode: "download" | "copy") => void; trigger: ReactElement }) {
  return (
    <Menu.Root>
      <Menu.Trigger render={trigger} />
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="end">
          <Menu.Popup className={popupSurface}>
            <ExportMenuItems busy={busy} onExport={onExport} />
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

export function Toolbar({ canUndo, canRedo, onUndo, onRedo, onAddTier, onAddItem, onPostX, onExport, onReset, busy }: ToolbarProps) {
  return (
    <ToolbarUI.Root
      className={cn(layoutShell, "flex min-h-(--site-header-h) items-center gap-x-control py-2 sm:py-2.5")}
      aria-label="Tier list editor"
    >
      <BrandLogo className="shrink-0" />

      <ToolbarUI.Group className="ms-auto flex shrink-0 items-center gap-inset sm:gap-control">
        <ToolbarUI.Group className={cn(btnGroup, "hidden sm:flex")} aria-label="History">
          <ToolbarUI.Button className={buttonClass("icon")} onClick={onUndo} disabled={!canUndo} focusableWhenDisabled={false} aria-label="Undo" title="Undo (Ctrl+Z)">
            <Undo2 size={14} strokeWidth={2} aria-hidden="true" />
          </ToolbarUI.Button>
          <ToolbarUI.Button className={buttonClass("icon")} onClick={onRedo} disabled={!canRedo} focusableWhenDisabled={false} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">
            <Redo2 size={14} strokeWidth={2} aria-hidden="true" />
          </ToolbarUI.Button>
        </ToolbarUI.Group>

        <ToolbarUI.Button className={cn(buttonClass("primary"), "max-sm:px-2.5")} onClick={onPostX} disabled={busy} aria-label="Post tier list on X" title="Post PNG on X">
          <span className="text-[13px] font-bold leading-none" aria-hidden="true">
            𝕏
          </span>
          <span className="hidden sm:inline">Post on X</span>
        </ToolbarUI.Button>

        <div className="hidden sm:contents">
          <ToolbarUI.Button className={buttonClass()} onClick={onAddTier} title="Add a tier at the bottom">
            <Layers size={14} strokeWidth={2} aria-hidden="true" />
            <span className="hidden md:inline">Tier</span>
          </ToolbarUI.Button>
          <ToolbarUI.Button className={buttonClass()} onClick={onAddItem} title="Add a custom item">
            <Plus size={14} strokeWidth={2} aria-hidden="true" />
            <span className="hidden md:inline">Item</span>
          </ToolbarUI.Button>
          <ExportMenu
            busy={busy}
            onExport={onExport}
            trigger={
              <ToolbarUI.Button className={cn(buttonClass(), "gap-1.5")} disabled={busy} aria-label="Export PNG" title="Export PNG">
                <Download size={14} strokeWidth={2} aria-hidden="true" />
                <span className="hidden md:inline">Export</span>
                <ChevronDown size={12} strokeWidth={2} className="text-mut" aria-hidden="true" />
              </ToolbarUI.Button>
            }
          />
          <ToolbarUI.Button className={buttonClass("danger")} onClick={onReset} title="Reset rankings">
            <RotateCcw size={14} strokeWidth={2} aria-hidden="true" />
            <span className="hidden md:inline">Reset</span>
          </ToolbarUI.Button>
          <ThemeToggle />
        </div>

        <div className="sm:hidden">
          <ThemeToggle />
        </div>

        <Menu.Root>
          <Menu.Trigger
            render={
              <ToolbarUI.Button className={cn(buttonClass("icon"), "sm:hidden")} aria-label="More actions" title="More actions">
                <MoreHorizontal size={16} strokeWidth={2} aria-hidden="true" />
              </ToolbarUI.Button>
            }
          />
          <Menu.Portal>
            <Menu.Positioner sideOffset={6} align="end">
              <Menu.Popup className={popupSurface}>
                <Menu.Item className={cn(menuItem, "gap-2")} disabled={!canUndo} onClick={onUndo}>
                  <Undo2 size={14} strokeWidth={2} aria-hidden="true" />
                  Undo
                </Menu.Item>
                <Menu.Item className={cn(menuItem, "gap-2")} disabled={!canRedo} onClick={onRedo}>
                  <Redo2 size={14} strokeWidth={2} aria-hidden="true" />
                  Redo
                </Menu.Item>
                <Menu.Item className={cn(menuItem, "gap-2")} onClick={onAddTier}>
                  <Layers size={14} strokeWidth={2} aria-hidden="true" />
                  Add tier
                </Menu.Item>
                <Menu.Item className={cn(menuItem, "gap-2")} onClick={onAddItem}>
                  <Plus size={14} strokeWidth={2} aria-hidden="true" />
                  Add item
                </Menu.Item>
                <ExportMenuItems busy={busy} onExport={onExport} />
                <Menu.Item className={cn(menuItem, "gap-2")} onClick={onReset}>
                  <RotateCcw size={14} strokeWidth={2} aria-hidden="true" />
                  Reset rankings
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </ToolbarUI.Group>
    </ToolbarUI.Root>
  );
}
