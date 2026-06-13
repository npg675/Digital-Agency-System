import { resolveImageUrl } from "@/lib/utils";

export function HeroSection({ config }: { config: any }) {
  if (config.isHidden) return null;
  const resolvedBgUrl = resolveImageUrl(config.backgroundImage);
  const zoom = config.backgroundZoom ?? 1;
  const position = config.backgroundPosition || "center";

  return (
    <section className="relative min-h-screen flex items-center justify-center text-center overflow-hidden">
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

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-32">
        {!config.hideTitle && (
          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-8 drop-shadow-2xl">
            {config.title || "Your Compelling Headline"}
          </h1>
        )}
        {!config.hideSubtitle && config.subtitle && (
          <p className="text-xl md:text-2xl text-white/85 mb-12 font-light leading-relaxed max-w-2xl mx-auto drop-shadow">
            {config.subtitle}
          </p>
        )}
        {!config.hideButton && (
          <a
            href={config.ctaLink || "#contact"}
            className="inline-block px-12 py-5 rounded-full text-white font-bold text-lg shadow-2xl hover:opacity-90 transition-all transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: config.buttonColor || "#6366f1" }}
          >
            {config.ctaText || "Get Started"}
          </a>
        )}
      </div>
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/40 flex items-start justify-center pt-2">
          <div className="w-1.5 h-3 bg-white/60 rounded-full" />
        </div>
      </div>
    </section>
  );
}
