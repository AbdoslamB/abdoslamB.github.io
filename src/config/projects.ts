// Curated projects. Order here is the order on the page. Live numbers
// (stars, downloads) are merged in at build time from src/data/github.json,
// which scripts/fetch-github.mjs refreshes.

export interface ProjectLink {
  label: string;
  href: string;
}

export interface FeaturedProject {
  // Repository name under links.github. Matching is case-insensitive.
  repo: string;
  title: string;
  summary: string;
  // One measurable outcome. Leave undefined if there isn't one yet.
  result?: string;
  highlights?: string[];
  // Up to three; only the first three are shown. Lead with the main language
  // and skip anything the title or summary already makes obvious.
  tags: string[];
  links?: ProjectLink[];
  image?: { src: string; alt: string; width: number; height: number };
  // A looping screen recording, one per theme so it matches the site. Both
  // must share the same timing: a theme switch carries on mid-loop. Shown
  // instead of `image` when set.
  video?: {
    alt: string;
    width: number;
    height: number;
    light: DemoVideo;
    dark: DemoVideo;
  };
}

export interface DemoVideo {
  src: string;
  // A still of the first frame, shown until the video plays.
  poster: string;
}

// The flagship's media is the regression lab in index.astro, passed through
// Flagship's `media` slot.
export const flagship: FeaturedProject = {
  repo: 'ModelPlayground',
  title: 'ModelPlayground',
  summary:
    'An interactive lab for learning machine learning: drag, slide and click, and watch the graph, the equation and the error update together.',
  highlights: [
    '11 models, from linear regression to deep Q-networks',
    'Results tested against scikit-learn and Python reference code',
    'Runs entirely in the browser',
  ],
  tags: ['TypeScript', 'Machine learning', 'Data viz'],
  links: [
    {
      label: 'Open the playground',
      href: 'https://abdoslamb.github.io/ModelPlayground/',
    },
  ],
};

export const featured: FeaturedProject[] = [
  {
    repo: 'InkDoc',
    title: 'InkDoc',
    summary:
      'A desktop app and local API that turns any document into clean, AI-ready Markdown, with most conversions running on your own machine.',
    // No tags: its Website and Download buttons take that row.
    tags: [],
    links: [
      {
        label: 'Download',
        href: 'https://abdoslamb.github.io/InkDoc/#download',
      },
      { label: 'Website', href: 'https://abdoslamb.github.io/InkDoc/' },
    ],
  },
  {
    repo: 'IBM_stock_price_forecast',
    title: 'IBM stock price forecast',
    summary:
      'Compared naïve, seasonal naïve, ETS, ARIMA and neural-network models on IBM’s monthly adjusted close, trained on 2016–May 2021 and tested on the following 7 months.',
    result: 'ARIMA cut test RMSE from 17.7 to 5.5 (MASE 0.37)',
    tags: ['R', 'Time series', 'ARIMA'],
  },
  {
    repo: 'Forecasting-with-R-Hyndman',
    title: 'Forecasting: Principles and Practice',
    summary:
      'Worked solutions to Hyndman & Athanasopoulos: regression, time-series decomposition, exponential smoothing and ARIMA.',
    tags: ['R', 'Time series', 'Statistics'],
  },
];

// Repositories never shown in the automatic "More on GitHub" list.
export const hiddenRepos = [
  'AbdoslamB',
  'abdoslamB.github.io',
  'fizzbuzz',
  'kaggle-titanic',
];

// Star counts are shown only from this many up; low counts say little.
export const minStarsShown = 5;

// How many extra repositories to list automatically (newest activity and
// most stars first). Set to 0 to show only the curated projects.
// Off: "All repositories on GitHub" below the projects already covers it.
export const moreCount = 0;
