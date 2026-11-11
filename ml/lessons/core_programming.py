"""Original scenarios for reviewed Python, container and database instruction.

Reviewed primary pages on 2026-11-10. Examples are invented, executable locally,
and limited to APIs in Python 3.12 / portable SQL. No external database, notebook
or Cosmos account is required. Legacy source mistakes are explicitly flagged.
"""
REVIEWED = "2026-11-10"
PINNED = "https://github.com/microsoft/Data-Science-For-Beginners/blob/0c7e46a0db1d6925982d6323b246299b3855ce32/"
BANKS = []


def bank(resource_id, url, topic, scope, questions):
    BANKS.append({"resource_ids": [resource_id], "url": url, "topics": [topic],
                  "reviewed_at": REVIEWED, "scope": scope, "questions": questions})


bank("voidfill-python-0", "https://docs.python.org/3/tutorial/controlflow.html", "python",
     "Iteration bounds, skipped iterations, loop-else and function defaults/keyword calls; a short subset of the control-flow chapter.", [
    ("range-stop", "control-range", 1, "Which list is produced by list(range(2, 8, 2))?", "[2, 4, 6]", ["[2, 4, 6, 8]", "[0, 2, 4, 6]", "[2, 3, 4, 5, 6, 7]"], "The step is two and the stop value is excluded.", "#the-range-function"),
    ("continue-sum", "control-iteration", 2, "A loop starts total = 0. For n in [2, 3, 4], it continues when n == 3 and otherwise adds n. What is total?", "6", ["9", "2", "7"], "continue skips the addition only for 3.", "#break-and-continue-statements"),
    ("implicit-return", "control-functions", 1, "A Python function reaches its end without a return statement. What value does a call return?", "None", ["0", "An empty string", "The last local variable automatically"], "Falling off the end of a function returns None.", "#defining-functions"),
    ("loop-else-found", "control-loop-else", 3, "A search loop breaks immediately after finding a match. An else clause belongs to the for loop. Does that else execute?", "No, because the loop ended through break", ["Yes, because a match was found", "Yes, once for every matched item", "Only if the matched item is the first one"], "A loop's else runs after normal exhaustion, not after break.", "#else-clauses-on-loops"),
    ("shared-default", "control-defaults", 3, "def keep(value, items=[]): items.append(value); return items. After keep('x'), what does keep('y') return?", "['x', 'y']", ["['y']", "['x']", "None"], "The default list was created once and is shared by calls that omit items.", "#default-argument-values"),
    ("duplicate-argument", "control-functions", 3, "Given def total(price, tax=0): return price + tax, which call raises TypeError because price receives two values?", "total(8, price=9)", ["total(price=8, tax=9)", "total(8, tax=9)", "total(tax=9, price=8)"], "The positional 8 already supplies price.", "#keyword-arguments"),
])

bank("voidfill-algorithms-0", "https://docs.python.org/3/library/collections.html", "algorithms",
     "Counting, grouping and bounded FIFO containers; no claim to full collections API or algorithm mastery.", [
    ("counter-missing", "containers-counting", 1, "Counter(['a', 'b', 'a']) is stored as counts. What is counts['z']?", "0", ["None", "1", "A KeyError is always raised"], "Counter returns zero for a missing element.", "#collections.Counter"),
    ("group-factory", "containers-grouping", 2, "A defaultdict(list) groups values by category. What does groups['new'].append(7) do when 'new' is absent?", "Creates a new list for 'new' and appends 7", ["Appends 7 to every existing group", "Raises KeyError without calling the factory", "Stores the list class itself as the value"], "Index access invokes the missing-value factory and stores its result.", "#collections.defaultdict"),
    ("fifo-operation", "containers-fifo", 1, "A deque receives new tasks with append(). Which operation removes the earliest queued task?", "popleft()", ["pop()", "appendleft()", "rotate(1)"], "Appending right and removing left implements FIFO order.", "#collections.deque"),
    ("factory-get", "containers-grouping", 3, "groups = defaultdict(list) is empty. After result = groups.get('new'), what are result and len(groups)?", "None and 0", ["[] and 1", "[] and 0", "None and 1"], "get does not invoke defaultdict's missing-value factory.", "#collections.defaultdict"),
    ("bounded-history", "containers-fifo", 3, "A deque([4, 7], maxlen=2) receives append(9). What values remain from left to right?", "[7, 9]", ["[4, 7, 9]", "[4, 9]", "[9, 4]"], "Appending to a full bounded deque discards from the opposite end.", "#collections.deque"),
    ("counter-update", "containers-counting", 3, "counts = Counter({'a': 2}); counts.update({'a': 3, 'b': 1}). What are counts['a'] and counts['b']?", "5 and 1", ["3 and 1", "2 and 1", "5 and 0"], "Counter.update adds counts instead of replacing the existing count.", "#collections.Counter.update"),
])

