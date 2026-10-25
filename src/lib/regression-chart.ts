// Layout for the home page's regression lab, shared by the server-rendered
// SVG (RegressionLab.astro) and the code that makes it interactive
// (regression-lab.ts), so both draw the same chart.
//
// The data is ModelPlayground's "Plant growth" set (the first three of its
// made-up plants): each point is one plant's age and height.

import data from '@/data/regression.json';
import { fit, type Line, predict, sums } from '@/lib/regression';

export type Point = [x: number, y: number];

export const lab = data as typeof data & { batches: Point[][] };

// The SVG's coordinate system; it scales to fit its box.
export const WIDTH = 480;
export const HEIGHT = 250;
export const MARGIN = { top: 12, right: 16, bottom: 40, left: 48 };
export const PLOT = {
  left: MARGIN.left,
  right: WIDTH - MARGIN.right,
  top: MARGIN.top,
  bottom: HEIGHT - MARGIN.bottom,
};

export const [X0, X1] = lab.axes.x;
export const xTicks = [0, 2, 4, 6, 8, 10];

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const snap = (value: number, step: number) =>
  Math.round(value / step) * step;

// x is fixed; y fits the tallest point, rounded up to a tidy 10, as in the
// full lab. The axes only change with new data, never under the visitor's hand.
export const yTop = (points: readonly Point[]) => {
  const tallest = Math.max(...points.map(([, y]) => y)) * 1.15;
  return Math.min(lab.axes.y[1], Math.ceil(tallest / 10) * 10);
};

export const yTicks = (top: number) => {
  const step = top > 60 ? 20 : 10;
  const ticks: number[] = [];
  for (let tick = 0; tick <= top; tick += step) ticks.push(tick);
  return ticks;
};

export const scaleX = (x: number) =>
  PLOT.left + ((x - X0) / (X1 - X0)) * (PLOT.right - PLOT.left);

export const scaleY = (y: number, top: number) =>
  PLOT.bottom - (y / top) * (PLOT.bottom - PLOT.top);

export const invertY = (pixel: number, top: number) =>
  ((PLOT.bottom - pixel) / (PLOT.bottom - PLOT.top)) * top;

// The handles sit 20% and 80% across the data's x-range, so they stay put
// when the data changes.
const allX = lab.batches.flat().map(([x]) => x);
const minX = Math.min(...allX);
const maxX = Math.max(...allX);
export const handleXs = [
  minX + 0.2 * (maxX - minX),
  minX + 0.8 * (maxX - minX),
] as const;

// Where the two handles sit for a line: at their fixed x, unless the line
// leaves the visible range there; then the handle slides along the line to
// just inside the edge, so it can always be seen and grabbed.
export const handlePositions = (line: Line, top: number) => {
  const pad = 0.04 * top;
  const inside = handleXs.map((hx) => {
    const y = predict(line, hx);
    if ((y >= pad && y <= top - pad) || line.b === 0) return hx;
    const edge = y > top - pad ? top - pad : pad;
    return clamp((edge - line.a) / line.b, X0, X1);
  });
  let [x0, x1] = inside;
  // Keep the handles apart, so the line between them stays defined.
  const gap = 0.15 * (X1 - X0);
  if (x1 - x0 < gap) {
    if (x1 - gap >= X0) x0 = x1 - gap;
    else x1 = x0 + gap;
  }
  return [x0, x1].map((x) => ({ x, y: predict(line, x) }));
};

export const bestLine = (points: readonly Point[]) =>
  fit(
    sums(
      points.map(([x]) => x),
      points.map(([, y]) => y),
    ),
  );

// "ŷ = 8.5 + 6.4 × age", with a true minus sign for a falling line.
export const equation = (line: Line) =>
  `ŷ = ${line.a.toFixed(1)} ${line.b < 0 ? '−' : '+'} ${Math.abs(
    line.b,
  ).toFixed(1)} × ${lab.x.word}`;
