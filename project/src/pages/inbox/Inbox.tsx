import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Input from '../../components/ui/Input';
import { Search, MessageCircle, User, Clock } from 'lucide-react';
import { getUserChats, InboxChat, InboxUser } from '../../services/inboxApi';
import { formatDistanceToNow } from 'date-fns';

const Inbox: React.FC = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState<InboxChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
    fetchChats();
  }, [currentPage]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await getUserChats(currentPage);
      setChats(response.chats);
      setTotalPages(response.pagination.totalPages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chats');
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = (chatId: string) => {
    navigate(`/inbox/${chatId}`);
  };

  const getOtherParticipant = (chat: InboxChat): InboxUser | undefined => {
    return chat.participants.find((p: InboxUser) => p._id !== currentUser?.id);
  };

  const filteredChats = chats.filter(chat => {
    if (!searchTerm) return true;
    const otherParticipant = getOtherParticipant(chat);
    return otherParticipant?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           chat.gigId?.title?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatLastActivity = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  if (loading && chats.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-dark-text">
          <MessageCircle className="h-6 w-6 text-blue-500 dark:text-[#219653]" />
          Inbox
        </h1>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-10 border-gray-200 dark:border-dark-buttonBg focus:border-blue-500 dark:focus:border-[#219653] focus:ring-blue-500 dark:focus:ring-[#219653]"
          />
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 dark:border-red-900/20 bg-red-50 dark:bg-red-900/10">
          <CardContent className="p-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button 
              onClick={fetchChats} 
              variant="outline" 
              size="sm" 
              className="mt-2 border-red-200 dark:border-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Chat List */}
      <div className="space-y-4">
        {filteredChats.length === 0 && !loading ? (
          <Card className="border-gray-200 dark:border-dark-buttonBg">
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
                {searchTerm ? 'No conversations found' : 'No conversations yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Start chatting with people interested in your gigs'
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => navigate('/marketplace')} 
                  variant="outline"
                  className="border-gray-200 dark:border-dark-buttonBg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-buttonBg/50"
                >
                  Browse Marketplace
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredChats.map((chat) => {
            const otherParticipant = getOtherParticipant(chat);
            const hasUnread = (chat.unreadCount || 0) > 0;

            return (
              <div 
                key={chat._id} 
                className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                  hasUnread 
                    ? 'border-blue-200 dark:border-[#219653] bg-blue-50/30 dark:bg-[#219653]/5' 
                    : 'border-gray-200 dark:border-dark-buttonBg bg-white dark:bg-dark-buttonBg/10'
                }`}
                onClick={() => handleChatClick(chat._id)}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <Avatar 
                    src={otherParticipant?.picture} 
                    alt={otherParticipant?.name}
                    size="md"
                  />

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-medium truncate ${
                        hasUnread 
                          ? 'text-blue-900 dark:text-[#219653]' 
                          : 'text-gray-900 dark:text-dark-text'
                      }`}>
                        {otherParticipant?.name || 'Unknown User'}
                      </h3>
                      <div className="flex items-center gap-2">
                        {hasUnread && (
                          <Badge variant="error" className="text-xs">
                            {chat.unreadCount}
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatLastActivity(chat.lastActivity)}
                        </span>
                      </div>
                    </div>

                    {/* Last Message Preview */}
                    {chat.lastMessage && (
                      <p className={`text-sm truncate ${
                        hasUnread 
                          ? 'text-gray-700 dark:text-gray-200 font-medium' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {chat.lastMessage.sender._id === currentUser?.id ? 'You: ' : ''}
                        {chat.lastMessage.content}
                      </p>
                    )}

                    {/* Gig Context */}
                    {chat.type === 'gig_interest' && chat.gigId && (
                      <div className="mt-2">
                        <Badge 
                          variant="outline" 
                          className="text-xs border-green-200 dark:border-[#219653] text-green-700 dark:text-[#219653] rounded-md bg-green-100/50 dark:bg-dark-buttonBg/20"
                        >
                          About: {chat.gigId.title}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="border-gray-200 dark:border-dark-buttonBg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-buttonBg/50 disabled:text-gray-400 dark:disabled:text-gray-500"
          >
            Previous
          </Button>
          <span className="py-2 px-4 text-sm text-gray-600 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="border-gray-200 dark:border-dark-buttonBg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-buttonBg/50 disabled:text-gray-400 dark:disabled:text-gray-500"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default Inbox;