bank("voidfill-sql-0", "https://www.postgresql.org/docs/current/tutorial-select.html", "sql",
     "Column selection, row filtering, DISTINCT and explicit ordering using small fictional tables.", [
    ("projection", "sql-projection", 1, "Which query returns only the name column from a table named teams?", "SELECT name FROM teams;", ["SELECT * FROM teams;", "SELECT teams FROM name;", "SELECT name WHERE teams;"], "The select list chooses the returned columns.", ""),
    ("row-filter", "sql-filtering", 1, "Which clause limits orders to rows whose total is greater than 50?", "WHERE total > 50", ["ORDER BY total > 50", "SELECT total > 50 without a WHERE", "FROM total > 50"], "WHERE selects rows satisfying a condition.", ""),
    ("computed-column", "sql-projection", 2, "What does SELECT price * 2 AS doubled FROM items return for a row whose price is 6?", "A column named doubled with value 12", ["A permanent change of price to 12", "Two copies of the original row", "A column named price with value 2"], "A select-list expression computes an output value; AS names it.", ""),
    ("distinct-order", "sql-ordering", 3, "A report uses SELECT DISTINCT city FROM visits. What must it add to guarantee alphabetical city order?", "ORDER BY city", ["Nothing; DISTINCT guarantees alphabetical order", "A larger table", "SELECT * instead of DISTINCT city"], "Duplicate removal does not promise output order.", ""),
    ("tie-break", "sql-ordering", 3, "Several records share a city. The report must sort cities alphabetically and then amounts ascending within each city. Which clause fits?", "ORDER BY city, amount", ["ORDER BY amount, city", "ORDER BY city only", "WHERE city AND amount"], "Ordering keys are applied from left to right.", ""),
    ("two-conditions", "sql-filtering", 3, "Rows are (city='A', amount=20), (city='A', amount=80), (city='B', amount=90). Which row survives WHERE city = 'A' AND amount > 50?", "Only (A, 80)", ["Both rows from A", "Both rows with amount above 50", "All three rows"], "Both predicates must be true for the same row.", ""),
])

bank("voidfill-sql-1", "https://www.postgresql.org/docs/current/tutorial-join.html", "sql",
     "Inner/left joins, qualified columns, one-to-many matches and self-join aliases.", [
    ("join-key", "sql-join-condition", 1, "orders has customer_id; customers has id. Which join condition associates each order with its customer?", "orders.customer_id = customers.id", ["orders.id = customers.id regardless of meaning", "orders.customer_id = orders.customer_id", "customers.id = customers.id"], "The condition compares the related key from each table.", ""),
    ("inner-unmatched", "sql-inner-join", 2, "An order has no matching customer. What happens to it in an INNER JOIN on customer_id = id?", "It is absent from the joined result", ["It becomes a new customer row", "It is always returned with NULL customer fields", "It deletes the unmatched order from storage"], "An inner join returns matching row pairs.", ""),
    ("left-unmatched", "sql-left-join", 1, "How can a query retain all teams, including teams with no matching projects?", "Use teams LEFT JOIN projects on the team key", ["Use only an INNER JOIN", "Add DISTINCT to an INNER JOIN", "Sort the projects table first"], "A left join retains an unmatched left row with NULL right-side fields.", ""),
    ("one-to-many", "sql-join-cardinality", 3, "One customer row matches three order rows. With no grouping or DISTINCT, how many joined rows represent that customer?", "3", ["1", "0", "4"], "Each matching pair contributes a result row.", ""),
    ("ambiguous-column", "sql-qualified-columns", 3, "Both joined tables have a column called name. Which select list explicitly requests the customer's name?", "SELECT customers.name", ["SELECT name without qualification", "SELECT orders.name", "SELECT customers FROM name"], "Qualification identifies which table supplies a duplicated column name.", ""),
    ("self-aliases", "sql-self-join", 3, "An employee table is joined to itself to pair staff with managers. Why assign aliases worker and manager?", "To distinguish the table's two roles and qualify their columns", ["To create two persistent copies of the table", "To guarantee one employee per department", "To prevent a missing manager from existing"], "Aliases let a self-join refer independently to each table instance.", ""),
])

