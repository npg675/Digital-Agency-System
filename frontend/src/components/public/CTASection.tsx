"use client";

export function CTASection({ config }: { config: any }) {
  if (config.isHidden) return null;
  return (
    <section className="py-24 px-8" style={{ backgroundColor: config.backgroundColor || "#111827" }}>
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
    </section>
  );
}
