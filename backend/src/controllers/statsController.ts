import { Response } from 'express';
import { User } from '../models/User';
import { AuthRequest } from '../types/auth';

// Get user statistics with change calculations
export const getUserStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    
    // Find the user with current stats
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Calculate previous period stats (this would typically come from historical data)
    // For now, we'll simulate this with some logic
    const currentStats = user.stats;
    
    // Simulate previous month's stats (in a real app, this would come from a historical collection)
    const previousStats = {
      activeGigs: Math.max(0, currentStats.activeGigs - Math.floor(Math.random() * 3)),
      events: Math.max(0, currentStats.events - Math.floor(Math.random() * 2)),
      messages: Math.max(0, currentStats.messages - Math.floor(Math.random() * 10)),
    };

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const changes = {
      activeGigs: calculateChange(currentStats.activeGigs, previousStats.activeGigs),
      events: calculateChange(currentStats.events, previousStats.events),
      messages: calculateChange(currentStats.messages, previousStats.messages),
    };

    const response = {
      success: true,
      stats: {
        activeGigs: currentStats.activeGigs,
        events: currentStats.events,
        messages: currentStats.messages,
        previousStats,
        changes,
      },
      lastUpdated: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Error fetching user statistics' });
  }
};

// Refresh user statistics (force recalculation)
export const refreshUserStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    
    // In a real app, this might trigger background jobs to recalculate stats
    // For now, we'll just return fresh data
    await getUserStats(req, res);
  } catch (error) {
    console.error('Error refreshing user stats:', error);
    res.status(500).json({ message: 'Error refreshing user statistics' });
  }
};

// Update specific stat (called when user performs actions)
export const updateUserStat = async (
  userId: string, 
  statType: 'activeGigs' | 'events' | 'messages', 
  increment: number = 1
): Promise<void> => {
  try {
    const updateField = `stats.${statType}`;
    await User.findByIdAndUpdate(
      userId,
      { $inc: { [updateField]: increment } },
      { new: true }
    );
  } catch (error) {
    console.error(`Error updating ${statType} stat:`, error);
    throw error;
  }
}; 