# Maplo · మ్యాప్‌లో

**Who works where in Hyderabad's IT corridor, and who is hiring there right now.**

> The name "Maplo" was chosen on 20 Nov 2026. Before launch, check the trademark (IP India, classes 9, 35 and 42), the domains and the social handles by hand. The name lives in `BRAND` in `site/app.js` and `pipeline/build.py`, and in `site/index.html` and `site/manifest.webmanifest`.

Maplo covers HITEC City, Mindspace, Madhapur, Kondapur, Gachibowli, Raidurg / Knowledge City and Financial District. It works in English and Telugu, and it runs at ₹0.

Other Hyderabad company maps place a company somewhere in an area. Maplo places it in a building, for example "HighRadius, 1st floor, Building 12C, Mindspace", and shows that company's open Hyderabad jobs next to it. Every job links to the employer's own posting. It also keeps a dated history of who started hiring, who added an office and who left.

## What's in the app

- **Map first.** Full-screen map with a bottom sheet on phones, and a list beside the map on desktop.
  - A hiring building shows as a green pill with its job count; buildings with no openings are grey dots.
  - Clusters show total jobs. From zoom 14.5, building footprints rise in 3D, and the selected building lifts in orange.
  - Metro Line 3 and its stations are on the map, and each building shows its walk time from the nearest station.
- **Honest labels.**
  - Every office shows how sure we are: *Verified address* (a public page names the building), *On OpenStreetMap*, or *Area only, building not published*. Each label comes with its source link and the date it was checked.
  - Job location is kept separate from office location.
  - Counts say "750 open jobs · 46 employers" and "20 of those employers are pinned to a building". The app never says "750 jobs in 233 buildings".
  - A company with nothing in our feeds shows "No openings found in our tracked sources", never "not hiring".