bank("voidfill-sql-2", "https://www.postgresql.org/docs/current/tutorial-agg.html", "sql",
     "Whole-table and grouped aggregates, pre/post aggregation filters and an independent maximum subquery.", [
    ("max-value", "sql-aggregate", 1, "Which expression finds the largest recorded amount in invoices?", "SELECT MAX(amount) FROM invoices;", ["SELECT amount FROM invoices;", "SELECT MAX(invoices) FROM amount;", "SELECT amount AS MAX FROM invoices;"], "MAX combines the input values into their maximum.", ""),
    ("group-count", "sql-grouping", 1, "A table has four rows for team A and two for team B. SELECT team, COUNT(*) FROM tasks GROUP BY team returns how many result rows?", "2", ["6", "4", "1"], "The query produces one row for each team group.", ""),
    ("having-role", "sql-group-filter", 2, "Which clause keeps only team groups with at least five tasks?", "HAVING COUNT(*) >= 5", ["WHERE COUNT(*) >= 5", "ORDER BY COUNT(*) >= 5", "FROM COUNT(*) >= 5"], "HAVING filters groups after aggregation.", ""),
    ("pre-filter", "sql-filter-order", 3, "A grouped report must count only open tasks per team. Where should status = 'open' be applied?", "In WHERE, before GROUP BY", ["Only in ORDER BY", "After COUNT(*) in the select list as a replacement for filtering", "As GROUP BY status = 'open' while counting every row"], "Input rows are filtered before their group aggregates are computed.", ""),
    ("maximum-row", "sql-aggregate-subquery", 3, "Which condition can select every invoice tied for the greatest amount?", "WHERE amount = (SELECT MAX(amount) FROM invoices)", ["WHERE amount = MAX(amount) in the same query level", "WHERE MAX(amount) = invoices", "GROUP BY MAX(amount)"], "The independent subquery computes the value needed by the outer row filter.", ""),
    ("filtered-aggregate", "sql-filter-order", 3, "Team A has open amounts 3 and 7, plus closed amount 100. What does SUM(amount) produce for A after WHERE status = 'open'?", "10", ["110", "100", "2"], "The closed row is removed before the sum.", ""),
])

