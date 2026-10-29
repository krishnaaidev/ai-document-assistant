import { useState, useEffect, useCallback } from 'react';
import { Message, ConversationScope } from '@/types';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

export function useChat(initialConversationId?: string, initialScope?: ConversationScope) {
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingMessages, setFetchingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<ConversationScope>(
    initialScope || { type: 'all' }
  );

  // Update conversationId if initialConversationId changes
  useEffect(() => {
    setConversationId(initialConversationId);
  }, [initialConversationId]);

  // Fetch messages when conversationId changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setFetchingMessages(true);
    api
      .getMessages(conversationId)
      .then((msgs) => {
        if (isMounted) {
          setMessages((prev) => {
            if (msgs && msgs.length > 0) {
              return msgs;
            }
            if (prev.length > 0 && (!prev[0].conversationId || prev[0].conversationId === conversationId)) {
              return prev;
            }
            return [];
          });
        }
      })
      .catch((err) => {
        if (isMounted) {
          const msg = err.message || 'Failed to load messages';
          setError(msg);
        }
      })
      .finally(() => {
        if (isMounted) setFetchingMessages(false);
      });

    return () => {
      isMounted = false;
    };
  }, [conversationId]);

  const sendMessage = useCallback(
    async (content: string, customScope?: ConversationScope) => {
      if (!content.trim() || loading) return;

      const activeScope = customScope || scope;

      // Optimistic user message
      const tempUserMsg: Message = {
        id: 'temp-u-' + Date.now(),
        conversationId: conversationId || '',
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempUserMsg]);
      setLoading(true);
      setError(null);

      try {
        const response = await api.sendMessage({
          conversationId,
          message: content,
          scope: activeScope,
        });

        // If this was a new conversation, update conversationId
        if (!conversationId && response.conversationId) {
          setConversationId(response.conversationId);
        }

        // Replace temp or append assistant response
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
          return [
            ...filtered,
            { ...tempUserMsg, conversationId: response.conversationId },
            response.message,
          ];
        });

        return response;
      } catch (err: any) {
        const msg = err.message || 'Failed to send message';
        setError(msg);
        toast.error(msg);
        // Remove optimistic message if failed
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [conversationId, scope, loading]
  );

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    conversationId,
    setConversationId,
    messages,
    loading,
    fetchingMessages,
    error,
    scope,
    setScope,
    sendMessage,
    clearMessages,
  };
}
