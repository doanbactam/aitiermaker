import { cn } from "@/lib/cn";

export const layoutShell =
  "box-border w-full max-w-layout mx-auto px-[max(var(--layout-gutter),env(safe-area-inset-left))] pe-[max(var(--layout-gutter),env(safe-area-inset-right))] lg:max-w-none lg:mx-[16.666%]";

export const siteHeader =
  "sticky top-0 z-50 border-b border-line bg-[color-mix(in_srgb,var(--color-bg)_82%,transparent)] backdrop-blur-[16px] backdrop-saturate-[1.2]";

export const brandMark =
  "size-[22px] shrink-0 rounded-md bg-lime shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-lime)_30%,transparent)]";

const btnCore =
  "inline-flex items-center justify-center gap-[7px] min-h-9 rounded-sm border font-mono text-[11px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap cursor-pointer outline-none transition-[border-color,background,color,opacity,box-shadow,transform] duration-150 active:scale-96 disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100";

export const btnDefault = cn(
  btnCore,
  "px-[13px] py-2 border-line bg-transparent text-fg",
  "shadow-[0_1px_2px_var(--theme-backdrop),inset_0_1px_0_var(--theme-hover)]",
  "enabled:hover:border-line2 enabled:hover:bg-panel2",
  "enabled:hover:shadow-[0_2px_8px_var(--theme-backdrop),inset_0_1px_0_var(--theme-hover)]",
);

export const btnPrimary = cn(
  btnCore,
  "px-[13px] py-2 border-lime bg-lime text-on-lime",
  "shadow-[0_1px_3px_var(--theme-backdrop),inset_0_1px_0_oklch(1_0_0/0.22)]",
  "enabled:hover:border-lime-hot enabled:hover:bg-lime-hot",
  "enabled:hover:shadow-[0_3px_10px_var(--theme-backdrop),inset_0_1px_0_oklch(1_0_0/0.28)]",
);

export const btnDanger = cn(
  btnDefault,
  "enabled:hover:border-[color-mix(in_srgb,var(--color-danger)_55%,var(--color-line))]",
  "enabled:hover:text-danger enabled:hover:bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)]",
);

export const btnIcon = cn(btnDefault, "px-2.5 min-w-9");

export const btnGroup =
  "[&_.btn-part:not(:last-child)]:border-e-0 [&_.btn-part:not(:last-child)]:rounded-e-none [&_.btn-part:not(:first-child)]:rounded-s-none";

export const popupSurface = cn(
  "min-w-[220px] max-w-[min(92vw,320px)] rounded-md border border-line bg-panel2 p-1.5 shadow-pop outline-none z-60",
  "origin-(--transform-origin) transition-[opacity,transform] duration-150 ease-out",
  "data-starting-style:opacity-0 data-starting-style:-translate-y-1 data-starting-style:scale-[0.98]",
  "data-ending-style:opacity-0 data-ending-style:-translate-y-1 data-ending-style:scale-[0.98]",
  "motion-reduce:transition-none motion-reduce:data-starting-style:transform-none motion-reduce:data-ending-style:transform-none",
);

export const selectItem = cn(
  "flex flex-col items-start gap-0.5 min-h-9 px-2.5 py-2 rounded-sm cursor-pointer outline-none select-none",
  "transition-[background-color,scale] duration-150 active:scale-96",
  "data-highlighted:bg-panel",
  "data-selected:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-lime)_35%,var(--color-line))]",
);

export const menuItem = cn(
  "flex items-center min-h-9 px-2.5 py-2 rounded-sm cursor-pointer outline-none select-none",
  "font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-fg",
  "transition-[background-color,color,scale] duration-150 active:scale-96",
  "data-highlighted:bg-panel data-disabled:opacity-45 data-disabled:cursor-not-allowed data-disabled:active:scale-100",
);

export const menuItemDanger = "data-highlighted:text-danger";

export const dialogBackdrop = "fixed inset-0 bg-backdrop backdrop-blur-[6px]";

export const dialogPanel = cn(
  "fixed left-1/2 top-1/2 w-[min(420px,92vw)] -translate-x-1/2 -translate-y-1/2",
  "rounded-2xl border border-line bg-panel2 p-[22px] text-fg shadow-pop outline-none",
  "origin-(--transform-origin) transition-[opacity,transform] duration-150 ease-out",
  "data-starting-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:-translate-y-[46%]",
  "data-ending-style:opacity-0 data-ending-style:scale-[0.98]",
  "motion-reduce:transition-none motion-reduce:data-starting-style:transform-none motion-reduce:data-ending-style:transform-none",
);

export const fieldInput = cn(
  "bg-panel border border-line rounded-sm px-3 py-[9px] text-[13px] text-fg outline-none min-h-9 w-full",
  "placeholder:text-mut2 transition-[border-color,box-shadow] duration-150",
  "focus:border-[color-mix(in_srgb,var(--color-lime)_45%,var(--color-line2))]",
  "focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-lime)_16%,transparent)]",
);

export const fieldGroup = cn(
  "relative flex items-center gap-2 min-h-9 px-2.5 bg-panel border border-line rounded-sm",
  "transition-[border-color,box-shadow] duration-150",
  "focus-within:border-[color-mix(in_srgb,var(--color-lime)_45%,var(--color-line2))]",
  "focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-lime)_16%,transparent)]",
);

export const fieldGroupInput =
  "flex-1 min-w-0 min-h-[34px] p-0 border-0 bg-transparent shadow-none outline-none focus:shadow-none";

export const fieldClearBtn = cn(
  "grid place-items-center size-[22px] m-0 p-0 border-0 rounded bg-transparent text-mut2 cursor-pointer shrink-0",
  "transition-[color,background-color,scale] duration-150 hover:text-fg hover:bg-hover active:scale-96",
);

export const chipBase = cn(
  "font-mono text-[10px] font-bold uppercase tracking-[0.08em] px-[11px] py-[5px] rounded-full",
  "border border-line bg-transparent text-mut cursor-pointer",
  "transition-[border-color,background,color,transform] duration-150",
  "hover:border-line2 hover:text-fg active:scale-96",
);

export const chipOn = "bg-lime border-lime text-on-lime";

export const kbd =
  "inline-flex items-center justify-center min-w-[18px] h-[18px] px-[5px] rounded border border-line2 bg-panel2 font-mono text-[10px] font-bold text-mut";

export const selBanner = cn(
  "flex items-center gap-group mt-group px-3 py-2.5 rounded-md text-[13px]",
  "border border-[color-mix(in_srgb,var(--color-lime)_35%,var(--color-line))]",
  "bg-[color-mix(in_srgb,var(--color-lime)_8%,var(--color-panel))]",
);

export const selBannerSticky = cn(
  selBanner,
  "sticky top-[58px] max-sm:top-[52px] z-30 items-start",
  "backdrop-blur-[12px] shadow-[0_10px_24px_var(--theme-backdrop)]",
);

export const imgOutline = "outline outline-1 -outline-offset-1 outline-img-outline";

export const iconCrossfadeWrap = "relative inline-grid place-items-center size-3.5 shrink-0";

export const iconCrossfadeIn =
  "col-start-1 row-start-1 opacity-100 scale-100 blur-0 transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]";

export const iconCrossfadeOut = cn(
  iconCrossfadeIn,
  "opacity-0 scale-[0.25] blur-[4px] pointer-events-none",
);
