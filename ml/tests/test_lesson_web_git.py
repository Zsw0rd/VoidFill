"""Independent key checks and exact-scope accounting for reviewed web lessons.

No network, real accounts, headless browser, repository mutations or ML index
writes. Git fixtures live in pytest temporary directories and use local remotes.
"""
import json
import os
import shutil
import subprocess
from collections import Counter
from copy import deepcopy
from pathlib import Path

from ml.lesson_questions import ROOT, build_questions
from ml.lesson_validation import validate_lesson_questions
from ml.lessons.web_git import BANKS, ORIENTATIONS, PINNED


def resources():
    return sum([json.loads((ROOT / path).read_text(encoding="utf8")) for path in
                ["ml/data/resources.json", "ml/data/careers/resources.json"]], [])


def answer(resource_id, code):
    bank = next(bank for bank in BANKS if resource_id in bank["resource_ids"])
    return next(row[4] for row in bank["questions"] if row[0] == code)


def test_every_assigned_resource_has_one_explicit_review_decision():
    expected = {r["id"] for r in resources()
                if set(r["topics"]) & {"git", "web", "react", "accessibility"}}
    teaching = [rid for bank in BANKS for rid in bank["resource_ids"]]
    guides = [rid for guide in ORIENTATIONS for rid in guide["resource_ids"]]
    assert len(expected) == 49
    assert len(BANKS) == 40 and len(ORIENTATIONS) == 9
    assert set(teaching).isdisjoint(guides)
    assert Counter(teaching + guides) == Counter({rid: 1 for rid in expected})
    by_id = {r["id"]: r for r in resources()}
    for record in [*BANKS, *ORIENTATIONS]:
        assert record["reviewed_at"] == "2026-11-10"
        for rid in record["resource_ids"]:
            assert by_id[rid]["url"] == record["url"]
            assert set(record["topics"]) & set(by_id[rid]["topics"])
    for guide in ORIENTATIONS:
        assert len(guide["reason"].strip()) > 60
        assert "questions" not in guide
        assert len(set(guide["child_resource_ids"])) == len(guide["child_resource_ids"])
        assert set(guide["child_resource_ids"]) <= set(teaching)
    # These indexes/setup pages do not link separate instructional URLs stored
    # in the catalogue. Do not quietly infer a topic-equivalent child resource.
    assert next(g for g in ORIENTATIONS if "voidfill-web-2" in g["resource_ids"])["child_resource_ids"] == []
    assert next(g for g in ORIENTATIONS if "d17ab6e6fc409dddc1c94d3a" in g["resource_ids"])["child_resource_ids"] == []


def test_questions_build_without_registry_edits_and_keep_exact_bindings():
    before = deepcopy(BANKS)
    questions = build_questions(banks=BANKS)
    assert questions == build_questions(banks=BANKS)
    assert BANKS == before
    assert len(questions) == 240 == len({q["id"] for q in questions})
    assert len({q["prompt"] for q in questions}) == 240
    assert validate_lesson_questions(questions, resources()) == questions
    assert {q["correct_index"] for q in questions} == {0, 1, 2, 3}
    for bank in BANKS:
        rows = [q for q in questions if q["resource_ids"] == bank["resource_ids"]]
        assert len(rows) == 6
        assert sum(q["difficulty"] <= 2 for q in rows) == 3
        assert sum(q["difficulty"] == 3 for q in rows) == 3
        assert len({q["objective_id"] for q in rows}) >= 3
        assert all(q["source_url"].split("#", 1)[0] == bank["url"] for q in rows)
        assert all(q["resource_id"] == bank["resource_ids"][0] for q in rows)
        if bank["url"].startswith("https://github.com/"):
            assert bank["url"].startswith(PINNED)


