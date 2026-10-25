import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCollections } from '@/hooks/useCollections';
import { useDocuments } from '@/hooks/useDocuments';
import { Collection, Document } from '@/types';
import {
  Folder,
  FolderPlus,
  MessageSquare,
  FileText,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonCard } from '@/components/common/Skeleton';
import { formatRelativeDate, formatDate } from '@/utils/formatters';
import toast from 'react-hot-toast';

export const CollectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    collections,
    loading,
    createCollection,
    updateCollection,
    deleteCollection,
    addDocumentToCollection,
    removeDocumentFromCollection,
  } = useCollections();

  // All documents for add-to-collection modal
  const { documents: allDocs } = useDocuments({ pageSize: 100 });

  // Create/Edit collection state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [colName, setColName] = useState('');
  const [colDesc, setColDesc] = useState('');
  const [saving, setSaving] = useState(false);

  // Collection detail / manage documents drawer/modal
  const [activeCollection, setActiveCollection] = useState<Collection | null>(null);
  const [addDocModalOpen, setAddDocModalOpen] = useState(false);

  // Delete dialog
  const [deleteConfirmCol, setDeleteConfirmCol] = useState<Collection | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreateModal = () => {
    setEditingCollection(null);
    setColName('');
    setColDesc('');
    setModalOpen(true);
  };

  const openEditModal = (col: Collection, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCollection(col);
    setColName(col.name);
    setColDesc(col.description || '');
    setModalOpen(true);
  };

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colName.trim()) return;

    setSaving(true);
    try {
      if (editingCollection) {
        await updateCollection(editingCollection.id, {
          name: colName,
          description: colDesc,
        });
      } else {
        await createCollection({
          name: colName,
          description: colDesc,
        });
      }
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmCol) return;
    setDeleting(true);
    try {
      await deleteCollection(deleteConfirmCol.id);
      if (activeCollection?.id === deleteConfirmCol.id) {
        setActiveCollection(null);
      }
      setDeleteConfirmCol(null);
    } finally {
      setDeleting(false);
    }
  };

  // Documents currently inside activeCollection
  const collectionDocs = allDocs.filter(
    (d) => activeCollection?.documentIds?.includes(d.id) || d.collectionIds?.includes(activeCollection?.id || '')
  );

  // Documents available to add
  const availableDocs = allDocs.filter(
    (d) =>
      !activeCollection?.documentIds?.includes(d.id) &&
      !d.collectionIds?.includes(activeCollection?.id || '')
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal-900">Collections</h1>
          <p className="text-sm text-charcoal-500">
            Group related documents together for targeted RAG retrieval and multi-document chat.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<FolderPlus className="w-4 h-4" />}
          onClick={openCreateModal}
        >
          New Collection
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <EmptyState
          icon={<Folder className="w-8 h-8" />}
          title="No collections created"
          description="Organize your documents into thematic collections to chat across multiple files simultaneously."
          action={{
            label: 'Create First Collection',
            onClick: openCreateModal,
            icon: <FolderPlus className="w-4 h-4" />,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((col) => (
            <div
              key={col.id}
              onClick={() => setActiveCollection(col)}
              className="bg-white rounded-xl border border-neutral-200 p-5 shadow-subtle hover:border-primary-300 hover:shadow-card transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-secondary-600 flex items-center justify-center ring-1 ring-teal-100 group-hover:scale-105 transition-transform">
                    <Folder className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => openEditModal(col, e)}
                      className="p-1.5 text-charcoal-400 hover:text-charcoal-700 hover:bg-neutral-100 rounded-md transition-colors"
                      title="Edit Collection"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmCol(col);
                      }}
                      className="p-1.5 text-charcoal-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete Collection"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-charcoal-900 group-hover:text-primary-600 transition-colors">
                    {col.name}
                  </h3>
                  <p className="text-xs text-charcoal-500 mt-1 line-clamp-2 min-h-[32px]">
                    {col.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-charcoal-500">
                <span className="font-medium text-charcoal-700">
                  {col.documentCount || col.documentIds?.length || 0} documents
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<MessageSquare className="w-3.5 h-3.5 text-primary-600" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/chat', {
                      state: {
                        initialScope: { type: 'collection', collectionId: col.id },
                      },
                    });
                  }}
                >
                  Chat
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Collection Detail Modal */}
      {activeCollection && (
        <Modal
          isOpen={true}
          onClose={() => setActiveCollection(null)}
          title={`Collection: ${activeCollection.name}`}
          size="lg"
          footer={
            <div className="flex justify-between w-full items-center">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setAddDocModalOpen(true)}
              >
                Add Document to Collection
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<MessageSquare className="w-4 h-4" />}
                onClick={() =>
                  navigate('/chat', {
                    state: {
                      initialScope: { type: 'collection', collectionId: activeCollection.id },
                    },
                  })
                }
              >
                Chat with Collection
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-xs text-charcoal-500">
              {activeCollection.description || 'No description provided.'}
            </p>

            <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal-700">
              Assigned Documents ({collectionDocs.length})
            </h4>

            {collectionDocs.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-neutral-200 rounded-lg text-xs text-charcoal-400">
                No documents are associated with this collection yet. Click below to add files.
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg overflow-hidden">
                {collectionDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 bg-white flex items-center justify-between hover:bg-neutral-50"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <FileText className="w-4 h-4 text-primary-600 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-charcoal-800 truncate">{doc.title}</p>
                        <p className="text-[10px] text-charcoal-400">{doc.filename}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocumentFromCollection(activeCollection.id, doc.id)}
                      title="Remove from collection"
                    >
                      <X className="w-3.5 h-3.5 text-charcoal-400 hover:text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Add Document to Collection Sub-Modal */}
      {addDocModalOpen && activeCollection && (
        <Modal
          isOpen={true}
          onClose={() => setAddDocModalOpen(false)}
          title={`Add Documents to ${activeCollection.name}`}
          size="md"
        >
          <div className="space-y-3">
            <p className="text-xs text-charcoal-500">
              Select existing workspace documents to include in this collection:
            </p>

            {availableDocs.length === 0 ? (
              <div className="p-6 text-center text-xs text-charcoal-400">
                All workspace documents are already inside this collection.
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg max-h-60 overflow-y-auto">
                {availableDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 bg-white flex items-center justify-between hover:bg-neutral-50"
                  >
                    <div className="truncate pr-2">
                      <p className="text-xs font-semibold text-charcoal-800 truncate">{doc.title}</p>
                      <p className="text-[10px] text-charcoal-400">{doc.filename}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await addDocumentToCollection(activeCollection.id, doc.id);
                        setAddDocModalOpen(false);
                      }}
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCollection ? 'Edit Collection' : 'Create Collection'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveCollection} loading={saving}>
              {editingCollection ? 'Save Changes' : 'Create Collection'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveCollection} className="space-y-4">
          <Input
            label="Collection Name"
            required
            placeholder="e.g., Financial Reports 2026"
            value={colName}
            onChange={(e) => setColName(e.target.value)}
          />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Brief context regarding files in this workspace..."
              value={colDesc}
              onChange={(e) => setColDesc(e.target.value)}
              className="w-full text-sm rounded-lg border border-neutral-200 p-3 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmCol !== null}
        onClose={() => setDeleteConfirmCol(null)}
        onConfirm={handleDelete}
        title="Delete Collection"
        message={`Are you sure you want to delete collection "${deleteConfirmCol?.name}"? The underlying documents will remain safe in your workspace.`}
        confirmLabel="Delete Collection"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
};
