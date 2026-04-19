import { useEffect, useState } from 'react'

const FALLBACK_THEMES = [
  {
    id: 'fraud-detection',
    label: 'Fraud detection',
    description:
      'Academic work on fraud detection, anomaly detection, XGBoost, and graph-based models.',
    terms: [
      'fraud detection',
      'credit card fraud',
      'xgboost fraud',
      'chargeback',
      'payment fraud',
      'payment service provider',
      'payment processing fraud',
      'graph machine learning fraud',
    ],
    defaultDays: 7,
  },
]

const FALLBACK_CONFIG = {
  service: 'crossref-academic-news-poc',
  defaultTheme: 'fraud-detection',
  themes: FALLBACK_THEMES,
  endpoints: {
    news: '/news',
  },
}

function getApiBaseUrl() {
  if (import.meta.env.DEV) {
    return '/api'
  }

  return import.meta.env.VITE_API_BASE_URL?.trim() || ''
}

function joinUrl(base, path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (!base) {
    return normalizedPath
  }

  if (/^https?:\/\//i.test(base)) {
    const normalizedBase = base.endsWith('/') ? base : `${base}/`
    return new URL(normalizedPath, normalizedBase).toString()
  }

  return `${base.replace(/\/$/, '')}${normalizedPath}`
}

function toLocalDateInput(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function createDefaultWindow(days = 7) {
  const to = new Date()
  const from = new Date(to)
  from.setDate(to.getDate() - (days - 1))
  return {
    from: toLocalDateInput(from),
    to: toLocalDateInput(to),
  }
}

function parseTerms(value) {
  return value
    .split(/[\n,;]+/)
    .map((term) => term.trim())
    .filter(Boolean)
}

function formatAuthors(authors) {
  if (!Array.isArray(authors) || authors.length === 0) {
    return 'Unknown authors'
  }

  if (authors.length <= 3) {
    return authors.join(', ')
  }

  return `${authors.slice(0, 3).join(', ')} +${authors.length - 3}`
}

function formatPublishedDate(value) {
  if (!value || value === 'unknown date') {
    return 'Unknown date'
  }

  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
  }).format(parsed)
}

