#!/usr/bin/env node
'use strict';

// charter — encode settled decisions as fixed constraints so coding agents
// don't re-litigate them.
//
// Zero dependencies. Charters are markdown files with a small, strict YAML
// frontmatter subset (see charters/SCHEMA.md after `charter init`).

const fs = require('fs');
const path = require('path');

const CHARTERS_DIR = 'charters';
const DECISIONS_BASENAME = 'decisions.md';
const CLAUDE_FILE = 'CLAUDE.md';
const BLOCK_BEGIN = '<!-- charter:begin -->';
const BLOCK_END = '<!-- charter:end -->';
// Files inside charters/ that are not charters themselves.
const RESERVED = new Set(['SCHEMA.md', 'TEMPLATE.md', DECISIONS_BASENAME]);

function fail(msg) {
  process.stderr.write(`charter: ${msg}\n`);
  process.exit(1);
}

function say(msg) {
  process.stdout.write(`${msg}\n`);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function chartersDir(cwd) {
  return path.join(cwd, CHARTERS_DIR);
}

function requireInit(cwd) {
  if (!fs.existsSync(chartersDir(cwd))) {
    fail(`no ${CHARTERS_DIR}/ directory here — run \`charter init\` first`);
  }
}

// ---------------------------------------------------------------------------
// Frontmatter (strict YAML subset: single-line scalars, lists of strings)
// ---------------------------------------------------------------------------

// Returns { entries, body } where entries is an ordered array of
// [key, string] or [key, string[]] pairs.
function parseCharter(text, label) {
  if (!text.startsWith('---\n')) {
    fail(`${label}: charter must start with a \`---\` frontmatter block`);
  }
  const closing = text.indexOf('\n---', 3);
  if (closing === -1) {
    fail(`${label}: frontmatter block is never closed with \`---\``);
  }
  const fmText = text.slice(4, closing);
  const bodyStart = text.indexOf('\n', closing + 1);
  const body = bodyStart === -1 ? '' : text.slice(bodyStart + 1);

  const entries = [];
  let openList = null;
  for (const rawLine of fmText.split('\n')) {
    const line = rawLine.trimEnd();
    if (line.trim() === '' || line.trim().startsWith('#')) continue;
    const itemMatch = line.match(/^\s+-\s+(.*)$/);
    if (itemMatch) {
      if (!openList) fail(`${label}: list item without a key: "${line.trim()}"`);
      openList.push(itemMatch[1]);
      continue;
    }
    const keyMatch = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!keyMatch) {
      fail(`${label}: cannot parse frontmatter line: "${line.trim()}" ` +
        `(only \`key: value\` and \`  - item\` are supported)`);
    }
    const [, key, value] = keyMatch;
    if (value === '') {
      openList = [];
      entries.push([key, openList]);
    } else {
      openList = null;
      entries.push([key, value]);
    }
  }
  return { entries, body };
}

function getField(entries, key) {
  const found = entries.find(([k]) => k === key);
  return found ? found[1] : undefined;
}

function setField(entries, key, value) {
  const found = entries.find(([k]) => k === key);
  if (found) found[1] = value;
  else entries.push([key, value]);
}

function serializeCharter(entries, body) {
  const lines = ['---'];
  for (const [key, value] of entries) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) lines.push(`  - ${item}`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  lines.push('---');
  let out = lines.join('\n') + '\n';
  if (body.trim() !== '') out += '\n' + body.replace(/^\n+/, '');
  return out;
}

function loadCharters(cwd) {
  const dir = chartersDir(cwd);
  const charters = [];
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith('.md') || RESERVED.has(file)) continue;
    const filePath = path.join(dir, file);
    const text = fs.readFileSync(filePath, 'utf8');
    const { entries, body } = parseCharter(text, path.join(CHARTERS_DIR, file));
    const name = getField(entries, 'charter') || path.basename(file, '.md');
    charters.push({ file: filePath, name, entries, body });
  }
  return charters;
}

// ---------------------------------------------------------------------------
// charter init
// ---------------------------------------------------------------------------

