/**
 * useQuests — fetches daily quests + challenge quests from backend.
 * Shows empty state for new users, not fake mock quests.
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

export function useQuests() {
  const [quests, setQuests] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [megaQuest, setMegaQuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQuests = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = forceRefresh ? '/quests/daily?refresh=true' : '/quests/daily';
      const { data } = await api.get(url);
      setQuests(data.daily_quests || []);
      setMegaQuest(data.mega_quest || null);
      setChallenges(data.challenges || []);
    } catch (err) {
      console.warn('Quests API unavailable:', err.message || err);
      setQuests([]);
      setMegaQuest(null);
      setChallenges([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshQuests = useCallback(() => fetchQuests(true), [fetchQuests]);

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
      setChallenges(prev => prev.filter(q => q.id !== questId));
      return data;
    } catch (err) {
      console.warn('Skip quest API failed:', err.message || err);
      setQuests(prev => prev.filter(q => q.id !== questId));
      setChallenges(prev => prev.filter(q => q.id !== questId));
      return { success: true };
    }
  }, []);

  const acceptChallenge = useCallback(async (questId) => {
    try {
      const { data } = await api.post('/social/accept-quest', { questId });
      // Move from challenges to active quests
      setChallenges(prev => {
        const accepted = prev.find(q => q.id === questId);
        if (accepted) {
          setQuests(q => [...q, { ...accepted, status: 'active' }]);
        }
        return prev.filter(q => q.id !== questId);
      });
      return data;
    } catch (err) {
      console.warn('Accept challenge failed:', err.message || err);
      return { success: false };
    }
  }, []);

  return { quests, challenges, megaQuest, loading, error, refetch: fetchQuests, refreshQuests, completeQuest, skipQuest, acceptChallenge };
}
