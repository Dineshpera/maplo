"""Combine OpenStreetMap offices/buildings/parks/metro, curated offices and live jobs into the site's data files.

Writes:
  site/data/core.json   map, buildings, companies (job counts only), metro, changes  (loaded first)
  site/data/jobs.json   the job lists per company                                     (loaded after the map)
  site/b/<id>/, site/c/<id>/  tiny share pages so WhatsApp / Instagram links show a title and summary

Also keeps a dated snapshot in data/history/ and lists what changed since the previous snapshot.
That history is the part nobody else has.

Usage: python3 pipeline/build.py
"""
import json
import math
import pathlib
import re
import shutil
import time

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
HIST = ROOT / "data" / "history"
SITE = ROOT / "site"
CORE = SITE / "data" / "core.json"
JOBS_OUT = SITE / "data" / "jobs.json"
BRAND = "Maplo"  # also set in site/app.js, index.html and manifest.webmanifest
# Curated office sources were checked by hand on this date unless an office has its own "checked" field.
CURATED_CHECKED = "2026-11-20"
# Public address once deployed, e.g. "https://maplo.in" (no trailing slash). WhatsApp and most link
# previews need an absolute og:image URL; while this is empty, pages point to the image relatively.
SITE_URL = "https://dineshpera.github.io/maplo"

# Entry-level roles, judged from the job title only (no descriptions are stored).
ENTRY_YES = re.compile(r"\b(intern|internship|trainee|graduate|grad|fresher|freshers|junior|jr|entry[- ]level|apprentice|"
                       r"campus|co[- ]?op|associate (software|data|engineer|analyst|developer|consultant|qa|test)\w*|"
                       r"(software|data|qa|test) engineer i|analyst i|developer i|engineer 1|analyst 1)\b", re.I)
ENTRY_NO = re.compile(r"\b(sr|senior|principal|lead|staff|manager|director|head|architect|vp|ii|iii|iv)\b", re.I)

# office=* values worth showing to job seekers and people who sell to offices.
KEEP_OFFICE = {"company", "it", "telecommunication", "research", "coworking", "consulting", "financial",
               "insurance", "engineer", "yes", "employment_agency", "advertising_agency", "logistics",
               "educational_institution", "accountant"}

SECTOR = {"company": "Company", "it": "IT company", "telecommunication": "Telecom", "research": "Research",
          "coworking": "Coworking space", "consulting": "Consulting", "financial": "Finance", "insurance": "Insurance",
          "engineer": "Engineering", "yes": "Office", "employment_agency": "Recruitment agency",
          "advertising_agency": "Advertising", "logistics": "Logistics", "educational_institution": "Training institute",
          "accountant": "Accounting"}

# Rough area labels when a pin is not inside a mapped IT park. Centre points are approximate.
AREAS = [
    ("HITEC City", 17.4474, 78.3762),
    ("Madhapur", 17.4483, 78.3915),
    ("Kondapur", 17.4600, 78.3548),
    ("Gachibowli", 17.4401, 78.3489),
    ("Financial District", 17.4150, 78.3430),
    ("Knowledge City / Raidurg", 17.4330, 78.3790),
]

STOP = re.compile(r"\b(pvt|private|ltd|limited|llp|inc|india|technologies|technology|solutions|services|"
                  r"software|corporation|corp|co|the|global|development|center|centre|office|hyderabad)\b")


def norm(name):
    n = re.sub(r"[^a-z0-9 ]+", " ", name.lower())
    n = STOP.sub(" ", n)
    return re.sub(r"\s+", " ", n).strip()


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:60]


# ---------- geometry ----------
def ring_from_geom(geom):
    return [(p["lat"], p["lon"]) for p in geom]


