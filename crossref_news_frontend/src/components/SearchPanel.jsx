function SearchPanel({
  themeOptions,
  selectedTheme,
  onThemeChange,
  extraTerms,
  onExtraTermsChange,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  forceRefresh,
  onForceRefreshChange,
  loading,
  summaryLoading,
  onSubmit,
  primaryButtonClass,
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-xl shadow-slate-950/20 backdrop-blur sm:p-5">
      <form
        className="grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-[1.35fr_1.2fr_0.85fr_0.85fr_auto]"
        onSubmit={onSubmit}
      >
        <label className="min-w-0 space-y-2">
          <span className="block text-[11px] uppercase tracking-[0.28em] text-slate-500">
            Theme
          </span>
          <select
            id="theme"
            name="theme"
            value={selectedTheme}
            onChange={(event) => onThemeChange(event.target.value)}
            className="h-14 w-full rounded-[1.15rem] border border-white/10 bg-slate-950/70 px-4 text-slate-100 outline-none transition focus:border-sky-400/40"
          >
            {themeOptions.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.label}
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-0 space-y-2">
          <span className="block text-[11px] uppercase tracking-[0.28em] text-slate-500">
            Additional terms
          </span>
          <input
            id="extra-terms"
            name="extra-terms"
            value={extraTerms}
            onChange={(event) => onExtraTermsChange(event.target.value)}
            placeholder="fraud graph, XGBoost, chargeback"
            className="h-14 w-full rounded-[1.15rem] border border-white/10 bg-slate-950/70 px-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-400/40"
          />
        </label>

        <label className="min-w-0 space-y-2">
          <span className="block text-[11px] uppercase tracking-[0.28em] text-slate-500">From</span>
          <input
            id="from-date"
            name="from-date"
            type="date"
            value={fromDate}
            onChange={(event) => onFromDateChange(event.target.value)}
            className="h-14 w-full rounded-[1.15rem] border border-white/10 bg-slate-950/70 px-4 text-slate-100 outline-none transition focus:border-sky-400/40"
          />
        </label>

        <label className="min-w-0 space-y-2">
          <span className="block text-[11px] uppercase tracking-[0.28em] text-slate-500">To</span>
          <input
            id="to-date"
            name="to-date"
            type="date"
            value={toDate}
            onChange={(event) => onToDateChange(event.target.value)}
            className="h-14 w-full rounded-[1.15rem] border border-white/10 bg-slate-950/70 px-4 text-slate-100 outline-none transition focus:border-sky-400/40"
          />
        </label>

        <div className="flex items-end gap-3 sm:col-span-2 xl:col-span-1">
          <button
            type="submit"
            disabled={loading || summaryLoading}
            className={`${primaryButtonClass} h-14 w-full rounded-[1.15rem] px-6 disabled:cursor-not-allowed disabled:bg-sky-400/60`}
          >
            {loading || summaryLoading ? 'Updating...' : 'Update briefing'}
          </button>
        </div>

        <label className="flex items-center gap-3 rounded-[1.15rem] border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-slate-300 sm:col-span-2 xl:col-span-5">
          <input
            type="checkbox"
            checked={forceRefresh}
            onChange={(event) => onForceRefreshChange(event.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400 focus:ring-sky-300"
          />
          <span className="leading-6">Refresh results and executive summary</span>
          <span className="ml-auto text-xs uppercase tracking-[0.25em] text-slate-500">
            Bypass the 1 h cache
          </span>
        </label>
      </form>

      <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-400">
        <span className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1">
          Theme presets
        </span>
        <span className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1">
          Crossref metadata
        </span>
        <span className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1">
          Local pagination
        </span>
      </div>
    </section>
  )
}

export default SearchPanel
