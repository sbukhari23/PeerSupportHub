import { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import {
  ArrowLeft,
  Send,
  MessageCircle,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { authAPI, messagesAPI, setLogoutCallback } from '../services/api';

export function Messages({ userId, onNavigate }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [otherUser, setOtherUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteMessageId, setDeleteMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const lastMessageCountRef = useRef(0);

  const userData = authAPI.getCurrentUser() || {};

  useEffect(() => {
    setLogoutCallback(onNavigate);
    
    if (!authAPI.isAuthenticated()) {
      onNavigate('login');
      return;
    }

    // If userId is provided, open that conversation directly
    if (userId) {
      loadConversation(userId, true);
    } else {
      fetchConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, onNavigate]);

  // Polling for real-time message updates
  useEffect(() => {
    if (!activeConversation) return;

    const pollInterval = setInterval(() => {
      loadConversation(activeConversation, false);
    }, 3000);

    return () => clearInterval(pollInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const data = await messagesAPI.getConversations();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversation = async (recipientId, forceScroll = false) => {
    try {
      if (forceScroll) setIsLoading(true);
      const data = await messagesAPI.getDirectMessages(recipientId);
      const newMessages = data.messages?.reverse() || [];
      
      // Only scroll if there are new messages or forced
      const hasNewMessages = newMessages.length !== lastMessageCountRef.current;
      lastMessageCountRef.current = newMessages.length;
      
      setMessages(newMessages);
      setOtherUser(data.otherUser);
      setActiveConversation(recipientId);
      
      if (forceScroll || hasNewMessages) {
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      if (forceScroll) {
        toast.error('Failed to load conversation');
      }
      console.error('Error loading conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    try {
      await messagesAPI.sendDirectMessage(activeConversation, newMessage.trim());
      setNewMessage('');
      lastMessageCountRef.current = 0; // Reset to trigger scroll
      loadConversation(activeConversation, true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    setDeleteMessageId(messageId);
  };

  const confirmDeleteMessage = async () => {
    if (!deleteMessageId) return;
    try {
      await messagesAPI.deleteDirectMessage(deleteMessageId);
      toast.success('Message deleted');
      setDeleteMessageId(null);
      loadConversation(activeConversation, true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete message');
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

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.user?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading && !activeConversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (activeConversation && !userId) {
                  setActiveConversation(null);
                  setOtherUser(null);
                  setMessages([]);
                  fetchConversations();
                } else {
                  onNavigate('dashboard');
                }
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            {activeConversation && otherUser ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold">
                  {otherUser.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h1 className="font-bold">{otherUser.name}</h1>
                  <p className="text-sm text-gray-500">@{otherUser.username}</p>
                </div>
              </div>
            ) : (
              <h1 className="text-xl font-bold">Messages</h1>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      {!activeConversation ? (
        // Conversations List
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 py-3 rounded-full border-2 border-gray-300"
            />
          </div>

          {/* Conversations */}
          <div className="space-y-2">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => (
                <button
                  key={conv.user._id}
                  onClick={() => loadConversation(conv.user._id)}
                  className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border-2 border-gray-200 hover:border-gray-400 transition-colors text-left"
                >
                  <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold">
                    {conv.user.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold">{conv.user.name}</h3>
                      <span className="text-xs text-gray-500">
                        {formatDate(conv.lastMessageDate)}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm truncate">{conv.lastMessage}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-600 mb-2">No conversations yet</h3>
                <p className="text-gray-500 mb-4">Start chatting with your buddies</p>
                <Button onClick={() => onNavigate('buddies')} className="rounded-full">
                  View Buddies
                </Button>
              </div>
            )}
          </div>
        </main>
      ) : (
        // Chat View
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 max-w-4xl mx-auto w-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : messages.length === 0 ? (
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

                      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
                        <div className={`max-w-[75%] flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                          {!isOwn && (
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {otherUser?.name?.charAt(0) || '?'}
                            </div>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              isOwn ? 'bg-black text-white' : 'bg-white border border-gray-200'
                            }`}
                          >
                            <p>{message.content}</p>
                            <p className={`text-xs mt-1 ${isOwn ? 'text-gray-300' : 'text-gray-400'}`}>
                              {formatTime(message.createdAt)}
                            </p>
                          </div>
                          {isOwn && (
                            <button
                              onClick={() => handleDeleteMessage(message._id)}
                              className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
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
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
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
        </>
      )}

      {/* Delete Message Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteMessageId}
        onOpenChange={(open) => !open && setDeleteMessageId(null)}
        title="Delete Message"
        description="Are you sure you want to delete this message? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDeleteMessage}
      />
    </div>
  );
}
