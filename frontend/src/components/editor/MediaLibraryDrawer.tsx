"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useEditorStore } from "@/store/useEditorStore";
import { resolveImageUrl } from "@/lib/utils";
import {
  X, Upload, Loader2, Trash2, ImagePlus, Search, CheckCircle2, Images, GripVertical,
} from "lucide-react";

interface MediaAsset {
  id: string;
  filename: string;
  filepath: string;
  mimetype: string;
  size: number;
  created_at: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
// Key used to pass filepath between media library drag source and gallery drop target
export const MEDIA_DRAG_KEY = "application/x-media-filepath";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function MediaLibraryDrawer({ isOpen, onClose }: Props) {
  const { token } = useAuthStore();
  const { sections, activeSectionId, updateSection } = useEditorStore();

  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [insertMsg, setInsertMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag-and-drop reorder within the library grid
  const [draggedLibIdx, setDraggedLibIdx] = useState<number | null>(null);
  const [dropLibIdx, setDropLibIdx] = useState<number | null>(null);
  // Track active asset drag so backdrop becomes passthrough (lets drop reach AssetShelf)
  const [isDraggingAsset, setIsDraggingAsset] = useState(false);

  // Active section info
  const activeSection = sections.find((s) => s.id === activeSectionId);
  const isGalleryActive = activeSection?.type === "Gallery";

  // ── Fetch all media assets ──────────────────────────────────────────────
  const fetchAssets = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/media/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAssets(data.filter((a: MediaAsset) => a.mimetype?.startsWith("image/")));
      }
    } catch (err) {
      console.error("Failed to load media", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, token]);

