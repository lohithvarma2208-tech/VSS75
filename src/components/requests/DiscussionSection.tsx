'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Trash2,
  Edit2,
  Reply,
  AlertTriangle,
  Check,
  X,
  Calendar,
} from 'lucide-react';
import { RequestResponse } from '@/types';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { useApp } from '@/lib/context/AppContext';
import { formatDate } from '@/lib/utils';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';
import RequestReportModal from './RequestReportModal';

interface DiscussionSectionProps {
  requestId: string;
  requestTitle: string;
  responses: RequestResponse[];
  onResponsesChange: () => void;
}

export default function DiscussionSection({
  requestId,
  requestTitle,
  responses,
  onResponsesChange,
}: DiscussionSectionProps) {
  const { currentUser, showToast } = useApp();
  const [newContent, setNewContent] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Reporting state
  const [reportResponseId, setReportResponseId] = useState<string | null>(null);

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Please sign in to join the discussion.', 'error');
      return;
    }
    if (!newContent.trim()) return;

    try {
      MockStorageManager.addRequestResponse(requestId, newContent.trim(), currentUser, null);
      setNewContent('');
      showToast('Response posted.', 'success');
      onResponsesChange();
    } catch {
      showToast('Failed to post comment.', 'error');
    }
  };

  const handleSubmitReply = (parentId: string) => {
    if (!currentUser) {
      showToast('Please sign in to reply.', 'error');
      return;
    }
    if (!replyContent.trim()) return;

    try {
      MockStorageManager.addRequestResponse(requestId, replyContent.trim(), currentUser, parentId);
      setReplyContent('');
      setReplyingToId(null);
      showToast('Reply posted.', 'success');
      onResponsesChange();
    } catch {
      showToast('Failed to post reply.', 'error');
    }
  };

  const handleSaveEdit = (responseId: string) => {
    if (!editContent.trim()) return;
    try {
      MockStorageManager.updateRequestResponse(responseId, editContent.trim());
      setEditingId(null);
      setEditContent('');
      showToast('Comment updated.', 'success');
      onResponsesChange();
    } catch {
      showToast('Failed to update comment.', 'error');
    }
  };

  const handleDelete = (responseId: string) => {
    if (confirm('Are you sure you want to delete this response?')) {
      MockStorageManager.deleteRequestResponse(responseId);
      showToast('Comment removed.', 'info');
      onResponsesChange();
    }
  };

  // Group top-level and replies
  const topLevel = responses.filter((r) => !r.parent_response_id);
  const getReplies = (parentId: string) => responses.filter((r) => r.parent_response_id === parentId);

  return (
    <div className="space-y-6">
      {/* Post a Response */}
      <form onSubmit={handleSubmitNew} className="p-4 sm:p-5 rounded-3xl bg-[#131B2E]/70 border border-white/10 space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#D8B4FE]" />
          <h4 className="text-xs sm:text-sm font-extrabold text-white">
            Ask a question or discuss this request
          </h4>
        </div>
        <textarea
          rows={3}
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder={
            currentUser
              ? "Share a suggestion, ask for specific notes chapters, or coordinate with the requester..."
              : "Sign in to participate in discussion..."
          }
          disabled={!currentUser}
          className="w-full bg-[#0B0F19] border border-white/15 rounded-2xl p-3.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition resize-none disabled:opacity-50"
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/40">
            Keep comments respectful, collegiate, and academic-focused.
          </span>
          <button
            type="submit"
            disabled={!currentUser || !newContent.trim()}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
          >
            <Send className="h-3 w-3" />
            <span>Post Comment</span>
          </button>
        </div>
      </form>

      {/* Responses List */}
      <div className="space-y-4">
        {topLevel.length === 0 ? (
          <p className="text-xs text-white/50 text-center py-6">
            No discussion comments yet. Start the conversation!
          </p>
        ) : (
          topLevel.map((resp) => {
            const replies = getReplies(resp.id);
            const isAuthor = currentUser?.id === resp.user_id;
            const isEditing = editingId === resp.id;

            return (
              <div
                key={resp.id}
                className="p-4 sm:p-5 rounded-3xl bg-[#131B2E]/50 border border-white/10 space-y-3"
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-bold text-white">
                      {resp.user_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white">{resp.user_name}</span>
                        {resp.user_is_verified && <VerifiedBadge size="xs" />}
                        <span className="text-[10px] text-white/50">@{resp.user_username}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                        <span>{resp.user_department || 'Student'}</span>
                        <span>•</span>
                        <span>{formatDate(resp.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {isAuthor ? (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(resp.id);
                            setEditContent(resp.content);
                          }}
                          className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition"
                          title="Edit comment"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(resp.id)}
                          className="p-1.5 rounded-lg text-rose-400/70 hover:text-rose-300 hover:bg-rose-950/40 transition"
                          title="Delete comment"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setReportResponseId(resp.id)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/10 transition"
                        title="Report comment"
                      >
                        <AlertTriangle className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                {isEditing ? (
                  <div className="space-y-2 pt-1">
                    <textarea
                      rows={2}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-[#0B0F19] border border-white/20 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 rounded-lg text-[11px] text-white/60 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(resp.id)}
                        className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-[11px] font-bold shadow-sm"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-white/80 leading-relaxed pl-10">
                    {resp.content}
                  </p>
                )}

                {/* Reply Button */}
                <div className="pl-10 pt-1 flex items-center gap-3">
                  <button
                    onClick={() => {
                      setReplyingToId(replyingToId === resp.id ? null : resp.id);
                      setReplyContent('');
                    }}
                    className="text-[11px] font-semibold text-[#38BDF8] hover:underline flex items-center gap-1"
                  >
                    <Reply className="h-3 w-3" />
                    <span>Reply</span>
                  </button>
                </div>

                {/* Reply Form */}
                {replyingToId === resp.id && (
                  <div className="pl-10 pt-2 space-y-2">
                    <input
                      type="text"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`Reply to ${resp.user_name}...`}
                      className="w-full bg-[#0B0F19] border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setReplyingToId(null)}
                        className="px-3 py-1 rounded-lg text-[11px] text-white/60 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSubmitReply(resp.id)}
                        disabled={!replyContent.trim()}
                        className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-[11px] font-bold disabled:opacity-50 shadow-sm"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                )}

                {/* Nested Replies */}
                {replies.length > 0 && (
                  <div className="pl-8 pt-3 space-y-2 border-l-2 border-white/10 ml-5 mt-2">
                    {replies.map((reply) => {
                      const isReplyAuthor = currentUser?.id === reply.user_id;

                      return (
                        <div
                          key={reply.id}
                          className="p-3 rounded-2xl bg-[#0B0F19]/80 border border-white/10 space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">
                                {reply.user_name}
                              </span>
                              {reply.user_is_verified && <VerifiedBadge size="xs" />}
                              <span className="text-[10px] text-white/40">
                                {formatDate(reply.created_at)}
                              </span>
                            </div>
                            {isReplyAuthor && (
                              <button
                                onClick={() => handleDelete(reply.id)}
                                className="p-1 rounded text-rose-400/70 hover:text-rose-300"
                                title="Delete reply"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-white/80 leading-relaxed">
                            {reply.content}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {reportResponseId && (
        <RequestReportModal
          isOpen={Boolean(reportResponseId)}
          onClose={() => setReportResponseId(null)}
          requestId={requestId}
          requestTitle={requestTitle}
          responseId={reportResponseId}
        />
      )}
    </div>
  );
}
