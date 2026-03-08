#!/usr/bin/env node
'use strict';

/**
 * MCP Server for the Agentic IT Project Team.
 *
 * Exposes the Command Center functionality as MCP tools, enabling
 * integration with VS Code, Visual Studio, JetBrains, and other
 * MCP-compatible IDE clients.
 *
 * Transport: stdio (launched automatically by the IDE).
 */

const path = require('node:path');
const fs   = require('node:fs');

/* ── MCP SDK imports (CJS) ──────────────────────────────────────── */
const sdkBase = require.resolve('@modelcontextprotocol/sdk/server');
const { McpServer }            = require(sdkBase.replace(/index\.js$/, 'mcp.js'));
const { StdioServerTransport } = require(sdkBase.replace(/index\.js$/, 'stdio.js'));

/* ── Webapp module imports ──────────────────────────────────────── */
const { FileStore }  = require('./store');
const { FileCache }  = require('./cache');
const { AuditTrail } = require('./audit');
const models         = require('./models');
const {
  sanitizeMarkdown,
  sanitizeQID,
  detectSecrets,
  safePath,
} = require('./server');

/* ── Path constants ─────────────────────────────────────────────── */
const PROJECT_ROOT   = path.resolve(__dirname, '../..');
const DOC_ROOT       = path.resolve(__dirname, '../docs');
const BUSINESS_DOCS  = path.join(PROJECT_ROOT, 'BusinessDocs');
const HELP_DIR       = path.resolve(__dirname, '../help');
const SESSION_DIR    = path.join(DOC_ROOT, 'session');
const DECISIONS_PATH = path.join(DOC_ROOT, 'decisions.md');
const AUDIT_DIR      = path.join(DOC_ROOT, 'audit');

/* ── Shared instances ───────────────────────────────────────────── */
const store = new FileStore();
const cache = new FileCache(store);
const audit = new AuditTrail({ logDir: AUDIT_DIR });

/* ── Helpers ────────────────────────────────────────────────────── */

function jsonResult(data) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function errorResult(message) {
  return { content: [{ type: 'text', text: JSON.stringify({ error: message }) }], isError: true };
}

function safeWrite(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = filePath + '.tmp.' + process.pid;
  fs.writeFileSync(tmp, data, 'utf8');
  fs.renameSync(tmp, filePath);
  cache.invalidate(filePath);
}

function parseQuestionnaireFile(full, name) {
  const content = fs.readFileSync(full, 'utf8');
  const parsed  = models.parseQuestionnaire(content, full, BUSINESS_DOCS);
  const rel     = path.relative(PROJECT_ROOT, full).replace(/\\/g, '/');
  const qs      = parsed.questions || [];
  return {
    file: rel,
    phase: parsed.phase || '',
    title: parsed.title || name,
    total: qs.length,
    answered:   qs.filter(q => q.status === 'ANSWERED').length,
    unanswered: qs.filter(q => q.status === 'OPEN' || q.status === 'UNANSWERED').length,
    deferred:   qs.filter(q => q.status === 'DEFERRED').length,
  };
}

function walkQuestionnaires(dir, results) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== '.backups') { walkQuestionnaires(full, results); continue; }
    if (!e.isFile() || !e.name.endsWith('-questionnaire.md')) continue;
    try { results.push(parseQuestionnaireFile(full, e.name)); }
    catch { /* skip unparseable files */ }
  }
}

function discoverQuestionnaires() {
  const results = [];
  if (!fs.existsSync(BUSINESS_DOCS)) return results;
  walkQuestionnaires(BUSINESS_DOCS, results);
  return results;
}

function readSessionState() {
  const file = path.join(SESSION_DIR, 'session-state.json');
  if (!fs.existsSync(file)) return null;
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return null; }
}

function readCommandQueue() {
  const file = path.join(SESSION_DIR, 'command-queue.json');
  if (!fs.existsSync(file)) return [];
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return []; }
}

function readDecisions() {
  if (!fs.existsSync(DECISIONS_PATH)) {
    return { open: [], decided: [], deferred: [] };
  }
  try {
    return models.parseDecisions(fs.readFileSync(DECISIONS_PATH, 'utf8'));
  } catch {
    return { open: [], decided: [], deferred: [] };
  }
}

function buildProgress(session) {
  if (!session) {
    return { projectName: null, mode: null, currentPhase: null, currentAgent: null, phases: [], activeSprint: null };
  }
  return {
    projectName:  session.projectName  || null,
    mode:         session.mode         || null,
    currentPhase: session.currentPhase || null,
    currentAgent: session.currentAgent || null,
    phases:       session.phases       || [],
    activeSprint: session.activeSprint || null,
  };
}

