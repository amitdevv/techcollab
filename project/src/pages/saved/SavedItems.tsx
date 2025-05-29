import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Calendar, 
  Briefcase, 
  Trash2, 
  Edit, 
  Clock,
  Filter,
  Search,
  Eye,
  MoreVertical
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { api } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from '../../lib/utils';
import toast from 'react-hot-toast';

interface Draft {
  _id: string;
  type: 'event' | 'gig';
  title: string;
  lastModified: string;
  createdAt: string;
}

const SavedItems: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'event' | 'gig'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDrafts, setSelectedDrafts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchDrafts();
  }, [filter]);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? `?type=${filter}` : '';
      const response = await api.get(`/api/drafts${params}`);
      setDrafts(response.data);
    } catch (error) {
      console.error('Error fetching drafts:', error);
      toast.error('Failed to fetch saved drafts');
    } finally {
      setLoading(false);
    }
  };

  const deleteDraft = async (draftId: string) => {
    try {
      await api.delete(`/api/drafts/${draftId}`);
      setDrafts(drafts.filter(draft => draft._id !== draftId));
      toast.success('Draft deleted successfully');
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast.error('Failed to delete draft');
    }
  };

  const deleteSelectedDrafts = async () => {
    try {
      await Promise.all(
        Array.from(selectedDrafts).map(id => api.delete(`/api/drafts/${id}`))
      );
      setDrafts(drafts.filter(draft => !selectedDrafts.has(draft._id)));
      setSelectedDrafts(new Set());
      toast.success(`${selectedDrafts.size} drafts deleted successfully`);
    } catch (error) {
      console.error('Error deleting drafts:', error);
      toast.error('Failed to delete selected drafts');
    }
  };

  const loadDraft = async (draft: Draft) => {
    try {
      const response = await api.get(`/api/drafts/${draft._id}`);
      const draftData = response.data.data;
      
      // Navigate to the appropriate form with draft data
      if (draft.type === 'event') {
        navigate('/events/create', { 
          state: { 
            draftData,
            draftId: draft._id,
            isEditingDraft: true 
          } 
        });
      } else if (draft.type === 'gig') {
        navigate('/marketplace/create', { 
          state: { 
            draftData,
            draftId: draft._id,
            isEditingDraft: true 
          } 
        });
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      toast.error('Failed to load draft');
    }
  };

  const filteredDrafts = drafts.filter(draft => 
    draft.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleDraftSelection = (draftId: string) => {
    const newSelected = new Set(selectedDrafts);
    if (newSelected.has(draftId)) {
      newSelected.delete(draftId);
    } else {
      newSelected.add(draftId);
    }
    setSelectedDrafts(newSelected);
  };

  const selectAllDrafts = () => {
    if (selectedDrafts.size === filteredDrafts.length) {
      setSelectedDrafts(new Set());
    } else {
      setSelectedDrafts(new Set(filteredDrafts.map(draft => draft._id)));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">Saved Items</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your saved drafts for events and gigs
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="border-gray-200 dark:border-dark-buttonBg bg-white dark:bg-[#171717]">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 'bg-[#219653] hover:bg-[#219653]/90' : 'border-gray-200 dark:border-dark-buttonBg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-buttonBg/50'}
              >
                All Drafts
              </Button>
              <Button
                variant={filter === 'event' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('event')}
                className={`flex items-center gap-2 ${
                  filter === 'event' 
                    ? 'bg-[#219653] hover:bg-[#219653]/90' 
                    : 'border-gray-200 dark:border-dark-buttonBg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-buttonBg/50'
                }`}
              >
                <Calendar className="h-4 w-4" />
                Events
              </Button>
              <Button
                variant={filter === 'gig' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('gig')}
                className={`flex items-center gap-2 ${
                  filter === 'gig' 
                    ? 'bg-[#219653] hover:bg-[#219653]/90' 
                    : 'border-gray-200 dark:border-dark-buttonBg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-buttonBg/50'
                }`}
              >
                <Briefcase className="h-4 w-4" />
                Gigs
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search drafts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 dark:border-dark-buttonBg rounded-md focus:ring-2 focus:ring-[#219653] focus:border-transparent bg-white dark:bg-dark-buttonBg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
              
            {selectedDrafts.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={deleteSelectedDrafts}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-4 w-4" />
                Delete ({selectedDrafts.size})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Drafts List */}
      <Card className="border-gray-200 dark:border-dark-buttonBg bg-white dark:bg-[#171717]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-dark-text">
              <FileText className="h-5 w-5 text-[#219653]" />
              Your Drafts ({filteredDrafts.length})
            </CardTitle>
            {filteredDrafts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllDrafts}
                className="border-gray-200 dark:border-dark-buttonBg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-buttonBg/50"
              >
                {selectedDrafts.size === filteredDrafts.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#219653] mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading drafts...</p>
            </div>
          ) : filteredDrafts.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-2">No drafts found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm 
                  ? 'No drafts match your search criteria' 
                  : 'You haven\'t saved any drafts yet'}
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => navigate('/events/create')}
                  className="flex items-center gap-2 bg-[#219653] hover:bg-[#219653]/90 text-white"
                >
                  <Calendar className="h-4 w-4" />
                  Create Event
                </Button>
                <Button
                  onClick={() => navigate('/marketplace/create')}
                  className="flex items-center gap-2 bg-[#219653] hover:bg-[#219653]/90 text-white"
                >
                  <Briefcase className="h-4 w-4" />
                  Create Gig
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-dark-buttonBg">
              {filteredDrafts.map((draft) => (
                <div
                  key={draft._id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-dark-buttonBg/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedDrafts.has(draft._id)}
                        onChange={() => toggleDraftSelection(draft._id)}
                        className="h-4 w-4 text-[#219653] focus:ring-[#219653] border-gray-300 dark:border-dark-buttonBg rounded"
                      />
                      
                      <div className="flex items-center gap-2">
                        {draft.type === 'event' ? (
                          <Calendar className="h-5 w-5 text-[#219653]" />
                        ) : (
                          <Briefcase className="h-5 w-5 text-[#219653]" />
                        )}
                        <Badge
                          variant={draft.type === 'event' ? 'default' : 'outline'}
                          className={draft.type === 'event' 
                            ? 'bg-[#219653]/10 text-[#219653] border-[#219653]' 
                            : 'border-[#219653] text-[#219653]'
                          }
                        >
                          {draft.type}
                        </Badge>
                      </div>

                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-dark-text">{draft.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <Clock className="h-4 w-4" />
                          <span>Last modified {formatDistanceToNow(new Date(draft.lastModified))}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadDraft(draft)}
                        className="flex items-center gap-2 border-[#219653] text-[#219653] hover:bg-[#219653]/10"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteDraft(draft._id)}
                        className="flex items-center gap-2 text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 border-red-200 dark:border-red-900/20 hover:bg-red-50 dark:hover:bg-red-900/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SavedItems; 