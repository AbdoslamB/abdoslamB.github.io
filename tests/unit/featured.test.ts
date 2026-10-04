import { describe, expect, it } from 'vitest';

import { homepagePosts } from '@/lib/featured';

const post = (id: string, date: string, featured = false) => ({
  id,
  data: { date: new Date(date), featured },
});

const ids = (posts: { id: string }[]) => posts.map(({ id }) => id);

describe('homepagePosts', () => {
  it('shows featured posts first, newest first', () => {
    const posts = [
      post('old-featured', '2021-11-08', true),
      post('new-plain', '2026-09-01'),
      post('new-featured', '2026-05-01', true),
    ];
    expect(ids(homepagePosts(posts))).toEqual([
      'new-featured',
      'old-featured',
      'new-plain',
    ]);
  });

  it('shows at most three, even when more are featured', () => {
    const posts = [
      post('a', '2026-01-01', true),
      post('b', '2026-02-01', true),
      post('c', '2026-03-01', true),
      post('d', '2026-04-01', true),
    ];
    expect(ids(homepagePosts(posts))).toEqual(['d', 'c', 'b']);
  });

  it('fills empty slots with the newest other posts', () => {
    const posts = [
      post('older', '2025-01-01'),
      post('featured', '2021-11-08', true),
      post('newest', '2026-09-01'),
      post('middle', '2026-01-01'),
    ];
    expect(ids(homepagePosts(posts))).toEqual(['featured', 'newest', 'middle']);
  });

  it('falls back to the newest posts when nothing is featured', () => {
    const posts = [
      post('a', '2024-01-01'),
      post('b', '2026-01-01'),
      post('c', '2025-01-01'),
      post('d', '2023-01-01'),
    ];
    expect(ids(homepagePosts(posts))).toEqual(['b', 'c', 'a']);
  });

  it('handles fewer posts than slots, and none at all', () => {
    expect(ids(homepagePosts([post('only', '2026-01-01')]))).toEqual(['only']);
    expect(homepagePosts([])).toEqual([]);
  });
});