def test_javascript_keys_against_executed_language_and_game_scenarios():
    assert shutil.which("node"), "Node is required for executable JavaScript answer checks"
    script = r"""
    const out = {};
    out.stringPlus = '4' + 2;
    let seats = 7; out.interpolate = `Seats: ${seats}`;
    out.remainder = 17 % 5;
    function total(count = 3) { return count * 2; }
    out.defaultZero = total(0);
    function double(n) { return n * 2; }
    out.returnValue = double(4) + 1;
    out.both = true && false;
    const score = 7; out.choice = score >= 8 ? 'pass' : 'retry';
    const rooms = ['Hall', 'Lab', 'Studio']; out.last = rooms[2];
    let sum = 0; for (let i = 0; i < 3; i++) sum += [2, 4, 6][i];
    out.sum = sum;
    out.dragX = 40 - (100 - 130);
    function position() { let x = 0; return step => x += step; }
    const first = position(), second = position();
    out.closures = [first(30), second(5), first(2)];
    out.elapsed = (16750 - 12000) / 1000;
    out.prefixMatches = 'plant'.startsWith('px');
    out.lastWordComplete = 'leaf' === 'leaf' && 3 === 4 - 1;
    out.composed = {...{x: 0, y: 0}, x: 9, y: 4};
    const listeners = []; let calls = 0;
    listeners.push(() => calls++); listeners.push(() => calls++);
    listeners.forEach(fn => fn()); out.callbackCount = calls;
    out.centerX = (800 - 300) / 2;
    let enemies = 0; for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) enemies++;
    out.gridCount = enemies;
    let enemyY = 20; for (let tick = 0; tick < 3; tick++) enemyY += 5;
    out.enemyY = enemyY;
    function intersects(a, b) {
      return !(b.left > a.right || b.right < a.left || b.top > a.bottom || b.bottom < a.top);
    }
    out.separated = intersects({left:0,right:10,top:0,bottom:10}, {left:20,right:30,top:2,bottom:8});
    let laserY = 60; for (let tick = 0; tick < 2; tick++) laserY -= 15;
    out.laserY = laserY;
    out.liveObjects = [{name:'A',dead:true},{name:'B',dead:false},{name:'C',dead:true}]
      .filter(go => !go.dead).map(go => go.name);
    out.points = 200 + 2 * 100;
    let life = 2; life--; out.lifeAfterHit = life;
    let icons = 0; for (let i = 0; i < 2; i++) icons++;
    out.lifeIcons = icons;
    function endCollision(life, livingEnemies) {
      const events = [];
      if (life <= 0) { events.push('loss'); return events; }
      if (livingEnemies === 0) events.push('win');
      return events;
    }
    out.endEvents = endCollision(0, 0);
    out.encodedUser = encodeURIComponent('group/A');
    out.amount = (7.5).toFixed(2);
    const old = Object.freeze({account: {user:'A'}, theme:'light'});
    const updated = Object.freeze({...old, account: null});
    out.stateCopy = [old.account.user, updated.account, updated.theme, old !== updated];
    out.restored = JSON.parse(JSON.stringify({user:'A',balance:12}));
    console.log(JSON.stringify(out));
    """
    values = json.loads(subprocess.run(["node", "-e", script], capture_output=True,
                                       text=True, check=True, timeout=15).stdout)
    data = "45db1418a7051a3a68f47bc2"
    assert answer(data, "string-plus") == f"The string '{values['stringPlus']}'"
    assert answer(data, "interpolate") == values["interpolate"]
    assert answer(data, "remainder") == str(values["remainder"])
    functions = "177807d185220783a0478e05"
    assert answer(functions, "default") == str(values["defaultZero"])
    assert answer(functions, "result") == str(values["returnValue"])
    decisions = "f96bb81b0ba769e1e46268cc"
    assert answer(decisions, "both-required") == str(values["both"]).lower()
    assert answer(decisions, "choice") == repr(values["choice"])
    assert values["last"] == "Studio"
    assert answer("f816fe36c2142be298089ac3", "sum-loop") == str(values["sum"])
    assert answer("5e6ca8a2d103dbc86238e618", "horizontal-delta") == str(values["dragX"])
    assert values["closures"] == [30, 5, 32]
    assert answer("e48d1a8b3020ba91c131475d", "elapsed") == str(values["elapsed"])
    assert values["prefixMatches"] is False and values["lastWordComplete"] is True
    assert answer("a626753d5b4a2f04a087cf45", "override-position") == f"x = {values['composed']['x']}, y = {values['composed']['y']}"
    assert answer("a626753d5b4a2f04a087cf45", "listener-count") == str(values["callbackCount"])
    canvas = "044151219efd503a941c1983"
    assert answer(canvas, "center-grid") == str(values["centerX"])
    assert answer(canvas, "grid-count") == str(values["gridCount"])
    assert answer("aabe132f4ffe9127fd7fc712", "move-down") == str(values["enemyY"])
    assert values["separated"] is False
    assert answer("2c33319788e1916817c8f8f7", "laser-up") == f"Y {values['laserY']}"
    assert values["liveObjects"] == ["B"]
    scoring = "d4243ea043940885c2dc0588"
    assert answer(scoring, "two-enemies") == str(values["points"])
    assert answer(scoring, "damage-life") == str(values["lifeAfterHit"])
    assert answer(scoring, "icon-loop") == str(values["lifeIcons"])
    assert values["endEvents"] == ["loss"]
    assert values["encodedUser"] == "group%2FA"
    assert answer("8adb506835ad31efc908cf41", "amount-format") == repr(values["amount"])
    assert values["stateCopy"] == ["A", None, "light", True]
    assert values["restored"] == {"user": "A", "balance": 12}


