// @ts-check
import { satteri } from '@astrojs/markdown-satteri';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { readdirSync, readFileSync } from 'node:fs';

import { inlineSvgImages } from './src/lib/svg-media.ts';

// Until a post is published, /writing/ is a placeholder that shouldn't be in
// the sitemap.
const publishedPosts = readdirSync('src/content/writing').filter(
  (file) =>
    file.endsWith('.md') &&
    !/^draft:\s*true\s*$/m.test(
      readFileSync(`src/content/writing/${file}`, 'utf8'),
    ),
).length;

export default defineConfig({
  site: 'https://abdoslamb.github.io',
  trailingSlash: 'ignore',
  // The stylesheet is ~4 KB gzipped; inlining it saves a render-blocking
  // request on first visit.
  build: { inlineStylesheets: 'always' },
  // SVG diagrams referenced from posts are inlined (see src/lib/svg-media.ts).
  markdown: { processor: satteri({ mdastPlugins: [inlineSvgImages] }) },
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith('/writing/') || publishedPosts >= 1,
      // Tells search engines when the pages last changed (each deploy).
      lastmod: new Date(),
    }),
  ],
  vite: {
    ssr: {
      // Native binary used at build time to render share images.
      external: ['@resvg/resvg-js'],
    },
  },
});
