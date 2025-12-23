import { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import {
  ArrowLeft,
  Send,
  MessageCircle,
  Search,
  Trash2,
  Menu,
  Smile,
  Flag,
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
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const messagesEndRef = useRef(null);
  const lastMessageCountRef = useRef(0);

  const userData = authAPI.getCurrentUser() || {};

  useEffect(() => {
    setLogoutCallback(onNavigate);
    
    if (!authAPI.isAuthenticated()) {
      onNavigate('login');
      return;
    }

    // Always fetch all conversations first
    fetchConversations();
    
    // If userId is provided, also open that conversation directly
    if (userId) {
      loadConversation(userId, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, onNavigate]);

  // Polling for real-time message updates
  useEffect(() => {
    if (!activeConversation) return;

    const pollInterval = setInterval(() => {
      // Skip poll if there are pending reactions to prevent flickering
      if (window._pendingDMReactions && Object.keys(window._pendingDMReactions).length > 0) {
        return;
      }
      loadConversation(activeConversation, false);
    }, 3000);

    return () => clearInterval(pollInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowEmojiPicker(null);
    if (showEmojiPicker) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showEmojiPicker]);

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
      setShowMobilePanel(false); // Close mobile panel when selecting a chat
      
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

  const handleReaction = async (messageId, emoji) => {
    // Prevent multiple rapid clicks
    const reactionKey = `${messageId}-${emoji}`;
    if (window._pendingDMReactions?.[reactionKey]) return;
    window._pendingDMReactions = { ...window._pendingDMReactions, [reactionKey]: true };
    
    try {
      // Wait for backend to process before updating UI
      await messagesAPI.reactToDirectMessage(messageId, emoji);
      // Fetch updated messages to show the confirmed reaction
      await loadConversation(activeConversation, false);
    } catch {
      toast.error('Failed to add reaction');
    } finally {
      setTimeout(() => {
        delete window._pendingDMReactions?.[reactionKey];
      }, 500);
    }
  };

  const handleFlagMessage = async (messageId) => {
    try {
      await messagesAPI.flagDirectMessage(messageId);
      setMessages(prev => prev.map(msg => 
        msg._id === messageId 
          ? { ...msg, flaggedForModeration: true }
          : msg
      ));
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

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.user?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading && !activeConversation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={() => onNavigate('dashboard')} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-xl text-foreground">Messages</h1>
        
        <button 
          className="md:hidden ml-auto p-2 rounded-lg hover:bg-accent text-foreground"
          onClick={() => setShowMobilePanel(!showMobilePanel)}
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Conversations List */}
        <div 
          className={`
            bg-card border-r border-border flex flex-col shrink-0 w-full md:w-80
            ${showMobilePanel ? 'fixed inset-y-0 left-0 z-50 mt-[57px]' : 'hidden'}
            md:relative md:flex md:mt-0
          `}
        >
          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 py-2 rounded-lg bg-muted/50 border-0"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-muted-foreground/30" />
                <p>No conversations yet</p>
                <Button
                  variant="link"
                  onClick={() => onNavigate('buddies')}
                  className="mt-2"
                >
                  Find Buddies
                </Button>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = conv.user._id === activeConversation;
                
                return (
                  <button
                    key={conv.user._id}
                    onClick={() => loadConversation(conv.user._id)}
                    className={`w-full p-3 flex items-center gap-3 hover:bg-accent transition-colors border-b border-border text-left ${
                      isActive ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center shrink-0 text-lg font-bold text-white">
                      {conv.user.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground truncate">{conv.user.name}</h3>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(conv.lastMessageDate)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel - Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          {!activeConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
              <MessageCircle className="w-16 h-16 mb-4 text-muted-foreground/20" />
              <h2 className="text-xl font-semibold mb-2">Select a conversation</h2>
              <p>Choose a buddy from the list to start chatting</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-3 border-b border-border bg-card flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center font-bold text-white">
                  {otherUser?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h2 className="font-bold text-foreground">{otherUser?.name}</h2>
                  <p className="text-xs text-muted-foreground">@{otherUser?.username}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => {
                  const showDateHeader =
                    index === 0 ||
                    formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt);
                  const isOwn = isOwnMessage(message);

                  return (
                    <div key={message._id}>
                      {showDateHeader && (
                        <div className="text-center my-4">
                          <span className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                      )}

                      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
                        <div className={`max-w-[75%] ${isOwn ? 'order-1' : ''}`}>
                          <div className="flex items-end gap-2">
                            {!isOwn && (
                              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white">
                                {otherUser?.name?.charAt(0) || '?'}
                              </div>
                            )}
                            <div
                              className={`rounded-2xl px-4 py-2 ${
                                message.flaggedForModeration
                                  ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-bl-md'
                                  : isOwn 
                                    ? 'bg-primary text-primary-foreground rounded-br-md' 
                                    : 'bg-card border border-border text-foreground rounded-bl-md'
                              }`}
                            >
                              {message.flaggedForModeration && (
                                <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1 flex items-center gap-1">
                                  <Flag className="w-3 h-3" /> Flagged for moderation
                                </p>
                              )}
                              <p className={message.flaggedForModeration ? 'text-muted-foreground' : ''}>{message.content}</p>
                              <p className={`text-xs mt-1 ${message.flaggedForModeration ? 'text-muted-foreground/70' : isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                {formatTime(message.createdAt)}
                              </p>
                            </div>

                            {/* Message actions */}
                            <div className={`flex gap-1 ${isOwn ? 'order-first mr-2' : 'ml-2'}`}>
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowEmojiPicker(showEmojiPicker === message._id ? null : message._id);
                                  }}
                                  className="p-1.5 hover:bg-accent rounded-full bg-card shadow-sm border border-border"
                                >
                                  <Smile className="w-4 h-4 text-muted-foreground" />
                                </button>
                                {showEmojiPicker === message._id && (
                                  <div 
                                    className={`absolute bottom-full mb-1 bg-card border border-border rounded-lg shadow-lg p-1.5 flex gap-0.5 z-50 ${isOwn ? 'right-0' : 'left-0'}`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {['👍', '❤️', '😂', '😮', '😢', '👏'].map((emoji) => (
                                      <button
                                        key={emoji}
                                        onClick={() => {
                                          handleReaction(message._id, emoji);
                                          setShowEmojiPicker(null);
                                        }}
                                        className="w-8 h-8 hover:bg-accent rounded flex items-center justify-center text-lg hover:scale-110 transition-transform"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {isOwn && (
                                <button
                                  onClick={() => handleDeleteMessage(message._id)}
                                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full bg-card shadow-sm border border-border"
                                >
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                </button>
                              )}
                              {!isOwn && !message.flaggedForModeration && (
                                <button
                                  onClick={() => handleFlagMessage(message._id)}
                                  className="p-1.5 hover:bg-accent rounded-full bg-card shadow-sm border border-border"
                                >
                                  <Flag className="w-4 h-4 text-muted-foreground" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Reactions */}
                          {message.reactions?.length > 0 && (
                            <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end mr-2' : 'ml-10'}`}>
                              {(() => {
                                const getUserId = (r) => r.userId?._id || r.userId;
                                const grouped = message.reactions.reduce((acc, r) => {
                                  if (!acc[r.emoji]) {
                                    acc[r.emoji] = { count: 0, hasUserReacted: false };
                                  }
                                  acc[r.emoji].count++;
                                  if (getUserId(r)?.toString() === userData._id?.toString()) {
                                    acc[r.emoji].hasUserReacted = true;
                                  }
                                  return acc;
                                }, {});
                                return Object.entries(grouped).map(([emoji, { count, hasUserReacted }]) => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleReaction(message._id, emoji)}
                                    className={`px-2 py-0.5 rounded-full text-sm shadow-sm transition-colors ${
                                      hasUserReacted 
                                        ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-400 dark:border-blue-600 hover:bg-blue-200 dark:hover:bg-blue-900/50' 
                                        : 'bg-card border border-border hover:bg-accent'
                                    }`}
                                  >
                                    {emoji} {count}
                                  </button>
                                ));
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-card border-t border-border">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-4xl mx-auto">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-full border-border bg-background"
                  />
                  <Button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

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
