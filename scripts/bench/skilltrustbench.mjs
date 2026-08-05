// Benchmark SkillWarden against CUHK SkillTrustBench (benchmark_full_v1.0).
// Unlike the ClawHub harness, this dataset ships real skill directories, so the
// harness scans them in place instead of materialising files.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadSkillsFromPath, scanSkills } from 'skillwarden-core';

const root = process.env.STB_ROOT ?? '/tmp/stb';
const cases = process.env.STB_CASES ?? '/tmp/stb_cases.jsonl';
const SEV = { low: 1, medium: 2, high: 3, critical: 4 };

const lines = readFileSync(cases, 'utf8').split('\n').filter(Boolean);
const confusion = {};
const results = [];
let n = 0;
let errors = 0;
let correct = 0;
const start = Date.now();

for (const line of lines) {
  const row = JSON.parse(line);
  n++;
  // SkillTrustBench calls its benign class "normal"; our verdict scale calls it "clean".
  const expected = row.judgment === 'normal' ? 'clean' : row.judgment;
  try {
    const [res] = scanSkills(loadSkillsFromPath(join(root, row.skill_path)));
    let max = 0;
    for (const f of res.findings) max = Math.max(max, SEV[f.severity] ?? 0);
    const pred = max >= 4 ? 'malicious' : max >= 2 ? 'suspicious' : 'clean';
    confusion[`${expected}->${pred}`] = (confusion[`${expected}->${pred}`] ?? 0) + 1;
    if (pred === expected) correct++;
    results.push({ id: row.id, expected, pred, pattern: row.primary_pattern });
  } catch {
    errors++;
    confusion[`${expected}->ERROR`] = (confusion[`${expected}->ERROR`] ?? 0) + 1;
  }
}

const ms = Date.now() - start;
let binCorrect = 0;
for (const r of results) binCorrect += (r.expected === 'clean') === (r.pred === 'clean') ? 1 : 0;
writeFileSync('/tmp/sw-stb-predictions.json', JSON.stringify(results));
console.log(
  JSON.stringify(
    {
      cases: n,
      errors,
      ms,
      accuracy3: +(correct / n).toFixed(4),
      accuracyBinary: +(binCorrect / (n - errors)).toFixed(4),
      confusion,
    },
    null,
    1,
  ),
);
