const API_URL = "https://api.crossref.org/works";
const DEFAULT_DAYS = 7;
const DEFAULT_ROWS_PER_QUERY = 25;
const DEFAULT_MAX_RESULTS = 25;
const DEFAULT_THEME_ID = "fraud-detection";
const DEFAULT_TERMS = [
  "fraud detection",
  "credit card fraud",
  "xgboost fraud",
  "chargeback",
  "payment fraud",
  "payment service provider",
  "payment processing fraud",
  "graph machine learning fraud",
];

function createTheme(id, label, terms, description) {
  return {
    id,
    label,
    description,
    terms,
    defaultDays: DEFAULT_DAYS,
  };
}

const THEMES = {
  [DEFAULT_THEME_ID]: createTheme(
    DEFAULT_THEME_ID,
    "Fraud detection",
    DEFAULT_TERMS,
    "Academic work on fraud detection, anomaly detection, XGBoost, and graph-based models.",
  ),
  "credit-card-fraud": createTheme(
    "credit-card-fraud",
    "Credit card fraud",
    ["credit card fraud"],
    "Academic work on credit card fraud detection, transactions, and payment abuse.",
  ),
  "xgboost-fraud": createTheme(
    "xgboost-fraud",
    "XGBoost fraud",
    ["xgboost fraud"],
    "Academic work on fraud detection methods using XGBoost and related models.",
  ),
  chargeback: createTheme(
    "chargeback",
    "Chargeback",
    ["chargeback"],
    "Academic work on chargeback disputes, reversal processes, and payment operations.",
  ),
  "payment-fraud": createTheme(
    "payment-fraud",
    "Payment fraud",
    ["payment fraud"],
    "Academic work on payment fraud, fraud controls, and transaction risk.",
  ),
  "payment-service-provider": createTheme(
    "payment-service-provider",
    "Payment service provider",
    ["payment service provider"],
    "Academic work on payment service providers, fraud controls, and related operations.",
  ),
  "payment-processing-fraud": createTheme(
    "payment-processing-fraud",
    "Payment processing fraud",
    ["payment processing fraud"],
    "Academic work on payment processing fraud and transaction monitoring.",
  ),
  "graph-machine-learning-fraud": createTheme(
    "graph-machine-learning-fraud",
    "Graph machine learning fraud",
    ["graph machine learning fraud"],
    "Academic work on graph machine learning methods for fraud detection.",
  ),
};

const TYPE_PRIORITY = new Map([
  ["journal-article", 0],
  ["proceedings-article", 1],
  ["book-chapter", 2],
  ["book", 3],
  ["report", 4],
  ["posted-content", 5],
  ["reference-entry", 6],
]);

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function jsonResponse(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  for (const [key, value] of Object.entries(corsHeaders())) {
    headers.set(key, value);
  }
  return new Response(JSON.stringify(data, null, 2) + "\n", {
    ...init,
    headers,
  });
}

function errorResponse(status, message) {
  return jsonResponse({ error: message }, { status });
}

function normalizeText(value) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDoi(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/doi\.org\//, "")
    .replace(/^doi:/, "")
    .trim();
}

function buildUserAgent(mailto) {
  const base = "crossref-news/1.0";
  return mailto ? `${base} (mailto:${mailto})` : base;
}

function parsePositiveInt(value, fallback, name) {
  if (value == null || value === "") {
    return fallback;
  }

  if (!/^\d+$/.test(value)) {
    throw new Error(`${name} must be a positive integer`);
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsed;
}

function parseIsoDate(value, name) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${name} must be an ISO date in YYYY-MM-DD format`);
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${name} must be an ISO date in YYYY-MM-DD format`);
  }

  return value;
}

function formatDateParts(dateParts) {
  if (!Array.isArray(dateParts) || dateParts.length === 0) {
    return "unknown date";
  }

  const normalized = dateParts
    .slice(0, 3)
    .map((part) => Number.parseInt(part, 10))
    .filter((part) => Number.isFinite(part) && part > 0);

  if (normalized.length === 0) {
    return "unknown date";
  }

  const [year, month, day] = normalized;
  const parts = [String(year).padStart(4, "0")];
  if (normalized.length >= 2) {
    parts.push(String(month).padStart(2, "0"));
  }
  if (normalized.length >= 3) {
    parts.push(String(day).padStart(2, "0"));
  }
  return parts.join("-");
}

function datePartsToTimestamp(dateParts) {
  if (!Array.isArray(dateParts) || dateParts.length === 0) {
    return 0;
  }

  const normalized = dateParts
    .slice(0, 3)
    .map((part) => Number.parseInt(part, 10))
    .filter((part) => Number.isFinite(part) && part > 0);

  if (normalized.length === 0) {
    return 0;
  }

  const [year, month = 1, day = 1] = normalized;
  return Date.UTC(year, month - 1, day);
}

