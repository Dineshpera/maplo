"""Fetch offices, named buildings and IT-park areas in the Hyderabad tech corridor from OpenStreetMap.

Data © OpenStreetMap contributors, ODbL 1.0. Public Overpass servers ask automated users to be gentle,
so this runs weekly (not daily), tries several mirrors, and backs off when they are busy.

Usage: python3 pipeline/fetch_osm.py   -> data/raw/osm.json
"""
import json
import pathlib
import sys
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "raw" / "osm.json"
METRO_OUT = ROOT / "data" / "raw" / "metro.json"

# HITEC City, Madhapur, Mindspace, Kondapur, Gachibowli, Financial District, Nanakramguda, Raidurg.
BBOX = "17.395,78.330,17.465,78.400"

QUERY = f"""
[out:json][timeout:150];
(
  nwr["office"]({BBOX});
  way["building"]["name"]({BBOX});
  relation["building"]["name"]({BBOX});
  way["landuse"~"^(commercial|industrial)$"]["name"]({BBOX});
  relation["landuse"~"^(commercial|industrial)$"]["name"]({BBOX});
);
out tags geom;
"""

# Hyderabad Metro stations and Line 3 track, slightly wider so Madhapur / Peddamma Gudi are included.
METRO_QUERY = """
[out:json][timeout:60];
(
  node["railway"="station"]["network"="Hyderabad Metro"](17.39,78.32,17.47,78.42);
  way["railway"="subway"]["network"="Hyderabad Metro"](17.39,78.32,17.47,78.42);
);
out tags geom;
"""

MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]
UA = "Maplo/0.1 (open map of Hyderabad tech companies; weekly job)"


def fetch(query=QUERY, max_rounds=6):
    wait = 30
    for rnd in range(max_rounds):
        for url in MIRRORS:
            body = urllib.parse.urlencode({"data": query}).encode()
            req = urllib.request.Request(url, data=body, headers={"User-Agent": UA})
            try:
                with urllib.request.urlopen(req, timeout=200) as r:
                    data = json.load(r)
                if data.get("elements"):
                    print(f"ok from {url}: {len(data['elements'])} elements")
                    return data
            except Exception as e:  # busy mirror, timeout, HTML error page
                print(f"round {rnd + 1}: {url} failed: {str(e)[:80]}")
        print(f"all mirrors busy, waiting {wait}s")
        time.sleep(wait)
        wait = min(wait * 2, 600)
    return None


def main():
    data = fetch()
    if not data:
        print("Overpass unavailable; keeping the previous data/raw/osm.json", file=sys.stderr)
        sys.exit(0 if OUT.exists() else 1)
    data["fetched_at"] = time.strftime("%Y-%m-%d")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False))
    print(f"wrote {OUT}")
    time.sleep(5)
    metro = fetch(METRO_QUERY, max_rounds=3)
    if metro:
        METRO_OUT.write_text(json.dumps(metro, ensure_ascii=False))
        print(f"wrote {METRO_OUT}")


if __name__ == "__main__":
    main()
