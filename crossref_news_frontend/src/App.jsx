import { useEffect, useState } from 'react'
import PageOrnaments from './components/PageOrnaments'
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

const NO_THEME_OPTION = {
  id: 'none',
  label: 'No theme',
  description: 'Search only the terms you enter, without a preset theme.',
  terms: [],
  defaultDays: 7,
}

const DEFAULT_PAGE_SIZE = 10
const DEFAULT_MAX_VISIBLE = 50

const FALLBACK_CONFIG = {
  service: 'Crossref News',
  defaultTheme: 'fraud-detection',
  themes: FALLBACK_THEMES,
  endpoints: {
    news: '/news',
    execsum: '/execsum',
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

function buildSearchRequest({
  activeTheme,
  selectedTheme,
  extraTerms,
  fromDate,
  toDate,
}) {
  const selectedFromDate = fromDate.trim()
  const selectedToDate = toDate.trim()

  if ((selectedFromDate && !selectedToDate) || (!selectedFromDate && selectedToDate)) {
    return {
      error: 'Pick both dates for a custom range, or leave both blank to use the default window.',
    }
  }

  const extraSearchTerms = parseTerms(extraTerms)
  const isNoTheme = selectedTheme === NO_THEME_OPTION.id

  if (isNoTheme && extraSearchTerms.length === 0) {
    return {
      error: 'Pick at least one term when No theme is selected.',
    }
  }

  const params = new URLSearchParams()
  params.set('theme', isNoTheme ? NO_THEME_OPTION.id : activeTheme?.id || FALLBACK_CONFIG.defaultTheme)

  if (selectedFromDate && selectedToDate) {
    params.set('from', selectedFromDate)
    params.set('to', selectedToDate)
  } else {
    params.set('days', String(activeTheme?.defaultDays || NO_THEME_OPTION.defaultDays))
  }

  for (const term of extraSearchTerms) {
    params.append('term', term)
  }

  return {
    params,
    isNoTheme,
    extraSearchTerms,
  }
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
  const [summary, setSummary] = useState(null)
  const [summaryNote, setSummaryNote] = useState('Executive summary will appear after the search loads.')
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [error, setError] = useState('')
  const [summaryError, setSummaryError] = useState('')
  const [visibleCount, setVisibleCount] = useState(DEFAULT_PAGE_SIZE)
  const [newsPageSize, setNewsPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [searchRequestId, setSearchRequestId] = useState(1)

  const themes = config.themes?.length > 0 ? config.themes : FALLBACK_THEMES
  const defaultThemeId = resolveThemeId(themes, config.defaultTheme)
  const themeOptions = [NO_THEME_OPTION, ...themes.map((theme) => ({ ...theme, label: theme.label || theme.id }))]
  const activeTheme =
    themeOptions.find((theme) => theme.id === selectedTheme) ||
    themeOptions.find((theme) => theme.id === defaultThemeId) ||
    themeOptions[1] ||
    themeOptions[0]
  const isNoTheme = selectedTheme === NO_THEME_OPTION.id
  const visibleArticles = articles.slice(0, Math.min(visibleCount, DEFAULT_MAX_VISIBLE))
  const hiddenCount = Math.max(articles.length - visibleArticles.length, 0)

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
        const resolvedDefaultThemeId = resolveThemeId(
          normalizedThemes,
          data.defaultTheme || FALLBACK_CONFIG.defaultTheme,
        )

        setConfig({
          ...FALLBACK_CONFIG,
          ...data,
          themes: normalizedThemes,
          defaultTheme: resolvedDefaultThemeId,
        })

        let shouldRefetch = false
        setSelectedTheme((currentTheme) => {
          const isValidTheme = normalizedThemes.some((theme) => theme.id === currentTheme)
          if (!isValidTheme && currentTheme !== NO_THEME_OPTION.id) {
            shouldRefetch = true
          }

          return isValidTheme ? currentTheme : resolvedDefaultThemeId
        })

        setBackendNote((current) =>
          current === 'Loading live Crossref briefing...'
            ? `Connected to ${data.service || FALLBACK_CONFIG.service}.`
            : current,
        )

        if (shouldRefetch) {
          setSearchRequestId((value) => value + 1)
        }
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

      const request = buildSearchRequest({
        activeTheme,
        selectedTheme,
        extraTerms,
        fromDate,
        toDate,
      })

      if (request.error) {
        setLoading(false)
        setError(request.error)
        setArticles([])
        setQueryInfo(null)
        setVisibleCount(DEFAULT_PAGE_SIZE)
        setNewsPageSize(DEFAULT_PAGE_SIZE)
        setBackendNote(request.error)
        return
      }

      setLoading(true)
      setError('')
      setArticles([])
      setQueryInfo(null)
      setWindowInfo(null)
      setVisibleCount(DEFAULT_PAGE_SIZE)
      setNewsPageSize(DEFAULT_PAGE_SIZE)
      setBackendNote('Loading Crossref results...')

      try {
        const response = await fetch(joinUrl(apiBaseUrl, `/news?${request.params.toString()}`))
        const data = await response.json()

        if (!alive) {
          return
        }

        if (!response.ok) {
          throw new Error(data?.error || `HTTP ${response.status}`)
        }

        const results = Array.isArray(data.results) ? data.results : []
        const pageSize = Number.isFinite(data.pagination?.pageSize) ? data.pagination.pageSize : data.pageSize || DEFAULT_PAGE_SIZE
        const summaryCount = data.count ?? results.length
        const rawCount = data.rawCount ?? 0
        const cacheHit = Boolean(data.cache?.hit)
        const returnedCount = results.length

        setArticles(results)
        setWindowInfo(data.window || initialWindow)
        setNewsPageSize(pageSize)
        setVisibleCount(Math.min(pageSize, returnedCount))
        setQueryInfo({
          theme: data.theme || activeTheme,
          count: summaryCount,
          rawCount,
          returnedCount,
          pageSize,
          maxResults: data.maxResults ?? DEFAULT_MAX_RESULTS,
          searchMode: data.searchMode || (isNoTheme ? 'no-theme' : 'theme'),
          cacheHit,
        })
        setBackendNote(
          `${cacheHit ? 'Using cached search results.' : 'Loaded fresh search results.'} Showing ${Math.min(pageSize, returnedCount)} of ${returnedCount} records.`,
        )
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
  }, [apiBaseUrl, searchRequestId])

  useEffect(() => {
    let alive = true

    async function loadSummary() {
      if (!apiBaseUrl && !import.meta.env.DEV) {
        setSummaryLoading(false)
        setSummaryError('Set `VITE_API_BASE_URL` before building for GitHub Pages.')
        return
      }

      const request = buildSearchRequest({
        activeTheme,
        selectedTheme,
        extraTerms,
        fromDate,
        toDate,
      })

      if (request.error) {
        setSummaryLoading(false)
        setSummary(null)
        setSummaryError(request.error)
        setSummaryNote(request.error)
        return
      }

      setSummaryLoading(true)
      setSummaryError('')
      setSummary(null)
      setSummaryNote('Generating executive summary...')

      try {
        const response = await fetch(joinUrl(apiBaseUrl, `/execsum?${request.params.toString()}`))
        const data = await response.json()

        if (!alive) {
          return
        }

        if (!response.ok) {
          throw new Error(data?.error || `HTTP ${response.status}`)
        }

        setSummary(data)
        setSummaryNote(
          `${data.cache?.hit ? 'Using cached executive summary.' : 'Generated a fresh executive summary.'}`,
        )
      } catch (fetchError) {
        if (!alive) {
          return
        }

        setSummary(null)
        setSummaryError(fetchError instanceof Error ? fetchError.message : 'Unable to generate the executive summary.')
        setSummaryNote('Executive summary unavailable.')
      } finally {
        if (alive) {
          setSummaryLoading(false)
        }
      }
    }

    void loadSummary()

    return () => {
      alive = false
    }
  }, [apiBaseUrl, searchRequestId])

  const handleReset = () => {
    const defaultTheme = themes.find((theme) => theme.id === defaultThemeId) || themes[0] || FALLBACK_THEMES[0]
    const defaults = createDefaultWindow(defaultTheme?.defaultDays || 7)
    setSelectedTheme(defaultTheme.id)
    setExtraTerms('')
    setFromDate(defaults.from)
    setToDate(defaults.to)
    setVisibleCount(DEFAULT_PAGE_SIZE)
    setNewsPageSize(DEFAULT_PAGE_SIZE)
    setSearchRequestId((value) => value + 1)
  }

  const handleLoadMore = () => {
    setVisibleCount((current) => Math.min(current + newsPageSize, articles.length, DEFAULT_MAX_VISIBLE))
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111f] text-slate-100">
      <PageOrnaments />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.24),_transparent_55%),radial-gradient(circle_at_75%_15%,_rgba(99,102,241,0.18),_transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(7,17,31,1))]" />
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="border-b border-white/10 pb-5">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-4">
              <img
                src="/ornaments/crossref-mark.svg"
                alt=""
                className="h-11 w-11 shrink-0 rounded-2xl border border-white/10 bg-white/5 p-1.5 shadow-lg shadow-slate-950/20"
              />
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-sky-300/80">
                  Crossref News
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Crossref metadata, theme filters, and optional extra terms.
                </p>
              </div>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              A briefing on recent academic work about fraud detection.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Search recent Crossref metadata for fraud detection, anomaly detection, XGBoost,
              graph methods, and adjacent work. Source: Crossref metadata with optional theme
              filters and extra terms.
            </p>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-slate-950/20 backdrop-blur sm:p-5">
          <form
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.1fr_0.8fr_0.8fr_auto]"
            onSubmit={(event) => {
              event.preventDefault()
              setSearchRequestId((value) => value + 1)
            }}
          >
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.25em] text-slate-500">Theme</span>
              <select
                id="theme"
                name="theme"
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
                id="extra-terms"
                name="extra-terms"
                value={extraTerms}
                onChange={(event) => setExtraTerms(event.target.value)}
                placeholder="fraud graph, XGBoost, chargeback"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-400/40"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.25em] text-slate-500">From</span>
              <input
                id="from-date"
                name="from-date"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/40"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.25em] text-slate-500">To</span>
              <input
                id="to-date"
                name="to-date"
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400/40"
              />
            </label>

            <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-1">
              <button
                type="submit"
                disabled={loading || summaryLoading}
                className={`${primaryButtonClass} w-full rounded-2xl py-3 disabled:cursor-not-allowed disabled:bg-sky-400/60`}
              >
                {loading || summaryLoading ? 'Updating...' : 'Update briefing'}
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-400">
            <span className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1">
              Theme presets
            </span>
            <span className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1">
              Local paging
            </span>
            <span className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1">
              Crossref metadata
            </span>
          </div>

          <details className="mt-4 rounded-3xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300 shadow-lg shadow-slate-950/15 sm:p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl outline-none">
              <div>
                <h2 className="text-base font-semibold text-white">Current theme</h2>
                <p className="mt-1 text-sm text-slate-400">Selected in the dropdown.</p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                Details
              </span>
            </summary>

            <div className="mt-5 flex justify-end">
              <button type="button" onClick={handleReset} className={secondaryButtonClass}>
                Reset filters
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-[#0b1324] px-4 py-3">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Theme</div>
                <div className="mt-1 font-medium text-white">{activeTheme.label}</div>
              </div>
              <div className="rounded-2xl bg-[#0b1324] px-4 py-3">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Description</div>
                <div className="mt-1 leading-6">{activeTheme.description}</div>
              </div>
              <div className="rounded-2xl bg-[#0b1324] px-4 py-3">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Default terms</div>
                {activeTheme.terms?.length > 0 ? (
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
                ) : (
                  <p className="mt-2 leading-6 text-slate-400">
                    No preset terms. Enter one or more additional terms before running the search.
                  </p>
                )}
              </div>
            </div>
          </details>
        </section>

        <section className="space-y-4 py-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Executive summary</h2>
                <p className="mt-1 text-sm text-slate-400">
                  The backend uses the full result set and all available abstracts.
                </p>
              </div>
              <div className="text-sm text-slate-400">
                {summary?.cache?.hit ? 'Cached' : summary ? 'Fresh' : 'Pending'}
              </div>
            </div>

            {summaryError ? (
              <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-amber-50">
                {summaryError}
              </div>
            ) : null}

            {summaryLoading ? (
              <div className="mt-5 space-y-3">
                <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/10" />
                <div className="h-4 w-full animate-pulse rounded-full bg-white/10" />
                <div className="h-4 w-11/12 animate-pulse rounded-full bg-white/10" />
                <div className="h-4 w-5/6 animate-pulse rounded-full bg-white/10" />
              </div>
            ) : null}

            {summary && !summaryLoading ? (
              <div className="mt-5 space-y-4">
                <ul className="space-y-2">
                  {(summary.summary?.takeaways || []).slice(0, 3).map((item, index) => (
                    <li
                      key={`${index}-${item}`}
                      className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-200"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4 leading-7 text-slate-200">
                  {summary.summary?.paragraph}
                </p>
              </div>
            ) : null}

            {!summary && !summaryLoading && !summaryError ? (
              <p className="mt-4 text-sm leading-6 text-slate-400">
                Run a search to generate an executive summary.
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-400">
              <span className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1">
                {summaryNote}
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur sm:p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Latest records</h2>
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
              <div className="mb-4 rounded-3xl border border-rose-400/20 bg-rose-500/10 p-4 text-rose-100">
                {error}
              </div>
            ) : null}

            {!loading && visibleArticles.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-slate-300">
                No items matched this window. Try a broader term or a wider date range.
              </div>
            ) : null}

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="animate-pulse rounded-3xl border border-white/10 bg-slate-900/70 p-5"
                  >
                    <div className="h-4 w-24 rounded-full bg-white/10" />
                    <div className="mt-4 h-6 w-5/6 rounded bg-white/10" />
                    <div className="mt-3 h-4 w-full rounded bg-white/10" />
                    <div className="mt-2 h-4 w-4/5 rounded bg-white/10" />
                    <div className="mt-5 h-10 w-full rounded bg-white/10" />
                  </div>
                ))}
              </div>
            ) : null}

            {!loading && visibleArticles.length > 0 ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
                  <span>
                    Showing {visibleArticles.length} of {articles.length} records.
                  </span>
                  <span>
                    {hiddenCount > 0
                      ? `${hiddenCount} more hidden locally.`
                      : 'All loaded records are visible.'}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {visibleArticles.map((article) => (
                    <article
                      key={`${article.doi || article.title}-${article.published}`}
                      className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-lg shadow-slate-950/20"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-sky-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-sky-200">
                          {article.type || 'publication'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatPublishedDate(article.published)}
                        </span>
                      </div>

                      <h3 className="mt-4 text-lg font-semibold leading-tight text-white">
                        {article.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {formatAuthors(article.authors)}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {(article.matchedTerms || []).slice(0, 4).map((term) => (
                          <span
                            key={term}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                          >
                            {term}
                          </span>
                        ))}
                      </div>

                      <div className="mt-3 text-sm leading-6 text-slate-400">
                        {article.abstract ? article.abstract : 'No abstract available in Crossref metadata.'}
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-sm text-slate-400">
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

                {hiddenCount > 0 ? (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      className={secondaryButtonClass}
                    >
                      Load more
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-300 shadow-lg shadow-slate-950/20 backdrop-blur sm:p-5">
            <h2 className="text-lg font-semibold text-white">Search status</h2>
            <p className="mt-2 leading-6 text-slate-400">{backendNote}</p>
            <div className="mt-3 space-y-3">
              <div className="rounded-2xl bg-[#0b1324] px-4 py-3">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Window</div>
                <div className="mt-1 text-slate-100">
                  {windowInfo?.from && windowInfo?.to ? `${windowInfo.from} to ${windowInfo.to}` : 'Loading'}
                </div>
              </div>
              <div className="rounded-2xl bg-[#0b1324] px-4 py-3">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Search mode</div>
                <div className="mt-1 text-slate-100">
                  {queryInfo?.searchMode || (isNoTheme ? 'no-theme' : 'theme')}
                </div>
              </div>
              <div className="rounded-2xl bg-[#0b1324] px-4 py-3">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Paging</div>
                <div className="mt-1 text-slate-100">
                  {queryInfo
                    ? `${visibleArticles.length} visible of ${articles.length} loaded`
                    : 'Waiting for results'}
                </div>
              </div>
              <div className="rounded-2xl bg-[#0b1324] px-4 py-3">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Cache</div>
                <div className="mt-1 text-slate-100">
                  {queryInfo?.cacheHit ? 'Using cached search data' : 'Fresh search data'}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-300 shadow-lg shadow-slate-950/20 backdrop-blur sm:p-5">
            <h2 className="text-lg font-semibold text-white">Current query</h2>
            <div className="mt-3 space-y-3">
              <div className="rounded-2xl bg-[#0b1324] px-4 py-3">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Theme</div>
                <div className="mt-1 font-medium text-white">{activeTheme.label}</div>
              </div>
              <div className="rounded-2xl bg-[#0b1324] px-4 py-3">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Description</div>
                <div className="mt-1 leading-6">{activeTheme.description}</div>
              </div>
              <div className="rounded-2xl bg-[#0b1324] px-4 py-3">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Summary cache</div>
                <div className="mt-1 text-white">{summary?.cache?.hit ? 'Cached' : 'Fresh or pending'}</div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(activeTheme.terms || []).length > 0 ? (
                activeTheme.terms.map((term) => (
                  <span
                    key={term}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                  >
                    {term}
                  </span>
                ))
              ) : (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  Enter your own terms
                </span>
              )}
            </div>
          </div>
        </section>

        <SiteFooter />
      </main>
    </div>
  )
}

export default App
