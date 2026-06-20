"use client";

import { useEditorStore } from "@/store/useEditorStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Copy, Trash2, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, MousePointer2, Upload, Loader2 } from "lucide-react";
import { useState } from "react";
import { resolveImageUrl } from "@/lib/utils";
import { MEDIA_DRAG_KEY } from "@/components/editor/MediaLibraryDrawer";

// ─── Section renderers ───────────────────────────────────────────────────

function HeroRenderer({ config }: { config: any }) {
  if (config.isHidden) return null;
  const resolvedBgUrl = resolveImageUrl(config.backgroundImage);
  const zoom = config.backgroundZoom ?? 1;
  const position = config.backgroundPosition || "center";

  return (
    <div className="relative min-h-[520px] flex items-center justify-center text-center overflow-hidden">
      {/* Background Image Layer */}
      {!config.hideBackground && resolvedBgUrl && (
        <div
          className="absolute inset-0 z-0 transition-transform duration-300"
          style={{
            backgroundImage: `url(${resolvedBgUrl})`,
            backgroundSize: "cover",
            backgroundPosition: position,
            transform: `scale(${zoom})`,
            transformOrigin: position,
          }}
        />
      )}

      {/* Fallback Gradient Background */}
      {(config.hideBackground || !resolvedBgUrl) && (
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: "linear-gradient(135deg,#667eea,#764ba2)",
          }}
        />
      )}

      {/* Overlay Layer */}
      {!config.hideBackground && (
        <div className="absolute inset-0 z-0" style={{ background: `rgba(0,0,0,${config.overlayOpacity ?? 0.6})` }} />
      )}

      <div className="relative z-10 max-w-3xl mx-auto px-8 py-24">
        {!config.hideTitle && (
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6 drop-shadow-lg">
            {config.title || "Your Compelling Headline"}
          </h1>
        )}
        {!config.hideSubtitle && (
          <p className="text-xl text-white/85 mb-10 font-light leading-relaxed drop-shadow">
            {config.subtitle || "A clear value proposition that converts visitors."}
          </p>
        )}
        {!config.hideButton && (
          <a
            href={config.ctaLink || "#contact"}
            className="inline-block px-10 py-4 rounded-full text-white font-bold text-lg shadow-2xl hover:opacity-90 transition-all transform hover:scale-105"
            style={{ backgroundColor: config.buttonColor || "#6366f1" }}
          >
            {config.ctaText || "Get Started"}
          </a>
        )}
      </div>
    </div>
  );
}

