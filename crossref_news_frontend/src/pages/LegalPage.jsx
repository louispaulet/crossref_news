import SiteFooter from '../components/SiteFooter'

function LegalPage({ title, intro, sections, sidebarTitle, sidebarItems }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111f] text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.24),_transparent_55%),radial-gradient(circle_at_75%_15%,_rgba(99,102,241,0.18),_transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(7,17,31,1))]" />
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="border-b border-white/10 pb-6">
          <p className="text-xs uppercase tracking-[0.35em] text-sky-300/80">
            Crossref News
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
            {intro}
          </p>
        </header>

        <section className="grid gap-5 py-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/25 backdrop-blur">
            <div className="space-y-6 text-sm leading-7 text-slate-300">
              {sections.map((section) => (
                <section key={section.heading} className="space-y-3">
                  <h2 className="text-lg font-semibold text-white">{section.heading}</h2>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.bullets ? (
                    <ul className="space-y-2 pl-5">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="list-disc">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/25 backdrop-blur">
            <h2 className="text-lg font-semibold text-white">{sidebarTitle}</h2>
            <dl className="mt-4 space-y-4 text-sm leading-6 text-slate-300">
              {sidebarItems.map((item) => (
                <div key={item.label} className="rounded-2xl bg-slate-950/60 px-4 py-3">
                  <dt className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    {item.label}
                  </dt>
                  <dd className="mt-1 text-white">{item.value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </section>

        <SiteFooter />
      </main>
    </div>
  )
}

export default LegalPage