function App() {
  const apiBaseUrl = getApiBaseUrl()
  const [config, setConfig] = useState(FALLBACK_CONFIG)
  const [selectedTheme, setSelectedTheme] = useState(FALLBACK_CONFIG.defaultTheme)
  const [extraTerms, setExtraTerms] = useState('')
  const [fromDate, setFromDate] = useState(() => createDefaultWindow(7).from)
  const [toDate, setToDate] = useState(() => createDefaultWindow(7).to)
  const [articles, setArticles] = useState([])
  const [windowInfo, setWindowInfo] = useState(createDefaultWindow(7))
  const [queryInfo, setQueryInfo] = useState(null)
  const [backendNote, setBackendNote] = useState('Loading live Crossref news...')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchRequestId, setSearchRequestId] = useState(1)

  const themes = config.themes?.length > 0 ? config.themes : FALLBACK_THEMES
  const activeTheme =
    themes.find((theme) => theme.id === selectedTheme) || themes[0] || FALLBACK_THEMES[0]

  useEffect(() => {
    let alive = true

    async function loadConfig() {
      if (!apiBaseUrl && !import.meta.env.DEV) {
        if (alive) {
          setBackendNote((current) =>
            current === 'Loading live Crossref news...'
              ? 'Set VITE_API_BASE_URL before building for GitHub Pages.'
              : current,
          )
        }
        return
      }

      try {
        const response = await fetch(joinUrl(apiBaseUrl, '/'))
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        if (!alive) {
          return
        }

        const normalizedThemes = Array.isArray(data.themes) && data.themes.length > 0 ? data.themes : FALLBACK_THEMES

        setConfig({
          ...FALLBACK_CONFIG,
          ...data,
          themes: normalizedThemes,
        })
        setSelectedTheme((currentTheme) =>
          normalizedThemes.some((theme) => theme.id === currentTheme)
            ? currentTheme
            : data.defaultTheme || normalizedThemes[0].id,
        )
        setBackendNote((current) =>
          current === 'Loading live Crossref news...'
            ? `Connected to ${data.service || FALLBACK_CONFIG.service}.`
            : current,
        )
      } catch {
        if (!alive) {
          return
        }

        setConfig(FALLBACK_CONFIG)
        setBackendNote((current) =>
          current === 'Loading live Crossref news...'
            ? 'Using the built-in fraud-detection preset until the backend responds.'
            : current,
        )
      }
    }

    void loadConfig()

    return () => {
      alive = false
    }
  }, [apiBaseUrl])

  useEffect(() => {
    let alive = true

    async function loadNews() {
      if (!apiBaseUrl && !import.meta.env.DEV) {
        setLoading(false)
        setError('Set VITE_API_BASE_URL before building for GitHub Pages.')
        return
      }

      setLoading(true)
      setError('')

      const selectedFromDate = fromDate.trim()
      const selectedToDate = toDate.trim()
      if ((selectedFromDate && !selectedToDate) || (!selectedFromDate && selectedToDate)) {
        setLoading(false)
        setError('Pick both dates for a custom range, or leave both blank to use the default window.')
        return
      }

      const params = new URLSearchParams()
      params.set('theme', activeTheme?.id || FALLBACK_CONFIG.defaultTheme)

      if (selectedFromDate && selectedToDate) {
        params.set('from', selectedFromDate)
        params.set('to', selectedToDate)
      } else {
        params.set('days', String(activeTheme?.defaultDays || 7))
      }

      for (const term of parseTerms(extraTerms)) {
        params.append('term', term)
      }

      try {
        const response = await fetch(joinUrl(apiBaseUrl, `/news?${params.toString()}`))
        const data = await response.json()

        if (!alive) {
          return
        }

        if (!response.ok) {
          throw new Error(data?.error || `HTTP ${response.status}`)
        }

        setArticles(Array.isArray(data.results) ? data.results : [])
        setWindowInfo(data.window || createDefaultWindow(7))
        setQueryInfo({
          theme: data.theme || activeTheme,
          terms: data.terms || [],
          count: data.count ?? 0,
          rawCount: data.rawCount ?? 0,
        })
        setBackendNote(`Showing ${data.count ?? 0} deduplicated results from ${data.source || 'Crossref'}.`)
      } catch (fetchError) {
        if (!alive) {
          return
        }

        setArticles([])
        setQueryInfo(null)
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load news')
        setBackendNote('The Worker API is reachable, but this query did not complete.')
      } finally {
        if (alive) {
          setLoading(false)
        }
      }
    }

    void loadNews()

    return () => {
      alive = false
    }
  }, [apiBaseUrl, searchRequestId])

  const themeOptions = themes.map((theme) => ({
    ...theme,
    label: theme.label || theme.id,
  }))

  const handleReset = () => {
    const defaults = createDefaultWindow(activeTheme?.defaultDays || 7)
    setSelectedTheme(config.defaultTheme || FALLBACK_CONFIG.defaultTheme)
    setExtraTerms('')
    setFromDate(defaults.from)
    setToDate(defaults.to)
    setSearchRequestId((value) => value + 1)
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#07111f] text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.24),_transparent_55%),radial-gradient(circle_at_75%_15%,_rgba(99,102,241,0.18),_transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(7,17,31,1))]" />
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-sky-300/80">
              Crossref News
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Academic news on fraud detection, surfaced as a live briefing.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Search recent Crossref metadata for fraud detection, XGBoost, graph
              models, and adjacent academic work. The current release is built to
              grow into more themes later without reworking the interface.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 shadow-xl shadow-slate-950/20 backdrop-blur">
            <div className="flex items-center justify-between gap-6">
              <span>Backend</span>
              <span className="font-medium text-sky-200">Worker + gh-pages</span>
            </div>
            <div className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-500">
              {config.service || FALLBACK_CONFIG.service}
            </div>
          </div>
        </header>

        <section className="grid gap-5 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/25 backdrop-blur">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-sky-100">
                Live Crossref briefing
              </span>
              <span className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs text-slate-300">
                {loading ? 'Refreshing now' : 'Ready'}
              </span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-500">
                  Active theme
                </div>
                <div className="mt-2 text-lg font-semibold text-white">{activeTheme.label}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-500">
                  Window
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {windowInfo.from} to {windowInfo.to}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-500">
                  Terms
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {queryInfo?.terms?.length || activeTheme.terms.length} search terms
                </div>
              </div>
            </div>

            <p className="mt-5 text-sm leading-6 text-slate-300">{backendNote}</p>
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/25 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Current theme config</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Ready for additional categories later.
                </p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-full border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-300 transition hover:border-sky-400/30 hover:text-white"
              >
                Reset
              </button>
            </div>

            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <div className="rounded-2xl bg-slate-950/60 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Label</div>
                <div className="mt-1 font-medium text-white">{activeTheme.label}</div>
              </div>
              <div className="rounded-2xl bg-slate-950/60 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Description</div>
                <div className="mt-1 leading-6">{activeTheme.description}</div>
              </div>
              <div className="rounded-2xl bg-slate-950/60 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Default terms</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {activeTheme.terms.map((term) => (
                    <span
                      key={term}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-slate-950/20 backdrop-blur sm:p-6">
          <form
            className="grid gap-4 lg:grid-cols-[1.2fr_1.1fr_0.8fr_0.8fr_auto]"
            onSubmit={(event) => {
              event.preventDefault()
              setSearchRequestId((value) => value + 1)
            }}
          >
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.25em] text-slate-500">Theme</span>
              <select
                value={selectedTheme}
                onChange={(event) => setSelectedTheme(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/40"
              >
                {themeOptions.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Extra query terms
              </span>
              <input
                value={extraTerms}
                onChange={(event) => setExtraTerms(event.target.value)}
                placeholder="fraud graph, XGBoost, chargeback"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-400/40"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.25em] text-slate-500">From</span>
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/40"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.25em] text-slate-500">To</span>
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/40"
              />
            </label>

            <div className="flex items-end gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-sky-400 px-4 py-3 font-medium text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:bg-sky-400/60"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-400">
            <span className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1">
              Theme-driven defaults
            </span>
            <span className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1">
              Custom date range
            </span>
            <span className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1">
              Extra terms are appended to the theme preset
            </span>
          </div>
        </section>

        <section className="flex-1 py-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Latest results</h2>
              <p className="mt-1 text-sm text-slate-400">
                {queryInfo
                  ? `Found ${queryInfo.count} deduplicated records from ${queryInfo.rawCount} raw matches.`
                  : 'Run a search to populate the briefing.'}
              </p>
            </div>
            <div className="text-sm text-slate-400">
              {queryInfo?.theme?.label || activeTheme.label}
            </div>
          </div>

          {error ? (
            <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-5 text-rose-100">
              {error}
            </div>
          ) : null}

          {!loading && articles.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
              No matching items were found for this window. Try a broader term or a
              wider date range.
            </div>
          ) : null}

          {loading ? (
            <div className="grid gap-5 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-3xl border border-white/10 bg-slate-900/70 p-6"
                >
                  <div className="h-4 w-24 rounded-full bg-white/10" />
                  <div className="mt-5 h-7 w-5/6 rounded bg-white/10" />
                  <div className="mt-3 h-4 w-full rounded bg-white/10" />
                  <div className="mt-2 h-4 w-4/5 rounded bg-white/10" />
                  <div className="mt-6 h-10 w-full rounded bg-white/10" />
                </div>
              ))}
            </div>
          ) : null}

          {!loading && articles.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {articles.map((article) => (
                <article
                  key={`${article.doi || article.title}-${article.published}`}
                  className="group rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-lg shadow-slate-950/20 transition hover:-translate-y-1 hover:border-sky-400/30"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="rounded-full bg-sky-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-sky-200">
                      {article.type || 'publication'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatPublishedDate(article.published)}
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-semibold leading-tight text-white">
                    {article.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {formatAuthors(article.authors)}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(article.matchedTerms || []).slice(0, 4).map((term) => (
                      <span
                        key={term}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                      >
                        {term}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-sm text-slate-400">
                    <span>{article.venue || 'Venue unknown'}</span>
                    {article.url ? (
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-300 transition group-hover:text-sky-200"
                      >
                        Read more
                      </a>
                    ) : (
                      <span className="text-slate-500">No URL</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  )
}

export default App
