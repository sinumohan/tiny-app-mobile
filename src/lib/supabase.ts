import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Signal {
  id: string;
  user_id: string;
  idea_title: string;
  problem_statement: string;
  current_alternatives: string;
  behavior_change_reason: string;
  target_customer: string;
  unfair_advantage: string;
  kill_assumption: string;
  status: 'draft' | 'phase1_pending' | 'phase1_complete' | 'phase2_pending' | 'phase2_complete' | 'complete';
  tvs: number | null;
  mss: number | null;
  ccs: number | null;
  phase1_result: Phase1Result | null;
  created_at: string;
  updated_at: string;
}

export interface Phase1Result {
  layer1: LayerResult;
  layer2: LayerResult;
  layer3: LayerResult;
  layer4: { assumptions: Assumption[] };
  layer5: LayerResult;
  tvs_breakdown: TVSBreakdown;
  recommendation: 'Proceed' | 'Pivot' | 'Pause';
  recommendation_reasoning: string;
}

export interface LayerResult {
  title: string;
  summary: string;
  score: number;
  details: string[];
}

export interface TVSBreakdown {
  layer1_score: number;
  layer2_score: number;
  layer3_score: number;
  layer4_score: number;
  layer5_score: number;
  total: number;
}

export interface Assumption {
  id: string;
  dossier_id: string;
  assumption_text: string;
  category: string;
  criticality: number;
  evidence_level: number;
  is_tested: boolean;
  created_at: string;
}

export interface Experiment {
  id: string;
  dossier_id: string;
  hypothesis: string;
  tiny_brand_name: string;
  landing_page_url: string | null;
  unique_visitors: number | null;
  conversions: number | null;
  spend: number | null;
  mss: number | null;
  status: 'draft' | 'live' | 'complete';
  created_at: string;
}
