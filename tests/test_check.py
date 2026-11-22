"""check.py: when to block publishing and what to report."""
import json
import pathlib
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "pipeline"))
import check  # noqa: E402


def core(jobs, companies=290, buildings=233):
    return {"generated": "2026-11-22", "counts": {"jobs": jobs, "companies": companies, "buildings": buildings}}


class AssessTest(unittest.TestCase):
    def test_normal_day_has_nothing_to_report(self):
        self.assertEqual(check.assess(core(758), core(732), {}), (False, []))

    def test_21_nov_outage_would_be_blocked(self):
        block, problems = check.assess(core(758), core(255), {})
        self.assertTrue(block)
        self.assertIn("Not published", problems[0])

    def test_big_but_not_broken_drop_is_reported_only(self):
        block, problems = check.assess(core(758), core(450), {})
        self.assertFalse(block)
        self.assertEqual(len(problems), 1)

    def test_small_totals_never_block(self):
        self.assertFalse(check.assess(core(60), core(10), {})[0])

    def test_map_shrinking_blocks(self):
        self.assertTrue(check.assess(core(700), core(700, buildings=100), {})[0])

    def test_first_run_without_live_data(self):
        self.assertEqual(check.assess({}, core(700), {}), (False, []))

    def test_feed_failures_and_warnings_are_listed(self):
        raw = {"failed": {"pwc": "HTTP Error 403"}, "warnings": ["micron: 199 jobs before, 0 today; kept previous jobs"]}
        block, problems = check.assess(core(758), core(750), raw)
        self.assertFalse(block)
        self.assertEqual(len(problems), 2)
        self.assertIn("pwc", problems[0])


class MainTest(unittest.TestCase):
    def setUp(self):
        self.tmp = pathlib.Path(tempfile.mkdtemp())
        p = mock.patch.object(check, "JOBS_RAW", self.tmp / "missing.json")
        p.start()
        self.addCleanup(p.stop)
        q = mock.patch("builtins.print")
        q.start()
        self.addCleanup(q.stop)

    def files(self, live, new):
        a, b = self.tmp / "live.json", self.tmp / "new.json"
        a.write_text(json.dumps(live))
        b.write_text(json.dumps(new))
        return str(a), str(b), str(self.tmp / "report.md")

    def test_block_exits_1_and_writes_report(self):
        a, b, rep = self.files(core(758), core(255))
        self.assertEqual(check.main([a, b, "--report", rep]), 1)
        self.assertIn("not published", pathlib.Path(rep).read_text())

    def test_force_publishes_anyway(self):
        a, b, rep = self.files(core(758), core(255))
        self.assertEqual(check.main([a, b, "--report", rep, "--force"]), 0)
        self.assertIn("Published anyway", pathlib.Path(rep).read_text())

    def test_clean_run_writes_no_report(self):
        a, b, rep = self.files(core(758), core(740))
        self.assertEqual(check.main([a, b, "--report", rep]), 0)
        self.assertFalse(pathlib.Path(rep).exists())


if __name__ == "__main__":
    unittest.main()
