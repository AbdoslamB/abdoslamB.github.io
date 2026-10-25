// Makes the home page's regression lab interactive (see RegressionLab.astro).
// Fetched on demand by src/scripts/lab.ts, only once the lab nears the
// screen. The visitor drags the line or its handles and the error updates:
// at most one redraw per animation frame, and nothing runs between inputs.
// The drag model follows ModelPlayground's Graph.svelte.

import {
  type Line,
  lineThrough,
  mse,
  predict,
  type Sums,
  sums,
} from '@/lib/regression';
import {
  bestLine,
  clamp,
  equation,
  handlePositions,
  HEIGHT,
  invertY,
  lab,
  PLOT,
  type Point,
  scaleX,
  scaleY,
  snap,
  X0,
  X1,
  yTicks,
  yTop,
} from '@/lib/regression-chart';

const SVG_NS = 'http://www.w3.org/2000/svg';

const attrs = (el: Element, values: Record<string, number | string>) => {
  for (const [name, value] of Object.entries(values)) {
    el.setAttribute(
      name,
      typeof value === 'number' ? String(Math.round(value * 100) / 100) : value,
    );
  }
};

const svgEl = (tag: string, values: Record<string, number | string>) => {
  const el = document.createElementNS(SVG_NS, tag);
  attrs(el, values);
  return el;
};

