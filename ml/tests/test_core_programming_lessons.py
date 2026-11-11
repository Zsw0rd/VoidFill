import sqlite3
from collections import Counter, defaultdict, deque

import pandas as pd
import pytest

from ml.lesson_questions import build_questions
from ml.lessons.core_programming import BANKS, ORIENTATIONS, SOURCE_FINDINGS


def answer(code):
    from hashlib import sha256
    rows = build_questions(BANKS)
    for bank in BANKS:
        key = "lesson-" + sha256((bank["url"] + "#" + code).encode()).hexdigest()[:20]
        for row in rows:
            if row["id"] == key:
                return row["options"][row["correct_index"]]
    raise AssertionError(code)


def test_actual_python_control_flow_and_container_keys():
    assert answer("range-stop") == str(list(range(2, 8, 2)))
    total = 0
    for n in [2, 3, 4]:
        if n == 3: continue
        total += n
    assert answer("continue-sum") == str(total)
    def keep(value, items=[]):
        items.append(value)
        return items
    keep("x")
    assert answer("shared-default") == str(keep("y"))
    def amount(price, tax=0): return price + tax
    with pytest.raises(TypeError): amount(8, price=9)
    assert answer("counter-missing") == str(Counter(["a", "b", "a"])["z"])
    groups = defaultdict(list)
    result = groups.get("new")
    assert answer("factory-get") == f"{result} and {len(groups)}"
    groups["new"].append(7)
    assert groups == {"new": [7]}
    queue = deque([4, 7], maxlen=2); queue.append(9)
    assert answer("bounded-history") == str(list(queue))
    counts = Counter({"a": 2}); counts.update({"a": 3, "b": 1})
    assert answer("counter-update") == f"{counts['a']} and {counts['b']}"


def test_authored_pandas_scenarios_use_actual_dataframe_operations():
    df = pd.DataFrame({"name": ["Nia", "Bo", "Ada"], "cost": [8, 15, 22]})
    assert isinstance(df["cost"], pd.Series)
    assert list(df[["name", "cost"]].columns) == ["name", "cost"]
    assert df[df["cost"] > 10]["name"].tolist() == ["Bo", "Ada"]
    assert df[(df["cost"] > 10) & (df["cost"] < 20)]["name"].tolist() == ["Bo"]
    with pytest.raises(ValueError):
        df[df["cost"] > 10 and df["cost"] < 20]
    combined = pd.Series({"Mon": 3, "Tue": 5}).add(pd.Series({"Tue": 2}), fill_value=0)
    assert answer("index-alignment") == f"{int(combined['Mon'])} and {int(combined['Tue'])}"
    df["size"] = len(df["name"])
    assert df["size"].tolist() == [3, 3, 3]
    assert answer("length-broadcast") == "3 in each row"
    with pytest.raises(SyntaxError): compile("df.T..rename(columns={0:'A'})", "reviewed-source-typo", "eval")
    assert list(pd.DataFrame([[1, 2]]).T.rename(columns={0: "A"}).columns) == ["A"]


def test_portable_sql_examples_execute_against_disposable_in_memory_tables():
    # Only these common SELECT/JOIN/GROUP operations are checked in SQLite.
    # This does not claim PostgreSQL-specific type, collation or planner parity.
    with sqlite3.connect(":memory:") as db:
        db.executescript("""
            CREATE TABLE teams(id INTEGER, name TEXT);
            INSERT INTO teams VALUES (1,'A'),(2,'B');
            CREATE TABLE tasks(team TEXT,status TEXT,amount INTEGER);
            INSERT INTO tasks VALUES ('A','open',3),('A','open',7),('A','closed',100),('B','open',9);
            CREATE TABLE customers(id INTEGER,name TEXT);
            INSERT INTO customers VALUES (1,'Customer');
            CREATE TABLE orders(customer_id INTEGER,total INTEGER);
            INSERT INTO orders VALUES (1,20),(1,80),(1,90),(2,40);
            CREATE TABLE visits(city TEXT);
            INSERT INTO visits VALUES ('B'),('A'),('A');
            CREATE TABLE invoices(amount INTEGER);
            INSERT INTO invoices VALUES (5),(20),(20);
        """)
        assert db.execute("SELECT DISTINCT city FROM visits ORDER BY city").fetchall() == [("A",), ("B",)]
        assert db.execute("SELECT customers.name FROM orders JOIN customers ON orders.customer_id = customers.id").fetchall() == [("Customer",)] * 3
        assert db.execute("SELECT COUNT(*) FROM orders LEFT JOIN customers ON orders.customer_id = customers.id").fetchone() == (4,)
        assert db.execute("SELECT team,SUM(amount) FROM tasks WHERE status='open' GROUP BY team ORDER BY team").fetchall() == [("A", 10), ("B", 9)]
        assert answer("filtered-aggregate") == "10"
        assert db.execute("SELECT amount FROM invoices WHERE amount = (SELECT MAX(amount) FROM invoices)").fetchall() == [(20,), (20,)]
        with pytest.raises(sqlite3.OperationalError):
            db.execute("SELECT customers.id orders.total FROM orders JOIN customers ON orders.customer_id = customers.id")


def test_every_remaining_core_resource_has_a_reviewed_bounded_decision():
    from ml.career_catalogue import load_learning_content
    from ml.lessons.python_algorithms import BANKS as initial
    resources, _ = load_learning_content()
    target = [r for r in resources if set(r["topics"]) & {"python", "algorithms", "sql"}]
    teaching = {bank["url"] for bank in [*initial, *BANKS]}
    guides = {row["url"] for row in ORIENTATIONS}
    assert len(target) == 15
    assert all(row["url"] in teaching | guides for row in target)
    assert not teaching & guides
    assert len(build_questions(BANKS)) == 48
    assert len(SOURCE_FINDINGS) == 2
    assert all(row["reviewed_at"] == "2026-11-10" and row["support_urls"] for row in SOURCE_FINDINGS)
