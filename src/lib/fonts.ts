// General Sans (headings, logo) is served by Fontshare: its license allows
// self-hosting but not committing the files to a public repository. Linking
// Fontshare's stylesheet would block the first paint, so at build time we
// fetch that small stylesheet, inline it, and preload the font file, which
// still downloads from Fontshare's servers. If Fontshare can't be reached
// during a build, pages fall back to the ordinary stylesheet link.

export const FONT_CSS_URL =
  'https://api.fontshare.com/v2/css?f[]=general-sans@600&display=swap';

export interface InlineFont {
  css: string;
  woff2: string;
}

let cached: Promise<InlineFont | null> | undefined;

const load = async (): Promise<InlineFont | null> => {
  try {
    const res = await fetch(FONT_CSS_URL, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    // Fontshare uses protocol-relative URLs; make them explicit.
    const css = (await res.text()).replaceAll("url('//", "url('https://");
    const woff2 = /url\('([^']+\.woff2)'\)/.exec(css)?.[1];
    return woff2 ? { css, woff2 } : null;
  } catch {
    return null;
  }
};

// One request per build, shared by every page.
export const getInlineFont = () => (cached ??= load());
