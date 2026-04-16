/**
 * useLeaderboard — fetches local rank and friends leaderboards.
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

export function useLeaderboard() {
  const [publicBoard, setPublicBoard] = useState([]);
  const [friendsBoard, setFriendsBoard] = useState([]);
  const [yourRank, setYourRank] = useState(null);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPublic = useCallback(async () => {
    try {
      const { data } = await api.get('/global/leaderboard');
      setPublicBoard(data.leaderboard || []);
      setYourRank(data.yourRank || null);
      setTotalPlayers(data.total || 0);
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
    await Promise.all([fetchPublic(), fetchFriends()]);
    setLoading(false);
  }, [fetchPublic, fetchFriends]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { publicBoard, friendsBoard, yourRank, totalPlayers, loading, refetch: fetchAll };
}
