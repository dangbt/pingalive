import './index.css'
import { useState, useEffect, useCallback } from 'react'
import {
  ThemeProvider,
  useTheme,
  Button,
  Badge,
  Alert,
  Card,
  Statistic,
  Popover,
  ColorSwatchPicker,
  toast,
  ToastProvider,
  Input,
  NumberField,
  Spinner,
} from '@dangbt/pro-ui'
import { Activity, Plus, Trash2, RefreshCw, Globe, Server, Palette } from 'lucide-react'

const API = import.meta.env.VITE_API_URL ?? 'https://pingalive.buitandang96.workers.dev'

interface Monitor {
  id: string
  url: string
  interval_minutes: number
  last_ping?: string
  ping_count?: number
}

interface GlobalStats {
  count: number
  totalPings: number
}

// ── EKG line ──────────────────────────────────────────────────────────────────
function EkgLine() {
  return (
    <svg viewBox="0 0 200 50" className="w-48 h-10 text-primary opacity-80" aria-hidden>
      <polyline
        points="0,25 25,25 35,8 45,42 55,15 65,35 75,25 100,25 112,4 124,46 136,25 160,25 170,12 180,38 190,25 200,25"
        fill="none" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
      >
        <animate attributeName="stroke-dasharray" values="0,600;600,0;0,600" dur="2.4s" repeatCount="indefinite" />
      </polyline>
    </svg>
  )
}

// ── Theme island ──────────────────────────────────────────────────────────────
const ACCENT_PRESETS = [
  '#4ade80', // green (PingAlive default)
  '#6366f1', // indigo
  '#3b82f6', // blue
  '#06b6d4', // cyan
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#8b5cf6', // violet
]

const RADIUS_PRESETS = [
  { label: 'None', value: '0px' },
  { label: 'SM',   value: '4px' },
  { label: 'MD',   value: '8px' },
  { label: 'LG',   value: '14px' },
]