/* ── MCP Server ─────────────────────────────────────────────────── */

const mcp = new McpServer(
  { name: 'agentic-it-project-team', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {} } }
);

/* ════════════════════════════════════════════════════════════════ */
/*  TOOLS                                                          */
/* ════════════════════════════════════════════════════════════════ */

/* ── Project Status ─────────────────────────────────────────────── */

mcp.tool(
  'get_project_status',
  'Get the current project status including session state, pipeline progress, active command, and command queue summary',
  async () => {
    try {
      const session  = readSessionState();
      const queue    = readCommandQueue();
      const progress = buildProgress(session);
      return jsonResult({
        session: session ? {
          projectName:  session.projectName,
          mode:         session.mode,
          status:       session.status,
          currentPhase: session.currentPhase,
          currentAgent: session.currentAgent,
        } : null,
        progress,
        commandQueue: {
          total:  queue.length,
          latest: queue.length ? queue[queue.length - 1] : null,
        },
      });
    } catch (err) {
      return errorResult(`Failed to read project status: ${err.message}`);
    }
  }
);

mcp.tool(
  'get_progress',
  'Get detailed pipeline progress: phase completion status, current agent, sprint information',
  async () => {
    try {
      return jsonResult(buildProgress(readSessionState()));
    } catch (err) {
      return errorResult(`Failed to read progress: ${err.message}`);
    }
  }
);

/* ── Questionnaires ─────────────────────────────────────────────── */

mcp.tool(
  'list_questionnaires',
  'List all questionnaire files with completion statistics (total, answered, unanswered, deferred questions per file)',
  async () => {
    try {
      return jsonResult(discoverQuestionnaires());
    } catch (err) {
      return errorResult(`Failed to list questionnaires: ${err.message}`);
    }
  }
);

mcp.tool(
  'get_questionnaire',
  'Get the full contents of a specific questionnaire including all questions, answers, and statuses',
  {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        description: 'Questionnaire file path relative to project root (e.g. BusinessDocs/Phase1-Business/Questionnaires/ba-questionnaire.md)',
      },
    },
    required: ['file'],
  },
  async ({ file }) => {
    try {
      if (!file) return errorResult('file parameter is required');
      const abs = safePath(PROJECT_ROOT, file);
      if (!fs.existsSync(abs)) return errorResult(`File not found: ${file}`);
      const content = fs.readFileSync(abs, 'utf8');
      return jsonResult({ file, ...models.parseQuestionnaire(content, abs, PROJECT_ROOT) });
    } catch (err) {
      if (err.errorCode === 'PATH_TRAVERSAL') return errorResult('Invalid file path');
      return errorResult(`Failed to read questionnaire: ${err.message}`);
    }
  }
);

mcp.tool(
  'save_answers',
  'Save one or more answers to a questionnaire file. Each update specifies a question ID, answer text, and new status.',
  {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        description: 'Questionnaire file path relative to project root',
      },
      updates: {
        type: 'array',
        description: 'Array of answer updates to apply',
        items: {
          type: 'object',
          properties: {
            questionId: { type: 'string', description: 'Question ID (e.g. Q-01-0001)' },
            answer:     { type: 'string', description: 'Answer text' },
            status:     { type: 'string', enum: ['ANSWERED', 'DEFERRED'], description: 'New question status' },
          },
          required: ['questionId', 'answer', 'status'],
        },
      },
    },
    required: ['file', 'updates'],
  },
  async ({ file, updates }) => {
    try {
      if (!file || !Array.isArray(updates) || updates.length === 0) {
        return errorResult('file and non-empty updates array are required');
      }
      if (updates.length > 200) return errorResult('Too many updates (max 200)');

      const abs = safePath(PROJECT_ROOT, file);
      if (!fs.existsSync(abs)) return errorResult(`File not found: ${file}`);

      return applySaveAnswers(abs, file, updates);
    } catch (err) {
      if (err.errorCode === 'PATH_TRAVERSAL') return errorResult('Invalid file path');
      return errorResult(`Failed to save answers: ${err.message}`);
    }
  }
);

