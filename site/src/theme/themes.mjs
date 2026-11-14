// @ts-check
/**
 * Color themes. Each theme changes only the accent color and the tint of the neutrals;
 * signal and semantic colors (src/styles/tokens.css) stay fixed so graphs mean the same thing everywhere.
 * The CSS is generated from this data (astro.config.mjs) and contrast is checked in themes.test.mjs.
 */

/**
 * @typedef {{ low: string, base: string, high: string }} Accent
 * @typedef {{ id: string, label: string, hue: number, sat: number, contrast?: boolean, dark: Accent, light: Accent }} Theme
 */

/** @type {Theme[]} */
export const themes = [
  { id: 'slate', label: 'Slate', hue: 224, sat: 1,
    dark: { low: '#172554', base: '#3b82f6', high: '#93c5fd' },
    light: { low: '#dbeafe', base: '#2563eb', high: '#1e40af' } },
  { id: 'ocean', label: 'Ocean', hue: 196, sat: 1.6,
    dark: { low: '#042f2e', base: '#14b8a6', high: '#5eead4' },
    light: { low: '#ccfbf1', base: '#0f766e', high: '#115e59' } },
  { id: 'forest', label: 'Forest', hue: 130, sat: 0.9,
    dark: { low: '#052e16', base: '#22c55e', high: '#86efac' },
    light: { low: '#dcfce7', base: '#15803d', high: '#166534' } },
  { id: 'ember', label: 'Ember', hue: 28, sat: 1.2,
    dark: { low: '#431407', base: '#f97316', high: '#fdba74' },
    light: { low: '#ffedd5', base: '#c2410c', high: '#9a3412' } },
  { id: 'grape', label: 'Grape', hue: 280, sat: 1.4,
    dark: { low: '#2e1065', base: '#8b5cf6', high: '#c4b5fd' },
    light: { low: '#ede9fe', base: '#7c3aed', high: '#5b21b6' } },
  { id: 'contrast', label: 'High contrast', hue: 0, sat: 0, contrast: true,
    dark: { low: '#332b00', base: '#ffd60a', high: '#ffe566' },
    light: { low: '#e0e0ff', base: '#0000c2', high: '#00007a' } },
];

export const defaultTheme = 'slate';
export const storageKey = 'learn-frc-accent';

// [saturation %, lightness %] for Starlight's gray scale, from lightest text to page background (dark mode order).
const scale = { normal: [[20, 94], [6, 77], [6, 56], [7, 36], [10, 23], [14, 16], [10, 10]],
                contrast: [[0, 100], [0, 92], [0, 72], [0, 45], [0, 24], [0, 12], [0, 0]] };
const lightExtra = { normal: [19, 97], contrast: [0, 96] };

/** @param {number} h @param {number} s @param {number} l */
const hsl = (h, s, l) => `hsl(${h}, ${Math.min(100, Math.round(s))}%, ${l}%)`;

/**
 * Resolve every color variable for one theme and mode.
 * @param {Theme} theme @param {'dark' | 'light'} mode
 * @returns {Record<string, string>}
 */
export function resolve(theme, mode) {
  const steps = theme.contrast ? scale.contrast : scale.normal;
  const g = steps.map(([s, l]) => hsl(theme.hue, s * theme.sat, l));
  const a = theme[mode];
  /** @type {Record<string, string>} */
  const vars = { '--sl-color-accent-low': a.low, '--sl-color-accent': a.base, '--sl-color-accent-high': a.high };
  if (mode === 'dark') {
    vars['--sl-color-white'] = 'hsl(0, 0%, 100%)';
    g.slice(0, 6).forEach((c, i) => (vars[`--sl-color-gray-${i + 1}`] = c));
    vars['--sl-color-black'] = g[6];
  } else {
    // Light mode reverses the scale: "white" is the darkest text and "black" is the page background.
    vars['--sl-color-white'] = g[6];
    [...g.slice(0, 6)].reverse().forEach((c, i) => (vars[`--sl-color-gray-${i + 1}`] = c));
    const [s, l] = theme.contrast ? lightExtra.contrast : lightExtra.normal;
    vars['--sl-color-gray-7'] = hsl(theme.hue, s * theme.sat, l);
    vars['--sl-color-black'] = 'hsl(0, 0%, 100%)';
  }
  return vars;
}

/** @param {Record<string, string>} vars */
const block = (vars) => Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';');

/** CSS for all themes. Unlayered, so it wins over Starlight's layered defaults. */
export function themeCss() {
  return themes.map((t) => {
    const root = t.id === defaultTheme ? `:root,:root[data-accent='${t.id}']` : `:root[data-accent='${t.id}']`;
    const light = t.id === defaultTheme
      ? `:root[data-theme='light'],:root[data-accent='${t.id}'][data-theme='light']`
      : `:root[data-accent='${t.id}'][data-theme='light']`;
    return `${root}{${block(resolve(t, 'dark'))}}\n${light}{${block(resolve(t, 'light'))}}`;
  }).join('\n') + '\n' + widths.map((w) => `:root[data-width='${w.id}']{--sl-content-width:${w.rem}rem}`).join('\n');
}

/** Reading widths for the main column. */
export const widths = [
  { id: 'narrow', label: 'Narrow', rem: 38 },
  { id: 'standard', label: 'Standard', rem: 46 },
  { id: 'wide', label: 'Wide', rem: 60 },
  { id: 'full', label: 'Extra wide', rem: 78 },
];
export const defaultWidth = 'standard';
export const widthKey = 'learn-frc-width';

/** Inline script that applies the saved theme and width before first paint (no flash). */
export const noFlashScript = `(()=>{try{var a=localStorage.getItem('${storageKey}');if(a)document.documentElement.dataset.accent=a;var w=localStorage.getItem('${widthKey}');if(w)document.documentElement.dataset.width=w}catch(e){}})();`;
