/**
 * App typography — Inter for body (weight-mapped) + Anton for display headings,
 * matching the poster. We patch React Native's <Text> so every text node
 * defaults to the correct Inter weight file without touching each call site;
 * an explicit `fontFamily` (e.g. the `font-heading` Anton class) always wins.
 */
import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { Anton_400Regular } from '@expo-google-fonts/anton';

export const FONT_MAP = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Anton_400Regular,
};

export function useAppFonts() {
  return useFonts(FONT_MAP);
}

function interFor(weight?: string | number): string {
  const w = weight == null ? 400 : weight === 'bold' ? 700 : weight === 'normal' ? 400 : Number(weight);
  if (!Number.isFinite(w)) return 'Inter_400Regular';
  if (w >= 800) return 'Inter_800ExtraBold';
  if (w >= 700) return 'Inter_700Bold';
  if (w >= 600) return 'Inter_600SemiBold';
  if (w >= 500) return 'Inter_500Medium';
  return 'Inter_400Regular';
}

let patched = false;

/** Route every <Text> through Inter, mapping fontWeight → the matching Inter file. */
export function installFontDefaults() {
  if (patched) return;
  patched = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Comp = RNText as any;
  const orig = Comp.render;
  if (typeof orig !== 'function') return;
  Comp.render = function patchedRender(...args: unknown[]) {
    const el = orig.apply(this, args);
    if (!el?.props) return el;
    const flat = StyleSheet.flatten(el.props.style) || {};
    if (flat.fontFamily) return el; // explicit font (Anton headings) wins
    const fontFamily = interFor(flat.fontWeight as string | number | undefined);
    return React.cloneElement(el, {
      style: [{ fontFamily }, el.props.style, { fontWeight: undefined }],
    });
  };
}
