"use client";

export function PricingSection({ config }: { config: any }) {
  if (config.isHidden) return null;
  const tiers = config.tiers || [];
  return (
    <section className="py-20 px-8 bg-zinc-50 dark:bg-zinc-950">
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
    </section>
  );
}
