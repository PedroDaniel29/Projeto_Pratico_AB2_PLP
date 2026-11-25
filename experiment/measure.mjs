#!/usr/bin/env node
// Mede uma implementação com as MESMAS ferramentas do harness (configs de with-harness/).
// Uso: node experiment/measure.mjs <pasta-da-implementacao> [rotulo]
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const [target, label = 'run'] = process.argv.slice(2);
if (!target) {
  console.error('uso: node experiment/measure.mjs <pasta> [rotulo]');
  process.exit(1);
}

const root = resolve(import.meta.dirname, '..');
const harness = join(root, 'with-harness');
const source = resolve(target);
if (!existsSync(join(harness, 'node_modules'))) {
  console.error('Rode "npm install" em with-harness/ primeiro.');
  process.exit(1);
}

const work = mkdtempSync(join(tmpdir(), 'measure-'));
for (const f of ['package.json', 'tsconfig.json', 'vitest.config.ts', 'eslint.config.js', '.dependency-cruiser.cjs']) {
  cpSync(join(harness, f), join(work, f));
}
symlinkSync(join(harness, 'node_modules'), join(work, 'node_modules'), 'junction');
for (const d of ['src', 'tests']) {
  mkdirSync(join(work, d), { recursive: true });
  if (existsSync(join(source, d))) cpSync(join(source, d), join(work, d), { recursive: true });
}

const run = (cmd, args) => spawnSync(cmd, args, { cwd: work, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, shell: true });
const parse = (text) => { try { return JSON.parse(text); } catch { return null; } };

// 1) TypeScript
const tsc = run('npx', ['tsc', '--noEmit']);
const typeErrors = ((tsc.stdout + tsc.stderr).match(/error TS\d+/g) ?? []).length;

// 2) ESLint
const lint = run('npx', ['eslint', 'src', 'tests', '--no-error-on-unmatched-pattern', '-f', 'json']);
const files = parse(lint.stdout) ?? [];
const msgs = files.flatMap((f) => f.messages).filter((m) => m.severity === 2);
const rxjsViolations = msgs.filter((m) => m.ruleId?.startsWith('rxjs-x/')).length;
const subjectOutsideInfra = msgs.filter((m) => m.ruleId === 'no-restricted-syntax').length;
const lintErrors = msgs.length - rxjsViolations - subjectOutsideInfra;

// 3) Arquitetura
const dep = run('npx', ['depcruise', 'src', '--config', '.dependency-cruiser.cjs', '--output-type', 'json']);
const depJson = parse(dep.stdout);
const depViolations = depJson?.summary?.error ?? 0;

// 4) Testes
const vtOut = join(work, 'vitest-report.json');
run('npx', ['vitest', 'run', '--reporter=json', `--outputFile=${vtOut}`]);
const vtJson = existsSync(vtOut) ? parse(readFileSync(vtOut, 'utf8')) : null;
const testsTotal = vtJson?.numTotalTests ?? 0;
const testsFailed = vtJson?.numFailedTests ?? 0;

const result = {
  label,
  target: source,
  measuredAt: new Date().toISOString(),
  typeErrors,
  lintErrors,
  rxjsViolations,
  architecturalViolations: depViolations + subjectOutsideInfra,
  testsTotal,
  testsFailed,
  hasTests: testsTotal > 0,
};

mkdirSync(join(root, 'experiment', 'logs'), { recursive: true });
writeFileSync(join(root, 'experiment', 'logs', `${label}.json`), JSON.stringify(result, null, 2));
rmSync(work, { recursive: true, force: true });
console.table(result);
