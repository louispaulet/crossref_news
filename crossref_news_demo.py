#!/usr/bin/env python3
"""Crossref news briefing demo.

Fetches recent scholarly metadata for fraud-detection-adjacent topics and
prints a deduplicated terminal briefing.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import unicodedata
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


API_URL = "https://api.crossref.org/works"
DEFAULT_DAYS = 7
DEFAULT_ROWS_PER_QUERY = 25
DEFAULT_TERMS = [
    "fraud detection",
    "credit card fraud",
    "xgboost fraud",
    "chargeback",
    "payment fraud",
    "payment service provider",
    "payment processing fraud",
    "graph machine learning fraud",
]
TYPE_PRIORITY = {
    "journal-article": 0,
    "proceedings-article": 1,
    "book-chapter": 2,
    "book": 3,
    "report": 4,
    "posted-content": 5,
    "reference-entry": 6,
}


@dataclass
class Record:
    title: str
    doi: str
    url: str
    container: str
    authors: list[str]
    published: str
    item_type: str
    matched_terms: set[str] = field(default_factory=set)
    raw: dict[str, Any] = field(default_factory=dict)

    @property
    def title_key(self) -> str:
        return normalize_text(self.title)

    @property
    def doi_key(self) -> str:
        return normalize_doi(self.doi)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Query Crossref for recent fraud-detection-related publications."
    )
    parser.add_argument(
        "--days",
        type=int,
        default=DEFAULT_DAYS,
        help="How many recent days to search (default: 7).",
    )
    parser.add_argument(
        "--rows-per-query",
        type=int,
        default=DEFAULT_ROWS_PER_QUERY,
        help="How many Crossref rows to request per search term (default: 25).",
    )
    parser.add_argument(
        "--term",
        action="append",
        dest="terms",
        help="Extra query term to include. May be repeated.",
    )
    parser.add_argument(
        "--mailto",
        default=os.environ.get("CROSSREF_MAILTO", "").strip(),
        help="Contact email for polite Crossref access. Falls back to CROSSREF_MAILTO.",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=20.0,
        help="HTTP timeout in seconds (default: 20).",
    )
    parser.add_argument(
        "--max-results",
        type=int,
        default=25,
        help="Maximum deduplicated items to print (default: 25).",
    )
    return parser.parse_args()


def normalize_text(value: str) -> str:
    text = unicodedata.normalize("NFKD", value)
    text = text.lower()
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def normalize_doi(value: str) -> str:
    value = value.strip().lower()
    value = value.removeprefix("https://doi.org/")
    value = value.removeprefix("http://doi.org/")
    value = value.removeprefix("doi:")
    return value.strip()


def build_user_agent(mailto: str | None) -> str:
    base = "crossref_news_demo/1.0"
    if mailto:
        return f"{base} (mailto:{mailto})"
    return base


def fetch_crossref_items(
    term: str,
    from_date: date,
    until_date: date,
    rows: int,
    mailto: str | None,
    timeout: float,
) -> list[dict[str, Any]]:
    params = {
        "query.title": term,
        "filter": f"from-pub-date:{from_date.isoformat()},until-pub-date:{until_date.isoformat()}",
        "rows": str(rows),
        "sort": "published",
        "order": "desc",
    }
    if mailto:
        params["mailto"] = mailto

    url = f"{API_URL}?{urlencode(params)}"
    request = Request(url, headers={"User-Agent": build_user_agent(mailto)})
    attempts = 0
    while True:
        try:
            with urlopen(request, timeout=timeout) as response:
                payload = json.load(response)
            return payload.get("message", {}).get("items", [])
        except HTTPError as error:
            attempts += 1
            if error.code == 429 and attempts < 3:
                retry_after = error.headers.get("Retry-After", "1")
                try:
                    sleep_for = float(retry_after)
                except ValueError:
                    sleep_for = 1.0
                time.sleep(sleep_for)
                continue
            raise RuntimeError(
                f"Crossref request failed for '{term}' with HTTP {error.code}: {error.reason}"
            ) from error
        except URLError as error:
            attempts += 1
            if attempts < 3:
                time.sleep(1.0 * attempts)
                continue
            raise RuntimeError(f"Crossref request failed for '{term}': {error.reason}") from error


def extract_authors(item: dict[str, Any]) -> list[str]:
    authors = []
    for author in item.get("author", [])[:4]:
        given = author.get("given", "").strip(" ,.;:")
        family = author.get("family", "").strip(" ,.;:")
        name = " ".join(part for part in [given, family] if part)
        if not name:
            name = author.get("name", "").strip(" ,.;:")
        if name:
            authors.append(name)
    return authors


def extract_date(item: dict[str, Any]) -> str:
    for field_name in (
        "published-print",
        "published-online",
        "published",
        "created",
        "posted",
        "issued",
    ):
        value = item.get(field_name)
        if value and value.get("date-parts"):
            parts = value["date-parts"][0]
            return "-".join(f"{part:02d}" if index else f"{part:04d}" for index, part in enumerate(parts))
    return "unknown date"


def choose_container(item: dict[str, Any]) -> str:
    containers = item.get("container-title") or []
    if containers:
        return containers[0]
    short_titles = item.get("short-container-title") or []
    if short_titles:
        return short_titles[0]
    return item.get("publisher", "")


def record_from_item(item: dict[str, Any], matched_term: str) -> Record:
    title = " ".join(item.get("title") or ["Untitled"]).strip()
    doi = item.get("DOI", "").strip()
    url = item.get("URL", "").strip() or (f"https://doi.org/{doi}" if doi else "")
    record = Record(
        title=title or "Untitled",
        doi=doi,
        url=url,
        container=choose_container(item),
        authors=extract_authors(item),
        published=extract_date(item),
        item_type=item.get("type", "unknown"),
        matched_terms={matched_term},
        raw=item,
    )
    return record


def is_relevant(record: Record) -> bool:
    title = normalize_text(record.title)
    if not title:
        return False

    strong_phrases = (
        "fraud detection",
        "credit card fraud",
        "chargeback fraud",
        "payment fraud",
        "payment processing",
        "payment service provider",
        "xgboost fraud",
        "graph neural",
        "graph machine learning",
    )
    if any(phrase in title for phrase in strong_phrases):
        return True

    if "fraud" in title and any(
        token in title for token in ("payment", "card", "chargeback", "detection", "digital", "transaction", "financial")
    ):
        return True

    if "xgboost" in title and any(token in title for token in ("fraud", "payment", "card", "chargeback", "credit")):
        return True

    if "graph" in title and any(token in title for token in ("fraud", "payment", "card", "chargeback")):
        return True

    if "payment" in title and any(token in title for token in ("fraud", "fake", "detector", "detection", "chargeback")):
        return True

    return False


def classify_topics(record: Record) -> set[str]:
    title = normalize_text(record.title)
    topics: set[str] = set()

    if "credit card" in title and "fraud" in title:
        topics.add("credit card fraud")

    if "chargeback" in title:
        topics.add("chargeback")

    if "payment service provider" in title:
        topics.add("payment service provider")

    if "payment processing" in title and "fraud" in title:
        topics.add("payment processing fraud")

    if "payment" in title and any(token in title for token in ("fraud", "fake", "detector", "detection")):
        topics.add("payment fraud")

    if "xgboost" in title and any(token in title for token in ("fraud", "payment", "card", "chargeback", "credit", "detection")):
        topics.add("xgboost fraud")

    if "graph" in title and any(token in title for token in ("fraud", "payment", "card", "chargeback", "detection")):
        topics.add("graph machine learning fraud")

    if "fraud" in title and any(
        token in title for token in ("detection", "payment", "card", "chargeback", "digital", "transaction", "financial", "smart contract")
    ):
        topics.add("fraud detection")

    return topics


def score_record(record: Record) -> tuple[int, int, int, int]:
    type_rank = TYPE_PRIORITY.get(record.item_type, 10)
    has_doi = 0 if record.doi else 1
    container_rank = 0 if record.container else 1
    preprint_penalty = 1 if looks_like_preprint(record) else 0
    return (type_rank, preprint_penalty, has_doi, container_rank)


def looks_like_preprint(record: Record) -> bool:
    haystack = " ".join(
        [
            record.item_type,
            record.title,
            record.container,
            " ".join(record.authors),
        ]
    ).lower()
    return any(marker in haystack for marker in ("preprint", "arxiv", "medrxiv", "biorxiv", "ssrn"))


def merge_records(records: list[Record]) -> Record:
    best = min(records, key=score_record)
    merged_terms: set[str] = set()
    for record in records:
        merged_terms.update(record.matched_terms)
    best.matched_terms = merged_terms
    return best


def dedupe_records(records: list[Record]) -> list[Record]:
    clusters: list[list[Record]] = []
    for record in records:
        matching_indexes: list[int] = []
        for index, cluster in enumerate(clusters):
            for existing in cluster:
                same_doi = record.doi_key and existing.doi_key and record.doi_key == existing.doi_key
                same_title = record.title_key and existing.title_key and record.title_key == existing.title_key
                if same_doi or same_title:
                    matching_indexes.append(index)
                    break
        if not matching_indexes:
            clusters.append([record])
            continue
        first = matching_indexes[0]
        clusters[first].append(record)
        for index in reversed(matching_indexes[1:]):
            clusters[first].extend(clusters.pop(index))
    return [merge_records(cluster) for cluster in clusters]


def unique_records(
    terms: list[str],
    from_date: date,
    until_date: date,
    rows: int,
    mailto: str | None,
    timeout: float,
) -> list[Record]:
    raw_records: list[Record] = []
    seen_pairs: set[tuple[str, str]] = set()

    for term in terms:
        items = fetch_crossref_items(term, from_date, until_date, rows, mailto, timeout)
        for item in items:
            record = record_from_item(item, term)
            if not is_relevant(record):
                continue
            record.matched_terms = classify_topics(record) or {term}
            pair = (record.doi_key, record.title_key)
            if pair in seen_pairs:
                continue
            seen_pairs.add(pair)
            raw_records.append(record)

    return dedupe_records(raw_records)


def format_authors(authors: list[str]) -> str:
    if not authors:
        return "author unknown"
    if len(authors) == 1:
        return authors[0]
    if len(authors) == 2:
        return f"{authors[0]} and {authors[1]}"
    return f"{authors[0]}, {authors[1]}, et al."


def format_terms(terms: set[str]) -> str:
    ordered = sorted(terms)
    if not ordered:
        return ""
    return ", ".join(ordered)


def dedupe_preserve_order(values: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for value in values:
        if value in seen:
            continue
        seen.add(value)
        ordered.append(value)
    return ordered


def print_briefing(records: list[Record], terms: list[str], from_date: date, until_date: date, max_results: int) -> None:
    print("Crossref fraud-detection briefing")
    print(f"Window: {from_date.isoformat()} to {until_date.isoformat()}")
    print(f"Topics: {', '.join(terms)}")
    print(f"Results: {len(records)} unique records")
    print()

    for index, record in enumerate(records[:max_results], start=1):
        print(f"{index}. {record.title}")
        print(f"   Date: {record.published}")
        print(f"   Venue: {record.container or 'unknown venue'}")
        print(f"   Authors: {format_authors(record.authors)}")
        if record.doi:
            print(f"   DOI: {record.doi}")
        if record.url:
            print(f"   Link: {record.url}")
        if record.matched_terms:
            print(f"   Matched: {format_terms(record.matched_terms)}")
        print(f"   Type: {record.item_type}")
        print()

    if len(records) > max_results:
        print(f"... {len(records) - max_results} more unique records not shown")


def sort_key(record: Record) -> tuple[int, tuple[int, int, int, int], str]:
    try:
        parsed = date.fromisoformat(record.published[:10])
        date_rank = parsed.toordinal()
    except ValueError:
        date_rank = 0
    # Lower score_record values are better, so negate them for descending sort.
    rank = tuple(-value for value in score_record(record))
    return (date_rank, rank, record.title.lower())


def main() -> int:
    args = parse_args()
    if args.days <= 0:
        print("--days must be positive", file=sys.stderr)
        return 2
    if args.rows_per_query <= 0:
        print("--rows-per-query must be positive", file=sys.stderr)
        return 2
    if args.max_results <= 0:
        print("--max-results must be positive", file=sys.stderr)
        return 2

    terms = list(DEFAULT_TERMS)
    if args.terms:
        terms.extend(args.terms)
    terms = dedupe_preserve_order(terms)

    until_date = date.today()
    from_date = until_date - timedelta(days=args.days - 1)

    try:
        records = unique_records(
            terms=terms,
            from_date=from_date,
            until_date=until_date,
            rows=args.rows_per_query,
            mailto=args.mailto or None,
            timeout=args.timeout,
        )
    except RuntimeError as error:
        print(str(error), file=sys.stderr)
        return 1

    records.sort(key=sort_key, reverse=True)
    print_briefing(records, terms, from_date, until_date, args.max_results)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
