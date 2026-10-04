// Structured data (JSON-LD) for search engines. Nothing here is shown on the
// page; it tells Google, Bing and others who the site is about, so a search
// for the name can be matched to this site and its linked profiles.

import { links, site } from '@/config/site';

export interface ArticleData {
  title: string;
  description: string;
  published: Date;
  updated?: Date;
  url: string;
  image: string;
  citations?: string[];
}

const personId = `${site.url}/#person`;
const websiteId = `${site.url}/#website`;

export const person = () => ({
  '@type': 'Person',
  '@id': personId,
  name: site.name,
  givenName: site.givenName,
  familyName: site.familyName,
  // Other spellings (e.g. Arabic) people may search for.
  alternateName: site.alternateNames,
  jobTitle: site.title.replace(' · ', ' & '),
  url: `${site.url}/`,
  image: `${site.url}/og/home.png`,
  sameAs: [links.github, links.linkedin],
  knowsAbout: site.knowsAbout,
});

export const website = () => ({
  '@type': 'WebSite',
  '@id': websiteId,
  name: site.name,
  url: `${site.url}/`,
  inLanguage: 'en',
  author: { '@id': personId },
});

// The home page is a profile page: Google's recommended type for a page that
// is primarily about one person.
const profilePage = () => ({
  '@type': 'ProfilePage',
  '@id': `${site.url}/#profile`,
  url: `${site.url}/`,
  name: site.homeTitle,
  isPartOf: { '@id': websiteId },
  mainEntity: { '@id': personId },
});

const blogPosting = (article: ArticleData) => ({
  '@type': 'BlogPosting',
  '@id': `${article.url}#article`,
  headline: article.title,
  description: article.description,
  datePublished: article.published.toISOString(),
  dateModified: (article.updated ?? article.published).toISOString(),
  url: article.url,
  image: article.image,
  mainEntityOfPage: article.url,
  inLanguage: 'en',
  isPartOf: { '@id': websiteId },
  author: { '@id': personId },
  ...(article.citations?.length ? { citation: article.citations } : {}),
});

export const structuredData = ({
  isHome = false,
  article,
}: { isHome?: boolean; article?: ArticleData } = {}) => ({
  '@context': 'https://schema.org',
  '@graph': [
    person(),
    website(),
    ...(isHome ? [profilePage()] : []),
    ...(article ? [blogPosting(article)] : []),
  ],
});