def git(cwd, *args, check=True):
    env = {**os.environ, "GIT_CONFIG_GLOBAL": os.devnull, "GIT_CONFIG_NOSYSTEM": "1",
           "GIT_TERMINAL_PROMPT": "0"}
    return subprocess.run(["git", "-c", "user.name=Lesson fixture",
                           "-c", "user.email=lesson@example.invalid", "-c", "commit.gpgsign=false",
                           "-c", "init.defaultBranch=main", *args], cwd=cwd, env=env,
                          capture_output=True, text=True, check=check, timeout=20)


def init_repo(path):
    path.mkdir()
    git(path, "init")
    (path / "notes.txt").write_text("base\n", encoding="utf8")
    git(path, "add", "notes.txt")
    git(path, "commit", "-m", "Base fixture")


def test_git_keys_against_real_index_branch_and_ignore_states(tmp_path):
    assert shutil.which("git"), "Git is required for isolated answer checks"
    repo = tmp_path / "repo"
    init_repo(repo)
    first = git(repo, "rev-parse", "HEAD").stdout.strip()
    git(repo, "branch", "feature")
    assert git(repo, "branch", "--show-current").stdout.strip() == "main"
    (repo / "notes.txt").write_text("staged version\n", encoding="utf8")
    git(repo, "add", "notes.txt")
    (repo / "notes.txt").write_text("working version\n", encoding="utf8")
    assert git(repo, "show", ":notes.txt").stdout == "staged version\n"
    assert "MM notes.txt" in git(repo, "status", "--short").stdout
    assert "+staged version" in git(repo, "diff", "--cached").stdout
    assert "+working version" not in git(repo, "diff", "--cached").stdout
    assert "+working version" in git(repo, "diff").stdout
    git(repo, "commit", "-m", "Record staged snapshot")
    assert git(repo, "show", "HEAD:notes.txt").stdout == "staged version\n"
    assert (repo / "notes.txt").read_text() == "working version\n"
    assert git(repo, "rev-parse", "feature").stdout.strip() == first
    assert git(repo, "rev-parse", "main").stdout.strip() != first
    # Ignore rules affect intentionally untracked files, not an already tracked file.
    (repo / ".gitignore").write_text("notes.txt\nscratch.txt\n", encoding="utf8")
    (repo / "scratch.txt").write_text("not versioned", encoding="utf8")
    assert " M notes.txt" in git(repo, "status", "--short").stdout
    assert "scratch.txt" not in git(repo, "status", "--short").stdout
    assert answer("career-resource-75f1d01d8f91f12dfe75", "two-versions") == "The index and working tree contain different versions"
    assert answer("career-resource-75f1d01d8f91f12dfe75", "unstaged-diff") == "Working tree and index"


