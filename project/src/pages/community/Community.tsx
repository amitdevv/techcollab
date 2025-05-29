import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Plus,
  Users,
  MessageSquare,
  Hash,
  ChevronRight,
  Star,
  Pin,
  Send,
  Loader2,
  X,
  Settings,
} from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Avatar from "../../components/ui/Avatar";
import { getRelativeTime } from "../../lib/utils";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import {
  Channel,
  Message,
  CreateChannelData,
  initializeSocket,
  disconnectSocket,
  getChannels,
  createChannel,
  getMessages,
  joinChannelSocket,
  leaveChannelSocket,
  sendMessageSocket,
  sendMessage,
  ensureSocketConnected,
  onNewMessage,
  onMessageUpdated,
  onChannelUpdated,
  onUserStatusUpdated,
  onError,
  removeAllListeners,
  getSocket,
} from "../../services/chatApi";
import Textarea from "../../components/ui/Textarea";
import CustomSelect from "../../components/ui/CustomSelect";
import { ChannelSettings } from "../../components/chat/ChannelSettings";

const CommunityPage: React.FC = () => {
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelMessages, setChannelMessages] = useState<Record<string, Message[]>>({});
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [channelFilter, setChannelFilter] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [showMembersList, setShowMembersList] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState<Record<string, boolean>>({});
  const [socketConnected, setSocketConnected] = useState(false);

  // Channel creation modal state
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [newChannelData, setNewChannelData] = useState({
    name: "",
    description: "",
    type: "public",
    category: "general",
  });

  // Channel settings modal state
  const [showChannelSettings, setShowChannelSettings] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Get messages for active channel
  const activeChannelMessages = activeChannel ? channelMessages[activeChannel._id] || [] : [];

  const fetchChannels = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getChannels();
      setChannels(response.data);
      
      // Set first channel as active if none selected
      if (response.data.length > 0 && !activeChannel) {
        const firstChannel = response.data[0];
        setActiveChannel(firstChannel);
      }
    } catch (error) {
      console.error("Error fetching channels:", error);
      toast.error("Failed to load channels");
    } finally {
      setLoading(false);
    }
  }, [activeChannel]);

  const fetchMessagesForChannel = useCallback(async (channelId: string, forceReload = false) => {
    // Don't reload if we already have messages and it's not forced
    if (!forceReload && channelMessages[channelId]) {
      return;
    }

    try {
      setLoadingMessages(prev => ({ ...prev, [channelId]: true }));
      const response = await getMessages(channelId);
      
      setChannelMessages(prev => ({
        ...prev,
        [channelId]: response.data.messages
      }));
      
      // Scroll to bottom after loading messages
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoadingMessages(prev => ({ ...prev, [channelId]: false }));
    }
  }, [channelMessages, scrollToBottom]);

  const handleChannelChange = useCallback((channel: Channel) => {
    console.log(`Switching to channel: ${channel.name}`);

    // Leave previous channel
    if (activeChannel && socketRef.current) {
      console.log(`Leaving previous channel: ${activeChannel.name}`);
      leaveChannelSocket(activeChannel._id);
    }

    // Set new active channel
    setActiveChannel(channel);

    // Join new channel via socket
    if (socketRef.current && socketConnected) {
      console.log(`Joining channel via socket: ${channel.name}`);
      joinChannelSocket(channel._id);
    }

    // Load messages if not already loaded
    fetchMessagesForChannel(channel._id);
  }, [activeChannel, socketConnected, fetchMessagesForChannel]);

  const addMessageToChannel = useCallback((channelId: string, message: Message) => {
    setChannelMessages(prev => {
      const channelMsgs = prev[channelId] || [];
      
      // Check if message already exists (avoid duplicates)
      const existingIndex = channelMsgs.findIndex(m => m._id === message._id);
      if (existingIndex !== -1) {
        // Update existing message if it's different
        const existing = channelMsgs[existingIndex];
        if (existing.content !== message.content || existing.updatedAt !== message.updatedAt) {
          const updated = [...channelMsgs];
          updated[existingIndex] = message;
          return { ...prev, [channelId]: updated };
        }
        // No change needed
        return prev;
      }
      
      // Add new message in chronological order
      const newMessages = [...channelMsgs, message].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      return {
        ...prev,
        [channelId]: newMessages
      };
    });
  }, []);

  const updateMessageInChannel = useCallback((channelId: string, messageId: string, updates: Partial<Message>) => {
    setChannelMessages(prev => {
      const channelMsgs = prev[channelId] || [];
      const updated = channelMsgs.map(msg => 
        msg._id === messageId ? { ...msg, ...updates } : msg
      );
      return { ...prev, [channelId]: updated };
    });
  }, []);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChannel || !user || !user._id) return;

    const messageContent = messageInput.trim();
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    
    // Create optimistic message
    const optimisticMessage: Message = {
      _id: tempId,
      content: messageContent,
      sender: {
        _id: user._id,
        name: user.name,
        email: user.email,
        ...(user.picture ? { profilePicture: user.picture } : {}),
        status: "online" as const,
      },
      channel: activeChannel._id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type: "text",
      attachments: [],
      mentions: [],
      reactions: [],
      isEdited: false,
    };

    // Add message optimistically
    addMessageToChannel(activeChannel._id, optimisticMessage);
    setMessageInput("");
    
    setTimeout(scrollToBottom, 50);

    try {
      let sentMessage: Message;
      
      // Try socket first
      if (socketRef.current && socketConnected) {
        try {
          sentMessage = await sendMessageSocket(activeChannel._id, {
            content: messageContent,
            type: "text",
          });
          console.log("Message sent via socket:", sentMessage);
        } catch (socketError) {
          console.warn("Socket send failed, falling back to REST API:", socketError);
          // Fallback to REST API
          const response = await sendMessage(activeChannel._id, {
            content: messageContent,
            type: "text",
          });
          sentMessage = response.data;
        }
      } else {
        // Use REST API
        const response = await sendMessage(activeChannel._id, {
          content: messageContent,
          type: "text",
        });
        sentMessage = response.data;
      }

      // Replace optimistic message with real message
      setChannelMessages(prev => {
        const channelMsgs = prev[activeChannel._id] || [];
        const updated = channelMsgs.map(msg => 
          msg._id === tempId ? sentMessage : msg
        );
        return { ...prev, [activeChannel._id]: updated };
      });

    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      
      // Remove optimistic message on error
      setChannelMessages(prev => {
        const channelMsgs = prev[activeChannel._id] || [];
        const updated = channelMsgs.filter(msg => msg._id !== tempId);
        return { ...prev, [activeChannel._id]: updated };
      });
    }
  }, [messageInput, activeChannel, user, addMessageToChannel, socketConnected, scrollToBottom]);

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelData.name.trim()) {
      toast.error("Channel name is required");
      return;
    }

    try {
      setCreatingChannel(true);
      const channelData: CreateChannelData = {
        name: newChannelData.name,
        description: newChannelData.description,
        type: newChannelData.type as "public" | "private",
      };

      const response = await createChannel(channelData);
      toast.success("Channel created successfully!");
      setShowChannelModal(false);
      setNewChannelData({
        name: "",
        description: "",
        type: "public",
        category: "general",
      });

      // Add the new channel to the list and make it active
      const newChannel = response.data;
      setChannels(prev => [newChannel, ...prev]);
      handleChannelChange(newChannel);
    } catch (error) {
      console.error("Error creating channel:", error);
      toast.error("Failed to create channel");
    } finally {
      setCreatingChannel(false);
    }
  };

  // Initialize socket and setup event listeners
  useEffect(() => {
    if (!user) return;

    console.log("Initializing socket connection...");
    const socket = initializeSocket();
    socketRef.current = socket;

    if (socket) {
      // Connection event handlers
      socket.on("connect", () => {
        console.log("✅ Socket connected successfully");
        setSocketConnected(true);
        socket.emit("join-channels");
        
        // Re-join current channel after reconnection
        if (activeChannel) {
          console.log(`Re-joining channel: ${activeChannel.name}`);
          joinChannelSocket(activeChannel._id);
        }
      });

      socket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
        setSocketConnected(false);
      });

      socket.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error);
        setSocketConnected(false);
      });

      // Auto-join channels request
      socket.on("request-channel-join", () => {
        console.log("Server requested channel join");
        socket.emit("join-channels");
      });

      // Message events
      onNewMessage((message) => {
        console.log("📨 Received new message:", message);
        if (message.channel) {
          // Skip messages from current user to avoid duplicates with optimistic updates
          const isOwnMessage = message.sender._id === user?._id;
          
          if (isOwnMessage) {
            console.log("🚫 Skipping own message from socket broadcast (handled by optimistic update)");
            return;
          }
          
          // Add messages from other users
          addMessageToChannel(message.channel, message);
          
          // Scroll to bottom if it's for the active channel
          if (activeChannel && message.channel === activeChannel._id) {
            setTimeout(scrollToBottom, 100);
          }
        }
      });

      onMessageUpdated((message) => {
        console.log("📝 Message updated:", message);
        if (message.channel) {
          updateMessageInChannel(message.channel, message._id, message);
        }
      });

      // Channel events
      onChannelUpdated((data) => {
        console.log("📢 Channel updated:", data);
        setChannels(prev =>
          prev.map(channel =>
            channel._id === data.channelId
              ? {
                  ...channel,
                  lastActivity: data.lastActivity,
                  messageCount: data.messageCount,
                }
              : channel
          )
        );
      });

      // Status events
      onUserStatusUpdated((data) => {
        // Update user status in channels and messages
        setChannels(prev =>
          prev.map(channel => ({
            ...channel,
            members: channel.members.map(member =>
              member._id === data.userId
                ? { ...member, status: data.status as any }
                : member
            ),
          }))
        );

        // Update message sender status
        setChannelMessages(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(channelId => {
            updated[channelId] = updated[channelId].map(message =>
              message.sender._id === data.userId
                ? {
                    ...message,
                    sender: { ...message.sender, status: data.status as any },
                  }
                : message
            );
          });
          return updated;
        });
      });

      // Error events
      onError((error) => {
        console.error("Socket error:", error);
        toast.error(error.message);
      });

      // Join channels immediately if already connected
      if (socket.connected) {
        setSocketConnected(true);
        socket.emit("join-channels");
      }
    }

    // Fetch initial data
    fetchChannels();

    return () => {
      console.log("Cleaning up socket connection...");
      removeAllListeners();
      disconnectSocket();
      socketRef.current = null;
      setSocketConnected(false);
    };
  }, [user]); // Only depend on user

  // Handle active channel changes
  useEffect(() => {
    if (activeChannel) {
      // Only join via socket if connected
      if (socketRef.current && socketConnected) {
        joinChannelSocket(activeChannel._id);
      }
      
      // Load messages if not already loaded
      fetchMessagesForChannel(activeChannel._id);
    }
  }, [activeChannel, socketConnected]); // Add socketConnected dependency

  // Auto-scroll when new messages arrive for active channel
  useEffect(() => {
    if (activeChannel) {
      setTimeout(scrollToBottom, 100);
    }
  }, [activeChannelMessages.length, activeChannel, scrollToBottom]);

  const filteredChannels = channels.filter((channel) =>
    channel.name.toLowerCase().includes(channelFilter.toLowerCase())
  );

  const pinnedChannels = filteredChannels.filter((channel) => channel.isPinned);
  const otherChannels = filteredChannels.filter((channel) => !channel.isPinned);
  
  const isLoadingActiveChannel = activeChannel ? loadingMessages[activeChannel._id] : false;

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="mt-2 text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-4rem)] overflow-hidden p-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex h-full gap-6">
        {/* Channels sidebar */}
        <div className="w-72 flex-shrink-0 rounded-xl border border-violet-100 dark:border-dark-buttonBg bg-gradient-to-br from-white via-violet-50 to-indigo-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-buttonBg/20 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b border-violet-100 dark:border-dark-buttonBg bg-white/80 dark:bg-dark-bg/80 backdrop-blur-sm px-5">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-emerald-600 dark:text-dark-button" />
              <h2 className="font-semibold text-gray-800 dark:text-dark-text">Channels</h2>
            </div>
            <Button
              variant="ghost"
              className="h-9 w-9 rounded-full p-0 hover:bg-violet-100 dark:hover:bg-dark-buttonBg/20 hover:text-primary-500 dark:hover:text-dark-button transition-colors"
              aria-label="Create channel"
              onClick={() => setShowChannelModal(true)}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-violet-100 dark:border-dark-buttonBg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search channels"
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="h-10 pl-10 pr-4 w-full bg-emerald-50 dark:bg-dark-bg hover:bg-white dark:hover:bg-dark-buttonBg/20 focus:bg-white dark:focus:bg-dark-buttonBg/10 transition-colors"
              />
            </div>
          </div>

          {/* Channel lists */}
          <div className="h-[calc(100%-8.5rem)] overflow-y-auto p-3">
            {pinnedChannels.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center px-2 py-2">
                  <Pin className="h-4 w-4 text-emerald-600 dark:text-dark-button mr-2" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Pinned
                  </h3>
                </div>
                <ul className="space-y-1">
                  {pinnedChannels.map((channel) => (
                    <li key={channel._id}>
                      <button
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all ${
                          activeChannel?._id === channel._id
                            ? "bg-gradient-to-r from-emerald-500 to-green-600 dark:from-dark-button dark:to-dark-button text-white shadow-md"
                            : "hover:bg-emerald-50 dark:hover:bg-dark-buttonBg/20 text-gray-700 dark:text-gray-200"
                        }`}
                        onClick={() => handleChannelChange(channel)}
                      >
                        <div className="flex items-center overflow-hidden">
                          <span className={`mr-2 ${activeChannel?._id === channel._id ? 'text-white' : 'text-emerald-600 dark:text-dark-button'}`}>
                            {channel.type === "public" ? (
                              <Hash className="h-4 w-4" />
                            ) : (
                              <MessageSquare className="h-4 w-4" />
                            )}
                          </span>
                          <span className="truncate font-medium">{channel.name}</span>
                        </div>
                        {channel.unreadCount ? (
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium ${
                            activeChannel?._id === channel._id
                              ? "bg-white text-emerald-600 dark:text-dark-button"
                              : "bg-emerald-500 dark:bg-dark-button text-white"
                          }`}>
                            {channel.unreadCount}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <div className="flex items-center px-2 py-2">
                <Hash className="h-4 w-4 text-emerald-600 dark:text-dark-button mr-2" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  All Channels
                </h3>
              </div>
              <ul className="space-y-1">
                {otherChannels.map((channel) => (
                  <li key={channel._id}>
                    <button
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all ${
                        activeChannel?._id === channel._id
                          ? "bg-gradient-to-r from-emerald-500 to-green-600 dark:from-dark-button dark:to-dark-button text-white shadow-md"
                          : "hover:bg-emerald-50 dark:hover:bg-dark-buttonBg/20 text-gray-700 dark:text-gray-200"
                      }`}
                      onClick={() => handleChannelChange(channel)}
                    >
                      <div className="flex items-center overflow-hidden">
                        <span className={`mr-2 ${activeChannel?._id === channel._id ? 'text-white' : 'text-emerald-600 dark:text-dark-button'}`}>
                          {channel.type === "public" ? (
                            <Hash className="h-4 w-4" />
                          ) : (
                            <MessageSquare className="h-4 w-4" />
                          )}
                        </span>
                        <span className="truncate font-medium">{channel.name}</span>
                      </div>
                      {channel.unreadCount ? (
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium ${
                          activeChannel?._id === channel._id
                            ? "bg-white text-emerald-600 dark:text-dark-button"
                            : "bg-emerald-500 dark:bg-dark-button text-white"
                        }`}>
                          {channel.unreadCount}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          <div className="rounded-xl border border-violet-100 dark:border-dark-buttonBg bg-gradient-to-b from-violet-50 to-indigo-50 dark:from-dark-bg dark:to-dark-buttonBg/20 shadow-sm flex flex-col h-full">
            {activeChannel ? (
              <>
                <div className="flex h-14 items-center justify-between border-b border-violet-100 dark:border-dark-buttonBg px-6 rounded-t-xl bg-white/60 dark:bg-dark-bg/60 backdrop-blur-sm">
                  <div className="flex items-center">
                    <span className="mr-2 text-gray-400 dark:text-gray-500">
                      {activeChannel.type === "public" ? (
                        <Hash className="h-5 w-5" />
                      ) : (
                        <MessageSquare className="h-5 w-5" />
                      )}
                    </span>
                    <div>
                      <h2 className="font-medium text-gray-900 dark:text-dark-text">
                        {activeChannel.name}
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activeChannel.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      className="flex items-center rounded-md px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-buttonBg/20 hover:text-gray-900 dark:hover:text-dark-text transition-colors"
                      onClick={() => setShowMembersList(!showMembersList)}
                    >
                      <Users className="mr-1 h-4 w-4" />
                      <span>{activeChannel.memberCount}</span>
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Pin className="h-4 w-4" />}
                    >
                      Pin
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Star className="h-4 w-4" />}
                    >
                      Star
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Settings className="h-4 w-4" />}
                      onClick={() => setShowChannelSettings(true)}
                    >
                      Settings
                    </Button>
                  </div>
                </div>
                <div className="flex flex-1 overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-[#232323] dark:to-[#232323] relative">
                    {/* Chat background pattern */}
                    <div className="absolute inset-0 opacity-5 dark:opacity-[0.03]">
                      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <pattern id="chat-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                            <circle cx="50" cy="50" r="2" fill="#6B7280"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#chat-pattern)"/>
                      </svg>
                    </div>
                    
                    {/* Loading messages */}
                    {isLoadingActiveChannel ? (
                      <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-6 w-6 animate-spin text-primary-500 dark:text-dark-button" />
                        <span className="ml-2 text-gray-600 dark:text-gray-400">
                          Loading messages...
                        </span>
                      </div>
                    ) : (
                      <>
                        {/* Messages */}
                        <div className="space-y-3 relative z-10">
                          {activeChannelMessages.map((message, index) => {
                            const isOwnMessage = message.sender._id === user?._id;
                            
                            return (
                              <div
                                key={`${message._id}-${index}-${message.createdAt}`}
                                className={`flex animate-fade-in ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                              >
                                {/* Other user's avatar (left side) */}
                                {!isOwnMessage && (
                                  <Avatar
                                    src={message.sender.profilePicture}
                                    alt={message.sender.name}
                                    status={message.sender.status}
                                    size="sm"
                                    className="mr-3 flex-shrink-0 mt-1"
                                  />
                                )}
                                
                                <div className={`max-w-sm lg:max-w-lg xl:max-w-xl ${isOwnMessage ? 'ml-auto' : 'mr-auto'}`}>
                                  {/* Sender name for others' messages */}
                                  {!isOwnMessage && (
                                    <div className="mb-1 text-xs text-emerald-700 dark:text-dark-button px-1 font-semibold">
                                      {message.sender.name}
                                    </div>
                                  )}
                                  
                                  {/* Message bubble */}
                                  <div
                                    className={`relative rounded-2xl px-4 py-2 transition-transform duration-150 ${
                                      isOwnMessage
                                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 dark:from-dark-button dark:to-dark-button text-white ml-auto shadow-lg hover:scale-[1.03] border-0'
                                        : 'bg-white dark:bg-dark-buttonBg/20 border border-emerald-100 dark:border-dark-buttonBg text-gray-900 dark:text-gray-100 shadow-sm'
                                    }`}
                                  >
                                    {/* Message content */}
                                    <div className="text-sm leading-relaxed">
                                      {message.content}
                                    </div>

                                    {/* Attachments */}
                                    {message.attachments && message.attachments.length > 0 && (
                                      <div className="mt-2 space-y-2">
                                        {message.attachments.map((attachment, attachmentIndex) => (
                                          <div key={attachmentIndex}>
                                            {attachment.type === "image" ? (
                                              <div className="relative overflow-hidden rounded-lg">
                                                <img
                                                  src={attachment.url}
                                                  alt={attachment.name}
                                                  className="max-h-60 max-w-full object-cover rounded-lg"
                                                />
                                              </div>
                                            ) : (
                                              <div className={`inline-flex items-center rounded-lg px-3 py-2 text-sm ${
                                                isOwnMessage 
                                                  ? 'bg-white/20 text-white' 
                                                  : 'bg-gray-100 text-gray-700'
                                              }`}>
                                                <svg
                                                  className="mr-2 h-4 w-4"
                                                  fill="none"
                                                  viewBox="0 0 24 24"
                                                  stroke="currentColor"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                  />
                                                </svg>
                                                <span className="mr-2">{attachment.name}</span>
                                                <button className="text-xs underline hover:no-underline">
                                                  Download
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Message time and status */}
                                    <div className={`mt-1 flex items-center justify-end text-xs ${
                                      isOwnMessage ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                      <span>{getRelativeTime(new Date(message.createdAt))}</span>
                                      {message.isEdited && (
                                        <span className="ml-1">(edited)</span>
                                      )}
                                      {isOwnMessage && (
                                        <div className="ml-1">
                                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                          </svg>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Your avatar (right side) */}
                                {isOwnMessage && (
                                  <Avatar
                                    src={user?.picture}
                                    alt={user?.name || 'You'}
                                    status="online"
                                    size="sm"
                                    className="ml-3 flex-shrink-0 mt-1"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>
                  {/* Members panel */}
                  {showMembersList && (
                    <div className="w-64 flex-shrink-0 border-l border-violet-100 dark:border-dark-buttonBg bg-white dark:bg-[#232323] rounded-r-xl">
                      <div className="flex h-14 items-center justify-between border-b border-violet-100 dark:border-dark-buttonBg px-4">
                        <h3 className="font-medium text-gray-900 dark:text-dark-text">Members</h3>
                        <button
                          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                          onClick={() => setShowMembersList(false)}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="h-[calc(100%-56px)] overflow-y-auto p-3">
                        {(() => {
                          const onlineMembers = activeChannel.members.filter(
                            (member) => member.status === "online"
                          );
                          const offlineMembers = activeChannel.members.filter(
                            (member) => member.status !== "online"
                          );

                          return (
                            <>
                              {onlineMembers.length > 0 && (
                                <div className="mb-2">
                                  <h4 className="px-2 py-1 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                    Online - {onlineMembers.length}
                                  </h4>
                                  <ul className="space-y-2">
                                    {onlineMembers.map((member) => (
                                      <li key={member._id}>
                                        <div className="flex items-center rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-dark-buttonBg/20">
                                          <Avatar
                                            src={member.profilePicture}
                                            status={member.status}
                                            size="sm"
                                          />
                                          <span className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                                            {member.name}
                                          </span>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {offlineMembers.length > 0 && (
                                <div>
                                  <h4 className="px-2 py-1 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                    Offline - {offlineMembers.length}
                                  </h4>
                                  <ul className="space-y-2">
                                    {offlineMembers.map((member) => (
                                      <li key={member._id}>
                                        <div className="flex items-center rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-dark-buttonBg/20">
                                          <Avatar
                                            src={member.profilePicture}
                                            status={member.status}
                                            size="sm"
                                          />
                                          <span className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                                            {member.name}
                                          </span>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
                {/* Message input */}
                <div className="border-t border-violet-100 dark:border-dark-buttonBg bg-white/80 dark:bg-dark-bg/80 backdrop-blur-sm p-4 rounded-b-xl">
                  <form onSubmit={handleSendMessage}>
                    <div className="flex items-end space-x-2">
                      <div className="flex-1">
                        <Input
                          placeholder={`Message #${activeChannel.name}`}
                          value={messageInput}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setMessageInput(newValue);
                          }}
                          className="min-h-[2.5rem] py-2"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={!messageInput.trim()}
                        size="sm"
                        variant="default"
                        className="font-medium"
                        leftIcon={<Send className="h-4 w-4" />}
                      >
                        Send
                      </Button>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-dark-text">
                    No channel selected
                  </h3>
                  <p className="mt-1 text-gray-500 dark:text-gray-400">
                    Choose a channel to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Create channel modal */}
      {showChannelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-buttonBg p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text">
                Create a new channel
              </h3>
              <button
                className="rounded-md p-2 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
                onClick={() => setShowChannelModal(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChannel} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Channel Name
                </label>
                <Input
                  placeholder="Enter channel name"
                  value={newChannelData.name}
                  onChange={(e) =>
                    setNewChannelData({
                      ...newChannelData,
                      name: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <Textarea
                  placeholder="Enter channel description"
                  value={newChannelData.description}
                  onChange={(e) =>
                    setNewChannelData({
                      ...newChannelData,
                      description: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Channel Type
                </label>
                <CustomSelect
                  value={newChannelData.type}
                  onChange={(value) =>
                    setNewChannelData({
                      ...newChannelData,
                      type: value as "public" | "private",
                    })
                  }
                  options={[
                    { value: "public", label: "Public" },
                    { value: "private", label: "Private" },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <CustomSelect
                  value={newChannelData.category}
                  onChange={(value) =>
                    setNewChannelData({
                      ...newChannelData,
                      category: value,
                    })
                  }
                  options={[
                    { value: "general", label: "General" },
                    { value: "random", label: "Random" },
                    { value: "tech", label: "Tech" },
                    { value: "music", label: "Music" },
                  ]}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-dark-buttonBg">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowChannelModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  className="flex-1 font-medium"
                  loading={creatingChannel}
                >
                  Create Channel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Channel settings modal */}
      {showChannelSettings && activeChannel && (
        <ChannelSettings
          channel={activeChannel}
          onClose={() => setShowChannelSettings(false)}
          isAdmin={
            activeChannel.creator._id === user?._id ||
            activeChannel.admins?.some(admin => admin._id === user?._id) ||
            false
          }
        />
      )}
    </div>
  );
};

export default CommunityPage;
