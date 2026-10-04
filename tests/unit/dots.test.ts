import { describe, expect, it } from 'vitest';

import { dotCount } from '@/lib/dots';

// tsparticles v1 density: count = value × canvas area / (1000 × density.area),
// with value 100 and area 800 on the original site.
describe('dotCount', () => {
  it('matches the original density on common screens', () => {
    expect(dotCount(1440, 900, 100)).toBe(162);
    expect(dotCount(1920, 1080, 100)).toBe(259);
    expect(dotCount(390, 844, 100)).toBe(41);
  });
});
