"""Health check between build and publish.

Compares the fresh build with the one that is live now, plus the feed notes that fetch_jobs.py left in
data/raw/jobs.json, and decides:
  exit 0  publish (the report may still list things a person should look at)
  exit 1  do not publish: the new data looks broken, so the site keeps yesterday's data

Usage: python3 pipeline/check.py LIVE_CORE NEW_CORE [--report FILE] [--force]
  LIVE_CORE  copy of site/data/core.json taken before the build
  --report   write a Markdown report here when there is anything to look at (used to open a GitHub issue)
  --force    publish even when the check would block (manual runs only)
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
JOBS_RAW = ROOT / "data" / "raw" / "jobs.json"

BLOCK_JOBS = 0.5    # block when total jobs fall below half of the live count
WARN_JOBS = 0.7     # report when they fall below 70%
BLOCK_MAP = 0.8     # block when companies or buildings fall below 80% (an OpenStreetMap fetch gone wrong)
MIN_JOBS = 100      # below this many live jobs, swings are normal and nothing blocks


def assess(live, new, raw):
    """Return (block, problems): problems are Markdown lines for a person to read."""
    lc, nc = live.get("counts", {}), new.get("counts", {})
    block, problems = False, []
    was, now = lc.get("jobs", 0), nc.get("jobs", 0)
    if was >= MIN_JOBS and now < was * BLOCK_JOBS:
        block = True
        problems.append(f"**Not published:** open jobs fell from {was} to {now} (below {BLOCK_JOBS:.0%}). "
                        "This is almost always a feed outage, so the site keeps the previous data.")
    elif was >= MIN_JOBS and now < was * WARN_JOBS:
        problems.append(f"Open jobs fell from {was} to {now} ({now / was:.0%} of the live count). Published; worth a look.")
    for key, word in (("companies", "companies"), ("buildings", "buildings")):
        a, b = lc.get(key, 0), nc.get(key, 0)
        if a and b < a * BLOCK_MAP:
            block = True
            problems.append(f"**Not published:** {word} fell from {a} to {b} (below {BLOCK_MAP:.0%}). "
                            "Check the OpenStreetMap fetch.")
    for eid, why in sorted(raw.get("failed", {}).items()):
        problems.append(f"Feed failed, previous jobs kept: `{eid}` ({why})")
    for note in raw.get("warnings", []):
        problems.append(f"Feed warning: {note}")
    return block, problems


def main(argv):
    force = "--force" in argv
    report = argv[argv.index("--report") + 1] if "--report" in argv else None
    paths = [a for i, a in enumerate(argv) if not a.startswith("--") and (i == 0 or argv[i - 1] != "--report")]
    if len(paths) != 2:
        print(__doc__)
        return 2
    live = json.loads(pathlib.Path(paths[0]).read_text()) if pathlib.Path(paths[0]).exists() else {}
    new = json.loads(pathlib.Path(paths[1]).read_text())
    raw = json.loads(JOBS_RAW.read_text()) if JOBS_RAW.exists() else {}
    block, problems = assess(live, new, raw)
    if block and force:
        problems.insert(0, "**Published anyway:** a manual run asked to force it.")
    for p in problems:
        print(p)
    print(f"live {live.get('counts')} -> new {new.get('counts')}")
    if report and problems:
        date = new.get("generated", "")
        head = f"Daily data check, {date}" + (" (not published)" if block and not force else "")
        pathlib.Path(report).write_text(f"### {head}\n\n" + "\n".join(f"- {p}" for p in problems) + "\n")
    if block and not force:
        print("BLOCKED: not publishing this build")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
