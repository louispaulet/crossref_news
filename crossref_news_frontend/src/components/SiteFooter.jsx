import { Link } from 'react-router-dom'

const footerLinks = [
  { to: '/legal-notice', label: 'Legal notice' },
  { to: '/privacy-policy', label: 'Privacy policy' },
  { to: '/terms-of-use', label: 'Terms of use' },
]

function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-white/10 pt-6 text-sm text-slate-400">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl leading-6 text-slate-400">
          Recent Crossref metadata for a small set of research themes.
        </p>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-4">
            {footerLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="rounded-full border border-white/10 px-3 py-2 text-slate-300 transition hover:border-sky-400/30 hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  )
}

export default SiteFooter
