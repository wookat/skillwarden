// Validate every advisories/SKA-*.json against the JSON schema (structural subset,
// dependency-free: required fields, patterns, enums).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'advisories';
const schema = JSON.parse(readFileSync(join(dir, 'schema', 'advisory.schema.json'), 'utf8'));
const files = readdirSync(dir).filter((f) => /^SKA-\d{4}-\d{4}\.json$/.test(f));

let failed = false;
const fail = (file, msg) => {
  failed = true;
  console.error(`✗ ${file}: ${msg}`);
};

for (const file of files) {
  const advisory = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  for (const key of schema.required) {
    if (!(key in advisory)) fail(file, `missing required field "${key}"`);
  }
  for (const key of Object.keys(advisory)) {
    if (!(key in schema.properties)) fail(file, `unknown field "${key}"`);
  }
  if (advisory.id && advisory.id !== file.replace(/\.json$/, '')) fail(file, `id "${advisory.id}" does not match filename`);
  if (advisory.type && !schema.properties.type.enum.includes(advisory.type)) fail(file, `invalid type "${advisory.type}"`);
  if (advisory.severity && !schema.properties.severity.enum.includes(advisory.severity)) fail(file, `invalid severity "${advisory.severity}"`);
  if (advisory.skills) {
    if (!Array.isArray(advisory.skills) || advisory.skills.length === 0) fail(file, 'skills must be a non-empty array');
    for (const s of advisory.skills ?? []) {
      if (!s.name || !s.source) fail(file, 'each skill needs name and source');
    }
  }
  if (advisory.references) {
    for (const r of advisory.references) {
      if (!r.type || !r.url) fail(file, 'each reference needs type and url');
    }
  }
  if (advisory.timeline && !advisory.timeline.published) fail(file, 'timeline.published is required');
}

console.log(failed ? 'Advisory validation failed.' : `✓ ${files.length} advisories validated.`);
process.exit(failed ? 1 : 0);
