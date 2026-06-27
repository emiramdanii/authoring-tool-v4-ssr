#!/usr/bin/env node
// Batch 11A Scope A: mark all generic templates as 'legacy'.
// Keeps 'silse-fresh-ppkn' as the ONLY active template.

const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '..', 'src/core/template/CourseTemplateRegistry.ts');
let src = fs.readFileSync(file, 'utf-8');
const lines = src.split('\n');

// Find all `status: 'active',` lines and check context — only flip the generic ones
// Strategy: find each `id: '<template-id>',` line, look ahead for the corresponding
// `status: 'active',` line, and if the template ID is NOT 'silse-fresh-ppkn', flip it.

const KEEP_ACTIVE = new Set(['silse-fresh-ppkn']);

const idLineRegex = /^\s+id: '([^']+)',/;
const activeStatusRegex = /^(\s+)status: 'active',/;

let flipsCount = 0;
for (let i = 0; i < lines.length; i++) {
  const idMatch = lines[i].match(idLineRegex);
  if (!idMatch) continue;
  const templateId = idMatch[1];
  // Look ahead (up to 15 lines) for the status line
  for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
    const activeMatch = lines[j].match(activeStatusRegex);
    if (activeMatch) {
      if (!KEEP_ACTIVE.has(templateId)) {
        // Flip to legacy
        lines[j] = lines[j].replace(activeStatusRegex, `$1status: 'legacy',`);
        flipsCount++;
        console.log(`Flipped template "${templateId}" line ${j + 1}: active → legacy`);
      } else {
        console.log(`Kept template "${templateId}" line ${j + 1}: active (fresh default)`);
      }
      break; // status found, move to next id
    }
    // If we hit another `id:` line first, we missed the status (shouldn't happen)
    if (lines[j].match(idLineRegex)) break;
  }
}

fs.writeFileSync(file, lines.join('\n'), 'utf-8');
console.log(`\nDone. Flipped ${flipsCount} templates to 'legacy' status.`);
