import React from 'react';
import {
  Brain,
  Sparkles,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Zap,
  BookOpen,
  Search,
  Quote,
  Layers,
} from 'lucide-react';

export const AuthShowcase: React.FC = () => {
  return (
    <div className="flex flex-col justify-between h-full p-6 sm:p-10 lg:p-12 text-slate-900 dark:text-slate-100">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/25 text-white">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              AI Document Assistant
            </h2>
            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
              Next-Gen Multimodal RAG Platform
            </p>
          </div>
        </div>

        {/* What is it / Value Proposition */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>What is AI Document Assistant?</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
          Turn your complex documents into{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            instant, verified answers
          </span>
          .
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-8 max-w-xl">
          An intelligent Retrieval-Augmented Generation (RAG) assistant designed for researchers,
          engineers, students, and professionals. Upload PDFs, Word documents (.docx), or technical
          notes, and query them with natural language with exact page-level citations.
        </p>

        {/* Core Feature Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Multimodal Ingestion
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Directly parse PDF, DOCX, and TXT files with full text and structural extraction.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-purple-300 dark:hover:border-purple-700 transition">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
              <Quote className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Page-Accurate Citations
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Zero hallucination risk. Every response is paired with exact page snippets and source chips.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Instant AI Summaries
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Generate executive briefs, bullet points, and key takeaways from 100+ pages in seconds.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-amber-300 dark:hover:border-amber-700 transition">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Private Workspaces
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Isolated user vector namespaces and encrypted storage ensure your data remains confidential.
            </p>
          </div>
        </div>

        {/* Live Assistant Mock Preview */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-900/10 via-purple-900/10 to-slate-900/10 dark:from-slate-900/90 dark:to-[#111827] border border-indigo-100 dark:border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Powered by Gemini 3.5 Flash Lite
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              Sub-2s Latency
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 mt-0.5">
                Query
              </span>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                &ldquo;What are the primary findings in Section 4 regarding performance?&rdquo;
              </p>
            </div>

            <div className="flex items-start gap-2.5 pl-2 border-l-2 border-indigo-500/40">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 mt-0.5">
                Answer
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                The evaluation demonstrated an <strong>84% reduction in latency</strong> and <strong>99.2% retrieval accuracy</strong> using chunk embeddings with cosine similarity.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-slate-700">
                <FileText className="w-3 h-3 text-indigo-500" />
                Technical_Report.docx (Page 14) • 98% Match
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature tags footer */}
      <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-medium">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> PDF & DOCX Support
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-medium">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Instant Semantic RAG
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-medium">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Custom Collections
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-medium">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Vector Namespace Isolation
        </span>
      </div>
    </div>
  );
};
