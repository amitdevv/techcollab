import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Avatar from '../../components/ui/Avatar';
import { ArrowLeft, Send, User, MoreVertical, Clock } from 'lucide-react';
import { 
  getChatMessages, 
  sendMessage, 
  markMessagesAsRead,
  InboxMessage, 
  InboxChat,
  InboxUser 
} from '../../services/inboxApi';
import { formatDistanceToNow } from 'date-fns';

const ChatConversation: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<InboxUser | null>(null);

  // Get current user from localStorage
  const getCurrentUser = () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  };

  const currentUser = getCurrentUser();

  useEffect(() => {
    if (chatId) {
      fetchMessages();
      markChatAsRead();
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!chatId) return;
    
    try {
      setLoading(true);
      const response = await getChatMessages(chatId);
      setMessages(response.messages);
      
      // Find the other user from the last message's sender
      if (response.messages.length > 0) {
        const lastMessage = response.messages[response.messages.length - 1];
        if (lastMessage.sender._id !== currentUser?.id) {
          setOtherUser(lastMessage.sender);
        } else {
          // If last message is from current user, find another sender
          const otherMessage = response.messages.find(m => m.sender._id !== currentUser?.id);
          if (otherMessage) {
            setOtherUser(otherMessage.sender);
          }
        }
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const markChatAsRead = async () => {
    if (!chatId) return;
    
    try {
      await markMessagesAsRead(chatId);
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || sending) return;

    try {
      setSending(true);
      const response = await sendMessage(chatId, newMessage.trim());
      
      // Add the new message to the list
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center dark:bg-[#171717]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#219653]"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-white dark:bg-[#171717]">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-dark-buttonBg bg-white dark:bg-[#171717] p-4 flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/inbox')}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        {otherUser && (
          <>
            <Avatar className="h-10 w-10" src={otherUser.picture} />
            <div className="flex-1">
              <h2 className="font-semibold text-lg text-gray-900 dark:text-dark-text">{otherUser.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{otherUser.email}</p>
            </div>
          </>
        )}
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-[#171717]">
        {error && (
          <Card className="border-red-200 dark:border-red-900/20 bg-red-50 dark:bg-red-900/10">
            <CardContent className="p-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <Button 
                onClick={fetchMessages} 
                variant="outline" 
                size="sm" 
                className="mt-2 border-red-200 dark:border-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {messages.length === 0 ? (
          <div className="text-center py-8">
            <User className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.sender._id === currentUser?.id;
            
            return (
              <div key={message._id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? 'order-2' : 'order-1'}`}>
                  {!isCurrentUser && (
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-6 w-6" src={message.sender.picture} />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {message.sender.name}
                      </span>
                    </div>
                  )}
                  
                  <div className={`p-3 rounded-lg ${
                    isCurrentUser 
                      ? 'bg-[#219653] text-white' 
                      : 'bg-gray-100 dark:bg-dark-buttonBg text-gray-900 dark:text-dark-text'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                  
                  <div className={`mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 ${
                    isCurrentUser ? 'justify-end' : 'justify-start'
                  }`}>
                    <Clock className="h-3 w-3" />
                    {formatMessageTime(message.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-dark-buttonBg bg-white dark:bg-[#171717]">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-white dark:bg-dark-buttonBg border-gray-200 dark:border-dark-buttonBg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-400"
            disabled={sending}
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || sending}
            className="px-4 bg-[#219653] hover:bg-[#219653]/90 text-white"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatConversation; 