// A small canvas engine for the hero's interactive dots. It reproduces the
// behaviour of the previous react-tsparticles v1 setup (same density, speed,
// sizes, colours, links, hover repulse and click-to-add) and adds what that
// library couldn't do for this page: a scroll-driven scatter, a burst from a
// point, pausing off-screen and a still mode for reduced motion.

export interface DotOptions {
  // Dots per 800,000 CSS px² of canvas (tsparticles: number 100, area 800).
  density: number;
  colors: string[];
  // Distance per 60 fps frame in CSS px (tsparticles move.speed 2 → 1 px).
  speed: number;
  radius: [number, number];
  opacity: number;
  linkDistance: number;
  linkRgb: string;
  linkOpacity: number;
  repulseDistance: number;
  pushQuantity: number;
  // Cap on dots relative to the density count, so endless clicking can't
  // slow the page down.
  maxFactor: number;
}

export const defaultDotOptions: DotOptions = {
  density: 100,
  colors: ['#ff2600', '#ff8000', '#ffd500', '#22dd22', '#00bfff', '#c912ed'],
  speed: 1,
  radius: [2, 4],
  opacity: 0.9,
  linkDistance: 75,
  linkRgb: '153, 153, 153',
  linkOpacity: 0.9,
  repulseDistance: 100,
  pushQuantity: 3,
  maxFactor: 2,
};

interface Dot {
  x: number;
  y: number;
  // Unit direction of the steady drift.
  vx: number;
  vy: number;
  // Extra velocity from bursts; decays back to zero.
  ex: number;
  ey: number;
  r: number;
  color: number;
}

const FRAME_MS = 1000 / 60;
// How far dots travel outward at full scatter, relative to their distance from
// the centre.
const SCATTER_SPREAD = 1.6;
const BURST_DECAY = 0.92;
const BURST_STRENGTH = 18;
const LINK_BUCKETS = 8;

export const dotCount = (width: number, height: number, density: number) =>
  Math.round((density * width * height) / 800_000);

