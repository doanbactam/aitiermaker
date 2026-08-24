"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { Board, type ContainerId } from "@/components/board";
import { AddItemDialog, LogoKeyDialog } from "@/components/dialogs";
import { PRESETS } from "@/data/presets";
import { ITEMS } from "@/data/catalog";
import { allItems, encodeState, loadState, seed, LS_STATE } from "@/lib/state";
import { exportPNG, copyPNG } from "@/lib/export-png";
import type { TierState } from "@/lib/types";

export default function TierMaker() {
  const [state, setState] = useState<TierState | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);
  const [logoVersion, setLogoVersion] = useState(0);
  const [quickAdd, setQuickAdd] = useState("");
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef<TierState | null>(null);
  const selRef = useRef<string | null>(null);
  useEffect(() => {
    stateRef.current = state;
    selRef.current = selectedId;
  }, [state, selectedId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe client init: server renders null, localStorage read must happen post-mount
  useEffect(() => setState(loadState()), []);
  useEffect(() => {
    if (state) localStorage.setItem(LS_STATE, JSON.stringify(state));
  }, [state]);

  const names = useMemo(() => (state ? allItems(state) : {}), [state]);
  const hasKey = useMemo(() => (typeof window !== "undefined" ? !!localStorage.getItem("aitier.logodev") : false), [logoVersion]);

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
    if (row.items.length && !confirm(`Delete tier "${row.l}"? Its ${row.items.length} items go back to Unranked.`)) return;
    setState((cur) => {
      if (!cur) return cur;
      return { ...cur, rows: cur.rows.filter((_, j) => j !== i), pool: [...cur.pool, ...cur.rows[i].items] };
    });
  }, []);

  if (!state) return null;

  const mutate = (fn: (s: TierState) => TierState) => setState((s) => (s ? fn(s) : s));

  const switchPreset = (id: string) => {
    const ranked = state.rows.some((r) => r.items.length);
    if (ranked && !confirm("Switch preset? Current ranking will be lost.")) return;
    setState(seed(id, state.customs, state.by));
    setSelectedId(null);
  };

  const share = async () => {
    const url = `${location.origin}${location.pathname}?s=${encodeState(state)}`;
    history.replaceState(null, "", `?s=${encodeState(state)}`);
    const text = `${state.t} — my AI tier list${state.by.handle ? ` by ${state.by.handle}` : ""}`;
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      showToast("Link copied ✓");
    } catch {
      showToast("Link is in the address bar");
    }
  };

  const addCustom = (name: string, domainRaw: string) => {
    let d = domainRaw.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!d) d = name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
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

  const reset = () => {
    if (!confirm("Reset this tier list?")) return;
    setState(seed(state.p, state.customs, state.by));
  };

  const q = query.trim().toLowerCase();
  const byline = [state.by.name, state.by.handle].filter(Boolean).join(" · ");

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#232329] bg-[#0a0a0b]">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-2 px-5 py-3">
          <div className="mr-auto flex items-center gap-2 text-[15px] font-extrabold tracking-tight">
            <span className="inline-block h-[10px] w-[10px] bg-[#c8f04b]" aria-hidden="true" />
            AITIERMAKER<span className="text-[#c8f04b]">.</span>
          </div>
          <select className="btn" value={state.p} onChange={(e) => switchPreset(e.target.value)} aria-label="Choose preset">
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <button className="btn" onClick={() => setAddOpen(true)}>+ Item</button>
          <button className="btn" onClick={() => setKeyOpen(true)} title="Logo source settings">Logos</button>
          <button className="btn" onClick={share}>Share</button>
          <button className="btn" onClick={() => exportPNG(state, names).then(() => showToast("PNG downloaded"))}>Download PNG</button>
          <button className="btn" onClick={() => copyPNG(state, names).then((ok) => showToast(ok ? "PNG copied ✓" : "Copy not supported"))}>Copy PNG</button>
          <button className="btn" onClick={reset} title="Reset to preset">Reset</button>
          <button className="btn" onClick={addRow} title="Add tier row">+ Row</button>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-5 pb-14 pt-8">
        <h1
          className="min-w-[60px] cursor-text text-[clamp(28px,5vw,52px)] font-black uppercase leading-[1.02] tracking-[-0.02em] outline-none"
          contentEditable="plaintext-only"
          suppressContentEditableWarning
          spellCheck={false}
          onBlur={(e) => mutate((s) => ({ ...s, t: e.currentTarget.textContent?.trim() || "Untitled" }))}
        >
          {state.t}
        </h1>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[#8b8f98]">
          Switch lanes, drag into tiers. Export a PNG and publish on X.
        </p>

        <div className="mt-5 mb-6 flex flex-wrap items-center gap-2">
          <input
            className="field w-[150px]"
            placeholder="Your name"
            aria-label="Your name"
            value={state.by.name}
            onChange={(e) => mutate((s) => ({ ...s, by: { ...s.by, name: e.target.value } }))}
          />
          <input
            className="field w-[150px] font-mono"
            placeholder="@handle"
            aria-label="X handle"
            value={state.by.handle}
            onChange={(e) => mutate((s) => ({ ...s, by: { ...s.by, handle: e.target.value.startsWith("@") ? e.target.value : "@" + e.target.value } }))}
          />
          {byline && <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#8b8f98]">created by {byline}</span>}
          <input
            className="field ml-auto w-[190px]"
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
              className="field w-[230px]"
              placeholder="Type a model name + Enter"
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

      <footer className="mx-auto flex max-w-[1100px] items-center gap-2 px-5 pb-10 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8b8f98]">
        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: hasKey ? "#c8f04b" : "#55595f" }} />
        <span>{hasKey ? "Logos by logo.dev" : "Fallback logo mode — add a logo.dev key via LOGOS"}</span>
      </footer>

      <AddItemDialog open={addOpen} onClose={() => setAddOpen(false)} onAdd={addCustom} />
      <LogoKeyDialog
        open={keyOpen}
        onClose={() => {
          setKeyOpen(false);
          setLogoVersion((v) => v + 1);
        }}
      />

      <div
        className={`fixed bottom-6 left-1/2 z-[99] -translate-x-1/2 rounded-md border border-[#3a3a42] bg-[#17171c] px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] transition-opacity ${toast ? "opacity-100" : "pointer-events-none opacity-0"}`}
        role="status"
      >
        {toast}
      </div>
    </>
  );
}
