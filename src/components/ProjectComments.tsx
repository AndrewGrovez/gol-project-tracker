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
}

interface ProjectCommentsProps {
  projectId: string;
}

interface ProfileSummary {
  id: string;
  display_name: string;
}

export default function ProjectComments({ projectId }: ProjectCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);
  const [showMentionList, setShowMentionList] = useState(false);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const supabase = createClient();
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
        <span key={`mention-${match.index}`} className="text-[#1c3145] font-semibold">
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

  const handleSubmitComment = async () => {
    const trimmedComment = newComment.trim();
    if (!trimmedComment) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: createdComment, error } = await supabase
        .from("comments")
        .insert([{
          project_id: projectId,
          user_id: session.user.id,
          content: trimmedComment,
        }])
        .select("*")
        .single();

      if (error) throw error;

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
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[1, 2, 3].map(n => (
        <div key={n} className="h-24 bg-gray-100 rounded"></div>
      ))}
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Comments</h2>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              placeholder="Write a comment..."
              value={newComment}
              onChange={handleTextareaChange}
              onKeyDown={handleTextareaKeyDown}
              className="mb-4"
            />
            {showMentionList && mentionSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 z-20 mt-2 max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                {mentionSuggestions.map((profile, index) => (
                  <button
                    key={profile.id}
                    type="button"
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                      index === activeMentionIndex
                        ? 'bg-[#1c3145] text-white'
                        : 'hover:bg-gray-100'
                    }`}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      insertMention(profile);
                    }}
                    onMouseEnter={() => setActiveMentionIndex(index)}
                  >
                    <span>{profile.display_name}</span>
                    <span className="text-xs text-white/70">
                      @{profile.display_name.replace(/\s+/g, '')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim()}
            >
              Post Comment
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-500">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium">{comment.author_name}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
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
                <p className="text-gray-700 whitespace-pre-wrap">
                  {renderCommentContent(comment.content)}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
