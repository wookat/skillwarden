import { hasFindingsAtOrAbove, loadSkillsFromPath, scanSkills, type Severity } from 'skillwarden-core';
import { EXIT_OK, EXIT_USAGE_ERROR, filterIgnored } from '../context.js';

/**
 * OpenClaw `security.installPolicy.exec` adapter (protocol v1).
 *
 * OpenClaw writes one JSON request to stdin describing a staged skill/plugin
 * install; the policy command writes one JSON allow/warn/block response to
 * stdout. Anything the adapter cannot read or validate is answered `block`
 * (fail closed) — an unreviewable install must never slip through on an error.
 */

const MAX_REQUEST_BYTES = 256 * 1024;
const MAX_FINDINGS = 100;
const MAX_REASON_CHARS = 1000;

const SEVERITIES: readonly Severity[] = ['low', 'medium', 'high', 'critical'];

interface PolicyRequest {
  protocolVersion: number;
  targetType: string;
  targetName: string;
  sourcePath: string;
  sourcePathKind: string;
}

interface PolicyFinding {
  ruleId: string;
  severity: string;
  message: string;
  evidence?: string;
}

interface PolicyResponse {
  protocolVersion: 1;
  decision: 'allow' | 'warn' | 'block';
  reason?: string;
  findings?: PolicyFinding[];
}

export interface InstallPolicyOptions {
  blockOn?: string;
  warnOn?: string;
}

function respond(response: PolicyResponse): number {
  process.stdout.write(`${JSON.stringify(response)}\n`);
  return EXIT_OK;
}

function block(reason: string): number {
  return respond({ protocolVersion: 1, decision: 'block', reason: reason.slice(0, MAX_REASON_CHARS) });
}

function parseRequest(raw: string): PolicyRequest | string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return 'policy request is not valid JSON';
  }
  if (typeof parsed !== 'object' || parsed === null) return 'policy request must be a JSON object';
  const req = parsed as Record<string, unknown>;
  if (req['protocolVersion'] !== 1) return 'policy request protocolVersion must be 1';
  if (req['targetType'] !== 'skill' && req['targetType'] !== 'plugin') {
    return 'policy request targetType must be "skill" or "plugin"';
  }
  if (typeof req['targetName'] !== 'string' || req['targetName'].trim() === '') {
    return 'policy request targetName must not be empty';
  }
  if (typeof req['sourcePath'] !== 'string' || req['sourcePath'].trim() === '') {
    return 'policy request sourcePath must not be empty';
  }
  if (req['sourcePathKind'] !== 'file' && req['sourcePathKind'] !== 'directory') {
    return 'policy request sourcePathKind must be "file" or "directory"';
  }
  return {
    protocolVersion: 1,
    targetType: req['targetType'],
    targetName: req['targetName'],
    sourcePath: req['sourcePath'],
    sourcePathKind: req['sourcePathKind'],
  };
}

export function runInstallPolicy(rawInput: string, options: InstallPolicyOptions, cwd: string): number {
  const blockOn = (options.blockOn ?? 'high') as Severity;
  const warnOn = (options.warnOn ?? 'medium') as Severity;
  if (!SEVERITIES.includes(blockOn) || !SEVERITIES.includes(warnOn)) {
    process.stderr.write('Invalid --block-on/--warn-on value (expected low|medium|high|critical)\n');
    return EXIT_USAGE_ERROR;
  }
  if (SEVERITIES.indexOf(warnOn) > SEVERITIES.indexOf(blockOn)) {
    process.stderr.write('--warn-on must not be stricter than --block-on\n');
    return EXIT_USAGE_ERROR;
  }

  if (Buffer.byteLength(rawInput, 'utf8') > MAX_REQUEST_BYTES) {
    return block(`policy request exceeds ${MAX_REQUEST_BYTES} bytes`);
  }
  const request = parseRequest(rawInput);
  if (typeof request === 'string') return block(request);

  if (request.targetType === 'plugin') {
    return respond({
      protocolVersion: 1,
      decision: 'warn',
      reason:
        'SkillWarden analyzes Agent Skills, not plugin packages — no scan was performed. Configure targets: ["skill"] or add a plugin-capable policy command.',
    });
  }

  let skills;
  try {
    skills = loadSkillsFromPath(request.sourcePath);
  } catch (error) {
    return block(`staged skill could not be read: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (skills.length === 0) {
    return block(`no SKILL.md found under staged path ${request.sourcePath} — nothing reviewable to approve`);
  }

  const { results } = filterIgnored(scanSkills(skills), cwd);
  const findings: PolicyFinding[] = [];
  for (const result of results) {
    for (const finding of result.findings) {
      if (findings.length >= MAX_FINDINGS) break;
      findings.push({
        ruleId: finding.ruleId,
        severity: finding.severity,
        message: finding.message,
        ...(finding.file ? { evidence: `${finding.file}${finding.line ? `:${finding.line}` : ''}` } : {}),
      });
    }
  }

  if (hasFindingsAtOrAbove(results, blockOn)) {
    return respond({
      protocolVersion: 1,
      decision: 'block',
      reason: `SkillWarden found findings at or above "${blockOn}" severity`,
      findings,
    });
  }
  if (hasFindingsAtOrAbove(results, warnOn)) {
    return respond({
      protocolVersion: 1,
      decision: 'warn',
      reason: `SkillWarden found findings at or above "${warnOn}" severity`,
      findings,
    });
  }
  return respond({ protocolVersion: 1, decision: 'allow', ...(findings.length > 0 ? { findings } : {}) });
}
