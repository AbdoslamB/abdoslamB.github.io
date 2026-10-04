import { describe, expect, it } from 'vitest';

import type { FeaturedProject } from '@/config/projects';

import {
  formatCount,
  type GitHubSnapshot,
  moreRepos,
  type RepoStats,
  showStars,
  visibleTags,
  withStats,
} from '@/lib/projects';

const repo = (name: string, overrides: Partial<RepoStats> = {}): RepoStats => ({
  name,
  url: `https://github.com/AbdoslamB/${name}`,
  homepage: null,
  description: null,
  language: 'R',
  stars: 0,
  forks: 0,
  pushedAt: '2026-01-01T00:00:00Z',
  fork: false,
  archived: false,
  ...overrides,
});

const snapshot: GitHubSnapshot = {
  fetchedAt: '2026-10-03T00:00:00Z',
  repos: {
    InkDoc: repo('InkDoc', { stars: 44, language: 'Python' }),
    Older: repo('Older', { stars: 3, pushedAt: '2024-01-01T00:00:00Z' }),
    Newer: repo('Newer', { stars: 3, pushedAt: '2026-05-01T00:00:00Z' }),
    Popular: repo('Popular', { stars: 9 }),
    Forked: repo('Forked', { stars: 100, fork: true }),
    Archived: repo('Archived', { stars: 50, archived: true }),
    Hidden: repo('Hidden', { stars: 70 }),
  },
  downloads: { InkDoc: 357 },
};

const project: FeaturedProject = {
  repo: 'inkdoc',
  title: 'InkDoc',
  summary: 'Curated summary',
  tags: [],
};

describe('withStats', () => {
  it('matches repositories case-insensitively and keeps curated text', () => {
    const view = withStats(project, snapshot, 'https://github.com/AbdoslamB');
    expect(view.stats?.stars).toBe(44);
    expect(view.downloads).toBe(357);
    expect(view.summary).toBe('Curated summary');
    expect(view.url).toBe('https://github.com/AbdoslamB/InkDoc');
  });

  it('still renders when the repository is missing from the snapshot', () => {
    const view = withStats(
      { ...project, repo: 'NotFetched' },
      snapshot,
      'https://github.com/AbdoslamB',
    );
    expect(view.stats).toBeUndefined();
    expect(view.url).toBe('https://github.com/AbdoslamB/NotFetched');
  });
});

describe('moreRepos', () => {
  it('skips forks, archived, curated and hidden repos, ranked by stars then activity', () => {
    const names = moreRepos(snapshot, ['inkdoc', 'hidden'], 10).map(
      (r) => r.name,
    );
    expect(names).toEqual(['Popular', 'Newer', 'Older']);
  });

  it('respects the count', () => {
    expect(moreRepos(snapshot, [], 2)).toHaveLength(2);
    expect(moreRepos(snapshot, [], 0)).toHaveLength(0);
  });
});

describe('formatting', () => {
  it('shortens large counts', () => {
    expect(formatCount(357)).toBe('357');
    expect(formatCount(1000)).toBe('1k');
    expect(formatCount(1250)).toBe('1.3k');
  });
});

describe('presentation rules', () => {
  it('shows at most three tags, in the order given', () => {
    expect(visibleTags(['Python', 'Document AI', 'RAG', 'OCR'])).toEqual([
      'Python',
      'Document AI',
      'RAG',
    ]);
    expect(visibleTags(['R'])).toEqual(['R']);
  });

  it('shows stars only from the configured threshold (5)', () => {
    expect(showStars(0)).toBe(false);
    expect(showStars(1)).toBe(false);
    expect(showStars(4)).toBe(false);
    expect(showStars(5)).toBe(true);
    expect(showStars(44)).toBe(true);
  });
});
