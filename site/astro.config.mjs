// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import starlight from '@astrojs/starlight';
import { tracks } from './src/data/path.mjs';
import { noFlashScript, themeCss } from './src/theme/themes.mjs';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Learn FRC Programming',
      description: 'An interactive path from zero to contributing robot code on an FRC team.',
      customCss: ['./src/styles/tokens.css', './src/styles/components.css'],
      components: {
        ThemeSelect: './src/components/ThemeSelect.astro',
        PageTitle: './src/components/PageTitle.astro',
      },
      head: [
        { tag: 'style', content: themeCss() },
        { tag: 'script', content: noFlashScript },
      ],
      // The sidebar is the learning path (src/data/path.mjs).
      sidebar: [
        { label: 'Learning path', link: '/' },
        ...tracks.map((t) => ({
          label: `${t.key} · ${t.label}`,
          collapsed: true,
          items: [{ autogenerate: { directory: t.dir } }],
        })),
      ],
      pagination: true,
      lastUpdated: false,
    }),
    react(),
  ],
});
