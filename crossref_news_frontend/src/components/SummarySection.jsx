function SummarySection({
  summary,
  summaryLoading,
  summaryTimedOut,
  summaryError,
  summaryNote,
  summaryProgress,
  summaryElapsedMs,
  loadingMessage,
  supportingRecords = [],
  loadingStateLabel,
}) {
  const takeaways = summary?.summary?.takeaways || []

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 backdrop-blur sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Executive summary</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
            Based on the current Crossref records and any abstracts available in the metadata.
          </p>
        </div>
        <div className="text-sm text-slate-400">{loadingStateLabel}</div>
      </div>

      {summaryError ? (
        <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-amber-50">
          {summaryError}
        </div>
      ) : null}

      {summaryLoading ? (
        <div className="mt-5 space-y-4">
          <div
            className="summary-progress-shell"
            role="progressbar"
            aria-label="Executive summary loading progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(summaryProgress)}
            aria-valuetext={`Executive summary loading, ${Math.round(summaryProgress)} percent`}
          >
            <div className="summary-progress-fill" style={{ width: `${summaryProgress}%` }} />
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <p className="text-sm leading-6 text-slate-300">{loadingMessage}</p>
            <div className="text-xs uppercase tracking-[0.25em] text-slate-500">
              {Math.round(summaryProgress)}%
            </div>
          </div>
          {summaryElapsedMs > 0 ? (
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Elapsed {Math.round(summaryElapsedMs / 1000)}s
            </p>
          ) : null}
        </div>
      ) : null}

      {summaryTimedOut ? (
        <div
          className="mt-5 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4 text-sm leading-6 text-slate-300"
          role="status"
          aria-live="polite"
        >
          The summary is taking longer than usual.
        </div>
      ) : null}

      {summary && !summaryLoading ? (
        <div className="mt-5 space-y-5">
          <ul className="space-y-3">
            {takeaways.slice(0, 3).map((item, index) => {
              const evidence = supportingRecords[index] || []

              return (
                <li
                  key={`${index}-${item}`}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-200"
                >
                  <p className="leading-7">{item}</p>
                  {evidence.length > 0 ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-xs uppercase tracking-[0.25em] text-slate-500">
                        Representative records
                      </span>
                      {evidence.map((record) =>
                        record.url ? (
                          <a
                            key={`${record.title}-${record.published}`}
                            href={record.url}
                            target="_blank"
                            rel="noreferrer"
                            className="max-w-[14rem] truncate rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 transition hover:border-sky-400/30 hover:text-white"
                          >
                            {record.title}
                          </a>
                        ) : (
                          <span
                            key={`${record.title}-${record.published}`}
                            className="max-w-[14rem] truncate rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                          >
                            {record.title}
                          </span>
                        ),
                      )}
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>

          <p className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4 leading-7 text-slate-200">
            {summary.summary?.paragraph}
          </p>

          <p className="text-sm leading-6 text-slate-400">
            Summary generated from metadata and available abstracts, not full-text papers.
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
    </section>
  )
}

export default SummarySection
