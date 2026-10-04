// Refreshes src/data/github.json with live repository stats before a build.
// If GitHub can't be reached, the committed file is kept so builds never fail
// because of the network. In CI, GITHUB_TOKEN lifts the API rate limit.

import { readFile, writeFile } from 'node:fs/promises';

const USER = 'AbdoslamB';
// Repositories whose release download counts are shown on the site.
const DOWNLOAD_REPOS = ['InkDoc'];
const OUT = new URL('../src/data/github.json', import.meta.url);

const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': `${USER}-site-build`,
  ...(process.env.GITHUB_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    : {}),
};

const getJson = async (path) => {
  const res = await fetch(`https://api.github.com${path}`, {
    headers,
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return res.json();
};

const main = async () => {
  const list = await getJson(`/users/${USER}/repos?per_page=100&type=owner`);

  const repos = {};
  for (const r of list) {
    repos[r.name] = {
      name: r.name,
      url: r.html_url,
      homepage: r.homepage || null,
      description: r.description || null,
      language: r.language || null,
      stars: r.stargazers_count,
      forks: r.forks_count,
      pushedAt: r.pushed_at,
      fork: r.fork,
      archived: r.archived,
    };
  }

  const downloads = {};
  for (const name of DOWNLOAD_REPOS) {
    const releases = await getJson(
      `/repos/${USER}/${name}/releases?per_page=100`,
    );
    downloads[name] = releases
      .flatMap((release) => release.assets)
      .reduce((sum, asset) => sum + asset.download_count, 0);
  }

  const data = { fetchedAt: new Date().toISOString(), repos, downloads };
  await writeFile(OUT, `${JSON.stringify(data, null, 2)}\n`);
  console.log(
    `github.json updated: ${Object.keys(repos).length} repos, downloads ${JSON.stringify(downloads)}`,
  );
};

main().catch(async (error) => {
  let fallback = 'none';
  try {
    fallback = JSON.parse(await readFile(OUT, 'utf8')).fetchedAt;
  } catch {
    // No committed snapshot either; the site renders without live stats.
  }
  console.warn(
    `⚠ Could not refresh GitHub stats (${error.message}). Using snapshot from ${fallback}.`,
  );
});
