import { api } from '../config/api';

export interface Proposal {
  _id: string;
  gig: {
    _id: string;
    title: string;
    price: number;
    category?: string;
    deliveryTime?: string;
    status?: string;
    freelancer?: {
      _id: string;
      name: string;
      email: string;
      picture?: string;
    };
  };
  freelancer: {
    _id: string;
    name: string;
    email: string;
    picture?: string;
    profile?: {
      bio?: string;
      location?: string;
      skills?: string[];
    };
    stats?: {
      activeGigs: number;
      completedProjects: number;
      rating: number;
    };
  };
  coverLetter: string;
  proposedPrice: number;
  deliveryTime: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  clientMessage?: string;
  attachments?: Array<{
    url: string;
    filename: string;
    size: number;
    type: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalSubmission {
  coverLetter: string;
  proposedPrice: number;
  deliveryTime: string;
  attachments?: Array<{
    url: string;
    filename: string;
    size: number;
    type: string;
  }>;
}

export interface ProposalStats {
  freelancer: {
    totalProposals: number;
    pendingProposals: number;
    acceptedProposals: number;
    rejectedProposals: number;
    withdrawnProposals: number;
    avgProposedPrice: number;
  };
  client: {
    totalReceived: number;
    pendingReceived: number;
    acceptedReceived: number;
    rejectedReceived: number;
  };
}

export interface ProposalsResponse {
  success: boolean;
  data: {
    proposals: Proposal[];
    pagination: {
      current: number;
      pages: number;
      total: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export const proposalApi = {
  // Submit a proposal for a gig
  submitProposal: async (gigId: string, proposal: ProposalSubmission): Promise<Proposal> => {
    const response = await api.post(`/api/proposals/gig/${gigId}`, proposal);
    return response.data.data;
  },

  // Get proposals for a specific gig (for gig owners)
  getGigProposals: async (
    gigId: string, 
    status?: string, 
    page = 1, 
    limit = 10
  ): Promise<ProposalsResponse> => {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await api.get(`/api/proposals/gig/${gigId}?${params}`);
    return response.data;
  },

  // Get user's proposals (for freelancers)
  getUserProposals: async (
    status?: string, 
    page = 1, 
    limit = 10
  ): Promise<ProposalsResponse> => {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await api.get(`/api/proposals/user/my-proposals?${params}`);
    return response.data;
  },

  // Accept a proposal (for gig owners)
  acceptProposal: async (proposalId: string, clientMessage?: string): Promise<Proposal> => {
    const response = await api.put(`/api/proposals/${proposalId}/accept`, {
      clientMessage
    });
    return response.data.data;
  },

  // Reject a proposal (for gig owners)
  rejectProposal: async (proposalId: string, clientMessage?: string): Promise<Proposal> => {
    const response = await api.put(`/api/proposals/${proposalId}/reject`, {
      clientMessage
    });
    return response.data.data;
  },

  // Withdraw a proposal (for freelancers)
  withdrawProposal: async (proposalId: string): Promise<Proposal> => {
    const response = await api.put(`/api/proposals/${proposalId}/withdraw`);
    return response.data.data;
  },

  // Get proposal statistics
  getProposalStats: async (): Promise<ProposalStats> => {
    const response = await api.get('/api/proposals/user/stats');
    return response.data.data;
  },
}; 