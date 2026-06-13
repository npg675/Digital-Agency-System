import { resolveImageUrl } from "@/lib/utils";

export function TestimonialsSection({ config }: { config: any }) {
  if (config.isHidden) return null;
  const testimonials = config.testimonials || [];
  return (
    <section className="py-24 px-6 bg-zinc-50 dark:bg-zinc-900/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          {!config.hideTitle && (
            <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-6">
              {config.title || "Testimonials"}
            </h2>
          )}
          {!config.hideSubtitle && config.subtitle && (
            <p className="text-xl text-zinc-500 dark:text-zinc-400 max-w-3xl mx-auto">
              {config.subtitle}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t: any, i: number) => (
            <div key={i} className="bg-white rounded-3xl p-8 shadow-lg border border-zinc-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="text-8xl text-indigo-50 font-serif absolute -top-4 -right-2 leading-none pointer-events-none">"</div>
              <div className="flex items-center gap-4 mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resolveImageUrl(t.avatar)} alt={t.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-indigo-100" />
                <div>
                  <p className="font-bold text-zinc-900">{t.name}</p>
                  <p className="text-sm text-zinc-500">{t.role}</p>
                </div>
              </div>
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, si) => <span key={si} className="text-amber-400 text-lg">★</span>)}
              </div>
              <p className="text-zinc-600 leading-relaxed italic">"{t.content}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
