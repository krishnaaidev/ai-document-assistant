import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import clsx from 'clsx';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className, showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={clsx(
        'relative inline-flex items-center gap-2 p-2 rounded-xl transition-all duration-200',
        'border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80',
        'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400',
        'hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xs shadow-2xs',
        'backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
        className
      )}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle light and dark mode"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 scale-100" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-300 rotate-0 scale-100" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-medium">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