function FeaturesRenderer({ config }: { config: any }) {
  const features = config.features || [];
  return (
    <div className="py-20 px-8 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          {!config.hideTitle && <h2 className="text-4xl font-bold text-zinc-900 mb-4">{config.title || "Features"}</h2>}
          {!config.hideSubtitle && config.subtitle && <p className="text-lg text-zinc-500 max-w-2xl mx-auto">{config.subtitle}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f: any, i: number) => (
            <div key={i} className="group p-8 rounded-2xl border border-zinc-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all bg-white">
              <div className="text-4xl mb-5">{f.icon || "⭐"}</div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">{f.title}</h3>
              <p className="text-zinc-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatsRenderer({ config }: { config: any }) {
  const stats = config.stats || [];
  return (
    <div className="py-16 px-8 bg-gradient-to-br from-indigo-900 to-purple-900 text-white">
      <div className="max-w-5xl mx-auto">
        {config.title && <h2 className="text-2xl font-semibold text-center mb-12 text-white/80">{config.title}</h2>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s: any, i: number) => (
            <div key={i} className="text-center">
              <div className="text-5xl font-extrabold text-white mb-2">{s.value}</div>
              <div className="text-indigo-200 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AboutRenderer({ config }: { config: any }) {
  const isLeft = config.imagePosition !== "right";
  return (
    <div className="py-20 px-8 bg-zinc-50">
      <div className={`max-w-5xl mx-auto flex flex-col ${isLeft ? "md:flex-row-reverse" : "md:flex-row"} gap-16 items-center`}>
        <div className="flex-1">
          <h2 className="text-4xl font-bold text-zinc-900 mb-6">{config.title || "About Us"}</h2>
          <div className="text-zinc-600 leading-relaxed space-y-4">
            {(config.description || "").split("\n\n").map((p: string, i: number) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
        <div className="flex-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveImageUrl(config.image) || "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80"}
            alt="About"
            className="w-full rounded-2xl shadow-2xl object-cover aspect-[4/3]"
          />
        </div>
      </div>
    </div>
  );
}

function GalleryRenderer({ config, onUpdate }: { config: any; onUpdate?: (c: any) => void }) {
  const images: string[] = config.images || [];
  const isEditable = !!onUpdate;

  // ── Drag state ──
  const [draggedImgIdx, setDraggedImgIdx] = useState<number | null>(null);
  const [dropImgIdx, setDropImgIdx] = useState<number | null>(null);
  const [isLibDragOver, setIsLibDragOver] = useState(false);

  const moveImage = (from: number, to: number) => {
    if (!onUpdate) return;
    const newImages = [...images];
    const [moved] = newImages.splice(from, 1);
    newImages.splice(to, 0, moved);
    onUpdate({ ...config, images: newImages });
  };

  const removeImage = (i: number) => {
    if (!onUpdate) return;
    onUpdate({ ...config, images: images.filter((_, idx) => idx !== i) });
  };

  // ── Gallery image drag handlers ──
  const handleImgDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/x-gallery-img-idx", String(idx));
    setDraggedImgIdx(idx);
  };

  const handleImgDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggedImgIdx !== null ? "move" : "copy";
    setDropImgIdx(idx);
  };

  const handleImgDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    // Drop from media library
    const mediaPath = e.dataTransfer.getData(MEDIA_DRAG_KEY);
    if (mediaPath && onUpdate) {
      const newImages = [...images];
      newImages.splice(toIdx, 0, mediaPath);
      onUpdate({ ...config, images: newImages });
      setDraggedImgIdx(null); setDropImgIdx(null); setIsLibDragOver(false);
      return;
    }
    // Reorder within gallery
    const fromIdx = parseInt(e.dataTransfer.getData("application/x-gallery-img-idx"), 10);
    if (!isNaN(fromIdx) && fromIdx !== toIdx) moveImage(fromIdx, toIdx);
    setDraggedImgIdx(null); setDropImgIdx(null);
  };

  const handleGridDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const mediaPath = e.dataTransfer.getData(MEDIA_DRAG_KEY);
    if (mediaPath && onUpdate) onUpdate({ ...config, images: [...images, mediaPath] });
    setIsLibDragOver(false);
  };

  return (
    // NO onDragOver/onDrop on the outer wrapper — let drags pass through to Asset Shelf
    <div className={`relative py-20 px-8 transition-colors ${config.darkBackground ? "bg-zinc-900" : "bg-white"}`}>

      {/* On-canvas background toggle — always visible in indigo */}
      {isEditable && (
        <button
          onClick={(e) => { e.stopPropagation(); onUpdate && onUpdate({ ...config, darkBackground: !config.darkBackground }); }}
          className="absolute top-10 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl ring-2 ring-indigo-400/40 transition-all hover:scale-105 active:scale-95"
          title="Toggle gallery background between Light and Dark"
        >
          {config.darkBackground ? "☀️ Switch to Light" : "🌙 Switch to Dark"}
        </button>
      )}

      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className={`text-4xl font-bold mb-4 ${config.darkBackground ? "text-white" : "text-zinc-900"}`}>{config.title || "Gallery"}</h2>
          {config.subtitle && <p className={`text-lg ${config.darkBackground ? "text-zinc-400" : "text-zinc-500"}`}>{config.subtitle}</p>}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          {images.map((img, i) => (
            <div
              key={i}
              draggable={isEditable}
              onDragStart={(e) => isEditable && handleImgDragStart(e, i)}
              onDragEnd={() => { setDraggedImgIdx(null); setDropImgIdx(null); }}
              onDragOver={(e) => isEditable && handleImgDragOver(e, i)}
              onDrop={(e) => isEditable && handleImgDrop(e, i)}
              className={`relative aspect-[4/3] rounded-xl overflow-hidden shadow-md group transition-all ${
                draggedImgIdx === i ? "opacity-40 scale-95 cursor-grabbing"
                : dropImgIdx === i && draggedImgIdx !== i ? "ring-4 ring-indigo-400 scale-[1.03]"
                : isEditable ? "cursor-grab" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resolveImageUrl(img)} alt={`Gallery ${i + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                draggable={false}
              />
              {isEditable && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex flex-col items-center justify-between p-2 opacity-0 group-hover:opacity-100">
                  <div className="w-full flex justify-between items-start">
                    <span className="bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">{i + 1} / {images.length}</span>
                    <button onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                      className="bg-red-600/90 hover:bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors"
                    >✕ Remove</button>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => moveImage(i, 0)} disabled={i === 0}
                      className="flex items-center gap-1 px-2 py-1 bg-amber-500/90 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed text-white text-[10px] font-bold rounded-lg transition-colors shadow-lg"
                      title="Bring to Front"><ChevronsUp className="w-3 h-3" /> Front</button>
                    <button onClick={() => { if (i > 0) moveImage(i, i - 1); }} disabled={i === 0}
                      className="flex items-center gap-1 px-2 py-1 bg-zinc-700/90 hover:bg-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-[10px] font-bold rounded-lg transition-colors shadow-lg"
                    >◀ Prev</button>
                    <button onClick={() => { if (i < images.length - 1) moveImage(i, i + 1); }} disabled={i === images.length - 1}
                      className="flex items-center gap-1 px-2 py-1 bg-zinc-700/90 hover:bg-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-[10px] font-bold rounded-lg transition-colors shadow-lg"
                    >Next ▶</button>
                    <button onClick={() => moveImage(i, images.length - 1)} disabled={i === images.length - 1}
                      className="flex items-center gap-1 px-2 py-1 bg-amber-500/90 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed text-white text-[10px] font-bold rounded-lg transition-colors shadow-lg"
                      title="Send to Back">Back <ChevronsDown className="w-3 h-3" /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Explicit drop zone — only this strip accepts media drops into the gallery */}
        {isEditable && (
          <div
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes(MEDIA_DRAG_KEY)) {
                e.preventDefault();
                e.stopPropagation();
                setIsLibDragOver(true);
              }
            }}
            onDragLeave={() => setIsLibDragOver(false)}
            onDrop={(e) => { e.stopPropagation(); handleGridDrop(e); }}
            className={`mt-4 flex items-center justify-center h-14 rounded-xl border-2 border-dashed transition-all cursor-default ${
              isLibDragOver
                ? "border-indigo-400 bg-indigo-50 text-indigo-600 scale-[1.01]"
                : config.darkBackground
                ? "border-zinc-600 text-zinc-500 hover:border-zinc-500"
                : "border-zinc-300 text-zinc-400 hover:border-zinc-400"
            }`}
          >
            <span className="text-xs font-medium">
              {isLibDragOver ? "✓ Release to add to Gallery" : "🖼️ Drop here to add to Gallery · or use the Asset Shelf below"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function TestimonialsRenderer({ config }: { config: any }) {
  const testimonials = config.testimonials || [];
  return (
    <div className="py-20 px-8 bg-zinc-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-zinc-900 mb-4">{config.title || "Testimonials"}</h2>
          {config.subtitle && <p className="text-lg text-zinc-500">{config.subtitle}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t: any, i: number) => (
            <div key={i} className="bg-white rounded-2xl p-8 shadow-md border border-zinc-100 relative">
              <div className="text-6xl text-indigo-100 font-serif absolute top-4 right-6 leading-none">"</div>
              <div className="flex items-center gap-4 mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resolveImageUrl(t.avatar)} alt={t.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-indigo-100" />
                <div>
                  <p className="font-bold text-zinc-900">{t.name}</p>
                  <p className="text-sm text-zinc-500">{t.role}</p>
                </div>
              </div>
              <p className="text-zinc-600 italic leading-relaxed">"{t.content}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContactRenderer({ config }: { config: any }) {
  const fields: string[] = config.fields || [];
  const [bookNow, setBookNow] = useState(false);

  const isDateField = (fieldName: string) => {
    const nameLower = fieldName.toLowerCase();
    return (
      nameLower.includes("date") ||
      nameLower.includes("booking") ||
      nameLower.includes("appointment") ||
      nameLower.includes("time") ||
      nameLower.includes("schedule") ||
      nameLower.includes("calendar")
    );
  };

  const hasDateField = fields.some(isDateField);

  return (
    <div className="py-20 px-8" style={{ backgroundColor: `${config.backgroundColor || "#6366f1"}15` }}>
      <div className="max-w-xl mx-auto bg-white rounded-3xl p-10 shadow-2xl border border-zinc-100">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-zinc-900 mb-3">{config.title || "Get In Touch"}</h2>
          <p className="text-zinc-500">{config.subtitle}</p>
        </div>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {hasDateField && (
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100/80 mb-4 transition-colors">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={bookNow}
                  onChange={(e) => setBookNow(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-zinc-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 bg-white transition-colors cursor-pointer"
                />
                <span className="text-sm font-semibold text-zinc-700">
                  📅 Book appointment date & time now?
                </span>
              </label>
              <p className="text-xs text-zinc-400 mt-1.5 ml-8">
                If unchecked, we'll send you an email to fix the date later.
              </p>
            </div>
          )}

          {fields.map((field, i) => {
            const isDate = isDateField(field);
            if (isDate && !bookNow) {
              return null;
            }
            const isMessage = field.toLowerCase().includes("message");
            return (
              <div key={i}>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">{field}</label>
                {isMessage ? (
                  <textarea rows={4} placeholder={`Enter your ${field.toLowerCase()}`} className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                ) : (
                  <input
                    type={
                      field.toLowerCase().includes("email")
                        ? "email"
                        : isDate
                        ? "datetime-local"
                        : "text"
                    }
                    placeholder={`Enter your ${field.toLowerCase()}`}
                    className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}
              </div>
            );
          })}
          <button
            type="submit"
            className="w-full h-14 mt-2 rounded-xl font-bold text-white text-lg shadow-lg hover:opacity-90 transition-all"
            style={{ backgroundColor: config.backgroundColor || "#6366f1" }}
          >
            {config.buttonText || "Send Message"}
          </button>
        </form>
      </div>
    </div>
  );
}

function VideoRenderer({ config }: { config: any }) {
  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([^&?\/]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const youtubeId = getYoutubeId(config.videoUrl);
  const isMp4 = config.videoUrl?.endsWith(".mp4");
  const mode = config.mode || "embedded";

  if (mode === "background") {
    return (
      <div className="relative w-full h-[60vh] flex items-center justify-center overflow-hidden bg-black">
        {youtubeId ? (
          <iframe
            className="absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-60"
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${youtubeId}`}
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        ) : isMp4 ? (
          <video
            className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none opacity-60"
            src={config.videoUrl}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center z-0 opacity-40">
             <span className="text-white text-6xl">▶️</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10 pointer-events-none" />
        <div className="relative z-20 text-center px-6 max-w-4xl mx-auto pointer-events-none">
          {!config.hideTitle && config.title && (
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">{config.title}</h2>
          )}
          {!config.hideSubtitle && config.subtitle && (
            <p className="text-lg text-zinc-200">{config.subtitle}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 bg-white dark:bg-zinc-950">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          {!config.hideTitle && config.title && <h2 className="text-3xl font-bold text-zinc-900 mb-4">{config.title}</h2>}
          {!config.hideSubtitle && config.subtitle && <p className="text-lg text-zinc-600 max-w-2xl mx-auto">{config.subtitle}</p>}
        </div>
        <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-zinc-100 dark:bg-zinc-900 aspect-video flex flex-col items-center justify-center">
          {/* Note: In editor preview, we add pointer-events-none so clicking the video selects the section instead of playing it */}
          <div className="absolute inset-0 z-10" /> 
          {youtubeId ? (
            <iframe
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${config.autoplay ? 1 : 0}&mute=${config.muted ? 1 : 0}${config.loop ? `&loop=1&playlist=${youtubeId}` : ''}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : config.videoUrl ? (
            <video
              className="w-full h-full pointer-events-none"
              src={config.videoUrl}
              controls
              autoPlay={config.autoplay}
              muted={config.muted}
              loop={config.loop}
              playsInline
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
              <span className="text-4xl mb-2">▶️</span>
              <span className="text-zinc-500 font-medium">Video Player Placeholder</span>
              <span className="text-xs text-zinc-400 mt-1 truncate max-w-xs text-center px-4">
                Please add a valid video URL in the editor
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SocialsRenderer({ config }: { config: any }) {
  const links = [
    { name: "Facebook", hidden: config.hideFacebook },
    { name: "Twitter", hidden: config.hideTwitter },
    { name: "Instagram", hidden: config.hideInstagram },
    { name: "LinkedIn", hidden: config.hideLinkedin },
    { name: "YouTube", hidden: config.hideYoutube },
    { name: "TikTok", hidden: config.hideTiktok },
  ].filter(l => !l.hidden);

  return (
    <div className="py-16 bg-white dark:bg-zinc-950">
      <div className="max-w-4xl mx-auto px-6 text-center">
        {!config.hideTitle && config.title && (
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-8">{config.title}</h2>
        )}
        <div className="flex justify-center gap-6 flex-wrap">
          {links.length > 0 ? links.map((link, idx) => (
            <div key={idx} className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 text-xs font-bold">
              {link.name.substring(0, 2)}
            </div>
          )) : (
            <p className="text-zinc-400 text-sm">No socials configured</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PricingRenderer({ config }: { config: any }) {
  if (config.isHidden) return null;
  const tiers = config.tiers || [];
  return (
    <div className="py-20 px-8 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          {!config.hideTitle && <h2 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">{config.title || "Pricing"}</h2>}
          {!config.hideSubtitle && <p className="text-lg text-zinc-500 max-w-2xl mx-auto">{config.subtitle}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier: any, i: number) => (
            <div key={i} className={`relative rounded-3xl p-8 bg-white dark:bg-zinc-900 border ${tier.highlight ? 'border-indigo-500 shadow-xl shadow-indigo-500/10 scale-105 z-10' : 'border-zinc-200 dark:border-zinc-800'}`}>
              {tier.highlight && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Popular
                </div>
              )}
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{tier.name}</h3>
                <p className="text-sm text-zinc-500 mb-6">{tier.description}</p>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-4xl font-extrabold text-zinc-900 dark:text-white">{tier.price}</span>
                  <span className="text-zinc-500 font-medium mb-1">{tier.period}</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                {(tier.features || []).map((f: string, j: number) => (
                  <li key={j} className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400 text-sm">
                    <span className="text-indigo-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-3 rounded-xl font-bold transition-all ${tier.highlight ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white'}`}>
                {tier.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FAQRenderer({ config }: { config: any }) {
  if (config.isHidden) return null;
  const faqs = config.faqs || [];
  return (
    <div className="py-20 px-8 bg-white dark:bg-zinc-900">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          {!config.hideTitle && <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">{config.title || "FAQ"}</h2>}
          {!config.hideSubtitle && <p className="text-lg text-zinc-500">{config.subtitle}</p>}
        </div>
        <div className="space-y-4">
          {faqs.map((faq: any, i: number) => (
            <div key={i} className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2 flex justify-between items-center">
                {faq.question}
                <span className="text-indigo-500 text-xl">+</span>
              </h3>
              <p className="text-zinc-500 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CTARenderer({ config }: { config: any }) {
  if (config.isHidden) return null;
  return (
    <div className="py-24 px-8" style={{ backgroundColor: config.backgroundColor || "#111827" }}>
      <div className="max-w-4xl mx-auto text-center">
        {!config.hideTitle && (
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            {config.title || "Ready to get started?"}
          </h2>
        )}
        {!config.hideSubtitle && (
          <p className="text-xl text-zinc-300 mb-10 max-w-2xl mx-auto">
            {config.subtitle || "Join thousands of satisfied customers today."}
          </p>
        )}
        {!config.hideButton && (
          <a
            href={config.ctaLink || "#contact"}
            className="inline-block px-10 py-4 rounded-full text-white font-bold text-lg shadow-xl hover:scale-105 transition-transform"
            style={{ backgroundColor: config.buttonColor || "#6366f1" }}
          >
            {config.ctaText || "Start your free trial"}
          </a>
        )}
      </div>
    </div>
  );
}

function CheckoutRenderer({ config }: { config: any }) {
  if (config.isHidden) return null;
  return (
    <div className="py-20 px-8 bg-zinc-50 dark:bg-zinc-950 min-h-[600px] flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
        <div className="p-8 text-center bg-zinc-100/50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{config.title || "Complete Your Purchase"}</h2>
          <p className="text-zinc-500 font-medium">{config.productName || "Premium Package"}</p>
          <div className="text-4xl font-extrabold text-zinc-900 dark:text-white mt-4">
            ${((config.amount || 9900) / 100).toFixed(2)}
          </div>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-4 pointer-events-none opacity-75">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
              <div className="w-full h-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Card Information</label>
              <div className="w-full h-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-t-lg" />
              <div className="flex w-full">
                <div className="w-1/2 h-11 bg-zinc-50 dark:bg-zinc-950 border border-t-0 border-r-0 border-zinc-200 dark:border-zinc-700 rounded-bl-lg" />
                <div className="w-1/2 h-11 bg-zinc-50 dark:bg-zinc-950 border border-t-0 border-zinc-200 dark:border-zinc-700 rounded-br-lg" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name on card</label>
              <div className="w-full h-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg" />
            </div>
          </div>
          <button
            className="w-full py-4 rounded-xl font-bold text-white shadow-lg pointer-events-none"
            style={{ backgroundColor: config.buttonColor || "#10b981" }}
          >
            Pay ${((config.amount || 9900) / 100).toFixed(2)}
          </button>
          <div className="flex justify-center items-center gap-2 text-zinc-400 text-xs">
            <span className="w-4 h-4 rounded-full border border-zinc-300 flex items-center justify-center font-bold">🔒</span>
            Guaranteed safe & secure checkout
          </div>
        </div>
      </div>
    </div>
  );
}

function VideoBubbleRenderer({ config }: { config: any }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (config.isHidden) return null;

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([^&?\/]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const youtubeId = getYoutubeId(config.videoUrl);
  const isMp4 = config.videoUrl?.endsWith(".mp4");
  
  const positionClasses = config.position === "bottom-left" ? "bottom-6 left-6 items-start" : "bottom-6 right-6 items-end";
  const sizeClasses = isExpanded ? "w-72 h-[400px] rounded-2xl" : config.size === "small" ? "w-32 h-32 rounded-full" : config.size === "large" ? "w-64 h-64 rounded-full" : "w-48 h-48 rounded-full";
  const pointerTriangle = config.position === "bottom-left" ? "left-6" : "right-6";

  return (
    <div className={`fixed ${positionClasses} z-50 flex flex-col gap-3 pointer-events-none`}>
      {/* Welcome Bubble */}
      {!config.hideWelcomeText && config.welcomeText && !isExpanded && (
        <div className={`bg-white text-zinc-900 px-4 py-2 rounded-2xl shadow-lg text-sm font-medium relative ${config.position === 'bottom-left' ? 'ml-2' : 'mr-2'} animate-bounce`}>
          {config.welcomeText}
          <div className={`absolute -bottom-2 ${pointerTriangle} w-4 h-4 bg-white transform rotate-45`} />
        </div>
      )}
      
      {/* Video Container */}
      <div 
        className={`relative ${sizeClasses} overflow-hidden shadow-2xl border-4 pointer-events-auto cursor-pointer transition-all duration-300 group`} 
        style={{ borderColor: config.buttonColor || "#6366f1" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {youtubeId ? (
          <iframe
            className={`absolute top-0 left-0 w-[150%] h-[150%] -translate-x-[16.6%] -translate-y-[16.6%] pointer-events-none ${isExpanded ? 'opacity-80' : ''}`}
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}`}
            allow="autoplay; encrypted-media"
          />
        ) : isMp4 ? (
          <video
            className={`w-full h-full object-cover ${isExpanded ? 'opacity-80' : ''}`}
            src={config.videoUrl}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
             <span className="text-2xl">▶️</span>
          </div>
        )}

        {/* Interactive Overlay (Tolstoy / VideoAsk Style) */}
        <div className={`absolute inset-0 bg-black/40 flex flex-col items-center justify-end p-4 pb-6 transition-opacity duration-300 ${isExpanded || isHovered ? 'opacity-100' : 'opacity-0'}`}>
          {isExpanded ? (
            <div className="w-full space-y-2 animate-in slide-in-from-bottom-4">
              <button 
                className="w-full py-2.5 rounded-lg text-sm font-bold text-white shadow-lg hover:scale-105 transition-transform"
                style={{ backgroundColor: config.buttonColor || "#6366f1" }}
                onClick={(e) => e.stopPropagation()}
              >
                📅 Book a Call
              </button>
              <button 
                className="w-full py-2.5 rounded-lg text-sm font-bold bg-white text-zinc-900 shadow-lg hover:scale-105 transition-transform"
                onClick={(e) => e.stopPropagation()}
              >
                💬 Ask a Question
              </button>
              <button 
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/80"
                onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="text-white font-bold text-sm tracking-wider flex items-center gap-2">
              <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-white opacity-75"></span>
              Click to Interact
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function renderSectionContent(section: any, onUpdate?: (config: any) => void) {
  switch (section.type) {
    case "Hero": return <HeroRenderer config={section.config} />;
    case "Features": return <FeaturesRenderer config={section.config} />;
    case "Stats": return <StatsRenderer config={section.config} />;
    case "About": return <AboutRenderer config={section.config} />;
    case "Gallery": return <GalleryRenderer config={section.config} onUpdate={onUpdate} />;
    case "Testimonials": return <TestimonialsRenderer config={section.config} />;
    case "Contact": return <ContactRenderer config={section.config} />;
    case "Video": return <VideoRenderer config={section.config} />;
    case "VideoBubble": return <VideoBubbleRenderer config={section.config} />;
    case "Socials": return <SocialsRenderer config={section.config} />;
    case "Pricing": return <PricingRenderer config={section.config} />;
    case "FAQ": return <FAQRenderer config={section.config} />;
    case "CTA": return <CTARenderer config={section.config} />;
    case "Checkout": return <CheckoutRenderer config={section.config} />;
    default: return <div className="p-8 text-center text-zinc-500 border-dashed border-2 m-4 rounded-xl">Unknown section: {section.type}</div>;
  }
}

function InlineBgUploader({ config, onUpdate }: { config: any; onUpdate: (c: any) => void }) {
  const { token } = useAuthStore();
  const [uploading, setUploading] = useState(false);

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
          onUpdate({ ...config, backgroundImage: data.filepath });
        }
      }
    } catch (err) {
      console.error("Failed to upload inline background:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="absolute bottom-4 left-4 z-30" onClick={(e) => e.stopPropagation()}>
      <label className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/90 hover:bg-zinc-950 text-white text-xs font-semibold rounded-lg shadow-xl cursor-pointer border border-zinc-700/80 backdrop-blur-sm transition-all hover:scale-105 active:scale-95">
        {uploading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
        ) : (
          <Upload className="w-3.5 h-3.5 text-zinc-400" />
        )}
        <span>{uploading ? "Uploading..." : "Change Background"}</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>
    </div>
  );
}

// ─── Section type icons ────────────────────────────────────────────────────
const SECTION_ICONS: Record<string, string> = {
  Hero: "🦸", Features: "✨", Stats: "📊", About: "🏢",
  Gallery: "🖼️", Testimonials: "💬", Contact: "📩",
  Video: "▶️", VideoBubble: "💬", Socials: "🌐", Pricing: "💰", FAQ: "❓", CTA: "🎯", Checkout: "💳"
};

// ─── Main Preview ─────────────────────────────────────────────────────────
export const SECTION_DRAG_KEY = "application/x-section-drag";

export function EditorPreview() {
  const { sections, activeSectionId, setActiveSection, removeSection, duplicateSection, reorderSections, updateSection } = useEditorStore();

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleDrop = (targetIdx: number) => {
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    reorderSections(draggedIdx, targetIdx);
    setDraggedIdx(null);
  };

  return (
    <div className="flex-1 bg-zinc-800 overflow-y-auto pb-24">
      {/* pb-24 = space for fixed Asset Shelf at bottom */}
      {sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full min-h-[600px] gap-4">
          <MousePointer2 className="w-12 h-12 text-zinc-600" />
          <p className="text-zinc-500 text-lg font-medium">Your page is empty</p>
          <p className="text-zinc-600 text-sm">Click "Add Section" in the sidebar to get started</p>
        </div>
      ) : (
        <div>
          {sections.map((section, index) => {
            const isActive = activeSectionId === section.id;
            return (
              <div
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData(SECTION_DRAG_KEY, String(index));
                  setDraggedIdx(index);
                }}
                onDragOver={(e) => {
                  // Only accept section-reordering drags — let media drags pass through to the shelf
                  if (!e.dataTransfer.types.includes(SECTION_DRAG_KEY)) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => {
                  // Only handle section drops — ignore media drags so they reach the shelf
                  if (!e.dataTransfer.types.includes(SECTION_DRAG_KEY)) return;
                  e.preventDefault();
                  e.stopPropagation();
                  handleDrop(index);
                }}
                className={`relative group cursor-pointer transition-all ${isActive ? "ring-2 ring-inset ring-indigo-500" : "hover:ring-2 hover:ring-inset hover:ring-indigo-400/50"} ${section.config?.isHidden ? 'opacity-50 grayscale' : ''} ${draggedIdx === index ? 'opacity-50' : ''}`}
              >
                  {/* Hidden badge */}
                  {section.config?.isHidden && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white font-bold py-2 px-4 rounded-xl z-40 flex items-center gap-2">
                      <span className="text-xl">👁️‍🗨️</span> Section Hidden
                    </div>
                  )}
                  {/* Section content */}
                  <div className={section.config?.isHidden ? "pointer-events-none" : ""}>
                    {renderSectionContent(
                      section,
                      isActive ? (newConfig) => updateSection(section.id, newConfig) : undefined
                    )}
                  </div>

                  {isActive && section.type === "Hero" && (
                    <InlineBgUploader config={section.config} onUpdate={(newConfig) => updateSection(section.id, newConfig)} />
                  )}

                  {/* Overlay toolbar */}
                  <div className={`absolute top-3 right-3 flex items-center gap-1.5 z-30 transition-opacity ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                    <div className="flex items-center bg-zinc-900/90 backdrop-blur-sm rounded-lg border border-zinc-700 shadow-xl overflow-hidden">
                      <span className="px-2 py-1 text-xs font-bold text-indigo-400 border-r border-zinc-700">{section.type}</span>
                      {/* Bring to Front */}
                      <button
                        onClick={(e) => { e.stopPropagation(); if (index > 0) reorderSections(index, 0); }}
                        disabled={index === 0}
                        className="px-2 py-1.5 text-zinc-300 hover:text-amber-300 hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Bring to Front"
                      ><ChevronsUp className="w-3.5 h-3.5" /></button>
                      {/* Move up */}
                      <button
                        onClick={(e) => { e.stopPropagation(); if (index > 0) reorderSections(index, index - 1); }}
                        disabled={index === 0}
                        className="px-2 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors border-l border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      ><ChevronUp className="w-3.5 h-3.5" /></button>
                      {/* Move down */}
                      <button
                        onClick={(e) => { e.stopPropagation(); if (index < sections.length - 1) reorderSections(index, index + 1); }}
                        disabled={index === sections.length - 1}
                        className="px-2 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors border-l border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      ><ChevronDown className="w-3.5 h-3.5" /></button>
                      {/* Send to Back */}
                      <button
                        onClick={(e) => { e.stopPropagation(); if (index < sections.length - 1) reorderSections(index, sections.length - 1); }}
                        disabled={index === sections.length - 1}
                        className="px-2 py-1.5 text-zinc-300 hover:text-amber-300 hover:bg-zinc-700 transition-colors border-l border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Send to Back"
                      ><ChevronsDown className="w-3.5 h-3.5" /></button>
                      <button
                        onClick={(e) => { e.stopPropagation(); duplicateSection(section.id); }}
                        className="px-2 py-1.5 text-zinc-300 hover:text-indigo-300 hover:bg-zinc-700 transition-colors border-l border-zinc-700"
                        title="Duplicate"
                      ><Copy className="w-3.5 h-3.5" /></button>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
                        className="px-2 py-1.5 text-zinc-300 hover:text-red-400 hover:bg-zinc-700 transition-colors border-l border-zinc-700"
                        title="Delete"
                      ><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  {/* Hover section-name tag (non-active) */}
                  {!isActive && (
                    <div className="absolute top-0 left-0 z-30 opacity-0 group-hover:opacity-100 transition-all duration-150 translate-y-0 pointer-events-none">
                      <div className="flex items-center gap-1 bg-zinc-900/85 backdrop-blur-sm text-zinc-200 text-[10px] font-semibold px-2 py-0.5 rounded-br-lg shadow-md border-r border-b border-zinc-700/50">
                        <span className="text-[9px]">{SECTION_ICONS[section.type] || "📄"}</span>
                        {section.type}
                      </div>
                    </div>
                  )}

                  {/* Active indicator label */}
                  {isActive && (
                    <div className="absolute top-0 left-0 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-br-lg z-30 flex items-center gap-1">
                      <span className="text-[9px]">{SECTION_ICONS[section.type] || "📄"}</span>
                      Editing · {section.type}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
