import { useState, useCallback } from 'react';
import { api } from '../config/api';
import toast from 'react-hot-toast';

interface DraftData {
  [key: string]: any;
}

interface SaveDraftOptions {
  type: 'event' | 'gig';
  title: string;
  data: DraftData;
  showToast?: boolean;
}

export const useDrafts = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const saveDraft = useCallback(async (options: SaveDraftOptions) => {
    const { type, title, data, showToast = true } = options;
    
    if (!title.trim()) {
      if (showToast) toast.error('Title is required to save draft');
      return null;
    }

    try {
      setIsSaving(true);
      const response = await api.post('/api/drafts', {
        type,
        title: title.trim(),
        data
      });

      if (showToast) {
        toast.success('Draft saved successfully');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error saving draft:', error);
      if (showToast) {
        toast.error('Failed to save draft');
      }
      return null;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const loadDraft = useCallback(async (draftId: string) => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/drafts/${draftId}`);
      return response.data;
    } catch (error) {
      console.error('Error loading draft:', error);
      toast.error('Failed to load draft');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateDraft = useCallback(async (draftId: string, title: string, data: DraftData, showToast = true) => {
    try {
      setIsSaving(true);
      const response = await api.put(`/api/drafts/${draftId}`, {
        title: title.trim(),
        data
      });

      if (showToast) {
        toast.success('Draft updated successfully');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating draft:', error);
      if (showToast) {
        toast.error('Failed to update draft');
      }
      return null;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const deleteDraft = useCallback(async (draftId: string, showToast = true) => {
    try {
      await api.delete(`/api/drafts/${draftId}`);
      if (showToast) {
        toast.success('Draft deleted successfully');
      }
      return true;
    } catch (error) {
      console.error('Error deleting draft:', error);
      if (showToast) {
        toast.error('Failed to delete draft');
      }
      return false;
    }
  }, []);

  const getDrafts = useCallback(async (type?: 'event' | 'gig') => {
    try {
      setIsLoading(true);
      const params = type ? `?type=${type}` : '';
      const response = await api.get(`/api/drafts${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching drafts:', error);
      toast.error('Failed to fetch drafts');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const autoSaveDraft = useCallback(async (options: SaveDraftOptions) => {
    // Auto-save without showing toast notifications
    return saveDraft({ ...options, showToast: false });
  }, [saveDraft]);

  return {
    saveDraft,
    loadDraft,
    updateDraft,
    deleteDraft,
    getDrafts,
    autoSaveDraft,
    isSaving,
    isLoading
  };
}; 