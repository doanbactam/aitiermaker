"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { Board, type ContainerId } from "@/components/board";
import { AddItemDialog, ConfirmDialog, LogoKeyDialog } from "@/components/dialogs";
import { PRESETS } from "@/data/presets";
import { ITEMS } from "@/data/catalog";
import { allItems, encodeState, loadState, seed, LS_STATE } from "@/lib/state";
import { exportPNG, copyPNG } from "@/lib/export-png";
import type { TierState } from "@/lib/types";

type ConfirmKind = "reset" | "preset" | "delete-row";

export default function TierMaker() {
  const [state, setState] = useState<TierState | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [logoVersion, setLogoVersion] = useState(0);
  const [quickAdd, setQuickAdd] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<{ kind: ConfirmKind; presetId?: string; rowIndex?: number } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef<TierState | null>(null);
  const selRef = useRef<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    stateRef.current = state;
    selRef.current = selectedId;
  }, [state, selectedId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe client init: server renders null, localStorage read must happen post-mount
  useEffect(() => setState(loadState()), []);
  useEffect(() => {
    if (state) localStorage.setItem(LS_STATE, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const editing = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if (e.key === "Escape") {
        setSelectedId(null);
        setMoreOpen(false);
        setAddOpen(false);
        setKeyOpen(false);
        setConfirm(null);
        return;
      }
      if (!editing && e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!moreOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [moreOpen]);

  const names = useMemo(() => (state ? allItems(state) : {}), [state]);
  const hasKey = typeof window !== "undefined" && logoVersion >= 0 && !!localStorage.getItem("aitier.logodev");
  const preset = PRESETS.find((p) => p.id === state?.p) ?? PRESETS[0];

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  };

  const moveItem = useCallback((id: string, to: ContainerId, beforeId?: string) => {
    setState((s) => {
      if (!s) return s;
      const from = s.pool.includes(id) ? "pool" : `row-${s.rows.findIndex((r) => r.items.includes(id))}`;
      if (from === to && !beforeId) return s;
      const rows = [...s.rows];
      let pool = s.pool;
      if (from === "pool") pool = pool.filter((x) => x !== id);
      else {
        const fi = Number(from.slice(4));
        rows[fi] = { ...rows[fi], items: rows[fi].items.filter((x) => x !== id) };
      }
      if (to === "pool") {
        const next = [...pool];
        const idx = beforeId ? next.indexOf(beforeId) : -1;
        if (idx >= 0) next.splice(idx, 0, id);
        else next.push(id);
        pool = next;
      } else {
        const ti = Number(to.slice(4));
        const items = [...(rows[ti]?.items ?? [])];
        const idx = beforeId ? items.indexOf(beforeId) : -1;
        if (idx >= 0) items.splice(idx, 0, id);
        else items.push(id);
        rows[ti] = { ...rows[ti], items };
      }
      return { ...s, rows, pool };
    });
  }, []);

  const reorder = useCallback((cont: ContainerId, from: number, to: number) => {
    setState((s) => {
      if (!s) return s;
      if (cont === "pool") return { ...s, pool: arrayMove(s.pool, from, to) };
      const rows = [...s.rows];
      const i = Number(cont.slice(4));
      rows[i] = { ...rows[i], items: arrayMove(rows[i].items, from, to) };
      return { ...s, rows };
    });
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      const cur = selRef.current;
      if (cur && cur !== id) {
        const s = stateRef.current;
        if (s) {
          const cont = s.pool.includes(id) ? "pool" : `row-${s.rows.findIndex((r) => r.items.includes(id))}`;
          moveItem(cur, cont, id);
        }
        setSelectedId(null);
        return;
      }
      setSelectedId(cur === id ? null : id);
    },
    [moveItem]
  );

  const handleZoneClick = useCallback(
    (cont: ContainerId) => {
      if (selRef.current) {
        moveItem(selRef.current, cont);
        setSelectedId(null);
      }
    },
    [moveItem]
  );

  const sendBack = useCallback((id: string) => moveItem(id, "pool"), [moveItem]);
  const factsOf = useCallback((id: string) => (stateRef.current?.customs[id] ? undefined : ITEMS[id]), []);

  const onRowLabel = useCallback((i: number, field: "l" | "sub", value: string) => {
    setState((s) => {
      if (!s) return s;
      const rows = [...s.rows];
      rows[i] = { ...rows[i], [field]: value };
      return { ...s, rows };
    });
  }, []);

  const onRowColor = useCallback((i: number, color: string) => {
    setState((s) => {
      if (!s) return s;
      const rows = [...s.rows];
      rows[i] = { ...rows[i], c: color };
      return { ...s, rows };
    });
  }, []);

  const deleteRow = useCallback((i: number) => {
    const s = stateRef.current;
    if (!s) return;
    const row = s.rows[i];
    if (row.items.length) {
      setConfirm({ kind: "delete-row", rowIndex: i });
      return;
    }
    setState((cur) => (cur ? { ...cur, rows: cur.rows.filter((_, j) => j !== i) } : cur));
  }, []);

  if (!state) {
    return (
      <>
        <header className="site-header">
          <div className="mx-auto flex max-w-[1100px] items-center gap-3 px-5 py-3">
            <span className="brand-mark" aria-hidden="true" />
            <span className="text-[15px] font-extrabold tracking-tight">
              AI TIER MAKER<span className="text-[#c8f04b]">.</span>
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-[1100px] px-5 pb-14 pt-8" aria-busy="true" aria-label="Loading board">
          <div className="skeleton h-12 w-[min(520px,90%)]" />
          <div className="skeleton mt-3 h-4 w-64" />
          <div className="mt-8 flex flex-col gap-2.5">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="skeleton h-[68px] w-full" />
            ))}
          </div>
        </main>
      </>
    );
  }

  const mutate = (fn: (s: TierState) => TierState) => setState((s) => (s ? fn(s) : s));

  const applyPreset = (id: string) => {
    setState(seed(id, state.customs, state.by));
    setSelectedId(null);
  };

  const switchPreset = (id: string) => {
    if (id === state.p) return;
    const ranked = state.rows.some((r) => r.items.length);
    if (ranked) {
      setConfirm({ kind: "preset", presetId: id });
      return;
    }
    applyPreset(id);
  };

  const share = async () => {
    const encoded = encodeState(state);
    const url = `${location.origin}${location.pathname}?s=${encoded}`;
    history.replaceState(null, "", `?s=${encoded}`);
    const text = `${state.t} — my AI tier list${state.by.handle ? ` by ${state.by.handle}` : ""}`;
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      showToast("Link copied");
    } catch {
      showToast("Link is in the address bar");
    }
  };

  const addCustom = (name: string, domainRaw: string) => {
    const d = domainRaw.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const id = "u" + Date.now().toString(36);
    mutate((s) => ({ ...s, customs: { ...s.customs, [id]: [name, d] }, pool: [...s.pool, id] }));
    showToast(`${name} added`);
  };

  const addQuick = (name: string) => {
    const id = "u" + Date.now().toString(36);
    mutate((s) => ({ ...s, customs: { ...s.customs, [id]: [name, ""] }, pool: [...s.pool, id] }));
    showToast(`${name} added`);
  };

  const addRow = () =>
    mutate((s) => ({
      ...s,
      rows: [...s.rows, { l: String.fromCharCode(65 + ((s.rows.length + 3) % 26)), sub: "New", c: "#9775fa", items: [] }],
    }));

  const runExport = async (mode: "download" | "copy") => {
    setBusy(true);
    try {
      if (mode === "download") {
        await exportPNG(state, names);
        showToast("PNG downloaded");
      } else {
        const ok = await copyPNG(state, names);
        showToast(ok ? "PNG copied" : "Copy not supported");
      }
    } finally {
      setBusy(false);
    }
  };

  const runConfirm = () => {
    if (!confirm) return;
    switch (confirm.kind) {
      case "reset":
        setState(seed(state.p, state.customs, state.by));
        setSelectedId(null);
        showToast("List reset");
        break;
      case "preset":
        if (confirm.presetId) applyPreset(confirm.presetId);
        break;
      case "delete-row": {
        const i = confirm.rowIndex;
        if (i == null) break;
        setState((cur) => {
          if (!cur) return cur;
          const row = cur.rows[i];
          if (!row) return cur;
          return { ...cur, rows: cur.rows.filter((_, j) => j !== i), pool: [...cur.pool, ...row.items] };
        });
        break;
      }
      default: {
        const _exhaustive: never = confirm.kind;
        return _exhaustive;
      }
    }
    setConfirm(null);
  };

  const confirmCopy = (() => {
    if (!confirm) return { title: "", desc: "", label: "OK", danger: false };
    switch (confirm.kind) {
      case "reset":
        return { title: "Reset this list?", desc: "Every item returns to the preset ranking. Custom items stay in Unranked.", label: "Reset", danger: true };
      case "preset":
        return { title: "Switch preset?", desc: "Your current ranking will be replaced by the new preset. Custom items are kept.", label: "Switch", danger: true };
      case "delete-row": {
        const row = confirm.rowIndex != null ? state.rows[confirm.rowIndex] : undefined;
        return {
          title: `Delete tier “${row?.l ?? ""}”?`,
          desc: `${row?.items.length ?? 0} items will move back to Unranked.`,
          label: "Delete tier",
          danger: true,
        };
      }
      default: {
        const _exhaustive: never = confirm.kind;
        return _exhaustive;
      }
    }
  })();

  const q = query.trim().toLowerCase();
  const byline = [state.by.name, state.by.handle].filter(Boolean).join(" · ");
  const selectedName = selectedId ? names[selectedId]?.[0] ?? selectedId : null;

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v.startsWith("@")) mutate((s) => ({ ...s, by: { ...s.by, handle: v } }));
    else mutate((s) => ({ ...s, by: { ...s.by, handle: v ? "@" + v.replace(/^@+/, "") : "" } }));
  };

  return (
    <>
      <header className="site-header">
        <div className="mx-auto flex max-w-[1100px] flex-nowrap items-center gap-2 overflow-x-auto px-5 py-3">
          <div className="mr-auto flex items-center gap-2.5 text-[15px] font-extrabold tracking-tight">
            <span className="brand-mark" aria-hidden="true" />
            AI TIER MAKER<span className="text-[#c8f04b]">.</span>
          </div>
          <select className="btn" value={state.p} onChange={(e) => switchPreset(e.target.value)} aria-label="Choose preset">
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <button type="button" className="btn" onClick={() => setAddOpen(true)}>
            + Item
          </button>
          <button type="button" className="btn btn-primary" onClick={share}>
            Share
          </button>
          <button type="button" className="btn hide-sm" disabled={busy} onClick={() => runExport("download")}>
            {busy ? "Rendering…" : "Download PNG"}
          </button>
          <div className="relative" ref={moreRef}>
            <button type="button" className="btn" aria-expanded={moreOpen} aria-haspopup="menu" onClick={() => setMoreOpen((v) => !v)}>
              More
            </button>
            {moreOpen && (
              <div className="more-menu" role="menu">
                <button type="button" className="btn show-sm" role="menuitem" disabled={busy} onClick={() => { setMoreOpen(false); runExport("download"); }}>
                  Download PNG
                </button>
                <button type="button" className="btn" role="menuitem" disabled={busy} onClick={() => { setMoreOpen(false); runExport("copy"); }}>
                  Copy PNG
                </button>
                <button type="button" className="btn" role="menuitem" onClick={() => { setMoreOpen(false); addRow(); }}>
                  + Row
                </button>
                <button type="button" className="btn" role="menuitem" onClick={() => { setMoreOpen(false); setKeyOpen(true); }}>
                  Logos
                </button>
                <button type="button" className="btn btn-danger" role="menuitem" onClick={() => { setMoreOpen(false); setConfirm({ kind: "reset" }); }}>
                  Reset
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-[1100px] px-5 pb-14 pt-8">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#8b8f98]">{preset.desc}</p>
        <h1
          className="mt-1 min-w-[60px] cursor-text text-[clamp(28px,5vw,52px)] font-black uppercase leading-[1.02] tracking-[-0.02em] outline-none rounded-md hover:bg-[#18181d] focus:bg-[#18181d] px-1 -mx-1"
          contentEditable="plaintext-only"
          suppressContentEditableWarning
          spellCheck={false}
          role="textbox"
          aria-label="List title"
          onBlur={(e) => mutate((s) => ({ ...s, t: e.currentTarget.textContent?.trim() || "Untitled" }))}
        >
          {state.t}
        </h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.12em] text-[#8b8f98]">
          <span>Drag into tiers · tap then tap a row on touch</span>
          <span className="hide-sm inline-flex items-center gap-1.5">
            Filter <kbd className="kbd">/</kbd>
            <span className="text-[#5c6068]">·</span>
            Deselect <kbd className="kbd">Esc</kbd>
          </span>
        </p>

        {selectedName && (
          <div className="sel-banner" role="status">
            <span className="h-2 w-2 rounded-full bg-[#c8f04b]" aria-hidden="true" />
            <span>
              Place <strong>{selectedName}</strong> — click a tier, another item, or Unranked.
            </span>
            <button type="button" className="btn ml-auto" onClick={() => setSelectedId(null)}>
              Cancel
            </button>
          </div>
        )}

        <div className="mt-5 mb-6 flex flex-wrap items-center gap-2">
          <input className="field w-[150px]" placeholder="Your name" aria-label="Your name" value={state.by.name} onChange={(e) => mutate((s) => ({ ...s, by: { ...s.by, name: e.target.value } }))} />
          <input className="field w-[150px] font-mono" placeholder="@handle" aria-label="X handle" value={state.by.handle} onChange={handleInput} />
          {byline && <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#8b8f98]">created by {byline}</span>}
          <input
            ref={searchRef}
            className="field ml-auto w-[min(100%,190px)]"
            type="search"
            placeholder="Filter items…"
            aria-label="Filter items"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <Board
          key={logoVersion}
          state={state}
          names={names}
          factsOf={factsOf}
          selectedId={selectedId}
          poolFilter={q}
          poolCount={state.pool.length}
          poolHeader={
            <input
              className="field w-[min(100%,230px)]"
              placeholder="Type a name + Enter"
              aria-label="Quick add model"
              maxLength={40}
              value={quickAdd}
              onChange={(e) => setQuickAdd(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = e.currentTarget.value.trim();
                  if (v) {
                    addQuick(v);
                    setQuickAdd("");
                  }
                }
              }}
            />
          }
          onMove={moveItem}
          onReorder={reorder}
          onSelect={handleSelect}
          onZoneClick={handleZoneClick}
          onSendBack={sendBack}
          onRowLabel={onRowLabel}
          onRowColor={onRowColor}
          onRowDelete={deleteRow}
        />
      </main>

      <footer className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-2 px-5 pb-10 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8b8f98]">
        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: hasKey ? "#c8f04b" : "#55595f" }} aria-hidden="true" />
        <span>{hasKey ? "Logos by logo.dev" : "Fallback logos — add a logo.dev key via Logos"}</span>
        <span className="ml-auto text-[#5c6068]">Double-click a tile to unrank</span>
      </footer>

      <AddItemDialog open={addOpen} onClose={() => setAddOpen(false)} onAdd={addCustom} />
      <LogoKeyDialog
        open={keyOpen}
        onClose={() => {
          setKeyOpen(false);
          setLogoVersion((v) => v + 1);
        }}
      />
      <ConfirmDialog
        open={!!confirm}
        title={confirmCopy.title}
        desc={confirmCopy.desc}
        confirmLabel={confirmCopy.label}
        danger={confirmCopy.danger}
        onCancel={() => setConfirm(null)}
        onConfirm={runConfirm}
      />

      <div className={`toast${toast ? " on" : ""}`} role="status" aria-live="polite">
        {toast}
      </div>
    </>
  );
}
