"""Pull open Hyderabad jobs from employers' own public job boards (Greenhouse, Lever, Ashby, Workable).

These are the boards' published job-listing APIs, made for job sites to read. robots.txt checked on 19 Nov 2026:
  boards-api.greenhouse.io  -> only /embed/ disallowed
  api.lever.co              -> Allow: /, Crawl-delay: 1
  apply.workable.com        -> Disallow: (nothing)
  <tenant>.wdN.myworkdayjobs.com -> robots.txt lists Sitemap: URLs for crawlers; we read only those
  api.ashbyhq.com           -> public job-posting API documented by Ashby for job boards
SmartRecruiters is NOT used: api.smartrecruiters.com robots.txt disallows everyone except LinkedInBot.
We keep only title, location, link and date, and always link back to the employer's own posting.

Usage: python3 pipeline/fetch_jobs.py   -> data/raw/jobs.json
"""
import datetime
import json
import pathlib
import time
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
EMPLOYERS = ROOT / "data" / "employers.json"
OUT = ROOT / "data" / "raw" / "jobs.json"
UA = {"User-Agent": "Maplo/0.1 (open map of Hyderabad tech companies; daily job)"}
CITY = ("hyderabad", "secunderabad", "gachibowli", "madhapur", "hitec city", "hitec-city", "hi-tec-city")


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        return json.load(r)


def is_hyd(text):
    t = (text or "").lower()
    return any(c in t for c in CITY)


def greenhouse(token):
    jobs = get(f"https://boards-api.greenhouse.io/v1/boards/{token}/jobs").get("jobs", [])
    return [
        {"title": j["title"], "location": j["location"]["name"], "url": j["absolute_url"],
         "updated": (j.get("updated_at") or "")[:10]}
        for j in jobs if is_hyd(j.get("location", {}).get("name"))
    ]


def lever(token):
    jobs = get(f"https://api.lever.co/v0/postings/{token}?mode=json")
    out = []
    for j in jobs:
        c = j.get("categories", {})
        locs = " / ".join([c.get("location") or ""] + (c.get("allLocations") or []))
        if is_hyd(locs):
            out.append({"title": j["text"], "location": c.get("location") or locs, "url": j["hostedUrl"],
                        "team": c.get("team"),
                        "updated": time.strftime("%Y-%m-%d", time.gmtime(j.get("createdAt", 0) / 1000))})
    return out


def ashby(token):
    """Ashby's documented public job-posting API (made for careers pages and job boards)."""
    jobs = get(f"https://api.ashbyhq.com/posting-api/job-board/{token}").get("jobs", [])
    out = []
    for j in jobs:
        locs = [j.get("location") or ""] + [s.get("location", "") for s in j.get("secondaryLocations") or []]
        city = ((j.get("address") or {}).get("postalAddress") or {}).get("addressLocality") or ""
        if is_hyd(" / ".join(locs) + " " + city):
            out.append({"title": j["title"], "location": " / ".join(l for l in locs if l) or city,
                        "url": j.get("jobUrl"), "team": j.get("department") or j.get("team"),
                        "updated": (j.get("publishedAt") or "")[:10]})
    return out


def workable(token):
    """Workable's public careers widget feed (apply.workable.com robots.txt allows everything)."""
    jobs = get(f"https://apply.workable.com/api/v1/widget/accounts/{token}").get("jobs", [])
    out = []
    for j in jobs:
        locs = [", ".join(x for x in (l.get("city"), l.get("region") or l.get("state")) if x) for l in j.get("locations") or []]
        locs = locs or [", ".join(x for x in (j.get("city"), j.get("state")) if x)]
        if is_hyd(" / ".join(locs)):
            out.append({"title": j["title"], "location": " / ".join(locs), "url": j.get("url") or j.get("application_url"),
                        "team": j.get("department"), "updated": (j.get("published_on") or j.get("created_at") or "")[:10]})
    return out


