import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Exercise the real API composition with distinguishable HTTP/mock services.
const keys = {
  auth: ['login', 'logout', 'getSession', 'getSessionId', 'activity', 'register'],
  account: ['getPlayer', 'getBalance', 'getBetsDesktop', 'getBetDetails', 'getDeposits', 'updateProfile', 'updateContact', 'getTransactions', 'getLimits', 'setLimit', 'takeBreak', 'selfExclude'],
  payments: ['getDepositMethods', 'getWithdrawalMethods', 'deposit', 'withdraw', 'cancelWithdrawal'],
  sportsbook: ['getEvents', 'getBets', 'placeBet', 'cashOut', 'setAutoCashOut', 'priceBetBuilder', 'shareSlip', 'loadSharedSlip'],
  casino: ['getGames', 'getRewards', 'launchGame', 'claimMission', 'joinTournament'],
};
const service = source => Object.fromEntries(Object.entries(keys).map(([group, names]) => [group, Object.fromEntries(names.map(name => [name, async () => source]))]));
const mockApi = service('mock'), httpApi = service('http');
const exports = {};
const source = readFileSync(new URL('../src/api/loginTest.ts', import.meta.url), 'utf8');
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
  exports, require: name => name === './mock' ? { mockApi } : name === './http' ? { httpApi } : assert.fail(`Unexpected import ${name}`),
});
const api = exports.loginTestApi;
let checks = 0;
for (const [group, names] of Object.entries({ auth: keys.auth.filter(n => n !== 'register'), account: keys.account.slice(0, 7), payments: ['getDepositMethods'] })) {
  for (const name of names) { assert.equal(api[group][name], httpApi[group][name]); checks++; }
}
for (const [group, names] of Object.entries({ account: ['getTransactions', 'getLimits'], payments: ['getWithdrawalMethods'], sportsbook: ['getEvents', 'getBets'], casino: ['getGames', 'getRewards'] })) {
  for (const name of names) { assert.equal(api[group][name], mockApi[group][name]); checks++; }
}
for (const [group, names] of Object.entries({ auth: ['register'], account: ['setLimit', 'takeBreak', 'selfExclude'], payments: ['deposit', 'withdraw', 'cancelWithdrawal'], sportsbook: ['placeBet', 'cashOut', 'setAutoCashOut'], casino: ['launchGame', 'claimMission', 'joinTournament'] })) {
  for (const name of names) { await assert.rejects(api[group][name](), /not connected in mixed mode/); checks++; }
}
httpApi.account.getBalance = async () => { throw new Error('backend down'); };
// Existing HTTP references must propagate failures, never silently substitute sample data.
const failedExports = {};
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: failedExports, require: name => name === './mock' ? { mockApi } : { httpApi } });
await assert.rejects(failedExports.loginTestApi.account.getBalance(), /backend down/); checks++;
console.log(`${checks} mixed-mode routing/action checks passed.`);
