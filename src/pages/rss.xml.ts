import type { APIRoute } from 'astro';

import rss from '@astrojs/rss';

import { site } from '@/config/site';
import { getPosts } from '@/lib/posts';

export const GET: APIRoute = async (context) => {
  const posts = await getPosts();
  return rss({
    title: `${site.name} — Writing`,
    description: site.description,
    site: context.site ?? site.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/writing/${post.id}/`,
      categories: post.data.tags,
    })),
    customData: '<language>en</language>',
  });
};
