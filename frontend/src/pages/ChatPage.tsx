import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useConversations } from '@/hooks/useConversations';
import { useChat } from '@/hooks/useChat';
import { useDocuments } from '@/hooks/useDocuments';
import { useCollections } from '@/hooks/useCollections';
import { ConversationScope, ScopeType, Citation } from '@/types';
import {
  MessageSquare,
  Plus,
  Send,
  Trash2,
  Edit2,
  FileText,
  Folder,
  Layers,
  Copy,
  Check,
  ChevronDown,
  Sparkles,
  Bot,
  User,
  Quote,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { SUGGESTED_QUESTIONS } from '@/utils/constants';
import toast from 'react-hot-toast';

export const ChatPage: React.FC = () => {
  const { conversationId: paramConvId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Location state can pass initialPrompt or initialScope
  const stateScope: ConversationScope | undefined = (location.state as any)?.initialScope;
  const initialPrompt: string | undefined = (location.state as any)?.initialPrompt;

  const {
    conversations,
    createConversation,
    renameConversation,
    deleteConversation,
  } = useConversations();

  const { documents } = useDocuments({ pageSize: 50 });
  const { collections } = useCollections();

  const [activeConvId, setActiveConvId] = useState<string | undefined>(paramConvId);

  const {
    conversationId,
    setConversationId,
    messages,
    loading: sendingMessage,
    scope,
    setScope,
    sendMessage,
  } = useChat(activeConvId, stateScope);

  const [inputMessage, setInputMessage] = useState('');
  const [expandedCitationId, setExpandedCitationId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Rename modal
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  // Delete modal
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync route param with active conversation
  useEffect(() => {
    if (paramConvId !== activeConvId) {
      setActiveConvId(paramConvId);
      setConversationId(paramConvId);
    }
  }, [paramConvId]);

  // When a new conversation gets created by sending message, update URL
  useEffect(() => {
    if (conversationId && conversationId !== paramConvId) {
      navigate(`/chat/${conversationId}`, { replace: true });
    }
  }, [conversationId, paramConvId, navigate]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sendingMessage]);

  // If initialPrompt was passed via location.state, send it automatically
  useEffect(() => {
    if (initialPrompt && !sendingMessage && messages.length === 0) {
      sendMessage(initialPrompt, stateScope);
    }
  }, [initialPrompt]);

  const handleStartNewChat = () => {
    setActiveConvId(undefined);
    setConversationId(undefined);
    navigate('/chat');
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || sendingMessage) return;

    const messageToSend = inputMessage;
    setInputMessage('');

    try {
      await sendMessage(messageToSend);
    } catch {
      // Re-fill input if sending failed
      setInputMessage(messageToSend);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTargetId || !newTitle.trim()) return;
    try {
      await renameConversation(renameTargetId, newTitle);
      setRenameModalOpen(false);
      setRenameTargetId(null);
    } catch {
      // handled
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteConversation(deleteTargetId);
      if (activeConvId === deleteTargetId) {
        handleStartNewChat();
      }
      setDeleteTargetId(null);
    } catch {
      // handled
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-2xl border border-neutral-200 bg-white shadow-subtle overflow-hidden">
      {/* Left Panel: Conversations list */}
      <div className="w-72 bg-neutral-50/70 border-r border-neutral-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-neutral-200/80">
          <Button
            variant="primary"
            className="w-full"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleStartNewChat}
          >
            New Conversation
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-charcoal-400">
            Recent Chats
          </p>

          {conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-charcoal-400">
              No conversations yet. Start one with the button above!
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = conv.id === activeConvId;

              return (
                <div
                  key={conv.id}
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-white text-primary-700 shadow-xs border border-neutral-200 font-semibold'
                      : 'text-charcoal-700 hover:bg-neutral-100'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <MessageSquare
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isSelected ? 'text-primary-600' : 'text-charcoal-400'
                      }`}
                    />
                    <span className="truncate">{conv.title}</span>
                  </div>

                  <div
                    className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setRenameTargetId(conv.id);
                        setNewTitle(conv.title);
                        setRenameModalOpen(true);
                      }}
                      className="p-1 hover:text-charcoal-900 rounded"
                      title="Rename"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(conv.id)}
                      className="p-1 hover:text-red-600 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Area: Chat thread & composer */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Top Chat Subheader with Scope Selector */}
        <div className="h-14 border-b border-neutral-100 px-6 flex items-center justify-between bg-white z-10 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
              Target Scope:
            </span>

            <div className="flex items-center gap-2">
              <select
                value={scope.type}
                onChange={(e) => {
                  const newType = e.target.value as ScopeType;
                  setScope({
                    type: newType,
                    documentId: newType === 'document' ? documents[0]?.id : undefined,
                    collectionId: newType === 'collection' ? collections[0]?.id : undefined,
                  });
                }}
                className="text-xs font-medium bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
                <option value="all">All Documents</option>
                <option value="document">Single Document</option>
                <option value="collection">Collection</option>
              </select>

              {scope.type === 'document' && (
                <select
                  value={scope.documentId || ''}
                  onChange={(e) =>
                    setScope({ ...scope, documentId: e.target.value })
                  }
                  className="text-xs font-medium bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-primary-100 max-w-[200px]"
                >
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              )}

              {scope.type === 'collection' && (
                <select
                  value={scope.collectionId || ''}
                  onChange={(e) =>
                    setScope({ ...scope, collectionId: e.target.value })
                  }
                  className="text-xs font-medium bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-primary-100 max-w-[200px]"
                >
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-xl mx-auto text-center space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center ring-8 ring-primary-50/50">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-charcoal-900">
                  Ask anything about your documents
                </h3>
                <p className="text-xs text-charcoal-500 max-w-sm">
                  The AI assistant retrieves relevant passages from indexed files, citing source documents with high precision.
                </p>
              </div>

              {/* Suggested Questions */}
              <div className="w-full space-y-2 pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-400">
                  Try asking
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {SUGGESTED_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => sendMessage(q)}
                      className="text-left p-3 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 hover:border-primary-300 transition-colors text-xs text-charcoal-700 font-medium"
                    >
                      &quot;{q}&quot;
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 max-w-3xl ${
                    isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isUser
                        ? 'bg-primary-600 text-white'
                        : 'bg-teal-600 text-white shadow-subtle'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`rounded-2xl p-4 space-y-2 max-w-2xl text-sm leading-relaxed ${
                      isUser
                        ? 'bg-primary-600 text-white shadow-subtle'
                        : 'bg-neutral-50/80 border border-neutral-200 text-charcoal-900 shadow-subtle'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}

                    {/* Citations & Actions for Assistant messages */}
                    {!isUser && (
                      <div className="pt-2 border-t border-neutral-200/60 mt-3 space-y-2">
                        {/* Copy button */}
                        <div className="flex items-center justify-between text-xs text-charcoal-400">
                          <span className="font-semibold uppercase tracking-wider text-[10px]">
                            {msg.citations && msg.citations.length > 0 ? 'Referenced Sources' : 'Response'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.id, msg.content)}
                            className="inline-flex items-center gap-1 hover:text-charcoal-700 transition-colors"
                          >
                            {copiedMessageId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Citation Chips */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {msg.citations.map((cit) => (
                              <button
                                key={cit.id}
                                type="button"
                                onClick={() =>
                                  setExpandedCitationId(
                                    expandedCitationId === cit.id ? null : cit.id
                                  )
                                }
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-neutral-200 text-xs text-charcoal-700 hover:border-primary-400 transition-colors"
                              >
                                <Quote className="w-3 h-3 text-primary-600" />
                                <span className="font-medium truncate max-w-[150px]">
                                  {cit.filename}
                                </span>
                                {cit.pageNumber && (
                                  <span className="text-charcoal-400 text-[10px]">
                                    p.{cit.pageNumber}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Expanded Citation Preview */}
                        {expandedCitationId &&
                          msg.citations?.some((c) => c.id === expandedCitationId) && (
                            <div className="mt-2 p-3 bg-white border border-primary-200 rounded-lg text-xs space-y-1 animate-fadeIn">
                              {(() => {
                                const activeCit = msg.citations.find(
                                  (c) => c.id === expandedCitationId
                                );
                                if (!activeCit) return null;
                                return (
                                  <>
                                    <div className="flex items-center justify-between text-charcoal-700 font-semibold">
                                      <span>
                                        {activeCit.filename} (Page {activeCit.pageNumber || 1})
                                      </span>
                                      {activeCit.score && (
                                        <span className="text-primary-600 text-[10px]">
                                          Match: {Math.round(activeCit.score * 100)}%
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-charcoal-600 italic bg-neutral-50 p-2 rounded border border-neutral-100">
                                      &ldquo;{activeCit.excerpt}&rdquo;
                                    </p>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Loading Indicator for Assistant Response */}
          {sendingMessage && (
            <div className="flex gap-3.5 max-w-3xl mr-auto">
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="rounded-2xl p-4 bg-neutral-50 border border-neutral-200 text-sm flex items-center gap-2 text-charcoal-500">
                <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                <span>Searching vector indices and synthesizing response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Composer */}
        <div className="p-4 border-t border-neutral-200 bg-white">
          <form onSubmit={handleSendMessage} className="relative flex items-end gap-2">
            <textarea
              rows={2}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your documents... (Press Enter to send, Shift+Enter for newline)"
              className="w-full resize-none rounded-xl border border-neutral-200 p-3 pr-12 text-sm text-charcoal placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 shadow-subtle"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!inputMessage.trim() || sendingMessage}
              loading={sendingMessage}
              className="absolute right-2 bottom-2 rounded-lg"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-[11px] text-charcoal-400 mt-2 text-center">
            DocAssistant retrieves verified context from your knowledge base to minimize hallucinations.
          </p>
        </div>
      </div>

      {/* Rename Modal */}
      <Modal
        isOpen={renameModalOpen}
        onClose={() => setRenameModalOpen(false)}
        title="Rename Conversation"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenameModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRenameSubmit}>
              Save
            </Button>
          </>
        }
      >
        <form onSubmit={handleRenameSubmit} className="space-y-3">
          <Input
            label="Conversation Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
            autoFocus
          />
        </form>
      </Modal>

      {/* Delete Modal */}
      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Conversation"
        message="Are you sure you want to delete this chat session? All message history and cited excerpts will be erased."
        confirmLabel="Delete Session"
        variant="danger"
      />
    </div>
  );
};
