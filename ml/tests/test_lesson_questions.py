from copy import deepcopy
import bisect
import heapq

from ml.lesson_questions import BANKS, build_questions


def test_authored_lessons_are_deterministic_bound_to_actual_resources_and_balanced():
    before = deepcopy(BANKS)
    first = build_questions()
    assert first == build_questions()
    assert BANKS == before
    assert len(first) == len({row["id"] for row in first}) == sum(len(bank["questions"]) for bank in BANKS)
    assert len({row["correct_index"] for row in first}) == 4
    for bank in BANKS:
        rows = [row for row in first if row["resource_ids"] == bank["resource_ids"]]
        assert len(rows) == 6
        assert sum(row["difficulty"] <= 2 for row in rows) == 3
        assert sum(row["difficulty"] == 3 for row in rows) == 3
        assert len({row["objective_id"] for row in rows}) >= 3
        assert all(row["source_url"].split("#", 1)[0] == bank["url"] for row in rows)


def test_python_fixture_results_match_the_actual_correct_choices():
    rows = build_questions()
    def answer(code):
        from hashlib import sha256
        for bank in BANKS:
            key = "lesson-" + sha256((bank["url"] + "#" + code).encode()).hexdigest()[:20]
            for row in rows:
                if row["id"] == key:
                    return row["options"][row["correct_index"]]
        raise AssertionError(code)
    values = [4, 8]; values.append([12, 16])
    assert answer("append-nested") == str(len(values))
    names = ["Zed", "Ada"]; result = names.sort()
    assert answer("sort-return") == f"{names} and {result}"
    original = [[2]]; copied = original.copy(); copied[0].append(9)
    assert answer("nested-copy") == str(original)
    assert answer("left-duplicate") == str(bisect.bisect_left([3, 6, 6, 10], 6))
    assert answer("right-duplicate") == str(bisect.bisect_right([3, 6, 6, 10], 6))
    heap = [4, 9]; result = heapq.heappushpop(heap, 2)
    assert answer("pushpop") == f"{result} and {heap}"
    heap = [4, 9]; result = heapq.heapreplace(heap, 2)
    assert answer("replace") == f"{result} and {heap}"
    assert bisect.bisect_left([{"score": 60}, {"score": 80}], 70, key=lambda row: row["score"]) == 1
