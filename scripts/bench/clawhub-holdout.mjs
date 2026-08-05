// Benchmark SkillWarden against ClawHub security-signals eval_holdout.
import { readFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname, resolve, sep } from 'node:path';
import { loadSkillsFromPath, scanSkills } from 'skillwarden-core';

const lines = readFileSync('/tmp/holdout.jsonl', 'utf8').split('\n').filter(Boolean);
const workRoot = '/tmp/sw-holdout';
rmSync(workRoot, { recursive: true, force: true });

const SEV = { low: 1, medium: 2, high: 3, critical: 4 };
let n = 0, correct = 0, errors = 0;
const confusion = {};
const results = [];
const start = Date.now();

for (const line of lines) {
  const r = JSON.parse(line);
  n++;
  const dir = join(workRoot, r.id.slice(0, 12));
  mkdirSync(dir, { recursive: true });
  try {
    writeFileSync(join(dir, 'SKILL.md'), r.md ?? '');
    for (const f of r.bundle ?? []) {
      const p = resolve(dir, f.path ?? '');
      if (!p.startsWith(dir + sep)) continue; // path escape in dataset
      mkdirSync(dirname(p), { recursive: true });
      writeFileSync(p, f.content ?? '');
    }
    const [res] = scanSkills(loadSkillsFromPath(dir));
    let max = 0, count = 0;
    for (const f of res.findings) { max = Math.max(max, SEV[f.severity] ?? 0); count++; }
    // mapping: critical => malicious; high/medium => suspicious; low/none => clean
    const pred = max >= 4 ? 'malicious' : max >= 2 ? 'suspicious' : 'clean';
    const key = `${r.verdict}->${pred}`;
    confusion[key] = (confusion[key] ?? 0) + 1;
    if (pred === r.verdict) correct++;
    results.push({ id: r.id, expected: r.verdict, pred, count });
  } catch {
    errors++;
    confusion[`${r.verdict}->ERROR`] = (confusion[`${r.verdict}->ERROR`] ?? 0) + 1;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const ms = Date.now() - start;
// binary: clean vs not-clean
let binCorrect = 0;
for (const x of results) binCorrect += (x.expected === 'clean') === (x.pred === 'clean') ? 1 : 0;
console.log(JSON.stringify({
  cases: n, errors, ms,
  accuracy3: +(correct / n).toFixed(4),
  accuracyBinary: +(binCorrect / (n - errors)).toFixed(4),
  confusion,
}, null, 1));
writeFileSync('/tmp/sw-holdout-predictions.json', JSON.stringify(results));
