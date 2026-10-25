import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Document, Conversation, Summary, DashboardStats } from '@/types';
import {
  FileText,
  Folder,
  MessageSquare,
  FileCheck,
  UploadCloud,
  ArrowRight,
  Clock,
  Sparkles,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { SkeletonCard, SkeletonTable } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Modal } from '@/components/common/Modal';
import { FileDropzone } from '@/components/common/FileDropzone';
import { formatFileSize, formatRelativeDate } from '@/utils/formatters';
import toast from 'react-hot-toast';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);
  const [recentSummaries, setRecentSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, docsRes, convsRes, summariesRes] = await Promise.all([
        api.getDashboardStats(),
        api.getDocuments({ page: 1, pageSize: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
        api.getConversations(),
        api.getSummaries(),
      ]);

      setStats(statsRes);
      setRecentDocs(docsRes.items);
      setRecentConversations(convsRes.slice(0, 4));
      setRecentSummaries(summariesRes.slice(0, 4));
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    try {
      await api.uploadDocument(selectedFile, undefined, (percent) => {
        setUploadProgress(percent);
      });
      toast.success('Document uploaded and queued for processing');
      setUploadModalOpen(false);
      setSelectedFile(null);
      setUploadProgress(null);
      fetchDashboardData();
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    }
  };

  if (error) {
    return (
      <div className="p-8 rounded-2xl bg-white border border-red-200 shadow-subtle text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-charcoal-900">Unable to load dashboard</h3>
        <p className="text-sm text-charcoal-500 max-w-md mx-auto">{error}</p>
        <Button variant="primary" onClick={fetchDashboardData}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Heading & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal-900">Workspace Dashboard</h1>
          <p className="text-sm text-charcoal-500">
            Welcome back! Here is an overview of your indexed knowledge base and AI sessions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            leftIcon={<MessageSquare className="w-4 h-4" />}
            onClick={() => navigate('/chat')}
          >
            Start Chat
          </Button>
          <Button
            variant="primary"
            leftIcon={<UploadCloud className="w-4 h-4" />}
            onClick={() => setUploadModalOpen(true)}
          >
            Upload Document
          </Button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <div className="p-5 rounded-xl border border-neutral-200 bg-white shadow-subtle hover:border-primary-200 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                  Total Documents
                </span>
                <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-charcoal-900">
                {stats?.totalDocuments ?? 0}
              </p>
              <div className="mt-2 flex items-center text-xs text-charcoal-500">
                <span>PDFs, DOCX, TXT files</span>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-neutral-200 bg-white shadow-subtle hover:border-secondary-200 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                  Collections
                </span>
                <div className="w-9 h-9 rounded-lg bg-teal-50 text-secondary-600 flex items-center justify-center">
                  <Folder className="w-5 h-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-charcoal-900">
                {stats?.totalCollections ?? 0}
              </p>
              <div className="mt-2 flex items-center text-xs text-charcoal-500">
                <span>Organized workspaces</span>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-neutral-200 bg-white shadow-subtle hover:border-indigo-200 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                  Conversations
                </span>
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-primary-600 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-charcoal-900">
                {stats?.totalConversations ?? 0}
              </p>
              <div className="mt-2 flex items-center text-xs text-charcoal-500">
                <span>RAG inquiry sessions</span>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-neutral-200 bg-white shadow-subtle hover:border-primary-200 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                  Summaries
                </span>
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-charcoal-900">
                {stats?.totalSummaries ?? 0}
              </p>
              <div className="mt-2 flex items-center text-xs text-charcoal-500">
                <span>Executive & bullet syntheses</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recent Documents Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-charcoal-900">Recent Documents</h2>
            <span className="text-xs text-charcoal-400">Last 5 updated</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/documents')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            View all documents
          </Button>
        </div>

        {loading ? (
          <SkeletonTable rows={4} columns={5} />
        ) : recentDocs.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-6 h-6" />}
            title="No documents yet"
            description="Upload your first PDF, DOCX, or text file to start generating AI summaries and querying answers."
            action={{
              label: 'Upload Document',
              onClick: () => setUploadModalOpen(true),
              icon: <UploadCloud className="w-4 h-4" />,
            }}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-subtle">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50/75 border-b border-neutral-200 text-xs font-medium text-charcoal-500 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">Filename</th>
                    <th scope="col" className="px-6 py-3.5">Type</th>
                    <th scope="col" className="px-6 py-3.5">Size</th>
                    <th scope="col" className="px-6 py-3.5">Status</th>
                    <th scope="col" className="px-6 py-3.5">Uploaded</th>
                    <th scope="col" className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {recentDocs.map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-neutral-50/80 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/documents/${doc.id}`)}
                    >
                      <td className="px-6 py-4 font-medium text-charcoal-900 truncate max-w-xs">
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-primary-600 shrink-0" />
                          <span className="group-hover:text-primary-600 transition-colors truncate">
                            {doc.title || doc.filename}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-charcoal-500 uppercase text-xs font-semibold">
                        {doc.fileType}
                      </td>
                      <td className="px-6 py-4 text-charcoal-500 text-xs">
                        {formatFileSize(doc.fileSize)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge status={doc.status} />
                      </td>
                      <td className="px-6 py-4 text-charcoal-400 text-xs">
                        {formatRelativeDate(doc.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/documents/${doc.id}`);
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Two Column Grid: Recent Conversations & Recent Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Conversations */}
        <div className="p-6 rounded-xl border border-neutral-200 bg-white shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary-600" />
              <h3 className="font-semibold text-charcoal-900 text-base">Recent Conversations</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/chat')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Open Chat
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 rounded-lg bg-neutral-100 animate-pulse" />
              ))}
            </div>
          ) : recentConversations.length === 0 ? (
            <div className="py-8 text-center text-xs text-charcoal-400">
              No conversations started yet. Launch an AI chat to explore your documents.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {recentConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className="py-3 px-2 rounded-lg hover:bg-neutral-50 cursor-pointer flex items-center justify-between transition-colors group"
                >
                  <div className="space-y-1 truncate pr-3">
                    <p className="text-sm font-medium text-charcoal-800 group-hover:text-primary-600 transition-colors truncate">
                      {conv.title}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-charcoal-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatRelativeDate(conv.lastMessageAt || conv.createdAt)}</span>
                      <span>•</span>
                      <span>{conv.messageCount || 0} messages</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-charcoal-300 group-hover:text-primary-600 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Summaries */}
        <div className="p-6 rounded-xl border border-neutral-200 bg-white shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-secondary-600" />
              <h3 className="font-semibold text-charcoal-900 text-base">Recent Summaries</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/summaries')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              All Summaries
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 rounded-lg bg-neutral-100 animate-pulse" />
              ))}
            </div>
          ) : recentSummaries.length === 0 ? (
            <div className="py-8 text-center text-xs text-charcoal-400">
              No summaries generated yet. Open a document to generate structured summaries.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {recentSummaries.map((summary) => (
                <div
                  key={summary.id}
                  onClick={() => navigate('/summaries')}
                  className="py-3 px-2 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-charcoal-800 truncate">
                      {summary.documentTitle || summary.documentFilename}
                    </span>
                    <Badge variant="teal" size="sm">
                      {summary.summaryType}
                    </Badge>
                  </div>
                  <p className="text-xs text-charcoal-500 line-clamp-2">
                    {summary.content.replace(/^#+ /, '')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => {
          if (uploadProgress === null) setUploadModalOpen(false);
        }}
        title="Upload Document"
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setUploadModalOpen(false)}
              disabled={uploadProgress !== null}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUploadSubmit}
              disabled={!selectedFile || uploadProgress !== null}
              loading={uploadProgress !== null}
            >
              Start Upload & Indexing
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-charcoal-500">
            Upload a document to parse sections, extract text, and calculate vector embeddings for semantic retrieval.
          </p>
          <FileDropzone
            onFileSelect={(file) => setSelectedFile(file)}
            selectedFile={selectedFile}
            onClear={() => setSelectedFile(null)}
            progress={uploadProgress}
            disabled={uploadProgress !== null}
          />
        </div>
      </Modal>
    </div>
  );
};
