/**
 * useSocial — fetches friends list, handles quest assignment and friend adding.
 * Falls back to mock data if API unavailable.
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { mockFriends } from '../data/mockData';

function mapFriend(f) {
  const QUEST_COLORS = { fitness: '#00FF94', growth: '#7B6FFF', social: '#FF3D7F', chaos: '#FF7A1A' };
  return {
    id: f.friendId || f.id,
    name: f.name || 'Unknown',
    username: f.name?.replace(/\s/g, '') || 'user',
    level: f.level || 1,
    class: f.class || 'Explorer',
    status: 'online', // backend doesn't track online status yet
    currentQuest: f.activeQuest || 'No active quest',
    questColor: QUEST_COLORS[f.questCategory] || '#7B6FFF',
    streak: f.streak || 0,
  };
}

export function useSocial() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFriends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/social/friends');
      setFriends((data.friends || []).map(mapFriend));
    } catch (err) {
      console.warn('Social API unavailable, using mock data:', err.message);
      setFriends(mockFriends);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFriends(); }, [fetchFriends]);

  const assignQuest = useCallback(async (friendId, questTitle, questDescription, xpReward) => {
    try {
      const { data } = await api.post('/social/assign', { friendId, questTitle, questDescription, xpReward });
      return data;
    } catch (err) {
      console.warn('Assign quest API failed:', err.message);
      return { success: true, message: 'Sent (offline mode)' };
    }
  }, []);

  const addFriend = useCallback(async (friendCode) => {
    try {
      const { data } = await api.post('/social/add-friend', { friendCode });
      await fetchFriends(); // Refresh list
      return data;
    } catch (err) {
      console.warn('Add friend API failed:', err.message);
      throw err;
    }
  }, [fetchFriends]);

  return { friends, loading, error, refetch: fetchFriends, assignQuest, addFriend };
}
