"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { resolveImageUrl } from "@/lib/utils";
import { MEDIA_DRAG_KEY } from "@/components/editor/MediaLibraryDrawer";
import { Images, ChevronDown, ChevronUp, Plus, Trash2, Loader2, GripVertical } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const SHELF_STORAGE_KEY = "editor_asset_shelf";

interface ShelfItem {
  filepath: string;
  filename: string;
}

export function AssetShelf() {
  const { token } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<ShelfItem[]>(() => {
    try {
      const saved = localStorage.getItem(SHELF_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [collapsed, setCollapsed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);

  // Persist to localStorage whenever items change
  useEffect(() => {
    try { localStorage.setItem(SHELF_STORAGE_KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  // ── Upload from file picker ──
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !token) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${API}/media/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          setItems((prev) => {
            if (prev.some((i) => i.filepath === data.filepath)) return prev;
            return [...prev, { filepath: data.filepath, filename: data.filename }];
          });
        }
      }
    } catch (err) { console.error(err); }
    finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Accept drops from Media Library drawer ──
  const handleShelfDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes(MEDIA_DRAG_KEY)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setIsDragOver(true);
    }
  };

  const handleShelfDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const filepath = e.dataTransfer.getData(MEDIA_DRAG_KEY);
    if (!filepath) return;
    const filename = filepath.split("/").pop() || filepath;
    setItems((prev) => {
      if (prev.some((i) => i.filepath === filepath)) return prev;
      return [...prev, { filepath, filename }];
    });
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Reorder within shelf ──
  const handleItemDragStart = (e: React.DragEvent, idx: number) => {
    // Set BOTH the shelf key (for reordering) AND the media key (for dropping into gallery)
    e.dataTransfer.setData(MEDIA_DRAG_KEY, items[idx].filepath);
    e.dataTransfer.setData("application/x-shelf-idx", String(idx));
    e.dataTransfer.effectAllowed = "copyMove";
    setDraggedIdx(idx);
  };

  const handleItemDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropIdx(idx);
  };

  const handleItemDrop = (e: React.DragEvent, toIdx: number) => {
    e.stopPropagation();
    e.preventDefault();
    const fromIdx = parseInt(e.dataTransfer.getData("application/x-shelf-idx"), 10);
    if (!isNaN(fromIdx) && fromIdx !== toIdx) {
      setItems((prev) => {
        const next = [...prev];
        const [moved] = next.splice(fromIdx, 1);
        next.splice(toIdx, 0, moved);
        return next;
      });
    }
    setDraggedIdx(null);
    setDropIdx(null);
  };

  return (
    <div
      className={`fixed bottom-0 left-64 right-0 z-30 border-t-2 transition-all duration-200 shadow-2xl ${
        isDragOver
          ? "border-indigo-400 bg-indigo-950"
          : "border-zinc-700 bg-zinc-900/95 backdrop-blur-sm"
      }`}
      onDragOver={handleShelfDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleShelfDrop}
    >
      {/* ── Header bar ── */}
      <div className="flex items-center justify-between px-3 py-1.5">
        <div className="flex items-center gap-2">
          <Images className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-semibold text-zinc-300">Asset Shelf</span>
          <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
          {isDragOver && (
            <span className="text-[10px] text-indigo-300 animate-pulse font-semibold">
              ↓ Drop here to queue
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Upload button */}
          <label className="flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-md cursor-pointer text-[10px] text-zinc-300 font-medium transition-colors border border-zinc-700">
            {uploading ? (
              <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
            ) : (
              <Plus className="w-3 h-3" />
            )}
            Add
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
            title={collapsed ? "Expand shelf" : "Collapse shelf"}
          >
            {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Shelf items ── */}
      {!collapsed && (
        <div className="px-3 pb-3">
          {items.length === 0 ? (
            <div
              className={`flex items-center justify-center h-16 rounded-xl border-2 border-dashed text-xs gap-2 transition-all ${
                isDragOver
                  ? "border-indigo-400 text-indigo-300"
                  : "border-zinc-700 text-zinc-600"
              }`}
            >
              <Images className="w-4 h-4" />
              Drag images from Media Library here, or click Add
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-700">
              {items.map((item, idx) => {
                const isDragging = draggedIdx === idx;
                const isDropTarget = dropIdx === idx && draggedIdx !== idx;
                return (
                  <div
                    key={`${item.filepath}-${idx}`}
                    draggable
                    onDragStart={(e) => handleItemDragStart(e, idx)}
                    onDragEnd={() => { setDraggedIdx(null); setDropIdx(null); }}
                    onDragOver={(e) => handleItemDragOver(e, idx)}
                    onDrop={(e) => handleItemDrop(e, idx)}
                    className={`relative flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 group cursor-grab active:cursor-grabbing transition-all select-none ${
                      isDragging
                        ? "opacity-40 scale-95 border-indigo-500/50"
                        : isDropTarget
                        ? "border-indigo-400 ring-2 ring-indigo-400/40 scale-105"
                        : "border-zinc-700 hover:border-zinc-500"
                    }`}
                    title={`Drag "${item.filename}" into a Gallery section`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveImageUrl(item.filepath)}
                      alt={item.filename}
                      className="w-full h-full object-cover pointer-events-none"
                      draggable={false}
                    />

                    {/* Drag handle icon */}
                    <div className="absolute top-0.5 left-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-black/60 rounded p-0.5">
                        <GripVertical className="w-2.5 h-2.5 text-white/70" />
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); removeItem(idx); }}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600/90 hover:bg-red-500 text-white rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-bold z-10"
                      title="Remove from shelf"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>

                    {/* Drag hint overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end justify-center pb-1 opacity-0 group-hover:opacity-100">
                      <span className="text-white text-[8px] font-bold bg-black/60 px-1.5 py-0.5 rounded">
                        drag to gallery
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
