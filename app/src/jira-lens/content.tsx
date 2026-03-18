/**
 * @file content.tsx
 * @description Jira Lens — Webview UI
 *
 * ARCHITECTURE
 * ────────────
 * Top-level <Content> component manages a 3-step state machine:
 *
 *   Step 0  StepCredentials  — Credential input form (domain / email / API token)
 *   Step 1  StepConnecting   — Connection progress (driven by CONNECT_PROGRESS push messages)
 *   Step 2  Main interface   — 3-level Jira browser (Projects → Issues → Issue detail)
 *
 * Step 2 sub-navigation:
 *   Level 1  ProjectList   — shows all projects
 *   Level 2  IssueList     — shows all issues in the selected project
 *   Level 3  IssueDetail   — shows full detail for a single issue (with write actions)
 *
 * DATA FLOW
 * ─────────
 *   VS Code Webview:  Webview → postMessage → extension.ts → Jira Cloud
 *   Browser (dev):    Browser → server.js proxy (localhost:3001) → Jira Cloud
 *
 * Both paths are abstracted by transport.ts.
 * In browser dev mode, initialStep defaults to 2 (skip onboarding entirely).
 */

import React, { useState, useCallback, useEffect, useRef, Component } from 'react';
import { chartNeutral, chartRainbow, use } from '../global-styles/colors';
import { BasicLayout } from '../components/layout/basic-layout';
import { Button } from '../components/general/button';
import {
  initialStep,
  onPush,
  saveCredentials,
  resetCredentials,
  getProjects,
  getIssues,
  getIssue,
  getTransitions,
  transitionIssue,
  searchUsers,
  assignIssue,
  addComment,
  type ConnectProgressMessage,
  type JiraProject,
  type JiraIssueSummary,
  type JiraIssueDetail,
  type JiraTransition,
  type JiraUser,
} from './transport';

// ── Project filter ────────────────────────────────────────────────────────────
const JIRA_PROJECT_KEYS: string[] = ['JL'];

// ── Utilities ─────────────────────────────────────────────────────────────────

function adfToPlainText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const n = node as { type?: string; text?: string; content?: unknown[] };
  if (n.type === 'text' && typeof n.text === 'string') return n.text;
  if (Array.isArray(n.content)) return n.content.map(adfToPlainText).join('');
  return '';
}

// ── Shared UI components ──────────────────────────────────────────────────────

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      style={{
        color: chartRainbow['red-100'],
        background: chartRainbow['red-20'],
        padding: 12,
        borderRadius: 4,
        marginBottom: 16,
      }}
    >
      <strong>Error</strong>
      <br />
      {message}
    </div>
  );
}

function Toast({ message, type, onDismiss }: { message: string; type: 'success' | 'error'; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        padding: '10px 16px',
        borderRadius: 6,
        fontSize: 13,
        background: type === 'success' ? chartRainbow['green-20'] : chartRainbow['red-20'],
        color: type === 'success' ? chartRainbow['green-100'] : chartRainbow['red-100'],
        border: `1px solid ${type === 'success' ? chartRainbow['green-60'] : chartRainbow['red-60']}`,
        zIndex: 9999,
        cursor: 'pointer',
      }}
      onClick={onDismiss}
    >
      {message}
    </div>
  );
}

// ── Step 0: Credential Input ──────────────────────────────────────────────────

function StepCredentials({ onSaved }: { onSaved: () => void }) {
  const [domain, setDomain] = useState('');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain || !email || !token) return;
    setSaving(true);
    try {
      await saveCredentials(domain.trim(), email.trim(), token.trim());
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: 14,
    border: `1px solid ${use['border-prime']}`,
    borderRadius: 4,
    background: use['bg-prime'],
    boxSizing: 'border-box',
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
          Jira domain
        </label>
        <input
          type="text"
          value={domain}
          onChange={e => setDomain(e.target.value)}
          placeholder="your-company.atlassian.net"
          style={inputStyle}
          autoFocus
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@company.com"
          style={inputStyle}
        />
      </div>
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
          API token
        </label>
        <input
          type="password"
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder="Paste your Atlassian API token"
          style={inputStyle}
        />
        <div style={{ fontSize: 12, color: chartNeutral['6'], marginTop: 4 }}>
          Generate at{' '}
          <a href="https://id.atlassian.com/manage-profile/security/api-tokens" style={{ color: chartRainbow['blue-100'] }}>
            id.atlassian.com
          </a>
        </div>
      </div>
      <button
        type="submit"
        disabled={saving || !domain || !email || !token}
        style={{
          padding: '10px 24px',
          fontSize: 14,
          fontWeight: 600,
          background: chartRainbow['blue-100'],
          color: chartNeutral['0'],
          border: 'none',
          borderRadius: 4,
          cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? 'Connecting…' : 'Connect'}
      </button>
    </form>
  );
}

