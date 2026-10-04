import { describe, expect, it } from 'vitest';

import { structuredData } from '@/lib/seo';

interface Node {
  '@type': string;
  [key: string]: unknown;
}

const graph = (options?: Parameters<typeof structuredData>[0]) =>
  structuredData(options)['@graph'] as Node[];
const byType = (nodes: Node[], type: string) =>
  nodes.find((node) => node['@type'] === type);

describe('structuredData', () => {
  it('describes the person, including the Arabic spelling of the name', () => {
    const person = byType(graph(), 'Person');
    expect(person).toMatchObject({
      name: 'Abdoslam Baabbad',
      givenName: 'Abdoslam',
      familyName: 'Baabbad',
      alternateName: ['عبد السلام باعباد'],
      sameAs: [
        'https://github.com/AbdoslamB',
        'https://www.linkedin.com/in/abdoslambaabbad',
      ],
    });
  });

  it('never includes a location', () => {
    const person = byType(graph(), 'Person');
    expect(person).not.toHaveProperty('homeLocation');
    expect(person).not.toHaveProperty('address');
  });

  it('marks only the home page as a profile page', () => {
    expect(byType(graph({ isHome: true }), 'ProfilePage')).toMatchObject({
      mainEntity: { '@id': 'https://abdoslamb.github.io/#person' },
    });
    expect(byType(graph(), 'ProfilePage')).toBeUndefined();
  });

  it('credits the person as the author of posts', () => {
    const post = byType(
      graph({
        article: {
          title: 'A post',
          description: 'About something',
          published: new Date('2026-10-01T00:00:00Z'),
          url: 'https://abdoslamb.github.io/writing/a-post/',
          image: 'https://abdoslamb.github.io/og/writing/a-post.png',
        },
      }),
      'BlogPosting',
    );
    expect(post).toMatchObject({
      headline: 'A post',
      datePublished: '2026-10-01T00:00:00.000Z',
      dateModified: '2026-10-01T00:00:00.000Z',
      author: { '@id': 'https://abdoslamb.github.io/#person' },
    });
  });

  it("lists a post's sources as citations, only when there are some", () => {
    const base = {
      title: 'A post',
      description: 'About something',
      published: new Date('2021-11-08T00:00:00Z'),
      url: 'https://abdoslamb.github.io/writing/a-post/',
      image: 'https://abdoslamb.github.io/og/writing/a-post.png',
    };
    expect(
      byType(
        graph({ article: { ...base, citations: ['https://example.com/'] } }),
        'BlogPosting',
      ),
    ).toMatchObject({ citation: ['https://example.com/'] });
    expect(byType(graph({ article: base }), 'BlogPosting')).not.toHaveProperty(
      'citation',
    );
  });
});