def stitch(ways):
    """Join open way segments of a multipolygon into closed rings."""
    ways = [w[:] for w in ways if len(w) > 1]
    rings = []
    while ways:
        ring = ways.pop(0)
        changed = True
        while ring[0] != ring[-1] and changed:
            changed = False
            for i, w in enumerate(ways):
                if w[0] == ring[-1]:
                    ring += w[1:]
                elif w[-1] == ring[-1]:
                    ring += w[::-1][1:]
                elif w[-1] == ring[0]:
                    ring = w[:-1] + ring
                elif w[0] == ring[0]:
                    ring = w[::-1][:-1] + ring
                else:
                    continue
                ways.pop(i)
                changed = True
                break
        if len(ring) >= 4 and ring[0] == ring[-1]:
            rings.append(ring)
    return rings


def rings_of(el):
    if el["type"] == "way" and el.get("geometry"):
        r = ring_from_geom(el["geometry"])
        return [r] if len(r) >= 4 and r[0] == r[-1] else []
    if el["type"] == "relation":
        outers = [ring_from_geom(m["geometry"]) for m in el.get("members", [])
                  if m.get("type") == "way" and m.get("role", "outer") in ("outer", "") and m.get("geometry")]
        return stitch(outers)
    return []


def centroid(rings):
    pts = [p for r in rings for p in r[:-1]]
    return (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))


def bbox(rings):
    pts = [p for r in rings for p in r]
    return (min(p[0] for p in pts), min(p[1] for p in pts), max(p[0] for p in pts), max(p[1] for p in pts))


def inside(pt, ring):
    y, x = pt
    hit = False
    for (y1, x1), (y2, x2) in zip(ring, ring[1:]):
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            hit = not hit
    return hit


def area_m2(ring):
    lat0 = math.radians(sum(p[0] for p in ring) / len(ring))
    xy = [(p[1] * 111320 * math.cos(lat0), p[0] * 110540) for p in ring]
    return abs(sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(xy, xy[1:]))) / 2


class Shape:
    def __init__(self, el, rings):
        self.el, self.rings = el, rings
        self.bb = bbox(rings)
        self.area = sum(area_m2(r) for r in rings)

    def contains(self, pt):
        b = self.bb
        if not (b[0] <= pt[0] <= b[2] and b[1] <= pt[1] <= b[3]):
            return False
        return any(inside(pt, r) for r in self.rings)


def smallest_containing(shapes, pt):
    hits = [s for s in shapes if s.contains(pt)]
    return min(hits, key=lambda s: s.area) if hits else None


def nearest_area(pt):
    return min(AREAS, key=lambda a: (a[1] - pt[0]) ** 2 + (a[2] - pt[1]) ** 2)[0]


def footprint(ring, max_pts=24):
    """Building outline as [lon, lat] pairs, thinned to at most max_pts points (for 3D and the camera finder)."""
    step = max(1, len(ring) // max_pts)
    pts = ring[:-1][::step]
    return [[round(p[1], 6), round(p[0], 6)] for p in pts] + [[round(pts[0][1], 6), round(pts[0][0], 6)]]


def metres(a, b):
    """Distance in metres between two (lat, lon) points."""
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(h))


def is_entry(title):
    return bool(ENTRY_YES.search(title or "")) and not ENTRY_NO.search(title or "")


def simplify(ring, step):
    return [[round(p[0], 5), round(p[1], 5)] for p in ring[::step]] + [[round(ring[-1][0], 5), round(ring[-1][1], 5)]]


# ---------- main ----------
def load(path, default):
    return json.loads(path.read_text()) if path.exists() else default


