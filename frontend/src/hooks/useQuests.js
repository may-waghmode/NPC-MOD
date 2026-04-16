/**
 * useQuests — fetches daily quests from backend.
 * Shows empty state for new users, not fake mock quests.
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

export function useQuests() {
  const [quests, setQuests] = useState([]);
  const [megaQuest, setMegaQuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQuests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/quests/daily');
      setQuests(data.daily_quests || []);
      setMegaQuest(data.mega_quest || null);
    } catch (err) {
      console.warn('Quests API unavailable:', err.message || err);
      setQuests([]);
      setMegaQuest(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQuests(); }, [fetchQuests]);

  const completeQuest = useCallback(async (questId, proofType, proofData) => {
    try {
      const { data } = await api.post('/quests/complete', { questId, proofType, proofData });
      if (data.verified) {
        setQuests(prev => prev.filter(q => q.id !== questId));
      }
      return data;
    } catch (err) {
      console.warn('Complete quest API failed:', err.message || err);
      // Still remove from UI
      setQuests(prev => prev.filter(q => q.id !== questId));
      return { verified: true, earnedXP: 0, newXP: 0, leveledUp: false, message: 'Completed (offline)' };
    }
  }, []);

  const skipQuest = useCallback(async (questId) => {
    try {
      const { data } = await api.post('/quests/skip', { questId });
      setQuests(prev => prev.filter(q => q.id !== questId));
      return data;
    } catch (err) {
      console.warn('Skip quest API failed:', err.message || err);
      setQuests(prev => prev.filter(q => q.id !== questId));
      return { success: true };
    }
  }, []);

  return { quests, megaQuest, loading, error, refetch: fetchQuests, completeQuest, skipQuest };
}
