import { api } from '../config/api';

export interface Gig {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  category: string;
  subCategory: string;
  price: number;
  deliveryTime: string;
  tags: string[];
  images?: string[]; freelancer?: {
    _id: string;
    name: string;
    picture?: string;
    profile?: {
      location?: string;
    };
  };
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  rating: number;
  reviews: number;
  orders: number;
  views: number;
  favorites: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GigFilters {
  page?: number;
  limit?: number;
  category?: string;
  priceRange?: string;
  sortBy?: string;
  search?: string;
  status?: string;
}

export interface GigResponse {
  gigs: Gig[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalGigs: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const gigApi = {
  // Get all gigs with filters
  getGigs: async (filters: GigFilters = {}): Promise<GigResponse> => {
    const params = new URLSearchParams(); Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    const response = await api.get(`/api/gigs?${params}`);
    return response.data;
  },

  // Get gig by ID
  getGigById: async (id: string): Promise<Gig> => {
    const response = await api.get(`/api/gigs/${id}`);
    return response.data;
  },

  // Create new gig
  createGig: async (gigData: Partial<Gig>): Promise<Gig> => {
    const response = await api.post('/api/gigs', gigData);
    return response.data;
  },

  // Save gig as draft
  saveGigDraft: async (gigData: Partial<Gig>): Promise<Gig> => {
    const response = await api.post('/api/gigs/draft', gigData);
    return response.data;
  },

  // Update gig
  updateGig: async (id: string, gigData: Partial<Gig>): Promise<Gig> => {
    const response = await api.put(`/api/gigs/${id}`, gigData);
    return response.data;
  },

  // Delete gig
  deleteGig: async (id: string): Promise<void> => {
    await api.delete(`/api/gigs/${id}`);
  },

  // Get user's gigs
  getUserGigs: async (status?: string): Promise<Gig[]> => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/api/gigs/user/my-gigs${params}`);
    return response.data;
  },

  // Get gig analytics
  getGigAnalytics: async (): Promise<any> => {
    const response = await api.get('/api/gigs/user/analytics');
    return response.data;
  },
};
