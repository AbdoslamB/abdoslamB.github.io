export default {
  extends: ['stylelint-config-standard-scss'],
  rules: {
    // BEM-style names (block__element--modifier) are used throughout.
    'selector-class-pattern': null,
    // Fallback declarations (vh before svh) are intentional.
    'declaration-block-no-duplicate-properties': [
      true,
      { ignore: ['consecutive-duplicates-with-different-syntaxes'] },
    ],
    'declaration-block-no-duplicate-custom-properties': null,
    // SCSS partials are imported with @use.
    'scss/load-no-partial-leading-underscore': null,
  },
};