bank("0ad4c1aac9788e7c692ef68b", PINNED + "2-Working-With-Data/05-relational-databases/README.md", "sql",
     "Table relationships, stable row identifiers, SELECT/WHERE and joining fictional measurements; correct comma syntax is used rather than copying the pinned example's typo.", [
    ("row-identity", "relational-keys", 1, "What is the purpose of a primary key in a table of rooms?", "Identify one particular room row", ["Store every room's measurements in one text field", "Automatically sort rooms by size", "Replace every other column"], "A primary key identifies a row, independently of its descriptive fields.", "#the-concepts-of-relationships"),
    ("foreign-reference", "relational-relationships", 1, "measurements.room_id points to rooms.room_id. What does that column express?", "Which room a measurement belongs to", ["The number of measurement rows automatically", "That both tables must have identical columns", "The display order of all rooms"], "The referencing key associates a measurement with its room.", "#the-concepts-of-relationships"),
    ("choose-columns", "relational-query", 2, "Which query selects room names only for building 'West'?", "SELECT name FROM rooms WHERE building = 'West';", ["SELECT * FROM rooms;", "SELECT building FROM rooms WHERE name = 'West';", "SELECT name FROM rooms ORDER BY building;"], "The select list chooses names and WHERE restricts the building.", "#retrieving-the-data"),
    ("changing-name", "relational-keys", 3, "Several measurement rows reference a room whose display name may change. Which design avoids using that changing label as the relationship key?", "Reference a stable room_id and keep the name as a descriptive column", ["Repeat the display name in every measurement and use it as the only identity", "Remove every relationship between tables", "Create a new table for every spelling of a name"], "A stable identifier separates row identity from a mutable label.", "#the-concepts-of-relationships"),
    ("correct-comma", "relational-query", 3, "Which select list correctly requests both rooms.name and measurements.amount in SQL?", "SELECT rooms.name, measurements.amount", ["SELECT rooms.name measurements.amount", "SELECT rooms.name AND measurements.amount", "SELECT rooms.name FROM measurements.amount"], "Separate selected expressions with a comma; the pinned lesson's join example omits one.", "#joining-data"),
    ("year-join", "relational-relationships", 3, "Joined measurement rows cover several years. Which addition restricts the report to year 2024 without changing the key relationship?", "WHERE measurements.year = 2024", ["ON rooms.room_id = measurements.year", "SELECT only the room table and discard measurements", "ORDER BY measurements.year without filtering"], "The key pairs rooms with measurements; the row predicate selects the requested year.", "#joining-data"),
])

bank("84473a87643db1c9873ef626", PINNED + "2-Working-With-Data/06-non-relational/README.md", "sql",
     "The document-query portion: JSON fields, container selection and property predicates in the source's Cosmos SQL examples. This is not a full relational SQL or Cosmos administration assessment.", [
    ("query-all", "documents-query", 1, "In the lesson's document-query examples, what does SELECT * FROM c return without WHERE?", "All documents in the queried container", ["Only the first document", "All SQL tables on the computer", "Only documents without an id"], "The example queries the container without a filtering predicate.", "#querying-document-data-with-the-cosmos-db-emulator"),
    ("property-filter", "documents-predicate", 1, "In SELECT * FROM c WHERE c.age < 25, which document property is tested?", "age", ["id", "firstname", "_etag"], "The predicate explicitly references c.age.", "#querying-document-data-with-the-cosmos-db-emulator"),
    ("document-field", "documents-fields", 2, "A JSON document contains {\"firstname\": \"Noor\", \"age\": 31}. Which pair correctly identifies a field and its value?", "age and 31", ["31 and age", "firstname and age", "The document has no named fields"], "A document associates named fields with their values.", "#document-data-stores-with-the-azure-cosmos-db"),
    ("boundary", "documents-predicate", 3, "Three documents have ages 24, 25 and 30. Which ages match c.age < 25?", "Only 24", ["24 and 25", "25 and 30", "All three"], "Strictly less than excludes the boundary value 25.", "#querying-document-data-with-the-cosmos-db-emulator"),
    ("change-threshold", "documents-query", 3, "A document query currently uses WHERE c.age < 25. To include only ages above 40, what changes?", "Use WHERE c.age > 40", ["Keep the same predicate and rename the container", "Use WHERE c.id > 40", "Remove WHERE, which applies the age limit automatically"], "The intended property and comparison must appear in the predicate.", "#querying-document-data-with-the-cosmos-db-emulator"),
    ("query-does-not-convert", "documents-fields", 3, "The document store accepts SELECT syntax. What can be inferred about its data model from that syntax alone?", "It does not prove the documents are stored as relational tables", ["Every document must have the same columns as every other document", "A SELECT query converts documents into persistent SQL tables", "Foreign-key constraints are automatically created by SELECT"], "The lesson demonstrates SQL-style querying over a document model.", "#document-data-stores-with-the-azure-cosmos-db"),
])

