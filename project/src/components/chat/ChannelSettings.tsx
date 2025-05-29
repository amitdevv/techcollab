import React, { useState } from 'react';
import { Copy, RefreshCw, Users, Settings, X, Link, Shield } from 'lucide-react';
import Button from '../ui/Button';
import { Channel, generateChannelJoinLink } from '../../services/chatApi';
import toast from 'react-hot-toast';

interface ChannelSettingsProps {
  channel: Channel;
  onClose: () => void;
  isAdmin: boolean;
}

export const ChannelSettings: React.FC<ChannelSettingsProps> = ({
  channel,
  onClose,
  isAdmin
}) => {
  const [joinLink, setJoinLink] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showJoinLink, setShowJoinLink] = useState(false);

  const handleGenerateJoinLink = async () => {
    if (!isAdmin) {
      toast.error('Only admins can generate join links');
      return;
    }

    try {
      setLoading(true);
      const response = await generateChannelJoinLink(channel._id);
      setJoinLink(response.data.joinLink);
      setShowJoinLink(true);
      toast.success('Join link generated successfully!');
    } catch (error) {
      console.error('Error generating join link:', error);
      toast.error('Failed to generate join link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJoinLink = async () => {
    if (!joinLink) return;
    
    const fullLink = `${window.location.origin}/join/channel/${joinLink}`;
    try {
      await navigator.clipboard.writeText(fullLink);
      toast.success('Join link copied to clipboard!');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = fullLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Join link copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-full max-w-md rounded-lg bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-buttonBg shadow-xl mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-buttonBg">
          <div className="flex items-center">
            <Settings className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text">Channel Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Channel Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-dark-text mb-3 flex items-center">
              <span className="text-lg mr-2 text-gray-500 dark:text-gray-400">#</span>
              {channel.name}
            </h3>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Type:</span>
              <div className="flex items-center">
                {channel.type === 'private' && <Shield className="h-4 w-4 text-orange-500 dark:text-orange-400 mr-1" />}
                <span className={channel.type === 'private' ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-dark-button'}>
                  {channel.type === 'private' ? 'Private' : 'Public'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Members:</span>
              <div className="flex items-center">
                <Users className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-1" />
                <span className="text-gray-900 dark:text-dark-text">{channel.memberCount}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Messages:</span>
              <span className="text-gray-900 dark:text-dark-text">{channel.messageCount}</span>
            </div>
          </div>

          {/* Description */}
          {channel.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-dark-text mb-2">Description</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-dark-buttonBg/20 rounded p-3">
                {channel.description}
              </p>
            </div>
          )}

          {/* Join Link Section */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-dark-text mb-3 flex items-center">
              <Link className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
              Join Link
            </h4>
            
            {!showJoinLink ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Generate a shareable link to invite others to this channel.
                </p>
                <Button
                  onClick={handleGenerateJoinLink}
                  disabled={loading || !isAdmin}
                  className="w-full"
                  variant={isAdmin ? 'primary' : 'secondary'}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Link className="h-4 w-4 mr-2" />
                      {isAdmin ? 'Generate Join Link' : 'Admin Only'}
                    </>
                  )}
                </Button>
                {!isAdmin && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center">
                    <Shield className="h-3 w-3 mr-1" />
                    Only channel admins can generate join links
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-gray-50 dark:bg-dark-buttonBg/20 rounded-lg p-3 border border-gray-200 dark:border-dark-buttonBg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300 truncate flex-1 pr-2">
                      {window.location.origin}/join/channel/{joinLink}
                    </span>
                    <Button
                      onClick={handleCopyJoinLink}
                      size="sm"
                      variant="secondary"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleGenerateJoinLink}
                    disabled={loading}
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Regenerate
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Anyone with this link can join the channel. Keep it secure!
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-dark-buttonBg/20 px-6 py-3 rounded-b-lg border-t border-gray-200 dark:border-dark-buttonBg">
          <Button
            onClick={onClose}
            variant="secondary"
            className="w-full"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}; 