  // ── Upload ──────────────────────────────────────────────────────────────
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        await fetch(`${API}/media/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      }
      await fetchAssets();
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Drop files directly onto the upload zone
  const handleDropUpload = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        await fetch(`${API}/media/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      }
      await fetchAssets();
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm("Remove this asset from the library?")) return;
    try {
      await fetch(`${API}/media/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssets((prev) => prev.filter((a) => a.id !== id));
      setSelectedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  // ── Selection ───────────────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  // ── Insert selected into Gallery ────────────────────────────────────────
  const handleInsertToGallery = () => {
    if (!activeSection || activeSection.type !== "Gallery") return;
    const selectedAssets = assets.filter((a) => selectedIds.has(a.id));
    const newImages = [
      ...(activeSection.config.images || []),
      ...selectedAssets.map((a) => a.filepath),
    ];
    updateSection(activeSection.id, { ...activeSection.config, images: newImages });
    setSelectedIds(new Set());
    setInsertMsg(`Added ${selectedAssets.length} image${selectedAssets.length > 1 ? "s" : ""} to Gallery`);
    setTimeout(() => setInsertMsg(null), 3000);
  };

  const handleSingleInsert = (asset: MediaAsset) => {
    if (!activeSection || activeSection.type !== "Gallery") return;
    const newImages = [...(activeSection.config.images || []), asset.filepath];
    updateSection(activeSection.id, { ...activeSection.config, images: newImages });
    setInsertMsg("Added to Gallery");
    setTimeout(() => setInsertMsg(null), 2000);
  };

  // ── Drag from library → Gallery canvas / Asset Shelf ───────────────────
  const handleDragStart = (e: React.DragEvent, asset: MediaAsset, idx: number) => {
    e.dataTransfer.setData(MEDIA_DRAG_KEY, asset.filepath);
    e.dataTransfer.effectAllowed = "copy";
    setDraggedLibIdx(idx);
    setIsDraggingAsset(true);
  };

  const handleDragEnd = () => {
    setDraggedLibIdx(null);
    setDropLibIdx(null);
    setIsDraggingAsset(false);
  };

  // ── Reorder within library grid ─────────────────────────────────────────
  const handleLibDragOver = (e: React.DragEvent, idx: number) => {
    // Only handle intra-library reordering (check if it's a library card drag)
    if (draggedLibIdx === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropLibIdx(idx);
  };

  const handleLibDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    if (draggedLibIdx === null || draggedLibIdx === toIdx) {
      setDraggedLibIdx(null);
      setDropLibIdx(null);
      return;
    }
    setAssets((prev) => {
      const next = [...prev];
      const [moved] = next.splice(draggedLibIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
    setDraggedLibIdx(null);
    setDropLibIdx(null);
  };

  const filtered = assets.filter((a) =>
    a.filename.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop — pointer-events-none while dragging so drops reach the Asset Shelf */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-all ${
          isDraggingAsset ? "pointer-events-none" : ""
        }`}
        onClick={!isDraggingAsset ? onClose : undefined}
      />

      {/* Drawer panel */}
      <div className="fixed right-0 top-0 h-full w-80 bg-zinc-950 border-l border-zinc-800 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Images className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">Media Library</h2>
            <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
              {assets.length}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Context banner ── */}
        {isGalleryActive ? (
          <div className="px-3 py-2 bg-indigo-600/20 border-b border-indigo-600/30 flex-shrink-0">
            <p className="text-xs text-indigo-300 font-medium">
              🖼️ Gallery active — drag images onto the canvas or click to add
            </p>
          </div>
        ) : (
          <div className="px-3 py-2 bg-amber-600/10 border-b border-amber-600/20 flex-shrink-0">
            <p className="text-xs text-amber-400">
              Select a <strong>Gallery section</strong> in the canvas to insert images
            </p>
          </div>
        )}

        {/* ── Upload zone (also accepts file drops) ── */}
        <div className="px-3 py-2.5 border-b border-zinc-800 space-y-2 flex-shrink-0">
          <label
            className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
              uploading ? "border-zinc-700 opacity-60" : "border-zinc-700 hover:border-indigo-500 hover:bg-indigo-500/5"
            }`}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
            onDrop={handleDropUpload}
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin text-indigo-400" /><span className="text-xs text-zinc-400">Uploading...</span></>
            ) : (
              <><Upload className="w-4 h-4 text-zinc-400" /><span className="text-xs text-zinc-300 font-medium">Upload or drop files here</span></>
            )}
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

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* ── Batch insert bar ── */}
        {selectedIds.size > 0 && isGalleryActive && (
          <div className="px-3 py-2 bg-indigo-600/20 border-b border-indigo-600/30 flex items-center justify-between flex-shrink-0">
            <span className="text-xs text-indigo-300">{selectedIds.size} selected</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedIds(new Set())} className="text-xs text-zinc-400 hover:text-white transition-colors">Clear</button>
              <button
                onClick={handleInsertToGallery}
                className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <ImagePlus className="w-3.5 h-3.5" /> Add to Gallery
              </button>
            </div>
          </div>
        )}

        {/* ── Success flash ── */}
        {insertMsg && (
          <div className="px-3 py-2 bg-emerald-600/20 border-b border-emerald-600/30 flex items-center gap-2 flex-shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-300 font-medium">{insertMsg}</span>
          </div>
        )}

        {/* ── Asset grid ── */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <p className="text-xs text-zinc-500">Loading library...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
              <Images className="w-8 h-8 text-zinc-700" />
              <p className="text-xs text-zinc-500">
                {search ? "No images match your search" : "No images yet — upload some to get started!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filtered.map((asset, idx) => {
                const isSelected = selectedIds.has(asset.id);
                const isDragging = draggedLibIdx === idx;
                const isDropTarget = dropLibIdx === idx && draggedLibIdx !== idx;

                return (
                  <div
                    key={asset.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, asset, idx)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleLibDragOver(e, idx)}
                    onDrop={(e) => handleLibDrop(e, idx)}
                    className={`relative group rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all select-none ${
                      isDragging
                        ? "opacity-40 scale-95 border-indigo-500/50"
                        : isDropTarget
                        ? "border-indigo-400 ring-2 ring-indigo-400/40 scale-105"
                        : isSelected
                        ? "border-indigo-500 ring-2 ring-indigo-500/30"
                        : "border-zinc-800 hover:border-zinc-600"
                    }`}
                    onClick={() => isGalleryActive ? toggleSelect(asset.id) : undefined}
                  >
                    {/* Drag handle hint */}
                    <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-black/60 rounded p-0.5">
                        <GripVertical className="w-2.5 h-2.5 text-white/70" />
                      </div>
                    </div>

                    {/* Thumbnail */}
                    <div className="aspect-square bg-zinc-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveImageUrl(asset.filepath)}
                        alt={asset.filename}
                        className="w-full h-full object-cover pointer-events-none"
                        draggable={false}
                      />
                    </div>

                    {/* Selection checkmark */}
                    {isSelected && (
                      <div className="absolute top-1 left-1 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg z-10">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-150 flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                      {isGalleryActive && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSingleInsert(asset); }}
                          className="flex items-center gap-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-md transition-colors shadow-lg"
                        >
                          <ImagePlus className="w-3 h-3" /> Add
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }}
                        className="flex items-center gap-1 px-2 py-1 bg-red-700/90 hover:bg-red-600 text-white text-[10px] font-bold rounded-md transition-colors shadow-lg"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>

                    {/* Drop-here indicator */}
                    {isDropTarget && (
                      <div className="absolute inset-0 flex items-center justify-center bg-indigo-600/20 pointer-events-none">
                        <div className="w-0.5 h-10 bg-indigo-400 rounded-full animate-pulse" />
                      </div>
                    )}

                    {/* Filename bar */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                      <p className="text-[9px] text-white/80 truncate font-medium">{asset.filename}</p>
                      <p className="text-[8px] text-white/50">{formatBytes(asset.size)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer hint ── */}
        <div className="px-3 py-2 border-t border-zinc-800 flex-shrink-0">
          <p className="text-[10px] text-zinc-500 text-center">
            {isGalleryActive
              ? "Drag onto canvas · click to select · hover for quick-add"
              : "Drag to reorder · drop files here to upload"}
          </p>
        </div>
      </div>
    </>
  );
}
