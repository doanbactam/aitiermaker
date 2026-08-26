"use client";

import { useState } from "react";
import { Dialog } from "@base-ui-components/react/dialog";

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
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), domain.trim());
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
      <input id="add-domain" className="field mt-1.5 w-full" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="e.g. perplexity.ai" />
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="btn" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Add item
        </button>
      </div>
    </form>
  );
}

export function AddItemDialog({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (name: string, domain: string) => void }) {
  return (
    <Shell open={open} onClose={onClose} title="Add custom item" desc="Anything with a website gets a logo. Leave the domain blank for a letter mark.">
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
