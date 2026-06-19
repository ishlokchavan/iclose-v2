import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'iclose.saved.v1';

interface SavedValue {
  saved: Set<string>;
  isSaved: (ref: string) => boolean;
  toggle: (ref: string) => void;
}

const Ctx = createContext<SavedValue | null>(null);

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) setSaved(new Set(JSON.parse(raw)));
    });
  }, []);

  const persist = useCallback((next: Set<string>) => {
    setSaved(next);
    AsyncStorage.setItem(KEY, JSON.stringify([...next])).catch(() => {});
  }, []);

  const toggle = useCallback(
    (ref: string) => {
      const next = new Set(saved);
      next.has(ref) ? next.delete(ref) : next.add(ref);
      persist(next);
    },
    [saved, persist],
  );

  return (
    <Ctx.Provider value={{ saved, isSaved: (r) => saved.has(r), toggle }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSaved(): SavedValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSaved must be used within <SavedProvider>');
  return ctx;
}
