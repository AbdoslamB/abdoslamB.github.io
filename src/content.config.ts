import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

import { withSvgMedia } from '@/lib/svg-media';
import { defineCollection } from 'astro:content';

// Blog posts: one Markdown file per post in src/content/writing/.
// The file name becomes the URL: my-post.md → /writing/my-post/
// Images and diagrams go in src/content/media/<post>/ (see lib/svg-media.ts).
const writing = defineCollection({
  loader: withSvgMedia(
    glob({ pattern: '**/*.md', base: './src/content/writing' }),
    './src/content/writing',
  ),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    // References, shown in a collapsed "Dig deeper" section after the post.
    // Leave `url` out for a source that has no working link.
    sources: z
      .array(z.object({ title: z.string(), url: z.url().optional() }))
      .default([]),
    // Show on the homepage. The homepage lists up to three posts: featured
    // ones first (newest first), then the newest others fill any gaps.
    featured: z.boolean().default(false),
    // Drafts appear in `npm run dev` only.
    draft: z.boolean().default(false),
  }),
});

export const collections = { writing };
