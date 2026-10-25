import { useState, useEffect, useCallback } from 'react';
import { Document, PaginatedResponse } from '@/types';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

interface UseDocumentsOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  fileType?: string;
  collectionId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  autoFetch?: boolean;
}

export function useDocuments(options: UseDocumentsOptions = {}) {
  const {
    page = 1,
    pageSize = 10,
    search = '',
    status = 'all',
    fileType = 'all',
    collectionId = 'all',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    autoFetch = true,
  } = options;

  const [data, setData] = useState<PaginatedResponse<Document>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getDocuments({
        page,
        pageSize,
        search,
        status,
        fileType,
        collectionId,
        sortBy,
        sortOrder,
      });
      setData(response);
    } catch (err: any) {
      const message = err.message || 'Failed to fetch documents';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, status, fileType, collectionId, sortBy, sortOrder]);

  useEffect(() => {
    if (autoFetch) {
      fetchDocuments();
    }
  }, [fetchDocuments, autoFetch]);

  const uploadDocument = async (file: File, targetCollectionId?: string): Promise<Document> => {
    setUploadProgress(0);
    try {
      const newDoc = await api.uploadDocument(file, targetCollectionId, (pct) => {
        setUploadProgress(pct);
      });
      toast.success(`"${file.name}" uploaded successfully`);
      await fetchDocuments();
      return newDoc;
    } catch (err: any) {
      const message = err.message || 'Failed to upload document';
      toast.error(message);
      throw err;
    } finally {
      setUploadProgress(null);
    }
  };

  const deleteDocument = async (id: string): Promise<void> => {
    try {
      await api.deleteDocument(id);
      toast.success('Document deleted successfully');
      await fetchDocuments();
    } catch (err: any) {
      const message = err.message || 'Failed to delete document';
      toast.error(message);
      throw err;
    }
  };

  const retryDocument = async (id: string): Promise<Document> => {
    try {
      const updated = await api.retryDocument(id);
      toast.success('Processing re-queued for document');
      await fetchDocuments();
      return updated;
    } catch (err: any) {
      const message = err.message || 'Failed to retry processing';
      toast.error(message);
      throw err;
    }
  };

  return {
    documents: data.items,
    total: data.total,
    totalPages: data.totalPages,
    currentPage: data.page,
    loading,
    error,
    uploadProgress,
    refetch: fetchDocuments,
    uploadDocument,
    deleteDocument,
    retryDocument,
  };
}
