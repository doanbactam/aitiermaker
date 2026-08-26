"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { Board, type ContainerId } from "@/components/board";
import { Toolbar } from "@/components/toolbar";
import { SelectionBar } from "@/components/selection-bar";
import { AddItemDialog, ConfirmDialog } from "@/components/dialogs";
import { PRESETS } from "@/data/presets";
import { ITEMS } from "@/data/catalog";
import { allItems, encodeState, loadState, seed, LS_STATE } from "@/lib/state";
import { exportPNG, copyPNG } from "@/lib/export-png";
import type { TierState } from "@/lib/types";

type ConfirmKind = "reset" | "preset" | "delete-row";

const HISTORY_LIMIT = 50;
const COALESCE_MS = 700;
const TIER_PALETTE = ["#ff6b6b", "#ffa94d", "#ffd43b", "#51cf66", "#74c0fc", "#b197fc", "#f783ac", "#63e6be"];
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
/** Above this, the selection bar shows only a count. */
const NAME_PREVIEW = 3;

function nextLabel(rows: TierState["rows"]): string {
  const used = new Set(rows.map((r) => r.l.trim().toUpperCase()));
  for (const ch of LETTERS) if (!used.has(ch)) return ch;
  return `T${rows.length + 1}`;
}

function nextColor(rows: TierState["rows"]): string {
  const used = new Set(rows.map((r) => r.c.toLowerCase()));
  for (const c of TIER_PALETTE) if (!used.has(c)) return c;
  return TIER_PALETTE[rows.length % TIER_PALETTE.length];
}