function applyOneUpdate(u, content, warnings) {
  if (!models.Q_ID_RE.test(u.questionId)) {
    warnings.push(`Invalid Q-ID format: ${u.questionId}`);
    return { content, applied: false };
  }
  const secrets = detectSecrets(u.answer || '');
  if (secrets.length) {
    warnings.push(`Secret pattern detected in answer for ${u.questionId}`);
  }
  const sanitized = sanitizeQID(sanitizeMarkdown(u.answer || ''));
  const updated   = models.updateAnswerInContent(content, u.questionId, sanitized, u.status);
  return { content: updated, applied: updated !== content };
}

function applySaveAnswers(abs, file, updates) {
  let content  = fs.readFileSync(abs, 'utf8');
  const warnings = [];
  let applied  = 0;

  for (const u of updates) {
    const r = applyOneUpdate(u, content, warnings);
    content = r.content;
    if (r.applied) applied++;
  }

  safeWrite(abs, content);
  audit.log({
    operation: 'SAVE_ANSWERS', entityType: 'questionnaire',
    entityId: file, user: 'mcp',
    summary: `Updated ${applied} of ${updates.length} answers`,
  });

  const result = { saved: true, file, applied, total: updates.length };
  if (warnings.length) result.warnings = warnings;
  return jsonResult(result);
}

/* ── Decisions ──────────────────────────────────────────────────── */

mcp.tool(
  'list_decisions',
  'List all decisions grouped by status: open questions, decided items, and deferred items',
  async () => {
    try {
      return jsonResult(readDecisions());
    } catch (err) {
      return errorResult(`Failed to read decisions: ${err.message}`);
    }
  }
);

mcp.tool(
  'create_decision',
  'Create a new open question or operational decision in the decisions register',
  {
    type: 'object',
    properties: {
      type:     { type: 'string', enum: ['question', 'operational'], description: 'Decision type: question (needs answer) or operational (immediate decision)' },
      priority: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'], description: 'Priority level' },
      scope:    { type: 'string', description: 'Scope/category (e.g. TECH, BUSINESS, UX, MARKETING)' },
      text:     { type: 'string', description: 'The question or decision text' },
      notes:    { type: 'string', description: 'Optional additional context or notes' },
    },
    required: ['type', 'priority', 'scope', 'text'],
  },
  async ({ type, priority, scope, text, notes }) => {
    try {
      const valErr = validateDecisionFields(type, priority, scope, text);
      if (valErr) return valErr;
      if (!fs.existsSync(DECISIONS_PATH)) return errorResult('decisions.md not found — run a CREATE or AUDIT command first');

      let content = fs.readFileSync(DECISIONS_PATH, 'utf8');
      const id = models.nextDecisionId(content, 'DEC-');
      const safeText  = sanitizeMarkdown(text);
      const safeNotes = notes ? sanitizeMarkdown(notes) : '';

      if (type === 'question') {
        content = models.addOpenQuestion(content, { id, priority, scope, question: safeText, answer: '', date: models.today() });
      } else {
        content = models.addOperationalDecision(content, { id, priority, scope, decision: safeText, notes: safeNotes, date: models.today() });
      }
      content = models.appendAuditTrail(content, 'create', id);

      safeWrite(DECISIONS_PATH, content);
      audit.log({
        operation: 'CREATE_DECISION', entityType: 'decision',
        entityId: id, user: 'mcp',
        summary: `${type}: ${text.slice(0, 80)}`,
      });
      return jsonResult({ created: true, id, type, priority, scope });
    } catch (err) {
      return errorResult(`Failed to create decision: ${err.message}`);
    }
  }
);

mcp.tool(
  'answer_decision',
  'Provide an answer to an open question in the decisions register',
  {
    type: 'object',
    properties: {
      id:     { type: 'string', description: 'Decision ID (e.g. DEC-Q-001)' },
      answer: { type: 'string', description: 'The answer text' },
    },
    required: ['id', 'answer'],
  },
  async ({ id, answer }) => {
    try {
      if (!id || !answer) return errorResult('id and answer are required');
      if (!models.DEC_ID_RE.test(id)) return errorResult(`Invalid decision ID format: ${id}`);
      if (!fs.existsSync(DECISIONS_PATH)) return errorResult('decisions.md not found');

      let content = fs.readFileSync(DECISIONS_PATH, 'utf8');
      const secrets = detectSecrets(answer);
      const safeAnswer = sanitizeMarkdown(answer);

      content = models.answerOpenQuestion(content, id, safeAnswer);
      content = models.appendAuditTrail(content, 'answer', id);

      safeWrite(DECISIONS_PATH, content);
      audit.log({
        operation: 'ANSWER_DECISION', entityType: 'decision',
        entityId: id, user: 'mcp',
        summary: `Answered: ${answer.slice(0, 80)}`,
      });

      const result = { answered: true, id };
      if (secrets.length) result.warnings = ['Secret pattern detected in answer — review before committing'];
      return jsonResult(result);
    } catch (err) {
      return errorResult(`Failed to answer decision: ${err.message}`);
    }
  }
);

