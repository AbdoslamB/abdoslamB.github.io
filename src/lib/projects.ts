import { type FeaturedProject, minStarsShown } from '@/config/projects';

export interface RepoStats {
  name: string;
  url: string;
  homepage: string | null;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  pushedAt: string;
  fork: boolean;
  archived: boolean;
}

export interface GitHubSnapshot {
  fetchedAt: string;
  repos: Record<string, RepoStats>;
  downloads: Record<string, number>;
}

export type ProjectView = FeaturedProject & {
  url: string;
  stats?: RepoStats;
  downloads?: number;
};

const findRepo = (snapshot: GitHubSnapshot, repo: string) => {
  const key = Object.keys(snapshot.repos).find(
    (name) => name.toLowerCase() === repo.toLowerCase(),
  );
  return key ? snapshot.repos[key] : undefined;
};

const findDownloads = (snapshot: GitHubSnapshot, repo: string) => {
  const key = Object.keys(snapshot.downloads).find(
    (name) => name.toLowerCase() === repo.toLowerCase(),
  );
  return key ? snapshot.downloads[key] : undefined;
};

// Attaches live stats to a curated project. Curated text always wins; stats are
// optional so a missing or stale snapshot never breaks the page.
export const withStats = (
  project: FeaturedProject,
  snapshot: GitHubSnapshot,
  githubUser: string,
): ProjectView => {
  const stats = findRepo(snapshot, project.repo);
  return {
    ...project,
    url: stats?.url ?? `${githubUser}/${project.repo}`,
    stats,
    downloads: findDownloads(snapshot, project.repo),
  };
};

// Extra repositories for the automatic "More on GitHub" list: originals only
// (no forks or archived repos), never curated or hidden ones, ranked by stars
// and then by most recent activity.
export const moreRepos = (
  snapshot: GitHubSnapshot,
  exclude: string[],
  count: number,
): RepoStats[] => {
  const skip = new Set(exclude.map((name) => name.toLowerCase()));
  return Object.values(snapshot.repos)
    .filter(
      (repo) =>
        !repo.fork && !repo.archived && !skip.has(repo.name.toLowerCase()),
    )
    .sort(
      (a, b) =>
        b.stars - a.stars || Date.parse(b.pushedAt) - Date.parse(a.pushedAt),
    )
    .slice(0, Math.max(0, count));
};

export const formatCount = (value: number) =>
  value >= 1000
    ? `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`
    : String(value);

export const MAX_TAGS = 3;

export const visibleTags = (tags: string[]) => tags.slice(0, MAX_TAGS);

export const showStars = (stars: number) => stars >= minStarsShown;
