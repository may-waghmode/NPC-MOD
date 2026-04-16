/**
 * usePlayer — fetches full player stats from backend.
 * Returns clean empty state for new users instead of mock data.
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const EMPTY_PLAYER = {
  name: 'Adventurer',
  level: 1,
  xp: 0,
  xpToNextLevel: 500,
  title: 'The Awakening',
  class: 'Explorer',
  streak: 0,
  questsCompleted: 0,
  completionRate: 0,
  strongestCategory: null,
  mostAvoidedCategory: null,
  categoryStats: {},
  weeklyXP: [],
  tagline: '',
  villainModeActive: false,
  avoidancePatterns: [],
  goals: [],
  friendCode: '',
};

export function usePlayer() {
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlayer = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/player/stats');
      setPlayer(data);
    } catch (err) {
      console.warn('Player API unavailable:', err.message || err);
      // Show clean empty state for new users — NOT fake mock data
      setPlayer(EMPTY_PLAYER);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlayer(); }, [fetchPlayer]);

  return { player, loading, error, refetch: fetchPlayer };
}