// ── Step 1: Connecting ────────────────────────────────────────────────────────

function StepConnecting({
  progress,
  onRetry,
}: {
  progress: ConnectProgressMessage | null;
  onRetry: () => void;
}) {
  const stage = progress?.stage ?? 'validating';

  const stages: { key: string; label: string }[] = [
    { key: 'validating', label: 'Validating credentials' },
    { key: 'fetching', label: 'Fetching projects' },
    { key: 'done', label: 'Connected!' },
  ];

  return (
    <div>
      {stages.map(s => {
        const isActive = s.key === stage;
        const isDone = stages.findIndex(x => x.key === stage) > stages.findIndex(x => x.key === s.key);
        return (
          <div
            key={s.key}
            style={{
              padding: '8px 0',
              fontSize: 14,
              color: isDone ? chartRainbow['green-100'] : isActive ? chartNeutral['12'] : chartNeutral['6'],
              fontWeight: isActive ? 600 : 400,
            }}
          >
            {isDone ? '✓ ' : isActive ? '● ' : '○ '}
            {s.label}
          </div>
        );
      })}

      {stage === 'error' && (
        <div style={{ marginTop: 16 }}>
          <ErrorBox message={progress?.message ?? 'Connection failed'} />
          <button
            type="button"
            onClick={onRetry}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              background: chartRainbow['blue-100'],
              color: chartNeutral['0'],
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Update credentials
          </button>
        </div>
      )}
    </div>
  );
}

// ── Level 1: Project List ─────────────────────────────────────────────────────

