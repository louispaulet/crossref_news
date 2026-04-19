import { useEffect, useState } from 'react'
import SiteFooter from './components/SiteFooter'

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
  {
    id: 'credit-card-fraud',
    label: 'Credit card fraud',
    description: 'Academic work on credit card fraud detection, transactions, and payment abuse.',
    terms: ['credit card fraud'],
    defaultDays: 7,
  },
  {
    id: 'xgboost-fraud',
    label: 'XGBoost fraud',
    description: 'Academic work on fraud detection methods using XGBoost and related models.',
    terms: ['xgboost fraud'],
    defaultDays: 7,
  },
  {
    id: 'chargeback',
    label: 'Chargeback',
    description: 'Academic work on chargeback disputes, reversal processes, and payment operations.',
    terms: ['chargeback'],
    defaultDays: 7,
  },
  {
    id: 'payment-fraud',
    label: 'Payment fraud',
    description: 'Academic work on payment fraud, fraud controls, and transaction risk.',
    terms: ['payment fraud'],
    defaultDays: 7,
  },
  {
    id: 'payment-service-provider',
    label: 'Payment service provider',
    description: 'Academic work on payment service providers, fraud controls, and related operations.',
    terms: ['payment service provider'],
    defaultDays: 7,
  },
  {
    id: 'payment-processing-fraud',
    label: 'Payment processing fraud',
    description: 'Academic work on payment processing fraud and transaction monitoring.',
    terms: ['payment processing fraud'],
    defaultDays: 7,
  },
  {
    id: 'graph-machine-learning-fraud',
    label: 'Graph machine learning fraud',
    description: 'Academic work on graph machine learning methods for fraud detection.',
    terms: ['graph machine learning fraud'],
    defaultDays: 7,
  },
]

const FALLBACK_CONFIG = {
  service: 'Crossref News',
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

function resolveThemeId(themes, preferredThemeId) {
  if (themes.some((theme) => theme.id === preferredThemeId)) {
    return preferredThemeId
  }

  return themes[0]?.id || FALLBACK_CONFIG.defaultTheme
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

  const isoYear = /^(\d{4})$/
  const isoMonth = /^(\d{4})-(\d{2})$/
  const isoDay = /^(\d{4})-(\d{2})-(\d{2})$/

  let parsed
  if (isoDay.test(value)) {
    parsed = new Date(`${value}T00:00:00`)
  } else if (isoMonth.test(value)) {
    const [, year, month] = value.match(isoMonth)
    parsed = new Date(Number(year), Number(month) - 1, 1)
  } else if (isoYear.test(value)) {
    const [, year] = value.match(isoYear)
    parsed = new Date(Number(year), 0, 1)
  } else {
    return value
  }

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  if (isoYear.test(value)) {
    return value
  }

  if (isoMonth.test(value)) {
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      year: 'numeric',
    }).format(parsed)
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
  }).format(parsed)
}

