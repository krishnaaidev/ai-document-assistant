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
  RotateCw,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Modal } from '@/components/common/Modal';
import { FileDropzone } from '@/components/common/FileDropzone';
import { formatFileSize, formatRelativeDate } from '@/utils/formatters';
import toast from 'react-hot-toast';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Instant optimistic workspace state (0ms latency, zero skeleton freeze)
  const [stats, setStats] = useState<DashboardStats>(() => {
    try {
      const cached = sessionStorage.getItem('dashboard_stats_cache');
      if (cached) return JSON.parse(cached);
    } catch {}
    return {
      totalDocuments: 0,
      totalCollections: 0,
      totalConversations: 0,
      totalSummaries: 0,
    };
  });

  const [recentDocs, setRecentDocs] = useState<Document[]>(() => {
    try {
      const cached = sessionStorage.getItem('dashboard_recent_docs_cache');
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });

  const [recentConversations, setRecentConversations] = useState<Conversation[]>(() => {
    try {
      const cached = sessionStorage.getItem('dashboard_recent_convs_cache');
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });

  const [recentSummaries, setRecentSummaries] = useState<Summary[]>(() => {
    try {
      const cached = sessionStorage.getItem('dashboard_recent_sums_cache');
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const results = await Promise.allSettled([
        api.getDashboardStats(),
        api.getDocuments({ page: 1, pageSize: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
        api.getConversations(),
        api.getSummaries(),
      ]);

      if (results[0].status === 'fulfilled') {
        setStats(results[0].value);
        try {
          sessionStorage.setItem('dashboard_stats_cache', JSON.stringify(results[0].value));
        } catch {}
      }
      if (results[1].status === 'fulfilled') {
        const docs = results[1].value.items || [];
        setRecentDocs(docs);
        try {
          sessionStorage.setItem('dashboard_recent_docs_cache', JSON.stringify(docs));
        } catch {}
      }
      if (results[2].status === 'fulfilled') {
        const convs = (results[2].value || []).slice(0, 4);
        setRecentConversations(convs);
        try {
          sessionStorage.setItem('dashboard_recent_convs_cache', JSON.stringify(convs));
        } catch {}
      }
      if (results[3].status === 'fulfilled') {
        const sums = (results[3].value || []).slice(0, 4);
        setRecentSummaries(sums);
        try {
          sessionStorage.setItem('dashboard_recent_sums_cache', JSON.stringify(sums));
        } catch {}
      }
    } catch (err) {
      console.warn('Dashboard background sync note:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    try {
      setUploadProgress(15);
      const uploaded = await api.uploadDocument(selectedFile, undefined, (percent) => {
        setUploadProgress(percent);
      });
      toast.success(`"${selectedFile.name}" uploaded successfully!`);
      setUploadModalOpen(false);
      setSelectedFile(null);
      if (uploaded) {
        setRecentDocs((prev) => [uploaded, ...prev.filter((d) => d.id !== uploaded.id)].slice(0, 5));
        setStats((prev) => ({ ...prev, totalDocuments: prev.totalDocuments + 1 }));
      }
      fetchDashboardData();
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadProgress(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Heading & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Workspace Dashboard</h1>
            {isRefreshing && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                <RotateCw className="w-3 h-3 animate-spin" />
                Syncing
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
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
        <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-sm shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Documents
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-center transition-transform group-hover:scale-105">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {stats?.totalDocuments ?? 0}
          </p>
          <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
            <span>PDFs, DOCX, TXT files</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-sm shadow-xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700/60 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Collections
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center transition-transform group-hover:scale-105">
              <Folder className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {stats?.totalCollections ?? 0}
          </p>
          <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
            <span>Organized workspaces</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-sm shadow-xs hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700/60 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Conversations
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/50 flex items-center justify-center transition-transform group-hover:scale-105">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {stats?.totalConversations ?? 0}
          </p>
          <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
            <span>RAG inquiry sessions</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-sm shadow-xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700/60 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Summaries
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50 flex items-center justify-center transition-transform group-hover:scale-105">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {stats?.totalSummaries ?? 0}
          </p>
          <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
            <span>Executive & bullet syntheses</span>
          </div>
        </div>
      </div>

      {/* Recent Documents Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Recent Documents</h2>
            <span className="text-xs text-slate-400 dark:text-slate-500">Last 5 updated</span>
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

        {recentDocs.length === 0 ? (
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
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-sm shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">Filename</th>
                    <th scope="col" className="px-6 py-3.5">Type</th>
                    <th scope="col" className="px-6 py-3.5">Size</th>
                    <th scope="col" className="px-6 py-3.5">Status</th>
                    <th scope="col" className="px-6 py-3.5">Uploaded</th>
                    <th scope="col" className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentDocs.map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/documents/${doc.id}`)}
                    >
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white truncate max-w-xs">
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                            {doc.title || doc.filename}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 uppercase text-xs font-semibold">
                        {doc.fileType}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                        {formatFileSize(doc.fileSize)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge status={doc.status} />
                      </td>
                      <td className="px-6 py-4 text-slate-400 dark:text-slate-500 text-xs">
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
        <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-sm shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">Recent Conversations</h3>
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

          {recentConversations.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
              No conversations started yet. Launch an AI chat to explore your documents.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className="py-3 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition-colors group"
                >
                  <div className="space-y-1 truncate pr-3">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                      {conv.title}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatRelativeDate(conv.lastMessageAt || conv.createdAt)}</span>
                      <span>•</span>
                      <span>{conv.messageCount || 0} messages</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Summaries */}
        <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-sm shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">Recent Summaries</h3>
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

          {recentSummaries.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
              No summaries generated yet. Open a document to generate structured summaries.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentSummaries.map((summary) => (
                <div
                  key={summary.id}
                  onClick={() => navigate('/summaries')}
                  className="py-3 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {summary.documentTitle || summary.documentFilename}
                    </span>
                    <Badge variant="teal" size="sm">
                      {summary.summaryType}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
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