export class DotField {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly options: DotOptions;
  private dots: Dot[] = [];
  private width = 0;
  private height = 0;
  private pointer: null | { x: number; y: number } = null;
  private scatter = 0;
  private still = false;
  private running = false;
  private frame = 0;
  private last = 0;
  private readonly resizeObserver: ResizeObserver;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    options: Partial<DotOptions> = {},
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    this.ctx = ctx;
    this.options = { ...defaultDotOptions, ...options };
    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
    });
    this.resizeObserver.observe(canvas);
    this.resize();
  }

  get count() {
    return this.dots.length;
  }

  // Reduced motion: dots hold still and ignore the pointer, but stay visible.
  setStill(still: boolean) {
    this.still = still;
    this.draw();
  }

  // 0 = resting, 1 = fully scattered (hero scrolled through its hold).
  setScatter(value: number) {
    this.scatter = Math.min(1, Math.max(0, value));
    if (!this.running) this.draw();
  }

  setPointer(x: number, y: number) {
    this.pointer = { x, y };
  }

  clearPointer() {
    this.pointer = null;
  }

  // Adds dots at a point, like the original click-to-push.
  push(x: number, y: number) {
    if (this.still) return;
    for (let i = 0; i < this.options.pushQuantity; i++) {
      this.dots.push(this.createDot(x, y));
    }
    const cap = Math.max(
      this.options.pushQuantity,
      dotCount(this.width, this.height, this.options.density) *
        this.options.maxFactor,
    );
    if (this.dots.length > cap) this.dots.splice(0, this.dots.length - cap);
  }

  // Throws every dot outward from a point; strongest nearby, gentle far away.
  burst(x: number, y: number) {
    if (this.still) return;
    const reach = Math.hypot(this.width, this.height) * 0.75;
    for (const dot of this.dots) {
      const dx = dot.x - x;
      const dy = dot.y - y;
      const distance = Math.hypot(dx, dy) || 1;
      const strength = BURST_STRENGTH * Math.max(0, 1 - distance / reach) ** 2;
      dot.ex += (dx / distance) * strength;
      dot.ey += (dy / distance) * strength;
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  destroy() {
    this.stop();
    this.resizeObserver.disconnect();
  }

  private readonly tick = (now: number) => {
    if (!this.running) return;
    // Movement is scaled to a 60 fps baseline so speed is the same on 120 Hz
    // screens; long gaps (tab switches) are capped to avoid jumps.
    const factor = Math.min(now - this.last, 50) / FRAME_MS;
    this.last = now;
    if (!this.still) this.update(factor);
    this.draw();
    this.frame = requestAnimationFrame(this.tick);
  };

  private createDot(x?: number, y?: number): Dot {
    const { radius, colors } = this.options;
    const r = radius[0] + Math.random() * (radius[1] - radius[0]);
    const angle = Math.random() * Math.PI * 2;
    return {
      x: x ?? r + Math.random() * Math.max(0, this.width - 2 * r),
      y: y ?? r + Math.random() * Math.max(0, this.height - 2 * r),
      vx: Math.cos(angle),
      vy: Math.sin(angle),
      ex: 0,
      ey: 0,
      r,
      color: Math.floor(Math.random() * colors.length),
    };
  }

  private resize() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (!width || !height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * ratio);
    this.canvas.height = Math.round(height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    if (this.width && this.height) {
      const sx = width / this.width;
      const sy = height / this.height;
      for (const dot of this.dots) {
        dot.x *= sx;
        dot.y *= sy;
      }
    }
    this.width = width;
    this.height = height;

    const target = dotCount(width, height, this.options.density);
    while (this.dots.length < target) this.dots.push(this.createDot());
    if (this.dots.length > target * this.options.maxFactor) {
      this.dots.length = target;
    }
    this.draw();
  }

  private update(factor: number) {
    const { speed, repulseDistance } = this.options;
    const decay = BURST_DECAY ** factor;
    const pointer = this.pointer;

    for (const dot of this.dots) {
      dot.x += (dot.vx * speed + dot.ex) * factor;
      dot.y += (dot.vy * speed + dot.ey) * factor;
      dot.ex *= decay;
      dot.ey *= decay;

      // Hover repulse, same curve as tsparticles: ease-out-quad of closeness,
      // times 100, capped at 50 px per frame.
      if (pointer) {
        const dx = dot.x - pointer.x;
        const dy = dot.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < repulseDistance) {
          const closeness = 1 - distance / repulseDistance;
          const push =
            Math.min(50, (1 - (1 - closeness) ** 2) * 100) *
            Math.min(factor, 1);
          dot.x += distance ? (dx / distance) * push : push;
          dot.y += distance ? (dy / distance) * push : 0;
        }
      }

      // Bounce off the edges.
      if (dot.x < dot.r) {
        dot.x = dot.r;
        dot.vx = Math.abs(dot.vx);
        dot.ex = Math.abs(dot.ex);
      } else if (dot.x > this.width - dot.r) {
        dot.x = this.width - dot.r;
        dot.vx = -Math.abs(dot.vx);
        dot.ex = -Math.abs(dot.ex);
      }
      if (dot.y < dot.r) {
        dot.y = dot.r;
        dot.vy = Math.abs(dot.vy);
        dot.ey = Math.abs(dot.ey);
      } else if (dot.y > this.height - dot.r) {
        dot.y = this.height - dot.r;
        dot.vy = -Math.abs(dot.vy);
        dot.ey = -Math.abs(dot.ey);
      }
    }
  }

  private draw() {
    const { ctx, width, height, options } = this;
    if (!width || !height) return;
    ctx.clearRect(0, 0, width, height);

    // Scatter: push dots away from the centre and fade them as the hero is
    // scrolled through. Eased so the first bit of scroll is a gentle ripple.
    const s = this.scatter * this.scatter;
    const spread = s * SCATTER_SPREAD;
    const fade = 1 - 0.65 * s;
    if (fade <= 0.01) return;
    const cx = width / 2;
    const cy = height / 2;
    const count = this.dots.length;
    const xs = new Float32Array(count);
    const ys = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const dot = this.dots[i];
      xs[i] = dot.x + (dot.x - cx) * spread;
      ys[i] = dot.y + (dot.y - cy) * spread;
    }

    this.drawLinks(xs, ys, fade);

    ctx.globalAlpha = options.opacity * fade;
    for (let color = 0; color < options.colors.length; color++) {
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const dot = this.dots[i];
        if (dot.color !== color) continue;
        ctx.moveTo(xs[i] + dot.r, ys[i]);
        ctx.arc(xs[i], ys[i], dot.r, 0, Math.PI * 2);
      }
      ctx.fillStyle = options.colors[color];
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Links between nearby dots, found with a spatial grid instead of comparing
  // every pair, and batched by opacity so each frame is a handful of strokes.
  private drawLinks(xs: Float32Array, ys: Float32Array, fade: number) {
    const { ctx, options } = this;
    const reach = options.linkDistance;
    const cells = new Map<number, number[]>();
    const key = (cx: number, cy: number) => cx * 100_003 + cy;

    for (let i = 0; i < xs.length; i++) {
      const k = key(Math.floor(xs[i] / reach), Math.floor(ys[i] / reach));
      const cell = cells.get(k);
      if (cell) cell.push(i);
      else cells.set(k, [i]);
    }

    const buckets: Path2D[] = Array.from(
      { length: LINK_BUCKETS },
      () => new Path2D(),
    );
    for (let i = 0; i < xs.length; i++) {
      const gx = Math.floor(xs[i] / reach);
      const gy = Math.floor(ys[i] / reach);
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const cell = cells.get(key(gx + ox, gy + oy));
          if (!cell) continue;
          for (const j of cell) {
            if (j <= i) continue;
            const distance = Math.hypot(xs[i] - xs[j], ys[i] - ys[j]);
            if (distance >= reach) continue;
            const strength = 1 - distance / reach;
            const bucket = Math.min(
              LINK_BUCKETS - 1,
              Math.floor(strength * LINK_BUCKETS),
            );
            buckets[bucket].moveTo(xs[i], ys[i]);
            buckets[bucket].lineTo(xs[j], ys[j]);
          }
        }
      }
    }

    ctx.lineWidth = 1;
    for (let b = 0; b < LINK_BUCKETS; b++) {
      const alpha = ((b + 0.5) / LINK_BUCKETS) * options.linkOpacity * fade;
      ctx.strokeStyle = `rgba(${options.linkRgb}, ${alpha.toFixed(3)})`;
      ctx.stroke(buckets[b]);
    }
  }
}
