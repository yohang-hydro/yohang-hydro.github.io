#!/usr/bin/env python3
"""Refresh data/scholar.json from the public Google Scholar profile.

Keeps one dated snapshot per month so later charts can show a real monthly
line. Leaves the existing file untouched when the fetch is blocked or this
month's snapshot is already current.
"""

import json
import os
import re
import sys
import urllib.error
import urllib.request
from collections import Counter
from datetime import date
from pathlib import Path

SCHOLAR_ID = os.environ.get("SCHOLAR_ID", "lvwCoy8AAAAJ")
PROFILE_URL = f"https://scholar.google.com/citations?user={SCHOLAR_ID}&hl=en"
OUTPUT = Path(os.environ.get("SCHOLAR_JSON", "data/scholar.json"))
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
)


def fail(message):
    print(message, file=sys.stderr)
    sys.exit(1)


def fetch_profile():
    url = PROFILE_URL + "&cstart=0&pagesize=100"
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            html = response.read().decode("utf-8", "replace")
    except urllib.error.URLError as error:
        fail(f"Could not reach Google Scholar: {error}")
    lowered = html.lower()
    if "unusual traffic" in lowered or "captcha" in lowered or 'id="gsc_rsb_st"' not in html:
        fail("Google Scholar did not return a profile page. Leaving the last stats in place.")
    return html


def parse_profile(html):
    table = re.search(r'id="gsc_rsb_st".*?</table>', html, re.S)
    if not table:
        fail("Google Scholar stats table was missing.")
    totals = re.findall(
        r'class="gsc_rsb_std">([\d,]+)</td><td class="gsc_rsb_std">[\d,]+</td>',
        table.group(0),
    )
    if len(totals) < 3:
        fail("Google Scholar stats table did not include citations, h-index, and i10-index.")
    citations, h_index, i10_index = (int(value.replace(",", "")) for value in totals[:3])

    chart = re.search(r'class="gsc_md_hist_b"(.*?)</div>', html, re.S)
    if not chart:
        fail("Google Scholar citation chart was missing.")
    years = [int(year) for year in re.findall(r'class="gsc_g_t"[^>]*>(\d{4})', chart.group(1))]
    year_counts = [
        int(count.replace(",", ""))
        for count in re.findall(r'class="gsc_g_al"[^>]*>([\d,]+)', chart.group(1))
    ]
    if not years or len(years) != len(year_counts):
        fail("Google Scholar citation chart years and counts did not match.")

    count_label = re.search(
        r'id="gsc_a_nn">Articles\s+1(?:&ndash;|–|-)\s*(\d+)(?:\s+of\s+(\d+))?',
        html,
    )
    if not count_label:
        fail("Google Scholar publication count was missing.")
    if count_label.group(2):
        publications = int(count_label.group(2))
    elif re.search(r'id="gsc_bpf_more"[^>]*\bdisabled\b', html):
        publications = int(count_label.group(1))
    else:
        fail("Google Scholar publication list was incomplete, so the count was not saved.")

    publication_years = [
        int(year)
        for year in re.findall(
            r'class="gsc_a_y"[^>]*>\s*<span[^>]*>(\d{4})</span>',
            html,
        )
    ]
    if len(publication_years) != publications:
        fail("Google Scholar publication years did not match the publication count.")
    year_counts_by_publication = Counter(publication_years)
    first_year = min(year_counts_by_publication)
    last_year = max(year_counts_by_publication)

    return {
        "updated": date.today().isoformat(),
        "profileUrl": PROFILE_URL,
        "publications": publications,
        "citations": citations,
        "hIndex": h_index,
        "i10Index": i10_index,
        "citationsByYear": [
            {"year": year, "citations": count}
            for year, count in zip(years, year_counts)
        ],
        "publicationsByYear": [
            {"year": year, "publications": year_counts_by_publication.get(year, 0)}
            for year in range(first_year, last_year + 1)
        ],
    }


def merge_snapshots(previous, current):
    """Keep one reading per calendar month. A later week in the same month
    replaces that month only when the totals change."""
    by_month = {}
    if previous:
        for item in previous.get("snapshots") or []:
            date = str(item.get("date", ""))
            if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date):
                continue
            try:
                citations = int(item["citations"])
                publications = int(item["publications"])
            except (KeyError, TypeError, ValueError):
                continue
            by_month[date[:7]] = {
                "date": date,
                "citations": citations,
                "publications": publications,
            }
    month = current["updated"][:7]
    reading = {
        "date": current["updated"],
        "citations": current["citations"],
        "publications": current["publications"],
    }
    existing = by_month.get(month)
    if existing is None or (
        existing["citations"],
        existing["publications"],
    ) != (reading["citations"], reading["publications"]):
        by_month[month] = reading
    current["snapshots"] = [by_month[key] for key in sorted(by_month)]
    return current


def unchanged(previous, current):
    fields = (
        "publications",
        "citations",
        "hIndex",
        "i10Index",
        "citationsByYear",
        "publicationsByYear",
        "snapshots",
        "profileUrl",
    )
    return all(previous.get(field) == current.get(field) for field in fields)


def main():
    current = parse_profile(fetch_profile())
    previous = json.loads(OUTPUT.read_text()) if OUTPUT.exists() else None
    merge_snapshots(previous, current)
    if previous and unchanged(previous, current):
        print("Google Scholar stats are unchanged.")
        return
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(current, indent=2) + "\n")
    print(
        f"Wrote {OUTPUT}: {current['publications']} publications, "
        f"{current['citations']} citations, {len(current['snapshots'])} monthly snapshots."
    )


if __name__ == "__main__":
    main()
