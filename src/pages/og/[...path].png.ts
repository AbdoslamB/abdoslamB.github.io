// Share images (1200×630), rendered at build time for the home page, the
// writing index and every post, so links look right on LinkedIn, Slack, etc.

import type { APIRoute, GetStaticPaths } from 'astro';

import { Resvg } from '@resvg/resvg-js';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import satori from 'satori';

import { site } from '@/config/site';
import { defaultDotOptions } from '@/lib/dots';
import { getPosts } from '@/lib/posts';

interface Props {
  title: string;
  subtitle: string;
}

export const getStaticPaths = (async () => {
  const posts = await getPosts();
  return [
    {
      params: { path: 'home' },
      props: { title: site.name, subtitle: site.title },
    },
    {
      params: { path: 'writing' },
      props: { title: 'Writing', subtitle: site.name },
    },
    ...posts.map((post) => ({
      params: { path: `writing/${post.id}` },
      props: { title: post.data.title, subtitle: site.name },
    })),
  ];
}) satisfies GetStaticPaths;

const require = createRequire(import.meta.url);
const font = (weight: 400 | 700) =>
  readFile(
    require.resolve(
      `@fontsource/inter/files/inter-latin-${String(weight)}-normal.woff`,
    ),
  );

// Satori takes a React-like element tree; this keeps it readable without JSX.
// Satori only supports flex layout, so every box is a flex container.
type Node = string | { type: string; props: Record<string, unknown> };
const h = (
  type: string,
  style: Record<string, number | string>,
  ...children: Node[]
): Node => ({
  type,
  props: { style: { display: 'flex', ...style }, children },
});

// A fixed pseudo-random sequence, so images only change when the text does.
const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

const WIDTH = 1200;
const HEIGHT = 630;

const dots = () => {
  const random = seeded(42);
  const { colors } = defaultDotOptions;
  const points = Array.from({ length: 90 }, () => ({
    x: random() * WIDTH,
    y: random() * HEIGHT,
    r: 2.5 + random() * 3,
    color: colors[Math.floor(random() * colors.length)],
  }));
  const links: string[] = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const a = points[i];
      const b = points[j];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (distance < 110) {
        const opacity = ((1 - distance / 110) * 0.7).toFixed(2);
        links.push(
          `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="#999" stroke-opacity="${opacity}"/>`,
        );
      }
    }
  }
  const circles = points.map(
    ({ x, y, r, color }) =>
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}" fill-opacity="0.9"/>`,
  );
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${String(WIDTH)}" height="${String(HEIGHT)}">${links.join('')}${circles.join('')}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

export const GET: APIRoute<Props> = async ({ props }) => {
  const [regular, bold] = await Promise.all([font(400), font(700)]);
  const titleSize = props.title.length > 48 ? 60 : 76;

  const tree = h(
    'div',
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      position: 'relative',
      backgroundColor: '#000',
      color: '#fff',
      fontFamily: 'Inter',
    },
    {
      type: 'img',
      props: {
        src: dots(),
        width: WIDTH,
        height: HEIGHT,
        style: { position: 'absolute', top: 0, left: 0 },
      },
    },
    h(
      'div',
      {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        padding: '0 96px',
        backgroundImage:
          'linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.2) 100%)',
      },
      h('div', {
        display: 'flex',
        width: 96,
        height: 8,
        borderRadius: 4,
        marginBottom: 36,
        backgroundImage:
          'linear-gradient(90deg, #ff2600, #ff8000, #ffd500, #22dd22, #00bfff, #c912ed)',
      }),
      h(
        'div',
        {
          fontSize: titleSize,
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: -1.5,
          maxWidth: 900,
        },
        props.title,
      ),
      h(
        'div',
        { marginTop: 28, fontSize: 34, color: 'rgba(255,255,255,0.8)' },
        props.subtitle,
      ),
      h(
        'div',
        {
          position: 'absolute',
          bottom: 56,
          left: 96,
          fontSize: 26,
          color: 'rgba(255,255,255,0.65)',
        },
        site.url.replace('https://', ''),
      ),
    ),
  );

  const svg = await satori(tree as Parameters<typeof satori>[0], {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: 'Inter', data: regular, weight: 400, style: 'normal' },
      { name: 'Inter', data: bold, weight: 700, style: 'normal' },
    ],
  });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } })
    .render()
    .asPng();

  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png' },
  });
};
