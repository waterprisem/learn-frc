import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

/** Extra lesson frontmatter (see planning/05_CONTENT_GUIDE.md). All optional so non-lesson pages validate. */
const lesson = z.object({
  id: z.string().optional(),
  track: z.string().optional(),
  session: z.number().int().min(1).max(18).nullable().optional(),
  isNew: z.boolean().optional(),
  minutes: z.number().int().positive().optional(),
  prereqs: z.array(z.string()).default([]),
  outcomes: z.array(z.string()).default([]),
  sources: z
    .array(z.union([z.object({ curriculum: z.string() }), z.object({ doc: z.url() })]))
    .default([]),
  status: z.enum(['stub', 'draft', 'review', 'done']).optional(),
});

const base = { prompt: z.string(), explain: z.string(), source: z.string().optional() };
const practiceItem = z.discriminatedUnion('type', [
  z.object({ type: z.literal('mcq'), ...base, choices: z.array(z.string()).min(2), answer: z.number().int().min(0) }),
  z.object({ type: z.literal('multi'), ...base, choices: z.array(z.string()).min(2), answers: z.array(z.number().int().min(0)).min(1) }),
  z.object({ type: z.literal('predict-graph'), ...base, presets: z.array(z.string()).min(2), answer: z.number().int().min(0) }),
  z.object({ type: z.literal('read-graph'), ...base, preset: z.string(), choices: z.array(z.string()).min(2), answer: z.number().int().min(0) }),
  z.object({ type: z.literal('parsons'), ...base, lines: z.array(z.string()).min(2), distractors: z.array(z.string()).default([]) }),
  z.object({ type: z.literal('fill-blank'), ...base, code: z.string(), blanks: z.array(z.array(z.string()).min(1)).min(1) }),
  z.object({ type: z.literal('bug-hunt'), ...base, code: z.string(), bugLine: z.number().int().min(1) }),
  z.object({ type: z.literal('symptom-cause'), ...base, symptom: z.string(), choices: z.array(z.string()).min(2), answer: z.number().int().min(0) }),
  z.object({ type: z.literal('free'), ...base, modelAnswer: z.string() }),
]);

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema({ extend: lesson }) }),
  practice: defineCollection({
    loader: glob({ pattern: '**/*.yaml', base: './src/content/practice' }),
    schema: z.object({ lesson: z.string(), items: z.array(practiceItem).min(1) }),
  }),
  glossary: defineCollection({
    loader: file('src/content/glossary.yaml'),
    schema: z.object({
      term: z.string(),
      short: z.string().max(160),
      long: z.string().optional(),
      lessons: z.array(z.string()).default([]),
    }),
  }),
};
