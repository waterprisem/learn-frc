// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import starlight from '@astrojs/starlight';
import { tracks } from './src/data/path.mjs';
import { glossaryScript } from './src/theme/glossaryScript.mjs';
import { noFlashScript, themeCss } from './src/theme/themes.mjs';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Learn FRC Programming',
      description: 'An interactive path from zero to contributing robot code on an FRC team.',
      customCss: [
        '@fontsource-variable/inter',
        '@fontsource-variable/jetbrains-mono',
        './src/styles/tokens.css',
        './src/styles/components.css',
        './src/styles/playgrounds-b.css',
        './src/styles/playgrounds-c.css',
      ],
      components: {
        ThemeSelect: './src/components/ThemeSelect.astro',
        PageTitle: './src/components/PageTitle.astro',
        TableOfContents: './src/components/TableOfContents.astro',
      },
      head: [
        { tag: 'style', content: themeCss() },
        { tag: 'script', content: noFlashScript },
        { tag: 'script', content: glossaryScript },
      ],
      // The sidebar is the learning path (src/data/path.mjs).
      sidebar: [
        { label: 'Learning path', link: '/' },
        { label: 'Glossary', link: '/glossary/' },
        { label: 'Flashcards', link: '/flashcards/' },
        ...tracks.map((t) => ({
          label: `${t.key} · ${t.label}`,
          collapsed: true,
          items: [{ autogenerate: { directory: t.dir } }],
        })),
        { label: 'Credits', link: '/credits/' },
      ],
      pagination: true,
      lastUpdated: false,
    }),
    react(),
  ],
});
