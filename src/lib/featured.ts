// Which posts the homepage's Writing section shows. Kept free of Astro
// imports so it can be unit-tested.

export const HOMEPAGE_POSTS = 3;

interface Dated {
  data: { date: Date; featured?: boolean };
}

const newestFirst = <T extends Dated>(a: T, b: T) =>
  b.data.date.valueOf() - a.data.date.valueOf();

// Featured posts first (newest first). If fewer than `count` are featured,
// the newest other posts fill the remaining slots, so the section never looks
// half-empty. Drafts are filtered out before this is called.
export const homepagePosts = <T extends Dated>(
  posts: T[],
  count = HOMEPAGE_POSTS,
): T[] => {
  const featured = posts.filter((post) => post.data.featured).sort(newestFirst);
  const others = posts.filter((post) => !post.data.featured).sort(newestFirst);
  return [...featured, ...others].slice(0, Math.max(0, count));
};
