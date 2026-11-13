'use client'
import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

export function ThemeToggle() {
  const { t } = useLanguage();
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
      // User sebelumnya pilih dark
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      // Default: light mode (abaikan preferensi sistem)
      setIsDark(false);
      document.documentElement.classList.remove('dark');
      if (!savedTheme) {
        localStorage.setItem('theme', 'light');
      }
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 bg-white/20 dark:bg-gray-800/40 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-white/30 transition-all text-sm sm:text-base"
    >
      {isDark
        ? <><Sun className="w-4 h-4 sm:w-5 sm:h-5" /><span>{t('themeLight')}</span></>
        : <><Moon className="w-4 h-4 sm:w-5 sm:h-5" /><span>{t('themeDark')}</span></>
      }
    </button>
  );
}