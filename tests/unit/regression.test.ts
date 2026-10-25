import { describe, expect, it } from 'vitest';

import { fit, lineThrough, mse, predict, sums } from '@/lib/regression';
import {
  equation,
  handlePositions,
  invertY,
  lab,
  scaleY,
  yTicks,
  yTop,
} from '@/lib/regression-chart';

const xs = [1, 2, 3, 4, 5];
const ys = [2, 4.1, 5.9, 8.2, 9.8];

const bruteMse = (a: number, b: number) =>
  xs.reduce((total, x, i) => total + (ys[i] - (a + b * x)) ** 2, 0) / xs.length;

describe('regression math', () => {
  it('fits the least-squares line', () => {
    const line = fit(sums(xs, ys));
    expect(line?.b).toBeCloseTo(1.97, 10);
    expect(line?.a).toBeCloseTo(0.09, 10);
  });

  it('has no best line when every x is the same', () => {
    expect(fit(sums([3, 3, 3], [1, 2, 3]))).toBeNull();
  });

  it('computes MSE in constant time, matching the sum of squares', () => {
    const s = sums(xs, ys);
    for (const [a, b] of [
      [0, 0],
      [1.5, 2],
      [-3, 0.4],
      [10, -1],
    ]) {
      expect(mse(s, { a, b })).toBeCloseTo(bruteMse(a, b), 10);
    }
  });

  it('draws the line through two points', () => {
    const line = lineThrough(1, 3, 3, 7);
    expect(line).toEqual({ a: 1, b: 2 });
    expect(predict(line, 5)).toBe(11);
  });

  it('rejects empty or mismatched data', () => {
    expect(() => sums([], [])).toThrow(RangeError);
    expect(() => sums([1, 2], [1])).toThrow(RangeError);
  });
});

describe('regression chart', () => {
  it('fits the y-axis to the tallest point, in tidy steps', () => {
    for (const points of lab.batches) {
      const top = yTop(points);
      expect(top % 10).toBe(0);
      expect(top).toBeGreaterThan(Math.max(...points.map(([, y]) => y)));
      expect(yTicks(top).at(-1)).toBeLessThanOrEqual(top);
    }
  });

  it('maps y to pixels and back', () => {
    expect(invertY(scaleY(37.5, 80), 80)).toBeCloseTo(37.5, 10);
  });

  it('keeps both handles inside the plot and apart', () => {
    const top = 80;
    for (const line of [
      { a: 40, b: 0 },
      { a: -10, b: 15 },
      { a: 100, b: -5 },
    ]) {
      const [first, second] = handlePositions(line, top);
      expect(second.x - first.x).toBeGreaterThan(1);
      for (const { y } of [first, second]) {
        expect(y).toBeGreaterThanOrEqual(-0.01 * top);
        expect(y).toBeLessThanOrEqual(1.01 * top);
      }
    }
  });

  it('writes the equation with a true minus sign', () => {
    expect(equation({ a: 8.46, b: 6.42 })).toBe('ŷ = 8.5 + 6.4 × age');
    expect(equation({ a: 30, b: -1.25 })).toBe('ŷ = 30.0 − 1.3 × age');
  });
});