def test_fetch_keys_against_an_isolated_local_remote(tmp_path):
    repo = tmp_path / "repo"
    init_repo(repo)
    central = tmp_path / "central.git"
    git(tmp_path, "init", "--bare", str(central))
    git(repo, "remote", "add", "origin", str(central))
    git(repo, "push", "-u", "origin", "main")
    peer = tmp_path / "peer"
    git(tmp_path, "clone", "--branch", "main", str(central), str(peer))
    original = git(repo, "rev-parse", "HEAD").stdout.strip()
    (peer / "notes.txt").write_text("peer update\n", encoding="utf8")
    git(peer, "add", "notes.txt")
    git(peer, "commit", "-m", "Peer fixture update")
    git(peer, "push", "origin", "main")
    git(repo, "fetch", "origin")
    assert git(repo, "rev-parse", "HEAD").stdout.strip() == original
    assert (repo / "notes.txt").read_text() == "base\n"
    assert git(repo, "rev-parse", "origin/main").stdout.strip() != original
    assert answer("voidfill-git-2", "fetch-no-merge") == "No; fetch does not automatically merge into the working branch"
    git(repo, "remote", "remove", "origin")
    assert central.exists() and (central / "HEAD").is_file()
    assert git(repo, "remote").stdout.strip() == ""
    assert answer("voidfill-git-2", "remote-remove") == "No; it removes this clone's remote configuration"


def test_merge_keys_against_fast_forward_and_conflict_resolution(tmp_path):
    repo = tmp_path / "repo"
    init_repo(repo)
    git(repo, "branch", "topic")
    (repo / "notes.txt").write_text("main update\n", encoding="utf8")
    git(repo, "add", "notes.txt")
    git(repo, "commit", "-m", "Main fixture update")
    main_tip = git(repo, "rev-parse", "main").stdout.strip()
    git(repo, "checkout", "topic")
    git(repo, "merge", "--ff-only", "main")
    assert git(repo, "rev-parse", "topic").stdout.strip() == main_tip
    assert len(git(repo, "rev-list", "--parents", "-n", "1", "HEAD").stdout.split()) == 2
    (repo / "notes.txt").write_text("topic change\n", encoding="utf8")
    git(repo, "add", "notes.txt")
    git(repo, "commit", "-m", "Topic fixture change")
    git(repo, "checkout", "main")
    (repo / "notes.txt").write_text("different main change\n", encoding="utf8")
    git(repo, "add", "notes.txt")
    git(repo, "commit", "-m", "Divergent main fixture")
    result = git(repo, "merge", "topic", check=False)
    assert result.returncode != 0
    assert "UU notes.txt" in git(repo, "status", "--short").stdout
    assert "<<<<<<<" in (repo / "notes.txt").read_text()
    (repo / "notes.txt").write_text("resolved deliberately\n", encoding="utf8")
    git(repo, "add", "notes.txt")
    git(repo, "commit", "-m", "Resolve fixture conflict")
    assert len(git(repo, "rev-list", "--parents", "-n", "1", "HEAD").stdout.split()) == 3


def test_curriculum_limits_do_not_overclaim_accessibility_or_storage_security():
    assert answer("career-resource-b1795729a179434db930", "passed-initial") == "The initial checks passed; broader barriers can remain"
    assert answer("career-resource-7a09149eb1d40c0fba8f", "tools").startswith("No;")
    assert answer("7f95b0704dd938c21b8c7d50", "secret-storage") == "This learning example does not make browser storage a secure secret vault"
    assert answer("f397d1eb20ac49a8093f3c1c", "restart-loss").startswith("No;")
    assert answer("d7daf65e177e2c6618c243b4", "server-validation").startswith("No;")
