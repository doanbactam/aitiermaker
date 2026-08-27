"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { Plus, Search, X } from "lucide-react";
import { Board, type ContainerId } from "@/components/board";
import { Toolbar } from "@/components/toolbar";
import { SelectionBar } from "@/components/selection-bar";
import { AddItemDialog, ConfirmDialog } from "@/components/dialogs";
import { PRESETS } from "@/data/presets";
import { ITEMS } from "@/data/catalog";
import { allItems, encodeState, loadState, seed, LS_STATE, shareLink } from "@/lib/state";
import { exportPNG, copyPNG } from "@/lib/export-png";
import { ShareDialog } from "@/components/share-dialog";
import { AdMidBlock, AdSponsors } from "@/components/ad-slot";
import { midBoardAd, sponsorAds } from "@/lib/ads";
import type { TierState } from "@/lib/types";
import type { SelectOpts } from "@/components/tile";
import { Button } from "@/components/ui/button";
import { FieldClear, FieldGroup, FieldGroupInput } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "@/components/theme-toggle";
import { brandMark, kbd, layoutShell, selBanner, siteHeader } from "@/lib/ui-styles";

type ConfirmKind = "reset" | "delete-row";
type ToastState = { msg: string; undo?: () => void } | null;

const HISTORY_LIMIT = 50;
const COALESCE_MS = 700;
const TIER_PALETTE = ["#ff6b6b", "#ffa94d", "#ffd43b", "#51cf66", "#74c0fc", "#b197fc", "#f783ac", "#63e6be"];
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
/** Above this, the selection bar shows only a count. */
const NAME_PREVIEW = 3;

type ClientBoot = { state: TierState; remixable: boolean };

let clientBootCache: ClientBoot | null | undefined;

