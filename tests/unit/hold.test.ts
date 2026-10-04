import { describe, expect, it } from 'vitest';

import {
  holdProgress,
  jumpDuration,
  type SnapInput,
  snapTarget,
} from '@/lib/hold';

const base: SnapInput = {
  scrollY: 0,
  holdLength: 1350,
  contentTop: 2190,
  threshold: 0.5,
  direction: 1,
  input: 'pointer',
};

describe('holdProgress', () => {
  it('maps the hold distance to 0–1 and clamps outside it', () => {
    expect(holdProgress(0, 1350)).toBe(0);
    expect(holdProgress(675, 1350)).toBe(0.5);
    expect(holdProgress(5000, 1350)).toBe(1);
    expect(holdProgress(-20, 1350)).toBe(0);
  });

  it('treats a missing hold as already released', () => {
    expect(holdProgress(0, 0)).toBe(1);
  });
});

describe('snapTarget', () => {
  it('returns to the top after one accidental wheel notch', () => {
    // One notch is ~100 px, about 7% of a 1350 px hold.
    expect(snapTarget({ ...base, scrollY: 100 })).toBe(0);
  });

  it('eases forward to the content once past the threshold', () => {
    expect(snapTarget({ ...base, scrollY: 675 })).toBe(base.contentTop);
    expect(snapTarget({ ...base, scrollY: 1200 })).toBe(base.contentTop);
  });

  it('falls back just below the threshold', () => {
    expect(snapTarget({ ...base, scrollY: 674 })).toBe(0);
  });

  it('leaves the page alone at the top and after the hold', () => {
    expect(snapTarget({ ...base, scrollY: 0 })).toBeNull();
    expect(snapTarget({ ...base, scrollY: 1350 })).toBeNull();
    expect(snapTarget({ ...base, scrollY: 1800 })).toBeNull();
  });

  it('follows the direction of travel for keyboard scrolling', () => {
    // A single arrow-key press (40 px) going down continues forward…
    expect(
      snapTarget({ ...base, scrollY: 40, input: 'keyboard', direction: 1 }),
    ).toBe(base.contentTop);
    // …and going up from deep in the hold returns to the top.
    expect(
      snapTarget({ ...base, scrollY: 1200, input: 'keyboard', direction: -1 }),
    ).toBe(0);
  });

  it('does nothing when there is no hold (no JavaScript layout)', () => {
    expect(snapTarget({ ...base, holdLength: 0, scrollY: 50 })).toBeNull();
  });
});

describe('jumpDuration', () => {
  it('keeps short hops snappy and long jumps under a second', () => {
    expect(jumpDuration(100)).toBe(500);
    expect(jumpDuration(-1000)).toBe(530);
    expect(jumpDuration(20_000)).toBe(900);
  });
});
