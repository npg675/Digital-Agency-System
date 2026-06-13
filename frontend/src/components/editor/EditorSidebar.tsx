"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useEditorStore, Section } from "@/store/useEditorStore";
import { GripVertical, Trash2, Plus, ArrowUp, ArrowDown, Copy, ChevronDown, ChevronUp, Eye, EyeOff, Upload, Loader2, X } from "lucide-react";
import { AddSectionModal } from "./AddSectionModal";
import { convertGoogleDriveUrl, resolveImageUrl } from "@/lib/utils";

// ─── Property Editors ──────────────────────────────────────────────────────

function VisibilityToggle({ hidden, onToggle }: { hidden?: boolean; onToggle?: () => void }) {
  if (!onToggle) return null;
  return (
    <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="text-zinc-500 hover:text-white p-1" title={hidden ? "Show" : "Hide"}>
      {hidden ? <EyeOff className="w-3.5 h-3.5 text-zinc-600" /> : <Eye className="w-3.5 h-3.5 text-zinc-400" />}
    </button>
  );
}

function TextField({ label, value, onChange, hidden, onToggleHide }: { label: string; value: string; onChange: (v: string) => void; hidden?: boolean; onToggleHide?: () => void }) {
  return (
    <div className={`space-y-1 ${hidden ? 'opacity-50 grayscale' : ''}`}>
      <div className="flex justify-between items-center">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</label>
        <VisibilityToggle hidden={hidden} onToggle={onToggleHide} />
      </div>
      <input
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, hidden, onToggleHide }: { label: string; value: string; onChange: (v: string) => void; hidden?: boolean; onToggleHide?: () => void }) {
  return (
    <div className={`space-y-1 ${hidden ? 'opacity-50 grayscale' : ''}`}>
      <div className="flex justify-between items-center">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</label>
        <VisibilityToggle hidden={hidden} onToggle={onToggleHide} />
      </div>
      <textarea
        rows={4}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ColorField({ label, value, onChange, hidden, onToggleHide }: { label: string; value: string; onChange: (v: string) => void; hidden?: boolean; onToggleHide?: () => void }) {
  return (
    <div className={`space-y-1 ${hidden ? 'opacity-50 grayscale' : ''}`}>
      <div className="flex justify-between items-center">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</label>
        <VisibilityToggle hidden={hidden} onToggle={onToggleHide} />
      </div>
      <div className="flex gap-2 items-center">
        <input type="color" className="w-10 h-10 rounded cursor-pointer border border-zinc-700 bg-zinc-800" value={value || "#6366f1"} onChange={(e) => onChange(e.target.value)} />
        <input className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" value={value || ""} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

function SliderField({ label, value, onChange, min = 0, max = 1, step = 0.05, hidden, onToggleHide }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; hidden?: boolean; onToggleHide?: () => void;
}) {
  return (
    <div className={`space-y-1 ${hidden ? 'opacity-50 grayscale' : ''}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</label>
          <span className="text-xs text-zinc-300">{value}</span>
        </div>
        <VisibilityToggle hidden={hidden} onToggle={onToggleHide} />
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-indigo-500" />
    </div>
  );
}

function SelectField({ label, value, onChange, options, hidden, onToggleHide }: { label: string; value: string; onChange: (v: string) => void; options: {value: string, label: string}[]; hidden?: boolean; onToggleHide?: () => void }) {
  return (
    <div className={`space-y-1 ${hidden ? 'opacity-50 grayscale' : ''}`}>
      <div className="flex justify-between items-center">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</label>
        <VisibilityToggle hidden={hidden} onToggle={onToggleHide} />
      </div>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function PageSelectField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const { token } = useAuthStore();
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchPages() {
      if (!token) return;
      setLoading(true);
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        const res = await fetch(`${API}/pages/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPages(data);
        }
      } catch (err) {
        console.error("Failed to load pages for selector", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPages();
  }, [token]);

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</label>
      <div className="space-y-2">
        <select
          value={pages.some(p => `/landing/${p.slug}` === value) ? value : "custom"}
          onChange={(e) => {
            if (e.target.value !== "custom") {
              onChange(e.target.value);
            }
          }}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="custom">Custom URL</option>
          {pages.map((p) => (
            <option key={p.id} value={`/landing/${p.slug}`}>
              {p.name} (Internal)
            </option>
          ))}
        </select>
        
        {(!pages.some(p => `/landing/${p.slug}` === value)) && (
          <input
            placeholder="https://..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
      </div>
    </div>
  );
}

function ToggleField({ label, value, onChange, hidden, onToggleHide }: { label: string; value: boolean; onChange: (v: boolean) => void; hidden?: boolean; onToggleHide?: () => void }) {
  return (
    <div className={`flex justify-between items-center py-1 ${hidden ? 'opacity-50 grayscale' : ''}`}>
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</label>
        <VisibilityToggle hidden={hidden} onToggle={onToggleHide} />
      </div>
      <button onClick={() => onChange(!value)} className={`w-10 h-5 rounded-full transition-colors relative ${value ? 'bg-indigo-600' : 'bg-zinc-700'}`}>
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function ImageField({ label, value, onChange, hidden, onToggleHide }: { label: string; value: string; onChange: (v: string) => void; hidden?: boolean; onToggleHide?: () => void }) {
  const { token } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTextChange = (val: string) => {
    onChange(convertGoogleDriveUrl(val));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${API}/media/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();
      if (data && data.filepath) {
        onChange(data.filepath);
      }
    } catch (err: any) {
      console.error("Failed to upload image:", err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const resolvedUrl = resolveImageUrl(value);

  return (
    <div className={`space-y-1.5 ${hidden ? 'opacity-50 grayscale' : ''}`}>
      <div className="flex justify-between items-center">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</label>
        <VisibilityToggle hidden={hidden} onToggle={onToggleHide} />
      </div>

      {value && (
        <div className="relative group w-full h-24 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resolvedUrl} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              onClick={() => onChange("")}
              className="p-1.5 bg-red-600/80 hover:bg-red-600 rounded-full text-white transition-colors"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <input
          className="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Paste URL or use upload button"
          value={value || ""}
          onChange={(e) => handleTextChange(e.target.value)}
        />
        
        <label className={`flex items-center justify-center p-2 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 cursor-pointer text-zinc-300 transition-colors flex-shrink-0 w-10 h-9 relative`}>
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          ) : (
            <Upload className="w-4 h-4 text-zinc-400" />
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>
      
      {error && (
        <p className="text-[10px] text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}

function CompactImageInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const { token } = useAuthStore();
  const [uploading, setUploading] = useState(false);

  const handleTextChange = (val: string) => {
    onChange(convertGoogleDriveUrl(val));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${API}/media/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.filepath) {
          onChange(data.filepath);
        }
      }
    } catch (err) {
      console.error("Failed to upload image:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex-1 flex gap-1.5 items-center min-w-0">
      <input
        value={value || ""}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder={placeholder || "Image URL"}
        className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none min-w-0"
      />
      <label className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white cursor-pointer flex-shrink-0">
        {uploading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
        ) : (
          <Upload className="w-3.5 h-3.5" />
        )}
        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
      </label>
    </div>
  );
}

// ─── Section-specific property panels ──────────────────────────────────────

function HeroProperties({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const set = (key: string, val: any) => onChange({ ...config, [key]: val });
  const toggle = (key: string) => set(key, !config[key]);
  return (
    <div className="space-y-4">
      <TextField label="Headline" value={config.title} onChange={(v) => set("title", v)} hidden={config.hideTitle} onToggleHide={() => toggle("hideTitle")} />
      <TextAreaField label="Subtitle" value={config.subtitle} onChange={(v) => set("subtitle", v)} hidden={config.hideSubtitle} onToggleHide={() => toggle("hideSubtitle")} />
      <TextField label="CTA Button Text" value={config.ctaText} onChange={(v) => set("ctaText", v)} hidden={config.hideButton} onToggleHide={() => toggle("hideButton")} />
      <TextField label="CTA Link (URL or #id)" value={config.ctaLink} onChange={(v) => set("ctaLink", v)} hidden={config.hideButton} />
      <ImageField label="Background Image" value={config.backgroundImage} onChange={(v) => set("backgroundImage", v)} hidden={config.hideBackground} onToggleHide={() => toggle("hideBackground")} />
      <SelectField
        label="Background Position"
        value={config.backgroundPosition || "center"}
        onChange={(v) => set("backgroundPosition", v)}
        options={[
          { value: "center", label: "Center" },
          { value: "top", label: "Top" },
          { value: "bottom", label: "Bottom" },
          { value: "left", label: "Left" },
          { value: "right", label: "Right" }
        ]}
        hidden={config.hideBackground}
      />
      <SliderField label="Background Zoom" value={config.backgroundZoom ?? 1} onChange={(v) => set("backgroundZoom", v)} min={0.5} max={2} step={0.05} hidden={config.hideBackground} />
      <SliderField label="Overlay Opacity" value={config.overlayOpacity ?? 0.6} onChange={(v) => set("overlayOpacity", v)} hidden={config.hideBackground} />
      <ColorField label="Button Color" value={config.buttonColor} onChange={(v) => set("buttonColor", v)} hidden={config.hideButton} />
    </div>
  );
}

function FeaturesProperties({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const set = (key: string, val: any) => onChange({ ...config, [key]: val });
  const toggle = (key: string) => set(key, !config[key]);
  const features: any[] = config.features || [];
  const updateFeature = (i: number, key: string, val: string) => {
    const updated = features.map((f, idx) => idx === i ? { ...f, [key]: val } : f);
    set("features", updated);
  };
  const addFeature = () => set("features", [...features, { icon: "⭐", title: "New Feature", description: "Describe this feature" }]);
  const removeFeature = (i: number) => set("features", features.filter((_, idx) => idx !== i));
  
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const handleDrop = (targetIdx: number) => {
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    const newFeatures = [...features];
    const [moved] = newFeatures.splice(draggedIdx, 1);
    newFeatures.splice(targetIdx, 0, moved);
    set("features", newFeatures);
    setDraggedIdx(null);
  };

  return (
    <div className="space-y-4">
      <TextField label="Section Title" value={config.title} onChange={(v) => set("title", v)} hidden={config.hideTitle} onToggleHide={() => toggle("hideTitle")} />
      <TextField label="Section Subtitle" value={config.subtitle} onChange={(v) => set("subtitle", v)} hidden={config.hideSubtitle} onToggleHide={() => toggle("hideSubtitle")} />
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Features ({features.length})</label>
          <button onClick={addFeature} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded-md transition-colors">+ Add</button>
        </div>
        {features.map((f, i) => (
          <div 
            key={i} 
            draggable 
            onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; setDraggedIdx(i); }}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
            onDrop={() => handleDrop(i)}
            className={`bg-zinc-800 border rounded-lg p-3 space-y-2 cursor-grab active:cursor-grabbing ${draggedIdx === i ? 'opacity-50 border-indigo-500' : 'border-zinc-700'}`}
          >
            <div className="flex gap-2">
              <GripVertical className="w-4 h-4 text-zinc-500 self-center" />
              <input value={f.icon || ""} onChange={(e) => updateFeature(i, "icon", e.target.value)} placeholder="🚀" className="w-12 bg-zinc-700 rounded px-2 py-1 text-sm text-white text-center focus:outline-none" />
              <input value={f.title || ""} onChange={(e) => updateFeature(i, "title", e.target.value)} placeholder="Title" className="flex-1 bg-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none" />
              <button onClick={() => removeFeature(i)} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="w-3 h-3" /></button>
            </div>
            <textarea rows={2} value={f.description || ""} onChange={(e) => updateFeature(i, "description", e.target.value)} placeholder="Description" className="w-full bg-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none resize-none ml-6" style={{width: 'calc(100% - 1.5rem)'}} />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsProperties({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const set = (key: string, val: any) => onChange({ ...config, [key]: val });
  const toggle = (key: string) => set(key, !config[key]);
  const stats: any[] = config.stats || [];
  const updateStat = (i: number, key: string, val: string) => set("stats", stats.map((s, idx) => idx === i ? { ...s, [key]: val } : s));
  const addStat = () => set("stats", [...stats, { value: "100+", label: "New Metric" }]);
  const removeStat = (i: number) => set("stats", stats.filter((_, idx) => idx !== i));

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const handleDrop = (targetIdx: number) => {
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    const newStats = [...stats];
    const [moved] = newStats.splice(draggedIdx, 1);
    newStats.splice(targetIdx, 0, moved);
    set("stats", newStats);
    setDraggedIdx(null);
  };

  return (
    <div className="space-y-4">
      <TextField label="Section Title" value={config.title} onChange={(v) => set("title", v)} hidden={config.hideTitle} onToggleHide={() => toggle("hideTitle")} />
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Stats</label>
          <button onClick={addStat} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded-md">+ Add</button>
        </div>
        {stats.map((s, i) => (
          <div 
            key={i} 
            draggable 
            onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; setDraggedIdx(i); }}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={() => handleDrop(i)}
            className={`flex gap-2 items-center cursor-grab active:cursor-grabbing p-1 rounded ${draggedIdx === i ? 'bg-zinc-800/50' : 'hover:bg-zinc-800'}`}
          >
            <GripVertical className="w-4 h-4 text-zinc-500 flex-shrink-0" />
            <input value={s.value || ""} onChange={(e) => updateStat(i, "value", e.target.value)} placeholder="100+" className="w-24 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none font-bold" />
            <input value={s.label || ""} onChange={(e) => updateStat(i, "label", e.target.value)} placeholder="Label" className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none" />
            <button onClick={() => removeStat(i)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AboutProperties({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const set = (key: string, val: any) => onChange({ ...config, [key]: val });
  const toggle = (key: string) => set(key, !config[key]);
  return (
    <div className="space-y-4">
      <TextField label="Title" value={config.title} onChange={(v) => set("title", v)} hidden={config.hideTitle} onToggleHide={() => toggle("hideTitle")} />
      <TextAreaField label="Description" value={config.description} onChange={(v) => set("description", v)} hidden={config.hideDescription} onToggleHide={() => toggle("hideDescription")} />
      <ImageField label="Section Image" value={config.image} onChange={(v) => set("image", v)} hidden={config.hideImage} onToggleHide={() => toggle("hideImage")} />
      <SelectField label="Image Position" value={config.imagePosition || "right"} onChange={(v) => set("imagePosition", v)} options={[{value: "left", label: "Left"}, {value: "right", label: "Right"}]} hidden={config.hideImage} />
    </div>
  );
}

function GalleryProperties({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const set = (key: string, val: any) => onChange({ ...config, [key]: val });
  const toggle = (key: string) => set(key, !config[key]);
  const images: string[] = config.images || [];
  const updateImage = (i: number, val: string) => set("images", images.map((img, idx) => idx === i ? val : img));
  const addImage = () => set("images", [...images, "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80"]);
  const removeImage = (i: number) => set("images", images.filter((_, idx) => idx !== i));
  
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const handleDrop = (targetIdx: number) => {
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    const newImages = [...images];
    const [moved] = newImages.splice(draggedIdx, 1);
    newImages.splice(targetIdx, 0, moved);
    set("images", newImages);
    setDraggedIdx(null);
  };

  return (
    <div className="space-y-4">
      <TextField label="Section Title" value={config.title} onChange={(v) => set("title", v)} hidden={config.hideTitle} onToggleHide={() => toggle("hideTitle")} />
      <TextField label="Section Subtitle" value={config.subtitle} onChange={(v) => set("subtitle", v)} hidden={config.hideSubtitle} onToggleHide={() => toggle("hideSubtitle")} />
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Images ({images.length})</label>
          <button onClick={addImage} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded-md">+ Add</button>
        </div>
        {images.map((img, i) => (
          <div 
            key={i} 
            draggable 
            onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; setDraggedIdx(i); }}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={() => handleDrop(i)}
            className={`flex gap-2 items-center cursor-grab active:cursor-grabbing p-1 rounded ${draggedIdx === i ? 'bg-zinc-800/50' : 'hover:bg-zinc-800'}`}
          >
            <GripVertical className="w-4 h-4 text-zinc-500 flex-shrink-0" />
            <CompactImageInput value={img} onChange={(v) => updateImage(i, v)} placeholder="Image URL" />
            <button onClick={() => removeImage(i)} className="text-red-400 hover:text-red-300 flex-shrink-0"><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TestimonialsProperties({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const set = (key: string, val: any) => onChange({ ...config, [key]: val });
  const toggle = (key: string) => set(key, !config[key]);
  const testimonials: any[] = config.testimonials || [];
  const updateT = (i: number, key: string, val: string) => set("testimonials", testimonials.map((t, idx) => idx === i ? { ...t, [key]: val } : t));
  const addT = () => set("testimonials", [...testimonials, { name: "Client Name", role: "CEO, Company", content: "This service was amazing!", avatar: "https://i.pravatar.cc/150?img=1" }]);
  const removeT = (i: number) => set("testimonials", testimonials.filter((_, idx) => idx !== i));

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const handleDrop = (targetIdx: number) => {
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    const newT = [...testimonials];
    const [moved] = newT.splice(draggedIdx, 1);
    newT.splice(targetIdx, 0, moved);
    set("testimonials", newT);
    setDraggedIdx(null);
  };

  return (
    <div className="space-y-4">
      <TextField label="Section Title" value={config.title} onChange={(v) => set("title", v)} hidden={config.hideTitle} onToggleHide={() => toggle("hideTitle")} />
      <TextField label="Section Subtitle" value={config.subtitle} onChange={(v) => set("subtitle", v)} hidden={config.hideSubtitle} onToggleHide={() => toggle("hideSubtitle")} />
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Testimonials</label>
          <button onClick={addT} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded-md">+ Add</button>
        </div>
        {testimonials.map((t, i) => (
          <div 
            key={i} 
            draggable 
            onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; setDraggedIdx(i); }}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={() => handleDrop(i)}
            className={`bg-zinc-800 border rounded-lg p-3 space-y-2 cursor-grab active:cursor-grabbing ${draggedIdx === i ? 'opacity-50 border-indigo-500' : 'border-zinc-700'}`}
          >
            <div className="flex gap-2 items-center justify-between">
              <GripVertical className="w-4 h-4 text-zinc-500 flex-shrink-0" />
              <input value={t.name || ""} onChange={(e) => updateT(i, "name", e.target.value)} placeholder="Name" className="flex-1 bg-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none" />
              <button onClick={() => removeT(i)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>
            </div>
            <div className="pl-6 space-y-2">
              <input value={t.role || ""} onChange={(e) => updateT(i, "role", e.target.value)} placeholder="Role, Company" className="w-full bg-zinc-700 rounded px-2 py-1 text-sm text-zinc-300 focus:outline-none" />
              <textarea rows={2} value={t.content || ""} onChange={(e) => updateT(i, "content", e.target.value)} placeholder="Testimonial text" className="w-full bg-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none resize-none" />
              <CompactImageInput value={t.avatar || ""} onChange={(v) => updateT(i, "avatar", v)} placeholder="Avatar URL" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactProperties({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const set = (key: string, val: any) => onChange({ ...config, [key]: val });
  const toggle = (key: string) => set(key, !config[key]);
  const fields: string[] = config.fields || [];
  const updateField = (i: number, val: string) => set("fields", fields.map((f, idx) => idx === i ? val : f));
  const addField = () => set("fields", [...fields, "New Field"]);
  const removeField = (i: number) => set("fields", fields.filter((_, idx) => idx !== i));
  
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const handleDrop = (targetIdx: number) => {
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    const newFields = [...fields];
    const [moved] = newFields.splice(draggedIdx, 1);
    newFields.splice(targetIdx, 0, moved);
    set("fields", newFields);
    setDraggedIdx(null);
  };

  return (
    <div className="space-y-4">
      <TextField label="Section Title" value={config.title} onChange={(v) => set("title", v)} hidden={config.hideTitle} onToggleHide={() => toggle("hideTitle")} />
      <TextField label="Section Subtitle" value={config.subtitle} onChange={(v) => set("subtitle", v)} hidden={config.hideSubtitle} onToggleHide={() => toggle("hideSubtitle")} />
      <TextField label="Button Text" value={config.buttonText} onChange={(v) => set("buttonText", v)} hidden={config.hideButton} onToggleHide={() => toggle("hideButton")} />
      <ColorField label="Button Color" value={config.backgroundColor} onChange={(v) => set("backgroundColor", v)} hidden={config.hideButton} />
      <PageSelectField label="Success Redirect URL (Optional)" value={config.redirectUrl} onChange={(v) => set("redirectUrl", v)} />
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Form Fields</label>
          <button onClick={addField} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded-md">+ Add</button>
        </div>
        {fields.map((f, i) => (
          <div 
            key={i} 
            draggable 
            onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; setDraggedIdx(i); }}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={() => handleDrop(i)}
            className={`flex gap-2 items-center cursor-grab active:cursor-grabbing p-1 rounded ${draggedIdx === i ? 'bg-zinc-800/50' : 'hover:bg-zinc-800'}`}
          >
            <GripVertical className="w-4 h-4 text-zinc-500 flex-shrink-0" />
            <input value={f} onChange={(e) => updateField(i, e.target.value)} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none" />
            <button onClick={() => removeField(i)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function VideoProperties({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const set = (key: string, val: any) => onChange({ ...config, [key]: val });
  const toggle = (key: string) => set(key, !config[key]);
  return (
    <div className="space-y-4">
      <TextField label="Section Title" value={config.title} onChange={(v) => set("title", v)} hidden={config.hideTitle} onToggleHide={() => toggle("hideTitle")} />
      <TextField label="Section Subtitle" value={config.subtitle} onChange={(v) => set("subtitle", v)} hidden={config.hideSubtitle} onToggleHide={() => toggle("hideSubtitle")} />
      <SelectField label="Video Layout Mode" value={config.mode || "embedded"} onChange={(v) => set("mode", v)} options={[{value: "embedded", label: "Embedded Player"}, {value: "background", label: "Full Background"}]} />
      <TextField label="Video URL (YouTube or MP4)" value={config.videoUrl} onChange={(v) => set("videoUrl", v)} />
      <ToggleField label="Autoplay Video" value={config.autoplay ?? false} onChange={(v) => set("autoplay", v)} />
      <ToggleField label="Mute Video" value={config.muted ?? false} onChange={(v) => set("muted", v)} />
      <ToggleField label="Loop Video" value={config.loop ?? false} onChange={(v) => set("loop", v)} />
    </div>
  );
}

function SocialsProperties({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const set = (key: string, val: any) => onChange({ ...config, [key]: val });
  const toggle = (key: string) => set(key, !config[key]);
  return (
    <div className="space-y-4">
      <TextField label="Section Title" value={config.title} onChange={(v) => set("title", v)} hidden={config.hideTitle} onToggleHide={() => toggle("hideTitle")} />
      <TextField label="Facebook URL" value={config.facebook} onChange={(v) => set("facebook", v)} hidden={config.hideFacebook} onToggleHide={() => toggle("hideFacebook")} />
      <TextField label="Twitter / X URL" value={config.twitter} onChange={(v) => set("twitter", v)} hidden={config.hideTwitter} onToggleHide={() => toggle("hideTwitter")} />
      <TextField label="Instagram URL" value={config.instagram} onChange={(v) => set("instagram", v)} hidden={config.hideInstagram} onToggleHide={() => toggle("hideInstagram")} />
      <TextField label="LinkedIn URL" value={config.linkedin} onChange={(v) => set("linkedin", v)} hidden={config.hideLinkedin} onToggleHide={() => toggle("hideLinkedin")} />
      <TextField label="YouTube URL" value={config.youtube} onChange={(v) => set("youtube", v)} hidden={config.hideYoutube} onToggleHide={() => toggle("hideYoutube")} />
      <TextField label="TikTok URL" value={config.tiktok} onChange={(v) => set("tiktok", v)} hidden={config.hideTiktok} onToggleHide={() => toggle("hideTiktok")} />
    </div>
  );
}

function CTAProperties({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const set = (key: string, val: any) => onChange({ ...config, [key]: val });
  const toggle = (key: string) => set(key, !config[key]);
  return (
    <div className="space-y-4">
      <TextField label="Headline" value={config.title} onChange={(v) => set("title", v)} hidden={config.hideTitle} onToggleHide={() => toggle("hideTitle")} />
      <TextAreaField label="Subtitle" value={config.subtitle} onChange={(v) => set("subtitle", v)} hidden={config.hideSubtitle} onToggleHide={() => toggle("hideSubtitle")} />
      <TextField label="Button Text" value={config.ctaText} onChange={(v) => set("ctaText", v)} hidden={config.hideButton} onToggleHide={() => toggle("hideButton")} />
      <TextField label="Button Link (URL or #id)" value={config.ctaLink} onChange={(v) => set("ctaLink", v)} hidden={config.hideButton} />
      <ColorField label="Button Color" value={config.buttonColor} onChange={(v) => set("buttonColor", v)} hidden={config.hideButton} />
      <ColorField label="Background Color" value={config.backgroundColor} onChange={(v) => set("backgroundColor", v)} />
    </div>
  );
}

function FAQProperties({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const set = (key: string, val: any) => onChange({ ...config, [key]: val });
  const toggle = (key: string) => set(key, !config[key]);
  const faqs: any[] = config.faqs || [];
  
  const updateFAQ = (i: number, key: string, val: string) => set("faqs", faqs.map((f, idx) => idx === i ? { ...f, [key]: val } : f));
  const addFAQ = () => set("faqs", [...faqs, { question: "New Question", answer: "New Answer" }]);
  const removeFAQ = (i: number) => set("faqs", faqs.filter((_, idx) => idx !== i));

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const handleDrop = (targetIdx: number) => {
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    const newFaqs = [...faqs];
    const [moved] = newFaqs.splice(draggedIdx, 1);
    newFaqs.splice(targetIdx, 0, moved);
    set("faqs", newFaqs);
    setDraggedIdx(null);
  };

  return (
    <div className="space-y-4">
      <TextField label="Section Title" value={config.title} onChange={(v) => set("title", v)} hidden={config.hideTitle} onToggleHide={() => toggle("hideTitle")} />
      <TextField label="Section Subtitle" value={config.subtitle} onChange={(v) => set("subtitle", v)} hidden={config.hideSubtitle} onToggleHide={() => toggle("hideSubtitle")} />
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Questions ({faqs.length})</label>
          <button onClick={addFAQ} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded-md transition-colors">+ Add Q&A</button>
        </div>
        
        {faqs.map((f, i) => (
          <div 
            key={i} 
            draggable 
            onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; setDraggedIdx(i); }}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
            onDrop={() => handleDrop(i)}
            className={`bg-zinc-800 border rounded-lg p-3 space-y-2 cursor-grab active:cursor-grabbing ${draggedIdx === i ? 'opacity-50 border-indigo-500' : 'border-zinc-700'}`}
          >
            <div className="flex gap-2 items-start justify-between">
              <GripVertical className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-1" />
              <div className="flex-1 space-y-2">
                <input value={f.question || ""} onChange={(e) => updateFAQ(i, "question", e.target.value)} placeholder="Question" className="w-full bg-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none font-medium" />
                <textarea rows={2} value={f.answer || ""} onChange={(e) => updateFAQ(i, "answer", e.target.value)} placeholder="Answer" className="w-full bg-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none resize-y" />
              </div>
              <button onClick={() => removeFAQ(i)} className="text-red-400 hover:text-red-300 mt-1"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingProperties({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const set = (key: string, val: any) => onChange({ ...config, [key]: val });
  const toggle = (key: string) => set(key, !config[key]);
  const tiers: any[] = config.tiers || [];
  
  const updateTier = (i: number, key: string, val: any) => set("tiers", tiers.map((t, idx) => idx === i ? { ...t, [key]: val } : t));
  const addTier = () => set("tiers", [...tiers, { name: "New Tier", price: "$0", period: "/mo", description: "Description", features: ["Feature 1"], buttonText: "Buy Now", highlight: false }]);
  const removeTier = (i: number) => set("tiers", tiers.filter((_, idx) => idx !== i));

  const updateTierFeature = (tierIdx: number, featureIdx: number, val: string) => {
    const newTiers = [...tiers];
    newTiers[tierIdx].features[featureIdx] = val;
    set("tiers", newTiers);
  };
  const addTierFeature = (tierIdx: number) => {
    const newTiers = [...tiers];
    newTiers[tierIdx].features.push("New Feature");
    set("tiers", newTiers);
  };
  const removeTierFeature = (tierIdx: number, featureIdx: number) => {
    const newTiers = [...tiers];
    newTiers[tierIdx].features = newTiers[tierIdx].features.filter((_: any, idx: number) => idx !== featureIdx);
    set("tiers", newTiers);
  };

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const handleDrop = (targetIdx: number) => {
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    const newTiers = [...tiers];
    const [moved] = newTiers.splice(draggedIdx, 1);
    newTiers.splice(targetIdx, 0, moved);
    set("tiers", newTiers);
    setDraggedIdx(null);
  };

  return (
    <div className="space-y-4">
      <TextField label="Section Title" value={config.title} onChange={(v) => set("title", v)} hidden={config.hideTitle} onToggleHide={() => toggle("hideTitle")} />
      <TextField label="Section Subtitle" value={config.subtitle} onChange={(v) => set("subtitle", v)} hidden={config.hideSubtitle} onToggleHide={() => toggle("hideSubtitle")} />
      <ColorField label="Button Color" value={config.buttonColor} onChange={(v) => set("buttonColor", v)} />
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Pricing Tiers ({tiers.length})</label>
          <button onClick={addTier} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded-md transition-colors">+ Add Tier</button>
        </div>
        
        {tiers.map((t, i) => (
          <div 
            key={i} 
            draggable 
            onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; setDraggedIdx(i); }}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
            onDrop={() => handleDrop(i)}
            className={`bg-zinc-800 border rounded-lg p-3 space-y-3 cursor-grab active:cursor-grabbing ${draggedIdx === i ? 'opacity-50 border-indigo-500' : 'border-zinc-700'}`}
          >
            <div className="flex gap-2 items-center justify-between">
              <GripVertical className="w-4 h-4 text-zinc-500 flex-shrink-0" />
              <input value={t.name || ""} onChange={(e) => updateTier(i, "name", e.target.value)} placeholder="Tier Name" className="flex-1 bg-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none font-bold" />
              <button onClick={() => removeTier(i)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>
            </div>
            <div className="pl-6 space-y-2">
              <div className="flex gap-2">
                <input value={t.price || ""} onChange={(e) => updateTier(i, "price", e.target.value)} placeholder="Price (e.g. $29)" className="w-1/2 bg-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none" />
                <input value={t.period || ""} onChange={(e) => updateTier(i, "period", e.target.value)} placeholder="Period (e.g. /mo)" className="w-1/2 bg-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none" />
              </div>
              <input value={t.description || ""} onChange={(e) => updateTier(i, "description", e.target.value)} placeholder="Short description" className="w-full bg-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none" />
              <input value={t.buttonText || ""} onChange={(e) => updateTier(i, "buttonText", e.target.value)} placeholder="Button Text" className="w-full bg-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none" />
              
              <div className="flex items-center gap-2 pt-1 pb-1">
                <input type="checkbox" id={`highlight-${i}`} checked={t.highlight} onChange={(e) => updateTier(i, "highlight", e.target.checked)} className="rounded text-indigo-500 focus:ring-indigo-500 bg-zinc-700 border-zinc-600" />
                <label htmlFor={`highlight-${i}`} className="text-xs text-zinc-300 cursor-pointer">Highlight this tier (e.g. "Popular")</label>
              </div>

              <div className="pt-2 border-t border-zinc-700/50">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Features</span>
                  <button onClick={() => addTierFeature(i)} className="text-[10px] text-indigo-400 hover:text-indigo-300">+ Add</button>
                </div>
                {t.features.map((f: string, fIdx: number) => (
                  <div key={fIdx} className="flex gap-1 items-center mb-1">
                    <input value={f} onChange={(e) => updateTierFeature(i, fIdx, e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none" />
                    <button onClick={() => removeTierFeature(i, fIdx)} className="text-zinc-500 hover:text-red-400"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PropertiesPanel({ section }: { section: Section }) {
  const { updateSection } = useEditorStore();
  const onChange = (config: any) => updateSection(section.id, config);
  switch (section.type) {
    case "Hero": return <HeroProperties config={section.config} onChange={onChange} />;
    case "Features": return <FeaturesProperties config={section.config} onChange={onChange} />;
    case "Stats": return <StatsProperties config={section.config} onChange={onChange} />;
    case "About": return <AboutProperties config={section.config} onChange={onChange} />;
    case "Gallery": return <GalleryProperties config={section.config} onChange={onChange} />;
    case "Testimonials": return <TestimonialsProperties config={section.config} onChange={onChange} />;
    case "Contact": return <ContactProperties config={section.config} onChange={onChange} />;
    case "Video": return <VideoProperties config={section.config} onChange={onChange} />;
    case "Socials": return <SocialsProperties config={section.config} onChange={onChange} />;
    case "Pricing": return <PricingProperties config={section.config} onChange={onChange} />;
    case "FAQ": return <FAQProperties config={section.config} onChange={onChange} />;
    case "CTA": return <CTAProperties config={section.config} onChange={onChange} />;
    default: return <p className="text-xs text-zinc-500">No properties available for this section type.</p>;
  }
}

// ─── Icons for section types ─────────────────────────────────────────────
const SECTION_ICONS: Record<string, string> = {
  Hero: "🦸", Features: "✨", Stats: "📊", About: "🏢",
  Gallery: "🖼️", Testimonials: "💬", Contact: "📩",
  Video: "▶️", Socials: "🌐", Pricing: "💰", FAQ: "❓", CTA: "🎯"
};

// ─── Main Sidebar ─────────────────────────────────────────────────────────
export function EditorSidebar({ isOpenOnMobile, onCloseMobile }: { isOpenOnMobile?: boolean; onCloseMobile?: () => void }) {
  const { sections, activeSectionId, setActiveSection, removeSection, reorderSections, duplicateSection, updateSection } = useEditorStore();
  const [showAddModal, setShowAddModal] = useState(false);

  const activeSection = sections.find((s) => s.id === activeSectionId);
  const [propertiesOpen, setPropertiesOpen] = useState(true);

  // Section Drag & Drop
  const [draggedSectionIdx, setDraggedSectionIdx] = useState<number | null>(null);

  const handleDropSection = (targetIdx: number) => {
    if (draggedSectionIdx === null || draggedSectionIdx === targetIdx) return;
    reorderSections(draggedSectionIdx, targetIdx);
    setDraggedSectionIdx(null);
  };

  return (
    <>
      {/* Overlay for mobile sidebar */}
      {isOpenOnMobile && (
        <div 
          className="md:hidden absolute inset-0 bg-black/50 z-30" 
          onClick={onCloseMobile}
        />
      )}

      <div className={`
        absolute md:relative z-40 inset-y-0 left-0
        w-72 border-r border-zinc-800 bg-zinc-900 flex flex-col h-full overflow-hidden
        transform transition-transform duration-200 ease-in-out
        ${isOpenOnMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Section List */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-3 border-b border-zinc-800 flex justify-between items-center flex-shrink-0">
            <h2 className="text-sm font-semibold text-zinc-200">Sections ({sections.length})</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Section
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {sections.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-500 text-sm">No sections yet.</p>
                <button onClick={() => setShowAddModal(true)} className="mt-3 text-indigo-400 hover:text-indigo-300 text-sm font-medium">
                  + Add your first section
                </button>
              </div>
            ) : (
              sections.map((section, index) => (
                <div
                  key={section.id}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; setDraggedSectionIdx(index); }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                  onDrop={() => handleDropSection(index)}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all border ${
                    activeSectionId === section.id
                      ? "bg-indigo-500/20 border-indigo-500/50 text-white"
                      : "bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600"
                  } ${draggedSectionIdx === index ? 'opacity-50 border-dashed' : ''} ${section.config?.isHidden ? 'opacity-50 grayscale' : ''}`}
                >
                  <GripVertical className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0 cursor-grab active:cursor-grabbing" />
                  <span className="text-base">{SECTION_ICONS[section.type] || "📄"}</span>
                  <span className="flex-1 text-xs font-medium truncate">
                    {section.type} {section.config?.isHidden && "(Hidden)"}
                  </span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => updateSection(section.id, { ...section.config, isHidden: !section.config?.isHidden })} className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white" title={section.config?.isHidden ? "Show Section" : "Hide Section"}>
                      {section.config?.isHidden ? <EyeOff className="w-3 h-3 text-red-400" /> : <Eye className="w-3 h-3" />}
                    </button>
                    <button onClick={() => duplicateSection(section.id)} className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-indigo-300" title="Duplicate"><Copy className="w-3 h-3" /></button>
                    <button onClick={() => removeSection(section.id)} className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-red-400" title="Delete"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Properties Panel */}
        {activeSection && (
          <div className="flex-shrink-0 border-t border-zinc-800 max-h-[60%] flex flex-col">
            <button
              className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors w-full"
              onClick={() => setPropertiesOpen(!propertiesOpen)}
            >
              <span>Edit: {activeSection.type}</span>
              {propertiesOpen ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronUp className="w-4 h-4 text-zinc-400" />}
            </button>
            {propertiesOpen && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950">
                <PropertiesPanel section={activeSection} />
              </div>
            )}
          </div>
        )}
      </div>

      {showAddModal && <AddSectionModal onClose={() => setShowAddModal(false)} />}
    </>
  );
}
