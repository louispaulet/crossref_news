function BriefingHero({ eyebrow, title, intro, highlights = [] }) {
  return (
    <header className="border-b border-white/10 pb-6">
      <div className="max-w-5xl space-y-4">
        <div className="flex items-center gap-4">
          <img
            src="/ornaments/crossref-mark.svg"
            alt=""
            className="h-11 w-11 shrink-0 rounded-2xl border border-white/10 bg-white/5 p-1.5 shadow-lg shadow-slate-950/20 lg:h-12 lg:w-12"
          />
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-sky-300/80">{eyebrow}</p>
            <p className="mt-1 text-xs text-slate-400">
              Recent Crossref metadata for fraud-detection and adjacent research.
            </p>
          </div>
        </div>

        <div className="max-w-4xl space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight text-white leading-[0.95] sm:text-4xl lg:text-[4.4rem]">
            {title}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">{intro}</p>
        </div>

        {highlights.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {highlights.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-sm text-slate-300"
              >
                {item}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  )
}

export default BriefingHero
