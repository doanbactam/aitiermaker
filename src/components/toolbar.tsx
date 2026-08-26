"use client";

import { Menu } from "@base-ui/react/menu";
import { Select } from "@base-ui/react/select";
import { Toolbar as ToolbarUI } from "@base-ui/react/toolbar";
import { ChevronDown, Ellipsis, Layers, Plus, Redo2, Share2, Undo2 } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "@/components/theme-toggle";
import { brandMark, btnGroup, layoutShell, menuItem, menuItemDanger, popupSurface, selectItem } from "@/lib/ui-styles";

export interface ToolbarPreset {
  id: string;
  title: string;
  desc?: string;
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
  onDeal: () => void;
  onReset: () => void;
  busy: boolean;
}

export function Toolbar({ presetId, presets, onPreset, canUndo, canRedo, onUndo, onRedo, onAddTier, onAddItem, onShare, onExport, onDeal, onReset, busy }: ToolbarProps) {
  const items = presets.map((p) => ({ value: p.id, label: p.title }));
  const titleOf = (id: string | null) => presets.find((p) => p.id === id)?.title ?? "Choose preset";

  return (
    <ToolbarUI.Root className={cn(layoutShell, "flex flex-wrap items-center gap-x-control gap-y-group py-2.5")} aria-label="Tier list editor">
      <ToolbarUI.Group className="flex items-center gap-inset min-w-0">
        <span className={brandMark} aria-hidden="true" />
        <span className="hidden min-[641px]:inline font-mono text-[13px] font-bold tracking-[0.08em] whitespace-nowrap">AI TIER MAKER.</span>

        <Select.Root value={presetId} onValueChange={(id) => id && onPreset(id)} items={items}>
          <Select.Trigger
            render={
              <ToolbarUI.Button
                className={cn(buttonClass(), "ms-1 max-w-[min(240px,42vw)] max-sm:max-w-[min(160px,38vw)] justify-between gap-2.5 text-start")}
                aria-label="Choose preset"
              />
            }
          >
            <Select.Value className="truncate">{(value) => titleOf(value)}</Select.Value>
            <Select.Icon className="grid shrink-0 place-items-center text-mut">
              <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner sideOffset={6} align="start">
              <Select.Popup className={popupSurface}>
                <Select.List className="flex max-h-[min(60vh,360px)] flex-col gap-0.5 overflow-auto">
                  {presets.map((p) => (
                    <Select.Item key={p.id} value={p.id} label={p.title} className={selectItem}>
                      <Select.ItemText className="text-[13px] font-semibold text-fg">{p.title}</Select.ItemText>
                      {p.desc ? <span className="font-mono text-[10px] tracking-[0.04em] text-mut">{p.desc}</span> : null}
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </ToolbarUI.Group>

      <ToolbarUI.Group className="ms-auto flex flex-wrap items-center gap-control">
        <ToolbarUI.Group className={btnGroup} aria-label="History">
          <ToolbarUI.Button className={buttonClass("icon")} onClick={onUndo} disabled={!canUndo} focusableWhenDisabled={false} aria-label="Undo" title="Undo (Ctrl+Z)">
            <Undo2 size={14} strokeWidth={2} aria-hidden="true" />
          </ToolbarUI.Button>
          <ToolbarUI.Button className={buttonClass("icon")} onClick={onRedo} disabled={!canRedo} focusableWhenDisabled={false} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">
            <Redo2 size={14} strokeWidth={2} aria-hidden="true" />
          </ToolbarUI.Button>
        </ToolbarUI.Group>

        <ToolbarUI.Button className={buttonClass()} onClick={() => onAddTier("bottom")} title="Add a tier at the bottom">
          <Layers size={14} strokeWidth={2} aria-hidden="true" />
          <span className="hidden min-[641px]:inline">Tier</span>
        </ToolbarUI.Button>
        <ToolbarUI.Button className={buttonClass()} onClick={onAddItem} title="Add a custom item">
          <Plus size={14} strokeWidth={2} aria-hidden="true" />
          <span className="hidden min-[641px]:inline">Item</span>
        </ToolbarUI.Button>
        <ToolbarUI.Button className={buttonClass("primary")} onClick={onShare}>
          <Share2 size={14} strokeWidth={2} aria-hidden="true" />
          <span className="hidden min-[641px]:inline">Share</span>
        </ToolbarUI.Button>

        <ThemeToggle />

        <Menu.Root>
          <Menu.Trigger render={<ToolbarUI.Button className={buttonClass("icon")} aria-label="More actions" title="More" />}>
            <Ellipsis size={16} strokeWidth={2} aria-hidden="true" />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner sideOffset={6} align="end">
              <Menu.Popup className={popupSurface}>
                <Menu.Item className={menuItem} disabled={busy} onClick={() => onExport("download")}>
                  Download PNG
                </Menu.Item>
                <Menu.Item className={menuItem} disabled={busy} onClick={() => onExport("copy")}>
                  Copy PNG
                </Menu.Item>
                <Menu.Separator className="mx-1.5 my-1 block h-px bg-line" />
                <Menu.Item className={menuItem} onClick={() => onAddTier("top")}>
                  Tier on top
                </Menu.Item>
                <Menu.Item className={menuItem} onClick={onDeal}>
                  Deal unranked
                </Menu.Item>
                <Menu.Separator className="mx-1.5 my-1 block h-px bg-line" />
                <Menu.Item className={cn(menuItem, menuItemDanger)} onClick={onReset}>
                  Reset
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </ToolbarUI.Group>
    </ToolbarUI.Root>
  );
}
