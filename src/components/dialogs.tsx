"use client";

import { useState } from "react";
import { Dialog } from "@base-ui-components/react/dialog";

/** Largest file we will read before downscaling. */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
/** Stored icons are square PNGs of this size, which keeps the data URL small. */
const ICON_PX = 64;

/**
 * Read a picked file and re-encode it as a small square PNG data URL.
 * Downscaling here is what makes inline storage viable: a 4MB photo becomes a
 * few KB, so localStorage and the state blob stay reasonable.
 */
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
        <Dialog.Backdrop className="dialog-backdrop fixed inset-0" />
        <Dialog.Popup className="dialog-panel">
          <Dialog.Title className="text-[17px] font-bold tracking-tight">{title}</Dialog.Title>
          <Dialog.Description className="mt-1 text-[13px] leading-relaxed text-[#8b8f98]">{desc}</Dialog.Description>
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
    // An uploaded image wins over a domain: it is what the user explicitly chose.
    onAdd(name.trim(), icon || domain.trim());
    onClose();
  };

  return (
    <form onSubmit={submit}>
      <label className="mt-4 block font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[#8b8f98]" htmlFor="add-name">
        Name
      </label>
      <input id="add-name" className="field mt-1.5 w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Perplexity Pro" required autoFocus />

      <label className="mt-3 block font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[#8b8f98]" htmlFor="add-domain">
        Website / domain
      </label>
      <input
        id="add-domain"
        className="field mt-1.5 w-full"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        placeholder="e.g. perplexity.ai"
        disabled={!!icon}
      />

      <p className="mt-3 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[#8b8f98]">Or upload an image</p>
      <div className="mt-1.5 flex items-center gap-2.5">
        {icon && (
          <span className="mk" style={{ width: 34, height: 34 }}>
            <img src={icon} alt="" width={26} height={26} />
          </span>
        )}
        <label className="btn cursor-pointer">
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
          <button type="button" className="btn btn-danger" onClick={() => setIcon("")}>
            Remove
          </button>
        )}
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-[#5c6068]">
        Stored with your list as a 64px icon. Uploaded images are left out of share links to keep them short.
      </p>
      {error && (
        <p className="mt-2 text-[12px] text-[#ff6b6b]" role="alert">
          {error}
        </p>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="btn" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={reading}>
          Add item
        </button>
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
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Shell>
  );
}
