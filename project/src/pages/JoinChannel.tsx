import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, CheckCircle, XCircle, Loader2, MessageSquare } from 'lucide-react';
import Button from '../components/ui/Button';
import { joinChannelViaLink } from '../services/chatApi';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const JoinChannelPage: React.FC = () => {
  const { joinLink } = useParams<{ joinLink: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [channelName, setChannelName] = useState<string>('');

  useEffect(() => {
    if (!user) {
      toast.error('Please login to join the channel');
      navigate('/login');
      return;
    }

    if (joinLink) {
      handleJoinChannel();
    }
  }, [joinLink, user]);

  const handleJoinChannel = async () => {
    if (!joinLink) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await joinChannelViaLink(joinLink);
      
      setSuccess(true);
      setChannelName(response.data.name);
      toast.success(`Successfully joined #${response.data.name}!`);
      
      // Redirect to community page after 2 seconds
      setTimeout(() => {
        navigate('/community');
      }, 2000);
    } catch (error: any) {
      console.error('Error joining channel:', error);
      setError(error.message || 'Failed to join channel');
      toast.error(error.message || 'Failed to join channel');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Joining Channel...</h2>
          <p className="text-gray-600">Please wait while we add you to the channel</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to #{channelName}!</h2>
          <p className="text-gray-600 mb-6">
            You've successfully joined the channel. You'll be redirected to the community page shortly.
          </p>
          <Button
            onClick={() => navigate('/community')}
            className="bg-green-600 hover:bg-green-700"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Go to Community
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Join Channel</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Button
              onClick={handleJoinChannel}
              variant="primary"
            >
              Try Again
            </Button>
            <Button
              onClick={() => navigate('/community')}
              variant="secondary"
            >
              Go to Community
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-4">
        <Users className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Join Channel</h2>
        <p className="text-gray-600 mb-6">
          Click the button below to join this channel
        </p>
        <Button
          onClick={handleJoinChannel}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Users className="h-4 w-4 mr-2" />
          Join Channel
        </Button>
      </div>
    </div>
  );
};

export default JoinChannelPage; 