#!/usr/bin/env node
import { GoogleGenAI } from '@google/genai';

const args = process.argv.slice(2);
let providedKey;
const flags = new Set();

for (const arg of args) {
  if (arg.startsWith('--')) {
    flags.add(arg);
  } else if (!providedKey) {
    providedKey = arg;
  }
}

const apiKey = process.env.GEMINI_API_KEY ?? providedKey;

if (!apiKey) {
  console.error('Missing Gemini API key. Pass it as an argument or set GEMINI_API_KEY.');
  console.error('Example: GEMINI_API_KEY=sk-... npm run diagnose:gemini -- --images');
  process.exit(1);
}

const DEFAULT_IMAGE_KEYWORD = /(image|imagen|flash)/i;
const filterImages = flags.has('--images');
const showAll = flags.has('--all');

try {
  const ai = new GoogleGenAI({ apiKey });
  const pager = await ai.models.list({ config: { pageSize: 50 } });
  const rows = [];

  for await (const model of pager) {
    if (!model?.name) continue;

    const haystack = `${model.name} ${model.displayName ?? ''}`;
    if (filterImages && !DEFAULT_IMAGE_KEYWORD.test(haystack)) {
      continue;
    }

    rows.push({
      name: model.name,
      displayName: model.displayName ?? '(no display name)',
      description: model.description,
      actions: (model.supportedActions ?? []).join(', '),
    });

    if (!showAll && rows.length >= 20) {
      break;
    }
  }

  if (!rows.length) {
    console.warn(
      filterImages
        ? 'No image-capable models were returned for this API key.'
        : 'The API did not return any models for this key.'
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `Found ${rows.length}${showAll ? '' : ' (showing first 20)'} accessible models:`
  );
  console.log('');
  rows.forEach(row => {
    const header = `${row.name}${row.displayName ? ` (${row.displayName})` : ''}`;
    console.log(`- ${header}`);
    if (row.actions) {
      console.log(`    actions: ${row.actions}`);
    }
    if (row.description) {
      console.log(`    description: ${row.description}`);
    }
  });

  console.log('\nTip: Use --images to filter to image-focused models, or --all to show every page.');
  console.log(
    'To change the runtime image model, update DEFAULT_GEMINI_IMAGE_MODEL in src/services/geminiService.ts.'
  );
} catch (error) {
  console.error('Failed to list models:', error?.message ?? error);
  process.exitCode = 1;
}
