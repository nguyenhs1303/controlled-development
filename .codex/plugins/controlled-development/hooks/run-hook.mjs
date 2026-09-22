#!/usr/bin/env node

import { parseHookEvent } from '../scripts/runtime/hook-event-parser.mjs';
import { handleHookEvent } from '../scripts/runtime/hook-runtime.mjs';

process.stdin.setEncoding('utf8');
let input = '';
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const event = parseHookEvent(input);
    const output = handleHookEvent(event);
    process.stdout.write(`${JSON.stringify(output)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 2;
  }
});
