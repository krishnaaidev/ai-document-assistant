import { useState, useEffect, useCallback } from 'react';
import { Summary, SummaryType } from '@/types';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

export function useSummaries(documentId?: string, autoFetch: boolean = true) {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummaries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSummaries(documentId);
      setSummaries(data);
    } catch (err: any) {
      const msg = err.message || 'Failed to fetch summaries';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    if (autoFetch) {
      fetchSummaries();
    }
  }, [fetchSummaries, autoFetch]);

  const generateSummary = async (docId: string, summaryType: SummaryType): Promise<Summary> => {
    setGenerating(true);
    try {
      const newSummary = await api.createSummary(docId, summaryType);
      toast.success('Summary generated successfully');
      await fetchSummaries();
      return newSummary;
    } catch (err: any) {
      const msg = err.message || 'Failed to generate summary';
      toast.error(msg);
      throw err;
    } finally {
      setGenerating(false);
    }
  };

  const deleteSummary = async (id: string): Promise<void> => {
    try {
      await api.deleteSummary(id);
      toast.success('Summary deleted');
      await fetchSummaries();
    } catch (err: any) {
      const msg = err.message || 'Failed to delete summary';
      toast.error(msg);
      throw err;
    }
  };

  return {
    summaries,
    loading,
    generating,
    error,
    refetch: fetchSummaries,
    generateSummary,
    deleteSummary,
  };
}