mcp.tool(
  'decide_question',
  'Finalize an answered open question by moving it to the decided section. The question must have an answer before it can be decided.',
  {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Decision ID to finalize (e.g. DEC-001)' },
    },
    required: ['id'],
  },
  async ({ id }) => {
    try {
      if (!id) return errorResult('id is required');
      if (!models.DEC_ID_RE.test(id)) return errorResult(`Invalid decision ID format: ${id}`);
      if (!fs.existsSync(DECISIONS_PATH)) return errorResult('decisions.md not found');

      let content = fs.readFileSync(DECISIONS_PATH, 'utf8');
      content = models.moveToDecided(content, id);
      content = models.appendAuditTrail(content, 'decide', id);

      safeWrite(DECISIONS_PATH, content);
      audit.log({
        operation: 'DECIDE_QUESTION', entityType: 'decision',
        entityId: id, user: 'mcp',
        summary: `Decided: ${id}`,
      });
      return jsonResult({ decided: true, id });
    } catch (err) {
      return errorResult(`Failed to decide question: ${err.message}`);
    }
  }
);

/* ── Commands ───────────────────────────────────────────────────── */

function validateDecisionFields(type, priority, scope, text) {
  if (!['question', 'operational'].includes(type)) return errorResult('type must be "question" or "operational"');
  if (!['HIGH', 'MEDIUM', 'LOW'].includes(priority)) return errorResult('priority must be HIGH, MEDIUM, or LOW');
  if (!scope || !text) return errorResult('scope and text are required');
  return null;
}

const VALID_COMMANDS = [
  'CREATE', 'AUDIT',
  'CREATE BUSINESS', 'CREATE TECH', 'CREATE UX', 'CREATE MARKETING', 'CREATE SYNTHESIS',
  'REEVALUATE', 'FEATURE', 'SCOPE CHANGE', 'HOTFIX', 'REFRESH ONBOARDING',
];

mcp.tool(
  'queue_command',
  `Queue a command for the orchestrator. Valid commands: ${VALID_COMMANDS.join(', ')}. After queuing, paste the returned text into Copilot Chat.`,
  {
    type: 'object',
    properties: {
      command:     { type: 'string', description: 'The command to queue (e.g. CREATE, AUDIT, REEVALUATE)' },
      project:     { type: 'string', description: 'Project name (for CREATE/AUDIT)' },
      scope:       { type: 'string', description: 'Scope for REEVALUATE/SCOPE CHANGE: ALL, BUSINESS, TECH, UX, MARKETING' },
      description: { type: 'string', description: 'Description for FEATURE, SCOPE CHANGE, or HOTFIX' },
      brief:       { type: 'string', description: 'Full project brief text (saved to BusinessDocs/project-brief.md)' },
    },
    required: ['command'],
  },
  async ({ command, project, scope, description, brief }) => {
    try {
      if (!command) return errorResult('command is required');
      const upperCmd = command.toUpperCase().trim();

      if (!VALID_COMMANDS.some(v => upperCmd.startsWith(v))) {
        return errorResult(`Unknown command: ${command}. Valid: ${VALID_COMMANDS.join(', ')}`);
      }

      const text = buildCommandText(upperCmd, project, scope, description);
      if (brief) saveBrief(brief);
      enqueueCommand(upperCmd, text, project, scope, description);

      return jsonResult({
        queued: true,
        text,
        instruction: `Paste this into Copilot Chat: ${text}`,
      });
    } catch (err) {
      return errorResult(`Failed to queue command: ${err.message}`);
    }
  }
);

function buildCommandText(upperCmd, project, scope, description) {
  let text = upperCmd;
  if (project)     text += ` ${project}`;
  if (scope)       text += ` ${scope}`;
  if (description) text += `: ${description}`;
  return text;
}

function saveBrief(brief) {
  const briefDir = path.join(PROJECT_ROOT, 'BusinessDocs');
  if (!fs.existsSync(briefDir)) fs.mkdirSync(briefDir, { recursive: true });
  safeWrite(path.join(briefDir, 'project-brief.md'), brief);
}

