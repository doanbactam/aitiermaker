"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Copy, Download } from "lucide-react";
import { AttributionFields } from "@/components/attribution-fields";
import { Mark } from "@/components/tile";
import { Button } from "@/components/ui/button";
import { FieldInput } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { getLogoDevKey, normalizeDomain, persistLogoDevKey } from "@/lib/logos";
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
  const [website, setWebsite] = useState("");
  const [icon, setIcon] = useState("");
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setReading(true);
    try {
      setIcon(await fileToIcon(file));
      setWebsite("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not use that image.");
    } finally {
      setReading(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const mark = icon || normalizeDomain(website);
    onAdd(trimmed, mark);
    onClose();
  };

  const domainPreview = !icon && website.trim() ? normalizeDomain(website) : "";
  const hasLogoDev = Boolean(getLogoDevKey());

  return (
    <form className="mt-4" onSubmit={submit}>
      <label className="sr-only" htmlFor="add-name">
        Name
      </label>
      <FieldInput id="add-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name…" required autoFocus />

      <label className="sr-only" htmlFor="add-website">
        Website
      </label>
      <FieldInput
        id="add-website"
        className="mt-3"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        placeholder="Website… e.g. perplexity.ai"
        disabled={Boolean(icon)}
        autoComplete="url"
        inputMode="url"
      />

      <div className="mt-3 flex min-h-[26px] items-center gap-2.5">
        {icon ? (
          <img src={icon} alt="" width={26} height={26} className={cn("rounded-[5px] object-cover", imgOutline)} />
        ) : domainPreview ? (
          <Mark mark={undefined} domain={domainPreview} name={name.trim() || domainPreview} size={26} />
        ) : null}
        <label className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-mut cursor-pointer transition-colors hover:text-fg">
          {reading ? "Reading…" : icon ? "Replace image" : "Upload image"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            disabled={reading}
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        {icon ? (
          <button type="button" className="font-mono text-[11px] text-mut2 transition-colors hover:text-fg" onClick={() => setIcon("")}>
            Remove image
          </button>
        ) : null}
      </div>

      {!icon && website.trim() && !hasLogoDev ? (
        <p className="mt-2 text-[11px] leading-relaxed text-mut2">No Logo.dev key — using public favicons. Add a key in the footer for sharper logos.</p>
      ) : null}

      {error ? (
        <p className="mt-2 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" type="submit" disabled={reading || !name.trim()}>
          Add
        </Button>
      </div>
    </form>
  );
}

function LogoKeyForm({ onClose }: { onClose: () => void }) {
  const [key, setKey] = useState(() => getLogoDevKey());

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    persistLogoDevKey(key);
    onClose();
  };

  return (
    <form className="mt-4" onSubmit={save}>
      <label className="sr-only" htmlFor="logo-key">
        Logo.dev publishable key
      </label>
      <FieldInput id="logo-key" value={key} onChange={(e) => setKey(e.target.value)} placeholder="pk_…" autoComplete="off" spellCheck={false} />
      <div className="mt-5 flex justify-end gap-2">
        <Button
          type="button"
          onClick={() => {
            persistLogoDevKey("");
            onClose();
          }}
        >
          Clear
        </Button>
        <Button variant="primary" type="submit">
          Save
        </Button>
      </div>
    </form>
  );
}

export function LogoKeyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Shell
      open={open}
      onClose={onClose}
      title="Logo.dev key"
      desc="Optional publishable key (pk_…) for brand logos from a website. Without it, logos fall back to public favicon services."
    >
      {open ? <LogoKeyForm key="logo-key-form" onClose={onClose} /> : null}
    </Shell>
  );
}

export function AddItemDialog({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (name: string, domain: string) => void }) {
  return (
    <Shell open={open} onClose={onClose} title="Add item" desc="Name required. Paste a website for a logo, upload an image, or skip both for a letter mark.">
      {open ? <AddItemForm onClose={onClose} onAdd={onAdd} /> : null}
    </Shell>
  );
}

export function ExportDialog({
  open,
  mode,
  busy,
  name,
  handle,
  onClose,
  onNameChange,
  onHandleChange,
  onExport,
}: {
  open: boolean;
  mode: "download" | "copy";
  busy?: boolean;
  name: string;
  handle: string;
  onClose: () => void;
  onNameChange: (value: string) => void;
  onHandleChange: (value: string) => void;
  onExport: () => void;
}) {
  const label = mode === "download" ? "Download PNG" : "Copy PNG";
  return (
    <Shell open={open} onClose={onClose} title="Export PNG" desc="Add @handle for credit on the image — helps people find you when it spreads.">
      <AttributionFields name={name} handle={handle} onNameChange={onNameChange} onHandleChange={onHandleChange} />
      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={busy} onClick={onExport}>
          {mode === "download" ? <Download size={14} strokeWidth={2} aria-hidden="true" /> : <Copy size={14} strokeWidth={2} aria-hidden="true" />}
          {label}
        </Button>
      </div>
    </Shell>
  );
}

export function PostXDialog({
  open,
  busy,
  name,
  handle,
  previewUrl,
  onClose,
  onNameChange,
  onHandleChange,
  onPost,
}: {
  open: boolean;
  busy?: boolean;
  name: string;
  handle: string;
  previewUrl: string | null;
  onClose: () => void;
  onNameChange: (value: string) => void;
  onHandleChange: (value: string) => void;
  onPost: () => void;
}) {
  return (
    <Shell
      open={open}
      onClose={onClose}
      title="Post on X"
      desc="X can’t auto-attach images from a link. We’ll download your PNG and open compose — then tap the image button and pick that file."
    >
      <div className="mt-4 overflow-hidden rounded-md border border-line bg-panel">
        {previewUrl ? (
          <img src={previewUrl} alt="Tier list preview" className={cn("block w-full", imgOutline)} />
        ) : (
          <div className="skeleton aspect-[1200/630] w-full" aria-busy="true" aria-label="Rendering preview" />
        )}
      </div>
      <div className="mt-3.5">
        <AttributionFields name={name} handle={handle} onNameChange={onNameChange} onHandleChange={onHandleChange} />
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={busy || !previewUrl} onClick={onPost}>
          <span className="text-[13px] font-bold leading-none" aria-hidden="true">
            𝕏
          </span>
          Download PNG & open X
        </Button>
      </div>
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
