import { type CollectionEntry, getCollection } from 'astro:content';

export type Post = CollectionEntry<'writing'>;

// Drafts are visible while developing (with a "Draft" badge) but never built
// into the live site.
export const getPosts = async (): Promise<Post[]> => {
  const posts = await getCollection(
    'writing',
    ({ data }) => import.meta.env.DEV || !data.draft,
  );
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
};

// The Writing section only appears once there's enough to read, so the site
// never shows an empty or one-post blog.
export const MIN_POSTS_FOR_SECTION = 2;

export const showWriting = (posts: Post[]) =>
  posts.length >= MIN_POSTS_FOR_SECTION;

// Counts only words a reader sees: images, inline illustrations and other
// HTML are stripped first, so alt text and SVG markup don't inflate it.
export const readingMinutes = (body = '') => {
  const text = body
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .trim();
  return Math.max(1, Math.round(text.split(/\s+/).length / 220));
};

export const formatDate = (date: Date) =>
  date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
