import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { siteHeader, siteMain, siteShell } from "@/lib/ui-styles";

type SiteShellProps = {
  header: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  mainId?: string;
  mainClassName?: string;
};

export function SiteShell({ header, footer, children, mainId = "board", mainClassName }: SiteShellProps) {
  return (
    <div className={siteShell}>
      <header className={siteHeader}>{header}</header>
      <main id={mainId} className={cn(siteMain, mainClassName)}>
        {children}
      </main>
      {footer}
    </div>
  );
}