function enqueueCommand(upperCmd, text, project, scope, description) {
  const queue = readCommandQueue();
  const entry = { command: upperCmd, text, timestamp: models.isoNow(), status: 'QUEUED' };
  if (project)     entry.project     = project;
  if (scope)       entry.scope       = scope;
  if (description) entry.description = description;
  queue.push(entry);

  const queuePath = path.join(SESSION_DIR, 'command-queue.json');
  if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });
  safeWrite(queuePath, JSON.stringify(queue, null, 2));

  audit.log({
    operation: 'QUEUE_COMMAND', entityType: 'command',
    entityId: text, user: 'mcp', summary: text,
  });
}

mcp.tool(
  'get_command_queue',
  'Get the full command queue with all queued, active, and completed commands',
  async () => {
    try {
      return jsonResult(readCommandQueue());
    } catch (err) {
      return errorResult(`Failed to read command queue: ${err.message}`);
    }
  }
);

/* ── Help ───────────────────────────────────────────────────────── */

mcp.tool(
  'get_help',
  'Get help on commands, concepts, and workflows. Omit topic for a table of contents listing all available topics.',
  {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: 'Help topic slug (e.g. commands, phases, decisions). Omit for table of contents.',
      },
    },
  },
  async ({ topic } = {}) => {
    try {
      if (!fs.existsSync(HELP_DIR)) return errorResult('Help directory not found');

      if (!topic) {
        const files  = fs.readdirSync(HELP_DIR).filter(f => f.endsWith('.md'));
        const topics = files.map(f => ({ slug: f.replace('.md', ''), file: f }));
        return jsonResult({ topics });
      }

      const safe = topic.replace(/[^a-z0-9_-]/gi, '');
      const file = path.join(HELP_DIR, `${safe}.md`);
      if (!fs.existsSync(file)) return errorResult(`Help topic not found: ${topic}`);
      return jsonResult({ topic: safe, content: fs.readFileSync(file, 'utf8') });
    } catch (err) {
      return errorResult(`Failed to read help: ${err.message}`);
    }
  }
);

/* ── Audit ──────────────────────────────────────────────────────── */

mcp.tool(
  'get_audit_log',
  'Get recent entries from the mutation audit trail (append-only log of all data changes)',
  {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum entries to return (default: 50, max: 1000)',
      },
    },
  },
  async ({ limit } = {}) => {
    try {
      const n = Math.min(Math.max(Number(limit) || 50, 1), 1000);
      const entries = audit.read(n);
      return jsonResult({ total: entries.length, entries });
    } catch (err) {
      return errorResult(`Failed to read audit log: ${err.message}`);
    }
  }
);

/* ════════════════════════════════════════════════════════════════ */
/*  RESOURCES                                                      */
/* ════════════════════════════════════════════════════════════════ */

mcp.resource(
  'session-state',
  'agentic://session-state',
  { description: 'Current session state (project name, mode, phase, agent, sprint)', mimeType: 'application/json' },
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: JSON.stringify(readSessionState(), null, 2),
      mimeType: 'application/json',
    }],
  })
);

mcp.resource(
  'decisions',
  'agentic://decisions',
  { description: 'All decisions: open questions, decided items, deferred items', mimeType: 'application/json' },
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: JSON.stringify(readDecisions(), null, 2),
      mimeType: 'application/json',
    }],
  })
);

mcp.resource(
  'command-queue',
  'agentic://command-queue',
  { description: 'Command queue with all orchestrator commands', mimeType: 'application/json' },
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: JSON.stringify(readCommandQueue(), null, 2),
      mimeType: 'application/json',
    }],
  })
);

/* ════════════════════════════════════════════════════════════════ */
/*  STARTUP                                                        */
/* ════════════════════════════════════════════════════════════════ */

if (require.main === module) {
  (async () => {
    const transport = new StdioServerTransport();
    await mcp.connect(transport);
  })().catch((err) => {
    process.stderr.write(`MCP server fatal error: ${err.message}\n`);
    process.exit(1);
  });
}

/* ── Exports for testing ────────────────────────────────────────── */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    discoverQuestionnaires,
    readSessionState,
    readCommandQueue,
    readDecisions,
    buildProgress,
    jsonResult,
    errorResult,
    safeWrite,
    mcp,
    PROJECT_ROOT,
    DOC_ROOT,
    BUSINESS_DOCS,
    SESSION_DIR,
    DECISIONS_PATH,
  };
}
