import React, { useState } from 'react';
import { MessageSquare, Send, User } from 'lucide-react';
import { FirestoreService } from '../../lib/firestore';
import { useAuth } from '../../contexts/AuthContext';
import type { Comment } from '../../types';

interface ASICCommentsProps {
  comments: Comment[];
  asicId: string;
}

const ASICComments: React.FC<ASICCommentsProps> = ({ comments, asicId }) => {
  const { userProfile } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !newComment.trim()) return;

    setLoading(true);
    try {
      await FirestoreService.createComment({
        message: newComment.trim(),
        author: userProfile.name,
        asicId,
        createdAt: new Date()
      });
      setNewComment('');
      // Refresh would happen in parent component
      window.location.reload();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add new comment */}
      <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-dark-900" />
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={loading || !newComment.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-dark-900 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
                <span>{loading ? 'Posting...' : 'Post Comment'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h4>
          <p className="text-gray-500">Start the conversation by adding a comment above</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {comment.author.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-gray-900">{comment.author}</span>
                    <span className="text-sm text-gray-500">
                      {comment.createdAt?.toDate 
                       ? comment.createdAt.toDate().toLocaleDateString('en-US') + ' ' + comment.createdAt.toDate().toLocaleTimeString('en-US', { hour12: true })
                        : comment.createdAt instanceof Date 
                         ? comment.createdAt.toLocaleDateString('en-US') + ' ' + comment.createdAt.toLocaleTimeString('en-US', { hour12: true })
                         : new Date(comment.createdAt).toLocaleDateString('en-US') + ' ' + new Date(comment.createdAt).toLocaleTimeString('en-US', { hour12: true })
                      }
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{comment.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ASICComments;