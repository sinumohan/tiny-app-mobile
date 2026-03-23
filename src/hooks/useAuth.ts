import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchSession(attempt = 1) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (cancelled) return;
        if (error) {
          console.error('[auth] getSession error:', error.message);
          if (attempt < 3) {
            setTimeout(() => fetchSession(attempt + 1), attempt * 1000);
            return;
          }
          setSession(null);
        } else {
          setSession(session);
        }
      } catch (err) {
        console.error('[auth] unexpected getSession error:', err);
        if (!cancelled) {
          if (attempt < 3) {
            setTimeout(() => fetchSession(attempt + 1), attempt * 1000);
            return;
          }
          setSession(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setSession(session);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { session, loading, signIn, signUp, signOut };
}
