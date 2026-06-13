"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { Globe } from 'lucide-react';

export function LanguageSwitcher({ availableLanguages, currentLang }: { availableLanguages: string[], currentLang?: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  if (!availableLanguages || availableLanguages.length <= 1) {
    return null;
  }

  // Common language names mapping
  const languageNames: Record<string, string> = {
    'en': 'English',
    'es': 'Español',
    'fr': 'Français',
    'de': 'Deutsch',
    'it': 'Italiano',
    'pt': 'Português',
    'nl': 'Nederlands',
    'zh': '中文',
    'ja': '日本語',
  };

  const handleSwitch = (lang: string) => {
    // Set a cookie for the locale
    document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    setIsOpen(false);
    // Refresh to trigger server-side re-render with new cookie
    router.refresh();
  };

  const currentName = currentLang ? (languageNames[currentLang] || currentLang.toUpperCase()) : 'Language';

  return (
    <div className="relative z-[100]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-full hover:bg-zinc-50 shadow-sm transition-colors"
      >
        <Globe className="w-4 h-4" />
        {currentName}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-zinc-100 py-2 top-full">
          {availableLanguages.map(lang => (
            <button
              key={lang}
              onClick={() => handleSwitch(lang)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 transition-colors ${currentLang === lang ? 'font-bold text-indigo-600' : 'text-zinc-700'}`}
            >
              {languageNames[lang] || lang.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
