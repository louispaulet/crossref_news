import { Link } from 'react-router-dom'

const footerLinks = [
  { href: 'https://github.com/louispaulet/crossref_news', label: 'Repo', external: true },
  { to: '/', label: 'About' },
  { to: '/legal-notice', label: 'Legal notice' },
  { to: '/privacy-policy', label: 'Privacy policy' },
  { to: '/terms-of-use', label: 'Terms of use' },
]

function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-white/10 pt-6 text-sm text-slate-400">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-2xl leading-6 text-slate-400">
            Recent Crossref metadata for fraud-detection and adjacent research themes.
          </p>

          <dl className="grid gap-2 text-sm text-slate-300 sm:min-w-[18rem]">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
              <dt className="text-slate-500">Source</dt>
              <dd className="text-white">Crossref REST API</dd>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
              <dt className="text-slate-500">Contact</dt>
              <dd className="text-white">GitHub issues</dd>
            </div>
          </dl>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-3">
            {footerLinks.map((link) => (
              <li key={link.to || link.href}>
                {link.external ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/10 px-3 py-2 text-slate-300 transition hover:border-sky-400/30 hover:text-white"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    to={link.to}
                    className="rounded-full border border-white/10 px-3 py-2 text-slate-300 transition hover:border-sky-400/30 hover:text-white"
                  >
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  )
}

export default SiteFooter
