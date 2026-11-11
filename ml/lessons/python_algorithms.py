"""Original short checks grounded in three named Python documentation pages.

These scenarios target the stated operations, not full Python/algorithm mastery.
Only APIs already available in the serving Python 3.12 runtime are used.
"""

DATA_STRUCTURES = {
    "resource_ids": ["voidfill-python-1", "career-resource-bee16746c6eb2effd701"],
    "url": "https://docs.python.org/3/tutorial/datastructures.html",
    "topics": ["python", "algorithms"],
    "reviewed_at": "2026-11-10",
    "scope": "List mutation, uniqueness/key lookup and queue operations; short checks rather than complete chapter coverage.",
    "questions": [
        ("append-nested", "list-operations", 1, "After values = [4, 8] and values.append([12, 16]), what is len(values)?", "3", ["2", "4", "5"], "append adds one object, including a list.", "#more-on-lists"),
        ("sort-return", "list-operations", 2, "A report runs names = ['Zed', 'Ada']; result = names.sort(). Which pair describes names and result?", "['Ada', 'Zed'] and None", ["['Zed', 'Ada'] and ['Ada', 'Zed']", "None and ['Ada', 'Zed']", "['Ada', 'Zed'] and ['Ada', 'Zed']"], "sort changes its list and returns None.", "#more-on-lists"),
        ("unique-codes", "set-operations", 1, "A batch contains codes ['K2', 'K2', 'M7']. Which expression produces the two unique codes without promising their order?", "set(codes)", ["list(codes)", "tuple(codes)", "codes.sort()"], "A set removes duplicate values without preserving a sequence order.", "#sets"),
        ("queue-front", "queue-operations", 3, "A service repeatedly removes the earliest request from a large list using pop(0). Which replacement preserves arrival order with efficient removals at the front?", "Use a deque and popleft()", ["Use a list and pop()", "Use a set and pop()", "Sort the list before every removal"], "deque supports efficient FIFO removal at its left end.", "#using-lists-as-queues"),
        ("nested-copy", "list-operations", 3, "original = [[2]]; copied = original.copy(); copied[0].append(9). What is original now?", "[[2, 9]]", ["[[2]]", "[[9]]", "[[2], [9]]"], "A shallow copy still shares nested mutable objects.", "#more-on-lists"),
        ("membership-key", "dictionary-operations", 3, "stock = {'P1': 0, 'P2': 7}. A check must distinguish an absent product from a product with zero stock. Which test checks presence?", "product in stock", ["bool(stock.get(product))", "stock.get(product, 0) > 0", "product in stock.values()"], "Dictionary membership tests keys, independently of their values.", "#dictionaries"),
    ],
}

BISECT = {
    "resource_ids": ["career-resource-14729e0f9e99c6dd96bd"],
    "url": "https://docs.python.org/3/library/bisect.html",
    "topics": ["algorithms"],
    "reviewed_at": "2026-11-10",
    "scope": "Insertion boundaries, lookup verification and insertion cost on a sorted list.",
    "questions": [
        ("left-duplicate", "insertion-boundary", 1, "For [3, 6, 6, 10], what does bisect_left(values, 6) return?", "1", ["0", "2", "3"], "The left boundary comes before existing equal entries.", "#bisect.bisect_left"),
        ("right-duplicate", "insertion-boundary", 2, "For [3, 6, 6, 10], what does bisect_right(values, 6) return?", "3", ["1", "2", "4"], "The right boundary follows all existing equal entries.", "#bisect.bisect_right"),
        ("missing-value", "search-versus-insert", 2, "bisect_left([2, 5, 9], 7) returns 2. What does that result establish?", "7 could be inserted at index 2", ["The value 7 was found at index 2", "Exactly two copies of 7 exist", "The input was sorted by the call"], "An insertion position does not prove a matching value exists.", "#bisect.bisect_left"),
        ("find-equal", "search-versus-insert", 3, "After i = bisect_left(values, target) on a sorted list, which condition safely confirms an exact match?", "i < len(values) and values[i] == target", ["values[i] == target before checking i", "i >= 0", "i <= len(values)"], "Check the upper bound before inspecting the candidate value.", "#searching-sorted-lists"),
        ("insertion-cost", "operation-cost", 3, "A growing Python list receives one insort_left call per new record. Why can each insertion still require linear work?", "Moving later list elements dominates the logarithmic search", ["Binary search always compares every record", "insort sorts an entirely separate copy", "The key function must be recursive"], "Finding a position is cheaper than shifting a list suffix.", "#bisect.insort_left"),
        ("key-probe", "key-comparison", 3, "Rows are sorted by r['score']. Which search correctly finds the left boundary for numeric score 70 using key=lambda r: r['score']?", "bisect_left(rows, 70, key=lambda r: r['score'])", ["bisect_left(rows, {'score': 70}, key=lambda r: r['score'])", "bisect_left(rows, 70) without a key", "bisect_left(rows, 70, key=lambda r: -r['score'])"], "The search probe must already be in comparison-key form.", "#bisect.bisect_left"),
    ],
}

HEAPQ = {
    "resource_ids": ["career-resource-6a9a3392c1455846b61b"],
    "url": "https://docs.python.org/3/library/heapq.html",
    "topics": ["algorithms"],
    "reviewed_at": "2026-11-10",
    "scope": "Min-heap invariants, replacement operations and explicit equal-priority tie handling.",
    "questions": [
        ("peek-min", "heap-invariant", 1, "A nonempty min-heap stores deadline numbers. Which expression reads the earliest deadline without removal?", "heap[0]", ["heap[-1]", "heap.pop()", "heap[1]"], "The root of a min-heap contains its smallest value.", "#heapq.heappop"),
        ("not-sorted", "heap-invariant", 2, "The list [1, 4, 2, 9, 7] satisfies the min-heap invariant. What can be concluded about its whole-list ordering?", "It need not be completely sorted", ["It must be in increasing order", "It must be in decreasing order", "Its last item must be the largest"], "Parent-child heap order is weaker than complete sorted order.", "#theory"),
        ("heapify-result", "build-heap", 1, "What does heapify(values) do to an ordinary list of comparable values?", "Rearranges it into a heap in place", ["Returns a new sorted list", "Removes every duplicate", "Converts it to a balanced search tree object"], "heapify establishes the heap invariant on the existing list.", "#heapq.heapify"),
        ("pushpop", "replacement-operations", 3, "heap is [4, 9]. After result = heappushpop(heap, 2), what are result and heap?", "2 and [4, 9]", ["4 and [2, 9]", "9 and [2, 4]", "2 and [2, 4, 9]"], "Push-then-pop removes the smallest value, including the new item.", "#heapq.heappushpop"),
        ("replace", "replacement-operations", 3, "heap is [4, 9]. After result = heapreplace(heap, 2), what are result and heap?", "4 and [2, 9]", ["2 and [4, 9]", "9 and [2, 4]", "4 and [4, 9]"], "Replacement removes the old root before inserting its replacement.", "#heapq.heapreplace"),
        ("stable-ties", "priority-ties", 3, "Two queued tasks have equal numeric priority and their task objects cannot be compared. Which entry shape provides a deterministic arrival-order tie-break?", "(priority, increasing_sequence, task)", ["(priority, task) with no tie-break", "(task, priority)", "(priority, decreasing_random_value, task)"], "A unique increasing counter resolves ties before comparing task objects.", "#priority-queue-implementation-notes"),
    ],
}

BANKS = [DATA_STRUCTURES, BISECT, HEAPQ]
