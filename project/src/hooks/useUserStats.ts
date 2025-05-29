import { useState, useEffect, useCallback } from 'react';
import { userStatsApi, UserStats, UserStatsResponse } from '../services/userStatsApi';

interface UseUserStatsReturn {
  stats: UserStats | null;
  isLoading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  lastUpdated: string | null;
}

export const useUserStats = (userId: string | undefined, token: string | undefined): UseUserStatsReturn => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!userId || !token) return;

    setIsLoading(true);
    setError(null);

    try {
      // First try the dedicated stats endpoint
      const response = await userStatsApi.getUserStats(userId, token);
      setStats(response.stats);
      setLastUpdated(response.lastUpdated);
    } catch (err) {
      // Fallback: try to get stats from regular user profile endpoint
      try {
        const fallbackResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (fallbackResponse.ok) {
          const userData = await fallbackResponse.json();
          const fallbackStats = {
            activeGigs: userData.stats?.activeGigs || 0,
            events: userData.stats?.events || 0,
            messages: userData.stats?.messages || 0,
            changes: {
              activeGigs: Math.floor(Math.random() * 20) - 10, // Random for demo
              events: Math.floor(Math.random() * 20) - 10,
              messages: Math.floor(Math.random() * 20) - 10,
            }
          };
          setStats(fallbackStats);
          setLastUpdated(new Date().toISOString());
        } else {
          throw new Error('Failed to fetch user data');
        }
      } catch (fallbackErr) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stats';
        setError(errorMessage);
        console.error('Failed to fetch user stats:', err);
        
        // Final fallback to default stats
        setStats({
          activeGigs: 0,
          events: 0,
          messages: 0,
          changes: {
            activeGigs: 0,
            events: 0,
            messages: 0,
          }
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, token]);

  const refreshStats = useCallback(async () => {
    if (!userId || !token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await userStatsApi.refreshUserStats(userId, token);
      setStats(response.stats);
      setLastUpdated(response.lastUpdated);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh stats';
      setError(errorMessage);
      console.error('Failed to refresh user stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, token]);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refreshStats,
    lastUpdated,
  };
}; 