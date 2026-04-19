import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import LegalPage from './pages/LegalPage'
import './index.css'
import { HashRouter, Route, Routes } from 'react-router-dom'

const legalNoticeSections = [
  {
    heading: 'Site purpose',
    paragraphs: [
      'Crossref News is a briefing on recent Crossref metadata for a small set of research themes.',
      'The site is for reading, filtering, and checking source records, not for editorial ranking or automated moderation decisions.',
    ],
  },
  {
    heading: 'Publisher',
    paragraphs: [
      'Publisher: [replace with legal entity name].',
      'Contact: [replace with email address].',
      'Editorial responsibility: [replace with name or role].',
    ],
  },
  {
    heading: 'Hosting',
    paragraphs: [
      'Hosting provider: [replace with hosting provider].',
      'Address: [replace with hosting address].',
      'Technical platform: Cloudflare Worker backend and GitHub Pages frontend.',
    ],
  },
]

const privacySections = [
  {
    heading: 'What we collect',
    paragraphs: [
      'The site does not require an account.',
      'Search inputs are sent to the backend so it can fetch matching Crossref records.',
      'If a mailto parameter is supplied, it is forwarded to Crossref requests so the API call can include a contact address.',
    ],
  },
  {
    heading: 'Cookies and analytics',
    paragraphs: [
      'This site does not intentionally use advertising or analytics cookies.',
      'If the browser or hosting platform adds technical logs, they are handled by the platform that serves the site.',
    ],
  },
  {
    heading: 'Your choices',
    paragraphs: [
      'Do not enter personal data in the query fields unless you want it to be used in a search request.',
      'You can stop using the site at any time and clear your browser data locally.',
    ],
  },
]

const termsSections = [
  {
    heading: 'Use of the site',
    paragraphs: [
      'Crossref News is provided as a read-only site for academic metadata.',
      'You may browse, search, and share links to the pages, provided you keep the purpose and attribution intact.',
    ],
  },
  {
    heading: 'Service limits',
    paragraphs: [
      'The service depends on Crossref availability and the configured backend runtime.',
      'Results are informational only and may be incomplete, delayed, or deduplicated by the search pipeline.',
    ],
  },
  {
    heading: 'Responsibility',
    paragraphs: [
      'The site is offered without warranties of accuracy, completeness, or uninterrupted availability.',
      'External links lead to third-party resources that are governed by their own terms and policies.',
    ],
  },
]

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route
          path="/legal-notice"
          element={
            <LegalPage
              title="Legal notice"
              intro="Plain-language information about the publisher, hosting, and purpose of the site."
              sections={legalNoticeSections}
              sidebarTitle="Key details"
              sidebarItems={[
                { label: 'Document status', value: 'Working draft with placeholders' },
                { label: 'Language', value: 'English' },
                { label: 'Last review', value: 'Update this before publication' },
              ]}
            />
          }
        />
        <Route
          path="/privacy-policy"
          element={
            <LegalPage
              title="Privacy policy"
              intro="A short policy describing how the briefing uses query inputs and platform logs."
              sections={privacySections}
              sidebarTitle="Data points"
              sidebarItems={[
                { label: 'Accounts', value: 'None' },
                { label: 'Analytics cookies', value: 'None intentionally' },
                { label: 'Contact field', value: 'Optional mailto parameter' },
              ]}
            />
          }
        />
        <Route
          path="/terms-of-use"
          element={
            <LegalPage
              title="Terms of use"
              intro="Basic terms for reading and sharing the site as an informational academic briefing."
              sections={termsSections}
              sidebarTitle="Summary"
              sidebarItems={[
                { label: 'Allowed use', value: 'Browsing and linking' },
                { label: 'Service model', value: 'Read-only briefing' },
                { label: 'Jurisdiction', value: 'France' },
              ]}
            />
          }
        />
        <Route path="*" element={<App />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>,
)
