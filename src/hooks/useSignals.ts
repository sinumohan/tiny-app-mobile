import { useState, useCallback } from 'react';
import { supabase, Signal } from '../lib/supabase';

export function useSignals(userId?: string) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSignals = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('dossiers')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSignals(data ?? []);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load signals');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createSignal = async (payload: {
    problem_statement: string;
    current_alternatives: string;
    behavior_change_reason: string;
    target_customer: string;
    unfair_advantage: string;
    kill_assumption: string;
    idea_title?: string;
  }) => {
    if (!userId) return { error: 'Not authenticated', data: null };

    const title = payload.idea_title || payload.problem_statement.slice(0, 60);

    const { data, error } = await supabase
      .from('dossiers')
      .insert({
        user_id: userId,
        idea_title: title,
        ...payload,
        status: 'draft',
      })
      .select()
      .single();

    if (!error && data) {
      setSignals((prev) => [data, ...prev]);
    }

    return { data, error };
  };

  const getSignal = async (id: string): Promise<{ data: Signal | null; error: any }> => {
    const { data, error } = await supabase
      .from('dossiers')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  };

  return { signals, loading, error, fetchSignals, createSignal, getSignal };
}
