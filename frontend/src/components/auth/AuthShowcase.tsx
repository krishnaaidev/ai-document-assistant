import React from 'react';
import {
  Brain,
  Sparkles,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Quote,
} from 'lucide-react';

export const AuthShowcase: React.FC = () => {
  return (
    <div className="flex flex-col justify-between h-full space-y-6">
      {/* Top Brand Header */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center w-11 h-11 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 rounded-xl shadow-md shadow-indigo-500/25 text-white shrink-0">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              AI Document Assistant
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                Gemini 3.5 Flash Lite &bull; Multimodal RAG
              </span>
            </div>
          </div>
        </div>

        {/* Catchy Headline */}
        <h1 className="text-2xl xl:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug mb-3">
          Transform complex documents into{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            instant, verified answers
          </span>
          .
        </h1>

        {/* Clear Description: What is it */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          An intelligent Retrieval-Augmented Generation (RAG) platform. Index your PDFs, Word documents (.docx), and notes, then ask natural questions with exact page-level citations.
        </p>

        {/* Compact 2x2 Feature Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Multimodal Ingestion</h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Deep extraction for PDF, DOCX, and TXT files.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Quote className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Exact Citations</h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Page numbers & source snippet verification.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Instant Summaries</h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Executive briefings from 100+ pages in &lt;2s.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Private Workspaces</h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Isolated user vector namespaces & encryption.
            </p>
          </div>
        </div>

        {/* Live Assistant Mock Preview Pill */}
        <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-indigo-100 dark:border-slate-800/80 text-xs shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Sample Query Preview</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">98% Match</span>
          </div>
          <p className="text-slate-700 dark:text-slate-200 font-medium">
            &ldquo;Summarize performance results from Section 3.&rdquo;
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/40 px-2 py-1 rounded-lg">
            <FileText className="w-3 h-3 text-indigo-500" />
            <span>Technical_Spec.docx (Page 8) &bull; Verified Citation</span>
          </div>
        </div>
      </div>

      {/* Feature tags strip */}
      <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> PDF & DOCX
        </span>
        <span>&bull;</span>
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Sub-2s Latency
        </span>
        <span>&bull;</span>
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> 100% Vector Isolation
        </span>
      </div>
    </div>
  );
};