const SCHEMA_MD = `# Charter schema

A charter is a markdown file in this directory: \`charters/<name>.md\`.
It records what one agent, role, or workstream owns — and which decisions
are settled so agents stop re-litigating them.

Every charter starts with a YAML frontmatter block:

\`\`\`markdown
---
charter: engineering
version: 1
updated: 2026-01-01
role: Own code quality and architecture for the project.
scope:
  - Application code, tests, and CI.
fixed_constraints:
  - Settled decision agents must not re-open.
open_questions:
  - Genuinely undecided question agents may discuss.
---

Optional free-form notes. Only the frontmatter is injected into agent
context by \`charter sync\`.
\`\`\`

## Fields

| Field | Type | Meaning |
| --- | --- | --- |
| \`charter\` | string | Name of the charter. Defaults to the filename. |
| \`version\` | integer | Bumped automatically by \`charter promote\`. |
| \`updated\` | date | Set automatically by \`charter promote\`. |
| \`role\` | string | One sentence: what this charter owns. |
| \`scope\` | list | What the charter covers. |
| \`fixed_constraints\` | list | Settled decisions. Agents must not re-litigate these. |
| \`open_questions\` | list | Explicitly undecided. Agents may discuss these. |

## Frontmatter rules (strict YAML subset)

The parser is deliberately minimal. Only two shapes are allowed:

- \`key: value\` — single-line string values
- \`key:\` followed by \`  - item\` lines — lists of single-line strings

No nesting, no multi-line strings, no quoting rules. If a constraint needs
a paragraph, it is probably several constraints.

## Lifecycle

1. Copy \`TEMPLATE.md\` to \`<name>.md\` and fill it in.
2. Run \`charter sync\` to inject charters into \`CLAUDE.md\`.
3. Record decisions as they happen: \`charter log "..." --charter <name>\`.
4. When a decision is settled, \`charter promote <id>\` moves it into
   \`fixed_constraints\`, bumps \`version\`, and re-syncs.
`;

const TEMPLATE_MD = `---
charter: replace-me
version: 1
role: One sentence describing what this agent or workstream owns.
scope:
  - What this charter covers.
fixed_constraints:
  - A settled decision. Agents must not re-litigate it.
open_questions:
  - A genuinely undecided question. Agents may discuss it.
---

Optional free-form context. Keep it short — only the frontmatter above is
injected into agent context by \`charter sync\`.
`;

const DECISIONS_HEADER = `# Decision log

Append decisions here with \`charter log "<decision>" --charter <name>\`.
When a decision is settled, promote it into the charter's fixed
constraints with \`charter promote <id>\`. Entries below are managed by
the CLI; edit by hand only if you keep the format intact.
`;

function cmdInit(cwd) {
  const dir = chartersDir(cwd);
  fs.mkdirSync(dir, { recursive: true });
  const scaffold = [
    ['SCHEMA.md', SCHEMA_MD],
    ['TEMPLATE.md', TEMPLATE_MD],
    [DECISIONS_BASENAME, DECISIONS_HEADER],
  ];
  for (const [file, content] of scaffold) {
    const filePath = path.join(dir, file);
    if (fs.existsSync(filePath)) {
      say(`kept      ${CHARTERS_DIR}/${file} (already exists)`);
    } else {
      fs.writeFileSync(filePath, content);
      say(`created   ${CHARTERS_DIR}/${file}`);
    }
  }
  cmdSync(cwd);
  say('');
  say('Next steps:');
  say(`  1. cp ${CHARTERS_DIR}/TEMPLATE.md ${CHARTERS_DIR}/<name>.md and fill it in`);
  say('  2. charter sync');
  say(`  3. charter log "<decision>" --charter <name>  # as decisions happen`);
}

// ---------------------------------------------------------------------------
// charter sync — inject charters into CLAUDE.md
// ---------------------------------------------------------------------------

function renderList(title, items, out) {
  if (!items || items.length === 0) return;
  out.push(`**${title}:**`);
  for (const item of items) out.push(`- ${item}`);
  out.push('');
}

