import { resolveImageUrl } from "@/lib/utils";

export function GallerySection({ config }: { config: any }) {
  if (config.isHidden) return null;
  const images: string[] = config.images || [];
  return (
    <section className="py-24 px-6 bg-white dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          {!config.hideTitle && (
            <h2 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">
              {config.title || "Gallery"}
            </h2>
          )}
          {!config.hideSubtitle && config.subtitle && (
            <p className="text-xl text-zinc-500 dark:text-zinc-400">
              {config.subtitle}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {images.map((img, i) => (
            <div key={i} className="relative group aspect-[4/3] rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-shadow duration-300">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resolveImageUrl(img)} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
