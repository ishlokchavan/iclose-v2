import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'iclose.enquiries.v1';

interface EnquiriesValue {
  enquired: Set<string>;
  hasEnquired: (ref: string) => boolean;
  markEnquired: (ref: string) => void;
}

const Ctx = createContext<EnquiriesValue | null>(null);

/** Tracks which listings the user has enquired about (persisted locally). */
export function EnquiriesProvider({ children }: { children: React.ReactNode }) {
  const [enquired, setEnquired] = useState<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) setEnquired(new Set(JSON.parse(raw)));
    });
  }, []);

  const markEnquired = useCallback((ref: string) => {
    setEnquired((prev) => {
      if (prev.has(ref)) return prev;
      const next = new Set(prev).add(ref);
      AsyncStorage.setItem(KEY, JSON.stringify([...next])).catch(() => {});
      return next;
    });
  }, []);

  return (
    <Ctx.Provider value={{ enquired, hasEnquired: (r) => enquired.has(r), markEnquired }}>
      {children}
    </Ctx.Provider>
  );
}

export function useEnquiries(): EnquiriesValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useEnquiries must be used within <EnquiriesProvider>');
  return ctx;
}
