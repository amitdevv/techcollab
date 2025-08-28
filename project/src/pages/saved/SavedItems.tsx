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
  MoreVertical,
  Bookmark
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Checkbox from '../../components/ui/Checkbox';
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
      <div className="bg-gradient-to-r from-[#00aa45]/10 to-[#00aa45]/5 rounded-2xl p-6 border border-[#00aa45]/20">
        <div className="flex items-center gap-3 mb-3">
          <Bookmark className="h-8 w-8 text-[#00aa45]" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Saved Items</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your saved drafts for events and gigs. Keep your work safe and continue where you left off.
        </p>
      </div>

      {/* Filters and Search */}
      <Card className="border-0 shadow-lg bg-white dark:bg-[#232323]">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className={filter === 'all' 
                  ? 'bg-[#00aa45] hover:bg-[#00aa45]/90 text-white shadow-lg' 
                  : 'border-[#4b5563] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#3b3b3b] hover:text-[#00aa45] dark:hover:text-[#00aa45]'
                }
              >
                All Drafts
              </Button>
              <Button
                variant={filter === 'event' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('event')}
                className={`flex items-center gap-2 ${
                  filter === 'event' 
                    ? 'bg-[#00aa45] hover:bg-[#00aa45]/90 text-white shadow-lg' 
                    : 'border-[#4b5563] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#3b3b3b] hover:text-[#00aa45] dark:hover:text-[#00aa45]'
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
                    ? 'bg-[#00aa45] hover:bg-[#00aa45]/90 text-white shadow-lg' 
                    : 'border-[#4b5563] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#3b3b3b] hover:text-[#00aa45] dark:hover:text-[#00aa45]'
                }`}
              >
                <Briefcase className="h-4 w-4" />
                Gigs
              </Button>
            </div>

            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="relative flex-1 lg:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search drafts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full lg:w-80 pl-10 pr-4 py-2.5 border border-[#4b5563] rounded-lg focus:ring-2 focus:ring-[#00aa45]/20 focus:border-[#00aa45] bg-white dark:bg-[#232323] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                />
              </div>
              
              {selectedDrafts.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={deleteSelectedDrafts}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white shadow-lg"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete ({selectedDrafts.size})
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drafts List */}
      <Card className="border-0 shadow-lg bg-white rounded-lg  dark:border-[#3a3a3a]">
        <CardHeader className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-[#3b3b3b]">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <FileText className="h-5 w-5 text-[#00aa45]" />
              Your Drafts ({filteredDrafts.length})
            </CardTitle>
            {filteredDrafts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllDrafts}
                className="border-[#4b5563] text-gray-700 dark:text-gray-300 "
              >
                {selectedDrafts.size === filteredDrafts.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00aa45] mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your drafts...</p>
            </div>
          ) : filteredDrafts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-[#00aa45]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bookmark className="h-10 w-10 text-[#00aa45]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">No drafts found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {searchTerm 
                  ? 'No drafts match your search criteria. Try adjusting your search terms.' 
                  : 'You haven\'t saved any drafts yet. Start creating events or gigs to see them here.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => navigate('/events/create')}
                  className="flex items-center gap-2 bg-[#00aa45] hover:bg-[#00aa45]/90 text-white shadow-lg"
                >
                  <Calendar className="h-4 w-4" />
                  Create Event
                </Button>
                <Button
                  onClick={() => navigate('/marketplace/create')}
                  className="flex items-center gap-2 bg-[#00aa45] hover:bg-[#00aa45]/90 text-white shadow-lg"
                >
                  <Briefcase className="h-4 w-4" />
                  Create Gig
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredDrafts.map((draft) => (
                <div
                  key={draft._id}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-[#3b3b3b]/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="pt-1">
                      <Checkbox
                        checked={selectedDrafts.has(draft._id)}
                        onChange={() => toggleDraftSelection(draft._id)}
                        className="h-5 w-5"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex items-center gap-2">
                            {draft.type === 'event' ? (
                              <Calendar className="h-5 w-5 text-[#00aa45]" />
                            ) : (
                              <Briefcase className="h-5 w-5 text-[#00aa45]" />
                            )}
                            <Badge
                              variant={draft.type === 'event' ? 'default' : 'outline'}
                              className={draft.type === 'event' 
                                ? 'bg-[#00aa45]/10 text-[#00aa45] border-[#00aa45]' 
                                : 'border-[#00aa45] text-[#00aa45] bg-transparent'
                              }
                            >
                              {draft.type.charAt(0).toUpperCase() + draft.type.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2 truncate">
                        {draft.title}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Last modified {formatDistanceToNow(new Date(draft.lastModified))}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Created {formatDistanceToNow(new Date(draft.createdAt))}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadDraft(draft)}
                        className="flex items-center gap-2 border-[#00aa45] text-[#00aa45] hover:bg-[#00aa45]/10 hover:shadow-md transition-all"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteDraft(draft._id)}
                        className="flex items-center gap-2 text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 border-red-200 dark:border-red-900/20 hover:bg-red-50 dark:hover:bg-red-900/10 hover:shadow-md transition-all"
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