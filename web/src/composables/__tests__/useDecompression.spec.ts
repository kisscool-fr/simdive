import { describe, it, expect } from 'vitest';
import { useDecompression } from '../useDecompression';
import { SURFACE_PRESSURE, METERS_TO_BAR } from '../../types/dive';

// Expose tissues to a square profile: instant descent, `minutes` at `depth`
function diveAt(depth: number, minutes: number, gfLow = 0.3, gfHigh = 0.85) {
  const deco = useDecompression(gfLow, gfHigh);
  deco.updateTissues(depth, minutes);
  return deco;
}

describe('useDecompression', () => {
  describe('at surface saturation', () => {
    it('has no ceiling and no stops', () => {
      const deco = useDecompression();
      expect(deco.calculateCeiling()).toBe(0);
      expect(deco.calculateDecoStops(0)).toEqual([]);
    });

    it('reports an infinite NDL at the surface', () => {
      expect(useDecompression().calculateNDL(0)).toBe(Infinity);
    });
  });

  describe('NDL / ceiling consistency', () => {
    it('requires deco as soon as the NDL is used up (no dead zone)', () => {
      const deco = useDecompression();
      const ndl = deco.calculateNDL(20);
      expect(ndl).toBeGreaterThan(0);

      // Staying exactly the NDL keeps the dive within no-deco limits
      deco.updateTissues(20, ndl);
      expect(deco.calculateCeiling()).toBe(0);

      // One more minute exceeds the NDL, so a ceiling must appear
      deco.updateTissues(20, 1);
      expect(deco.calculateNDL(20)).toBe(0);
      expect(deco.calculateCeiling()).toBeGreaterThan(0);
    });

    it('never shows NDL 0 without a deco obligation for more than a minute', () => {
      const deco = useDecompression();
      let ndlZeroMinutes = 0;

      for (let t = 1; t <= 60; t++) {
        deco.updateTissues(20, 1);
        const state = deco.getDecoState(20);
        if (state.ndl === 0 && state.ceiling === 0) ndlZeroMinutes++;
      }

      expect(ndlZeroMinutes).toBeLessThanOrEqual(1);
    });

    it('flags deco in getDecoState only when a ceiling exists', () => {
      const noDeco = diveAt(20, 10).getDecoState(20);
      expect(noDeco.ceiling).toBe(0);
      expect(noDeco.ndl).toBeGreaterThan(0);

      const inDeco = diveAt(40, 20).getDecoState(40);
      expect(inDeco.ceiling).toBeGreaterThan(0);
      expect(inDeco.ndl).toBe(-1);
      expect(inDeco.decoStops.length).toBeGreaterThan(0);
    });
  });

  describe('ceiling', () => {
    it('matches the raw Bühlmann ceiling when GF is 100/100', () => {
      const deco = diveAt(40, 30, 1, 1);
      const rawCeiling = Math.max(
        ...deco.tissues.value.map((t) => (t.b * (t.pN2 - t.a) - SURFACE_PRESSURE) / METERS_TO_BAR)
      );

      expect(rawCeiling).toBeGreaterThan(0);
      expect(deco.calculateCeiling()).toBe(Math.ceil(rawCeiling));
    });

    it('lies between the GF-high and GF-low ceilings', () => {
      const ceiling = diveAt(40, 20, 0.3, 0.85).calculateCeiling();
      const gfHighOnly = diveAt(40, 20, 0.85, 0.85).calculateCeiling();
      const gfLowOnly = diveAt(40, 20, 0.3, 0.3).calculateCeiling();

      expect(gfHighOnly).toBeGreaterThan(0);
      expect(ceiling).toBeGreaterThanOrEqual(gfHighOnly);
      expect(ceiling).toBeLessThanOrEqual(gfLowOnly);
    });

    it('is more conservative with lower gradient factors', () => {
      const conservative = diveAt(40, 20, 0.3, 0.7).calculateCeiling();
      const liberal = diveAt(40, 20, 0.5, 0.9).calculateCeiling();

      expect(conservative).toBeGreaterThanOrEqual(liberal);
    });
  });

  describe('deco stops', () => {
    it('places stops on a 3m grid, deepest first, at or below the ceiling', () => {
      const deco = diveAt(40, 25);
      const ceiling = deco.calculateCeiling();
      const stops = deco.calculateDecoStops(40);

      expect(stops.length).toBeGreaterThan(0);
      stops.forEach((stop) => {
        expect(stop.depth % 3).toBe(0);
        expect(stop.duration).toBeGreaterThan(0);
      });
      expect(stops[0]!.depth).toBeGreaterThanOrEqual(ceiling);
      for (let i = 1; i < stops.length; i++) {
        expect(stops[i]!.depth).toBeLessThan(stops[i - 1]!.depth);
      }
    });

    it('clears the ceiling once all stops are completed', () => {
      const deco = diveAt(40, 25);
      const stops = deco.calculateDecoStops(40);

      for (const stop of stops) {
        deco.updateTissues(stop.depth, stop.duration);
      }

      expect(deco.calculateCeiling()).toBe(0);
    });
  });
});
