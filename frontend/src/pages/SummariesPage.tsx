import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSummaries } from '@/hooks/useSummaries';
import { useDocuments } from '@/hooks/useDocuments';
import { Summary, SummaryType } from '@/types';
import {
  FileCheck,
  Sparkles,
  Trash2,
  Maximize2,
  Calendar,
  FileText,
  Filter,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonCard } from '@/components/common/Skeleton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { SUMMARY_TYPE_OPTIONS } from '@/utils/constants';
import { formatDate } from '@/utils/formatters';
import toast from 'react-hot-toast';

export const SummariesPage: React.FC = () => {
  const navigate = useNavigate();
  const { summaries, loading, generating, generateSummary, deleteSummary } = useSummaries();
  const { documents } = useDocuments({ pageSize: 100 });

  // Filters
  const [selectedDocFilter, setSelectedDocFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  // View full summary modal
  const [viewingSummary, setViewingSummary] = useState<Summary | null>(null);
  const [copied, setCopied] = useState(false);

  // Generate shortcut modal
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [targetDocId, setTargetDocId] = useState<string>('');
  const [targetSummaryType, setTargetSummaryType] = useState<SummaryType>('executive');

  // Delete confirm
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const filteredSummaries = summaries.filter((s) => {
    if (selectedDocFilter !== 'all' && s.documentId !== selectedDocFilter) return false;
    if (selectedTypeFilter !== 'all' && s.summaryType !== selectedTypeFilter) return false;
    return true;
  });

  const handleCreateSubmit = async () => {
    if (!targetDocId) {
      toast.error('Please select a document');
      return;
    }
    try {
      await generateSummary(targetDocId, targetSummaryType);
      setGenerateModalOpen(false);
      setTargetDocId('');
    } catch {
      // handled
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('Summary copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Document Summaries</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Automated executive briefs, bullet points, and key takeaways generated from your knowledge base.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Sparkles className="w-4 h-4" />}
          onClick={() => {
            if (documents.length > 0) {
              setTargetDocId(documents[0].id);
            }
            setGenerateModalOpen(true);
          }}
        >
          Generate New Summary
        </Button>
      </div>

      {/* Filter Row */}
      <div className="bg-white/90 dark:bg-[#111827]/90 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-wrap gap-3 items-center backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Filter by:</span>
        </div>

        {/* Filter Document */}
        <select
          value={selectedDocFilter}
          onChange={(e) => setSelectedDocFilter(e.target.value)}
          className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/60"
        >
          <option value="all">All Documents</option>
          {documents.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
            </option>
          ))}
        </select>

        {/* Filter Type */}
        <select
          value={selectedTypeFilter}
          onChange={(e) => setSelectedTypeFilter(e.target.value)}
          className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/60"
        >
          <option value="all">All Summary Types</option>
          {SUMMARY_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Grid of Summaries */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
      ) : filteredSummaries.length === 0 ? (
        <EmptyState
          icon={<FileCheck className="w-8 h-8" />}
          title="No summaries found"
          description={
            selectedDocFilter !== 'all' || selectedTypeFilter !== 'all'
              ? 'No summaries match your filter parameters.'
              : 'Create your first AI summary from any uploaded document.'
          }
          action={{
            label: 'Generate Summary',
            onClick: () => {
              if (documents.length > 0) setTargetDocId(documents[0].id);
              setGenerateModalOpen(true);
            },
            icon: <Sparkles className="w-4 h-4" />,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSummaries.map((summary) => (
            <div
              key={summary.id}
              className="bg-white/90 dark:bg-[#111827]/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700/60 hover:shadow-md transition-all flex flex-col justify-between backdrop-blur-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="teal" size="sm">
                    {summary.summaryType}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setViewingSummary(summary)}
                      className="p-1.5 text-charcoal-400 hover:text-charcoal-700 hover:bg-neutral-100 rounded-md transition-colors"
                      title="Expand View"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(summary.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                      title="Delete Summary"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                    {summary.documentTitle || summary.documentFilename}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {formatDate(summary.createdAt)}
                  </p>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-4 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  {summary.content.replace(/^#+ /, '')}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {summary.keyPoints?.length || 0} key points
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewingSummary(summary)}
                >
                  Read Full
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expanded Summary Modal */}
      {viewingSummary && (
        <Modal
          isOpen={true}
          onClose={() => setViewingSummary(null)}
          title={
            <div className="flex items-center gap-2">
              <span className="truncate max-w-sm">
                {viewingSummary.documentTitle || viewingSummary.documentFilename}
              </span>
              <Badge variant="indigo" size="sm">
                {viewingSummary.summaryType}
              </Badge>
            </div>
          }
          size="lg"
          footer={
            <div className="flex justify-between w-full items-center">
              <span className="text-xs text-charcoal-400">
                Created: {formatDate(viewingSummary.createdAt)}
              </span>
              <Button
                variant="outline"
                size="sm"
                leftIcon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                onClick={() => handleCopy(viewingSummary.content)}
              >
                {copied ? 'Copied' : 'Copy Content'}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-xs text-charcoal-800 whitespace-pre-wrap leading-relaxed">
              {viewingSummary.content}
            </div>

            {viewingSummary.keyPoints && viewingSummary.keyPoints.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-2">
                  Key Takeaways
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-charcoal-600">
                  {viewingSummary.keyPoints.map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Generate Shortcut Modal */}
      <Modal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        title="Generate New Summary"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setGenerateModalOpen(false)} disabled={generating}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateSubmit}
              loading={generating}
              rightIcon={<Sparkles className="w-4 h-4" />}
            >
              Generate
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
              Select Document
            </label>
            <select
              value={targetDocId}
              onChange={(e) => setTargetDocId(e.target.value)}
              className="w-full text-xs bg-white border border-neutral-200 rounded-lg p-2.5 text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
              Summary Structure
            </label>
            <div className="space-y-2">
              {SUMMARY_TYPE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  onClick={() => setTargetSummaryType(opt.value as SummaryType)}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    targetSummaryType === opt.value
                      ? 'border-primary-500 bg-primary-50/50'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="summaryTypeChoice"
                    value={opt.value}
                    checked={targetSummaryType === opt.value}
                    onChange={() => setTargetSummaryType(opt.value as SummaryType)}
                    className="mt-1 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <p className="text-xs font-semibold text-charcoal-900">{opt.label}</p>
                    <p className="text-[11px] text-charcoal-500">{opt.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={async () => {
          if (deleteTargetId) {
            await deleteSummary(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        title="Delete Summary"
        message="Are you sure you want to permanently delete this summary?"
        confirmLabel="Delete Summary"
        variant="danger"
      />
    </div>
  );
};
