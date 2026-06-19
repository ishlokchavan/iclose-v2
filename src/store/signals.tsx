import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ExperienceListing } from '@/types/listing';
import {
  SIGNAL_WEIGHTS,
  applySignal,
  rankUpcoming,
  scoreListing,
  type Affinity,
  type SignalType,
} from '@/lib/recommender';
import { trackEvent, persistAffinity } from '@/lib/track-event';

interface SignalState {
  seen: Set<string>;
  dismissed: Set<string>;
  track: (type: SignalType, listing: ExperienceListing, dwellMs?: number) => void;
  score: (listing: ExperienceListing) => number;
  rank: (listings: ExperienceListing[]) => ExperienceListing[];
  seed: (facets: Affinity) => void;
  getAffinity: () => Affinity;
  seedVersion: number;
  reset: () => void;
}

const STORAGE_KEY = 'iclose.glass.affinity.v1';

const SignalContext = createContext<SignalState | null>(null);

/** Behavioural recommender store — a React-Native port of the web signal-store. */
export function SignalStoreProvider({ children }: { children: React.ReactNode }) {
  const affinityRef = useRef<Affinity>({});
  const [affinitySnapshot, setAffinitySnapshot] = useState<Affinity>({});
  const seenRef = useRef<Set<string>>(new Set());
  const dismissedRef = useRef<Set<string>>(new Set());
  const [seedVersion, setSeedVersion] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as { affinity?: Affinity; seen?: string[]; dismissed?: string[] };
          if (parsed.affinity) {
            affinityRef.current = parsed.affinity;
            setAffinitySnapshot(parsed.affinity);
          }
          if (parsed.seen) seenRef.current = new Set(parsed.seen);
          if (parsed.dismissed) dismissedRef.current = new Set(parsed.dismissed);
        }
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  // Debounced server-side snapshot of affinity (additive table; for future ML).
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hydrated) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => persistAffinity(affinitySnapshot), 1500);
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [affinitySnapshot, hydrated]);

  const persistLocal = useCallback((nextAffinity: Affinity) => {
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        affinity: nextAffinity,
        seen: [...seenRef.current],
        dismissed: [...dismissedRef.current],
      }),
    ).catch(() => {});
  }, []);

  const track = useCallback<SignalState['track']>(
    (type, listing, dwellMs) => {
      const weight =
        type === 'dwell' && dwellMs
          ? Math.min(SIGNAL_WEIGHTS.dwell, Math.round(dwellMs / 1000) * 4)
          : SIGNAL_WEIGHTS[type];

      seenRef.current.add(listing.reference);
      if (type === 'dislike') dismissedRef.current.add(listing.reference);

      const next = applySignal(affinityRef.current, listing, weight);
      affinityRef.current = next;
      persistLocal(next);
      setAffinitySnapshot(next);
      trackEvent(type, listing.reference, weight, dwellMs);
    },
    [persistLocal],
  );

  const seed = useCallback<SignalState['seed']>(
    (facets) => {
      const next = { ...affinityRef.current };
      for (const [k, v] of Object.entries(facets)) next[k] = (next[k] ?? 0) + v;
      affinityRef.current = next;
      persistLocal(next);
      setAffinitySnapshot(next);
      setSeedVersion((n) => n + 1);
    },
    [persistLocal],
  );

  const score = useCallback((listing: ExperienceListing) => scoreListing(affinityRef.current, listing), []);
  const rank = useCallback(
    (listings: ExperienceListing[]) =>
      rankUpcoming(listings, affinityRef.current, seenRef.current, dismissedRef.current),
    [],
  );
  const getAffinity = useCallback(() => affinityRef.current, []);

  const reset = useCallback(() => {
    seenRef.current = new Set();
    dismissedRef.current = new Set();
    affinityRef.current = {};
    setAffinitySnapshot({});
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    setSeedVersion((n) => n + 1);
  }, []);

  const value = useMemo<SignalState>(
    () => ({
      seen: seenRef.current,
      dismissed: dismissedRef.current,
      track,
      score,
      rank,
      seed,
      getAffinity,
      seedVersion,
      reset,
    }),
    [track, score, rank, seed, getAffinity, seedVersion, reset],
  );

  return <SignalContext.Provider value={value}>{children}</SignalContext.Provider>;
}

export function useSignals(): SignalState {
  const ctx = useContext(SignalContext);
  if (!ctx) throw new Error('useSignals must be used within <SignalStoreProvider>');
  return ctx;
}
