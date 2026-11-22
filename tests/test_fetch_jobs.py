"""fetch_jobs.py: feed outages must not wipe jobs. Runs offline with fake feeds.

python3 -m unittest discover -s tests
"""
import json
import pathlib
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "pipeline"))
import fetch_jobs as fj  # noqa: E402

TWELVE = [{"title": f"Job {i}", "location": "Hyderabad", "url": f"https://x/{i}"} for i in range(12)]
SITEMAP_OK = ('<urlset><url><loc>https://t.wd5.myworkdayjobs.com/S/job/India---Telangana---Hyderabad/'
              'Senior-Developer_R-123</loc></url><url><loc>https://t.wd5.myworkdayjobs.com/S/job/USA---Austin/'
              'Manager_R-9</loc></url></urlset>')


class FakeResponse:
    def __init__(self, body):
        self.body = body

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False

    def read(self):
        return self.body.encode()


class FetchJobsTest(unittest.TestCase):
    def setUp(self):
        tmp = pathlib.Path(tempfile.mkdtemp())
        self.out = tmp / "jobs.json"
        employers = tmp / "employers.json"
        employers.write_text(json.dumps([
            {"id": "big", "name": "Big", "board": {"ats": "greenhouse", "token": "big"}},
            {"id": "wd", "name": "WD", "board": {"ats": "workday", "sitemaps": ["https://t.wd5.myworkdayjobs.com/s.xml"]}},
        ]))
        self.feed = {"big": [], "sitemap": SITEMAP_OK}
        for p in (mock.patch.object(fj, "OUT", self.out), mock.patch.object(fj, "EMPLOYERS", employers),
                  mock.patch.object(fj.time, "sleep", lambda s: None),
                  mock.patch.dict(fj.FETCHERS, {"greenhouse": lambda token: self.feed["big"]}),
                  mock.patch.object(fj.urllib.request, "urlopen",
                                    lambda req, timeout=0: FakeResponse(self.feed["sitemap"])),
                  mock.patch("builtins.print")):
            p.start()
            self.addCleanup(p.stop)

    def run_on(self, day, previous=None):
        if previous is not None:
            self.out.write_text(json.dumps(previous))
        with mock.patch.object(fj.time, "strftime", lambda fmt, *a: day):
            fj.main()
        return json.loads(self.out.read_text())

    def test_sudden_zero_is_held_for_two_days_then_believed(self):
        r = self.run_on("2026-11-21", {"companies": {"big": TWELVE}})
        self.assertEqual(len(r["companies"]["big"]), 12)
        self.assertEqual(r["held"], {"big": "2026-11-21"})
        r = self.run_on("2026-11-22")
        self.assertEqual(len(r["companies"]["big"]), 12)
        self.assertEqual(r["held"]["big"], "2026-11-21")
        r = self.run_on("2026-11-23")
        self.assertEqual(r["companies"]["big"], [])
        self.assertNotIn("held", r)

    def test_recovery_clears_the_hold(self):
        self.feed["big"] = TWELVE[:5]
        r = self.run_on("2026-11-22", {"companies": {"big": TWELVE}, "held": {"big": "2026-11-21"}})
        self.assertEqual(len(r["companies"]["big"]), 5)
        self.assertNotIn("held", r)

    def test_small_boards_can_drop_to_zero(self):
        r = self.run_on("2026-11-22", {"companies": {"big": TWELVE[:3]}})
        self.assertEqual(r["companies"]["big"], [])

    def test_workday_maintenance_page_keeps_previous_jobs(self):
        self.feed["sitemap"] = "<html>Down for maintenance</html>"
        r = self.run_on("2026-11-21", {"companies": {"wd": TWELVE[:3]}, "partial": ["wd"]})
        self.assertEqual(len(r["companies"]["wd"]), 3)
        self.assertIn("wd", r["partial"])
        self.assertIn("not a sitemap", r["failed"]["wd"])

    def test_workday_empty_sitemap_is_a_failure(self):
        self.feed["sitemap"] = "<urlset></urlset>"
        r = self.run_on("2026-11-21", {"companies": {"wd": TWELVE[:3]}, "partial": ["wd"]})
        self.assertEqual(len(r["companies"]["wd"]), 3)
        self.assertIn("wd", r["failed"])

    def test_workday_sitemap_keeps_only_hyderabad(self):
        r = self.run_on("2026-11-22", {"companies": {}})
        self.assertEqual([j["title"] for j in r["companies"]["wd"]], ["Senior Developer"])


if __name__ == "__main__":
    unittest.main()