function readClientBoot(): ClientBoot | null {
  if (typeof window === "undefined") return null;
  if (clientBootCache === undefined) {
    clientBootCache = {
      state: loadState(),
      remixable: new URLSearchParams(window.location.search).has("s"),
    };
  }
  return clientBootCache;
}

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
  const [toast, setToast] = useState<ToastState>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<{ kind: ConfirmKind; rowIndex?: number } | null>(null);
  const [remixable, setRemixable] = useState<boolean | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareInfo, setShareInfo] = useState<{ url: string; text: string; og: string } | null>(null);
  const [catFilter, setCatFilter] = useState("all");
  const [histCounts, setHistCounts] = useState({ undo: 0, redo: 0 });

  const clientBoot = useSyncExternalStore(
    () => () => {},
    readClientBoot,
    () => null,
  );

  const lastAnchorRef = useRef<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef<TierState | null>(null);
  const selRef = useRef<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const pastRef = useRef<TierState[]>([]);
  const futureRef = useRef<TierState[]>([]);
  const lastSnapRef = useRef<{ tag: string; at: number } | null>(null);

  const activeState = state ?? clientBoot?.state ?? null;
  const activeRemixable = remixable ?? clientBoot?.remixable ?? false;

  useEffect(() => {
    stateRef.current = activeState;
    selRef.current = selectedIds;
  }, [activeState, selectedIds]);

  const syncHist = useCallback(() => {
    setHistCounts({ undo: pastRef.current.length, redo: futureRef.current.length });
  }, []);

  useEffect(() => {
    if (activeState) localStorage.setItem(LS_STATE, JSON.stringify(activeState));
  }, [activeState]);

  const showToast = useCallback((msg: string, undo?: () => void) => {
    setToast({ msg, undo });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), undo ? 4200 : 2200);
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
    syncHist();
  }, [syncHist]);

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
    syncHist();
  }, [showToast, syncHist]);

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
    syncHist();
  }, [showToast, syncHist]);

  const mutate = useCallback((fn: (s: TierState) => TierState, tag = "") => {
    snap(tag);
    setState((s) => {
      const cur = s ?? stateRef.current;
      if (!cur) return s;
      return fn(cur);
    });
  }, [snap]);

  const moveItem = useCallback((id: string, to: ContainerId, beforeId?: string) => {
    snap();
    setState((s) => {
      const base = s ?? stateRef.current;
      if (!base) return s;
      const inPool = base.pool.includes(id);
      const rowIdx = base.rows.findIndex((r) => r.items.includes(id));
      if (!inPool && rowIdx < 0) return base;
      const from: ContainerId = inPool ? "pool" : `row-${rowIdx}`;
      if (from === to && !beforeId) return base;
      if (to !== "pool") {
        const ti = Number(to.slice(4));
        if (!Number.isInteger(ti) || ti < 0 || ti >= base.rows.length) return base;
      }
      const rows = [...base.rows];
      let pool = base.pool;
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
      return { ...base, rows, pool };
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

  const visiblePoolIds = useCallback((s: TierState) => {
    const q = query.trim().toLowerCase();
    const namesMap = allItems(s);
    return s.pool.filter((id) => {
      const okQ = !q || (namesMap[id]?.[0] ?? "").toLowerCase().includes(q);
      const okC = catFilter === "all" || ITEMS[id]?.cat === catFilter;
      return okQ && okC;
    });
  }, [query, catFilter]);

  const orderForShift = useCallback((id: string, s: TierState): string[] | null => {
    if (s.pool.includes(id)) return visiblePoolIds(s);
    const rowIdx = s.rows.findIndex((r) => r.items.includes(id));
    if (rowIdx >= 0) return s.rows[rowIdx].items;
    return null;
  }, [visiblePoolIds]);

  const handleSelect = useCallback((id: string, opts: SelectOpts = {}) => {
    const s = stateRef.current;
    if (!s) return;
    setSelectedIds((cur) => {
      if (opts.shift && lastAnchorRef.current) {
        const order = orderForShift(id, s) ?? orderForShift(lastAnchorRef.current, s);
        if (order) {
          const aIdx = order.indexOf(lastAnchorRef.current);
          const bIdx = order.indexOf(id);
          if (aIdx >= 0 && bIdx >= 0) {
            const [lo, hi] = aIdx < bIdx ? [aIdx, bIdx] : [bIdx, aIdx];
            const range = order.slice(lo, hi + 1);
            return opts.additive ? Array.from(new Set([...cur, ...range])) : range;
          }
        }
      }
      if (opts.additive) return cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      if (cur.length === 1 && cur[0] === id) return [];
      return [id];
    });
    if (!opts.shift) lastAnchorRef.current = id;
  }, [orderForShift]);

  const selectMany = useCallback((ids: string[]) => {
    setSelectedIds((cur) => Array.from(new Set([...cur, ...ids])));
  }, []);

  const placeSelection = useCallback((cont: ContainerId, beforeId?: string) => {
    const ids = selRef.current;
    if (!ids.length) return;
    moveItems(ids, cont, beforeId);
    setSelectedIds([]);
    showToast(`${ids.length} item${ids.length === 1 ? "" : "s"} moved`, undo);
  }, [moveItems, showToast, undo]);

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
      const labels = { ...(s.labels ?? {}) };
      delete labels[id];
      return { ...s, pool: s.pool.filter((x) => x !== id), customs, labels };
    });
    setSelectedIds((cur) => cur.filter((x) => x !== id));
    showToast("Removed from board");
  }, [mutate, showToast]);

  const renameItem = useCallback((id: string, name: string) => {
    const trimmed = name.trim().slice(0, 60);
    if (!trimmed) return;
    mutate((s) => {
      if (s.customs[id] && !ITEMS[id]) {
        return { ...s, customs: { ...s.customs, [id]: [trimmed, s.customs[id][1]] } };
      }
      const catalogName = ITEMS[id]?.name;
      const labels = { ...(s.labels ?? {}) };
      if (catalogName && trimmed === catalogName) delete labels[id];
      else labels[id] = trimmed;
      return { ...s, labels };
    }, `rename-${id}`);
  }, [mutate]);

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
        setQuery("");
        return;
      }
      if (!editing && selRef.current.length && !mod) {
        const s = stateRef.current;
        if (s) {
          if (e.key >= "1" && e.key <= "9") {
            const i = Number(e.key) - 1;
            if (i < s.rows.length) {
              e.preventDefault();
              placeSelection(`row-${i}`);
            }
            return;
          }
          if (e.key === "0") {
            e.preventDefault();
            placeSelection("pool");
            return;
          }
        }
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
  }, [undo, redo, moveItems, showToast, placeSelection]);

  const names = useMemo(() => (activeState ? allItems(activeState) : {}), [activeState]);
  const preset = PRESETS.find((p) => p.id === activeState?.p) ?? PRESETS[0];
  const sponsors = useMemo(() => sponsorAds(), []);
  const midAd = useMemo(() => midBoardAd(), []);
  const canUndo = histCounts.undo > 0;
  const canRedo = histCounts.redo > 0;

  if (!activeState) {
    return (
      <>
        <header className={siteHeader}>
          <div className={cn(layoutShell, "flex items-center gap-3 py-3")}>
            <span className={brandMark} aria-hidden="true" />
            <span className="font-mono text-[13px] font-bold tracking-[0.08em]">AI TIER MAKER.</span>
            <div className="ms-auto">
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className={cn(layoutShell, "py-section")}>
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
    const s = stateRef.current;
    if (!s || id === s.p) return;
    snap();
    setCatFilter("all");
    setState(seed(id, s.customs, s.by, s.labels));
    setSelectedIds([]);
    const next = PRESETS.find((p) => p.id === id);
    showToast(next ? `Switched to ${next.title}` : "Preset switched", undo);
  };

  const switchPreset = (id: string) => {
    applyPreset(id);
  };

  const dealUnranked = () => {
    const s = stateRef.current;
    if (!s?.pool.length) {
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

  const openShare = () => {
    const s = stateRef.current;
    if (!s) return;
    const info = shareLink(s, location.origin, location.pathname);
    history.replaceState(null, "", `?s=${encodeState(s)}`);
    setShareInfo(info);
    setShareOpen(true);
  };

  const copyShareLink = async () => {
    if (!shareInfo) return;
    try {
      await navigator.clipboard.writeText(shareInfo.url);
      showToast("Link copied");
    } catch {
      showToast("Select the link and copy manually");
    }
  };

  const nativeShare = async () => {
    if (!shareInfo || !stateRef.current) return;
    try {
      await navigator.share({ title: stateRef.current.t, text: shareInfo.text, url: shareInfo.url });
    } catch {}
  };

  const postX = () => {
    if (!shareInfo) return;
    const intent = new URL(["https:", "", "twitter.com", "intent", "tweet"].join("/"));
    intent.searchParams.set("text", shareInfo.text);
    intent.searchParams.set("url", shareInfo.url);
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
    const s = stateRef.current;
    if (!s) return;
    setBusy(true);
    try {
      if (mode === "download") {
        await exportPNG(s, names);
        showToast("PNG downloaded");
      } else {
        const ok = await copyPNG(s, names);
        showToast(ok ? "PNG copied" : "Copy not supported");
      }
    } finally {
      setBusy(false);
    }
  };

  const runConfirm = () => {
    if (!confirm) return;
    switch (confirm.kind) {
      case "reset": {
        const s = stateRef.current;
        if (!s) break;
        snap();
        setState(seed(s.p, s.customs, s.by, s.labels));
        setSelectedIds([]);
        showToast("List reset");
        break;
      }
      case "delete-row": {
        const i = confirm.rowIndex;
        if (i == null) break;
        snap();
        setState((cur) => {
          const base = cur ?? stateRef.current;
          if (!base) return cur;
          const row = base.rows[i];
          if (!row) return base;
          return { ...base, rows: base.rows.filter((_, j) => j !== i), pool: [...base.pool, ...row.items] };
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
    const row = confirm.rowIndex != null ? activeState.rows[confirm.rowIndex] : undefined;
    return { title: `Delete tier “${row?.l ?? ""}”?`, desc: `${row?.items.length ?? 0} items will move back to Unranked.`, label: "Delete tier", danger: true };
  })();

  const rankedCount = activeState.rows.reduce((a, r) => a + r.items.length, 0);
  const totalCount = rankedCount + activeState.pool.length;
  const pct = totalCount ? Math.round((rankedCount / totalCount) * 100) : 0;
  const previewNames = selectedIds.length <= NAME_PREVIEW ? selectedIds.map((id) => names[id]?.[0] ?? id) : [];

  const onHandleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    const handle = v ? (v.startsWith("@") ? v : "@" + v.replace(/^@+/, "")) : "";
    mutate((s) => ({ ...s, by: { ...s.by, handle } }), "by-handle");
  };

  return (
    <>
      <header className={siteHeader}>
        <Toolbar
          presetId={activeState.p}
          presets={PRESETS}
          onPreset={switchPreset}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onAddTier={addRow}
          onAddItem={() => setAddOpen(true)}
          onShare={openShare}
          onExport={runExport}
          onDeal={dealUnranked}
          onReset={() => setConfirm({ kind: "reset" })}
          busy={busy}
        />
      </header>

      <main id="board" className={cn(layoutShell, "flex-1 py-section")}>
        {activeRemixable && (
          <div className={selBanner}>
            <span>Viewing {activeState.by.handle || activeState.by.name || "someone"}&apos;s tier list</span>
            <Button className="ms-auto" onClick={remix}>
              Remix this
            </Button>
          </div>
        )}

        <section className="mt-2 pb-1">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-mut">{preset.desc}</p>
          <h1
            className="mt-1 text-[clamp(1.5rem,2.4vw,1.75rem)] font-bold tracking-[-0.02em] leading-[1.15] outline-none"
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
            {activeState.t}
          </h1>

          <div className="mt-control flex flex-wrap items-end gap-x-group gap-y-control">
            <div className="flex min-w-[min(100%,220px)] flex-1 items-center gap-control">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-panel2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Ranked progress">
                <span className="block h-full rounded-full bg-lime transition-[width] duration-200 ease-out" style={{ width: `${pct}%` }} />
              </div>
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-mut">
                {rankedCount}/{totalCount} ranked
              </span>
            </div>

            <div className="flex flex-wrap gap-inset [&_label]:min-w-[120px] [&_label]:max-w-[200px] [&_label]:flex-1 max-sm:[&_label]:max-w-none">
              <FieldGroup>
                <span className="sr-only">Your name</span>
                <FieldGroupInput
                  placeholder="Your name"
                  autoComplete="name"
                  value={activeState.by.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    mutate((s) => ({ ...s, by: { ...s.by, name } }), "by-name");
                  }}
                />
              </FieldGroup>
              <FieldGroup>
                <span className="sr-only">Your handle</span>
                <FieldGroupInput placeholder="@handle" autoComplete="username" value={activeState.by.handle} onChange={onHandleInput} />
              </FieldGroup>
            </div>
          </div>
        </section>

        {selectedIds.length > 0 && <SelectionBar count={selectedIds.length} names={previewNames} rows={activeState.rows} onPlace={placeSelection} onClear={() => setSelectedIds([])} />}

        <div key={activeState.p} className="board-switch mt-section">
          <Board
            state={activeState}
            names={names}
            factsOf={factsOf}
            selectedIds={selectedIds}
            poolFilter={query}
            catFilter={catFilter}
            onCatFilter={setCatFilter}
            poolHeader={
              <>
                <FieldGroup>
                  <Search size={14} strokeWidth={2} className="shrink-0 text-mut2" aria-hidden="true" />
                  <span className="sr-only">Filter unranked items</span>
                  <FieldGroupInput ref={searchRef} placeholder="Filter unranked  /" value={query} onChange={(e) => setQuery(e.target.value)} />
                  {query && (
                    <FieldClear aria-label="Clear filter" onClick={() => setQuery("")}>
                      <X size={12} strokeWidth={2} aria-hidden="true" />
                    </FieldClear>
                  )}
                </FieldGroup>
                <FieldGroup>
                  <Plus size={14} strokeWidth={2} className="shrink-0 text-mut2" aria-hidden="true" />
                  <span className="sr-only">Quick add an item</span>
                  <FieldGroupInput
                    placeholder="Quick add, Enter"
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
                </FieldGroup>
              </>
            }
            onMove={moveItem}
            onMoveMany={moveItems}
            onReorder={reorder}
            onSelect={handleSelect}
            onSelectMany={selectMany}
            onZoneClick={placeSelection}
            onSendBack={sendBack}
            onRename={renameItem}
            onRowLabel={onRowLabel}
            onRowColor={onRowColor}
            onRowDelete={deleteRow}
            onRowMove={moveRow}
            onRemove={removeFromBoard}
            midSlot={midAd ? <AdMidBlock ad={midAd} /> : undefined}
          />
        </div>

        <AdSponsors ads={sponsors} />

        <p className="mt-section font-mono text-[11px] leading-relaxed text-mut2">
          Grip to drag · click name to rename · <span className={kbd}>⇧</span> range · tier chips or <span className={kbd}>1</span>–<span className={kbd}>9</span> to place
          <span className="max-[1080px]:hidden">
            {" "}· Filter <span className={kbd}>/</span> · Clear <span className={kbd}>Esc</span> · Unrank <span className={kbd}>Del</span> · Undo <span className={kbd}>Ctrl</span>{" "}
            <span className={kbd}>Z</span>
          </span>
        </p>
      </main>

      <AddItemDialog open={addOpen} onClose={() => setAddOpen(false)} onAdd={addCustom} />
      <ConfirmDialog open={!!confirm} title={confirmCopy.title} desc={confirmCopy.desc} confirmLabel={confirmCopy.label} danger={confirmCopy.danger} onCancel={() => setConfirm(null)} onConfirm={runConfirm} />
      {shareInfo && (
        <ShareDialog
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          title={activeState.t}
          text={shareInfo.text}
          url={shareInfo.url}
          ogUrl={shareInfo.og}
          busy={busy}
          onCopyLink={copyShareLink}
          onNativeShare={nativeShare}
          onPostX={postX}
          onExport={runExport}
        />
      )}

      <div
        className={cn(
          "fixed inset-x-0 bottom-[calc(24px+env(safe-area-inset-bottom))] z-[99] mx-auto flex w-fit max-w-[92vw] translate-x-[-50%] left-1/2 items-center gap-2.5 rounded-full border border-line2 bg-panel2 px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] shadow-pop transition-[opacity,transform] duration-200",
          toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
          toast?.undo && "pointer-events-auto",
        )}
        role="status"
        aria-live="polite"
      >
        {toast && (
          <>
            <span>{toast.msg}</span>
            {toast.undo && (
              <button
                type="button"
                className="m-0 cursor-pointer rounded-full border border-lime bg-[color-mix(in_srgb,var(--color-lime)_12%,transparent)] px-2.5 py-1 font-inherit text-[10px] font-extrabold uppercase tracking-[0.06em] text-lime transition-[background-color,scale] duration-150 hover:bg-[color-mix(in_srgb,var(--color-lime)_22%,transparent)] active:scale-96"
                onClick={() => {
                  toast.undo!();
                  setToast(null);
                  if (toastTimer.current) clearTimeout(toastTimer.current);
                }}
              >
                Undo
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}