function ProjectList({ onSelect }: { onSelect: (project: JiraProject) => void }) {
  const [projects, setProjects] = useState<JiraProject[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        let data = await getProjects();
        if (JIRA_PROJECT_KEYS.length > 0) {
          data = data.filter(p => JIRA_PROJECT_KEYS.includes(p.key));
        }
        setProjects(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Request failed');
        setProjects(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p style={{ color: chartNeutral['6'] }}>Loading projects…</p>;
  if (error) return <ErrorBox message={error} />;
  if (!projects || projects.length === 0) {
    return <p style={{ color: chartNeutral['6'] }}>No projects found</p>;
  }

  return (
    <div>
      {projects.map(p => (
        <button
          key={p.key}
          type="button"
          onClick={() => onSelect(p)}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            padding: 12,
            border: `1px solid ${use['border-prime']}`,
            marginBottom: 8,
            borderRadius: 4,
            background: use['bg-prime'],
            cursor: 'pointer',
          }}
        >
          <strong>{p.key}</strong> — {p.name}
        </button>
      ))}
    </div>
  );
}

// ── Level 2: Issue List ───────────────────────────────────────────────────────

function IssueList({
  project,
  onBack,
  onSelectIssue,
}: {
  project: JiraProject;
  onBack: () => void;
  onSelectIssue: (issue: JiraIssueSummary) => void;
}) {
  const [issues, setIssues] = useState<JiraIssueSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getIssues(project.key);
      setIssues(data.issues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      setIssues(null);
    } finally {
      setLoading(false);
    }
  }, [project.key]);

  useEffect(() => { void fetchIssues(); }, [fetchIssues]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            padding: '6px 12px',
            fontSize: 13,
            background: 'transparent',
            border: `1px solid ${use['border-prime']}`,
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
        <span style={{ fontWeight: 600 }}>
          {project.name}{' '}
          <span style={{ color: chartNeutral['6'], fontWeight: 400 }}>({project.key})</span>
        </span>
        <button
          type="button"
          onClick={fetchIssues}
          disabled={loading}
          style={{
            marginLeft: 'auto',
            padding: '6px 12px',
            fontSize: 13,
            background: chartRainbow['blue-100'],
            color: chartNeutral['0'],
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && <ErrorBox message={error} />}

      {!error && issues !== null && (
        <div>
          {issues.length === 0 ? (
            <p style={{ color: chartNeutral['6'] }}>No issues</p>
          ) : (
            issues.map(i => {
              const f = i.fields ?? {};
              return (
                <button
                  key={i.key}
                  type="button"
                  onClick={() => onSelectIssue(i)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: 12,
                    border: `1px solid ${use['border-prime']}`,
                    marginBottom: 8,
                    borderRadius: 4,
                    background: use['bg-prime'],
                    cursor: 'pointer',
                  }}
                >
                  <strong>{i.key}</strong> {f.summary ?? '(No title)'}
                  <br />
                  <small style={{ color: chartNeutral['6'] }}>
                    {f.issuetype?.name ?? '-'} · {f.status?.name ?? '-'} ·{' '}
                    {f.assignee?.displayName ?? 'Unassigned'}
                  </small>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ── Level 3: Issue Detail ─────────────────────────────────────────────────────

function IssueDetail({ issueKey, onBack }: { issueKey: string; onBack: () => void }) {
  const [issue, setIssue] = useState<JiraIssueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getIssue(issueKey);
      setIssue(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      setIssue(null);
    } finally {
      setLoading(false);
    }
  }, [issueKey]);

  useEffect(() => { void fetchDetail(); }, [fetchDetail]);

  if (loading) return <p style={{ color: chartNeutral['6'] }}>Loading issue…</p>;
  if (error) return <ErrorBox message={error} />;
  if (!issue) return null;

  const f = issue.fields;
  const descText = f.description && typeof f.description === 'object'
    ? adfToPlainText(f.description)
    : '';

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            padding: '6px 12px',
            fontSize: 13,
            background: 'transparent',
            border: `1px solid ${use['border-prime']}`,
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
        <span style={{ fontWeight: 600 }}>{issue.key}</span>
        <button
          type="button"
          onClick={fetchDetail}
          style={{
            marginLeft: 'auto',
            padding: '6px 12px',
            fontSize: 13,
            background: chartRainbow['blue-100'],
            color: chartNeutral['0'],
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {f.issuetype?.iconUrl && (
            <img src={f.issuetype.iconUrl} alt="" width={16} height={16} style={{ marginTop: 2 }} />
          )}
          <span style={{ fontWeight: 600, fontSize: 18 }}>{f.summary}</span>
        </div>

        {/* Status with transition dropdown */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
          <TransitionDropdown
            issueKey={issue.key}
            currentStatus={f.status?.name ?? '-'}
            onTransitioned={(newStatus) => {
              setIssue(prev => prev ? {
                ...prev,
                fields: { ...prev.fields, status: { name: newStatus } },
              } : prev);
              setToast({ message: `Status changed to "${newStatus}"`, type: 'success' });
            }}
            onError={(msg) => setToast({ message: msg, type: 'error' })}
          />
          {f.priority?.name && (
            <span style={{ color: chartNeutral['6'], fontSize: 13 }}>{f.priority.name}</span>
          )}
        </div>

        {/* Assignee with picker */}
        <div style={{ fontSize: 13, color: chartNeutral['6'], marginBottom: 16 }}>
          <AssigneePicker
            issueKey={issue.key}
            currentAssignee={f.assignee?.displayName ?? 'Unassigned'}
            onAssigned={(name) => {
              setIssue(prev => prev ? {
                ...prev,
                fields: { ...prev.fields, assignee: name ? { displayName: name } : null },
              } : prev);
              setToast({ message: name ? `Assigned to ${name}` : 'Unassigned', type: 'success' });
            }}
            onError={(msg) => setToast({ message: msg, type: 'error' })}
          />
          {' · '}Reporter: {f.reporter?.displayName ?? '-'}
          {f.created && ` · Created: ${f.created.slice(0, 10)}`}
          {f.updated && ` · Updated: ${f.updated.slice(0, 10)}`}
          {f.duedate && ` · Due: ${f.duedate}`}
        </div>

        {(f.story_points != null || (f.labels?.length ?? 0) > 0 || (f.fixVersions?.length ?? 0) > 0) && (
          <div style={{ fontSize: 13, marginBottom: 16 }}>
            {f.story_points != null && <span style={{ marginRight: 12 }}>Story points: {f.story_points}</span>}
            {f.labels && f.labels.length > 0 && <span style={{ marginRight: 12 }}>Labels: {f.labels.join(', ')}</span>}
            {f.fixVersions && f.fixVersions.length > 0 && <span>Fix versions: {f.fixVersions.map(v => v.name).join(', ')}</span>}
          </div>
        )}

        {descText && (
          <div style={{ marginBottom: 16 }}>
            <strong style={{ fontSize: 13 }}>Description</strong>
            <div style={{ marginTop: 4, whiteSpace: 'pre-wrap', fontSize: 14 }}>{descText}</div>
          </div>
        )}

        {f.subtasks && f.subtasks.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <strong style={{ fontSize: 13 }}>Subtasks</strong>
            <ul style={{ margin: '4px 0 0 20px', padding: 0 }}>
              {f.subtasks.map(st => (
                <li key={st.key} style={{ marginBottom: 4 }}>
                  {st.key} {st.fields?.summary ?? ''} ({st.fields?.status?.name ?? '-'})
                </li>
              ))}
            </ul>
          </div>
        )}

        {f.issuelinks && f.issuelinks.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <strong style={{ fontSize: 13 }}>Linked issues</strong>
            <ul style={{ margin: '4px 0 0 20px', padding: 0 }}>
              {f.issuelinks.map((link, idx) => {
                const other = link.inwardIssue ?? link.outwardIssue;
                return other ? (
                  <li key={`${link.inwardIssue?.key ?? ''}-${link.outwardIssue?.key ?? ''}-${idx}`}>
                    {link.type?.name ?? 'related'}: {other.key}
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        )}

        {/* Comments section with add-comment form */}
        <div style={{ marginBottom: 16 }}>
          <strong style={{ fontSize: 13 }}>Comments</strong>
          {f.comment?.comments && f.comment.comments.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {f.comment.comments.map((c, idx) => (
                <div
                  key={idx}
                  style={{ padding: 12, marginBottom: 8, border: `1px solid ${use['border-prime']}`, borderRadius: 4, fontSize: 13 }}
                >
                  <strong>{c.author?.displayName ?? 'Unknown'}</strong>
                  {c.created && <span style={{ color: chartNeutral['6'], marginLeft: 8 }}>{c.created.slice(0, 16)}</span>}
                  <div style={{ marginTop: 4 }}>{adfToPlainText(c.body)}</div>
                </div>
              ))}
            </div>
          )}
          <AddCommentBox
            issueKey={issue.key}
            onCommentAdded={(body) => {
              setIssue(prev => {
                if (!prev) return prev;
                const existing = prev.fields.comment?.comments ?? [];
                return {
                  ...prev,
                  fields: {
                    ...prev.fields,
                    comment: {
                      comments: [
                        ...existing,
                        { author: { displayName: 'You' }, body: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: body }] }] }, created: new Date().toISOString() },
                      ],
                    },
                  },
                };
              });
              setToast({ message: 'Comment added', type: 'success' });
            }}
            onError={(msg) => setToast({ message: msg, type: 'error' })}
          />
        </div>
      </div>
    </div>
  );
}

// ── Write Action: Transition Dropdown ─────────────────────────────────────────

function TransitionDropdown({
  issueKey,
  currentStatus,
  onTransitioned,
  onError,
}: {
  issueKey: string;
  currentStatus: string;
  onTransitioned: (newStatus: string) => void;
  onError: (msg: string) => void;
}) {
  const [transitions, setTransitions] = useState<JiraTransition[] | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    if (open) { setOpen(false); return; }
    setLoading(true);
    try {
      const data = await getTransitions(issueKey);
      setTransitions(data);
      setOpen(true);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to load transitions');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (t: JiraTransition) => {
    setOpen(false);
    const previousStatus = currentStatus;
    onTransitioned(t.to || t.name);
    try {
      await transitionIssue(issueKey, t.id);
    } catch (err) {
      onTransitioned(previousStatus);
      onError(err instanceof Error ? err.message : 'Transition failed');
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={handleOpen}
        disabled={loading}
        style={{
          padding: '2px 10px',
          borderRadius: 4,
          background: chartRainbow['blue-20'],
          color: chartRainbow['blue-100'],
          fontSize: 12,
          border: `1px solid ${chartRainbow['blue-60']}`,
          cursor: 'pointer',
        }}
      >
        {loading ? '…' : currentStatus} ▾
      </button>
      {open && transitions && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            background: use['bg-prime'],
            border: `1px solid ${use['border-prime']}`,
            borderRadius: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 100,
            minWidth: 160,
          }}
        >
          {transitions.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSelect(t)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                fontSize: 13,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderBottom: `1px solid ${use['border-prime']}`,
              }}
            >
              {t.name} → <strong>{t.to}</strong>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Write Action: Assignee Picker ─────────────────────────────────────────────

function AssigneePicker({
  issueKey,
  currentAssignee,
  onAssigned,
  onError,
}: {
  issueKey: string;
  currentAssignee: string;
  onAssigned: (displayName: string | null) => void;
  onError: (msg: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<JiraUser[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setUsers([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const result = await searchUsers(q.trim());
        setUsers(result);
      } catch {
        setUsers([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  const handleSelect = async (user: JiraUser | null) => {
    setOpen(false);
    setQuery('');
    setUsers([]);
    const previousAssignee = currentAssignee;
    onAssigned(user?.displayName ?? null);
    try {
      await assignIssue(issueKey, user?.accountId ?? null);
    } catch (err) {
      onAssigned(previousAssignee === 'Unassigned' ? null : previousAssignee);
      onError(err instanceof Error ? err.message : 'Assign failed');
    }
  };

  return (
    <span style={{ position: 'relative', display: 'inline' }}>
      Assignee:{' '}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'inherit',
          padding: 0,
          textDecoration: 'underline',
          textDecorationStyle: 'dotted' as const,
          fontSize: 'inherit',
        }}
      >
        {currentAssignee}
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            background: use['bg-prime'],
            border: `1px solid ${use['border-prime']}`,
            borderRadius: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 100,
            minWidth: 220,
            padding: 8,
          }}
        >
          <input
            type="text"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search users…"
            autoFocus
            style={{
              width: '100%',
              padding: '6px 8px',
              fontSize: 13,
              border: `1px solid ${use['border-prime']}`,
              borderRadius: 4,
              boxSizing: 'border-box',
              marginBottom: 4,
            }}
          />
          {searching && <div style={{ fontSize: 12, color: chartNeutral['6'], padding: 4 }}>Searching…</div>}
          <button
            type="button"
            onClick={() => handleSelect(null)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '6px 8px',
              fontSize: 13,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: chartNeutral['6'],
            }}
          >
            Unassign
          </button>
          {users.map(u => (
            <button
              key={u.accountId}
              type="button"
              onClick={() => handleSelect(u)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '6px 8px',
                fontSize: 13,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {u.displayName}
              {u.email && <span style={{ color: chartNeutral['6'], marginLeft: 4 }}>({u.email})</span>}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}

// ── Write Action: Add Comment ─────────────────────────────────────────────────

function AddCommentBox({
  issueKey,
  onCommentAdded,
  onError,
}: {
  issueKey: string;
  onCommentAdded: (body: string) => void;
  onError: (msg: string) => void;
}) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    const body = text.trim();
    setText('');
    try {
      await addComment(issueKey, body);
      onCommentAdded(body);
    } catch (err) {
      setText(body);
      onError(err instanceof Error ? err.message : 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Add a comment…"
        rows={3}
        style={{
          width: '100%',
          padding: '8px 12px',
          fontSize: 13,
          border: `1px solid ${use['border-prime']}`,
          borderRadius: 4,
          resize: 'vertical',
          boxSizing: 'border-box',
          background: use['bg-prime'],
        }}
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!text.trim() || submitting}
        style={{
          marginTop: 4,
          padding: '6px 14px',
          fontSize: 13,
          background: chartRainbow['blue-100'],
          color: chartNeutral['0'],
          border: 'none',
          borderRadius: 4,
          cursor: !text.trim() || submitting ? 'not-allowed' : 'pointer',
          opacity: !text.trim() || submitting ? 0.6 : 1,
        }}
      >
        {submitting ? 'Posting…' : 'Add comment'}
      </button>
    </div>
  );
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────

function Breadcrumb({
  project,
  issueKey,
  onGoToProjects,
  onGoToIssues,
}: {
  project: JiraProject | null;
  issueKey: string | null;
  onGoToProjects: () => void;
  onGoToIssues: () => void;
}) {
  if (!project) return null;
  return (
    <div style={{ fontSize: 13, color: chartNeutral['6'], marginBottom: 12 }}>
      <button
        type="button"
        onClick={onGoToProjects}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
      >
        Projects
      </button>
      {' > '}
      <button
        type="button"
        onClick={onGoToIssues}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
      >
        {project.name}
      </button>
      {issueKey && <>{' > '}<span>{issueKey}</span></>}
    </div>
  );
}

// ── Navigation actions ────────────────────────────────────────────────────────

interface JiraNavActionsProps {
  onRefresh: () => void;
  onResetConnection: () => void;
}

function JiraNavActions({ onRefresh, onResetConnection }: JiraNavActionsProps) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <Button
        variant="ghost"
        size="medium"
        startIcon="refresh"
        onClick={onRefresh}
        title="Refresh"
      >
        Refresh
      </Button>
      <Button
        variant="ghost"
        size="medium"
        startIcon="link_off"
        onClick={onResetConnection}
        title="Reset Jira connection"
      >
        Reset Jira connection
      </Button>
    </div>
  );
}

// ── Error boundary ────────────────────────────────────────────────────────────

export class JiraLensErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Jira Lens] React error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, maxWidth: 500 }}>
          <ErrorBox message={this.state.error.message} />
          <pre style={{ fontSize: 11, overflow: 'auto', marginTop: 12 }}>
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Root ──────────────────────────────────────────────────────────────────────

export const Content: React.FC = () => {
  const [step, setStep] = useState<0 | 1 | 2>(initialStep as 0 | 1 | 2);
  const [progress, setProgress] = useState<ConnectProgressMessage | null>(null);

  const [selectedProject, setSelectedProject] = useState<JiraProject | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<JiraIssueSummary | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    return onPush(msg => {
      if (msg.type === 'CONNECT_PROGRESS') {
        setProgress(msg);
        if (msg.stage === 'done') {
          setTimeout(() => setStep(2), 600);
        }
      }
    });
  }, []);

  const handleCredentialsSaved = () => {
    setProgress(null);
    setStep(1);
  };

  const handleRetryCredentials = () => {
    setProgress(null);
    setStep(0);
  };

  const handleRefresh = useCallback(() => {
    setSelectedProject(null);
    setSelectedIssue(null);
    setRefreshKey(k => k + 1);
  }, []);

  const handleResetConnection = useCallback(async () => {
    await resetCredentials();
    setSelectedProject(null);
    setSelectedIssue(null);
    setProgress(null);
    setRefreshKey(0);
    setStep(0);
  }, []);

  return (
    <BasicLayout
      navigation={{
        start: [
          <span
            key="title"
            style={{ fontWeight: 600, fontSize: 15 }}
          >
            Jira Lens
          </span>,
        ],
        end: [
          <JiraNavActions
            key="nav-actions"
            onRefresh={handleRefresh}
            onResetConnection={handleResetConnection}
          />,
        ],
      }}
    >
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 1rem' }}>

        {step < 2 && (
          <p style={{ color: chartNeutral['6'], fontSize: 14, marginBottom: 24 }}>
            {step === 0 && 'Step 1 of 2 — Connect to Jira'}
            {step === 1 && 'Step 2 of 2 — Connecting…'}
          </p>
        )}

        {step === 0 && (
          <StepCredentials onSaved={handleCredentialsSaved} />
        )}

        {step === 1 && (
          <StepConnecting progress={progress} onRetry={handleRetryCredentials} />
        )}

        {step === 2 && (
          <div key={refreshKey}>
            <Breadcrumb
              project={selectedProject}
              issueKey={selectedIssue?.key ?? null}
              onGoToProjects={() => { setSelectedProject(null); setSelectedIssue(null); }}
              onGoToIssues={() => setSelectedIssue(null)}
            />

            {selectedProject === null ? (
              <ProjectList onSelect={setSelectedProject} />
            ) : selectedIssue ? (
              <IssueDetail issueKey={selectedIssue.key} onBack={() => setSelectedIssue(null)} />
            ) : (
              <IssueList
                project={selectedProject}
                onBack={() => setSelectedProject(null)}
                onSelectIssue={setSelectedIssue}
              />
            )}
          </div>
        )}

      </div>
    </BasicLayout>
  );
};
