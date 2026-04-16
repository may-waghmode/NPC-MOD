/**
 * useLeaderboard — fetches public and friends leaderboards.
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

export function useLeaderboard() {
  const [publicBoard, setPublicBoard] = useState([]);
  const [friendsBoard, setFriendsBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPublic = useCallback(async () => {
    try {
      const { data } = await api.get('/global/leaderboard');
      setPublicBoard(data.leaderboard || []);
    } catch (err) {
      console.warn('Public leaderboard unavailable:', err.message);
      setPublicBoard([]);
    }
  }, []);

  const fetchFriends = useCallback(async () => {
    try {
      const { data } = await api.get('/global/leaderboard/friends');
      setFriendsBoard(data.leaderboard || []);
    } catch (err) {
      console.warn('Friends leaderboard unavailable:', err.message);
      setFriendsBoard([]);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchPublic(), fetchFriends()]);
    setLoading(false);
  }, [fetchPublic, fetchFriends]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { publicBoard, friendsBoard, loading, error, refetch: fetchAll };
}
