import { describe, it, expect } from 'vitest';
import {
  BUHLMANN_ZHL16C,
  WATER_VAPOR_PRESSURE,
  SURFACE_PRESSURE,
  N2_FRACTION,
  O2_FRACTION,
  METERS_TO_BAR,
  MAX_ASCENT_RATE,
  SAFETY_STOP_DEPTH,
  SAFETY_STOP_DURATION,
} from '../dive';

describe('Dive Constants', () => {
  describe('BUHLMANN_ZHL16C Coefficients', () => {
    it('has exactly 16 tissue compartments', () => {
      expect(BUHLMANN_ZHL16C).toHaveLength(16);
    });

    it('each compartment has required properties', () => {
      BUHLMANN_ZHL16C.forEach((compartment, index) => {
        expect(compartment).toHaveProperty('halfTime');
        expect(compartment).toHaveProperty('a');
        expect(compartment).toHaveProperty('b');
        expect(typeof compartment.halfTime).toBe('number');
        expect(typeof compartment.a).toBe('number');
        expect(typeof compartment.b).toBe('number');
      });
    });

    it('half-times are in ascending order', () => {
      for (let i = 1; i < BUHLMANN_ZHL16C.length; i++) {
        expect(BUHLMANN_ZHL16C[i].halfTime).toBeGreaterThan(BUHLMANN_ZHL16C[i - 1].halfTime);
      }
    });

    it('half-times are within expected range (4-635 minutes)', () => {
      BUHLMANN_ZHL16C.forEach((compartment) => {
        expect(compartment.halfTime).toBeGreaterThanOrEqual(4);
        expect(compartment.halfTime).toBeLessThanOrEqual(635);
      });
    });

    it('first compartment (fastest) has correct values', () => {
      const fastest = BUHLMANN_ZHL16C[0];
      expect(fastest.halfTime).toBe(4.0);
      expect(fastest.a).toBe(1.2599);
      expect(fastest.b).toBe(0.505);
    });

    it('last compartment (slowest) has correct values', () => {
      const slowest = BUHLMANN_ZHL16C[15];
      expect(slowest.halfTime).toBe(635.0);
      expect(slowest.a).toBe(0.2327);
      expect(slowest.b).toBe(0.9653);
    });

    it('a coefficients decrease as half-time increases', () => {
      // Generally, 'a' values decrease for slower tissues
      const first = BUHLMANN_ZHL16C[0];
      const last = BUHLMANN_ZHL16C[15];
      expect(first.a).toBeGreaterThan(last.a);
    });

    it('b coefficients increase as half-time increases', () => {
      // Generally, 'b' values increase for slower tissues
      const first = BUHLMANN_ZHL16C[0];
      const last = BUHLMANN_ZHL16C[15];
      expect(first.b).toBeLessThan(last.b);
    });

    it('a coefficients are within valid range (0-2)', () => {
      BUHLMANN_ZHL16C.forEach((compartment) => {
        expect(compartment.a).toBeGreaterThan(0);
        expect(compartment.a).toBeLessThan(2);
      });
    });

    it('b coefficients are within valid range (0.5-1)', () => {
      BUHLMANN_ZHL16C.forEach((compartment) => {
        expect(compartment.b).toBeGreaterThan(0.5);
        expect(compartment.b).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Physical Constants', () => {
    it('WATER_VAPOR_PRESSURE is approximately 0.0627 bar', () => {
      // Water vapor pressure at 37°C body temperature
      expect(WATER_VAPOR_PRESSURE).toBeCloseTo(0.0627, 4);
    });

    it('SURFACE_PRESSURE is approximately 1.013 bar', () => {
      // Standard atmospheric pressure at sea level
      expect(SURFACE_PRESSURE).toBeCloseTo(1.013, 3);
    });

    it('N2_FRACTION is 0.79 (79% nitrogen in air)', () => {
      expect(N2_FRACTION).toBe(0.79);
    });

    it('O2_FRACTION is 0.21 (21% oxygen in air)', () => {
      expect(O2_FRACTION).toBe(0.21);
    });

    it('N2 and O2 fractions sum to 1.0', () => {
      expect(N2_FRACTION + O2_FRACTION).toBe(1.0);
    });

    it('METERS_TO_BAR conversion is correct (10m = 1 bar)', () => {
      expect(METERS_TO_BAR).toBe(0.1);
      // Verify: 10 meters * 0.1 = 1 bar
      expect(10 * METERS_TO_BAR).toBe(1);
    });
  });

  describe('Safety Constants', () => {
    it('MAX_ASCENT_RATE is 10 m/min (standard safe limit)', () => {
      expect(MAX_ASCENT_RATE).toBe(10);
    });

    it('SAFETY_STOP_DEPTH is 5 meters (standard depth)', () => {
      expect(SAFETY_STOP_DEPTH).toBe(5);
    });

    it('SAFETY_STOP_DURATION is 180 seconds (3 minutes)', () => {
      expect(SAFETY_STOP_DURATION).toBe(180);
      // Verify it's exactly 3 minutes
      expect(SAFETY_STOP_DURATION / 60).toBe(3);
    });

    it('safety stop duration is within recreational diving standards (3-5 min)', () => {
      const durationMinutes = SAFETY_STOP_DURATION / 60;
      expect(durationMinutes).toBeGreaterThanOrEqual(3);
      expect(durationMinutes).toBeLessThanOrEqual(5);
    });
  });
});