function extractDate(item) {
  for (const fieldName of ["published-print", "published-online", "published", "created", "posted", "issued"]) {
    const value = item[fieldName];
    if (value && value["date-parts"] && value["date-parts"][0]) {
      return formatDateParts(value["date-parts"][0]);
    }
  }
  return "unknown date";
}

function chooseContainer(item) {
  if (Array.isArray(item["container-title"]) && item["container-title"].length > 0) {
    return item["container-title"][0];
  }
  if (Array.isArray(item["short-container-title"]) && item["short-container-title"].length > 0) {
    return item["short-container-title"][0];
  }
  return item.publisher || "";
}

function extractAuthors(item) {
  const authors = [];
  for (const author of (item.author || []).slice(0, 4)) {
    const given = (author.given || "").trim().replace(/^[ ,.;:]+|[ ,.;:]+$/g, "");
    const family = (author.family || "").trim().replace(/^[ ,.;:]+|[ ,.;:]+$/g, "");
    const fallback = (author.name || "").trim().replace(/^[ ,.;:]+|[ ,.;:]+$/g, "");
    const name = [given, family].filter(Boolean).join(" ") || fallback;
    if (name) {
      authors.push(name);
    }
  }
  return authors;
}

function getTheme(themeId) {
  if (themeId && THEMES[themeId]) {
    return THEMES[themeId];
  }

  return THEMES[DEFAULT_THEME_ID];
}

function normalizeSearchTerms(terms) {
  const seen = new Set();
  const normalized = [];

  for (const term of terms) {
    const trimmed = term.trim();
    if (!trimmed) {
      continue;
    }

    const key = normalizeText(trimmed);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push(trimmed);
  }

  return normalized;
}

function recordFromItem(item, matchedTerm) {
  const title = (item.title && item.title.length > 0 ? item.title.join(" ") : "Untitled").trim() || "Untitled";
  const doi = (item.DOI || "").trim();
  const url = (item.URL || "").trim() || (doi ? `https://doi.org/${doi}` : "");
  let publishedParts = null;
  for (const fieldName of ["published-print", "published-online", "published", "created", "posted", "issued"]) {
    const value = item[fieldName];
    if (value && value["date-parts"] && value["date-parts"][0]) {
      publishedParts = value["date-parts"][0];
      break;
    }
  }
  return {
    title,
    doi,
    doiKey: normalizeDoi(doi),
    titleKey: normalizeText(title),
    url,
    container: chooseContainer(item),
    authors: extractAuthors(item),
    published: extractDate(item),
    publishedParts,
    itemType: item.type || "unknown",
    matchedTerms: new Set([matchedTerm]),
    raw: item,
  };
}

function looksLikePreprint(record) {
  const haystack = [record.itemType, record.title, record.container, record.authors.join(" ")]
    .join(" ")
    .toLowerCase();
  return ["preprint", "arxiv", "medrxiv", "biorxiv", "ssrn"].some((marker) => haystack.includes(marker));
}

function scoreRecord(record) {
  const typeRank = TYPE_PRIORITY.has(record.itemType) ? TYPE_PRIORITY.get(record.itemType) : 10;
  const hasDoi = record.doi ? 0 : 1;
  const containerRank = record.container ? 0 : 1;
  const preprintPenalty = looksLikePreprint(record) ? 1 : 0;
  return [typeRank, preprintPenalty, hasDoi, containerRank];
}

function classifyTopics(record) {
  const title = normalizeText(record.title);
  const topics = new Set();

  if (title.includes("credit card") && title.includes("fraud")) {
    topics.add("credit card fraud");
  }
  if (title.includes("chargeback")) {
    topics.add("chargeback");
  }
  if (title.includes("payment service provider")) {
    topics.add("payment service provider");
  }
  if (title.includes("payment processing") && title.includes("fraud")) {
    topics.add("payment processing fraud");
  }
  if (title.includes("payment") && ["fraud", "fake", "detector", "detection"].some((token) => title.includes(token))) {
    topics.add("payment fraud");
  }
  if (
    title.includes("xgboost") &&
    ["fraud", "payment", "card", "chargeback", "credit", "detection"].some((token) => title.includes(token))
  ) {
    topics.add("xgboost fraud");
  }
  if (
    title.includes("graph") &&
    ["fraud", "payment", "card", "chargeback", "detection"].some((token) => title.includes(token))
  ) {
    topics.add("graph machine learning fraud");
  }
  if (
    title.includes("fraud") &&
    ["detection", "payment", "card", "chargeback", "digital", "transaction", "financial", "smart contract"].some((token) =>
      title.includes(token),
    )
  ) {
    topics.add("fraud detection");
  }

  return topics;
}

