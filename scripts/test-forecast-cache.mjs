import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
let now = 0, calls = 0, fail = false, invalid = false;
const item = { EVT_TYPE: 2, MGAME_ID: 1, FC_IDX: 0, CD_1: 1, CD_X: 2, CD_2: 3, CD_1X: 4, CD_12: 5, CD_X2: 6, CD_U: 0, CD_O: 0 };
const api = { referenceData: { getMainGameForecasts: async () => {
  calls++; if (fail) throw new Error('Backend unavailable');
  return { version: 'a'.repeat(64), loadedAt: '2026-10-19T00:00:00Z', cacheForMs: 300000, items: [invalid ? { ...item, CD_1: -1 } : item] };
} } };
const exports = {};
const source = fs.readFileSync(new URL('../src/lib/mainGameForecasts.ts', import.meta.url), 'utf8');
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText,
  { exports, require: () => ({ api }), performance: { now: () => now }, console: { info() {}, warn() {} }, window: { setTimeout, clearTimeout }, AbortController });
const load = exports.loadMainGameForecasts;
const [a, b] = await Promise.all([load(), load()]); assert.equal(calls, 1); assert.equal(a, b);
assert.ok(Object.isFrozen(a) && Object.isFrozen(a.items) && Object.isFrozen(a.items[0]));
await load(); assert.equal(calls, 1);
now = 300001; fail = true; await assert.rejects(load(), /Backend unavailable/); assert.equal(calls, 2);
fail = false; invalid = true; await assert.rejects(load(), /Invalid main forecast record/);
invalid = false; await load(); assert.equal(calls, 4);
console.log('Browser cache checks passed: shared request, cache hit, immutable data, expiry, no stale fallback, validation and retry.');
