import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { runScan } from '../src/commands/scan.js';

const REPO_ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const EXAMPLES = join(REPO_ROOT, 'examples/skills');

function captureStdout(): { out: () => string; restore: () => void } {
  let buffer = '';
  const spy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
    buffer += String(chunk);
    return true;
  });
  return { out: () => buffer, restore: () => spy.mockRestore() };
}

function normalize(text: string): string {
  // The repo root can appear native (D:\a\repo), JSON-escaped (D:\\a\\repo),
  // or as a forward-slash URI (D:/a/repo); normalize all of them.
  const posixRoot = REPO_ROOT.split('\\').join('/');
  const escapedRoot = REPO_ROOT.split('\\').join('\\\\');
  return text
    .split(escapedRoot)
    .join('<repo>')
    .split(REPO_ROOT)
    .join('<repo>')
    .split(posixRoot)
    .join('<repo>')
    .replace(/<repo>[^",\n]*/g, (m) => m.split('\\\\').join('/').split('\\').join('/'))
    .replace(/"version": "\d+\.\d+\.\d+"/g, '"version": "<version>"');
}

describe('output contract snapshots', () => {
  it('scan --format json on the malicious example is stable', () => {
    const cap = captureStdout();
    let out: string;
    try {
      expect(runScan([join(EXAMPLES, 'malicious-skill')], { format: 'json' }, REPO_ROOT)).toBe(1);
      out = cap.out();
    } finally {
      cap.restore();
    }
    expect(normalize(out)).toMatchSnapshot();
  });

  it('scan --format sarif on the malicious example is stable', () => {
    const cap = captureStdout();
    let out: string;
    try {
      expect(runScan([join(EXAMPLES, 'malicious-skill')], { format: 'sarif' }, REPO_ROOT)).toBe(1);
      out = cap.out();
    } finally {
      cap.restore();
    }
    expect(normalize(out)).toMatchSnapshot();
  });

  it('example fixtures are unchanged', () => {
    expect(readFileSync(join(EXAMPLES, 'malicious-skill/SKILL.md'), 'utf8')).toMatchSnapshot();
  });
});
