import React from 'react';
import { Sparkles } from 'lucide-react';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  return (
    <footer className={`w-full py-2.5 sm:py-3 px-4 sm:px-8 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0D111D]/90 backdrop-blur-md transition-colors duration-200 z-10 shrink-0 ${className}`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
          <div className="w-4.5 h-4.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span>Designed and developed by</span>
          <span className="font-semibold text-slate-900 dark:text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Suman Krishna
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 shadow-2xs">
            BRUH Vision
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-[11px] text-slate-400 dark:text-slate-500">
          <span>AI Document Assistant</span>
          <span>•</span>
          <span>Cloud RAG Edition</span>
          <span>•</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
