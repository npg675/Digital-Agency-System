import { resolveImageUrl } from "@/lib/utils";

export function AboutSection({ config }: { config: any }) {
  if (config.isHidden) return null;
  const isLeft = config.imagePosition !== "right";
  
  return (
    <section className="py-24 px-6 bg-zinc-50 dark:bg-zinc-900/50">
      <div className={`max-w-7xl mx-auto flex flex-col ${isLeft ? "md:flex-row-reverse" : "md:flex-row"} gap-16 lg:gap-24 items-center`}>
        <div className="flex-1 space-y-8">
          {!config.hideTitle && (
            <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white">
              {config.title || "About Us"}
            </h2>
          )}
          {!config.hideDescription && (
            <div className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-6">
              {(config.description || "").split("\n\n").map((p: string, i: number) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveImageUrl(config.image) || "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80"}
            alt="About"
            className="w-full rounded-3xl shadow-2xl object-cover aspect-[4/3]"
          />
        </div>
      </div>
    </section>
  );
}
