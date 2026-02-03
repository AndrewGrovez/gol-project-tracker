import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  project_id: string;
  author_name?: string;
  parent_comment_id?: string | null;
}

interface ProjectCommentsProps {
  projectId: string;
  onCountChange?: (count: number) => void;
}

interface ProfileSummary {
  id: string;
  display_name: string;
}

export default function ProjectComments({ projectId, onCountChange }: ProjectCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);
  const [showMentionList, setShowMentionList] = useState(false);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyingToAuthorName, setReplyingToAuthorName] = useState<string | undefined>(undefined);
  const [supportsThreading, setSupportsThreading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Get current user's ID
  useEffect(() => {
    async function getCurrentUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
      }
    }
    getCurrentUser();
  }, [supabase]);

  // Fetch teammate profiles for mentions
  useEffect(() => {
    async function fetchProfiles() {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name")
        .order("display_name", { ascending: true });

      if (!error && data) {
        setProfiles(data);
      }
    }

    fetchProfiles();
  }, [supabase]);

  // Fetch comments
  useEffect(() => {
    async function fetchComments() {
      try {
        setLoading(true);
        const { data: commentsData, error } = await supabase
          .from("comments")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        const fetchedComments = commentsData ?? [];

        const userIds = [...new Set(fetchedComments.map((comment) => comment.user_id))];
        let userMap = new Map<string, string>();

        if (fetchedComments.length > 0) {
          const hasParentField = fetchedComments.some(
            (comment: Record<string, unknown>) => 'parent_comment_id' in comment
          );
          setSupportsThreading(hasParentField);
        }

        if (userIds.length > 0) {
          const { data: profileRows } = await supabase
            .from("profiles")
            .select("id, display_name")
            .in("id", userIds);

          if (profileRows) {
            userMap = new Map(profileRows.map((row) => [row.id, row.display_name]));
          }
        }

        const commentsWithAuthors = fetchedComments.map((comment) => ({
          ...comment,
          author_name: userMap.get(comment.user_id) || 'Unknown User',
        }));

        setComments(commentsWithAuthors);
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchComments();
  }, [projectId, supabase]);

  useEffect(() => {
    onCountChange?.(comments.length);
  }, [comments.length, onCountChange]);

  const mentionSuggestions = useMemo(() => {
    if (!showMentionList) return [] as ProfileSummary[];

    const query = mentionQuery.toLowerCase();
    const baseSuggestions = profiles.filter((profile) => profile.id !== currentUserId);

    if (!query) {
      return baseSuggestions.slice(0, 8);
    }

    return baseSuggestions
      .filter((profile) => profile.display_name.toLowerCase().includes(query))
      .slice(0, 8);
  }, [profiles, mentionQuery, showMentionList, currentUserId]);

  useEffect(() => {
    setActiveMentionIndex(0);
  }, [mentionSuggestions.length]);

  const resetMentionState = () => {
    setMentionQuery("");
    setMentionStartIndex(null);
    setShowMentionList(false);
    setActiveMentionIndex(0);
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  };

  const formatTimestamp = (dateString: string) =>
    new Date(dateString).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const { topLevelComments, repliesByParent } = useMemo(() => {
    const sorted = [...comments].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    if (!supportsThreading) {
      return { topLevelComments: sorted, repliesByParent: new Map<string, Comment[]>() };
    }

    const replyMap = new Map<string, Comment[]>();
    const topLevel: Comment[] = [];

    sorted.forEach((comment) => {
      if (comment.parent_comment_id) {
        const existing = replyMap.get(comment.parent_comment_id) || [];
        existing.push(comment);
        replyMap.set(comment.parent_comment_id, existing);
      } else {
        topLevel.push(comment);
      }
    });

    replyMap.forEach((list) =>
      list.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    );

    return { topLevelComments: topLevel, repliesByParent: replyMap };
  }, [comments, supportsThreading]);

  const getRepliesFor = (parentId: string) => repliesByParent.get(parentId) || [];

  const focusComposerAtEnd = () => {
    if (textareaRef.current) {
      const caret = textareaRef.current.value.length;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(caret, caret);
    }
  };

  const handleReplyClick = (commentId: string, authorName?: string) => {
    if (!authorName) return;
    const mentionText = `@[${authorName}] `;

    // Assume threading is available when user explicitly tries to reply; we'll fall back safely if not.
    setSupportsThreading(true);
    if (!supportsThreading) {
      setNewComment((prev) => {
        if (!prev) return mentionText;
        const needsNewLine = !prev.endsWith("\n");
        return `${prev}${needsNewLine ? "\n" : ""}${mentionText}`;
      });
      resetMentionState();
      requestAnimationFrame(focusComposerAtEnd);
      return;
    }

    setReplyingToCommentId(commentId);
    setReplyingToAuthorName(authorName);
    setNewComment(mentionText);

    resetMentionState();

    requestAnimationFrame(focusComposerAtEnd);
  };

  const cancelReply = () => {
    setReplyingToCommentId(null);
    setReplyingToAuthorName(undefined);
    setNewComment("");
  };

  const extractMentionedUserIds = (content: string) => {
    const ids = new Set<string>();
    const mentionRegex = /@\[(.+?)\]/g;
    let match: RegExpExecArray | null;

    while ((match = mentionRegex.exec(content)) !== null) {
      const mentionedName = match[1];
      const matchedProfile = profiles.find(
        (profile) => profile.display_name.toLowerCase() === mentionedName.toLowerCase()
      );
      if (matchedProfile) {
        ids.add(matchedProfile.id);
      }
    }

    return Array.from(ids);
  };

  const renderCommentContent = (content: string) => {
    const nodes: React.ReactNode[] = [];
    const mentionRegex = /@\[(.+?)\]/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = mentionRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        nodes.push(
          <span key={`text-${lastIndex}`}>{content.slice(lastIndex, match.index)}</span>
        );
      }

      const name = match[1];
      nodes.push(
        <span
          key={`mention-${match.index}`}
          className="rounded-full bg-[#eef2ff] px-2 py-0.5 text-sm font-semibold text-[#1c3145]"
        >
          @{name}
        </span>
      );

      lastIndex = mentionRegex.lastIndex;
    }

    if (lastIndex < content.length) {
      nodes.push(<span key={`text-${lastIndex}`}>{content.slice(lastIndex)}</span>);
    }

    return nodes;
  };

  const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    const caretPosition = event.target.selectionStart ?? value.length;

    setNewComment(value);

    const textUpToCaret = value.slice(0, caretPosition);
    const lastAtIndex = textUpToCaret.lastIndexOf('@');

    if (lastAtIndex === -1) {
      resetMentionState();
      return;
    }

    const charBeforeAt = textUpToCaret[lastAtIndex - 1];
    if (lastAtIndex > 0 && charBeforeAt && !/\s|\(|\[|\n/.test(charBeforeAt)) {
      resetMentionState();
      return;
    }

    const query = textUpToCaret.slice(lastAtIndex + 1);
    if (query.includes(' ') || query.includes('[') || query.includes('\n')) {
      resetMentionState();
      return;
    }

    setMentionStartIndex(lastAtIndex);
    setMentionQuery(query);
    setShowMentionList(true);
  };

  const handleTextareaKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentionList || mentionSuggestions.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveMentionIndex((prev) => (prev + 1) % mentionSuggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveMentionIndex((prev) =>
        prev === 0 ? mentionSuggestions.length - 1 : prev - 1
      );
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      const selected = mentionSuggestions[activeMentionIndex];
      if (selected) {
        insertMention(selected);
      }
    } else if (event.key === 'Escape') {
      resetMentionState();
    }
  };

  const insertMention = (profile: ProfileSummary) => {
    if (mentionStartIndex === null) return;

    const mentionText = `@[${profile.display_name}] `;
    const queryLength = mentionQuery.length;

    const before = newComment.slice(0, mentionStartIndex);
    const after = newComment.slice(mentionStartIndex + 1 + queryLength);
    const updatedComment = `${before}${mentionText}${after}`;

    setNewComment(updatedComment);
    resetMentionState();

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const caret = (before + mentionText).length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(caret, caret);
      }
    });
  };

  const isParentColumnError = (err: unknown) => {
    if (!err || typeof err !== "object") return false;
    const message = (err as { message?: string }).message?.toLowerCase() || "";
    const code = (err as { code?: string }).code;
    return code === "42703" || message.includes("parent_comment_id");
  };

  const handleSubmitComment = async () => {
    const trimmedComment = newComment.trim();
    if (!trimmedComment) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const basePayload = {
        project_id: projectId,
        user_id: session.user.id,
        content: trimmedComment,
      };

      const includeParent = Boolean(replyingToCommentId);
      const payload = includeParent
        ? { ...basePayload, parent_comment_id: replyingToCommentId }
        : basePayload;

      let { data: createdComment, error } = await supabase
        .from("comments")
        .insert([payload])
        .select("*")
        .single();

      if (error && includeParent && isParentColumnError(error)) {
        console.warn("Threading column missing; falling back to flat comments.");
        setSupportsThreading(false);
        setReplyingToCommentId(null);
        setReplyingToAuthorName(undefined);

        const fallback = await supabase
          .from("comments")
          .insert([basePayload])
          .select("*")
          .single();

        createdComment = fallback.data;
        error = fallback.error;
      }

      if (error || !createdComment) throw error || new Error("Failed to create comment");

      if (includeParent) {
        setSupportsThreading(true);
      }

      let authorName = profiles.find((profile) => profile.id === session.user.id)?.display_name;
      if (!authorName) {
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", session.user.id)
          .single();
        authorName = profileRow?.display_name || 'Unknown User';
      }

      const commentWithAuthor = {
        ...createdComment,
        author_name: authorName || 'Unknown User',
      };

      setComments((prev) => [commentWithAuthor, ...prev]);
      setNewComment("");
      setReplyingToCommentId(null);
      setReplyingToAuthorName(undefined);
      resetMentionState();

      const mentionedUserIds = extractMentionedUserIds(trimmedComment).filter(
        (id) => id !== session.user.id
      );

      if (mentionedUserIds.length > 0) {
        try {
          await fetch('/api/notifications/comment-mention', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              commentId: createdComment.id,
              commentText: trimmedComment,
              mentionedUserIds,
              authorId: session.user.id,
            }),
          });
        } catch (notifyError) {
          console.error('Error sending mention notifications:', notifyError);
        }
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload?.error || "Failed to delete comment";
        throw new Error(message);
      }

      setComments(prev =>
        prev.filter(
          comment => comment.id !== commentId && comment.parent_comment_id !== commentId
        )
      );

      if (replyingToCommentId === commentId) {
        cancelReply();
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Unable to delete this comment. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-16 rounded-2xl bg-gradient-to-r from-[#f4f7fb] via-white to-[#edf2ff] animate-pulse" />
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="h-20 rounded-2xl bg-gradient-to-r from-[#f8fbff] via-white to-[#eef2ff] animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-[#f8fbff] via-white to-[#eef2ff] px-4 py-4 shadow-sm">
        <h2 className="text-2xl font-semibold text-[#0f172a]">Comments</h2>
      </div>

      <Card className="border-0 bg-gradient-to-br from-white via-[#f9fbff] to-[#eef2ff] shadow-[0_14px_44px_-24px_rgba(12,23,52,0.55)] ring-1 ring-[#dfe7ff]">
        <CardContent className="pt-5">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-medium text-[#1c3145]">Share an update</div>
            <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
              <span className="rounded-full bg-white/80 px-3 py-1 font-semibold uppercase tracking-[0.08em] text-[#1c3145] ring-1 ring-[#d8e2f7]">
                Press @ to mention
              </span>
            </div>
          </div>
          {replyingToCommentId && (
            <div className="mb-3 flex items-center justify-between rounded-lg border border-[#dfe7ff] bg-[#eef2ff]/60 px-3 py-2 text-sm text-[#1c3145]">
              <span>
                Replying to <span className="font-semibold">{replyingToAuthorName}</span>
              </span>
              <button
                onClick={cancelReply}
                className="text-xs font-medium text-[#1c3145] underline underline-offset-4 hover:text-[#223d58]"
              >
                Cancel
              </button>
            </div>
          )}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              placeholder="Write a comment..."
              value={newComment}
              onChange={handleTextareaChange}
              onKeyDown={handleTextareaKeyDown}
              className="min-h-[120px] rounded-xl border border-[#d5ddf1] bg-white/90 px-4 py-3 text-slate-800 shadow-inner focus-visible:border-[#1c3145] focus-visible:ring-2 focus-visible:ring-[#1c3145]/60"
            />
            {showMentionList && mentionSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 z-20 mt-2 max-h-56 overflow-y-auto rounded-xl border border-[#d6e2ff] bg-white/95 shadow-2xl backdrop-blur-sm">
                {mentionSuggestions.map((profile, index) => (
                  <button
                    key={profile.id}
                    type="button"
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                      index === activeMentionIndex
                        ? 'bg-[#1c3145] text-white'
                        : 'hover:bg-[#f4f7ff]'
                    }`}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      insertMention(profile);
                    }}
                    onMouseEnter={() => setActiveMentionIndex(index)}
                  >
                    <span>{profile.display_name}</span>
                    <span
                      className={`text-xs ${
                        index === activeMentionIndex ? 'text-white/70' : 'text-slate-400'
                      }`}
                    >
                      @{profile.display_name.replace(/\s+/g, '')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center justify-end">
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim()}
              className="bg-[#1c3145] text-white hover:bg-[#223d58]"
            >
              Post Comment
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-[#dfe6f3] via-[#e8eef8] to-transparent" />
        <div className="space-y-5 pl-2">
          {topLevelComments.length === 0 ? (
            <div className="ml-10 rounded-2xl border border-dashed border-[#c7d5f5] bg-gradient-to-r from-[#f8fbff] to-white px-6 py-8 text-center shadow-sm">
              <div className="text-lg font-semibold text-[#1c3145]">No comments yet</div>
              <p className="mt-2 text-sm text-slate-600">
                Kick off the thread with a quick update or tag a teammate.
              </p>
            </div>
          ) : (
            topLevelComments.map((comment) => (
              <div key={comment.id} className="relative pl-16">
                <div className="absolute left-0 top-1 h-12 w-12 rounded-full bg-gradient-to-br from-[#1c3145] to-[#2c4966] text-white shadow-lg ring-4 ring-white grid place-content-center text-sm font-semibold">
                  {getInitials(comment.author_name)}
                </div>
                <div className="rounded-2xl border border-slate-200/90 bg-white/95 px-4 py-4 shadow-[0_12px_35px_-22px_rgba(12,23,52,0.8)] transition-all backdrop-blur overflow-hidden">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-semibold text-[#0f172a]">{comment.author_name}</span>
                        <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-medium text-[#1c3145]">
                          {formatTimestamp(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
                        Added an update
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#1c3145] hover:bg-[#eef2ff] hover:text-[#1c3145]"
                        onClick={() => handleReplyClick(comment.id, comment.author_name)}
                      >
                        Reply
                      </Button>
                      {currentUserId === comment.user_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-[15px] leading-relaxed text-slate-800 whitespace-pre-wrap break-words">
                    {renderCommentContent(comment.content)}
                  </p>
                </div>

                {getRepliesFor(comment.id).length > 0 && (
                  <div className="mt-3 space-y-3 border-l border-dashed border-[#dbe4f3] pl-8">
                    {getRepliesFor(comment.id).map((reply) => (
                      <div key={reply.id} className="relative pl-12">
                        <div className="absolute left-0 top-1 h-9 w-9 rounded-full bg-gradient-to-br from-[#9fb4cc] to-[#c2d1e4] text-[#0f172a] shadow ring-4 ring-white grid place-content-center text-xs font-semibold">
                          {getInitials(reply.author_name)}
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_12px_35px_-26px_rgba(12,23,52,0.5)] backdrop-blur overflow-hidden">
                          <div className="mb-1 flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-[#0f172a]">{reply.author_name}</span>
                                <span className="rounded-full bg-[#eef2ff] px-3 py-0.5 text-[11px] font-medium text-[#1c3145]">
                                  {formatTimestamp(reply.created_at)}
                                </span>
                              </div>
                            </div>
                            {currentUserId === reply.user_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => handleDeleteComment(reply.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <p className="text-[14px] leading-relaxed text-slate-800 whitespace-pre-wrap break-words">
                            {renderCommentContent(reply.content)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
