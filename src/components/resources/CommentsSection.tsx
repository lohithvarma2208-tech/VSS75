'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { ResourceComment } from '@/types';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { useApp } from '@/lib/context/AppContext';
import { formatDate } from '@/lib/utils';

interface CommentsSectionProps {
  resourceId: string;
}

export default function CommentsSection({ resourceId }: CommentsSectionProps) {
  const { currentUser, showToast } = useApp();
  const [comments, setComments] = useState<ResourceComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadComments = () => {
    setComments(MockStorageManager.getComments(resourceId));
  };

  useEffect(() => {
    loadComments();
    const handleCommentChange = () => loadComments();
    window.addEventListener('klu_comments_change', handleCommentChange);
    return () => window.removeEventListener('klu_comments_change', handleCommentChange);
  }, [resourceId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!currentUser) {
      showToast('Please sign in to join the discussion.', 'error');
      return;
    }

    setIsSubmitting(true);
    MockStorageManager.addComment(resourceId, newComment.trim(), currentUser);
    setNewComment('');
    setIsSubmitting(false);
    showToast('Comment posted to discussion.', 'success');
  };

  const handleDelete = (commentId: string) => {
    MockStorageManager.deleteComment(commentId);
    showToast('Comment deleted.', 'info');
  };

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-[#D8B4FE]" />
        <h3 className="text-lg font-extrabold tracking-tight">
          Academic Discussion ({comments.length})
        </h3>
      </div>

      {/* Add comment box */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            rows={3}
            placeholder={
              currentUser
                ? `Discuss this resource or ask a clarifying question as @${currentUser.username}...`
                : 'Sign in to join the academic discussion...'
            }
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={!currentUser}
            className="w-full rounded-2xl border border-white/15 bg-[#0B0F19] p-4 text-xs text-white placeholder-white/40 focus:border-purple-500 focus:outline-none transition disabled:bg-white/5"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim() || !currentUser}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs font-extrabold shadow-md shadow-indigo-500/25 transition disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Post Comment</span>
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-white/10 bg-white/5">
            <p className="text-xs text-white/50">
              No questions or comments yet. Be the first to start the peer discussion!
            </p>
          </div>
        ) : (
          comments.map((comm) => {
            const canDelete =
              currentUser && (currentUser.id === comm.user_id || currentUser.role === 'admin' || currentUser.role === 'moderator');

            return (
              <div
                key={comm.id}
                className="p-4 rounded-2xl border border-white/10 bg-[#0B0F19]/80 shadow-card space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-purple-500/20 text-[#D8B4FE] border border-purple-500/30 flex items-center justify-center font-extrabold text-[11px] font-mono">
                      {(comm.user_username || comm.user_name || 'A').charAt(0)}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white font-mono">
                        {(comm.user_name || comm.user_username || 'anonymous').startsWith('@')
                          ? comm.user_name || comm.user_username
                          : `@${comm.user_name || comm.user_username || 'anonymous'}`}
                      </span>
                      <span className="text-[10px] text-white/40 ml-2 font-mono">
                        {formatDate(comm.created_at)}
                      </span>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      onClick={() => handleDelete(comm.id)}
                      className="p-1.5 text-white/40 hover:text-rose-400 transition"
                      title="Delete comment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-white/80 leading-relaxed pl-9">
                  {comm.content}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
