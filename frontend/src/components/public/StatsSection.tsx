export function StatsSection({ config }: { config: any }) {
  if (config.isHidden) return null;
  const stats = config.stats || [];
  return (
    <section className="py-24 px-6 bg-gradient-to-br from-indigo-900 to-purple-900 text-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        {!config.hideTitle && config.title && (
          <h2 className="text-3xl md:text-4xl font-semibold text-center mb-16 text-white/90 tracking-wide">
            {config.title}
          </h2>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {stats.map((s: any, i: number) => (
            <div key={i} className="text-center">
              <div className="text-5xl md:text-6xl font-extrabold text-white mb-3">{s.value}</div>
              <div className="text-indigo-200 font-medium text-sm tracking-wide uppercase">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