def main():
    osm = load(RAW / "osm.json", {"elements": []})
    jobs = load(RAW / "jobs.json", {"companies": {}})
    employers = load(ROOT / "data" / "employers.json", [])
    els = osm["elements"]

    parks, buildings, offices = [], [], []
    area_by_id = {}
    for el in els:
        t = el.get("tags", {})
        rings = rings_of(el)
        if t.get("landuse") in ("commercial", "industrial") and t.get("name") and rings:
            s = Shape(el, rings)
            area_by_id[f"{el['type'][0]}{el['id']}"] = s
            if 5_000 < s.area < 3_000_000:  # skip tiny plots and whole-district polygons
                parks.append(s)
        if t.get("building") and t.get("name") and rings and "office" not in t:
            buildings.append(Shape(el, rings))
        if t.get("office") in KEEP_OFFICE and t.get("name"):
            if el["type"] == "node":
                pt = (el["lat"], el["lon"])
            elif rings:
                pt = centroid(rings)
            elif el.get("center"):
                pt = (el["center"]["lat"], el["center"]["lon"])
            else:
                continue
            offices.append((el, pt, rings))

    # Office mapped as its own building outline: that outline is the building.
    for el, pt, rings in offices:
        if rings and el["tags"].get("building"):
            buildings.append(Shape(el, rings))

    def park_of(pt):
        p = smallest_containing(parks, pt)
        return p.el["tags"]["name"] if p else None

    # Buildings
    bmap = {}
    for b in buildings:
        t = b.el["tags"]
        bid = f"{b.el['type'][0]}{b.el['id']}"
        c = centroid(b.rings)
        bmap[bid] = {
            "id": bid, "name": t.get("name") or t.get("addr:housename") or "Building", "lat": round(c[0], 6),
            "lon": round(c[1], 6), "park": park_of(c), "area": nearest_area(c),
            "levels": t.get("building:levels"), "companies": [], "fp": footprint(b.rings[0]),
            "source": f"https://www.openstreetmap.org/{b.el['type']}/{b.el['id']}",
        }
    bshapes = {f"{b.el['type'][0]}{b.el['id']}": b for b in buildings}

    # Companies from employers.json (curated, every office has a source link)
    companies = {}
    alias = {}
    for e in employers:
        companies[e["id"]] = {"id": e["id"], "name": e["name"], "website": e.get("website"),
                              "sector": e.get("sector"), "offices": [], "jobs": [], "board": bool(e.get("board"))}
        for a in [e["name"]] + e.get("aliases", []):
            alias[norm(a)] = e["id"]
        for o in e.get("offices", []):
            bid = o.get("osm") if o.get("osm") in bmap else None
            area_el = area_by_id.get(o.get("osm"))
            if not bid and area_el:  # the reference is a campus/park outline, not a single building
                c = centroid(area_el.rings)
                bid = o["osm"]
                bmap[bid] = {"id": bid, "name": o["building"], "lat": round(c[0], 6), "lon": round(c[1], 6),
                             "park": area_el.el["tags"].get("name"), "area": nearest_area(c), "levels": None,
                             "companies": [], "source": f"https://www.openstreetmap.org/{area_el.el['type']}/{area_el.el['id']}"}
            if not bid and o.get("lat"):
                pt = (o["lat"], o["lon"])
                b = smallest_containing(list(bshapes.values()), pt)
                bid = f"{b.el['type'][0]}{b.el['id']}" if b else "c-" + slug(o["building"])
                bmap.setdefault(bid, {"id": bid, "name": o["building"], "lat": o["lat"], "lon": o["lon"],
                                      "park": o.get("park") or park_of(pt), "area": nearest_area(pt),
                                      "levels": None, "companies": [], "source": o["source"]})
            if bid and o.get("building_name"):
                # Display-name fix for a mapped building whose OSM name is wrong (for example vandalised).
                bmap[bid]["name"] = o["building_name"]
            # bid stays None when we know the address but the building is not on the map yet.
            # conf: "verified" = a public page names this building; "area" = only the address/area is published.
            companies[e["id"]]["offices"].append({"building": bid, "label": o["building"], "floor": o.get("floor"),
                                                  "address": o.get("address"), "source": o["source"],
                                                  "via": "curated", "conf": "verified" if bid else "area",
                                                  "checked": o.get("checked", CURATED_CHECKED)})

    # Companies from OSM offices
    for el, pt, rings in offices:
        t = el["tags"]
        key = norm(t["name"]) or t["name"].lower()
        cid = alias.get(key) or next((v for k, v in alias.items() if k and key.startswith(k + " ")), None) \
            or slug(t["name"])
        if cid not in companies:
            companies[cid] = {"id": cid, "name": t["name"], "website": t.get("website") or t.get("contact:website"),
                              "sector": SECTOR.get(t.get("office"), "Office"), "offices": [], "jobs": [], "board": False}
        own = f"{el['type'][0]}{el['id']}"
        if own in bmap:
            bid = own
        else:
            b = smallest_containing(list(bshapes.values()), pt)
            bid = f"{b.el['type'][0]}{b.el['id']}" if b else None
        if not bid:  # office pin not inside a named building: make a pin for it
            bid = own
            label = t.get("addr:housename") or t.get("addr:street") or "Building not named on the map yet"
            bmap[bid] = {"id": bid, "name": label, "lat": round(pt[0], 6), "lon": round(pt[1], 6),
                         "park": park_of(pt), "area": nearest_area(pt), "levels": None, "companies": [],
                         "unnamed": not (t.get("addr:housename") or t.get("addr:street")),
                         "source": f"https://www.openstreetmap.org/{el['type']}/{el['id']}"}
        if not any(o["building"] == bid for o in companies[cid]["offices"]):
            companies[cid]["offices"].append({"building": bid, "label": bmap[bid]["name"],
                                              "floor": t.get("addr:floor") or t.get("level"),
                                              "source": f"https://www.openstreetmap.org/{el['type']}/{el['id']}",
                                              "via": "osm", "conf": "mapped"})

    # Jobs
    partial = set(jobs.get("partial", []))
    for cid, js in jobs.get("companies", {}).items():
        if cid in companies:
            for j in js:
                if is_entry(j.get("title")):
                    j["entry"] = True
            companies[cid]["jobs"] = sorted(js, key=lambda j: j.get("updated") or "", reverse=True)
            if cid in partial:
                companies[cid]["partial"] = True  # Workday sitemaps may list only part of the openings

    for c in companies.values():
        for o in c["offices"]:
            if o["building"] and c["id"] not in bmap[o["building"]]["companies"]:
                bmap[o["building"]]["companies"].append(c["id"])

    used = {b["id"]: b for b in bmap.values() if b["companies"]}
    clist = sorted(companies.values(), key=lambda c: (-len(c["jobs"]), c["name"].lower()))
    # A company whose job board we track stays listed at 0 jobs ("No openings found in our tracked sources")
    # instead of vanishing, even when its building is not published.
    clist = [c for c in clist if c["offices"] or c["jobs"] or c["board"]]

    park_out = []
    for p in parks:
        name = p.el["tags"]["name"]
        n = sum(1 for b in used.values() if b["park"] == name)
        if n:
            ring = max(p.rings, key=len)
            park_out.append({"name": name, "buildings": n, "outline": simplify(ring, max(1, len(ring) // 60)),
                             "source": f"https://www.openstreetmap.org/{p.el['type']}/{p.el['id']}"})

    today = time.strftime("%Y-%m-%d")
    # Snapshot every known company, not only the ones shown today. Otherwise a company with no pinned building
    # drops out on a day its jobs read 0 and comes back the next day as "added to the map".
    snapshot = {c["id"]: {"name": c["name"], "buildings": sorted(o["building"] for o in c["offices"] if o["building"]),
                          "jobs": len(c["jobs"])} for c in companies.values()}
    shown = {c["id"] for c in clist}
    # Each change opens its company in the app, so list only companies the app can open.
    changes = [ch for ch in diff_history(snapshot, today, used) if ch["company"] in shown]

    metro = metro_of(load(RAW / "metro.json", {"elements": []}))
    for b in used.values():
        if metro["stations"]:
            st = min(metro["stations"], key=lambda s: metres((b["lat"], b["lon"]), (s["lat"], s["lon"])))
            # Straight-line distance x1.3 for streets, at 80 m a minute. Shown as an estimate.
            mins = math.ceil(metres((b["lat"], b["lon"]), (st["lat"], st["lon"])) * 1.3 / 80)
            if mins <= 25:
                b["metro"] = [st["name"], mins]

    pinned = [c for c in clist if c["jobs"] and any(o["building"] for o in c["offices"])]
    counts = {"companies": len(clist), "buildings": len(used), "parks": len(park_out),
              "hiring": sum(1 for c in clist if c["jobs"]), "jobs": sum(len(c["jobs"]) for c in clist),
              "pinned_hiring": len(pinned), "pinned_jobs": sum(len(c["jobs"]) for c in pinned),
              "entry": sum(1 for c in clist for j in c["jobs"] if j.get("entry"))}
    jobs_out = {c["id"]: c["jobs"] for c in clist if c["jobs"]}
    core_companies = []
    for c in clist:
        cc = {k: v for k, v in c.items() if k != "jobs"}
        cc["nj"] = len(c["jobs"])
        if any(j.get("entry") for j in c["jobs"]):
            cc["ne"] = sum(1 for j in c["jobs"] if j.get("entry"))
        core_companies.append(cc)
    core = {
        "generated": today, "osm_date": osm.get("fetched_at"), "jobs_date": jobs.get("fetched_at"),
        "counts": counts, "parks": park_out, "buildings": list(used.values()), "companies": core_companies,
        "metro": metro, "changes": changes,
    }
    CORE.parent.mkdir(parents=True, exist_ok=True)
    CORE.write_text(json.dumps(core, ensure_ascii=False, separators=(",", ":")))
    JOBS_OUT.write_text(json.dumps({"fetched_at": jobs.get("fetched_at"), "companies": jobs_out},
                                   ensure_ascii=False, separators=(",", ":")))
    old = SITE / "data" / "ekkada.json"
    if old.exists():
        old.unlink()
    n_pages = share_pages(used, clist)
    stamp_site_url()
    print(json.dumps(counts))
    print(f"-> {CORE} ({CORE.stat().st_size // 1024} KB), {JOBS_OUT} ({JOBS_OUT.stat().st_size // 1024} KB), {n_pages} share pages")


def metro_of(raw):
    stations, lines = [], []
    for el in raw.get("elements", []):
        t = el.get("tags", {})
        if el["type"] == "node" and t.get("name"):
            stations.append({"name": t["name"], "lat": round(el["lat"], 6), "lon": round(el["lon"], 6)})
        elif el["type"] == "way" and el.get("geometry"):
            lines.append([[round(p["lon"], 5), round(p["lat"], 5)] for p in el["geometry"]])
    return {"stations": stations, "lines": lines}


def stamp_site_url():
    """Once SITE_URL is set, make the home page's og:image (and og:url) absolute so link previews show the picture."""
    index = SITE / "index.html"
    html = index.read_text()
    img = f"{SITE_URL}/icons/og.png" if SITE_URL else "icons/og.png"
    html = re.sub(r'<meta property="og:image" content="[^"]*">', f'<meta property="og:image" content="{img}">', html)
    html = re.sub(r'\n<meta property="og:url" content="[^"]*">', "", html)
    if SITE_URL:
        html = html.replace('<meta property="og:type"', f'<meta property="og:url" content="{SITE_URL}/">\n<meta property="og:type"', 1)
    index.write_text(html)


def share_pages(buildings, clist):
    """Small static pages per building and company: link previews in WhatsApp need a real page with a title.

    Each page sends the visitor straight on to the app (../../#b=<id>), so the app stays one page.
    """
    img = f"{SITE_URL}/icons/og.png" if SITE_URL else "../../icons/og.png"

    def page(title, desc, target, path=""):
        url_tag = f'<meta property="og:url" content="{SITE_URL}/{path}">' if SITE_URL else ""
        e = lambda s: (s or "").replace("&", "&amp;").replace("<", "&lt;").replace('"', "&quot;")
        return (f'<!doctype html><html lang="en"><head><meta charset="utf-8">'
                f'<meta name="viewport" content="width=device-width, initial-scale=1"><title>{e(title)}</title>'
                f'<meta name="description" content="{e(desc)}"><meta property="og:title" content="{e(title)}">'
                f'<meta property="og:description" content="{e(desc)}"><meta property="og:type" content="website">'
                f'<meta property="og:site_name" content="{BRAND}"><meta property="og:image" content="{img}">'
                f'<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'
                f'<meta name="twitter:card" content="summary_large_image">{url_tag}'
                f'<meta http-equiv="refresh" content="0; url=../../{target}"></head>'
                f'<body><script>location.replace("../../{target}")</script>'
                f'<p><a href="../../{target}">{e(title)}</a></p></body></html>')

    by_id = {c["id"]: c for c in clist}
    n = 0
    for kind in ("b", "c"):
        shutil.rmtree(SITE / kind, ignore_errors=True)
    for b in buildings.values():
        cs = sorted((by_id[i] for i in b["companies"] if i in by_id), key=lambda c: -len(c["jobs"]))
        nj = sum(len(c["jobs"]) for c in cs)
        name = "Unnamed building" if b.get("unnamed") else b["name"]
        where = b.get("park") or b.get("area") or "Hyderabad"
        title = f"{name}, {where}: " + (f"{nj} open job{'s' if nj != 1 else ''}" if nj else f"{len(cs)} compan{'ies' if len(cs) != 1 else 'y'}") + f" | {BRAND}"
        desc = "Inside: " + ", ".join(c["name"] + (f" ({len(c['jobs'])} jobs)" if c["jobs"] else "") for c in cs[:6])
        d = SITE / "b" / b["id"]
        d.mkdir(parents=True, exist_ok=True)
        (d / "index.html").write_text(page(title, desc, f"#b={b['id']}", f"b/{b['id']}/"))
        n += 1
    for c in clist:
        bs = [buildings[o["building"]]["name"] for o in c["offices"] if o["building"] in buildings]
        status = (f"{len(c['jobs'])} open job{'s' if len(c['jobs']) != 1 else ''}" if c["jobs"]
                  else "office" if bs else "no openings found right now")
        title = f"{c['name']} in Hyderabad: {status} | {BRAND}"
        desc = ("Office: " + "; ".join(bs[:3]) + ". " if bs else "") + "Every job links to the employer's own posting."
        d = SITE / "c" / c["id"]
        d.mkdir(parents=True, exist_ok=True)
        (d / "index.html").write_text(page(title, desc, f"#c={c['id']}", f"c/{c['id']}/"))
        n += 1
    return n


def diff_history(snapshot, today, buildings):
    HIST.mkdir(parents=True, exist_ok=True)
    prev_files = sorted(p for p in HIST.glob("*.json") if p.stem != today)
    (HIST / f"{today}.json").write_text(json.dumps(snapshot, ensure_ascii=False, indent=0, sort_keys=True))
    if not prev_files:
        return []
    prev = json.loads(prev_files[-1].read_text())
    since = prev_files[-1].stem
    ch = []
    bname = lambda bid: buildings.get(bid, {}).get("name", "a building")
    for cid, now in snapshot.items():
        was = prev.get(cid)
        if not was:
            ch.append({"type": "new_company", "company": cid, "name": now["name"],
                       "where": [bname(b) for b in now["buildings"]], "since": since})
            continue
        # A newly listed building is "office added": we only know it was mapped, not that the company moved.
        for b in set(now["buildings"]) - set(was["buildings"]):
            ch.append({"type": "office_added", "company": cid, "name": now["name"], "where": [bname(b)], "since": since})
        if was["jobs"] == 0 and now["jobs"] > 0:
            ch.append({"type": "started_hiring", "company": cid, "name": now["name"], "jobs": now["jobs"], "since": since})
        elif was["jobs"] > 0 and now["jobs"] == 0:
            ch.append({"type": "no_openings", "company": cid, "name": now["name"], "was": was["jobs"], "since": since})
        elif now["jobs"] - was["jobs"] >= 5:
            ch.append({"type": "more_jobs", "company": cid, "name": now["name"],
                       "jobs": now["jobs"], "was": was["jobs"], "since": since})
        elif was["jobs"] - now["jobs"] >= 5:
            ch.append({"type": "fewer_jobs", "company": cid, "name": now["name"],
                       "jobs": now["jobs"], "was": was["jobs"], "since": since})
    for cid, was in prev.items():
        if cid not in snapshot:
            ch.append({"type": "removed", "company": cid, "name": was["name"], "since": since})
    return ch[:200]


if __name__ == "__main__":
    main()
