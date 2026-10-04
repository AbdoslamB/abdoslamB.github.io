// Generates the favicons in public/icons from the site logo: "ab" plus the
// rainbow dot, on a white circle so it stays visible on dark and light
// browser tabs. Run with `npm run favicon` after changing the logo; the
// output files are committed.
//
// The lettering uses General Sans, fetched from Fontshare at run time. Its
// license allows turning the font into logos and images, but not committing
// the font files themselves, so they're never written to disk here.

import { Resvg } from '@resvg/resvg-js';
import { writeFile } from 'node:fs/promises';
import satori from 'satori';

const OUT = new URL('../public/icons/', import.meta.url);
const TEXT = 'ab';
// Bold reads better than the logo's semibold at 16 px.
const WEIGHT = 700;
const COLORS = [
  '#ff2600',
  '#ff8000',
  '#ffd500',
  '#22dd22',
  '#00bfff',
  '#c912ed',
];
const PLACEHOLDER = '#010203';

const fetchFont = async () => {
  const css = await (
    await fetch(
      `https://api.fontshare.com/v2/css?f[]=general-sans@${String(WEIGHT)}&display=swap`,
    )
  ).text();
  const ttf = /url\('([^']+\.ttf)'\)/.exec(css)?.[1];
  if (!ttf) throw new Error('No TTF in the Fontshare stylesheet');
  const res = await fetch(`https:${ttf}`);
  return Buffer.from(await res.arrayBuffer());
};

// Lays out "ab" and the dot with Satori, returning the lettering as a path
// and the dot's box (Satori marks it with the placeholder colour).
const layout = async (font) => {
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'center',
          width: 256,
          height: 256,
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                fontSize: 160,
                fontWeight: WEIGHT,
                letterSpacing: -4,
                color: '#000',
              },
              children: TEXT,
            },
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                // A little larger than in the header so it survives 16 px.
                width: 52,
                height: 52,
                marginLeft: 6,
                borderRadius: 52,
                backgroundColor: PLACEHOLDER,
              },
            },
          },
        ],
      },
    },
    {
      width: 256,
      height: 256,
      fonts: [
        { name: 'General Sans', data: font, weight: WEIGHT, style: 'normal' },
      ],
    },
  );
  const text = /<path fill="#000" d="([^"]+)"/.exec(svg)?.[1];
  const dot = new RegExp(
    `<path x="([\\d.]+)" y="([\\d.]+)" width="([\\d.]+)" height="([\\d.]+)" fill="${PLACEHOLDER}"`,
  ).exec(svg);
  if (!text || !dot) throw new Error('Unexpected Satori output');
  const [x, y, w, h] = dot.slice(1).map(Number);
  return { text, dot: { cx: x + w / 2, cy: y + h / 2, r: w / 2 } };
};

const bbox = (svgBody) => {
  const box = new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">${svgBody}</svg>`,
  ).getBBox();
  if (!box) throw new Error('Empty logo');
  return box;
};

// The dot in all six colours, like the CSS conic gradient in the header.
const rainbowDot = ({ cx, cy, r }) =>
  COLORS.map((color, i) => {
    const a0 = (i / COLORS.length) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / COLORS.length) * 2 * Math.PI - Math.PI / 2;
    const p = (a) =>
      `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
    return `<path fill="${color}" d="M${cx} ${cy}L${p(a0)}A${r} ${r} 0 0 1 ${p(a1)}Z"/>`;
  }).join('');

// Scales and centres the mark inside a 64×64 icon. `fit` is the share of the
// icon the mark's diagonal may span (it must stay inside the circle).
const icon = ({ text, dot }, { circle, fit }) => {
  const mark = `<path fill="#000" d="${text}"/>${rainbowDot(dot)}`;
  const box = bbox(mark);
  const scale = (64 * fit) / Math.hypot(box.width, box.height);
  const tx = 32 - (box.x + box.width / 2) * scale;
  const ty = 32 - (box.y + box.height / 2) * scale;
  const background = circle
    ? // A faint ring keeps the white circle's edge visible on light tabs.
      '<circle cx="32" cy="32" r="31.25" fill="#fff" stroke="#d4d4d4" stroke-width="1.5"/>'
    : '<rect width="64" height="64" fill="#fff"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${background}<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})">${mark}</g></svg>`;
};

const png = (svg, size) =>
  new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();

// A multi-size .ico holding PNG images (supported by every current browser).
const ico = (images) => {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map(({ data }) => data)]);
};

const main = async () => {
  const shapes = await layout(await fetchFont());
  // Large lettering: the mark spans most of the circle.
  const round = icon(shapes, { circle: true, fit: 0.9 });
  // Apple applies its own rounded mask, so its icon is a full white square.
  const square = icon(shapes, { circle: false, fit: 0.78 });

  const files = {
    'favicon.svg': round,
    'favicon-16x16.png': png(round, 16),
    'favicon-32x32.png': png(round, 32),
    'favicon-96x96.png': png(round, 96),
    'icon-192x192.png': png(round, 192),
    'icon-512x512.png': png(round, 512),
    'apple-touch-icon.png': png(square, 180),
    'favicon.ico': ico(
      [16, 32, 48].map((size) => ({ size, data: png(round, size) })),
    ),
  };
  for (const [name, data] of Object.entries(files)) {
    await writeFile(new URL(name, OUT), data);
  }
  console.log(`Wrote ${Object.keys(files).join(', ')}`);
};

await main();
