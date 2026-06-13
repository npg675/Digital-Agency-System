export function FeaturesSection({ config }: { config: any }) {
  if (config.isHidden) return null;
  const features = config.features || [];

  return (
    <section className="py-24 px-6 bg-white dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          {!config.hideTitle && (
            <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-6">
              {config.title || "Features"}
            </h2>
          )}
          {!config.hideSubtitle && config.subtitle && (
            <p className="text-xl text-zinc-500 dark:text-zinc-400 max-w-3xl mx-auto leading-relaxed">
              {config.subtitle}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f: any, i: number) => (
            <div key={i} className="group p-8 rounded-2xl border border-zinc-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-50 hover:-translate-y-1 transition-all duration-300 bg-white">
              <div className="text-5xl mb-5">{f.icon || "⭐"}</div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">{f.title}</h3>
              <p className="text-zinc-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
