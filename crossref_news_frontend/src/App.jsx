import { useEffect, useRef, useState } from 'react'
import BriefingHero from './components/BriefingHero'
import ResultsSection, { formatPublicationTypeLabel } from './components/ResultsSection'
import SearchPanel from './components/SearchPanel'
import PageOrnaments from './components/PageOrnaments'
import SiteFooter from './components/SiteFooter'
import SummarySection from './components/SummarySection'
import TechnicalDetails from './components/TechnicalDetails'

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
const EXEC_SUMMARY_TIMEOUT_MS = 60000
const EXEC_SUMMARY_FIRST_PHASE_MS = 30000
const EXEC_SUMMARY_TICK_MS = 500
const EXEC_SUMMARY_PROGRESS_CAP = 98.4
const EXEC_SUMMARY_SLOW_MESSAGE = 'The summary is taking longer than usual.'
const EXEC_SUMMARY_LOADING_MESSAGES = [
  'Reviewing the current result set.',
  'Checking the available abstracts.',
  'Synthesizing the briefing.',
  'Waiting for the summary response.',
  'Crossref metadata is still loading.',
  'Preparing the executive summary.',
]

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

  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || ''
  if (configuredBaseUrl) {
    return configuredBaseUrl
  }

  if (typeof window !== 'undefined') {
    const { hostname } = window.location
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return 'http://127.0.0.1:8787'
    }
  }

  return ''
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

function getExecsumProgress(elapsedMs, currentProgress) {
  if (elapsedMs <= EXEC_SUMMARY_FIRST_PHASE_MS) {
    const phaseProgress = 4 + (elapsedMs / EXEC_SUMMARY_FIRST_PHASE_MS) * 56
    return Math.max(currentProgress, Math.min(phaseProgress, 60))
  }

  const lateElapsedMs = elapsedMs - EXEC_SUMMARY_FIRST_PHASE_MS
  const lateRatio = Math.min(lateElapsedMs / EXEC_SUMMARY_FIRST_PHASE_MS, 1)
  const baseProgress = 60 + lateRatio * 34.5
  const randomBoost = (1 - lateRatio) * (0.6 + Math.random() * 2.1) + Math.random() * 0.35
  const drift = 0.2 + Math.random() * (1.4 - lateRatio)
  const nextProgress = Math.max(currentProgress + drift, baseProgress + randomBoost)

  return Math.min(EXEC_SUMMARY_PROGRESS_CAP, nextProgress)
}

function getExecsumLoadingMessage(elapsedMs) {
  const segment = Math.floor(elapsedMs / 7000)
  return EXEC_SUMMARY_LOADING_MESSAGES[segment % EXEC_SUMMARY_LOADING_MESSAGES.length]
}

