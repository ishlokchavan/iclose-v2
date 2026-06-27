import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  getShareAssets, getDistributions, ensureWallet, getMyHoldings,
} from '@/lib/shares';
import { SHARES_SEED } from '@/data/shares-seed';
import type { ShareAsset, ShareDistribution, ShareWallet, ShareHolding } from '@/types/shares';

interface SharesValue {
  assets: ShareAsset[];
  distributions: ShareDistribution[];
  loading: boolean;
  signedIn: boolean;
  wallet: ShareWallet | null;
  holdings: ShareHolding[];
  byId: (id: string) => ShareAsset | undefined;
  bySymbol: (symbol: string) => ShareAsset | undefined;
  holdingFor: (assetId: string) => ShareHolding | undefined;
  distributionsFor: (assetId: string) => ShareDistribution[];
  /** Re-fetch public offerings + distributions (pull-to-refresh). */
  refresh: () => Promise<void>;
  /** Re-fetch the signed-in user's wallet + holdings (after a trade). */
  refreshUser: () => Promise<void>;
}

const Ctx = createContext<SharesValue | null>(null);

/**
 * Tokenized-shares store. Paints instantly from seed, upgrades to live
 * `shares_*` data, and tracks the auth session to load the user's wallet +
 * holdings. Mirrors ExperienceProvider so the module feels native to the app.
 */
export function SharesProvider({ children }: { children: React.ReactNode }) {
  const [assets, setAssets] = useState<ShareAsset[]>(SHARES_SEED);
  const [distributions, setDistributions] = useState<ShareDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [wallet, setWallet] = useState<ShareWallet | null>(null);
  const [holdings, setHoldings] = useState<ShareHolding[]>([]);

  const loadPublic = useCallback(async () => {
    const [a, d] = await Promise.all([getShareAssets(), getDistributions()]);
    if (a.length) setAssets(a);
    setDistributions(d);
  }, []);

  const refreshUser = useCallback(async () => {
    const [w, h] = await Promise.all([ensureWallet(), getMyHoldings()]);
    setWallet(w);
    setHoldings(h);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      await loadPublic();
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      setSignedIn(Boolean(data.session));
      if (data.session) await refreshUser();
      setLoading(false);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      setSignedIn(Boolean(session));
      if (session) { await refreshUser(); }
      else { setWallet(null); setHoldings([]); }
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, [loadPublic, refreshUser]);

  const refresh = useCallback(async () => {
    await Promise.all([loadPublic(), signedIn ? refreshUser() : Promise.resolve()]);
  }, [loadPublic, refreshUser, signedIn]);

  const value = useMemo<SharesValue>(() => ({
    assets, distributions, loading, signedIn, wallet, holdings,
    byId: (id) => assets.find((a) => a.id === id),
    bySymbol: (symbol) => assets.find((a) => a.symbol === symbol),
    holdingFor: (assetId) => holdings.find((h) => h.assetId === assetId),
    distributionsFor: (assetId) => distributions.filter((d) => d.assetId === assetId),
    refresh, refreshUser,
  }), [assets, distributions, loading, signedIn, wallet, holdings, refresh, refreshUser]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShares(): SharesValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useShares must be used within <SharesProvider>');
  return ctx;
}
