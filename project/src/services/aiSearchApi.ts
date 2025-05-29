import { api } from '../config/api';

export interface AISearchRequest {
  query: string;
  context?: 'gigs' | 'events' | 'users';
  filters?: {
    category?: string;
    priceRange?: string;
    location?: string;
  };
}

export interface AISearchResponse {
  interpretedQuery: string;
  suggestedFilters: {
    category?: string;
    subCategory?: string;
    priceRange?: string;
    sortBy?: string;
    keywords?: string[];
  };
  searchQuery: string;
  explanation: string;
}

export const aiSearchApi = {
  // AI-powered search that interprets natural language
  searchWithAI: async (request: AISearchRequest): Promise<AISearchResponse> => {
    const response = await api.post('/api/ai/search', request);
    return response.data.data;
  },

  // Get search suggestions based on input
  getSearchSuggestions: async (partialQuery: string): Promise<string[]> => {
    const response = await api.get(`/api/ai/suggestions?q=${encodeURIComponent(partialQuery)}`);
    return response.data.suggestions;
  }
}; 