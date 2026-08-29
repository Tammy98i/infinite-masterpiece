/**
 * Writes api/_lib/staticData.ts from the Vite catalog sources so Vercel
 * serverless functions do not import ../src/*.ts (those crash at runtime).
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COURSES, INSTRUCTORS, CATEGORIES } from '../src/data/initialData.ts';
import { FOUNDERS } from '../src/marketing/data/founders.ts';
import { DEFAULT_WEBINAR_CONFIG } from '../src/constants/webinar.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'api/_lib/staticData.ts');

const body =
  '/** Auto-generated for Vercel serverless. Do not edit by hand — run: npm run sync:api-data */\n' +
  '/* eslint-disable */\n' +
  `export const COURSES: any[] = ${JSON.stringify(COURSES, null, 2)};\n` +
  `export const INSTRUCTORS: any[] = ${JSON.stringify(INSTRUCTORS, null, 2)};\n` +
  `export const CATEGORIES: any[] = ${JSON.stringify(CATEGORIES, null, 2)};\n` +
  `export const FOUNDERS: any[] = ${JSON.stringify(FOUNDERS, null, 2)};\n` +
  `export const DEFAULT_WEBINAR_CONFIG: any = ${JSON.stringify(DEFAULT_WEBINAR_CONFIG, null, 2)};\n`;

writeFileSync(out, body);
console.log(`wrote ${out} (${body.length} bytes)`);
