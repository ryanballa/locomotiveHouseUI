"use client";

import { useState } from "react";
import { apiClient, type Notice } from "@/lib/api";
import { RichTextEditor } from "./RichTextEditor";
import { ConfirmDialog } from "./ConfirmDialog";
import { useDialog } from "@/hooks/useDialog";

interface NoticesSectionProps {
  clubId: number;
  notices: Notice[];
  token: string;
  onNoticesUpdate: (notices: Notice[]) => void;
}

/**
 * Admin section for managing club notices with WYSIWYG editor
 */
export function NoticesSection({
  clubId,
  notices,
  token,
  onNoticesUpdate,
}: NoticesSectionProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    type: "",
    expires_at: "",
  });
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { isOpen, open, close } = useDialog();
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const handleCreate = async () => {
    if (!formData.description.trim()) {
      alert("Description is required");
      return;
    }

    try {
      setLoading(true);
      const result = await apiClient.createNotice(
        clubId,
        {
          description: formData.description,
          type: formData.type || undefined,
          expires_at: formData.expires_at || undefined,
        },
        token
      );

      if (result.created) {
        const updatedNotices = await apiClient.getNoticesByClubId(clubId, token);
        onNoticesUpdate(updatedNotices);
        setFormData({ description: "", type: "", expires_at: "" });
        setIsCreating(false);
      }
    } catch (err) {
      console.error("Failed to create notice:", err);
      alert("Failed to create notice");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (noticeId: number) => {
    if (!formData.description.trim()) {
      alert("Description is required");
      return;
    }

    try {
      setLoading(true);
      const result = await apiClient.updateNotice(
        clubId,
        noticeId,
        {
          description: formData.description,
          type: formData.type || undefined,
          expires_at: formData.expires_at || undefined,
        },
        token
      );

      if (result.updated) {
        // Refetch notices to get the updated timestamp from the backend
        const updatedNotices = await apiClient.getNoticesByClubId(clubId, token);
        onNoticesUpdate(updatedNotices);
        setFormData({ description: "", type: "", expires_at: "" });
        setEditingId(null);
      }
    } catch (err) {
      console.error("Failed to update notice:", err);
      alert("Failed to update notice");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (noticeId: number) => {
    setPendingDeleteId(noticeId);
    open();
  };

  const handleDeleteConfirm = async () => {
    if (pendingDeleteId === null) return;

    try {
      setDeletingId(pendingDeleteId);
      const result = await apiClient.deleteNotice(clubId, pendingDeleteId, token);

      if (result.deleted) {
        const updatedNotices = await apiClient.getNoticesByClubId(clubId, token);
        onNoticesUpdate(updatedNotices);
      }
    } catch (err) {
      console.error("Failed to delete notice:", err);
      alert("Failed to delete notice");
    } finally {
      setDeletingId(null);
      close();
      setPendingDeleteId(null);
    }
  };

  const startEdit = (notice: Notice) => {
    setFormData({
      description: notice.description,
      type: notice.type || "",
      expires_at: notice.expires_at ? new Date(notice.expires_at).toISOString().split("T")[0] : "",
    });
    setEditingId(notice.id);
  };

  const cancelEdit = () => {
    setFormData({ description: "", type: "", expires_at: "" });
    setEditingId(null);
    setIsCreating(false);
  };

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "No expiration";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Club Notices</h2>
        {!isCreating && !editingId && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + Create Notice
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? "Edit Notice" : "Create New Notice"}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (WYSIWYG)
              </label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) =>
                  setFormData({ ...formData, description: value })
                }
                placeholder="Enter notice content..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type (Optional)
                </label>
                <input
                  type="text"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  placeholder="e.g., alert, maintenance, announcement"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expires At (Optional)
                </label>
                <input
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) =>
                    setFormData({ ...formData, expires_at: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelEdit}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  editingId ? handleUpdate(editingId) : handleCreate()
                }
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {editingId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notices List */}
      <div className="space-y-4">
        {notices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No notices yet. Create one to get started!
          </div>
        ) : (
          notices.map((notice) => (
            <div
              key={notice.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  {notice.type && (
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded mb-2">
                      {notice.type}
                    </span>
                  )}
                  <div className="text-sm text-gray-500">
                    Expires: {formatDate(notice.expires_at)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(notice)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(notice.id)}
                    disabled={deletingId === notice.id}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-1"
                  >
                    {deletingId === notice.id ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        Deleting
                      </>
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>
              </div>
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: notice.description }}
              />
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        isOpen={isOpen}
        onClose={close}
        onConfirm={handleDeleteConfirm}
        title="Delete Notice"
        description="Are you sure you want to delete this notice?"
        type="danger"
        confirmLabel="Delete"
        isLoading={deletingId !== null}
      />
    </div>
  );
}