function renderBlock(charters) {
  const out = [BLOCK_BEGIN];
  out.push('<!-- Generated by `charter sync`. Do not edit between these markers. -->');
  out.push('');
  out.push('# Project charters');
  out.push('');
  if (charters.length === 0) {
    out.push('No charters defined yet. Copy `charters/TEMPLATE.md` to');
    out.push('`charters/<name>.md`, fill it in, and run `charter sync`.');
    out.push('');
  } else {
    out.push('The fixed constraints below are settled decisions. Do not re-open,');
    out.push('re-litigate, or work around them. If a task appears to conflict with');
    out.push('a fixed constraint, stop and surface the conflict instead. Open');
    out.push('questions are genuinely undecided and safe to discuss.');
    out.push('');
    for (const charter of charters) {
      const version = getField(charter.entries, 'version');
      const updated = getField(charter.entries, 'updated');
      const meta = [version ? `v${version}` : null, updated ? `updated ${updated}` : null]
        .filter(Boolean).join(', ');
      out.push(`## ${charter.name}${meta ? ` (${meta})` : ''}`);
      out.push('');
      const role = getField(charter.entries, 'role');
      if (role) {
        out.push(`**Role:** ${role}`);
        out.push('');
      }
      renderList('Scope', getField(charter.entries, 'scope'), out);
      renderList('Fixed constraints', getField(charter.entries, 'fixed_constraints'), out);
      renderList('Open questions', getField(charter.entries, 'open_questions'), out);
    }
  }
  out.push(BLOCK_END);
  return out.join('\n');
}

function cmdSync(cwd) {
  requireInit(cwd);
  const block = renderBlock(loadCharters(cwd));
  const claudePath = path.join(cwd, CLAUDE_FILE);
  if (!fs.existsSync(claudePath)) {
    fs.writeFileSync(claudePath, block + '\n');
    say(`created   ${CLAUDE_FILE} with charter block`);
    return;
  }
  const text = fs.readFileSync(claudePath, 'utf8');
  const begin = text.indexOf(BLOCK_BEGIN);
  const end = text.indexOf(BLOCK_END);
  let next;
  if (begin === -1 && end === -1) {
    next = text.replace(/\n*$/, '\n\n') + block + '\n';
    say(`appended  charter block to ${CLAUDE_FILE}`);
  } else if (begin !== -1 && end !== -1 && end > begin) {
    next = text.slice(0, begin) + block + text.slice(end + BLOCK_END.length);
    say(`updated   charter block in ${CLAUDE_FILE}`);
  } else {
    fail(`${CLAUDE_FILE} has mismatched charter markers — fix or remove them and re-run`);
  }
  fs.writeFileSync(claudePath, next);
}

// ---------------------------------------------------------------------------
// charter log / promote — decision log
// ---------------------------------------------------------------------------

function decisionsPath(cwd) {
  return path.join(chartersDir(cwd), DECISIONS_BASENAME);
}

