const featuredArticles = [
  {
    tag: 'Fraud detection',
    title: 'New graph models spot transaction anomalies in under a second',
    summary:
      'Researchers compare temporal graph methods against classic XGBoost baselines across payment datasets.',
    source: 'Journal of Applied ML',
    time: '2 hours ago',
  },
  {
    tag: 'Open access',
    title: 'Preprints reshape how teams monitor fraud and chargeback signals',
    summary:
      'A meta-analysis finds faster diffusion when work is published with clear metadata and persistent identifiers.',
    source: 'Scholarly Systems Review',
    time: '6 hours ago',
  },
  {
    tag: 'Payment systems',
    title: 'Credit card risk models gain context from network-aware features',
    summary:
      'The study highlights why isolated row-level scoring misses coordinated behavior across merchants.',
    source: 'Data Science Notes',
    time: '1 day ago',
  },
]

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.24),_transparent_55%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,1))]" />

        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-sky-300/80">
              Crossref News
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Academic news, distilled.
            </h1>
          </div>
          <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 sm:block">
            Backend pending
          </div>
        </header>

        <section className="grid gap-8 py-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-end lg:py-14">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-sm text-sky-200">
              Prototype frontend
            </span>
            <div className="space-y-4">
              <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                A clean briefing surface for the latest scholarly signals.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                This frontend is intentionally lightweight and offline-first for
                now. It gives us a strong visual shell for Crossref-backed news
                while the API is still being built.
              </p>
            </div>
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-sky-950/30 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
              Live status
            </p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-950/70 px-4 py-3">
                <span>Backend</span>
                <span className="text-amber-300">Not connected</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-950/70 px-4 py-3">
                <span>Data source</span>
                <span>Mock articles</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-950/70 px-4 py-3">
                <span>Build target</span>
                <span>Vite + React + Tailwind</span>
              </div>
            </div>
          </aside>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-slate-950/20 backdrop-blur sm:p-6">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_140px]">
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-400">
              Search papers, topics, journals
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-400">
              Last 7 days
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-400">
              Fraud, ML, payments
            </div>
            <button
              type="button"
              className="rounded-2xl bg-sky-400 px-4 py-3 font-medium text-slate-950 transition hover:bg-sky-300"
            >
              Search
            </button>
          </div>
        </section>

        <section className="flex-1 py-10 sm:py-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-white sm:text-2xl">
                Featured briefings
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Mock content that mirrors the layout we will feed from the
                backend later.
              </p>
            </div>
            <p className="hidden text-sm text-slate-400 md:block">
              Updated just for the prototype
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {featuredArticles.map((article) => (
              <article
                key={article.title}
                className="group rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/20 transition hover:-translate-y-1 hover:border-sky-400/30 hover:bg-slate-900"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="rounded-full bg-sky-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-sky-200">
                    {article.tag}
                  </span>
                  <span className="text-xs text-slate-500">{article.time}</span>
                </div>
                <h4 className="mt-5 text-xl font-semibold leading-tight text-white">
                  {article.title}
                </h4>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {article.summary}
                </p>
                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-sm text-slate-400">
                  <span>{article.source}</span>
                  <span className="text-sky-300 transition group-hover:text-sky-200">
                    Read more
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
