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
}

export const flagship: FeaturedProject = {
  repo: 'InkDoc',
  title: 'InkDoc',
  summary:
    'A desktop app and local API that turns any document into clean, AI-ready Markdown, with most conversions running on your own machine.',
  highlights: [
    'Drop a file, folder or URL and Markdown is saved automatically',
    'Four conversion engines, including OCR for scanned pages',
    'Ready-to-run builds for Windows, macOS and Linux',
  ],
  tags: ['Python', 'Document AI', 'RAG'],
  links: [
    { label: 'Website', href: 'https://abdoslamb.github.io/InkDoc/' },
    {
      label: 'Download',
      href: 'https://github.com/AbdoslamB/InkDoc/releases/latest',
    },
  ],
  image: {
    src: '/projects/inkdoc-demo.gif',
    alt: 'InkDoc converting a document to Markdown in the desktop app',
    width: 1200,
    height: 750,
  },
};

export const featured: FeaturedProject[] = [
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
  {
    repo: 'electron-portal-desktop-template',
    title: 'Electron portal template',
    summary:
      'A secure-by-default Electron starter that wraps web apps in a frameless desktop window with a custom title bar.',
    tags: ['JavaScript', 'Electron', 'Security'],
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
export const moreCount = 4;
