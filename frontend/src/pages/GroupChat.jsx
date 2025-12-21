import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import {
  ArrowLeft,
  Send,
  Smile,
  Flag,
  Trash2,
  Edit2,
  Users,
  X,
  MessageCircle,
  Search,
  GripVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import { authAPI, groupsAPI, messagesAPI, setLogoutCallback } from '../services/api';

export function GroupChat({ groupId, onNavigate }) {
  const [myGroups, setMyGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(groupId);
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null); // messageId of open picker
  const [searchTerm, setSearchTerm] = useState('');
  const [panelWidth, setPanelWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const [showMobilePanel, setShowMobilePanel] = useState(!groupId);
  const [deleteMessageId, setDeleteMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const lastMessageCountRef = useRef(0);
  const panelRef = useRef(null);

  const userData = authAPI.getCurrentUser() || {};

  const MIN_PANEL_WIDTH = 200;
  const MAX_PANEL_WIDTH = 400;

  useEffect(() => {
    setLogoutCallback(onNavigate);
    
    if (!authAPI.isAuthenticated()) {
      onNavigate('login');
      return;
    }

    fetchMyGroups();
  }, [onNavigate]);

  useEffect(() => {
    if (selectedGroupId) {
      fetchGroupAndMessages(true);
      setShowMobilePanel(false);

      const pollInterval = setInterval(() => {
        fetchGroupAndMessages(false);
      }, 3000);

      return () => clearInterval(pollInterval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroupId]);

  const fetchMyGroups = async () => {
    try {
      const groups = await groupsAPI.getMyGroups();
      setMyGroups(groups || []);
      
      if (!groupId && groups?.length > 0) {
        setSelectedGroupId(groups[0]._id);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      if (!groupId) {
        setIsLoading(false);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchGroupAndMessages = async (forceScroll = false) => {
    if (!selectedGroupId) return;
    
    try {
      const [groupData, messagesData] = await Promise.all([
        groupsAPI.getGroup(selectedGroupId),
        messagesAPI.getGroupMessages(selectedGroupId),
      ]);
      setGroup(groupData);
      const newMessages = messagesData.messages?.reverse() || [];
      
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
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;
    
    const newWidth = e.clientX;
    if (newWidth >= MIN_PANEL_WIDTH && newWidth <= MAX_PANEL_WIDTH) {
      setPanelWidth(newWidth);
    }
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    // Close emoji picker when clicking outside
    const handleClickOutside = () => setShowEmojiPicker(null);
    if (showEmojiPicker) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isResizing, handleMouseMove, handleMouseUp, showEmojiPicker]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      if (editingMessage) {
        await messagesAPI.editMessage(editingMessage._id, newMessage.trim());
        setEditingMessage(null);
        toast.success('Message updated');
      } else {
        await messagesAPI.sendGroupMessage(selectedGroupId, newMessage.trim(), isAnonymous);
      }
      setNewMessage('');
      fetchGroupAndMessages(true);
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
      await messagesAPI.deleteMessage(deleteMessageId);
      toast.success('Message deleted');
      setDeleteMessageId(null);
      fetchGroupAndMessages();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete message');
    }
  };

  const handleReaction = async (messageId, emoji) => {
    // Prevent multiple rapid clicks
    const reactionKey = `${messageId}-${emoji}`;
    if (window._pendingReactions?.[reactionKey]) return;
    window._pendingReactions = { ...window._pendingReactions, [reactionKey]: true };
    
    // Optimistic update - immediately show the reaction
    setMessages(prev => prev.map(msg => {
      if (msg._id === messageId) {
        // Handle both populated userId objects and plain string IDs
        const getUserId = (r) => r.userId?._id || r.userId;
        const existingReaction = msg.reactions?.find(
          r => getUserId(r)?.toString() === userData._id?.toString() && r.emoji === emoji
        );
        if (existingReaction) {
          // Remove reaction
          return {
            ...msg,
            reactions: msg.reactions.filter(
              r => !(getUserId(r)?.toString() === userData._id?.toString() && r.emoji === emoji)
            )
          };
        } else {
          // Add reaction
          return {
            ...msg,
            reactions: [...(msg.reactions || []), { userId: userData._id, emoji }]
          };
        }
      }
      return msg;
    }));
    
    try {
      await messagesAPI.reactToMessage(messageId, emoji);
      // Fetch to sync with server (in background)
      fetchGroupAndMessages();
    } catch {
      toast.error('Failed to add reaction');
      // Revert on error
      fetchGroupAndMessages();
    } finally {
      // Allow future reactions
      delete window._pendingReactions?.[reactionKey];
    }
  };

  const handleFlagMessage = async (messageId) => {
    try {
      await messagesAPI.flagMessage(messageId);
      // Optimistically update the UI to show message as flagged
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

  const handleSelectGroup = (gId) => {
    setSelectedGroupId(gId);
    window.location.hash = `group-chat-${gId}`;
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

  const filteredGroups = myGroups.filter(g => 
    g.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLastMessage = (gId) => {
    if (gId === selectedGroupId && messages.length > 0) {
      return messages[messages.length - 1];
    }
    return null;
  };

  if (isLoading && !myGroups.length) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={() => onNavigate('groups')} className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-xl">Group Chats</h1>
        
        <button 
          className="md:hidden ml-auto p-2 rounded-lg hover:bg-gray-100"
          onClick={() => setShowMobilePanel(!showMobilePanel)}
        >
          <MessageCircle className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Groups List */}
        <div 
          ref={panelRef}
          style={{ width: panelWidth }}
          className={`
            bg-white border-r border-gray-200 flex flex-col shrink-0
            ${showMobilePanel ? 'fixed inset-y-0 left-0 z-50 mt-[57px]' : 'hidden'}
            md:relative md:flex md:mt-0
          `}
        >
          {/* Search */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 py-2 rounded-lg bg-gray-50 border-0"
              />
            </div>
          </div>

          {/* Groups List */}
          <div className="flex-1 overflow-y-auto">
            {filteredGroups.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No groups yet</p>
                <Button
                  variant="link"
                  onClick={() => onNavigate('groups')}
                  className="mt-2"
                >
                  Join a group
                </Button>
              </div>
            ) : (
              filteredGroups.map((g) => {
                const lastMsg = getLastMessage(g._id);
                const isActive = g._id === selectedGroupId;
                
                return (
                  <button
                    key={g._id}
                    onClick={() => handleSelectGroup(g._id)}
                    className={`w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left ${
                      isActive ? 'bg-gray-100' : ''
                    }`}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center shrink-0">
                      <Users className="w-6 h-6 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 truncate">{g.name}</h3>
                        {lastMsg && (
                          <span className="text-xs text-gray-400">
                            {formatTime(lastMsg.createdAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {lastMsg 
                          ? `${lastMsg.senderId?.name?.split(' ')[0] || 'Anonymous'}: ${lastMsg.content}`
                          : `${g.members?.length || 0} members`
                        }
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Resize Handle */}
        <div
          className="hidden md:flex w-1 bg-gray-200 cursor-col-resize hover:bg-gray-300 active:bg-gray-400 items-center justify-center group"
          onMouseDown={handleMouseDown}
        >
          <GripVertical className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" />
        </div>

        {/* Right Panel - Chat */}
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
          {!selectedGroupId ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Select a group to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">{group?.name}</h2>
                    <p className="text-xs text-gray-500">{group?.members?.length || 0} members</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMembers(true)}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <Users className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
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
                            <div className={`max-w-[75%] ${isOwn ? 'order-1' : ''}`}>
                              <div className="flex items-end gap-2">
                                {!isOwn && (
                                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                    {message.senderId?.name?.charAt(0) || 'A'}
                                  </div>
                                )}
                                <div
                                  className={`rounded-2xl px-4 py-2 ${
                                    message.flaggedForModeration
                                      ? 'bg-red-50 border-2 border-red-200 rounded-bl-md'
                                      : isOwn 
                                        ? 'bg-black text-white rounded-br-md' 
                                        : 'bg-white border border-gray-200 rounded-bl-md shadow-sm'
                                  }`}
                                >
                                  {message.flaggedForModeration && (
                                    <p className="text-xs font-medium text-red-600 mb-1 flex items-center gap-1">
                                      <Flag className="w-3 h-3" /> Flagged for moderation
                                    </p>
                                  )}
                                  {!isOwn && !message.flaggedForModeration && (
                                    <p className="text-xs font-medium text-blue-600 mb-1">
                                      {message.isAnonymous ? 'Anonymous' : message.senderId?.name}
                                    </p>
                                  )}
                                  {!isOwn && message.flaggedForModeration && (
                                    <p className="text-xs font-medium text-gray-500 mb-1">
                                      {message.isAnonymous ? 'Anonymous' : message.senderId?.name}
                                    </p>
                                  )}
                                  <p className={message.flaggedForModeration ? 'text-gray-600' : isOwn ? 'text-white' : 'text-gray-900'}>{message.content}</p>
                                  {message.editedAt && (
                                    <span className="text-xs opacity-60">(edited)</span>
                                  )}
                                  <p className={`text-xs mt-1 ${message.flaggedForModeration ? 'text-gray-400' : isOwn ? 'text-gray-300' : 'text-gray-400'}`}>
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
                                      className="p-1.5 hover:bg-gray-100 rounded-full bg-white shadow-sm border border-gray-100"
                                    >
                                      <Smile className="w-4 h-4 text-gray-500" />
                                    </button>
                                    {showEmojiPicker === message._id && (
                                      <div 
                                        className={`absolute bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1.5 flex gap-0.5 z-50 ${isOwn ? 'right-0' : 'left-0'}`}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {['👍', '❤️', '😂', '😮', '😢', '👏'].map((emoji) => (
                                          <button
                                            key={emoji}
                                            onClick={() => {
                                              handleReaction(message._id, emoji);
                                              setShowEmojiPicker(null);
                                            }}
                                            className="w-8 h-8 hover:bg-gray-100 rounded flex items-center justify-center text-lg hover:scale-110 transition-transform"
                                          >
                                            {emoji}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  {canEditMessage(message) && (
                                    <button
                                      onClick={() => {
                                        setEditingMessage(message);
                                        setNewMessage(message.content);
                                      }}
                                      className="p-1.5 hover:bg-gray-100 rounded-full bg-white shadow-sm border border-gray-100"
                                    >
                                      <Edit2 className="w-4 h-4 text-gray-500" />
                                    </button>
                                  )}
                                  {(isOwn || group?.moderators?.some((m) => m._id === userData._id)) && (
                                    <button
                                      onClick={() => handleDeleteMessage(message._id)}
                                      className="p-1.5 hover:bg-red-50 rounded-full bg-white shadow-sm border border-gray-100"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-400" />
                                    </button>
                                  )}
                                  {!isOwn && !message.flaggedForModeration && (
                                    <button
                                      onClick={() => handleFlagMessage(message._id)}
                                      className="p-1.5 hover:bg-gray-100 rounded-full bg-white shadow-sm border border-gray-100"
                                    >
                                      <Flag className="w-4 h-4 text-gray-500" />
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
                                            ? 'bg-blue-100 border-2 border-blue-400 hover:bg-blue-200' 
                                            : 'bg-white border border-gray-200 hover:bg-gray-50'
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
                )}
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-3 shrink-0">
                {editingMessage && (
                  <div className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded-t-lg mb-2">
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
                      className={`p-2 rounded-full shrink-0 ${
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
                    className="rounded-full bg-black hover:bg-gray-800 p-3 shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile overlay when panel is open */}
      {showMobilePanel && (
        <div 
          className="md:hidden fixed inset-0 bg-black/30 z-40 mt-[57px]"
          onClick={() => setShowMobilePanel(false)}
        />
      )}

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
