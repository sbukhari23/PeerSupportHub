import { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import {
  ArrowLeft,
  Send,
  Smile,
  Image,
  MoreVertical,
  Flag,
  Trash2,
  Edit2,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { authAPI, groupsAPI, messagesAPI, setLogoutCallback } from '../services/api';

export function GroupChat({ groupId, onNavigate }) {
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const messagesEndRef = useRef(null);
  const lastMessageCountRef = useRef(0);

  const userData = authAPI.getCurrentUser() || {};

  useEffect(() => {
    setLogoutCallback(onNavigate);
    
    if (!authAPI.isAuthenticated()) {
      onNavigate('login');
      return;
    }

    fetchGroupAndMessages(true); // Initial load - force scroll

    // Poll for new messages every 3 seconds for real-time updates
    const pollInterval = setInterval(() => {
      fetchGroupAndMessages(false); // Polling - only scroll on new messages
    }, 3000);

    return () => clearInterval(pollInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, onNavigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchGroupAndMessages = async (forceScroll = false) => {
    try {
      const [groupData, messagesData] = await Promise.all([
        groupsAPI.getGroup(groupId),
        messagesAPI.getGroupMessages(groupId),
      ]);
      setGroup(groupData);
      const newMessages = messagesData.messages?.reverse() || [];
      
      // Only scroll if there are new messages or forced
      const hasNewMessages = newMessages.length !== lastMessageCountRef.current;
      lastMessageCountRef.current = newMessages.length;
      
      setMessages(newMessages);
      
      if (forceScroll || hasNewMessages) {
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
      if (isLoading) {
        toast.error('Failed to load group chat');
        onNavigate('groups');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      if (editingMessage) {
        await messagesAPI.editMessage(editingMessage._id, newMessage.trim());
        setEditingMessage(null);
        toast.success('Message updated');
      } else {
        await messagesAPI.sendGroupMessage(groupId, newMessage.trim(), isAnonymous);
      }
      setNewMessage('');
      fetchGroupAndMessages();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Delete this message?')) return;
    
    try {
      await messagesAPI.deleteMessage(messageId);
      toast.success('Message deleted');
      fetchGroupAndMessages();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete message');
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      await messagesAPI.reactToMessage(messageId, emoji);
      fetchGroupAndMessages();
    } catch {
      toast.error('Failed to add reaction');
    }
  };

  const handleFlagMessage = async (messageId) => {
    try {
      await messagesAPI.flagMessage(messageId);
      toast.success('Message flagged for moderation');
    } catch {
      toast.error('Failed to flag message');
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOwnMessage = (message) => {
    return message.senderId?._id === userData._id;
  };

  const canEditMessage = (message) => {
    if (!isOwnMessage(message)) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(message.createdAt) > fiveMinutesAgo;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => onNavigate('groups')} className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="font-bold text-lg">{group?.name}</h1>
                <p className="text-sm text-gray-500">{group?.members?.length || 0} members</p>
              </div>
            </div>
            <button
              onClick={() => setShowMembers(true)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <Users className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const showDateHeader =
                index === 0 ||
                formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt);
              const isOwn = isOwnMessage(message);

              return (
                <div key={message._id}>
                  {showDateHeader && (
                    <div className="text-center my-4">
                      <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                  )}

                  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] ${isOwn ? 'order-1' : ''}`}>
                      <div className="flex items-end gap-2">
                        {!isOwn && (
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold">
                            {message.senderId?.name?.charAt(0) || 'A'}
                          </div>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            isOwn ? 'bg-black text-white' : 'bg-white border border-gray-200'
                          }`}
                        >
                          {!isOwn && (
                            <p className="text-xs font-medium text-gray-500 mb-1">
                              {message.isAnonymous ? 'Anonymous' : message.senderId?.name}
                            </p>
                          )}
                          <p className={isOwn ? 'text-white' : 'text-gray-900'}>{message.content}</p>
                          {message.editedAt && (
                            <span className="text-xs opacity-60">(edited)</span>
                          )}
                          <p className={`text-xs mt-1 ${isOwn ? 'text-gray-300' : 'text-gray-400'}`}>
                            {formatTime(message.createdAt)}
                          </p>
                        </div>

                        {/* Message actions */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleReaction(message._id, '👍')}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Smile className="w-4 h-4 text-gray-400" />
                          </button>
                          {canEditMessage(message) && (
                            <button
                              onClick={() => {
                                setEditingMessage(message);
                                setNewMessage(message.content);
                              }}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Edit2 className="w-4 h-4 text-gray-400" />
                            </button>
                          )}
                          {(isOwn || group?.moderators?.some((m) => m._id === userData._id)) && (
                            <button
                              onClick={() => handleDeleteMessage(message._id)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          )}
                          {!isOwn && (
                            <button
                              onClick={() => handleFlagMessage(message._id)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Flag className="w-4 h-4 text-gray-400" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Reactions */}
                      {message.reactions?.length > 0 && (
                        <div className="flex gap-1 mt-1 ml-10">
                          {Object.entries(
                            message.reactions.reduce((acc, r) => {
                              acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                              return acc;
                            }, {})
                          ).map(([emoji, count]) => (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(message._id, emoji)}
                              className="bg-gray-100 px-2 py-0.5 rounded-full text-sm"
                            >
                              {emoji} {count}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          {editingMessage && (
            <div className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded-t-lg mb-1">
              <span className="text-sm text-gray-600">Editing message</span>
              <button
                onClick={() => {
                  setEditingMessage(null);
                  setNewMessage('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            {group?.type === 'AnonymousVent' && (
              <button
                type="button"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`p-2 rounded-full ${
                  isAnonymous ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'
                }`}
                title={isAnonymous ? 'Posting anonymously' : 'Post with your name'}
              >
                👤
              </button>
            )}
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={editingMessage ? 'Edit your message...' : 'Type a message...'}
              className="flex-1 rounded-full border-2 border-gray-200 py-3"
            />
            <Button
              type="submit"
              disabled={!newMessage.trim()}
              className="rounded-full bg-black hover:bg-gray-800 px-4"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </div>

      {/* Members Modal */}
      {showMembers && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md rounded-2xl p-6 bg-white max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Members ({group?.members?.length || 0})</h2>
              <button onClick={() => setShowMembers(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-3">
              {group?.members?.map((member) => (
                <div key={member._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold">
                    {member.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-gray-500">@{member.username}</p>
                  </div>
                  {group?.moderators?.some((m) => m._id === member._id) && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                      Mod
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
