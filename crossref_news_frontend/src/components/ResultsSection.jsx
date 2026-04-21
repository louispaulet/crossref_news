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

function formatAuthors(authors) {
  if (!Array.isArray(authors) || authors.length === 0) {
    return 'Unknown authors'
  }

  if (authors.length <= 3) {
    return authors.join(', ')
  }

  return `${authors.slice(0, 3).join(', ')} +${authors.length - 3}`
}

function formatPublicationTypeLabel(type) {
  const labels = {
    'journal-article': 'Journal article',
    'proceedings-article': 'Proceedings article',
    'book-chapter': 'Book chapter',
    book: 'Book',
    report: 'Report',
    'posted-content': 'Posted content',
    'reference-entry': 'Reference entry',
    unknown: 'Unknown type',
  }

  return labels[type] || type.replace(/-/g, ' ')
}

function ResultsSection({
  error,
  loading,
  articles,
  visibleArticles,
  hiddenCount,
  queryInfo,
  activeThemeLabel,
  currentFilterSummary,
  sortOrder,
  typeFilter,
  abstractFilter,
  typeOptions,
  onSortOrderChange,
  onTypeFilterChange,
  onAbstractFilterChange,
  onLoadMore,
  secondaryButtonClass,
  recordButtonClass,
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 backdrop-blur sm:p-5">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Latest records</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            {queryInfo
              ? `Found ${queryInfo.count} deduplicated records from ${queryInfo.rawCount} raw Crossref matches.`
              : 'Run a search to load the briefing.'}
          </p>
        </div>
        <div className="text-sm text-slate-400">{activeThemeLabel}</div>
      </div>

      <div className="grid gap-3 rounded-3xl border border-white/10 bg-slate-950/60 p-4 sm:grid-cols-3">
        <label className="space-y-2">
          <span className="block text-[11px] uppercase tracking-[0.28em] text-slate-500">Sort by</span>
          <select
            value={sortOrder}
            onChange={(event) => onSortOrderChange(event.target.value)}
            className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100 outline-none transition focus:border-sky-400/40"
          >
            <option value="relevance">Relevance</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="title">Title</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="block text-[11px] uppercase tracking-[0.28em] text-slate-500">
            Publication type
          </span>
          <select
            value={typeFilter}
            onChange={(event) => onTypeFilterChange(event.target.value)}
            className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100 outline-none transition focus:border-sky-400/40"
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="block text-[11px] uppercase tracking-[0.28em] text-slate-500">
            Abstracts
          </span>
          <select
            value={abstractFilter}
            onChange={(event) => onAbstractFilterChange(event.target.value)}
            className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100 outline-none transition focus:border-sky-400/40"
          >
            <option value="all">Any</option>
            <option value="available">With abstract</option>
            <option value="missing">Without abstract</option>
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-400">
        {currentFilterSummary.map((item) => (
          <span key={item} className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1">
            {item}
          </span>
        ))}
      </div>

      {error ? (
        <div className="mb-4 mt-5 rounded-3xl border border-rose-400/20 bg-rose-500/10 p-4 text-rose-100">
          {error}
        </div>
      ) : null}

      {!loading && visibleArticles.length === 0 ? (
        <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-slate-300">
          No items matched these filters. Try a broader term, a wider date range, or a different sort.
        </div>
      ) : null}

      {loading ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
        <div className="mt-5 space-y-4">
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
                    {formatPublicationTypeLabel(article.type || 'unknown')}
                  </span>
                  <span className="text-xs text-slate-500">{formatPublishedDate(article.published)}</span>
                </div>

                <h3 className="mt-4 text-lg font-semibold leading-tight text-white">{article.title}</h3>

                <p className="mt-2 text-sm leading-6 text-slate-300">{formatAuthors(article.authors)}</p>

                <div className="mt-3 space-y-2 text-sm leading-6 text-slate-400">
                  <div>{article.venue || 'Venue not listed'}</div>
                  <div>
                    {article.doi ? (
                      <a
                        href={`https://doi.org/${article.doi}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-200 transition hover:text-white"
                      >
                        DOI {article.doi}
                      </a>
                    ) : (
                      <span>DOI not listed</span>
                    )}
                  </div>
                </div>

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

                <div className="mt-4 text-sm leading-6 text-slate-400">
                  {article.abstract ? (() => {
                    const abstractPreview = truncateWords(article.abstract, 60)

                    return (
                      <>
                        {abstractPreview.text}
                        {abstractPreview.truncated ? <em> (truncated)</em> : null}
                      </>
                    )
                  })() : (
                    'No abstract available in Crossref metadata.'
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-sm text-slate-400">
                  <span>Matched on: {(article.matchedTerms || []).slice(0, 3).join(', ') || 'n/a'}</span>
                  {article.url ? (
                    <a href={article.url} target="_blank" rel="noreferrer" className={recordButtonClass}>
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
              <button type="button" onClick={onLoadMore} className={secondaryButtonClass}>
                Load more
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

export { formatPublicationTypeLabel }
export default ResultsSection