function App() {
  const apiBaseUrl = getApiBaseUrl()
  const initialWindow = createDefaultWindow(7)
  const buttonBaseClass =
    'inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-2 font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950'
  const secondaryButtonClass =
    `${buttonBaseClass} border border-white/10 bg-slate-950/50 text-slate-300 hover:border-sky-400/30 hover:text-white focus-visible:ring-sky-300/60`
  const primaryButtonClass =
    `${buttonBaseClass} bg-sky-400 text-slate-950 hover:bg-sky-300 focus-visible:ring-sky-300/60`
  const recordButtonClass =
    `${buttonBaseClass} shrink-0 gap-2 border border-sky-400/30 bg-sky-400/10 text-sky-200 hover:border-sky-300/60 hover:bg-sky-400/20 hover:text-white focus-visible:ring-sky-300/60`
  const [config, setConfig] = useState(FALLBACK_CONFIG)
  const [selectedTheme, setSelectedTheme] = useState(FALLBACK_CONFIG.defaultTheme)
  const [extraTerms, setExtraTerms] = useState('')
  const [fromDate, setFromDate] = useState(() => initialWindow.from)
  const [toDate, setToDate] = useState(() => initialWindow.to)
  const [articles, setArticles] = useState([])
  const [windowInfo, setWindowInfo] = useState(initialWindow)
  const [queryInfo, setQueryInfo] = useState(null)
  const [backendNote, setBackendNote] = useState('Loading live Crossref briefing...')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchRequestId, setSearchRequestId] = useState(1)

  const themes = config.themes?.length > 0 ? config.themes : FALLBACK_THEMES
  const defaultThemeId = resolveThemeId(themes, config.defaultTheme)
  const themeFieldId = 'theme'
  const extraTermsFieldId = 'extra-terms'
  const fromFieldId = 'from-date'
  const toFieldId = 'to-date'
  const activeTheme =
    themes.find((theme) => theme.id === selectedTheme) ||
    themes.find((theme) => theme.id === defaultThemeId) ||
    themes[0] ||
    FALLBACK_THEMES[0]

  useEffect(() => {
    let alive = true

    async function loadConfig() {
      if (!apiBaseUrl && !import.meta.env.DEV) {
        if (alive) {
          setBackendNote((current) =>
            current === 'Loading live Crossref briefing...'
              ? 'Set `VITE_API_BASE_URL` before building for GitHub Pages.'
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

        const normalizedThemes =
          Array.isArray(data.themes) && data.themes.length > 0 ? data.themes : FALLBACK_THEMES

        setConfig({
          ...FALLBACK_CONFIG,
          ...data,
          themes: normalizedThemes,
        })
        const resolvedDefaultThemeId = resolveThemeId(
          normalizedThemes,
          data.defaultTheme || FALLBACK_CONFIG.defaultTheme,
        )

        setSelectedTheme((currentTheme) =>
          normalizedThemes.some((theme) => theme.id === currentTheme)
            ? currentTheme
            : resolvedDefaultThemeId,
        )
        setBackendNote((current) =>
          current === 'Loading live Crossref briefing...'
            ? `Connected to ${data.service || FALLBACK_CONFIG.service}.`
            : current,
        )
      } catch {
        if (!alive) {
          return
        }

        setConfig(FALLBACK_CONFIG)
        setBackendNote((current) =>
          current === 'Loading live Crossref briefing...'
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
        setError('Set `VITE_API_BASE_URL` before building for GitHub Pages.')
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
        setBackendNote(`Showing ${data.count ?? 0} deduplicated records from ${data.source || 'Crossref'}.`)
      } catch (fetchError) {
        if (!alive) {
          return
        }

        setArticles([])
        setQueryInfo(null)
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load the briefing.')
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
  }, [apiBaseUrl, activeTheme, extraTerms, fromDate, toDate, searchRequestId])

  const themeOptions = themes.map((theme) => ({
    ...theme,
    label: theme.label || theme.id,
  }))

  const handleReset = () => {
    const defaultTheme = themes.find((theme) => theme.id === defaultThemeId) || themes[0] || FALLBACK_THEMES[0]
    const defaults = createDefaultWindow(defaultTheme?.defaultDays || 7)
    setSelectedTheme(defaultTheme.id)
    setExtraTerms('')
    setFromDate(defaults.from)
    setToDate(defaults.to)
    setSearchRequestId((value) => value + 1)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111f] text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.24),_transparent_55%),radial-gradient(circle_at_75%_15%,_rgba(99,102,241,0.18),_transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(7,17,31,1))]" />
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-sky-300/80">
              Crossref News
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              A calm briefing on recent academic work about fraud detection.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Search recent Crossref metadata for fraud detection, anomaly detection,
              XGBoost, graph methods, and adjacent work. The interface stays narrow so
              the evidence stays easy to read.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 shadow-xl shadow-slate-950/20 backdrop-blur">
            <div className="flex items-center justify-between gap-6">
              <span>Delivery</span>
              <span className="font-medium text-sky-200">Worker + GitHub Pages</span>
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
                Live briefing
              </span>
              <span className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs text-slate-300">
                {loading ? 'Refreshing' : 'Ready'}
              </span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-500">
                  Theme
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
                <h2 className="text-lg font-semibold text-white">Theme profile</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Theme presets available in the dropdown.
                </p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className={secondaryButtonClass}
              >
                Reset filters
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
              <span className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Theme
              </span>
              <select
                id={themeFieldId}
                name={themeFieldId}
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
                Additional terms
              </span>
              <input
                id={extraTermsFieldId}
                name={extraTermsFieldId}
                value={extraTerms}
                onChange={(event) => setExtraTerms(event.target.value)}
                placeholder="fraud graph, XGBoost, chargeback"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-400/40"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.25em] text-slate-500">
                From
              </span>
              <input
                id={fromFieldId}
                name={fromFieldId}
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/40"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.25em] text-slate-500">
                To
              </span>
              <input
                id={toFieldId}
                name={toFieldId}
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
                className={`${primaryButtonClass} w-full rounded-2xl py-3 disabled:cursor-not-allowed disabled:bg-sky-400/60`}
              >
                {loading ? 'Updating...' : 'Update briefing'}
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-400">
            <span className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1">
              Theme defaults
            </span>
            <span className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1">
              Date range optional
            </span>
            <span className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1">
              Extra terms are appended
            </span>
          </div>
        </section>

        <section className="flex-1 py-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Latest records</h2>
              <p className="mt-1 text-sm text-slate-400">
                {queryInfo
                  ? `Found ${queryInfo.count} deduplicated records from ${queryInfo.rawCount} raw Crossref matches.`
                  : 'Run a search to load the briefing.'}
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
              No items matched this window. Try a broader term or a wider date range.
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
                  className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-lg shadow-slate-950/20"
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
                    <span>{article.venue || 'Venue not listed'}</span>
                    {article.url ? (
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noreferrer"
                        className={recordButtonClass}
                      >
                        Open record
                        <span aria-hidden="true">→</span>
                      </a>
                    ) : (
                      <span className="text-slate-500">No link available</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <SiteFooter />
      </main>
    </div>
  )
}

export default App
