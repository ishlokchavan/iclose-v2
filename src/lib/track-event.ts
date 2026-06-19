import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';
import type { SignalType } from './recommender';

/**
 * Best-effort behavioural event logging to the `discovery_events` table —
 * a React-Native port of the web app's lib/glass/track-event.ts. Fire-and-forget:
 * never blocks the UI, swallows all errors, no-ops when Supabase isn't configured.
 */

const STORAGE_KEY = 'iclose.glass.session.v1';
let cachedSessionId: string | null = null;

function isConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

async function sessionId(): Promise<string> {
  if (cachedSessionId) return cachedSessionId;
  try {
    let id = await AsyncStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      await AsyncStorage.setItem(STORAGE_KEY, id);
    }
    cachedSessionId = id;
    return id;
  } catch {
    cachedSessionId = `s_${Date.now()}`;
    return cachedSessionId;
  }
}

export function trackEvent(type: SignalType, reference: string, weight: number, dwellMs?: number): void {
  if (!isConfigured()) return;
  void (async () => {
    try {
      const session_id = await sessionId();
      await supabase.from('discovery_events').insert({
        session_id,
        reference,
        event_type: type,
        weight,
        dwell_ms: dwellMs ?? null,
      });
    } catch {
      /* network/RLS errors are non-fatal for the experience */
    }
  })();
}

/** Upsert the per-session affinity snapshot (fire-and-forget, debounced by caller). */
export function persistAffinity(affinity: Record<string, number>): void {
  if (!isConfigured()) return;
  void (async () => {
    try {
      const session_id = await sessionId();
      await supabase.from('discovery_affinity').upsert(
        { session_id, affinity, updated_at: new Date().toISOString() },
        { onConflict: 'session_id' },
      );
    } catch {
      /* non-fatal */
    }
  })();
}