async function readJsonResponse(response, sourceLabel) {
  const rawBody = await response.text()
  const trimmedBody = rawBody.trim()

  if (!trimmedBody) {
    throw new Error(`${sourceLabel} returned an empty response.`)
  }

  try {
    return JSON.parse(trimmedBody)
  } catch {
    const lowerBody = trimmedBody.toLowerCase()
    const looksLikeHtml =
      lowerBody.startsWith('<!doctype html') || lowerBody.startsWith('<html') || lowerBody.startsWith('<')
    if (looksLikeHtml) {
      throw new Error(
        `${sourceLabel} returned HTML instead of JSON. Check the API base URL or the dev proxy.`,
      )
    }

    throw new Error(`${sourceLabel} returned invalid JSON.`)
  }
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

function truncateWords(text, maxWords = 60) {
  const normalized = String(text || '').trim()
  if (!normalized) {
    return {
      text: '',
      truncated: false,
    }
  }

  const words = normalized.split(/\s+/).filter(Boolean)
  if (words.length <= maxWords) {
    return {
      text: normalized,
      truncated: false,
    }
  }

  return {
    text: `${words.slice(0, maxWords).join(' ')}…`,
    truncated: true,
  }
}

function formatSortLabel(sortOrder) {
  const labels = {
    relevance: 'Sort: relevance',
    newest: 'Sort: newest',
    oldest: 'Sort: oldest',
    title: 'Sort: title',
  }

  return labels[sortOrder] || labels.relevance
}

function formatAbstractFilterLabel(value) {
  const labels = {
    all: 'Abstracts: any',
    available: 'Abstracts: with text',
    missing: 'Abstracts: without text',
  }

  return labels[value] || labels.all
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

function publishedDateToTimestamp(value) {
  if (!value || value === 'unknown date') {
    return 0
  }

  if (/^\d{4}$/.test(value)) {
    return Date.UTC(Number(value), 0, 1)
  }

  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split('-').map(Number)
    return Date.UTC(year, month - 1, 1)
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return Date.parse(`${value}T00:00:00Z`)
  }

  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function buildSearchRequest({
  activeTheme,
  selectedTheme,
  extraTerms,
  fromDate,
  toDate,
  forceRefresh,
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

  if (forceRefresh) {
    params.set('refresh', '1')
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
  const [forceRefresh, setForceRefresh] = useState(false)
  const [articles, setArticles] = useState([])
  const [windowInfo, setWindowInfo] = useState(initialWindow)
  const [queryInfo, setQueryInfo] = useState(null)
  const [backendNote, setBackendNote] = useState('Loading live Crossref briefing...')
  const [summary, setSummary] = useState(null)
  const [summaryNote, setSummaryNote] = useState('Executive summary will appear after the search loads.')
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [summaryPhase, setSummaryPhase] = useState('loading')
  const [summaryProgress, setSummaryProgress] = useState(4)
  const [summaryElapsedMs, setSummaryElapsedMs] = useState(0)
  const [error, setError] = useState('')
  const [summaryError, setSummaryError] = useState('')
  const [visibleCount, setVisibleCount] = useState(DEFAULT_PAGE_SIZE)
  const [newsPageSize, setNewsPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [sortOrder, setSortOrder] = useState('relevance')
  const [typeFilter, setTypeFilter] = useState('all')
  const [abstractFilter, setAbstractFilter] = useState('all')
  const [searchRequestId, setSearchRequestId] = useState(1)
  const summaryRunIdRef = useRef(0)

  const themes = config.themes?.length > 0 ? config.themes : FALLBACK_THEMES
  const defaultThemeId = resolveThemeId(themes, config.defaultTheme)
  const themeOptions = [NO_THEME_OPTION, ...themes.map((theme) => ({ ...theme, label: theme.label || theme.id }))]
  const activeTheme =
    themeOptions.find((theme) => theme.id === selectedTheme) ||
    themeOptions.find((theme) => theme.id === defaultThemeId) ||
    themeOptions[1] ||
    themeOptions[0]
  const isNoTheme = selectedTheme === NO_THEME_OPTION.id
  const filteredArticles = articles.filter((article) => {
    const articleType = article.type || 'unknown'

    if (typeFilter !== 'all' && articleType !== typeFilter) {
      return false
    }

    if (abstractFilter === 'available' && !article.abstract) {
      return false
    }

    if (abstractFilter === 'missing' && article.abstract) {
      return false
    }

    return true
  })

  const sortedArticles = [...filteredArticles].sort((a, b) => {
    if (sortOrder === 'title') {
      return a.title.localeCompare(b.title)
    }

    if (sortOrder === 'oldest') {
      return publishedDateToTimestamp(a.published) - publishedDateToTimestamp(b.published)
    }

    if (sortOrder === 'newest') {
      return publishedDateToTimestamp(b.published) - publishedDateToTimestamp(a.published)
    }

    return 0
  })

  const visibleArticles = sortedArticles.slice(0, Math.min(visibleCount, DEFAULT_MAX_VISIBLE))
  const hiddenCount = Math.max(sortedArticles.length - visibleArticles.length, 0)
  const summaryTimedOut = summaryPhase === 'timed_out'
  const summaryStateLabel = summary?.cache?.hit ? 'Cached' : summary ? 'Fresh' : 'Pending'
  const summaryEvidence = (summary?.summary?.takeaways || []).map((_, index) =>
    visibleArticles.slice(index * 2, index * 2 + 2),
  )
  const filterSummary = [
    formatSortLabel(sortOrder),
    `Type: ${typeFilter === 'all' ? 'any' : formatPublicationTypeLabel(typeFilter)}`,
    formatAbstractFilterLabel(abstractFilter),
  ]
  const currentTerms = Array.from(
    new Set(isNoTheme ? parseTerms(extraTerms) : [...(activeTheme.terms || []), ...parseTerms(extraTerms)]),
  )
  const resultTypeOptions = [
    { value: 'all', label: 'All types' },
    ...Array.from(new Set(articles.map((article) => article.type || 'unknown'))).map((type) => ({
      value: type,
      label: formatPublicationTypeLabel(type),
    })),
  ]

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

        const data = await readJsonResponse(response, 'Configuration endpoint')
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
        setForceRefresh(false)
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
        const data = await readJsonResponse(response, 'Crossref results endpoint')

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
          `${request.params.get('refresh') ? 'Forced refresh.' : cacheHit ? 'Using cached search results.' : 'Loaded fresh search results.'} Showing ${Math.min(pageSize, returnedCount)} of ${returnedCount} records.`,
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
    let settled = false
    let timedOut = false
    let progressIntervalId = null
    let timeoutId = null
    const controller = new AbortController()
    const requestId = summaryRunIdRef.current + 1

    summaryRunIdRef.current = requestId

    function clearSummaryTimers() {
      if (progressIntervalId !== null) {
        window.clearInterval(progressIntervalId)
        progressIntervalId = null
      }

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
        timeoutId = null
      }
    }

    function settleSummary(nextPhase, nextNote, nextError = '') {
      if (!alive || settled) {
        return
      }

      settled = true
      clearSummaryTimers()
      setSummaryPhase(nextPhase)
      setSummaryLoading(nextPhase === 'loading')
      setSummaryError(nextError)
      setSummaryNote(nextNote)
    }

    async function loadSummary() {
      if (!apiBaseUrl && !import.meta.env.DEV) {
        settleSummary('error', 'Set `VITE_API_BASE_URL` before building for GitHub Pages.', 'Set `VITE_API_BASE_URL` before building for GitHub Pages.')
        return
      }

      const request = buildSearchRequest({
        activeTheme,
        selectedTheme,
        extraTerms,
        fromDate,
        toDate,
        forceRefresh,
      })

      if (request.error) {
        settleSummary('error', request.error, request.error)
        setSummary(null)
        setForceRefresh(false)
        return
      }

      setSummaryPhase('loading')
      setSummaryProgress(4)
      setSummaryElapsedMs(0)
      setSummaryError('')
      setSummary(null)
      setSummaryNote('Generating executive summary...')
      setSummaryLoading(true)

      const startedAt = Date.now()

      progressIntervalId = window.setInterval(() => {
        if (!alive || settled || timedOut) {
          return
        }

        const elapsedMs = Date.now() - startedAt
        setSummaryElapsedMs(elapsedMs)
        setSummaryProgress((currentProgress) => getExecsumProgress(elapsedMs, currentProgress))
      }, EXEC_SUMMARY_TICK_MS)

      timeoutId = window.setTimeout(() => {
        if (!alive || settled) {
          return
        }

        timedOut = true
        clearSummaryTimers()
        setSummaryPhase('timed_out')
        setSummaryLoading(false)
        setSummaryProgress(0)
        setSummaryElapsedMs(EXEC_SUMMARY_TIMEOUT_MS)
        setSummaryError('')
        setSummaryNote(EXEC_SUMMARY_SLOW_MESSAGE)
      }, EXEC_SUMMARY_TIMEOUT_MS)

      try {
        const response = await fetch(joinUrl(apiBaseUrl, `/execsum?${request.params.toString()}`), {
          signal: controller.signal,
        })
        const data = await readJsonResponse(response, 'Executive summary endpoint')

        if (!alive || settled || summaryRunIdRef.current !== requestId) {
          return
        }

        if (!response.ok) {
          throw new Error(data?.error || `HTTP ${response.status}`)
        }

        settled = true
        clearSummaryTimers()
        setSummary(data)
        setSummaryPhase('ready')
        setSummaryLoading(false)
        setSummaryProgress(100)
        setSummaryElapsedMs(Date.now() - startedAt)
        setSummaryError('')
        setSummaryNote(
          `${request.params.get('refresh') ? 'Forced refresh.' : data.cache?.hit ? 'Using cached executive summary.' : 'Generated a fresh executive summary.'}`,
        )
      } catch (fetchError) {
        if (!alive || settled || timedOut || summaryRunIdRef.current !== requestId || controller.signal.aborted) {
          return
        }

        settled = true
        clearSummaryTimers()
        setSummary(null)
        setSummaryPhase('error')
        setSummaryLoading(false)
        setSummaryProgress(0)
        setSummaryElapsedMs(0)
        setSummaryError(fetchError instanceof Error ? fetchError.message : 'Unable to generate the executive summary.')
        setSummaryNote('Executive summary unavailable.')
      }
    }

    void loadSummary()

    return () => {
      alive = false
      controller.abort()
      clearSummaryTimers()
    }
  }, [apiBaseUrl, searchRequestId])

  useEffect(() => {
    setVisibleCount(DEFAULT_PAGE_SIZE)
  }, [sortOrder, typeFilter, abstractFilter])

  const handleReset = () => {
    const defaultTheme = themes.find((theme) => theme.id === defaultThemeId) || themes[0] || FALLBACK_THEMES[0]
    const defaults = createDefaultWindow(defaultTheme?.defaultDays || 7)
    setSelectedTheme(defaultTheme.id)
    setExtraTerms('')
    setFromDate(defaults.from)
    setToDate(defaults.to)
    setSortOrder('relevance')
    setTypeFilter('all')
    setAbstractFilter('all')
    setVisibleCount(DEFAULT_PAGE_SIZE)
    setNewsPageSize(DEFAULT_PAGE_SIZE)
    setForceRefresh(false)
    setSearchRequestId((value) => value + 1)
  }

  const handleLoadMore = () => {
    setVisibleCount((current) =>
      Math.min(current + newsPageSize, sortedArticles.length, DEFAULT_MAX_VISIBLE),
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111f] text-slate-100">
      <PageOrnaments />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.24),_transparent_55%),radial-gradient(circle_at_75%_15%,_rgba(99,102,241,0.18),_transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(7,17,31,1))]" />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <BriefingHero
          eyebrow="Crossref News"
          title="Track newly published fraud-detection research."
          intro="Search recent Crossref metadata, review a short executive summary, and open the source records when you want the full bibliographic detail."
          highlights={['Monitor new papers', 'Review a briefing', 'Open source records']}
        />

        <div className="space-y-4 py-5">
          <SearchPanel
            themeOptions={themeOptions}
            selectedTheme={selectedTheme}
            onThemeChange={setSelectedTheme}
            extraTerms={extraTerms}
            onExtraTermsChange={setExtraTerms}
            fromDate={fromDate}
            onFromDateChange={setFromDate}
            toDate={toDate}
            onToDateChange={setToDate}
            forceRefresh={forceRefresh}
            onForceRefreshChange={setForceRefresh}
            loading={loading}
            summaryLoading={summaryLoading}
            onSubmit={(event) => {
              event.preventDefault()
              setSearchRequestId((value) => value + 1)
            }}
            primaryButtonClass={primaryButtonClass}
          />

          <SummarySection
            summary={summary}
            summaryLoading={summaryLoading}
            summaryTimedOut={summaryTimedOut}
            summaryError={summaryError}
            summaryNote={summaryNote}
            summaryProgress={summaryProgress}
            summaryElapsedMs={summaryElapsedMs}
            loadingMessage={getExecsumLoadingMessage(summaryElapsedMs)}
            supportingRecords={summaryEvidence}
            loadingStateLabel={summaryStateLabel}
          />

          <ResultsSection
            error={error}
            loading={loading}
            articles={sortedArticles}
            visibleArticles={visibleArticles}
            hiddenCount={hiddenCount}
            queryInfo={queryInfo}
            activeThemeLabel={queryInfo?.theme?.label || activeTheme.label}
            currentFilterSummary={filterSummary}
            sortOrder={sortOrder}
            typeFilter={typeFilter}
            abstractFilter={abstractFilter}
            typeOptions={resultTypeOptions}
            onSortOrderChange={setSortOrder}
            onTypeFilterChange={setTypeFilter}
            onAbstractFilterChange={setAbstractFilter}
            onLoadMore={handleLoadMore}
            secondaryButtonClass={secondaryButtonClass}
            recordButtonClass={recordButtonClass}
          />

          <TechnicalDetails
            activeTheme={activeTheme}
            windowInfo={windowInfo}
            queryInfo={queryInfo}
            backendNote={backendNote}
            summaryCacheLabel={summaryStateLabel}
            currentTerms={currentTerms}
            onReset={handleReset}
            secondaryButtonClass={secondaryButtonClass}
          />
        </div>

        <SiteFooter />
      </main>
    </div>
  )
}

export default App
