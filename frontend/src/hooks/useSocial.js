import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

export function useSocial() {
  const [friends, setFriends] = useState([]);
  const [incomingQuests, setIncomingQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFriends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/social/friends');
      setFriends(data.friends || []);
    } catch (err) {
      console.warn('Social API unavailable:', err.message || err);
      setFriends([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch incoming friend-assigned quests
  const fetchIncoming = useCallback(async () => {
    try {
      const { data } = await api.get('/quests/daily');
      const pending = (data.daily_quests || []).filter(q => q.assignedBy && q.assignedBy !== 'self' && q.assignedBy !== 'system');
      setIncomingQuests(pending);
    } catch {
      setIncomingQuests([]);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
    fetchIncoming();
  }, [fetchFriends, fetchIncoming]);

  const assignQuest = useCallback(async (friendId, questTitle, questDescription, xpReward, category) => {
    try {
      const { data } = await api.post('/social/assign', { friendId, questTitle, questDescription, xpReward, category });
      return data;
    } catch (err) {
      throw err;
    }
  }, []);

  const addFriend = useCallback(async (friendCode) => {
    try {
      const { data } = await api.post('/social/add-friend', { friendCode });
      await fetchFriends();
      return data;
    } catch (err) {
      throw err;
    }
  }, [fetchFriends]);

  const acceptIncomingQuest = useCallback(async (questId) => {
    try {
      await api.post('/social/accept-quest', { questId });
      setIncomingQuests(prev => prev.filter(q => q.id !== questId));
    } catch (err) {
      console.warn('Accept quest failed:', err.message);
    }
  }, []);

  return { friends, incomingQuests, loading, error, refetch: fetchFriends, assignQuest, addFriend, acceptIncomingQuest };
}
