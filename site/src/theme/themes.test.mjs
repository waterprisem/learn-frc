import { describe, expect, it } from 'vitest';
import { contrast } from './color.mjs';
import { resolve, themes } from './themes.mjs';

// Pairs Starlight actually renders as text on a background (see its props.css).
const pairs = (v, mode) => [
  ['body text on page', v['--sl-color-gray-2'], v['--sl-color-black']],
  ['headings on page', v['--sl-color-white'], v['--sl-color-black']],
  ['body text on sidebar', v['--sl-color-gray-2'], mode === 'dark' ? v['--sl-color-gray-6'] : v['--sl-color-gray-7']],
  ['links on page', mode === 'dark' ? v['--sl-color-accent-high'] : v['--sl-color-accent'], v['--sl-color-black']],
  ['selected sidebar item', mode === 'dark' ? v['--sl-color-accent-low'] : v['--sl-color-black'],
    mode === 'dark' ? v['--sl-color-accent-high'] : v['--sl-color-accent']],
];

describe('theme contrast (WCAG AA)', () => {
  for (const theme of themes) {
    for (const mode of ['dark', 'light']) {
      it(`${theme.label} ${mode}`, () => {
        for (const [name, fg, bg] of pairs(resolve(theme, mode), mode)) {
          expect(contrast(fg, bg), `${name}: ${fg} on ${bg}`).toBeGreaterThanOrEqual(theme.contrast ? 7 : 4.5);
        }
      });
    }
  }
});
