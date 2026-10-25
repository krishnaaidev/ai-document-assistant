import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocuments } from '@/hooks/useDocuments';
import { useCollections } from '@/hooks/useCollections';
import {
  FileText,
  UploadCloud,
  RotateCw,
  Trash2,
  ExternalLink,
  MessageSquare,
  Filter,
  ArrowUpDown,
  FileCode,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { SearchBar } from '@/components/common/SearchBar';
import { Modal } from '@/components/common/Modal';
import { FileDropzone } from '@/components/common/FileDropzone';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/Skeleton';
import { formatFileSize, formatRelativeDate } from '@/utils/formatters';
import { Document } from '@/types';

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [collectionFilter, setCollectionFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Collections for filter dropdown
  const { collections } = useCollections();

  // Documents Hook
  const {
    documents,
    total,
    totalPages,
    currentPage,
    loading,
    uploadProgress,
    uploadDocument,
    deleteDocument,
    retryDocument,
    refetch,
  } = useDocuments({
    page,
    pageSize: 10,
    search,
    status: statusFilter,
    fileType: typeFilter,
    collectionId: collectionFilter,
    sortBy,
    sortOrder,
  });

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');

  // Delete dialog state
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    try {
      await uploadDocument(selectedFile, selectedCollectionId || undefined);
      setUploadModalOpen(false);
      setSelectedFile(null);
      setSelectedCollectionId('');
    } catch {
      // handled by hook
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmDoc) return;
    setDeleting(true);
    try {
      await deleteDocument(deleteConfirmDoc.id);
      setDeleteConfirmDoc(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleRetry = async (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    await retryDocument(doc.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal-900">My Documents</h1>
          <p className="text-sm text-charcoal-500">
            Manage your parsed documents, vector embeddings, and ingestion statuses.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<UploadCloud className="w-4 h-4" />}
          onClick={() => setUploadModalOpen(true)}
        >
          Upload Document
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-subtle space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <SearchBar
              value={search}
              onSearch={(q) => {
                setSearch(q);
                setPage(1);
              }}
              placeholder="Search by title or filename..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-white border border-neutral-200 rounded-lg px-3 py-2 text-charcoal-700 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="uploaded">Uploaded</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-white border border-neutral-200 rounded-lg px-3 py-2 text-charcoal-700 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="all">All File Types</option>
              <option value="pdf">PDF</option>
              <option value="docx">Word (.docx)</option>
              <option value="txt">Text (.txt)</option>
            </select>

            {/* Collection Filter */}
            <select
              value={collectionFilter}
              onChange={(e) => {
                setCollectionFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-white border border-neutral-200 rounded-lg px-3 py-2 text-charcoal-700 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="all">All Collections</option>
              {collections.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name}
                </option>
              ))}
            </select>

            {/* Sort Order */}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowUpDown className="w-3.5 h-3.5" />}
              onClick={() => {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}
            >
              {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
            </Button>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      {loading ? (
        <SkeletonTable rows={6} columns={6} />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8" />}
          title="No documents found"
          description={
            search || statusFilter !== 'all' || typeFilter !== 'all' || collectionFilter !== 'all'
              ? 'No documents match your active filters. Try adjusting your search criteria.'
              : 'You have not uploaded any documents to this workspace yet.'
          }
          action={{
            label: 'Upload New Document',
            onClick: () => setUploadModalOpen(true),
            icon: <UploadCloud className="w-4 h-4" />,
          }}
        />
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50/75 border-b border-neutral-200 text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Document</th>
                  <th scope="col" className="px-6 py-3.5">Format</th>
                  <th scope="col" className="px-6 py-3.5">Size</th>
                  <th scope="col" className="px-6 py-3.5">Status</th>
                  <th scope="col" className="px-6 py-3.5">Date Added</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => navigate(`/documents/${doc.id}`)}
                    className="hover:bg-neutral-50/70 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-medium text-charcoal-900 max-w-sm truncate">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 group-hover:bg-primary-100 transition-colors">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-charcoal-900 truncate group-hover:text-primary-600 transition-colors">
                            {doc.title || doc.filename}
                          </p>
                          <p className="text-xs text-charcoal-400 truncate">{doc.filename}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold uppercase text-charcoal-500">
                      {doc.fileType}
                    </td>
                    <td className="px-6 py-4 text-xs text-charcoal-500">
                      {formatFileSize(doc.fileSize)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={doc.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-charcoal-400">
                      {formatRelativeDate(doc.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {doc.status === 'failed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<RotateCw className="w-3.5 h-3.5" />}
                            onClick={(e) => handleRetry(doc, e)}
                          >
                            Retry
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate('/chat', {
                              state: {
                                initialScope: { type: 'document', documentId: doc.id },
                              },
                            })
                          }
                          title="Chat with document"
                        >
                          <MessageSquare className="w-4 h-4 text-primary-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmDoc(doc)}
                          title="Delete document"
                        >
                          <Trash2 className="w-4 h-4 text-charcoal-400 hover:text-red-600 transition-colors" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={total}
            pageSize={10}
            onPageChange={(p) => setPage(p)}
            className="border-t border-neutral-100"
          />
        </div>
      )}

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
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
              Assign to Collection (Optional)
            </label>
            <select
              value={selectedCollectionId}
              onChange={(e) => setSelectedCollectionId(e.target.value)}
              className="w-full text-sm bg-white border border-neutral-200 rounded-lg px-3 py-2 text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-primary-100"
              disabled={uploadProgress !== null}
            >
              <option value="">No collection (General workspace)</option>
              {collections.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name}
                </option>
              ))}
            </select>
          </div>

          <FileDropzone
            onFileSelect={(file) => setSelectedFile(file)}
            selectedFile={selectedFile}
            onClear={() => setSelectedFile(null)}
            progress={uploadProgress}
            disabled={uploadProgress !== null}
          />
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmDoc !== null}
        onClose={() => setDeleteConfirmDoc(null)}
        onConfirm={handleDelete}
        title="Delete Document"
        message={`Are you sure you want to permanently delete "${deleteConfirmDoc?.title || deleteConfirmDoc?.filename}"? This will remove its vector embeddings and associated chat context.`}
        confirmLabel="Delete Document"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
};
