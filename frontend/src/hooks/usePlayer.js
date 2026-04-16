/**
 * usePlayer — fetches player stats from backend.
 * Falls back to mock data if API is unavailable (demo mode).
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { mockPlayer } from '../data/mockData';

export function usePlayer() {
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlayer = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/player/stats');
      setPlayer({
        name: data.name || 'Adventurer',
        level: data.level || 1,
        xp: data.xp || 0,
        maxXp: data.xpToNextLevel ? data.xp + data.xpToNextLevel : 500,
        streak: data.streak || 0,
        class: data.class || 'Explorer',
        totalQuestsCompleted: data.totalQuestsCompleted || 0,
        totalXpEarned: data.xp || 0, // approximate
        completionRate: data.completionRate || 0,
        strongestCategory: data.strongestCategory,
        mostAvoidedCategory: data.mostAvoidedCategory,
      });
    } catch (err) {
      console.warn('Player API unavailable, using mock data:', err.message);
      setPlayer(mockPlayer);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlayer(); }, [fetchPlayer]);

  return { player, loading, error, refetch: fetchPlayer };
}
