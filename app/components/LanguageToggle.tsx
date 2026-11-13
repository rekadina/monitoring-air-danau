'use client'
import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage, Lang } from '../lib/i18n';

const OPTIONS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'id', label: 'ID' },
];

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className="flex items-center gap-1 bg-white/20 dark:bg-gray-800/40 backdrop-blur-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base"
      role="group"
      aria-label="Language"
    >
      <Languages className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
      {OPTIONS.map((o) => (
        <button
          key={o.code}
          type="button"
          onClick={() => setLang(o.code)}
          aria-pressed={lang === o.code}
          className={`px-2 py-0.5 rounded-md text-xs sm:text-sm font-semibold transition-all ${
            lang === o.code ? 'bg-white text-blue-700' : 'text-white/80 hover:bg-white/20'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
