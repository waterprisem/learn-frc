# Learn FRC Programming

An interactive learning site that takes a beginner from zero to contributing robot code on an FRC team.
It follows the Orbit Robotics (FRC 1360) programming curriculum and adds foundations, hardware, and real-tool guides.

## Run it

```sh
cd site
npm install
npm run dev      # http://localhost:4321  (stop with: npx astro dev stop)
```

## Useful commands (in `site/`)

| Command | What it does |
|---|---|
| `npm run check` | Type checks, tests, and a full build. Run before every commit. |
| `npm run stubs` | Creates stub pages for lessons listed in `src/data/path.mjs` that don't exist yet. |
| `npm run snippets` | Copies the code excerpts listed in `src/snippets/manifest.json` from the curriculum folder. |
| `npm run source-index` | Rebuilds `planning/SOURCE_INDEX.md` (headings and line numbers in the curriculum). |

## Review site

Pushes to `main` build and publish the site to https://waterprisem.github.io/learn-frc/ through `.github/workflows/deploy.yml`.
One-time setup: in the repository settings, set Pages > Source to "GitHub Actions".
Lessons are drafts (`status: review`). Report problems or suggestions as GitHub issues and name the lesson number (for example "3.8").

The curriculum folder and planning notes are kept locally and are not part of this repository.