- **Filters:** Hiring now, Entry level (judged from job titles only), Near metro (10 minutes' walk or less), and area.
- **One search box** covers companies, buildings, IT parks and job titles, in English or Telugu. For example, "మైండ్‌స్పేస్ 12" finds Building 12C. Your last 5 searches are remembered.
- **Saved.** Save buildings and companies on your phone. Next time, a badge shows new openings there. Jobs you have already opened are marked "Viewed".
- **Updates.** A leaderboard of the top hiring buildings, plus "What changed" since the last daily snapshot.
- **Share cards.** A 1080×1350 PNG for a building or company, drawn on the phone and sent to the share sheet (WhatsApp or Instagram). Each building and company also gets a small page (`/b/<id>/`, `/c/<id>/`), so shared links show a proper title and summary.
- **Camera finder (v1).** Point the phone at a building to see who's inside.
  - It uses GPS and the compass only: a 50° cone up to 300 m is matched against building footprints. It shows the best match plus two alternatives, and you confirm with one tap.
  - If GPS is rough (indoors) or there is no compass, it shows the nearest buildings to pick from instead.
  - Nothing is uploaded. A photo is captured only if you tap Share.
  - To test it on a laptop, add `?sim=<lat>,<lon>,<heading>` to the URL, for example `?sim=17.43735,78.3843,90` (looking east at Building 12C).
- **Works offline, installs like an app.**
  - A service worker (`site/sw.js`) keeps the app files, the last data and the map tiles you've seen. With no signal, Maplo still opens, shows a banner with the date of the jobs, and opens shared building links.
  - Data is fetched network-first, so jobs stay fresh when there is signal.
  - An "Install app" button appears where the browser supports it (Android, desktop Chrome). On iPhone, the footer explains Share → Add to Home Screen.
- **Link previews.** Shared links show a 1200×630 picture (`site/icons/og.png`) in WhatsApp, X and LinkedIn.
- **The rest:** light and dark themes, a first-open card with live counts, and "Hiring near me" (location is asked for only when you tap it).

## How it works

```
OpenStreetMap (Overpass)  ─weekly─►  data/raw/osm.json, data/raw/metro.json ─┐
employers' public job boards ─daily─► data/raw/jobs.json                     ─┼─► pipeline/build.py ─► site/data/core.json  (map, companies, metro, changes)
data/employers.json (curated, a source link per office)                      ─┘                    ├─► site/data/jobs.json  (job lists, loaded after the map)
                                                                                                    ├─► site/b/<id>/, site/c/<id>/ (share pages)
                                                                                                    └─► data/history/YYYY-MM-DD.json ("What changed")
```

| Step | File | What it does |
|---|---|---|
| Map data | `pipeline/fetch_osm.py` | Offices, named buildings, IT-park outlines, and Hyderabad Metro stations and track. It retries across three Overpass servers with back-off. |
| Jobs | `pipeline/fetch_jobs.py` | Employers' own public job boards (Greenhouse, Lever, Ashby, Workable) and Workday career-site sitemaps. Keeps Hyderabad jobs only. Warns when an employer drops from 10 or more jobs to 0 overnight, which usually means a broken feed. |
| Build | `pipeline/build.py` | Places offices in buildings and buildings in parks. Adds footprints, confidence labels, metro walk times and entry-level flags. Writes the data files, share pages and history snapshot. |
| Site | `site/` | Static files with no build step: `index.html`, `style.css`, `app.js`, `sw.js` (offline), plus `camera.js`, which loads only when the camera is opened. Uses MapLibre GL 4.7.1 and OpenFreeMap tiles. |
| Icons | `tools/make_assets.sh` | Renders the app icons (512, 192, maskable, Apple 180, favicon) and the link-preview image from `tools/assets/*.html` with headless Chrome. Run it again after changing the logo. |

The pipeline uses only the Python standard library, so there is nothing to install. Gzipped sizes: core data about 34 KB, jobs about 22 KB, HTML + CSS + app code about 31 KB (the camera adds 5 KB, loaded only when opened). MapLibre adds about 220 KB.

## Run locally

```bash
python3 pipeline/fetch_osm.py     # weekly is enough
python3 pipeline/fetch_jobs.py
python3 pipeline/build.py
python3 -m http.server 8793 --directory site   # or: node tools/serve.mjs 8793
```

Open http://localhost:8793.

The service worker serves app files from its cache first and refreshes them in the background, so after editing `app.js` or `style.css`, reload twice (or tick "Update on reload" under DevTools → Application → Service workers). If you add a new app file, add it to `SHELL_FILES` in `site/sw.js` and bump `VERSION`.

## Current data (20 Nov 2026)

- **293 companies in 233 buildings.** 24 parks are outlined. 6 metro stations are on Line 3.
- **750 open Hyderabad jobs at 46 employers.** 20 of those employers (378 jobs) are pinned to a building. 8 jobs look entry-level by title.
  - "+" after a count means it comes from a Workday sitemap, which may list only part of a company's openings.
- **Not used:** SmartRecruiters, because its robots.txt blocks everyone except LinkedIn.
- **Offices without a pin:** some employers publish only an area, such as MSD "HITEC City". These show "building not published" rather than a guessed pin.

## Adding a company

Add an entry to `data/employers.json`:

```json
{
  "id": "acme", "name": "Acme", "sector": "SaaS", "website": "https://acme.com",
  "board": {"ats": "greenhouse", "token": "acme"},
  "offices": [{"building": "Building 9, Mindspace", "osm": "w68907576", "floor": "3rd floor",
               "address": "…", "source": "https://… (a public page that states this address)", "checked": "2026-11-20"}]
}
```

- **`board`** is optional. Either:
  - `{"ats": "greenhouse"|"lever"|"ashby"|"workable", "token": "<board name>"}`, or
  - `{"ats": "workday", "host": "<tenant>.wdN.myworkdayjobs.com", "sitemaps": [<only the Sitemap: URLs listed in that host's robots.txt>]}`.
- **`osm`** is optional. It is the OpenStreetMap building id: `w` plus the way id. Without it, the office shows as "Area only".
- **`checked`** is optional. It defaults to 2026-11-20, the day the current offices were checked by hand.
- **Every office needs a `source`.** Maplo states only facts it can point to.

## Data and rules (low-risk by design)

- **OpenStreetMap.** Map data © OpenStreetMap contributors, ODbL 1.0, attributed on the map and in the list footer.
  - The OSM-derived data in `site/data/` is shared under the ODbL too.
  - The "Fix this building on OpenStreetMap" link opens the editor.
- **Jobs.** Jobs come from employers' own public job-board APIs, and robots rules were checked on 19–20 Nov 2026.
  - Only the title, location, team, date and link are stored, and users are sent to the employer's own posting.
  - On Workday, only the `Sitemap:` files that each site's robots.txt offers are read.
- **Curated addresses.** These are plain facts, each with a link to the public page that states it.
- **No logins, no tracking, no personal data.**
  - Saved places, recent searches and viewed jobs stay in the browser's local storage.
  - Camera frames never leave the phone unless the user shares one.

## Deploy at ₹0

1. Push to a public GitHub repo.
2. Turn on GitHub Pages, or connect Cloudflare Pages with `site/` as the output folder.
3. Set `SITE_URL` in `pipeline/build.py` to the public address (for example `https://maplo.in`) and run the build. This makes the preview-image links absolute, which WhatsApp needs to show the picture.
4. `.github/workflows/update.yml` refreshes jobs daily at 06:00 IST and map data on Mondays. It commits `data/`, `site/data/` and the share pages.
5. Set `REPO_ISSUES` in `site/app.js` so people can send corrections.

## Next

- **Before launch:**
  - Trademark, domain and handle checks for "Maplo".
  - Set `SITE_URL` once the domain is known, then test a shared link in WhatsApp.
  - Try the install button and offline mode on a real Android phone and an iPhone.
- **Camera v2:** read signboards on the phone with Tesseract.js and combine that with the v1 candidates.
- **More pins:** add the missing buildings to OpenStreetMap (RMZ Futura, Phoenix Aquila, Divyasree Orion), and add more Workday tenants.
- **Later:**
  - Alerts digest on a WhatsApp Channel.
  - Walk-in drives, only from employer-published sources.
  - Nearby food from OSM.
