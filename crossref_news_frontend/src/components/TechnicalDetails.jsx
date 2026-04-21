function TechnicalDetails({
  activeTheme,
  windowInfo,
  queryInfo,
  backendNote,
  summaryCacheLabel,
  currentTerms,
  onReset,
  secondaryButtonClass,
}) {
  return (
    <details className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300 shadow-lg shadow-slate-950/15 sm:p-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl outline-none">
        <div>
          <h2 className="text-base font-semibold text-white">Technical details</h2>
          <p className="mt-1 text-sm text-slate-400">
            Useful provenance and cache information, tucked away by default.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
          Details
        </span>
      </summary>

      <div className="mt-5 flex justify-end">
        <button type="button" onClick={onReset} className={secondaryButtonClass}>
          Reset filters
        </button>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl bg-[#0b1324] px-4 py-3">
          <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Window</div>
          <div className="mt-1 text-white">
            {windowInfo?.from && windowInfo?.to ? `${windowInfo.from} to ${windowInfo.to}` : 'Loading'}
          </div>
        </div>
        <div className="rounded-2xl bg-[#0b1324] px-4 py-3">
          <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Search mode</div>
          <div className="mt-1 text-white">
            {queryInfo?.searchMode || (activeTheme.id === 'none' ? 'no-theme' : 'theme')}
          </div>
        </div>
        <div className="rounded-2xl bg-[#0b1324] px-4 py-3">
          <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Paging</div>
          <div className="mt-1 text-white">
            {queryInfo
              ? `${queryInfo.returnedCount} loaded, ${queryInfo.count} deduplicated`
              : 'Waiting for results'}
          </div>
        </div>
        <div className="rounded-2xl bg-[#0b1324] px-4 py-3">
          <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Cache</div>
          <div className="mt-1 text-white">
            {queryInfo?.cacheHit ? 'Using cached search data' : 'Fresh search data'}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-2xl bg-[#0b1324] px-4 py-3">
          <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Current theme</div>
          <div className="mt-1 font-medium text-white">{activeTheme.label}</div>
          <div className="mt-2 leading-6 text-slate-400">{activeTheme.description}</div>
        </div>

        <div className="rounded-2xl bg-[#0b1324] px-4 py-3">
          <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Terms in use</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {currentTerms.length > 0 ? (
              currentTerms.map((term) => (
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

        <div className="rounded-2xl bg-[#0b1324] px-4 py-3">
          <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Summary cache</div>
          <div className="mt-1 text-white">{summaryCacheLabel}</div>
        </div>

        <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 leading-6 text-slate-400">
          {backendNote}
        </p>
      </div>
    </details>
  )
}

export default TechnicalDetails
