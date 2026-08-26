"use client";

import { cloneElement, isValidElement } from "react";
import { cn } from "@/lib/cn";
import { iconCrossfadeIn, iconCrossfadeOut, iconCrossfadeWrap } from "@/lib/ui-styles";

export function IconCrossfade({
  showAlt,
  primary,
  alt,
  className,
}: {
  showAlt: boolean;
  primary: React.ReactElement<{ className?: string }>;
  alt: React.ReactElement<{ className?: string }>;
  className?: string;
}) {
  const gridSlot = "col-start-1 row-start-1";
  return (
    <span className={cn(iconCrossfadeWrap, className)} aria-hidden="true">
      {isValidElement(primary)
        ? cloneElement(primary, { className: cn(gridSlot, showAlt ? iconCrossfadeOut : iconCrossfadeIn, primary.props.className) })
        : primary}
      {isValidElement(alt) ? cloneElement(alt, { className: cn(gridSlot, showAlt ? iconCrossfadeIn : iconCrossfadeOut, alt.props.className) }) : alt}
    </span>
  );
}