def workday(board):
    """Workday career sites: read only the sitemaps that the site's own robots.txt offers to crawlers.

    Job URLs look like .../<site>/job/India---Hyderabad/Title-Words_R-12345, so the city and title come
    from the URL itself. Workday sitemaps can list only part of a company's openings, so the site shows
    these counts as "at least".
    """
    import re
    out, seen, listed = [], set(), 0
    for sm in board["sitemaps"]:
        with urllib.request.urlopen(urllib.request.Request(sm, headers=UA), timeout=40) as r:
            xml = r.read().decode("utf8", "ignore")
        if "<urlset" not in xml:
            # During Workday maintenance a sitemap URL can answer 200 with a holding page instead of XML.
            raise ValueError(f"not a sitemap: {sm}")
        locs = re.findall(r"<loc>([^<]+)</loc>", xml)
        listed += len(locs)
        for loc in locs:
            m = re.search(r"/job/([^/]+)/([^/?]+)$", loc)
            if not m or not is_hyd(m.group(1)) or m.group(2) in seen:
                continue
            seen.add(m.group(2))  # same job can appear on several career sites of one company
            title = re.sub(r"_[A-Z]*-?\d[\w-]*$", "", m.group(2))
            title = re.sub(r"-{2,}", " – ", title).replace("-", " ").strip()
            place = m.group(1).replace("---", ", ").replace("-", " ")
            out.append({"title": title, "location": place, "url": loc, "updated": ""})
        time.sleep(1)
    if not listed:
        raise ValueError("sitemaps list no jobs at all")  # an empty board is a broken feed, not a hiring stop
    return out


FETCHERS = {"greenhouse": greenhouse, "lever": lever, "ashby": ashby, "workable": workable, "workday": workday}


HOLD_DAYS = 2  # how many days a sudden drop to 0 is treated as a feed problem before we believe it


def main():
    employers = json.loads(EMPLOYERS.read_text())
    previous = json.loads(OUT.read_text()) if OUT.exists() else {"companies": {}, "partial": []}
    today = time.strftime("%Y-%m-%d")
    result = {"fetched_at": today, "companies": {}, "partial": []}
    held_before = previous.get("held", {})
    for e in employers:
        board = e.get("board")
        if not board:
            continue
        try:
            fn = FETCHERS[board["ats"]]
            jobs = fn(board) if board["ats"] == "workday" else fn(board["token"])
            was_jobs = previous.get("companies", {}).get(e["id"], [])
            was = len(was_jobs)
            if was >= 10 and not jobs:
                # Usually a feed outage (Workday maintenance emptied 12 boards on 21 Nov 2026), not a hiring stop.
                # Keep the last good jobs for up to HOLD_DAYS days; if the board is still empty after that, believe it.
                since = held_before.get(e["id"], today)
                waited = (datetime.date.fromisoformat(today) - datetime.date.fromisoformat(since)).days
                if waited < HOLD_DAYS:
                    jobs = was_jobs
                    result.setdefault("held", {})[e["id"]] = since
                    note = f"{e['id']}: {was} jobs before, 0 today; kept previous jobs (held since {since})"
                else:
                    note = f"{e['id']}: still 0 jobs after {waited} days held; now showing 0"
                result.setdefault("warnings", []).append(note)
                print(f"WARNING {note}")
            result["companies"][e["id"]] = jobs
            if board["ats"] == "workday":
                result["partial"].append(e["id"])
            print(f"{e['name']:<24} {len(jobs):>4} Hyderabad jobs")
        except Exception as ex:
            # A busy or timed-out board should not wipe a company's jobs: keep the last good fetch.
            result.setdefault("failed", {})[e["id"]] = str(ex)[:120]  # read by pipeline/check.py
            if e["id"] in previous.get("companies", {}):
                result["companies"][e["id"]] = previous["companies"][e["id"]]
                if e["id"] in previous.get("partial", []):
                    result["partial"].append(e["id"])
            print(f"{e['name']:<24} failed ({str(ex)[:50]}); kept previous jobs")
        time.sleep(1.2)  # be polite (Lever asks for 1s)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=1))
    total = sum(len(v) for v in result["companies"].values())
    print(f"wrote {OUT}: {total} jobs")


if __name__ == "__main__":
    main()