function isRelevant(record, terms = []) {
  const title = normalizeText(record.title);
  if (!title) {
    return false;
  }

  for (const term of terms) {
    const normalizedTerm = normalizeText(term);
    if (normalizedTerm && title.includes(normalizedTerm)) {
      return true;
    }
  }

  const strongPhrases = [
    "fraud detection",
    "credit card fraud",
    "chargeback fraud",
    "payment fraud",
    "payment processing",
    "payment service provider",
    "xgboost fraud",
    "graph neural",
    "graph machine learning",
  ];

  if (strongPhrases.some((phrase) => title.includes(phrase))) {
    return true;
  }

  if (title.includes("fraud") && ["payment", "card", "chargeback", "detection", "digital", "transaction", "financial"].some((token) => title.includes(token))) {
    return true;
  }

  if (title.includes("xgboost") && ["fraud", "payment", "card", "chargeback", "credit"].some((token) => title.includes(token))) {
    return true;
  }

  if (title.includes("graph") && ["fraud", "payment", "card", "chargeback"].some((token) => title.includes(token))) {
    return true;
  }

  if (title.includes("payment") && ["fraud", "fake", "detector", "detection", "chargeback"].some((token) => title.includes(token))) {
    return true;
  }

  return false;
}

function mergeRecords(records) {
  let best = records[0];
  for (const record of records.slice(1)) {
    const bestScore = scoreRecord(best);
    const candidateScore = scoreRecord(record);
    for (let index = 0; index < bestScore.length; index += 1) {
      if (candidateScore[index] < bestScore[index]) {
        best = record;
        break;
      }
      if (candidateScore[index] > bestScore[index]) {
        break;
      }
    }
  }

  const mergedTerms = new Set();
  for (const record of records) {
    for (const term of record.matchedTerms) {
      mergedTerms.add(term);
    }
  }

  best.matchedTerms = mergedTerms;
  return best;
}

function dedupeRecords(records) {
  const clusters = [];
  for (const record of records) {
    const matchingIndexes = [];
    for (let clusterIndex = 0; clusterIndex < clusters.length; clusterIndex += 1) {
      const cluster = clusters[clusterIndex];
      if (
        cluster.some((existing) =>
          (record.doiKey && existing.doiKey && record.doiKey === existing.doiKey) ||
          (record.titleKey && existing.titleKey && record.titleKey === existing.titleKey),
        )
      ) {
        matchingIndexes.push(clusterIndex);
      }
    }

    if (matchingIndexes.length === 0) {
      clusters.push([record]);
      continue;
    }

    const first = matchingIndexes[0];
    clusters[first].push(record);
    for (let index = matchingIndexes.length - 1; index >= 1; index -= 1) {
      clusters[first].push(...clusters[matchingIndexes[index]]);
      clusters.splice(matchingIndexes[index], 1);
    }
  }

  return clusters.map(mergeRecords);
}

function compareRecords(a, b) {
  const aDateRank = datePartsToTimestamp(a.publishedParts);
  const bDateRank = datePartsToTimestamp(b.publishedParts);
  if (aDateRank !== bDateRank) {
    return bDateRank - aDateRank;
  }

  const aScore = scoreRecord(a);
  const bScore = scoreRecord(b);
  for (let index = 0; index < aScore.length; index += 1) {
    if (aScore[index] !== bScore[index]) {
      return aScore[index] - bScore[index];
    }
  }

  return a.title.localeCompare(b.title);
}

function buildSearchWindow(url, defaultDays) {
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  if ((fromParam && !toParam) || (!fromParam && toParam)) {
    throw new Error("from and to must be provided together");
  }

  if (fromParam && toParam) {
    const fromDate = parseIsoDate(fromParam, "from");
    const toDate = parseIsoDate(toParam, "to");
    if (fromDate > toDate) {
      throw new Error("from must be earlier than or equal to to");
    }

    return {
      from: fromDate,
      to: toDate,
      days: Math.max(
        1,
        Math.floor((Date.parse(`${toDate}T00:00:00Z`) - Date.parse(`${fromDate}T00:00:00Z`)) / 86400000) + 1,
      ),
    };
  }

  const days = parsePositiveInt(url.searchParams.get("days"), defaultDays, "days");
  const untilDate = new Date();
  const fromDate = new Date(untilDate);
  fromDate.setDate(untilDate.getDate() - (days - 1));

  return {
    from: fromDate.toISOString().slice(0, 10),
    to: untilDate.toISOString().slice(0, 10),
    days,
  };
}