bank("c9b51ac25661fe54207ddcd9", PINNED + "2-Working-With-Data/07-python/README.md", "python",
     "Pandas Series alignment, column selection and Boolean row filters in the public Python data-processing lesson; assumes basic Python and does not assess the companion notebook.", [
    ("frame-column", "pandas-selection", 1, "For a DataFrame df with column 'cost', what does df['cost'] return?", "A Series for that column", ["A Python set of all column names", "A new SQL database", "Only the column's largest value"], "Selecting one named column returns a Series.", "#dataframe"),
    ("frame-subset", "pandas-selection", 2, "Which expression selects columns 'name' and 'cost' as a DataFrame in that order?", "df[['name', 'cost']]", ["df['name', 'cost']", "df['name'] + df['cost']", "df[df['cost'] > 0]"], "A list of column labels selects a column subset.", "#dataframe"),
    ("row-mask", "pandas-filtering", 1, "Which expression retains rows whose cost is greater than 10?", "df[df['cost'] > 10]", ["df['cost'] > 10 without selecting rows", "df[['cost']]", "df['cost'] = 10"], "The Boolean Series is used as the DataFrame's row-selection mask.", "#dataframe"),
    ("two-masks", "pandas-filtering", 3, "Which filter keeps costs strictly between 10 and 20?", "df[(df['cost'] > 10) & (df['cost'] < 20)]", ["df[df['cost'] > 10 and df['cost'] < 20]", "df[(df['cost'] > 10) | (df['cost'] < 20)]", "df[['cost', 10, 20]]"], "Use parenthesized elementwise masks with &: Python and cannot combine two Series this way.", "#dataframe"),
    ("index-alignment", "pandas-alignment", 3, "Series a has {'Mon': 3, 'Tue': 5}; b has {'Tue': 2}. What does a.add(b, fill_value=0) produce at Mon and Tue?", "3 and 7", ["5 and 5", "NaN and 7", "3 and 2"], "Series align by label, and fill_value supplies zero for the missing Mon entry in b.", "#series"),
    ("length-broadcast", "pandas-column-values", 3, "df has three rows. After df['size'] = len(df['name']), which values are assigned to size?", "3 in each row", ["Each individual name's character count", "Only the first name's character count", "The labels of the name column's index"], "len on a Series returns its row count, which is broadcast as one scalar.", "#dataframe"),
])

ORIENTATIONS = [{
    "resource_ids": ["d4efc35e0bb394adf9e02a90"],
    "url": "https://github.com/microsoft/ML-For-Beginners/blob/653bc95f0df772b6910c5aab8a7d9db351d454e5/2-Regression/1-Tools/README.md",
    "topics": ["python"], "reviewed_at": REVIEWED, "kind": "scope-mismatch",
    "reason": "This applied machine-learning walkthrough covers notebook setup and Scikit-learn regression. Its catalogue tag is Python, but it assumes Python and does not provide a Python-language fundamentals lesson. It is retained as supplemental reading without a Python completion quiz; use the language lessons below for that skill. Existing assessment history is preserved.",
    "child_resource_ids": ["voidfill-python-0", "voidfill-python-1"],
}]

SOURCE_FINDINGS = [
    {"resource_ids": ["0ad4c1aac9788e7c692ef68b"], "url": PINNED + "2-Working-With-Data/05-relational-databases/README.md", "reviewed_at": REVIEWED,
     "section": "Joining data", "detail": "Both displayed joined SELECT examples omit the comma between cities.city and rainfall.amount. Use SELECT cities.city, rainfall.amount; the lesson checks use valid syntax.",
     "support_urls": ["https://www.postgresql.org/docs/current/tutorial-join.html"]},
    {"resource_ids": ["c9b51ac25661fe54207ddcd9"], "url": PINNED + "2-Working-With-Data/07-python/README.md", "reviewed_at": REVIEWED,
     "section": "DataFrame", "detail": "The displayed transpose/rename expression contains two periods after T, which is invalid Python. Use .T.rename(...). The displayed string table also differs from the literal Series in its code, so compute example results from the code rather than copying the table. These checks do not depend on that mismatched table.",
     "support_urls": ["https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.transpose.html", "https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.rename.html"]},
]
