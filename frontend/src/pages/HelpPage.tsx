import React, { useState } from 'react';
import {
  HelpCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileText,
  Keyboard,
  Send,
  Sparkles,
  Search,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import toast from 'react-hot-toast';

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: 'How does Retrieval-Augmented Generation (RAG) work in this app?',
    answer:
      'When you upload a document, our backend splits it into semantic chunks and creates high-dimensional vector embeddings using all-MiniLM-L6-v2. When you ask a question in AI Chat, relevant chunks are retrieved via hybrid vector similarity search in Pinecone and provided as grounding context to Gemini 1.5 Flash.',
  },
  {
    question: 'Are my document sources cited in the chat answers?',
    answer:
      'Yes! Every generated response includes citation chips displaying the source document name, page number, and retrieval confidence score. Clicking on a citation reveals the exact text excerpt retrieved from the file.',
  },
  {
    question: 'Can I chat across multiple documents at once?',
    answer:
      'Absolutely. You can change the Target Scope at the top of the AI Chat page to "All Documents" to search across your entire workspace, or create a "Collection" to query a curated set of related documents.',
  },
  {
    question: 'What happens if a document fails processing?',
    answer:
      'If parsing encounters encrypted PDFs or corrupted formatting, the document status will show "Failed". You can click the "Retry" button on the document row to re-trigger the ingestion job.',
  },
  {
    question: 'What is the maximum file size supported?',
    answer:
      'Currently, files up to 20MB are supported for upload. Supported formats are PDF, Microsoft Word (.docx), and Plain Text (.txt).',
  },
];

export const HelpPage: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [feedback, setFeedback] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setSendingFeedback(true);
    setTimeout(() => {
      setSendingFeedback(false);
      setFeedback('');
      toast.success('Thank you! Your feedback has been submitted.');
    }, 600);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Help & Documentation</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Learn how to get the most out of DocAssistant AI, explore FAQs, and master keyboard shortcuts.
        </p>
      </div>

      {/* Getting Started Guide */}
      <div className="bg-white/90 dark:bg-[#111827]/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Getting Started Guide</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              1
            </div>
            <h3 className="font-semibold text-xs text-slate-900 dark:text-white">Upload Files</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Drop PDFs, Word documents, or text files up to 20MB. The system automatically segments and indexes them into vector chunks.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              2
            </div>
            <h3 className="font-semibold text-xs text-slate-900 dark:text-white">Organize Collections</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Group related reports, research papers, or contract sets into collections for focused multi-document querying.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              3
            </div>
            <h3 className="font-semibold text-xs text-slate-900 dark:text-white">Chat & Summarize</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Ask natural language questions to retrieve accurate answers with cited excerpts, or generate executive summaries in seconds.
            </p>
          </div>
        </div>
      </div>

      {/* Supported File Formats */}
      <div className="bg-white/90 dark:bg-[#111827]/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Supported Formats</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 border border-slate-200/80 dark:border-slate-800 rounded-xl bg-slate-50/60 dark:bg-slate-900/60">
            <span className="font-semibold text-slate-900 dark:text-white block mb-1">PDF (.pdf)</span>
            <span className="text-slate-500 dark:text-slate-400">
              Scanned text, OCR documents, multi-page financial statements, whitepapers.
            </span>
          </div>
          <div className="p-3.5 border border-slate-200/80 dark:border-slate-800 rounded-xl bg-slate-50/60 dark:bg-slate-900/60">
            <span className="font-semibold text-slate-900 dark:text-white block mb-1">Word (.docx)</span>
            <span className="text-slate-500 dark:text-slate-400">
              Modern Microsoft Word documents with structured headings and tables.
            </span>
          </div>
          <div className="p-3.5 border border-slate-200/80 dark:border-slate-800 rounded-xl bg-slate-50/60 dark:bg-slate-900/60">
            <span className="font-semibold text-slate-900 dark:text-white block mb-1">Text (.txt)</span>
            <span className="text-slate-500 dark:text-slate-400">
              UTF-8 plain text files, logs, notes, transcripts, and markdown memos.
            </span>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="bg-white/90 dark:bg-[#111827]/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Keyboard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Keyboard Shortcuts</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800">
            <span className="text-slate-600 dark:text-slate-300">Send chat message</span>
            <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded shadow-xs font-mono font-semibold text-[10px]">
              Enter
            </kbd>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800">
            <span className="text-slate-600 dark:text-slate-300">Insert new line in chat</span>
            <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded shadow-xs font-mono font-semibold text-[10px]">
              Shift + Enter
            </kbd>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800">
            <span className="text-slate-600 dark:text-slate-300">Close open dialog / modal</span>
            <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded shadow-xs font-mono font-semibold text-[10px]">
              Escape
            </kbd>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800">
            <span className="text-slate-600 dark:text-slate-300">Focus search field</span>
            <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded shadow-xs font-mono font-semibold text-[10px]">
              /
            </kbd>
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="bg-white/90 dark:bg-[#111827]/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div key={index} className="py-3.5">
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="flex items-center justify-between w-full text-left font-medium text-xs text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-sm">{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 ml-2" />
                  )}
                </button>
                {isOpen && (
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-1 pr-4">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact & Feedback Section */}
      <div className="bg-white/90 dark:bg-[#111827]/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4 backdrop-blur-sm">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Send Feedback or Feature Request</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Have ideas to improve retrieval accuracy or new features you would love to see? Let our engineering team know.
        </p>

        <form onSubmit={handleSendFeedback} className="space-y-3 max-w-lg">
          <textarea
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Tell us what you think or report an issue..."
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 p-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/60"
            required
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={sendingFeedback}
            rightIcon={<Send className="w-3.5 h-3.5" />}
          >
            Submit Feedback
          </Button>
        </form>
      </div>
    </div>
  );
};

export default HelpPage;
