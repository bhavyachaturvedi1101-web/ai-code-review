import { useState, useCallback } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { oneDark } from '@codemirror/theme-one-dark'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'
import { rust } from '@codemirror/lang-rust'
import { go } from '@codemirror/lang-go'
import { sql } from '@codemirror/lang-sql'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { StateEffect, StateField } from '@codemirror/state'
import { Decoration, EditorView } from '@codemirror/view'
import './App.css'

const LANGUAGES = [
  { value: 'auto',       label: 'Auto-detect', ext: () => javascript() },
  { value: 'javascript', label: 'JavaScript',  ext: () => javascript() },
  { value: 'typescript', label: 'TypeScript',  ext: () => javascript({ typescript: true }) },
  { value: 'python',     label: 'Python',      ext: () => python() },
  { value: 'java',       label: 'Java',        ext: () => java() },
  { value: 'cpp',        label: 'C++',         ext: () => cpp() },
  { value: 'rust',       label: 'Rust',        ext: () => rust() },
  { value: 'go',         label: 'Go',          ext: () => go() },
  { value: 'sql',        label: 'SQL',         ext: () => sql() },
  { value: 'html',       label: 'HTML',        ext: () => html() },
  { value: 'css',        label: 'CSS',         ext: () => css() },
]

// Line highlight extension
const highlightLineEffect = StateEffect.define()
const clearHighlightEffect = StateEffect.define()

const highlightField = StateField.define({
  create() { return Decoration.none },
  update(deco, tr) {
    for (let e of tr.effects) {
      if (e.is(clearHighlightEffect)) return Decoration.none
      if (e.is(highlightLineEffect)) {
        const line = e.value
        try {
          const lineObj = tr.state.doc.line(line)
          return Decoration.set([
            Decoration.line({ class: 'cm-highlighted-line' }).range(lineObj.from)
          ])
        } catch { return Decoration.none }
      }
    }
    return deco.map(tr.changes)
  },
  provide: f => EditorView.decorations.from(f)
})

const FOCUS_AREAS = [
  { value: '',              label: 'All issues' },
  { value: 'security',     label: 'Security' },
  { value: 'performance',  label: 'Performance' },
  { value: 'bugs',         label: 'Bugs' },
  { value: 'style',        label: 'Code style' },
]

const SEVERITY_ICON = { error: '🔴', warning: '🟡', info: '🔵' }

function ScoreCircle({ score }) {
  const cls = score >= 75 ? 'good' : score >= 50 ? 'ok' : 'bad'
  return <div className={`score-circle ${cls}`}>{score}</div>
}

export default function App() {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('auto')
  const [focusArea, setFocusArea] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [output, setOutput] = useState(null)
  const [running, setRunning] = useState(false)
  const [editorView, setEditorView] = useState(null)

  const langExt = LANGUAGES.find(l => l.value === language)?.ext() ?? javascript()

  const highlightLine = useCallback((lineNum) => {
    if (!editorView || lineNum <= 0) return
    editorView.dispatch({ effects: [highlightLineEffect.of(lineNum)] })
    // Scroll to line
    try {
      const line = editorView.state.doc.line(lineNum)
      editorView.dispatch({ effects: EditorView.scrollIntoView(line.from, { y: 'center' }) })
    } catch {}
  }, [editorView])

  const clearHighlight = useCallback(() => {
    if (editorView) editorView.dispatch({ effects: [clearHighlightEffect.of(null)] })
  }, [editorView])

  const API = import.meta.env.VITE_API_URL || 'http://localhost:8080'

  async function handleRun() {
    if (!code.trim()) return
    setRunning(true)
    setOutput(null)
    try {
      const res = await fetch(`${API}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      })
      const data = await res.json()
      setOutput(data.output ?? data.error)
    } catch (e) {
      setOutput('Failed to run: ' + e.message)
    } finally {
      setRunning(false)
    }
  }

  async function handleReview() {
    if (!code.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`${API}/api/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, focusArea }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Review failed')
      }
      setResult(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <span className="header-logo">🤖</span>
        <h1>AI Code Review</h1>
        <span>Powered by GPT-4o</span>
      </header>

      <main className="main">
        {/* Left: editor */}
        <div className="left-panel">
          <div className="panel-header">
            <span className="panel-title">Your Code</span>
            <div className="controls">
              <select value={language} onChange={e => setLanguage(e.target.value)}>
                {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              <select value={focusArea} onChange={e => setFocusArea(e.target.value)}>
                {FOCUS_AREAS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
              <button className="btn-run" onClick={handleRun} disabled={running || !code.trim()}>
                {running ? '⏳' : '▶ Run'}
              </button>
              <button className="btn-review" onClick={handleReview} disabled={loading || !code.trim()}>
                {loading ? '⏳ Reviewing…' : '▶ Review'}
              </button>
            </div>
          </div>
          <div className="editor-wrap">
            <CodeMirror
              value={code}
              height="100%"
              theme={oneDark}
              extensions={[langExt, highlightField]}
              onChange={setCode}
              onCreateEditor={(view) => setEditorView(view)}
              placeholder="Paste your code here…"
              basicSetup={{ lineNumbers: true, foldGutter: true }}
            />
          </div>
          {(output !== null || running) && (
            <div className="output-panel">
              <div className="output-header">▶ Output</div>
              <pre className="output-content">
                {running ? 'Running…' : output}
              </pre>
            </div>
          )}
        </div>

        {/* Right: results */}
        <div className="right-panel">
          <div className="panel-header">
            <span className="panel-title">Review Results</span>
            {result && <span style={{ fontSize: 12, color: '#6b7280' }}>{result.issues.length} issue{result.issues.length !== 1 ? 's' : ''} found</span>}
          </div>
          <div className="results-area">
            {!loading && !result && !error && (
              <div className="empty-state">
                <div className="icon">🔍</div>
                <p>Paste your code and click Review</p>
              </div>
            )}

            {loading && (
              <div className="loading">
                <div className="spinner" />
                <p>Analyzing your code…</p>
              </div>
            )}

            {error && <div className="error-banner">⚠️ {error}</div>}

            {result && (
              <>
                {/* Score */}
                <div className="score-card">
                  <ScoreCircle score={result.score} />
                  <div className="score-info">
                    <h3>Code Quality Score</h3>
                    <p>{result.summary}</p>
                  </div>
                </div>

                {/* Issues */}
                {result.issues.length > 0 && (
                  <>
                    <div className="section-title">Issues</div>
                    <div className="issue-list">
                      {result.issues.map((issue, i) => (
                        <div
                          key={i}
                          className={`issue ${issue.severity}`}
                          onClick={() => issue.line > 0 ? highlightLine(issue.line) : clearHighlight()}
                          style={{ cursor: issue.line > 0 ? 'pointer' : 'default' }}
                          title={issue.line > 0 ? `Click to jump to line ${issue.line}` : ''}
                        >
                          <span className="issue-icon">{SEVERITY_ICON[issue.severity] ?? '⚪'}</span>
                          <div className="issue-body">
                            <div className="issue-meta">
                              <span className={`badge ${issue.severity}`}>{issue.severity}</span>
                              <span className="badge cat">{issue.category}</span>
                              {issue.line > 0 && <span className="badge line">line {issue.line}</span>}
                            </div>
                            <p className="issue-msg">{issue.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Improved code */}
                {result.improvedCode && (
                  <>
                    <div className="section-title">Improved Code</div>
                    <div className="code-block">
                      <pre>{result.improvedCode}</pre>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
