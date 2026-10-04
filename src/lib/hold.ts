// Pure scroll "hold" math, kept free of the DOM so it can be unit-tested.

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

// How far through the hold the visitor is, from 0 (top) to 1 (released).
export const holdProgress = (scrollY: number, holdLength: number) =>
  holdLength <= 0 ? 1 : clamp(scrollY / holdLength, 0, 1);

export type ScrollInput = 'keyboard' | 'pointer';

export interface SnapInput {
  scrollY: number;
  holdLength: number;
  // Scroll position at which the first section sits under the header.
  contentTop: number;
  threshold: number;
  // Direction of the last scroll movement: 1 down, -1 up.
  direction: 1 | -1;
  input: ScrollInput;
}

// Where to ease to once scrolling settles, or null to leave the page alone.
// Wheel, trackpad and touch use the threshold, so a small accidental scroll
// falls back to the top. Keyboard scrolling is always deliberate, so it
// follows the direction of travel instead of fighting each arrow-key press.
export const snapTarget = ({
  scrollY,
  holdLength,
  contentTop,
  threshold,
  direction,
  input,
}: SnapInput): null | number => {
  // A couple of pixels of slack absorbs sub-pixel scroll positions.
  if (holdLength <= 0 || scrollY <= 1 || scrollY >= holdLength - 1) {
    return null;
  }
  const forward =
    input === 'keyboard'
      ? direction === 1
      : holdProgress(scrollY, holdLength) >= threshold;
  return forward ? contentTop : 0;
};

export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

// Longer jumps get a little more time, within limits, so short hops feel snappy
// and a jump to the last section doesn't look like a teleport.
export const jumpDuration = (distance: number) =>
  Math.round(clamp(450 + Math.abs(distance) * 0.08, 500, 900));
