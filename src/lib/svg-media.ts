import type { Loader, LoaderContext } from 'astro/loaders';

import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Article media lives in src/content/media/<post>/. A Markdown image on its
// own line that points at an .svg there is pasted into the page as inline
// SVG, so it follows the theme (currentColor), picks up the .ill-* styles and
// can animate:
//
//   ![What the diagram shows](../media/my-post/diagram.svg)
//   ![What the diagram shows](../media/my-post/diagram.svg "inline")
//
// The alt text becomes the SVG's aria-label. The "inline" title floats the
// illustration beside the text (.illustration--inline). Other images go
// through Astro's image pipeline as usual.

const SVG_IMAGE = /!\[[^\]]*\]\(\s*<?([^)\s>]+\.svg)/gi;

// Relative .svg paths a Markdown file references.
export const svgReferences = (markdown: string) =>
  [...markdown.matchAll(SVG_IMAGE)]
    .map((match) => match[1])
    .filter((ref): ref is string => !!ref && !URL.canParse(ref));

const escapeAttribute = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// Wraps an SVG file's markup in the article's <figure>, described by `alt`.
export const svgFigure = (svg: string, alt: string, inline = false) => {
  const start = svg.search(/<svg\b/);
  if (start === -1) throw new Error('No <svg> element found');
  const markup = svg
    .slice(start)
    .trim()
    .replace(/<svg\b[^>]*>/, (tag) =>
      tag
        .replace(/\s(?:role|aria-label)="[^"]*"/g, '')
        .replace(
          '<svg',
          `<svg role="img" aria-label="${escapeAttribute(alt)}"`,
        ),
    );
  const className = inline
    ? 'illustration illustration--inline'
    : 'illustration';
  return `<figure class="${className}">\n${markup}\n</figure>`;
};

interface ImageNode {
  type: 'image';
  url: string;
  alt?: string | null;
  title?: string | null;
}

interface ParagraphNode {
  children: readonly { type: string }[];
}

// Sätteri Markdown plugin: see the comment at the top of this file.
export const inlineSvgImages = {
  name: 'inline-svg-images',
  paragraph(node: ParagraphNode, ctx: { fileURL: URL | undefined }) {
    const [child] = node.children;
    if (node.children.length !== 1 || child?.type !== 'image') return;
    const image = child as ImageNode;
    if (!/\.svg$/i.test(image.url) || URL.canParse(image.url)) return;
    if (!ctx.fileURL) return;

    const file = fileURLToPath(new URL(image.url, ctx.fileURL));
    if (!image.alt) {
      throw new Error(`${image.url}: add alt text describing the illustration`);
    }
    return {
      type: 'html' as const,
      value: svgFigure(
        readFileSync(file, 'utf8'),
        image.alt,
        image.title === 'inline',
      ),
    };
  },
};

// Astro re-renders a post only when its Markdown changes. This wraps the
// collection's loader so a post also re-renders when an SVG it references
// changes: the SVGs count towards the post's digest, and in dev an edited SVG
// re-syncs the posts that use it.
export const withSvgMedia = (loader: Loader, base: string): Loader => {
  const baseDir = resolve(base);
  const svgPaths = (markdown: string) =>
    svgReferences(markdown).map((ref) => resolve(baseDir, ref));
  const read = (file: string) => {
    try {
      return readFileSync(file, 'utf8');
    } catch {
      return '';
    }
  };
  const watched = new WeakSet<object>();

  return {
    ...loader,
    load: (ctx: LoaderContext) => {
      const { watcher } = ctx;
      if (watcher && !watched.has(watcher)) {
        watched.add(watcher);
        watcher.on('change', (changed) => {
          if (!changed.toLowerCase().endsWith('.svg')) return;
          const svg = resolve(changed);
          for (const entry of readdirSync(baseDir, { recursive: true })) {
            const post = join(baseDir, String(entry));
            if (!post.endsWith('.md')) continue;
            if (svgPaths(read(post)).includes(svg)) {
              watcher.emit('change', post);
            }
          }
        });
      }
      return loader.load({
        ...ctx,
        generateDigest: (data) =>
          ctx.generateDigest(
            typeof data === 'string'
              ? data + svgPaths(data).map(read).join('\n')
              : data,
          ),
      });
    },
  };
};
