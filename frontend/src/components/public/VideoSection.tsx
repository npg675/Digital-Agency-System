import React from "react";

export function VideoSection({ config }: { config: any }) {
  if (config.isHidden) return null;

  // Attempt to extract YouTube video ID
  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([^&?\/]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const youtubeId = getYoutubeId(config.videoUrl);
  const isMp4 = config.videoUrl?.endsWith(".mp4");
  
  const mode = config.mode || "embedded";

  // Full Background Mode
  if (mode === "background") {
    return (
      <section className="relative w-full h-[60vh] md:h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Background Video */}
        {youtubeId ? (
          <iframe
            className="absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${youtubeId}`}
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        ) : isMp4 ? (
          <video
            className="absolute top-0 left-0 w-full h-full object-cover"
            src={config.videoUrl}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
            <span className="text-zinc-500">Invalid Video URL for background</span>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50 z-10" />

        {/* Content */}
        <div className="relative z-20 text-center px-6 max-w-4xl mx-auto">
          {!config.hideTitle && config.title && (
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              {config.title}
            </h2>
          )}
          {!config.hideSubtitle && config.subtitle && (
            <p className="text-lg md:text-xl text-zinc-200">
              {config.subtitle}
            </p>
          )}
        </div>
      </section>
    );
  }

  // Embedded Player Mode
  return (
    <section className="py-20 bg-white dark:bg-zinc-950">
      <div className="max-w-5xl mx-auto px-6">
        {(!config.hideTitle && config.title) || (!config.hideSubtitle && config.subtitle) ? (
          <div className="text-center mb-12">
            {!config.hideTitle && config.title && (
              <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
                {config.title}
              </h2>
            )}
            {!config.hideSubtitle && config.subtitle && (
              <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                {config.subtitle}
              </p>
            )}
          </div>
        ) : null}

        <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-zinc-100 dark:bg-zinc-900 aspect-video">
          {youtubeId ? (
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${config.autoplay ? 1 : 0}&mute=${config.muted ? 1 : 0}${config.loop ? `&loop=1&playlist=${youtubeId}` : ''}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : config.videoUrl ? (
            <video
              className="w-full h-full"
              src={config.videoUrl}
              controls
              autoPlay={config.autoplay}
              muted={config.muted}
              loop={config.loop}
              playsInline
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
              <span className="text-4xl">▶️</span>
              <p className="text-zinc-500 font-medium text-sm">Please add a valid video URL in the editor</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
