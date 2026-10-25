import { useState, useEffect, useCallback } from 'react';
import { Collection } from '@/types';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

export function useCollections(autoFetch: boolean = true) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCollections();
      setCollections(data);
    } catch (err: any) {
      const msg = err.message || 'Failed to fetch collections';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchCollections();
    }
  }, [fetchCollections, autoFetch]);

  const createCollection = async (data: { name: string; description?: string }): Promise<Collection> => {
    try {
      const newCol = await api.createCollection(data);
      toast.success(`Collection "${newCol.name}" created`);
      await fetchCollections();
      return newCol;
    } catch (err: any) {
      const msg = err.message || 'Failed to create collection';
      toast.error(msg);
      throw err;
    }
  };

  const updateCollection = async (
    id: string,
    data: { name: string; description?: string }
  ): Promise<Collection> => {
    try {
      const updated = await api.updateCollection(id, data);
      toast.success('Collection updated');
      await fetchCollections();
      return updated;
    } catch (err: any) {
      const msg = err.message || 'Failed to update collection';
      toast.error(msg);
      throw err;
    }
  };

  const deleteCollection = async (id: string): Promise<void> => {
    try {
      await api.deleteCollection(id);
      toast.success('Collection deleted');
      await fetchCollections();
    } catch (err: any) {
      const msg = err.message || 'Failed to delete collection';
      toast.error(msg);
      throw err;
    }
  };

  const addDocumentToCollection = async (
    collectionId: string,
    documentId: string
  ): Promise<void> => {
    try {
      await api.addDocumentToCollection(collectionId, documentId);
      toast.success('Document added to collection');
      await fetchCollections();
    } catch (err: any) {
      const msg = err.message || 'Failed to add document to collection';
      toast.error(msg);
      throw err;
    }
  };

  const removeDocumentFromCollection = async (
    collectionId: string,
    documentId: string
  ): Promise<void> => {
    try {
      await api.removeDocumentFromCollection(collectionId, documentId);
      toast.success('Document removed from collection');
      await fetchCollections();
    } catch (err: any) {
      const msg = err.message || 'Failed to remove document from collection';
      toast.error(msg);
      throw err;
    }
  };

  return {
    collections,
    loading,
    error,
    refetch: fetchCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    addDocumentToCollection,
    removeDocumentFromCollection,
  };
}
