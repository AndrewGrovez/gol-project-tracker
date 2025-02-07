import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

export default function ProjectComments({ projectId }: ProjectCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Fetch comments
  useEffect(() => {
    async function fetchComments() {
      try {
        setLoading(true);
        
        // First get the comments
        const { data: commentsData, error } = await supabase
          .from("comments")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Then get the user names
        const userIds = [...new Set(commentsData?.map(c => c.user_id) || [])];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", userIds);

        // Create a map of user IDs to names
        const userMap = new Map(profiles?.map(p => [p.id, p.display_name]));

        // Combine the data
        const commentsWithAuthors = commentsData?.map(comment => ({
          ...comment,
          author_name: userMap.get(comment.user_id) || 'Unknown User'
        }));

        setComments(commentsWithAuthors || []);
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchComments();
  }, [projectId, supabase]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: createdComment, error } = await supabase
        .from("comments")
        .insert([{
          project_id: projectId,
          user_id: session.user.id,
          content: newComment.trim()
        }])
        .select("*")
        .single();

      if (error) throw error;

      // Get the author name
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", session.user.id)
        .single();

      // Add new comment to state with real ID
      const commentWithAuthor = {
        ...createdComment,
        author_name: profile?.display_name || 'Unknown User'
      };

      setComments(prev => [commentWithAuthor, ...prev]);
      setNewComment("");
    } catch (error) {
      console.error("Error posting comment:", error);
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
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="mb-4"
          />
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
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}