export const mount = (root: HTMLElement) => {
  const svg = root.querySelector<SVGSVGElement>('svg');
  const one = (selector: string) => root.querySelector<SVGElement>(selector);
  const all = (selector: string) => [
    ...root.querySelectorAll<SVGElement>(selector),
  ];

  const userLine = one('[data-lab-line]');
  const hitLine = one('[data-lab-line-hit]');
  const best = one('[data-lab-best]');
  const yAxis = one('[data-lab-yticks]');
  const equationText = one('[data-lab-equation]');
  const mseText = one('[data-lab-mse]');
  const status = one('[data-lab-status]');
  const pointEls = all('[data-lab-point]');
  const missEls = all('[data-lab-misses] line');
  const handleEls = all('[data-lab-handle]');
  if (
    !svg ||
    !userLine ||
    !hitLine ||
    !best ||
    !yAxis ||
    !equationText ||
    !mseText ||
    !status
  ) {
    return;
  }

  const { a: aRange, b: bRange } = lab.params;
  let batch = 0;
  let points: Point[] = [];
  let top = 0;
  let stats: Sums;
  let fitted: Line | null = null;
  let line: Line = { a: 0, b: 0 };

  const setLine = (a: number, b: number) => {
    line = {
      a: snap(clamp(a, aRange.min, aRange.max), aRange.step),
      b: snap(clamp(b, bRange.min, bRange.max), bRange.step),
    };
  };

  // As in the full lab, start flat at the average height: the visitor's job
  // is to tilt it into place.
  const resetLine = () => {
    setLine(Math.round(stats.yMean), 0);
  };

  const drawYAxis = () => {
    yAxis.replaceChildren(
      ...yTicks(top).flatMap((tick) => {
        const y = scaleY(tick, top);
        const label = svgEl('text', {
          x: PLOT.left - 8,
          y: y + 4,
          'text-anchor': 'end',
        });
        label.textContent = String(tick);
        return [
          svgEl('line', { x1: PLOT.left, x2: PLOT.right, y1: y, y2: y }),
          label,
        ];
      }),
    );
  };

  const load = (index: number) => {
    batch = index;
    points = lab.batches[index] ?? [];
    top = yTop(points);
    stats = sums(
      points.map(([x]) => x),
      points.map(([, y]) => y),
    );
    fitted = bestLine(points);
    drawYAxis();
    points.forEach(([x, y], i) => {
      const el = pointEls[i];
      if (el) attrs(el, { cx: scaleX(x), cy: scaleY(y, top) });
    });
  };

  const across = (el: Element, l: Line) => {
    attrs(el, {
      x1: scaleX(X0),
      y1: scaleY(predict(l, X0), top),
      x2: scaleX(X1),
      y2: scaleY(predict(l, X1), top),
    });
  };

  const render = () => {
    across(userLine, line);
    across(hitLine, line);
    if (fitted) across(best, fitted);
    points.forEach(([x, y], i) => {
      const el = missEls[i];
      if (!el) return;
      attrs(el, {
        x1: scaleX(x),
        x2: scaleX(x),
        y1: scaleY(y, top),
        y2: scaleY(predict(line, x), top),
      });
    });
    handlePositions(line, top).forEach(({ x, y }, i) => {
      const el = handleEls[i];
      if (!el) return;
      for (const circle of el.querySelectorAll('circle')) {
        attrs(circle, { cx: scaleX(x), cy: scaleY(y, top) });
      }
      attrs(el, {
        'aria-valuenow': Math.round(y * 10) / 10,
        'aria-valuemax': top,
        'aria-valuetext': `Line height at ${x.toFixed(1)} ${lab.x.unit}: ${y.toFixed(1)} ${lab.y.unit}`,
      });
    });
    equationText.textContent = equation(line);
    mseText.textContent = mse(stats, line).toFixed(1);
  };

  // Screen readers hear the result once the visitor pauses, not every step.
  let announceTimer = 0;
  const announce = () => {
    window.clearTimeout(announceTimer);
    announceTimer = window.setTimeout(() => {
      status.textContent = `${equation(line)}. MSE ${mseText.textContent ?? ''} ${lab.y.unit} squared.`;
    }, 600);
  };

  // ---------------------------------------------------------------- drag
  // The SVG's position is read once per drag, never per move.
  let drag: {
    kind: 'handle' | 'line';
    rect: DOMRect;
    handleX: number;
    pivotX: number;
    pivotY: number;
    startA: number;
    startY: number;
  } | null = null;
  let frame = 0;
  let pointerY = 0;

  const dataY = (clientY: number, rect: DOMRect) =>
    invertY(((clientY - rect.top) / rect.height) * HEIGHT, top);

  const begin = (event: PointerEvent, index: number | null) => {
    if (event.button !== 0) return;
    // On touch screens only the handles drag; elsewhere a swipe scrolls.
    if (index === null && event.pointerType === 'touch') return;
    event.preventDefault();
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
    const rect = svg.getBoundingClientRect();
    const [first, second] = handlePositions(line, top);
    const handle = index === 1 ? second : first;
    const pivot = index === 1 ? first : second;
    drag = {
      kind: index === null ? 'line' : 'handle',
      rect,
      handleX: handle.x,
      pivotX: pivot.x,
      pivotY: pivot.y,
      startA: line.a,
      startY: dataY(event.clientY, rect),
    };
    root.dataset.dragging = '';
  };

  const apply = () => {
    frame = 0;
    if (!drag) return;
    const y = dataY(pointerY, drag.rect);
    if (drag.kind === 'line') {
      setLine(drag.startA + (y - drag.startY), line.b);
    } else {
      const next = lineThrough(drag.pivotX, drag.pivotY, drag.handleX, y);
      setLine(next.a, next.b);
    }
    render();
  };

  const move = (event: PointerEvent) => {
    if (!drag) return;
    pointerY = event.clientY;
    if (!frame) frame = requestAnimationFrame(apply);
  };

  const end = () => {
    if (!drag) return;
    if (frame) {
      cancelAnimationFrame(frame);
      apply();
    }
    drag = null;
    delete root.dataset.dragging;
    announce();
  };

  const listen = (el: SVGElement, index: number | null) => {
    el.addEventListener('pointerdown', (event) => {
      begin(event, index);
    });
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  };

  listen(hitLine, null);
  handleEls.forEach((el, index) => {
    listen(el, index);
    // ↑/↓ move a handle one step (Shift: ten), pivoting the line.
    el.addEventListener('keydown', (event) => {
      const direction =
        event.key === 'ArrowUp' || event.key === 'ArrowRight'
          ? 1
          : event.key === 'ArrowDown' || event.key === 'ArrowLeft'
            ? -1
            : 0;
      if (!direction) return;
      event.preventDefault();
      const [first, second] = handlePositions(line, top);
      const handle = index === 1 ? second : first;
      const pivot = index === 1 ? first : second;
      const step = (top / 100) * (event.shiftKey ? 10 : 1);
      const next = lineThrough(
        pivot.x,
        pivot.y,
        handle.x,
        handle.y + direction * step,
      );
      setLine(next.a, next.b);
      render();
      announce();
    });
  });

  // ------------------------------------------------------------ controls
  const toggle = (button: Element, flag: 'misses' | 'best') => {
    const on = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(on));
    root.toggleAttribute(`data-${flag}`, on);
  };

  root.addEventListener('click', (event) => {
    const button = (event.target as Element).closest('[data-lab-action]');
    if (!button) return;
    const action = button.getAttribute('data-lab-action');
    if (action === 'misses' || action === 'best') {
      toggle(button, action);
      return;
    }
    if (action === 'next') load((batch + 1) % lab.batches.length);
    resetLine();
    render();
    announce();
  });

  load(0);
  resetLine();
  render();
  root.dataset.ready = '';
};