function ThemeIsland() {
  const { theme, setTheme } = useTheme()

  const [primary, setPrimary] = useState(() =>
    localStorage.getItem('pa-primary') ?? '#4ade80'
  )
  const [radius, setRadius] = useState(() =>
    localStorage.getItem('pa-radius') ?? '8px'
  )

  // Apply saved values on mount
  useEffect(() => {
    document.documentElement.style.setProperty('--primary', primary)
    document.documentElement.style.setProperty('--base-radius', radius)
  }, [])

  function applyPrimary(hex: string) {
    document.documentElement.style.setProperty('--primary', hex)
    localStorage.setItem('pa-primary', hex)
    setPrimary(hex)
  }

  function applyRadius(val: string) {
    document.documentElement.style.setProperty('--base-radius', val)
    localStorage.setItem('pa-radius', val)
    setRadius(val)
  }

  return (
    <Popover
      placement="bottom end"
      triggerElement={
        <Button
          variant="ghost"
          size="sm"
          icon={<Palette size={18} />}
          aria-label="Customize theme"
        />
      }
    >
      <div className="p-4 w-52 space-y-4">

        {/* Mode */}
        <div>
          <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-2">Mode</p>
          <div className="grid grid-cols-3 gap-1">
            {(['light', 'system', 'dark'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`py-1.5 rounded text-xs font-medium capitalize transition-colors ${
                  theme === t
                    ? 'bg-primary text-white'
                    : 'bg-surface-subtle text-fg-2 hover:bg-surface-raised'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Accent color */}
        <div>
          <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-2">Accent</p>
          <ColorSwatchPicker
            value={primary}
            onChange={(c: any) => applyPrimary(c.toString('hex'))}
            colors={ACCENT_PRESETS}
            swatchSize="md"
          />
        </div>

        {/* Radius */}
        <div>
          <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-2">Radius</p>
          <div className="grid grid-cols-4 gap-1">
            {RADIUS_PRESETS.map(r => (
              <button
                key={r.value}
                onClick={() => applyRadius(r.value)}
                className={`py-1.5 rounded text-xs font-medium transition-colors ${
                  radius === r.value
                    ? 'bg-primary text-white'
                    : 'bg-surface-subtle text-fg-2 hover:bg-surface-raised'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </Popover>
  )
}

// ── Navbar (shared) ───────────────────────────────────────────────────────────
function Navbar({ right }: { right?: React.ReactNode }) {
  return (
    <nav className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-surface border-b border-border">
      <div className="flex items-center gap-2">
        <Activity size={20} className="text-primary" />
        <span className="font-bold text-base tracking-tight text-fg">PingAlive</span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeIsland />
        {right}
      </div>
    </nav>
  )
}

// ── Landing ───────────────────────────────────────────────────────────────────
function Landing({ onStart }: { onStart: (u: string) => void }) {
  const [username, setUsername] = useState('')
  const [url, setUrl] = useState('')
  const [interval, setInterval] = useState(5)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<GlobalStats | null>(null)

  useEffect(() => {
    fetch(`${API}/api/stats`).then(r => r.json()).then(setStats).catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const u = username.trim().toLowerCase()
    if (!u) return

    if (url.trim()) {
      setLoading(true)
      try {
        const res = await fetch(`${API}/api/monitors`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: u, url: url.trim(), interval }),
        })
        if (!res.ok) throw new Error(await res.text())
        toast.success('Monitor added!')
      } catch (err: any) {
        toast.error(err.message || 'Failed to add monitor')
        setLoading(false)
        return
      }
      setLoading(false)
    }

    localStorage.setItem('pingalive_user', u)
    onStart(u)
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        {/* EKG + headline */}
        <EkgLine />
        <h1 className="mt-6 text-4xl sm:text-5xl font-bold text-fg leading-tight">
          Keep your servers<br />
          <span className="text-primary">alive &amp; monitored</span>
        </h1>
        <p className="mt-4 text-fg-2 max-w-sm">
          Free uptime pings for Render, Railway, Fly.io free tiers.<br />
          No email. No password.
        </p>

        {/* Stats */}
        {stats && (
          <div className="mt-8 flex items-center gap-10">
            <div>
              <div className="text-4xl font-bold text-primary tabular-nums">{stats.count}</div>
              <div className="text-xs text-fg-muted uppercase tracking-widest mt-1">Monitors</div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div>
              <div className="text-4xl font-bold text-primary tabular-nums">
                {stats.totalPings.toLocaleString()}
              </div>
              <div className="text-xs text-fg-muted uppercase tracking-widest mt-1">Pings sent</div>
            </div>
          </div>
        )}

        {/* Form card */}
        <div className="mt-10 w-full max-w-sm">
          <Card shadow>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Username"
                value={username}
                onChange={setUsername}
                placeholder="e.g. dangbt"
                description="No sign-up — just pick a name."
                autoFocus
              />
              <Input
                label="URL to monitor (optional)"
                value={url}
                onChange={setUrl}
                placeholder="https://your-server.com"
                type="url"
              />
              <div className="space-y-1">
                <NumberField
                  label="Ping interval (minutes)"
                  value={interval}
                  onChange={v => setInterval(Number.isNaN(v) ? 5 : v)}
                  minValue={1}
                  maxValue={60}
                />
                <p className="text-xs text-fg-muted">Render free tier needs ≤ 14 min to stay awake</p>
              </div>
              <Button type="submit" className="w-full" isDisabled={loading || !username.trim()}>
                {loading && <Spinner size="sm" />}
                {url.trim() ? 'Add monitor & open dashboard' : 'Open dashboard →'}
              </Button>
            </form>
          </Card>
        </div>
      </main>

      {/* How it works */}
      <section className="bg-surface-subtle border-t border-border px-6 py-12">
        <h2 className="text-xl font-bold text-center text-fg mb-8">How it works</h2>
        <div className="max-w-2xl mx-auto grid sm:grid-cols-3 gap-6 text-center">
          {([
            { n: '1', title: 'Enter username', body: 'No sign-up. Pick any name.' },
            { n: '2', title: 'Add a URL',      body: 'Paste your server URL and pick an interval.' },
            { n: '3', title: 'Stay online',    body: 'We ping it on schedule. Free-tier sleep prevented.' },
          ] as const).map(s => (
            <div key={s.n} className="space-y-2">
              <div className="w-9 h-9 rounded-full bg-primary-100 text-primary font-bold text-sm flex items-center justify-center mx-auto">
                {s.n}
              </div>
              <div className="font-semibold text-fg text-sm">{s.title}</div>
              <div className="text-xs text-fg-muted">{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border px-6 py-4 text-center text-xs text-fg-muted">
        Built with{' '}
        <a href="https://pro-ui.pages.dev" className="text-primary hover:underline" target="_blank" rel="noreferrer">pro-ui</a>
        {' · '}
        <a href="https://github.com/dangbt/server-keep-alive" className="hover:text-fg-2" target="_blank" rel="noreferrer">GitHub</a>
        {' · Free forever'}
      </footer>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ username, onLogout }: { username: string; onLogout: () => void }) {
  const [monitors, setMonitors] = useState<Monitor[]>([])
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [newInterval, setNewInterval] = useState(5)
  const [adding, setAdding] = useState(false)

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const [mRes, sRes] = await Promise.all([
        fetch(`${API}/api/monitors?username=${encodeURIComponent(username)}`),
        fetch(`${API}/api/stats`),
      ])
      if (!mRes.ok) throw new Error('fetch failed')
      const { monitors: data }: { monitors: Monitor[] } = await mRes.json()
      setMonitors(data)
      if (sRes.ok) setGlobalStats(await sRes.json())
    } catch {
      if (!silent) toast.error('Could not load monitors')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [username])

  useEffect(() => {
    fetchAll()
    const id = setInterval(() => fetchAll(true), 30_000)
    return () => clearInterval(id)
  }, [fetchAll])

  async function addMonitor(e: React.FormEvent) {
    e.preventDefault()
    if (!newUrl.trim()) return
    setAdding(true)
    try {
      const res = await fetch(`${API}/api/monitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, url: newUrl.trim(), interval: newInterval }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Monitor added!')
      setNewUrl('')
      setNewInterval(5)
      fetchAll(true)
    } catch (err: any) {
      toast.error(err.message || 'Failed to add')
    } finally {
      setAdding(false)
    }
  }

  async function deleteMonitor(id: string) {
    try {
      await fetch(`${API}/api/monitors/${encodeURIComponent(id)}?username=${encodeURIComponent(username)}`, { method: 'DELETE' })
      toast.success('Removed')
      fetchAll(true)
    } catch {
      toast.error('Could not remove')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Navbar
        right={
          <div className="flex items-center gap-2">
            <span className="text-sm text-fg-muted hidden sm:inline">{username}</span>
            <Button variant="secondary" size="sm" onPress={onLogout}>Sign out</Button>
          </div>
        }
      />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-5">

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <Statistic
                title="My monitors"
                value={monitors.length}
                prefix={<Server size={14} className="text-fg-muted" />}
              />
            </Card>
            <Card>
              <Statistic title="Total monitors" value={globalStats?.count ?? '—'} />
            </Card>
            <Card>
              <Statistic title="Total pings" value={globalStats?.totalPings?.toLocaleString() ?? '—'} />
            </Card>
          </div>
        )}

        {/* Alert */}
        {!loading && monitors.length > 0 && (
          <Alert variant="success" title="Monitors active">
            {monitors.length} endpoint{monitors.length > 1 ? 's' : ''} being pinged on schedule.
          </Alert>
        )}

        {/* Add monitor */}
        <Card title="Add monitor">
          <form onSubmit={addMonitor} className="flex gap-3 flex-col sm:flex-row">
            <Input
              value={newUrl}
              onChange={setNewUrl}
              placeholder="https://your-server.com"
              type="url"
              aria-label="URL"
              className="flex-1"
            />
            <NumberField
              aria-label="Interval (minutes)"
              value={newInterval}
              onChange={v => setNewInterval(Number.isNaN(v) ? 5 : v)}
              minValue={1}
              maxValue={60}
              className="sm:w-28"
            />
            <Button type="submit" isDisabled={adding || !newUrl.trim()}>
              {adding ? <Spinner size="sm" /> : <Plus size={15} />}
              Add
            </Button>
          </form>
        </Card>

        {/* Monitors list */}
        <Card
          title={
            <span className="flex items-center gap-2">
              <Globe size={15} className="text-primary" />
              Monitors
              {monitors.length > 0 && (
                <Badge color="default">{monitors.length}</Badge>
              )}
            </span>
          }
          extra={
            <button
              onClick={() => fetchAll(true)}
              disabled={refreshing}
              className="p-1.5 rounded text-fg-muted hover:text-fg hover:bg-surface-subtle transition-colors disabled:opacity-40"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
          }
          padding={false}
        >
          {loading ? (
            <div className="flex justify-center py-14"><Spinner /></div>
          ) : monitors.length === 0 ? (
            <div className="flex flex-col items-center py-14 text-fg-muted gap-2">
              <Activity size={28} className="opacity-30" />
              <p className="text-sm">No monitors yet — add one above.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {monitors.map(m => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-subtle transition-colors group"
                >
                  <Activity size={14} className="text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-fg truncate">{m.url}</p>
                    {m.last_ping && (
                      <p className="text-xs text-fg-muted mt-0.5">
                        {new Date(m.last_ping).toLocaleString()}
                        {m.ping_count != null && ` · ${m.ping_count.toLocaleString()} pings`}
                      </p>
                    )}
                  </div>
                  <Badge color="info">{m.interval_minutes}m</Badge>
                  <button
                    onClick={() => deleteMonitor(m.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-fg-muted hover:text-danger hover:bg-danger-50 transition-all"
                    aria-label="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

      </main>

      <footer className="border-t border-border px-6 py-4 text-center text-xs text-fg-muted">
        PingAlive · Free forever ·{' '}
        <a href="https://pro-ui.pages.dev" className="text-primary hover:underline" target="_blank" rel="noreferrer">pro-ui</a>
      </footer>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [username, setUsername] = useState<string | null>(
    () => localStorage.getItem('pingalive_user')
  )

  return (
    <ThemeProvider defaultTheme="dark">
      <ToastProvider />
      {username
        ? <Dashboard username={username} onLogout={() => { localStorage.removeItem('pingalive_user'); setUsername(null) }} />
        : <Landing onStart={u => setUsername(u)} />
      }
    </ThemeProvider>
  )
}
