import { useState, useCallback } from 'react';
import { supabase, Dossier } from '../lib/supabase';

export function useDossiers(userId?: string) {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDossiers = useCallback(async () => {
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
      setDossiers(data ?? []);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load dossiers');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createDossier = async (payload: {
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
      setDossiers((prev) => [data, ...prev]);
    }

    return { data, error };
  };

  const getDossier = async (id: string): Promise<{ data: Dossier | null; error: any }> => {
    const { data, error } = await supabase
      .from('dossiers')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  };

  return { dossiers, loading, error, fetchDossiers, createDossier, getDossier };
}
