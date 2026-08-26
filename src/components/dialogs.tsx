"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Button, buttonClass } from "@/components/ui/button";
import { FieldInput } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { dialogBackdrop, dialogPanel, imgOutline } from "@/lib/ui-styles";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ICON_PX = 64;

function fileToIcon(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("That file is not an image."));
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      reject(new Error("Image is larger than 5MB."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not decode that image."));
      img.onload = () => {
        const cv = document.createElement("canvas");
        cv.width = ICON_PX;
        cv.height = ICON_PX;
        const ctx = cv.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas is unavailable."));
          return;
        }
        const ratio = img.width && img.height ? img.width / img.height : 1;
        let dw = ICON_PX;
        let dh = ICON_PX;
        if (ratio > 1) dh = ICON_PX / ratio;
        else dw = ICON_PX * ratio;
        ctx.drawImage(img, (ICON_PX - dw) / 2, (ICON_PX - dh) / 2, dw, dh);
        resolve(cv.toDataURL("image/png"));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

const labelClass = "mt-3 block font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-mut first:mt-4";

function Shell({
  open,
  onClose,
  title,
  desc,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className={dialogBackdrop} />
        <Dialog.Popup className={dialogPanel}>
          <Dialog.Title className="text-[17px] font-bold tracking-tight">{title}</Dialog.Title>
          <Dialog.Description className="mt-1 text-[13px] leading-relaxed text-mut">{desc}</Dialog.Description>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function AddItemForm({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string, domain: string) => void }) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [icon, setIcon] = useState("");
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setReading(true);
    try {
      setIcon(await fileToIcon(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not use that image.");
    } finally {
      setReading(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), icon || domain.trim());
    onClose();
  };

  return (
    <form onSubmit={submit}>
      <label className={labelClass} htmlFor="add-name">
        Name
      </label>
      <FieldInput id="add-name" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Perplexity Pro" required autoFocus />

      <label className={labelClass} htmlFor="add-domain">
        Website / domain
      </label>
      <FieldInput id="add-domain" className="mt-1.5" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="e.g. perplexity.ai" disabled={!!icon} />

      <p className={labelClass}>Or upload an image</p>
      <div className="mt-1.5 flex items-center gap-2.5">
        {icon && (
          <span className="grid size-[34px] place-items-center rounded-[5px]">
            <img src={icon} alt="" width={26} height={26} className={cn("rounded-[5px] object-cover", imgOutline)} />
          </span>
        )}
        <label className={cn(buttonClass(), "cursor-pointer")}>
          {reading ? "Reading…" : icon ? "Replace" : "Choose file"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        {icon && (
          <Button variant="danger" onClick={() => setIcon("")}>
            Remove
          </Button>
        )}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-mut2">
        Stored with your list as a 64px icon. Uploaded images are left out of share links to keep them short.
      </p>
      {error && (
        <p className="mt-2 text-xs text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" type="submit" disabled={reading}>
          Add item
        </Button>
      </div>
    </form>
  );
}

export function AddItemDialog({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (name: string, domain: string) => void }) {
  return (
    <Shell open={open} onClose={onClose} title="Add custom item" desc="Anything with a website gets a logo. Upload an image for anything that does not, or leave both blank for a letter mark.">
      {open ? <AddItemForm onClose={onClose} onAdd={onAdd} /> : null}
    </Shell>
  );
}

export function ConfirmDialog({
  open,
  title,
  desc,
  confirmLabel,
  danger,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  desc: string;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Shell open={open} onClose={onCancel} title={title} desc={desc}>
      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Shell>
  );
}
