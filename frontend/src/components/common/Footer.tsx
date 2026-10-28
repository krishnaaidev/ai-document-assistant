import React from 'react';
import { Sparkles, Code2, Heart } from 'lucide-react';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  return (
    <footer className={`mt-auto py-6 px-4 border-t border-neutral-200/80 bg-white/60 backdrop-blur-sm ${className}`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
        <div className="flex items-center gap-2 font-medium text-neutral-700">
          <div className="w-5 h-5 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Sparkles className="w-3 h-3 text-indigo-600" />
          </div>
          <span>Designed and developed by</span>
          <span className="font-semibold text-neutral-900 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Suman Krishna
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70 shadow-2xs">
            BRUH Vision
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-neutral-400">
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
