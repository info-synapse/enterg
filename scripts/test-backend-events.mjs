import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
let now = 0, calls = 0;
const items = [
  { id: 'a', competitionId: 'backend-1', startTime: '2026-10-20T10:00:00Z' },
  { id: 'b', competitionId: 'backend-2', startTime: '2026-10-21T10:00:00Z' },
];
const exports = {};
const source = fs.readFileSync(new URL('../src/lib/backendEvents.ts', import.meta.url), 'utf8').replace('import.meta.env.VITE_API_BASE_URL', "'/api'");
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText,
  { exports, performance: { now: () => now }, window: { setTimeout, clearTimeout }, AbortController,
    fetch: async (url, options) => { calls++; assert.equal(options.cache, 'no-store'); return { ok: true, json: async () => ({ items }) }; } });
const get = exports.getBackendEvents;
await Promise.all([get({ sportId: 'backend-2' }), get({ sportId: 'backend-2' })]);
assert.equal(calls, 1);
assert.equal((await get({ sportId: 'backend-2', competitionIds: ['backend-2'] }))[0].id, 'b');
assert.equal((await get({ sportId: 'backend-2', from: '2026-10-20T10:00:00Z', to: '2026-10-21T10:00:00Z' })).length, 1);
assert.equal(calls, 1);
assert.equal((await get({ sportId: 'backend-2', live: true })).length, 0);
now = 1799999; await get({ sportId: 'backend-2' }); assert.equal(calls, 1);
now = 1800001; await get({ sportId: 'backend-2' }); assert.equal(calls, 2);
exports.clearBackendEventCache(); await get({ sportId: 'backend-2' }); assert.equal(calls, 3);
console.log('Browser event cache, concurrent loading, expiry and competition/date filters passed.');