export default function TierMaker() {
  const [state, setState] = useState<TierState | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [quickAdd, setQuickAdd] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<{ kind: ConfirmKind; presetId?: string; rowIndex?: number } | null>(null);
  const [remixable, setRemixable] = useState(false);
  const [catFilter, setCatFilter] = useState("all");
  const [histVer, setHistVer] = useState(0);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef<TierState | null>(null);
  const selRef = useRef<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const pastRef = useRef<TierState[]>([]);
  const futureRef = useRef<TierState[]>([]);
  const lastSnapRef = useRef<{ tag: string; at: number } | null>(null);

  useEffect(() => {
    stateRef.current = state;
    selRef.current = selectedIds;
  }, [state, selectedIds]);

  useEffect(() => {
    setState(loadState());
    setRemixable(new URLSearchParams(window.location.search).has("s"));
  }, []);

  useEffect(() => {
    if (state) localStorage.setItem(LS_STATE, JSON.stringify(state));
  }, [state]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const snap = useCallback((tag = "") => {
    const cur = stateRef.current;
    if (!cur) return;
    const now = Date.now();
    const last = lastSnapRef.current;
    if (tag && last && last.tag === tag && now - last.at < COALESCE_MS) {
      lastSnapRef.current = { tag, at: now };
      return;
    }
    lastSnapRef.current = tag ? { tag, at: now } : null;
    const prev = pastRef.current[pastRef.current.length - 1];
    if (prev && JSON.stringify(prev) === JSON.stringify(cur)) return;
    pastRef.current = [...pastRef.current.slice(-(HISTORY_LIMIT - 1)), cur];
    futureRef.current = [];
    setHistVer((v) => v + 1);
  }, []);

  const undo = useCallback(() => {
    const prev = pastRef.current.pop();
    if (!prev) {
      showToast("Nothing to undo");
      return;
    }
    const cur = stateRef.current;
    if (cur) futureRef.current = [...futureRef.current.slice(-(HISTORY_LIMIT - 1)), cur];
    lastSnapRef.current = null;
    setState(prev);
    setSelectedIds([]);
    setHistVer((v) => v + 1);
  }, [showToast]);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) {
      showToast("Nothing to redo");
      return;
    }
    const cur = stateRef.current;
    if (cur) pastRef.current = [...pastRef.current.slice(-(HISTORY_LIMIT - 1)), cur];
    lastSnapRef.current = null;
    setState(next);
    setSelectedIds([]);
    setHistVer((v) => v + 1);
  }, [showToast]);

  const mutate = useCallback((fn: (s: TierState) => TierState, tag = "") => {
    snap(tag);
    setState((s) => (s ? fn(s) : s));
  }, [snap]);

  const moveItem = useCallback((id: string, to: ContainerId, beforeId?: string) => {
    snap();
    setState((s) => {
      if (!s) return s;
      const inPool = s.pool.includes(id);
      const rowIdx = s.rows.findIndex((r) => r.items.includes(id));
      if (!inPool && rowIdx < 0) return s;
      const from: ContainerId = inPool ? "pool" : `row-${rowIdx}`;
      if (from === to && !beforeId) return s;
      if (to !== "pool") {
        const ti = Number(to.slice(4));
        if (!Number.isInteger(ti) || ti < 0 || ti >= s.rows.length) return s;
      }
      const rows = [...s.rows];
      let pool = s.pool;
      if (inPool) pool = pool.filter((x) => x !== id);
      else rows[rowIdx] = { ...rows[rowIdx], items: rows[rowIdx].items.filter((x) => x !== id) };
      if (to === "pool") {
        const next = [...pool];
        const idx = beforeId ? next.indexOf(beforeId) : -1;
        if (idx >= 0) next.splice(idx, 0, id);
        else next.push(id);
        pool = next;
      } else {
        const ti = Number(to.slice(4));
        const items = [...rows[ti].items];
        const idx = beforeId ? items.indexOf(beforeId) : -1;
        if (idx >= 0) items.splice(idx, 0, id);
        else items.push(id);
        rows[ti] = { ...rows[ti], items };
      }
      return { ...s, rows, pool };
    });
  }, [snap]);

  /** Move a selection atomically, preserving click / visible-list order. */
  const moveItems = useCallback((ids: readonly string[], to: ContainerId, beforeId?: string) => {
    if (!ids.length) return;
    snap();
    setState((s) => {
      if (!s) return s;
      if (to !== "pool") {
        const ti = Number(to.slice(4));
        if (!Number.isInteger(ti) || ti < 0 || ti >= s.rows.length) return s;
      }
      const present = new Set([...s.pool, ...s.rows.flatMap((r) => r.items)]);
      const moving = Array.from(new Set(ids)).filter((id) => present.has(id));
      if (!moving.length) return s;
      const movingSet = new Set(moving);
      const pool = s.pool.filter((id) => !movingSet.has(id));
      const rows = s.rows.map((r) => ({ ...r, items: r.items.filter((id) => !movingSet.has(id)) }));
      if (to === "pool") {
        const idx = beforeId && !movingSet.has(beforeId) ? pool.indexOf(beforeId) : -1;
        if (idx >= 0) pool.splice(idx, 0, ...moving);
        else pool.push(...moving);
      } else {
        const ti = Number(to.slice(4));
        const items = rows[ti].items;
        const idx = beforeId && !movingSet.has(beforeId) ? items.indexOf(beforeId) : -1;
        if (idx >= 0) items.splice(idx, 0, ...moving);
        else items.push(...moving);
      }
      return { ...s, rows, pool };
    });
  }, [snap]);

  const reorder = useCallback((cont: ContainerId, from: number, to: number) => {
    snap();
    setState((s) => {
      if (!s) return s;
      if (cont === "pool") return { ...s, pool: arrayMove(s.pool, from, to) };
      const rows = [...s.rows];
      const i = Number(cont.slice(4));
      if (!Number.isInteger(i) || i < 0 || i >= rows.length) return s;
      rows[i] = { ...rows[i], items: arrayMove(rows[i].items, from, to) };
      return { ...s, rows };
    });
  }, [snap]);

  const handleSelect = useCallback((id: string) => {
    setSelectedIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }, []);

  const selectMany = useCallback((ids: string[]) => {
    setSelectedIds((cur) => Array.from(new Set([...cur, ...ids])));
  }, []);

  const placeSelection = useCallback((cont: ContainerId, beforeId?: string) => {
    const ids = selRef.current;
    if (!ids.length) return;
    moveItems(ids, cont, beforeId);
    setSelectedIds([]);
    showToast(`${ids.length} item${ids.length === 1 ? "" : "s"} moved`);
  }, [moveItems, showToast]);

  const sendBack = useCallback((id: string) => moveItem(id, "pool"), [moveItem]);
  const factsOf = useCallback((id: string) => (stateRef.current?.customs[id] ? undefined : ITEMS[id]), []);

  const onRowLabel = useCallback((i: number, field: "l" | "sub", value: string) => {
    mutate((s) => {
      const rows = [...s.rows];
      if (!rows[i]) return s;
      rows[i] = { ...rows[i], [field]: value };
      return { ...s, rows };
    }, `row-${field}-${i}`);
  }, [mutate]);

  const onRowColor = useCallback((i: number, color: string) => {
    mutate((s) => {
      const rows = [...s.rows];
      if (!rows[i]) return s;
      rows[i] = { ...rows[i], c: color };
      return { ...s, rows };
    }, `row-color-${i}`);
  }, [mutate]);

  const deleteRow = useCallback((i: number) => {
    const s = stateRef.current;
    if (!s) return;
    const row = s.rows[i];
    if (!row) return;
    if (row.items.length) {
      setConfirm({ kind: "delete-row", rowIndex: i });
      return;
    }
    mutate((cur) => ({ ...cur, rows: cur.rows.filter((_, j) => j !== i) }));
  }, [mutate]);

  const moveRow = useCallback((i: number, dir: -1 | 1) => {
    mutate((s) => {
      const j = i + dir;
      if (j < 0 || j >= s.rows.length) return s;
      const rows = [...s.rows];
      [rows[i], rows[j]] = [rows[j], rows[i]];
      return { ...s, rows };
    });
  }, [mutate]);

  const removeFromBoard = useCallback((id: string) => {
    mutate((s) => {
      const customs = { ...s.customs };
      delete customs[id];
      return { ...s, pool: s.pool.filter((x) => x !== id), customs };
    });
    setSelectedIds((cur) => cur.filter((x) => x !== id));
    showToast("Removed from board");
  }, [mutate, showToast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const editing = tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable === true;
      const mod = e.metaKey || e.ctrlKey;
      if (!editing && mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (!editing && mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if (e.key === "Escape") {
        setSelectedIds([]);
        setAddOpen(false);
        setConfirm(null);
        return;
      }
      if (!editing && (e.key === "Delete" || e.key === "Backspace") && selRef.current.length) {
        e.preventDefault();
        const s = stateRef.current;
        const ranked = s ? selRef.current.filter((id) => !s.pool.includes(id)) : [];
        if (ranked.length) {
          moveItems(ranked, "pool");
          showToast(`${ranked.length} item${ranked.length === 1 ? "" : "s"} unranked`);
        }
        setSelectedIds([]);
        return;
      }
      if (!editing && e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, moveItems, showToast]);

  const names = useMemo(() => (state ? allItems(state) : {}), [state]);
  const preset = PRESETS.find((p) => p.id === state?.p) ?? PRESETS[0];
  void histVer;
  const canUndo = pastRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;

  if (!state) {
    return (
      <>
        <header className="site-header">
          <div className="mx-auto flex max-w-[1200px] items-center gap-3 px-4 py-3">
            <span className="brand-mark" aria-hidden="true" />
            <span className="font-mono text-[13px] font-bold tracking-[0.08em]">AI TIER MAKER.</span>
          </div>
        </header>
        <main className="mx-auto max-w-[1200px] px-4 py-6">
          <div className="flex flex-col gap-2.5" aria-busy="true" aria-label="Loading board">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="skeleton h-[68px]" />
            ))}
          </div>
        </main>
      </>
    );
  }

  const applyPreset = (id: string) => {
    snap();
    setCatFilter("all");
    setState(seed(id, state.customs, state.by));
    setSelectedIds([]);
  };

  const switchPreset = (id: string) => {
    if (id === state.p) return;
    if (state.rows.some((r) => r.items.length)) setConfirm({ kind: "preset", presetId: id });
    else applyPreset(id);
  };

  const dealUnranked = () => {
    if (!state.pool.length) {
      showToast("Nothing left to deal");
      return;
    }
    mutate((s) => {
      const ids = [...s.pool];
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
      const rows = s.rows.map((r) => ({ ...r, items: [...r.items] }));
      if (!rows.length) return s;
      ids.forEach((id, idx) => rows[idx % rows.length].items.push(id));
      return { ...s, pool: [], rows };
    });
    setSelectedIds([]);
    showToast("Unranked dealt out");
  };

  const sharePayload = () => {
    const encoded = encodeState(state);
    history.replaceState(null, "", `?s=${encoded}`);
    const url = `${location.origin}${location.pathname}?s=${encoded}`;
    const remixed = state.src ? ` · remixed from ${state.src}` : "";
    const text = `${state.t} — my AI tier list${state.by.handle ? ` by ${state.by.handle}` : ""}${remixed}`;
    return { text, url };
  };

  const share = async () => {
    const { text, url } = sharePayload();
    if (navigator.share) {
      try {
        await navigator.share({ title: state.t, text, url });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      showToast("Link copied");
    } catch {
      showToast("Link is in the address bar");
    }
  };

  const postX = () => {
    const { text, url } = sharePayload();
    const intent = new URL(["https:", "", "twitter.com", "intent", "tweet"].join("/"));
    intent.searchParams.set("text", text);
    intent.searchParams.set("url", url);
    window.open(intent.toString(), "_blank", "noopener");
  };

  const remix = () => {
    mutate((s) => ({ ...s, by: { name: "", handle: "" }, src: s.by.handle || s.by.name || s.src }));
    history.replaceState(null, "", location.pathname);
    setRemixable(false);
    showToast("Remixed — make it yours");
  };

  const addCustom = (name: string, domainRaw: string) => {
    const d = domainRaw.startsWith("data:image/") ? domainRaw : domainRaw.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const id = "u" + Date.now().toString(36);
    mutate((s) => ({ ...s, customs: { ...s.customs, [id]: [name, d] }, pool: [...s.pool, id] }));
    showToast(`${name} added`);
  };

  const addQuick = (name: string) => {
    const id = "u" + Date.now().toString(36);
    mutate((s) => ({ ...s, customs: { ...s.customs, [id]: [name, ""] }, pool: [...s.pool, id] }));
    showToast(`${name} added`);
  };

  const addRow = (where: "top" | "bottom") => {
    mutate((s) => {
      const row = { l: nextLabel(s.rows), sub: "New", c: nextColor(s.rows), items: [] as string[] };
      return { ...s, rows: where === "top" ? [row, ...s.rows] : [...s.rows, row] };
    });
    showToast(where === "top" ? "Tier added on top" : "Tier added");
  };

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
        snap();
        setState(seed(state.p, state.customs, state.by));
        setSelectedIds([]);
        showToast("List reset");
        break;
      case "preset":
        if (confirm.presetId) applyPreset(confirm.presetId);
        break;
      case "delete-row": {
        const i = confirm.rowIndex;
        if (i == null) break;
        snap();
        setState((cur) => {
          if (!cur) return cur;
          const row = cur.rows[i];
          if (!row) return cur;
          return { ...cur, rows: cur.rows.filter((_, j) => j !== i), pool: [...cur.pool, ...row.items] };
        });
        setSelectedIds([]);
        break;
      }
    }
    setConfirm(null);
  };

  const confirmCopy = (() => {
    if (!confirm) return { title: "", desc: "", label: "OK", danger: false };
    if (confirm.kind === "reset") return { title: "Reset this list?", desc: "Every item returns to the preset ranking. Custom items stay in Unranked.", label: "Reset", danger: true };
    if (confirm.kind === "preset") return { title: "Switch preset?", desc: "Your current ranking will be replaced by the new preset. Custom items are kept.", label: "Switch", danger: true };
    const row = confirm.rowIndex != null ? state.rows[confirm.rowIndex] : undefined;
    return { title: `Delete tier “${row?.l ?? ""}”?`, desc: `${row?.items.length ?? 0} items will move back to Unranked.`, label: "Delete tier", danger: true };
  })();

  const rankedCount = state.rows.reduce((a, r) => a + r.items.length, 0);
  const totalCount = rankedCount + state.pool.length;
  const pct = totalCount ? Math.round((rankedCount / totalCount) * 100) : 0;
  const previewNames = selectedIds.length <= NAME_PREVIEW ? selectedIds.map((id) => names[id]?.[0] ?? id) : [];

  const onHandleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    const handle = v ? (v.startsWith("@") ? v : "@" + v.replace(/^@+/, "")) : "";
    mutate((s) => ({ ...s, by: { ...s.by, handle } }), "by-handle");
  };

  return (
    <>
      <a className="skip-link" href="#board">
        Skip to board
      </a>

      <header className="site-header">
        <Toolbar
          presetId={state.p}
          presets={PRESETS}
          onPreset={switchPreset}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onAddTier={addRow}
          onAddItem={() => setAddOpen(true)}
          onShare={share}
          onExport={runExport}
          onPostX={postX}
          onDeal={dealUnranked}
          onReset={() => setConfirm({ kind: "reset" })}
          busy={busy}
        />
      </header>

      <main id="board" className="mx-auto max-w-[1200px] px-4 py-6">
        {remixable && (
          <div className="sel-banner">
            <span>Viewing {state.by.handle || state.by.name || "someone"}&apos;s tier list</span>
            <button type="button" className="btn ml-auto" onClick={remix}>
              Remix this
            </button>
          </div>
        )}

        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.1em] text-[#8b8f98]">{preset.desc}</p>
        <h1
          className="mt-1 text-[28px] font-bold tracking-tight outline-none"
          role="textbox"
          aria-label="List title"
          contentEditable="plaintext-only"
          suppressContentEditableWarning
          spellCheck={false}
          onBlur={(e) => {
            const t = e.currentTarget.textContent?.trim() || "Untitled";
            mutate((s) => ({ ...s, t }), "title");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
        >
          {state.t}
        </h1>

        <div className="mt-2.5 flex items-center gap-2.5">
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Ranked progress">
            <span style={{ width: `${pct}%` }} />
          </div>
          <span className="shrink-0 font-mono text-[11px] text-[#8b8f98]">
            {rankedCount}/{totalCount} ranked
          </span>
        </div>

        {selectedIds.length > 0 && <SelectionBar count={selectedIds.length} names={previewNames} rows={state.rows} onPlace={placeSelection} onClear={() => setSelectedIds([])} />}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input
            className="field"
            placeholder="Your name"
            aria-label="Your name"
            value={state.by.name}
            onChange={(e) => {
              const name = e.target.value;
              mutate((s) => ({ ...s, by: { ...s.by, name } }), "by-name");
            }}
          />
          <input className="field" placeholder="@handle" aria-label="Your handle" value={state.by.handle} onChange={onHandleInput} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input ref={searchRef} className="field" placeholder="Filter items  /" aria-label="Filter unranked items" value={query} onChange={(e) => setQuery(e.target.value)} />
          <input
            className="field"
            placeholder="Quick add, then Enter"
            aria-label="Quick add an item"
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
        </div>

        <div className="mt-5">
          <Board
            state={state}
            names={names}
            factsOf={factsOf}
            selectedIds={selectedIds}
            poolFilter={query}
            catFilter={catFilter}
            onCatFilter={setCatFilter}
            onMove={moveItem}
            onReorder={reorder}
            onSelect={handleSelect}
            onSelectMany={selectMany}
            onZoneClick={placeSelection}
            onSendBack={sendBack}
            onRowLabel={onRowLabel}
            onRowColor={onRowColor}
            onRowDelete={deleteRow}
            onRowMove={moveRow}
            onRemove={removeFromBoard}
          />
        </div>

        <p className="mt-5 font-mono text-[11px] text-[#5c6068]">
          Click items to select · place with the tier chips · drag or double-click for one item
          <span className="hide-sm">
            {" "}· Filter <span className="kbd">/</span> · Clear <span className="kbd">Esc</span> · Unrank selected <span className="kbd">Del</span> · Undo <span className="kbd">Ctrl</span>{" "}
            <span className="kbd">Z</span> · Redo <span className="kbd">Ctrl</span> <span className="kbd">⇧</span> <span className="kbd">Z</span>
          </span>
        </p>
      </main>

      <AddItemDialog open={addOpen} onClose={() => setAddOpen(false)} onAdd={addCustom} />
      <ConfirmDialog open={!!confirm} title={confirmCopy.title} desc={confirmCopy.desc} confirmLabel={confirmCopy.label} danger={confirmCopy.danger} onCancel={() => setConfirm(null)} onConfirm={runConfirm} />

      <div className={`toast${toast ? " on" : ""}`} role="status" aria-live="polite">
        {toast}
      </div>
    </>
  );
}
