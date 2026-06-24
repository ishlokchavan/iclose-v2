import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Decision = 'saved' | 'passed';

const KEY = 'iclose.glass.decisions.v1';

interface SavedValue {
  decisions: Record<string, Decision>;
  savedRefs: string[];
  saved: Set<string>;
  isSaved: (ref: string) => boolean;
  isDecided: (ref: string) => boolean;
  save: (ref: string) => void;
  pass: (ref: string) => void;
  toggle: (ref: string) => void;
  reset: () => void;
}

const Ctx = createContext<SavedValue | null>(null);

/**
 * Saved / passed decisions — mirrors the web saved-store (kept on-device, the
 * same as the web app's localStorage). "Saved" homes power the Saved tab;
 * "passed" homes drop out of the feed.
 */
export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setDecisions(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(KEY, JSON.stringify(decisions)).catch(() => {});
  }, [decisions, hydrated]);

  const setDecision = useCallback((ref: string, decision: Decision) => {
    setDecisions((prev) => ({ ...prev, [ref]: decision }));
  }, []);

  const value = useMemo<SavedValue>(() => {
    const savedRefs = Object.entries(decisions)
      .filter(([, d]) => d === 'saved')
      .map(([ref]) => ref);
    return {
      decisions,
      savedRefs,
      saved: new Set(savedRefs),
      isSaved: (ref) => decisions[ref] === 'saved',
      isDecided: (ref) => ref in decisions,
      save: (ref) => setDecision(ref, 'saved'),
      pass: (ref) => setDecision(ref, 'passed'),
      toggle: (ref) =>
        setDecisions((prev) => {
          const next = { ...prev };
          if (next[ref] === 'saved') delete next[ref];
          else next[ref] = 'saved';
          return next;
        }),
      reset: () => setDecisions({}),
    };
  }, [decisions, setDecision]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSaved(): SavedValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSaved must be used within <SavedProvider>');
  return ctx;
}