// Returns ordered array of { id, num, lines } where lines includes the
// `## D-XXXX` heading line.
function parseDecisions(text) {
  const decisions = [];
  let current = null;
  for (const line of text.split('\n')) {
    const heading = line.match(/^## (D-(\d+))\s*$/);
    if (heading) {
      current = { id: heading[1], num: parseInt(heading[2], 10), lines: [line] };
      decisions.push(current);
    } else if (current) {
      current.lines.push(line);
    }
  }
  return decisions;
}

function decisionField(decision, key) {
  for (const line of decision.lines) {
    const match = line.match(new RegExp(`^- ${key}: (.*)$`));
    if (match) return match[1];
  }
  return undefined;
}

function cmdLog(cwd, text, charterName) {
  requireInit(cwd);
  if (!text) fail('usage: charter log "<decision>" --charter <name>');
  if (!charterName) fail('missing --charter <name> (which charter does this decision belong to?)');
  const known = loadCharters(cwd).map((c) => c.name);
  if (!known.includes(charterName)) {
    const hint = known.length ? `known charters: ${known.join(', ')}` : 'no charters exist yet';
    fail(`unknown charter "${charterName}" (${hint})`);
  }
  const file = decisionsPath(cwd);
  const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : DECISIONS_HEADER;
  const decisions = parseDecisions(existing);
  const nextNum = decisions.reduce((max, d) => Math.max(max, d.num), 0) + 1;
  const id = `D-${String(nextNum).padStart(4, '0')}`;
  const entry = [
    '',
    `## ${id}`,
    `- date: ${today()}`,
    `- charter: ${charterName}`,
    '- status: open',
    `- decision: ${text.replace(/\s*\n\s*/g, ' ').trim()}`,
    '',
  ].join('\n');
  fs.writeFileSync(file, existing.replace(/\n*$/, '\n') + entry);
  say(`logged    ${id} → ${charterName}: ${text}`);
  say(`promote when settled: charter promote ${id}`);
}

function cmdPromote(cwd, rawId) {
  requireInit(cwd);
  if (!rawId) fail('usage: charter promote <id> (e.g. charter promote D-0001)');
  const num = rawId.match(/^(?:D-)?(\d+)$/i);
  if (!num) fail(`"${rawId}" is not a decision id (expected D-0001 or 1)`);
  const id = `D-${String(parseInt(num[1], 10)).padStart(4, '0')}`;

  const file = decisionsPath(cwd);
  if (!fs.existsSync(file)) fail(`no decision log at ${CHARTERS_DIR}/${DECISIONS_BASENAME}`);
  const text = fs.readFileSync(file, 'utf8');
  const decisions = parseDecisions(text);
  const decision = decisions.find((d) => d.id === id);
  if (!decision) fail(`no decision ${id} in the log`);

  const status = decisionField(decision, 'status');
  if (status !== 'open') fail(`${id} is not open (status: ${status || 'missing'})`);
  const charterName = decisionField(decision, 'charter');
  const decisionText = decisionField(decision, 'decision');
  if (!charterName || !decisionText) fail(`${id} is missing its charter or decision line`);

  const charter = loadCharters(cwd).find((c) => c.name === charterName);
  if (!charter) fail(`decision ${id} points at charter "${charterName}", which does not exist`);

  let constraints = getField(charter.entries, 'fixed_constraints');
  if (!Array.isArray(constraints)) {
    constraints = [];
    setField(charter.entries, 'fixed_constraints', constraints);
  }
  constraints.push(decisionText);
  const version = (parseInt(getField(charter.entries, 'version'), 10) || 1) + 1;
  setField(charter.entries, 'version', String(version));
  setField(charter.entries, 'updated', today());
  fs.writeFileSync(charter.file, serializeCharter(charter.entries, charter.body));

  const updatedLines = decision.lines.map((line) =>
    line === '- status: open'
      ? `- status: promoted (${charterName} v${version}, ${today()})`
      : line
  );
  fs.writeFileSync(file, text.replace(decision.lines.join('\n'), updatedLines.join('\n')));

  say(`promoted  ${id} into ${charterName} (now v${version})`);
  cmdSync(cwd);
}

// ---------------------------------------------------------------------------
// entrypoint
// ---------------------------------------------------------------------------

const HELP = `charter — encode settled decisions as fixed constraints for coding agents

Usage:
  charter init                                Scaffold charters/ and inject into CLAUDE.md
  charter sync                                Re-inject charters into CLAUDE.md
  charter log "<decision>" --charter <name>   Record a decision in the log
  charter promote <id>                        Move a logged decision into fixed_constraints

Charters live in charters/*.md. See charters/SCHEMA.md after init.
`;

function main(argv) {
  const cwd = process.cwd();
  const args = argv.slice(2);
  const command = args.shift();

  const positional = [];
  const flags = {};
  while (args.length) {
    const arg = args.shift();
    if (arg === '--charter') {
      flags.charter = args.shift();
    } else if (arg.startsWith('--')) {
      fail(`unknown flag ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  switch (command) {
    case 'init':
      return cmdInit(cwd);
    case 'sync':
      return cmdSync(cwd);
    case 'log':
      return cmdLog(cwd, positional.join(' '), flags.charter);
    case 'promote':
      return cmdPromote(cwd, positional[0]);
    case 'help':
    case '--help':
    case '-h':
    case undefined:
      return say(HELP);
    case '--version':
    case '-v':
      return say(require('../package.json').version);
    default:
      fail(`unknown command "${command}" — run \`charter help\``);
  }
}

main(process.argv);
