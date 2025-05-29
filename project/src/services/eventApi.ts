import { api } from '../config/api';

interface UploadedImage {
  url: string;
  publicId: string;
}

export interface Event {
  _id: string;
  title: string;
  description: string;
  category: EventCategory;
  date: string;
  endDate?: string;
  time: string;
  endTime?: string;
  location: EventLocation;
  organizer: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
    verified: boolean;
  };
  attendees: Array<{
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  }>;
  maxAttendees?: number;
  price: number;
  currency: string;
  tags: string[];
  images: UploadedImage[];
  status: EventStatus;
  featured: boolean;
  requirements?: string[];
  agenda?: EventAgendaItem[];
  rsvpDeadline?: string;
  createdAt: string;
  updatedAt: string;
  attendeeCount: number;
  spotsRemaining?: number;
  isFull?: boolean;
}

export type EventCategory = 'workshop' | 'conference' | 'networking' | 'hackathon' | 'webinar' | 'meetup' | 'other';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type LocationType = 'online' | 'offline' | 'hybrid';

export interface EventLocation {
  type: LocationType;
  address?: string;
  city?: string;
  country?: string;
  meetingLink?: string;
  venue?: string;
}

export interface EventAgendaItem {
  time: string;
  title: string;
  description?: string;
  speaker?: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  category: EventCategory;
  date: string;
  endDate?: string;
  time: string;
  endTime?: string;
  location: EventLocation;
  maxAttendees?: number;
  price: number;
  currency: string;
  tags: string[];
  images: UploadedImage[];
  status: EventStatus;
  featured?: boolean;
  requirements?: string[];
  agenda?: EventAgendaItem[];
  rsvpDeadline?: string;
}

export interface EventFilters {
  category?: EventCategory;
  status?: EventStatus;
  featured?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  location?: {
    type?: LocationType;
    city?: string;
    country?: string;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  tags?: string[];
  search?: string;
  organizerId?: string;
  limit?: number;
  page?: number;
  sort?: string;
}

// Get all events with filters
export const getEvents = async (filters: EventFilters = {}) => {
  const response = await api.get('/api/events', { params: filters });
  return response.data;
};

// Get single event by ID
export const getEvent = async (id: string) => {
  const response = await api.get(`/api/events/${id}`);
  return response.data;
};

// Create new event
export const createEvent = async (eventData: CreateEventData) => {
  try {
    console.log('Sending event data to backend:', JSON.stringify(eventData, null, 2));
    const response = await api.post('/api/events', eventData);
    return response.data;
  } catch (error: any) {
    console.error('Create event API error:', error);
    console.error('Error response:', error.response?.data);
    
    if (error.response?.data?.details) {
      console.error('Validation details:', error.response.data.details);
    }
    
    // Re-throw with more specific error message
    if (error.response?.data?.message) {
      const errorMessage = error.response.data.message;
      if (error.response.data.details) {
        const validationErrors = error.response.data.details
          .map((detail: any) => `${detail.field}: ${detail.message}`)
          .join(', ');
        throw new Error(`${errorMessage}. Details: ${validationErrors}`);
      }
      throw new Error(errorMessage);
    }
    
    throw error;
  }
};

// Update event
export const updateEvent = async (id: string, eventData: Partial<CreateEventData>) => {
  const response = await api.put(`/api/events/${id}`, eventData);
  return response.data;
};

// Delete event
export const deleteEvent = async (id: string) => {
  const response = await api.delete(`/api/events/${id}`);
  return response.data;
};

// RSVP to event
export const rsvpEvent = async (id: string) => {
  const response = await api.post(`/api/events/${id}/rsvp`);
  return response.data;
};

// Cancel RSVP
export const cancelRsvp = async (id: string) => {
  const response = await api.delete(`/api/events/${id}/rsvp`);
  return response.data;
};

// Get user's organized events
export const getMyEvents = async (filters: { page?: number; limit?: number; status?: string } = {}) => {
  const response = await api.get('/api/events/user/my-events', { params: filters });
  return response.data;
};

// Get user's registered events
export const getMyRegistrations = async (filters: { page?: number; limit?: number } = {}) => {
  const response = await api.get('/api/events/user/registrations', { params: filters });
  return response.data;
};

// Get event analytics
export const getEventAnalytics = async () => {
  const response = await api.get('/api/events/user/analytics');
  return response.data;
};

// Event categories for forms and filters
export const eventCategories = [
  { value: 'workshop', label: 'Workshop' },
  { value: 'conference', label: 'Conference' },
  { value: 'networking', label: 'Networking' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'meetup', label: 'Meetup' },
  { value: 'other', label: 'Other' }
];

// Location types
export const locationTypes = [
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'In-Person' },
  { value: 'hybrid', label: 'Hybrid' }
];
