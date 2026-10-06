// Everything personal about the site lives here. Edit this file to change
// the name, title line, links and the scroll "hold" behaviour on the hero.

export const site = {
  name: 'Abdoslam Baabbad',
  // Search engines only (structured data); never shown on the page.
  givenName: 'Abdoslam',
  familyName: 'Baabbad',
  alternateNames: ['عبد السلام باعباد'],
  // Shown under the name on the hero.
  title: 'Data Scientist',
  // The home page's browser-tab and search-result title.
  homeTitle: 'Abdoslam Baabbad | Data Scientist',
  // Used for search results and link previews (aim for 140–160 characters).
  description:
    'Abdoslam Baabbad is a data scientist working on forecasting, machine learning and optimisation for high-volume financial data, and the builder of InkDoc.',
  url: 'https://abdoslamb.github.io',
  locale: 'en_US',
  // Topics for the Person structured data that search engines read.
  knowsAbout: [
    'Data Science',
    'Data analytics',
    'Time series forecasting',
    'Optimisation',
    'Business analysis',
    'R',
    'Python',
    'Document AI',
  ],
  // Set to a path in /public (e.g. '/headshot.jpg') to show a photo in About.
  headshot: '' as string,
};

export const links = {
  github: 'https://github.com/AbdoslamB',
  linkedin: 'https://www.linkedin.com/in/abdoslambaabbad',
  email: 'abdoslam.baabbad+github@gmail.com',
  // Leave empty to hide the Resume button. A PDF in /public (e.g. '/resume.pdf')
  // or a Google Drive share link both work.
  resume: '' as string,
};

// The hero stays pinned while the visitor scrolls through an extra distance,
// so one accidental wheel notch only ripples the dots instead of leaving the
// page. The distances themselves (1.5 / 0.8 / 0.4 screen heights for desktop,
// mobile and reduced motion) are set in src/styles/_hero.scss.
export const hold = {
  // Below this fraction of the hold, letting go eases back to the top;
  // at or above it, the page eases forward to About.
  snapThreshold: 0.5,
  snapMs: { desktop: 450, mobile: 350 },
  // How long scrolling must have stopped before snapping. `scrollend` fires
  // after every wheel notch, so this has to outlast the pause between notches
  // of someone scrolling slowly on purpose; otherwise they'd be pulled back
  // before reaching halfway.
  settleMs: 400,
};
