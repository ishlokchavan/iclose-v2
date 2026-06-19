import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getListings, fetchCarouselImages } from '@/lib/listings';
import { toExperienceListing, FALLBACK_EXPERIENCE_LISTINGS } from '@/data/experience-data';
import type { ExperienceListing } from '@/types/listing';

interface ExperienceValue {
  listings: ExperienceListing[];
  launches: ExperienceListing[];
  loading: boolean;
  byRef: (reference: string) => ExperienceListing | undefined;
}

const Ctx = createContext<ExperienceValue | null>(null);

/**
 * Reads the live Supabase `listings` table (+ `listing_images`) directly —
 * the same data source as the web /experience page — enriching each row with
 * credits + hook. Paints instantly from seed, then upgrades to live data, so
 * first render never blocks on the network and the app works offline too.
 */
export function ExperienceProvider({ children }: { children: React.ReactNode }) {
  const [listings, setListings] = useState<ExperienceListing[]>(FALLBACK_EXPERIENCE_LISTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [live, extras] = await Promise.all([
          getListings({ purpose: 'sale', limit: 50 }),
          fetchCarouselImages(),
        ]);
        if (alive && live.length) {
          setListings(live.map((l) => toExperienceListing(l, extras[l.reference])));
        }
      } catch {
        /* keep seed */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
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
