/**
 * usePlayer — fetches full player stats from backend.
 * If user doc doesn't exist (404), triggers re-verify to create it.
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { auth } from '../firebase/config';

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

      // If 404 "User not found", try to re-verify to create the user doc
      if (err.status === 404 && auth.currentUser) {
        try {
          console.log('🔄 User not found — attempting to create via /auth/verify...');
          const token = await auth.currentUser.getIdToken(true); // force refresh
          await api.post('/auth/verify', { idToken: token });
          // Retry fetching stats after verify creates the doc
          const { data } = await api.get('/player/stats');
          setPlayer(data);
          setLoading(false);
          return;
        } catch (retryErr) {
          console.warn('Re-verify failed:', retryErr.message);
        }
      }

      setPlayer(EMPTY_PLAYER);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlayer(); }, [fetchPlayer]);

  return { player, loading, error, refetch: fetchPlayer };
}
