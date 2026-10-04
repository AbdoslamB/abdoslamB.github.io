// The commit a build was made from, written into every page as
// <meta name="build-commit">. The release script compares it with what it
// pushed to know when the live site is really serving the new version.

import { execSync } from 'node:child_process';

const fromGit = () => {
  try {
    return execSync('git rev-parse HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    return 'unknown';
  }
};

// GitHub Actions sets GITHUB_SHA; locally, ask git. Evaluated once per build.
export const BUILD_COMMIT = process.env.GITHUB_SHA ?? fromGit();
