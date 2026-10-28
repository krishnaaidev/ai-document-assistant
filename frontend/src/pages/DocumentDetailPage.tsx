import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useSummaries } from '@/hooks/useSummaries';
import { Document, Summary, SummaryType } from '@/types';
import {
  FileText,
  ArrowLeft,
  MessageSquare,
  Sparkles,
  Download,
  Trash2,
  RotateCw,
  Search,
  BookOpen,
  Calendar,
  Layers,
  FileCheck,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Modal } from '@/components/common/Modal';
import { SkeletonText } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { formatFileSize, formatDate, formatRelativeDate } from '@/utils/formatters';
import { SUMMARY_TYPE_OPTIONS } from '@/utils/constants';
import toast from 'react-hot-toast';

export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [document, setDocument] = useState<Document | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [loadingText, setLoadingText] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'text' | 'summaries'>('overview');
  const [textSearch, setTextSearch] = useState('');
  const [copiedText, setCopiedText] = useState(false);

  // Summaries hook
  const {
    summaries,
    generating,
    generateSummary,
    deleteSummary,
  } = useSummaries(id, true);

  // Modals & Dialogs
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [selectedSummaryType, setSelectedSummaryType] = useState<SummaryType>('brief');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchDoc = async () => {
      setLoadingDoc(true);
      try {
        const doc = await api.getDocument(id);
        setDocument(doc);
      } catch (err: any) {
        toast.error(err.message || 'Failed to load document details');
      } finally {
        setLoadingDoc(false);
      }
    };
    fetchDoc();
  }, [id]);

  useEffect(() => {
    if (!id || activeTab !== 'text' || extractedText) return;
    const fetchText = async () => {
      setLoadingText(true);
      try {
        const res = await api.getDocumentText(id);
        setExtractedText(res.text);
      } catch (err: any) {
        toast.error(err.message || 'Failed to load extracted text');
      } finally {
        setLoadingText(false);
      }
    };
    fetchText();
  }, [id, activeTab, extractedText]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await api.deleteDocument(id);
      toast.success('Document deleted');
      navigate('/documents');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async () => {
    if (!id) return;
    try {
      const url = await api.getDocumentDownloadUrl(id);
      if (url && url !== '#') {
        window.open(url, '_blank');
      } else {
        toast('Download URL generated: simulating direct document download.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate download URL');
    }
  };

  const handleCreateSummary = async () => {
    if (!id) return;
    try {
      await generateSummary(id, selectedSummaryType);
      setSummaryModalOpen(false);
      setActiveTab('summaries');
    } catch {
      // error handled in hook
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedText(false), 2000);
  };

  if (loadingDoc) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse" />
        <div className="h-40 bg-white rounded-xl border border-neutral-200 p-6 animate-pulse" />
      </div>
    );
  }

  if (!document) {
    return (
      <EmptyState
        icon={<AlertCircle className="w-8 h-8" />}
        title="Document Not Found"
        description="The requested document could not be retrieved or has been removed."
        action={{
          label: 'Back to Documents',
          onClick: () => navigate('/documents'),
          icon: <ArrowLeft className="w-4 h-4" />,
        }}
      />
    );
  }

  // Filter text chunks if search is used
  const filteredText = textSearch
    ? extractedText
        .split('\n\n')
        .filter((block) => block.toLowerCase().includes(textSearch.toLowerCase()))
        .join('\n\n')
    : extractedText;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/documents')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to all documents
        </button>
      </div>

      {/* Document Header Card */}
      <div className="bg-white/90 dark:bg-[#111827]/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-6 space-y-4 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{document.title}</h1>
                <Badge status={document.status} />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{document.filename}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<MessageSquare className="w-4 h-4" />}
              onClick={() =>
                navigate('/chat', {
                  state: {
                    initialScope: { type: 'document', documentId: document.id },
                  },
                })
              }
            >
              Open in Chat
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Sparkles className="w-4 h-4" />}
              onClick={() => setSummaryModalOpen(true)}
            >
              Generate Summary
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleDownload}
            >
              Download
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Trash2 className="w-4 h-4 text-red-500" />}
              onClick={() => setDeleteConfirmOpen(true)}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 dark:text-slate-500 block mb-0.5">File Size</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{formatFileSize(document.fileSize)}</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Total Pages</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{document.pageCount ?? 1} pages</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Vector Chunks</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{document.chunkCount ?? 0} indexed</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Uploaded</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(document.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-6 text-sm">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-3 font-medium transition-colors border-b-2 -mb-px cursor-pointer ${
            activeTab === 'overview'
              ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Overview & Insights
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('text')}
          className={`pb-3 font-medium transition-colors border-b-2 -mb-px cursor-pointer ${
            activeTab === 'text'
              ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Extracted Content
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('summaries')}
          className={`pb-3 font-medium transition-colors border-b-2 -mb-px cursor-pointer ${
            activeTab === 'summaries'
              ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Summaries ({summaries.length})
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Document Overview</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                This document has been parsed and segmented into semantic vector chunks for RAG question-answering. You can initiate natural language queries against its contents or create automated summaries across varying levels of detail.
              </p>
              {document.errorMessage && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Processing Error: {document.errorMessage}</span>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Suggested Questions</h3>
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="space-y-2">
                {[
                  `Summarize the key objectives of ${document.title}`,
                  'What are the core conclusions or outcomes discussed?',
                  'Extract any dates, metrics, or financial targets mentioned.',
                ].map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      navigate('/chat', {
                        state: {
                          initialPrompt: q,
                          initialScope: { type: 'document', documentId: document.id },
                        },
                      })
                    }
                    className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors text-xs text-slate-700 dark:text-slate-300 font-medium flex items-center justify-between group cursor-pointer"
                  >
                    <span>{q}</span>
                    <ArrowLeft className="w-3.5 h-3.5 rotate-180 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Quick Ingestion Stats</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 dark:text-slate-500">Embedding Model</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">text-embedding-3</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 dark:text-slate-500">Chunk Strategy</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">512 tokens / 64 overlap</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 dark:text-slate-500">Vector Storage</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Pinecone DB</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400 dark:text-slate-500">Last Synced</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{formatRelativeDate(document.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'text' && (
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search extracted text..."
                value={textSearch}
                onChange={(e) => setTextSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D131F] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <Button
              variant="outline"
              size="sm"
              leftIcon={copiedText ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              onClick={() => copyToClipboard(extractedText)}
            >
              {copiedText ? 'Copied' : 'Copy All Text'}
            </Button>
          </div>

          {loadingText ? (
            <SkeletonText lines={10} />
          ) : (
            <div className="p-4 rounded-lg bg-slate-50/70 dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300 max-h-[500px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {filteredText || 'No text extracted for this document.'}
            </div>
          )}
        </div>
      )}

      {activeTab === 'summaries' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generated summaries for this document across multiple formats
            </p>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Sparkles className="w-4 h-4" />}
              onClick={() => setSummaryModalOpen(true)}
            >
              New Summary
            </Button>
          </div>

          {summaries.length === 0 ? (
            <EmptyState
              icon={<FileCheck className="w-8 h-8" />}
              title="No summaries yet"
              description="Generate executive summaries, bullet points, or detailed analyses with one click."
              action={{
                label: 'Generate Summary',
                onClick: () => setSummaryModalOpen(true),
                icon: <Sparkles className="w-4 h-4" />,
              }}
            />
          ) : (
            <div className="space-y-4">
              {summaries.map((s) => (
                <div
                  key={s.id}
                  className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="indigo" size="sm">
                        {s.summaryType}
                      </Badge>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {formatDate(s.createdAt)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSummary(s.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                    </Button>
                  </div>

                  <div className="prose prose-sm text-slate-800 dark:text-slate-200 text-xs leading-relaxed whitespace-pre-wrap">
                    {s.content}
                  </div>

                  {s.keyPoints && s.keyPoints.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">Key Takeaways:</p>
                      <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                        {s.keyPoints.map((point, i) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary Generation Modal */}
      <Modal
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        title="Generate Document Summary"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSummaryModalOpen(false)} disabled={generating}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateSummary}
              loading={generating}
              rightIcon={<Sparkles className="w-4 h-4" />}
            >
              Generate Summary
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Choose the format and structure for your AI-generated synthesis:
          </p>
          <div className="grid grid-cols-1 gap-2.5">
            {SUMMARY_TYPE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                onClick={() => setSelectedSummaryType(opt.value as SummaryType)}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedSummaryType === opt.value
                    ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 dark:border-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="summaryType"
                  value={opt.value}
                  checked={selectedSummaryType === opt.value}
                  onChange={() => setSelectedSummaryType(opt.value as SummaryType)}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{opt.label}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Document"
        message={`Are you sure you want to delete "${document.title}"? This action cannot be undone.`}
        confirmLabel="Delete Document"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
};
