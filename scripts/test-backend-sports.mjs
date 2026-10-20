import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const sports = [{ ET_ID: 2, ET_NAME: 'Football', ET_FILENAME: 'https://example.com/icon.png' }];
const tournaments = Array.from({ length: 12 }, (_, i) => ({ TOURN_ID: 100 + i, EVENT_TYPE: 2, TORDER: i, TNAME: `Cup ${i}`, FILE_NAME: 'https://example.com/cup.png', TNAME_ABB: '', tourn_country: '', tourn_group: '' }));
let mockEvents = 0;
const mockApi = { sportsbook: { getCompetitions: async () => [{ id: 'mock' }], getEvents: async () => { mockEvents++; return [{ id: 'demo-event' }]; } } };
const api = { referenceData: { getLeftMenuSports: async () => ({ items: sports, cacheForMs: 1200000 }), getTournaments: async () => ({ items: tournaments, cacheForMs: 300000 }) } };
const exports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../src/lib/backendSports.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText,
  { exports, require: name => name === '@/api' ? { api } : name === '@/api/mock' ? { mockApi } : name === './backendEvents' ? { getBackendEvents: async () => [{ id: 'backend:event:1', competitionId: 'backend-100', readOnly: true }] } : { GROUP_ORDER: ['other'] }, window: { setTimeout, clearTimeout }, performance, AbortController });
const mapped = exports.mapBackendCatalog(sports, tournaments);
assert.equal(mapped.sports[0].id, 'backend-2'); assert.equal(mapped.sports[0].backendId, 2);
assert.equal(mapped.competitions.filter(c => c.featured).length, 10);
assert.equal(mapped.competitions[0].group, 'other'); assert.equal(mapped.competitions[0].region, ''); assert.equal(mapped.competitions[0].eventCount, undefined);
assert.equal(mapped.competitions[11].displayOrder, 11); assert.equal(mapped.competitions[0].backendId, 100);
const service = exports.sportsPageApi.sportsbook;
for (const [name, country, expected] of [
  ['Greece 1st', '', 'Greece'], ['gReEcE - Cup', '   ', 'Greece'],
  ['South Korea Women', '', 'South Korea'], ['England: Premier League', 'null', 'England'],
  ['Austria 1st', '', 'Austria'], ['Australia Cup', '', 'Australia'],
  ['Greece 1st', 'Cyprus', 'Cyprus'], ['Greece vs England', '', ''],
  ['World Cup', '', ''], ['New England Cup', 'USA', 'USA'],
  ['GreeceExtra', '', ''],
]) {
  const input = { ...tournaments[0], TNAME: name, tourn_country: country };
  assert.equal(exports.mapBackendCatalog(sports, [input]).competitions[0].region, expected, name);
  assert.equal(input.tourn_country, country, 'Raw backend record must remain unchanged');
}
assert.equal((await service.getCompetitions('backend-2')).length, 12);
assert.equal((await service.getCompetitions('football'))[0].id, 'mock');
const backendEvents = await service.getEvents({ sportId: 'backend-2' }); assert.equal(backendEvents.length, 1); assert.equal(backendEvents[0].competitionIcon, tournaments[0].FILE_NAME);
assert.equal((await service.getEvents({ sportId: 'backend-2', competitionId: 'backend-100' })).length, 1); assert.equal(mockEvents, 0);
await service.getEvents({ sportId: 'football' }); assert.equal(mockEvents, 1);
console.log('Backend sports mapping/source checks passed.');
