"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Check, Copy, Download, ImageIcon, Link2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconCrossfade } from "@/components/ui/icon-crossfade";
import { cn } from "@/lib/cn";
import { dialogBackdrop, dialogPanel, imgOutline } from "@/lib/ui-styles";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  text: string;
  url: string;
  ogUrl: string;
  busy?: boolean;
  onCopyLink: () => void | Promise<void>;
  onNativeShare: () => void | Promise<void>;
  onPostX: () => void;
  onExport: (mode: "download" | "copy") => void;
}

export function ShareDialog({
  open,
  onClose,
  title,
  text,
  url,
  ogUrl,
  busy,
  onCopyLink,
  onNativeShare,
  onPostX,
  onExport,
}: ShareDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.select(), 60);
    return () => clearTimeout(t);
  }, [open, url]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setCopied(false);
      onClose();
    }
  };

  const copy = async () => {
    await onCopyLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className={dialogBackdrop} />
        <Dialog.Popup className={cn(dialogPanel, "w-[min(480px,94vw)]")}>
          <Dialog.Title className="text-[17px] font-bold tracking-tight">Share your tier list</Dialog.Title>
          <Dialog.Description className="mt-1 text-[13px] leading-relaxed text-mut">
            Link carries your ranking — preview card renders on our server, no heavy export needed.
          </Dialog.Description>

          <div className="mt-4 grid gap-2.5 rounded-md border border-line bg-panel p-1">
            <img src={ogUrl} alt="" className={cn("block aspect-[1200/630] w-full rounded-sm bg-bg object-cover", imgOutline)} loading="lazy" decoding="async" />
            <div className="grid gap-1 px-2 pb-2">
              <p className="text-sm font-bold leading-snug">{title}</p>
              <p className="text-xs leading-snug text-mut">{text}</p>
            </div>
          </div>

          <label className="mt-3.5 block font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-mut">Share link</label>
          <div className="mt-1.5 flex items-center gap-2 rounded-md border border-line bg-bg py-1 ps-2.5 pe-1">
            <Link2 size={14} strokeWidth={2} className="shrink-0 text-mut2" aria-hidden="true" />
            <input
              ref={inputRef}
              className="min-w-0 flex-1 border-0 bg-transparent font-mono text-[11px] text-fg outline-none"
              readOnly
              value={url}
              aria-label="Share link"
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button variant="primary" className="shrink-0" onClick={copy}>
              <IconCrossfade showAlt={copied} primary={<Copy size={14} strokeWidth={2} />} alt={<Check size={14} strokeWidth={2} />} />
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {canShare && (
              <Button className="min-w-[120px] flex-1 justify-center" onClick={onNativeShare}>
                <Share2 size={14} strokeWidth={2} aria-hidden="true" />
                Share…
              </Button>
            )}
            <Button className="min-w-[120px] flex-1 justify-center" onClick={onPostX}>
              <span className="text-[13px] font-bold leading-none" aria-hidden="true">
                𝕏
              </span>
              Post on X
            </Button>
          </div>

          <details className="mt-3.5 rounded-md border border-line bg-[color-mix(in_srgb,var(--color-panel)_80%,transparent)]">
            <summary className="flex cursor-pointer list-none items-center gap-2 p-2.5 text-[13px] font-semibold [&::-webkit-details-marker]:hidden">
              <ImageIcon size={14} strokeWidth={2} aria-hidden="true" />
              Export PNG
              <span className="ms-auto font-mono text-[10px] font-semibold uppercase tracking-[0.04em] text-mut2">optional · uses more bandwidth</span>
            </summary>
            <div className="flex gap-2 px-3 pb-3">
              <Button disabled={busy} onClick={() => onExport("download")}>
                <Download size={14} strokeWidth={2} aria-hidden="true" />
                Download
              </Button>
              <Button disabled={busy} onClick={() => onExport("copy")}>
                <Copy size={14} strokeWidth={2} aria-hidden="true" />
                Copy image
              </Button>
            </div>
          </details>

          <div className="mt-5 flex justify-end">
            <Button onClick={onClose}>Done</Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
