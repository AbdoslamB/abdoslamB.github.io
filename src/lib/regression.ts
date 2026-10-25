// Linear regression math for the home page's lab, ported from ModelPlayground
// (src/models/linear-regression/math.ts), where it is checked against
// scikit-learn. Pure functions: no DOM, no state.
//
// Everything works from centered sums, so the error of any line costs the
// same however many points there are.

export interface Sums {
  n: number;
  xMean: number;
  yMean: number;
  // Σ (xᵢ − x̄)², Σ (xᵢ − x̄)(yᵢ − ȳ) and Σ (yᵢ − ȳ)².
  sxx: number;
  sxy: number;
  syy: number;
}

export interface Line {
  a: number;
  b: number;
}

// Centered sums, in two passes for accuracy.
export const sums = (xs: readonly number[], ys: readonly number[]): Sums => {
  const n = xs.length;
  if (n === 0 || n !== ys.length) {
    throw new RangeError('sums() needs two non-empty lists of equal length');
  }
  let xTotal = 0;
  let yTotal = 0;
  for (let i = 0; i < n; i++) {
    xTotal += xs[i];
    yTotal += ys[i];
  }
  const xMean = xTotal / n;
  const yMean = yTotal / n;
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - xMean;
    const dy = ys[i] - yMean;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }
  return { n, xMean, yMean, sxx, sxy, syy };
};

// The least-squares line, or null when every x is the same.
export const fit = (s: Sums): Line | null => {
  if (s.sxx <= 0) return null;
  const b = s.sxy / s.sxx;
  return { a: s.yMean - b * s.xMean, b };
};

export const predict = (line: Line, x: number) => line.a + line.b * x;

// The line through two points (the x values must differ). Dragging a handle
// pivots the line around the other handle this way.
export const lineThrough = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): Line => {
  const b = (y2 - y1) / (x2 - x1);
  return { a: y1 - b * x1, b };
};

// Mean squared error of any line, in constant time:
// MSE = (Syy − 2b·Sxy + b²·Sxx) / n + c², with c = a + b·x̄ − ȳ.
export const mse = (s: Sums, line: Line) => {
  const { a, b } = line;
  const c = a + b * s.xMean - s.yMean;
  const spread = (s.syy - 2 * b * s.sxy + b * b * s.sxx) / s.n;
  // A sum of squares; rounding can push it a hair below 0.
  return Math.max(0, spread) + c * c;
};