async function fetchCrossrefItems(term, fromDate, untilDate, rows, mailto, timeoutMs) {
  const params = new URLSearchParams({
    "query.title": term,
    filter: `from-pub-date:${fromDate},until-pub-date:${untilDate}`,
    rows: String(rows),
    sort: "published",
    order: "desc",
  });

  if (mailto) {
    params.set("mailto", mailto);
  }

  const url = `${API_URL}?${params.toString()}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new DOMException("Request timed out", "TimeoutError")), timeoutMs);

  let attempts = 0;
  try {
    while (true) {
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": buildUserAgent(mailto),
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (response.status === 429 && attempts < 2) {
          attempts += 1;
          const retryAfter = response.headers.get("Retry-After");
          const parsedRetryAfter = Number.parseFloat(retryAfter);
          const sleepFor = Number.isFinite(parsedRetryAfter) ? parsedRetryAfter : 1;
          await new Promise((resolve) => setTimeout(resolve, sleepFor * 1000));
          continue;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();
        return Array.isArray(payload?.message?.items) ? payload.message.items : [];
      } catch (error) {
        attempts += 1;
        if (attempts < 3 && (error?.name === "AbortError" || error?.name === "TimeoutError" || error instanceof TypeError)) {
          await new Promise((resolve) => setTimeout(resolve, attempts * 1000));
          continue;
        }
        throw error;
      }
    }
  } finally {
    clearTimeout(timeout);
  }
}

async function buildNewsPayload(url) {
  const theme = getTheme(url.searchParams.get("theme"));
  const rowsPerQuery = parsePositiveInt(url.searchParams.get("rowsPerQuery"), DEFAULT_ROWS_PER_QUERY, "rowsPerQuery");
  const maxResults = parsePositiveInt(url.searchParams.get("maxResults"), DEFAULT_MAX_RESULTS, "maxResults");
  const mailto = (url.searchParams.get("mailto") || "").trim() || null;
  const queryTerms = url.searchParams.getAll("term").map((term) => term.trim()).filter(Boolean);
  const terms = normalizeSearchTerms([...theme.terms, ...queryTerms]);
  const window = buildSearchWindow(url, theme.defaultDays ?? DEFAULT_DAYS);

  const rawRecords = [];
  const seenPairs = new Set();
  for (const term of terms) {
    const items = await fetchCrossrefItems(term, window.from, window.to, rowsPerQuery, mailto, 15000);
    for (const item of items) {
      const record = recordFromItem(item, term);
      if (!isRelevant(record, terms)) {
        continue;
      }

      const classified = classifyTopics(record);
      record.matchedTerms = classified.size > 0 ? classified : new Set([term]);
      const pairKey = `${record.doiKey || ""}::${record.titleKey || ""}`;
      if (seenPairs.has(pairKey)) {
        continue;
      }
      seenPairs.add(pairKey);
      rawRecords.push(record);
    }
  }

  const uniqueRecords = dedupeRecords(rawRecords).sort(compareRecords);
  const records = uniqueRecords.slice(0, maxResults);

  return {
    source: "crossref",
    backend: "cloudflare-workers-poc",
    theme: {
      id: theme.id,
      label: theme.label,
      description: theme.description,
    },
    window: {
      from: window.from,
      to: window.to,
      days: window.days,
    },
    terms,
    query: {
      theme: theme.id,
      from: url.searchParams.get("from") || null,
      to: url.searchParams.get("to") || null,
      rowsPerQuery,
      maxResults,
      mailto,
    },
    count: uniqueRecords.length,
    rawCount: rawRecords.length,
    results: records.map((record) => ({
      title: record.title,
      doi: record.doi || null,
      url: record.url || null,
      venue: record.container || null,
      authors: record.authors,
      published: record.published,
      type: record.itemType,
      matchedTerms: [...record.matchedTerms].sort(),
    })),
  };
}

function landingResponse(url) {
  return jsonResponse({
    service: "Crossref News",
    defaultTheme: DEFAULT_THEME_ID,
    themes: Object.values(THEMES).map((theme) => ({
      id: theme.id,
      label: theme.label,
      description: theme.description,
      terms: theme.terms,
      defaultDays: theme.defaultDays,
    })),
    endpoints: {
      news: `${url.origin}/news`,
    },
    usage: {
      method: "GET",
      query: {
        theme: "theme id, default fraud-detection",
        from: "optional ISO date YYYY-MM-DD",
        to: "optional ISO date YYYY-MM-DD",
        days: "positive integer, default 7",
        rowsPerQuery: "positive integer, default 25",
        maxResults: "positive integer, default 25",
        mailto: "optional contact email",
        term: "repeatable query term",
      },
    },
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (request.method !== "GET") {
      return errorResponse(405, "Method not allowed");
    }

    try {
      if (url.pathname === "/news") {
        return jsonResponse(await buildNewsPayload(url));
      }

      return landingResponse(url);
    } catch (error) {
      if (error instanceof Error && /must be a positive integer/.test(error.message)) {
        return errorResponse(400, error.message);
      }

      return errorResponse(502, error instanceof Error ? error.message : "Upstream request failed");
    }
  },
};
