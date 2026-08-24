"use client";

import { useState } from "react";
import { Dialog } from "@base-ui-components/react/dialog";

function Shell({ open, onClose, title, desc, children }: { open: boolean; onClose: () => void; title: string; desc: string; children: React.ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/60 backdrop-blur-[3px]" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 w-[min(420px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#171b25] p-5 text-[#e8ebf2] shadow-2xl shadow-black/60 outline-none">
          <Dialog.Title className="text-[17px] font-bold">{title}</Dialog.Title>
          <Dialog.Description className="mt-1 text-[13px] text-[#8b93a7]">{desc}</Dialog.Description>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function AddItemDialog({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (name: string, domain: string) => void }) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), domain.trim());
    setName("");
    setDomain("");
    onClose();
  };
  return (
    <Shell open={open} onClose={onClose} title="Add custom item" desc="Anything with a website gets a logo.">
      <form onSubmit={submit}>
        <label className="mt-3 block text-[11px] font-bold uppercase tracking-[0.06em] text-[#8b93a7]" htmlFor="add-name">Name</label>
        <input id="add-name" className="mt-1 w-full rounded-[10px] border border-white/10 bg-[#12151d] px-3 py-2 text-sm outline-none focus:border-[#6c8cff]" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Perplexity Pro" required />
        <label className="mt-3 block text-[11px] font-bold uppercase tracking-[0.06em] text-[#8b93a7]" htmlFor="add-domain">Website / domain</label>
        <input id="add-domain" className="mt-1 w-full rounded-[10px] border border-white/10 bg-[#12151d] px-3 py-2 text-sm outline-none focus:border-[#6c8cff]" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="e.g. perplexity.ai" />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Add</button>
        </div>
      </form>
    </Shell>
  );
}

export function LogoKeyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [value, setValue] = useState("");
  const initial = typeof window !== "undefined" ? localStorage.getItem("aitier.logodev") ?? "" : "";
  const current = value || initial;
  const save = (v: string) => {
    if (v) localStorage.setItem("aitier.logodev", v);
    else localStorage.removeItem("aitier.logodev");
    onClose();
  };
  return (
    <Shell open={open} onClose={onClose} title="Logo source" desc="Paste your free Logo.dev publishable key for crisp brand logos. Without a key, logos fall back to public favicon services.">
      <label className="mt-3 block text-[11px] font-bold uppercase tracking-[0.06em] text-[#8b93a7]" htmlFor="logo-key">Logo.dev publishable key</label>
      <input id="logo-key" className="mt-1 w-full rounded-[10px] border border-white/10 bg-[#12151d] px-3 py-2 text-sm outline-none focus:border-[#6c8cff]" value={current} onChange={(e) => setValue(e.target.value)} placeholder="pk_..." />
      <p className="mt-2 text-[12px] text-[#8b93a7]">
        Get one at <a href="https://logo.dev" target="_blank" rel="noopener noreferrer" className="text-[#6c8cff] underline">logo.dev</a>
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn" onClick={() => save("")}>Remove</button>
        <button className="btn btn-primary" onClick={() => save(current.trim())}>Save</button>
      </div>
    </Shell>
  );
}
