# learn_FRC

A shareable learning website that teaches FRC Team 1360's (Orbit Robotics) programming curriculum to from-scratch learners.

## Where things are
- `planning/02_APP_PLAN.md`: scope, tracks/lessons, playground list (what we're building)
- `planning/03_DEV_PLAN.md`: stack, layout, milestones, workflow (how we're building it)
- `planning/04_DESIGN_SYSTEM.md`: UX principles, tokens, component rules (read before UI work)
- `planning/05_CONTENT_GUIDE.md`: lesson template, writing rules, naming (read before writing lessons)
- `planning/SOURCE_MAP.md`: lesson → exact curriculum files/line ranges (read before writing a lesson)
- `planning/PROGRESS.md`: current milestone, what's done, what's next (read first; update at the end of each session)
- `OrbitRoboticsCurriculum/`: **read-only** source material (team repo). Never edit it.
- `site/`: the Astro + Starlight site

## Rules
- Read narrowly: use SOURCE_MAP line ranges; don't re-read whole folders or all planning docs.
- Lab solution code is the ground truth for code; the curriculum plan is the source for concepts.
- `site/src/sim/` is pure TypeScript that mirrors WPILib semantics and has Vitest coverage. Keep React out of it.
- Visuals are 2D only (SVG/CSS). Use the signal palette from 04 for every graph/diagram.
- Reuse components and add presets before creating new components.
- Verify with `cd site && npm run check`; use the browser only for new visuals or milestone gates.
- In the browser, check behavior with JavaScript/DOM queries first. Screenshots are costly: take at most one or two, scaled down (0.5), and only to judge appearance.
- Lesson pages: keep them light. One idea per section, no repeated content between practice, checkpoint and recap, and show one thing at a time (guided steps, one question at a time).
- No subagents unless the work is truly parallel and independent.
- Don't push, deploy, or upgrade dependencies without asking.
