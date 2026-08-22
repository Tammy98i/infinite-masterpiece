/**
 * Generates WebVTT stub files for every episode in initial catalog data.
 * Run: npm run a11y:generate-captions
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { COURSES } from '../src/data/initialData.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'captions', 'episodes');

function vttBody(title: string, description?: string) {
  const line = description?.trim() || 'כתוביות מלאות לפרק זה יתווספו בהמשך.';
  return `WEBVTT

00:00:00.000 --> 00:00:05.000
${title}

00:00:05.500 --> 00:00:12.000
${line.slice(0, 120)}
`;
}

function main() {
  fs.mkdirSync(outDir, { recursive: true });
  let count = 0;
  for (const course of COURSES) {
    for (const ep of course.episodes) {
      const file = path.join(outDir, `${ep.id}.vtt`);
      fs.writeFileSync(file, vttBody(ep.title, ep.description), 'utf8');
      count += 1;
    }
  }
  console.log(`Generated ${count} caption stubs in public/captions/episodes/`);
}

main();
