interface UserStats {
  activeGigs: number;
  events: number;
  messages: number;
  previousStats?: {
    activeGigs: number;
    events: number;
    messages: number;
  };
  changes?: {
    activeGigs: number;
    events: number;
    messages: number;
  };
}

interface UserStatsResponse {
  success: boolean;
  stats: UserStats;
  totalProfileViews?: number;
  lastUpdated: string;
}

class UserStatsAPI {
  private baseURL = import.meta.env.VITE_API_URL;

  async getUserStats(userId: string, token: string): Promise<UserStatsResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/users/${userId}/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user stats: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }

  async refreshUserStats(userId: string, token: string): Promise<UserStatsResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/users/${userId}/stats/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh user stats: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error refreshing user stats:', error);
      throw error;
    }
  }

  // Calculate percentage change from previous period
  calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  // Format percentage change for display
  formatPercentageChange(change: number): string {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change}%`;
  }
}

export const userStatsApi = new UserStatsAPI();
export type { UserStats, UserStatsResponse }; 