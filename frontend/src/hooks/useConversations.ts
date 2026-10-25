import { useState, useEffect, useCallback } from 'react';
import { Conversation, ConversationScope } from '@/types';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

export function useConversations(autoFetch: boolean = true) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getConversations();
      setConversations(data);
    } catch (err: any) {
      const msg = err.message || 'Failed to fetch conversations';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchConversations();
    }
  }, [fetchConversations, autoFetch]);

  const createConversation = async (data: {
    title?: string;
    scope: ConversationScope;
  }): Promise<Conversation> => {
    try {
      const newConv = await api.createConversation(data);
      await fetchConversations();
      return newConv;
    } catch (err: any) {
      const msg = err.message || 'Failed to create conversation';
      toast.error(msg);
      throw err;
    }
  };

  const renameConversation = async (id: string, title: string): Promise<Conversation> => {
    try {
      const updated = await api.renameConversation(id, title);
      toast.success('Conversation renamed');
      await fetchConversations();
      return updated;
    } catch (err: any) {
      const msg = err.message || 'Failed to rename conversation';
      toast.error(msg);
      throw err;
    }
  };

  const deleteConversation = async (id: string): Promise<void> => {
    try {
      await api.deleteConversation(id);
      toast.success('Conversation deleted');
      await fetchConversations();
    } catch (err: any) {
      const msg = err.message || 'Failed to delete conversation';
      toast.error(msg);
      throw err;
    }
  };

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations,
    createConversation,
    renameConversation,
    deleteConversation,
  };
}
