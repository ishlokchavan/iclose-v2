import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { SEED_LISTINGS } from '@/data/seed';
import type { ExperienceListing } from '@/types/listing';

interface ExperienceValue {
  listings: ExperienceListing[];
  launches: ExperienceListing[];
  loading: boolean;
  byRef: (reference: string) => ExperienceListing | undefined;
}

const Ctx = createContext<ExperienceValue | null>(null);

/**
 * Same strategy as the web ExperienceProvider: paint instantly from seed
 * data, then quietly upgrade to live listings — first render never blocks on
 * the network, so the app is usable offline too.
 */
export function ExperienceProvider({ children }: { children: React.ReactNode }) {
  const [listings, setListings] = useState<ExperienceListing[]>(SEED_LISTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .listings()
      .then((data) => {
        if (alive && data?.listings?.length) setListings(data.listings);
      })
      .catch(() => {/* keep seed */})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const value = useMemo<ExperienceValue>(
    () => ({
      listings,
      launches: listings.filter((l) => l.completion === 'off_plan'),
      loading,
      byRef: (reference) => listings.find((l) => l.reference === reference),
    }),
    [listings, loading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useExperience(): ExperienceValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useExperience must be used within <ExperienceProvider>');
  return ctx;
}
