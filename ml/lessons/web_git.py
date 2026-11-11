"""Original checks for reviewed Web/Git/React/accessibility source pages.

Pinned Microsoft lessons were downloaded in full at their stored commit.
Official MDN, Git, React and WAI pages were checked on 10 November 2026.
Navigation/setup-only pages are recorded separately, never given invented quizzes.
"""

PINNED = "https://github.com/microsoft/Web-Dev-For-Beginners/blob/afcbf7b9134080479c6e6a247e8df5cacabe79a0/"
BANKS = []


def add(resource_id, url, topic, scope, questions):
    BANKS.append({"resource_ids": [resource_id], "url": url,
                  "topics": [topic], "reviewed_at": "2026-11-10",
                  "scope": scope, "questions": questions})


def pinned(resource_id, path, scope, questions, topic="web"):
    add(resource_id, PINNED + path + "/README.md", topic, scope, questions)


add("voidfill-web-0", "https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Your_first_website/Creating_the_content", "web",
    "HTML structure, attributes, images, lists and links.", [
    ("paragraph", "html-structure", 1, "Which markup identifies a paragraph containing a club notice?", "<p>Club notice</p>", ["<title>Club notice</title>", "<img>Club notice</img>", "<link>Club notice</link>"], "The p element marks paragraph content.", "#so_what_is_html"),
    ("attribute", "html-attributes", 1, "In <img src='badge.png' alt='Club badge'>, which attribute names the image file?", "src", ["alt", "img", "badge"], "src identifies the image resource.", "#embedding_images"),
    ("unordered", "html-structure", 2, "A list of supplies has no required order. Which container fits?", "ul containing li elements", ["ol containing p elements", "img containing li elements", "head containing title elements"], "An unordered list groups items without an ordered sequence.", "#marking_up_text"),
    ("link-target", "html-links", 3, "A link says Volunteer guide but opens the wrong page. Which attribute needs checking?", "href", ["alt", "src", "lang"], "href supplies the link's destination.", "#creating_links"),
    ("nest-order", "html-structure", 3, "Which nesting correctly emphasizes a word inside a paragraph?", "<p>Read <strong>carefully</strong>.</p>", ["<p>Read <strong>carefully.</p></strong>", "<strong><p>Read carefully.</strong></p>", "<p>Read </strong>carefully<strong>.</p>"], "Nested elements close in reverse opening order.", "#so_what_is_html"),
    ("image-purpose", "html-attributes", 3, "A meaningful diagram may fail to load. Which image attribute provides a text alternative?", "alt", ["href", "class", "height"], "alt communicates image meaning without depending on the image.", "#embedding_images"),
])

add("voidfill-web-1", "https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Your_first_website/Styling_the_content", "web",
    "Stylesheet connection, selectors, declarations and the content-box model.", [
    ("selector", "css-rules", 1, "In p { color: navy; }, what selects the elements?", "p", ["color", "navy", "The semicolon"], "The selector identifies which elements receive declarations.", "#css_syntax_basics"),
    ("declaration", "css-rules", 1, "Which declaration changes the text color to teal?", "color: teal;", ["teal: color;", "font: teal();", "text = teal;"], "A declaration pairs a property with its value.", "#css_syntax_basics"),
    ("stylesheet", "css-connection", 2, "Which head element connects styles/site.css to an HTML page?", "<link rel='stylesheet' href='styles/site.css'>", ["<img src='styles/site.css'>", "<a href='styles/site.css'>", "<script alt='styles/site.css'>"], "A stylesheet link loads CSS for the page.", "#applying_css_to_your_html"),
    ("box-width", "css-boxes", 3, "A content-box has width 100px, horizontal padding 8px and borders 2px per side. Its outer width excluding margins?", "120px", ["100px", "110px", "116px"], "Add both padding and both border widths: 100+16+4.", "#css_is_all_about_boxes"),
    ("outside-space", "css-boxes", 3, "Which property creates space outside an element's border?", "margin", ["padding", "font-size", "color"], "Margins separate the border from surrounding content.", "#css_is_all_about_boxes"),
    ("center-block", "css-positioning", 3, "A narrower block needs equal remaining horizontal space on each side. Which margin setting fits?", "margin: 0 auto;", ["margin: auto 0;", "padding: 0 auto;", "text-align: auto;"], "Automatic left/right margins split the remaining space.", "#styling_the_body"),
])

add("voidfill-git-0", "https://git-scm.com/docs/gittutorial", "git",
    "Snapshots, staging, diffs, history and collaboration basics.", [
    ("init", "git-repository", 1, "Which command starts version control in an existing project directory?", "git init", ["git status", "git log", "git diff"], "init creates the repository metadata.", "#_importing_a_new_project"),
    ("stage", "git-snapshot", 1, "Which command stages the current contents of notes.txt?", "git add notes.txt", ["git log notes.txt", "git branch notes.txt", "git fetch notes.txt"], "add copies the selected content into the index.", "#_making_changes"),
    ("history", "git-history", 2, "Which command shows earlier commits?", "git log", ["git status", "git init", "git add"], "log inspects committed history.", "#_viewing_project_history"),
    ("staged-version", "git-snapshot", 3, "You stage a file, edit it again, then commit without adding again. What is committed?", "The staged version", ["The latest unstaged edit", "Only its filename", "Both versions as separate commits"], "A commit records the index snapshot.", "#_git_tracks_content_not_files"),
    ("staged-diff", "git-snapshot", 3, "Which diff previews staged changes for the next commit?", "git diff --cached", ["git log --oneline", "git diff --name-only HEAD~10", "git branch --list"], "The cached diff compares the index with HEAD.", "#_making_changes"),
    ("local-commit", "git-collaboration", 3, "A successful local commit has not been pushed. What can collaborators assume?", "It is not necessarily on the shared remote", ["It is already on every clone", "It deleted their branches", "It bypassed their review requirements"], "Committing and publishing to a remote are separate operations.", "#_using_git_for_collaboration"),
])

add("voidfill-git-1", "https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell", "git",
    "Commit pointers, HEAD and branch creation versus checkout.", [
    ("branch-pointer", "git-branch-pointer", 1, "What does a Git branch name normally point to?", "A commit", ["A second working directory", "An isolated copy of every file", "A remote account"], "A branch is a lightweight movable commit reference.", ""),
    ("head", "git-head", 1, "In normal attached operation, HEAD identifies which branch?", "The checked-out branch", ["Every remote branch", "The oldest branch", "The branch with the longest name"], "HEAD identifies the current branch reference.", "#_switching_branches"),
    ("create-only", "git-branch-create", 2, "What does git branch review create without switching branches?", "A review reference at the current commit", ["A new commit named review", "A checkout of review", "A remote repository named review"], "Creating a branch does not check it out.", "#_create_new_branch"),
    ("moves-current", "git-branch-pointer", 3, "main and review point to one commit. You switch to review and commit. Which branch advances?", "review", ["Both branches", "Only main", "Neither branch"], "The checked-out branch advances with its new commit.", "#_switching_branches"),
    ("switch-content", "git-head", 3, "Why can switching between different branch tips change tracked files?", "The working tree is updated to the selected snapshot", ["Every switch rewrites all commits", "Branch names are folders inside source code", "Git downloads a fresh project on each switch"], "Checkout selects the target commit's tracked contents.", "#_switching_branches"),
    ("same-tip", "git-branch-create", 3, "Two branch names point to the same commit. Must their committed snapshots differ?", "No, both references name the same snapshot", ["Yes, names define separate file contents", "Yes, one snapshot is always empty", "Only if both are remote branches"], "Different references can identify the same commit.", "#_create_new_branch"),
])

add("voidfill-git-2", "https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes", "git",
    "Remote names, fetch versus integration and explicit push destinations.", [
    ("show-remotes", "git-remote-name", 1, "Which command lists remote names and their URLs?", "git remote -v", ["git branch -d", "git log --all", "git diff --cached"], "The verbose remote listing shows fetch/push destinations.", "#_showing_your_remotes"),
    ("origin", "git-remote-name", 1, "After a normal clone, origin is conventionally what?", "The default name for the cloned remote", ["A mandatory branch name", "An immutable commit", "The local username"], "origin is a conventional remote alias.", "#_showing_your_remotes"),
    ("fetch", "git-fetch", 2, "Which command downloads new data from a remote named team?", "git fetch team", ["git add team", "git init team", "git commit team"], "fetch obtains remote objects and tracking references.", "#_fetching_and_pulling"),
    ("fetch-no-merge", "git-fetch", 3, "Your local file has not changed after git fetch team. Does that alone indicate failure?", "No; fetch does not automatically merge into the working branch", ["Yes; every fetch must rewrite local files", "Yes; fetch always checks out the remote", "No; fetch only changes file timestamps"], "Fetched work can be inspected before integration.", "#_fetching_and_pulling"),
    ("push-destination", "git-push", 3, "What destination does git push team feature specify?", "The feature branch on remote team", ["The team branch on remote feature", "Every branch on every remote", "A local directory named feature"], "Remote and branch arguments select publication targets.", "#_pushing_remotes"),
    ("remote-remove", "git-remote-name", 3, "Removing a remote alias from local configuration necessarily deletes the hosted repository?", "No; it removes this clone's remote configuration", ["Yes, along with every hosted branch", "Yes, but only the default branch", "Only if the alias is origin"], "A remote alias is local configuration.", "#_renaming_and_removing_remotes"),
])

add("career-resource-b377ef5d42a571298845", "https://git-scm.com/book/en/v2/Getting-Started-About-Version-Control", "git",
    "History, comparison, recovery and local/centralized/distributed approaches.", [
    ("purpose", "vcs-history", 1, "What does version control retain to support later recall?", "Changes to files over time", ["Only the current filename", "Only a screenshot of the editor", "Every user's password"], "Recorded versions support history and comparison.", "#_about_version_control"),
    ("compare", "vcs-history", 1, "A diagram looked correct last week. Which VCS capability helps investigate its change?", "Compare earlier and current versions", ["Rename the current file repeatedly", "Disable history", "Discard every earlier version"], "Version history supports comparison across time.", "#_about_version_control"),
    ("distributed", "vcs-architecture", 2, "A distributed VCS clone normally includes what?", "The repository history", ["Only the current screenshot", "Only remote usernames", "Only an empty branch list"], "Distributed clients mirror repository history.", "#_distributed_version_control_systems"),
    ("not-backup-only", "vcs-recovery", 3, "An uncommitted, untracked sketch is lost. Does recorded project history guarantee its recovery?", "No; that content may never have been recorded", ["Yes, every disk file is versioned automatically", "Yes, branch names preserve unsaved editor buffers", "Only if its filename contained a date"], "Recovery relies on what was actually recorded.", "#_about_version_control"),
    ("central-server", "vcs-architecture", 3, "Why can a centralized server failure interrupt collaboration?", "Clients depend on the central service for shared versioned work", ["All clients become distributed mirrors automatically", "Local file editing becomes physically impossible", "Version history becomes a CSS stylesheet"], "Centralization introduces a shared availability dependency.", "#_centralized_version_control_systems"),
    ("beyond-code", "vcs-recovery", 3, "A designer wants traceable revisions of layout files. Is VCS limited to programming source?", "No; it can record other file types too", ["Yes; only executable text is supported", "Yes; only JavaScript can be versioned", "Only after converting images into passwords"], "Version control can track files beyond program code.", "#_about_version_control"),
])

add("career-resource-75f1d01d8f91f12dfe75", "https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository", "git",
    "Tracked/untracked states, staging snapshots, ignore rules and diffs.", [
    ("status", "git-file-state", 1, "Which command reports tracked changes and untracked files?", "git status", ["git init", "git log --oneline", "git remote -v"], "status describes working-tree and index state.", "#_checking_status"),
    ("untracked", "git-file-state", 1, "A new file appears as untracked. Is it already part of the next commit?", "No; it must first be staged", ["Yes, because it is in the folder", "Yes, after closing the editor", "Only when the branch is main"], "Untracked content is outside the staged snapshot.", "#_tracking_files"),
    ("ignore", "git-ignore", 2, "Which file records patterns for intentionally untracked generated output?", ".gitignore", ["HEAD", "package-lock-only", ".gitmessage-history"], "Ignore rules keep matching untracked output out of routine tracking.", "#_ignoring"),
    ("two-versions", "git-staging", 3, "An edited file appears both staged and unstaged after another edit. What explains this?", "The index and working tree contain different versions", ["Git made two repositories", "The branch has no commits", "The remote duplicated the file"], "Staging captures content at the time of add.", "#_staging_modified_files"),
    ("unstaged-diff", "git-staging", 3, "Without options, git diff primarily compares which two states?", "Working tree and index", ["Two arbitrary remote servers", "Only the latest two branch names", "The index and every historical commit"], "The ordinary diff shows changes not yet staged.", "#_git_diff_staged"),
    ("tracked-ignore", "git-ignore", 3, "A tracked build file matches a newly added ignore rule. Does the rule automatically stop tracking it?", "No; already tracked files remain tracked", ["Yes, its history is erased", "Yes, its last commit is removed", "Only after reopening the terminal"], "Ignore rules principally affect untracked files.", "#_ignoring"),
])

add("career-resource-0311ea2c2be33640113c", "https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging", "git",
    "Branch isolation, fast-forward/divergent merges and conflict resolution.", [
    ("isolate", "git-branch-workflow", 1, "Why create a branch for an isolated repair?", "To develop its commits separately from another branch", ["To remove the repository history", "To publish every edit automatically", "To change every collaborator's password"], "A branch provides a separate line of committed work.", "#_basic_branching"),
    ("merge-target", "git-merge", 1, "While main is checked out, git merge repair integrates repair into which branch?", "main", ["Only repair", "Every branch", "No branch, only the remote alias"], "The current branch receives the integration.", "#_basic_merging"),
    ("fast-forward", "git-merge", 2, "When is a fast-forward merge possible?", "The current tip is an ancestor of the target tip", ["The two branches have unrelated histories", "Both branches contain conflicting edits", "The target has no commits"], "The branch pointer can advance along existing history.", "#_basic_merging"),
    ("diverged", "git-merge", 3, "Both branches added distinct commits after a shared ancestor. A normal successful merge may create what?", "A commit joining both parent histories", ["A rewritten copy of every ancestor", "An empty repository", "A new remote account"], "A three-way merge can record the integration with two parents.", "#_basic_merging"),
    ("conflict", "git-conflicts", 3, "Git reports conflicting edits to the same lines. Which action completes a reviewed resolution?", "Resolve the file, stage it and commit the merge", ["Commit unresolved markers unchanged", "Assume the server chooses the intended wording", "Rename the remote and skip inspection"], "A human resolves the intended content before recording it.", "#_basic_merge_conflicts"),
    ("conflict-status", "git-conflicts", 3, "After editing conflict markers away, why inspect git status before committing?", "To identify remaining unmerged or unstaged paths", ["To guarantee the chosen behavior is correct", "To send the resolution to all remotes", "To bypass source review"], "Status exposes unresolved paths but does not validate intent.", "#_basic_merge_conflicts"),
])

add("career-resource-7ce0ada67de9b1b42cca", "https://react.dev/learn", "react",
    "Components, JSX, event handlers, state snapshots and shared state.", [
    ("component", "react-component", 1, "Which JSX name identifies a custom React component?", "<ScoreCard />", ["<scorecard />", "<div />", "<span />"], "Custom component names begin with a capital letter.", "#components"),
    ("class-name", "react-jsx", 1, "Which JSX attribute applies an ordinary CSS class?", "className", ["cssName", "styleClass", "classListName"], "JSX uses className for CSS classes.", "#adding-styles"),
    ("handler", "react-events", 2, "Which button passes its click handler instead of calling it during rendering?", "<button onClick={save} />", ["<button onClick={save()} />", "<button onClick='save()' />", "<button click={save()} />"], "Pass the function reference for React to call on the event.", "#responding-to-events"),
    ("separate-counters", "react-state", 3, "Two Counter instances each call useState(0). Updating one normally changes which state?", "That instance's state", ["Both instances automatically", "Every component's state", "Only a shared module variable"], "Each component instance has its own state.", "#updating-the-screen"),
    ("share-counter", "react-state", 3, "Two buttons need one shared count. Where should that state usually live?", "Their closest shared parent", ["Separately in both buttons", "Only in each button's DOM text", "In two unrelated local variables"], "A shared owner can pass one value and handlers to both.", "#sharing-data-between-components"),
    ("list-key", "react-list", 3, "A list may be reordered. Which key preserves each row's identity?", "Its stable item ID", ["A fresh random number each render", "Its current position only", "The same key for every row"], "Stable IDs let React match rows across updates.", "#rendering-lists"),
])

add("career-resource-65df1db716d74c199027", "https://react.dev/learn/managing-state", "react",
    "Minimal state, shared ownership, context, reducers and state identity.", [
    ("derive-name", "react-state-structure", 1, "firstName and lastName are state. How should an ordinary fullName display be obtained?", "Calculate it during rendering", ["Keep a third synchronized state value", "Read the previous DOM text", "Use two competing fullName variables"], "Derived values avoid duplicated state.", "#choosing-the-state-structure"),
    ("single-owner", "react-shared-state", 1, "Two panels must agree on the selected tab. Which ownership arrangement is simplest?", "One shared state owner above both panels", ["One independent selection per panel", "A hidden selection copied only on page reload", "A separate random initial tab in each"], "Shared state keeps coordinated views consistent.", "#sharing-state-between-components"),
    ("status", "react-state-structure", 2, "A form has mutually exclusive editing, sending and sent states. What avoids contradictory flags?", "One status value with those alternatives", ["Three independent booleans that may all be true", "Inferring status from button color", "Never recording the current status"], "One explicit state can represent mutually exclusive alternatives.", "#reacting-to-input-with-state"),
    ("deep-shared-value", "react-state-context", 3, "Many deeply nested components need the same theme. Which mechanism can provide it without passing it through every intervening component?", "Context", ["Independent unsynchronized theme state in every leaf", "A separate copy in every component's local state", "Changing each child's key on every render"], "Context lets a parent make information available to deeply nested descendants.", "#passing-data-deeply-with-context"),
    ("reset-key", "react-state-identity", 3, "A reused editor must reset its local draft when a different recipient is selected. Which identity change can reset that subtree?", "Give the editor the recipient's key", ["Reuse one constant key forever", "Change only a CSS color", "Mutate the old draft in place"], "A different key gives the component a different state identity.", "#preserving-and-resetting-state"),
    ("reducer", "react-state-update", 3, "Many handlers repeat complex state-transition rules. Which pattern centralizes those transitions?", "A reducer receiving explicit actions", ["More independent duplicated booleans", "Direct DOM mutations in every handler", "Copying state into every child"], "Reducers collect update rules in one place.", "#extracting-state-logic-into-a-reducer"),
])

add("career-resource-b24d17702d7ba53c307d", "https://react.dev/learn/you-might-not-need-an-effect", "react",
    "Derived render values, event logic, measured memoization and external synchronization.", [
    ("derive-total", "react-derived-values", 1, "A total is computed entirely from current props. Where can it normally be calculated?", "During rendering", ["Only in an Effect followed by setState", "Only after a network call", "Inside a DOM mutation"], "Pure derived values do not need synchronization Effects.", "#updating-state-based-on-props-or-state"),
    ("click-purchase", "react-event-logic", 1, "A request must occur because Buy was clicked. Which location retains that event's intent?", "The Buy click handler", ["An Effect watching unrelated rendering state", "Every component render", "A module initializer"], "Event handlers know the interaction that caused the work.", "#sharing-logic-between-event-handlers"),
    ("external", "react-synchronization", 2, "Which case can justify an Effect?", "Synchronizing with a non-React widget", ["Joining two current name strings", "Filtering an ordinary in-memory list", "Adding two current numbers"], "Effects synchronize with systems outside React.", "#how-to-remove-unnecessary-effects"),
    ("stale-copy", "react-derived-values", 3, "An Effect copies filtered props into state. Why can direct calculation be simpler?", "It avoids a stale render and an extra state update", ["It forces every list to be fetched twice", "It disables all future rendering", "It makes copied state mandatory"], "Redundant derived state adds synchronization work.", "#caching-expensive-calculations"),
    ("memo-measure", "react-performance", 3, "A pure filtering calculation is measurably expensive. Which option caches it for unchanged dependencies?", "useMemo with the relevant dependencies", ["An Effect that always sets another state copy", "A new random key on every row", "Updating state during every calculation"], "Memoization can cache an expensive pure calculation.", "#caching-expensive-calculations"),
    ("derived-selection", "react-derived-values", 3, "State stores selectedId and items. Why derive selectedItem instead of also storing that object?", "It avoids keeping two representations synchronized", ["It guarantees the item can never be deleted", "It prevents all list updates", "It makes IDs unnecessary in the data"], "Minimal state reduces inconsistent duplicated information.", "#adjusting-some-state-when-a-prop-changes"),
])

add("career-resource-7a09149eb1d40c0fba8f", "https://www.w3.org/WAI/test-evaluate/", "accessibility",
    "Evaluation timing, tool limitations, expertise, user involvement and reports.", [
    ("early", "a11y-evaluation-timing", 1, "When should accessibility evaluation begin in a redesign?", "Early and throughout development", ["Only after public launch", "Only when a complaint arrives", "Only after removing all forms"], "Early evaluation makes problems easier to address.", "#intro"),
    ("tools", "a11y-evaluation-limits", 1, "Can one automated tool alone determine that a site is accessible?", "No; knowledgeable human evaluation is also needed", ["Yes, if its badge is green", "Yes, if the homepage passes", "Only if it ignores interactive controls"], "Tools cannot determine every accessibility requirement.", "#tools"),
    ("conformance", "a11y-evaluation-method", 2, "What does conformance evaluation examine?", "How well pages or applications meet accessibility standards", ["Only how many visitors use the site", "Only the source-file count", "Only whether the color palette is fashionable"], "Conformance evaluation uses accessibility requirements.", "#conformance"),
    ("sample-users", "a11y-user-involvement", 3, "One disabled participant completes a task. What further work remains appropriate?", "Combine user observations with broader knowledgeable evaluation", ["Declare every page accessible", "Discard the participant's observations", "Replace all requirements with that single result"], "User involvement and technical evaluation provide complementary evidence.", "#people"),
    ("tool-choice", "a11y-evaluation-method", 3, "A team chooses evaluation tools for a new workflow. What should guide its selection?", "The features and needs of the evaluation situation", ["Only the largest logo", "Only the most reassuring badge", "Only whether all manual checks can be skipped"], "Different tools provide different evaluation capabilities.", "#tools"),
    ("report-scope", "a11y-evaluation-limits", 3, "A report covers selected pages and tasks. How should its conclusion be expressed?", "With the evaluated scope and remaining limitations", ["As proof for all untested pages", "As a guarantee about every assistive technology", "As a replacement for recorded findings"], "Evaluation reports need an interpretable scope.", "#conformance"),
])

add("career-resource-72efbe5bc88d6f123f40", "https://www.w3.org/WAI/tutorials/forms/", "accessibility",
    "Control labels, grouping, instructions, feedback and avoidable time pressure.", [
    ("label", "a11y-form-label", 1, "What should identify a form control's purpose?", "An associated label", ["Only its screen position", "Only an unlabeled icon", "Only a changing background color"], "Labels help users identify and operate controls.", ""),
    ("group", "a11y-form-group", 1, "Which HTML pair groups related form controls?", "fieldset and legend", ["div and br", "span and img", "script and style"], "The group and its label provide shared context.", ""),
    ("instructions", "a11y-form-help", 2, "A field requires a particular format. Where should that requirement be communicated?", "In instructions associated with the field", ["Only after repeated failure", "Only in a private developer note", "Only through a color change"], "Instructions help people complete controls correctly.", ""),
    ("error-recovery", "a11y-form-feedback", 3, "A submitted date is invalid. Which response supports correction?", "Identify the error and explain how to fix it", ["Clear the whole form without explanation", "Show only a red border", "Disable every field permanently"], "Useful notifications connect the problem with its repair.", ""),
    ("required-only", "a11y-form-help", 3, "A short transaction asks many irrelevant questions. What change reduces unnecessary form complexity?", "Request only information needed for the task", ["Add more unrelated mandatory fields", "Hide every field label", "Require completion before showing instructions"], "Unnecessary requests increase the burden of completing forms.", ""),
    ("time-pressure", "a11y-form-time", 3, "A form has no essential time requirement. What is the preferable treatment of a timer?", "Avoid imposing an unnecessary time limit", ["Always require a ten-second response", "Expire while the user reads help", "Restart the timer whenever focus moves"], "Avoidable time pressure can prevent completion.", "#a-note-on-time-limits"),
])

add("career-resource-b1795729a179434db930", "https://www.w3.org/WAI/test-evaluate/easy-checks/", "accessibility",
    "Initial checks of image purpose, headings, keyboard focus, zoom and evaluation limits.", [
    ("alt-purpose", "a11y-initial-images", 1, "What should an image's alternative text convey?", "Its purpose or meaning", ["Always its file size", "Always its download URL", "Only the artist's initials"], "Alternative text supports people who cannot see the image.", "#image-alternative-text"),
    ("headings", "a11y-initial-structure", 1, "Why do meaningful headings matter beyond visual size?", "They organize content and support navigation", ["They replace every form label", "They guarantee image contrast", "They prevent keyboard access"], "Headings communicate page structure.", "#headings"),
    ("focus", "a11y-initial-keyboard", 2, "While tabbing through controls, what should remain visibly identifiable?", "The element with keyboard focus", ["Only the mouse pointer", "Only a fixed decorative border", "Only the last clicked image"], "Visible focus lets keyboard users track their position.", "#visible-keyboard-focus"),
    ("passed-initial", "a11y-initial-limits", 3, "A page passes the easy checks. Which conclusion is justified?", "The initial checks passed; broader barriers can remain", ["The whole site is fully accessible", "All screen-reader workflows are proven", "No further assessment can add evidence"], "These checks are deliberately limited, not exhaustive.", "#introduction"),
    ("skip-main", "a11y-initial-keyboard", 3, "A keyboard user must repeatedly traverse a long menu. Which initial check targets a shortcut to content?", "Check the skip link", ["Check only image filenames", "Count all JavaScript files", "Hide the menu's focus indicators"], "Skip links provide a route to main content.", "#skip-link"),
    ("zoom-content", "a11y-initial-zoom", 3, "Enlarged page text obscures a required control. How should that observation be recorded?", "As an accessibility problem needing investigation", ["As proof zoom is unsupported by the user", "As success because normal size looked fine", "As proof every other check failed too"], "Testing enlargement can expose content or control barriers.", "#zoom"),
])

pinned("21d6f7b742af5ef625aa9253", "1-getting-started-lessons/1-intro-to-programming-languages",
       "Programming instructions, variables, conditional flow and developer tools; no claim that legacy editor recommendations remain current.", [
    ("instructions", "program-instructions", 1, "What is a running program doing?", "Carrying out instructions", ["Only storing its filename", "Always compiling another language", "Only drawing a website"], "Programs execute instructions; websites and games are examples.", "#what-is-programming"),
    ("temporary-data", "program-variables", 1, "Which program element stores a named value for later use?", "A variable", ["A syntax color", "A commit message", "A browser tab title"], "Variables let instructions retain and use data.", "#elements-of-a-program"),
    ("editor-colors", "developer-tools", 2, "An editor colors keywords to make code easier to read. What feature is this?", "Syntax highlighting", ["Version control", "Program execution", "Network caching"], "Syntax highlighting visually distinguishes parts of source code.", "#editors"),
    ("conditional-flow", "program-control", 3, "A sign-up program should show a reminder only when a field is empty. Which construct controls that choice?", "An if..else condition", ["A font extension", "A fixed unconditional statement alone", "Changing the editor theme"], "Conditional statements select which instructions run.", "#elements-of-a-program"),
    ("runtime-errors", "developer-tools", 3, "A page fails only while running in the browser. Which tool can capture information about its errors?", "Browser developer tools", ["Only the editor's color theme", "An image cropper", "Only a file rename dialog"], "DevTools expose information about the running application.", "#browsers"),
    ("learn-api", "developer-documentation", 3, "You need to learn the correct use of an unfamiliar web API. Which next step matches the lesson?", "Read its documentation", ["Assume a similar-looking API has identical behavior", "Guess its arguments only from its name", "Treat syntax highlighting as proof of correct API use"], "Documentation explains tools and languages and supports deeper understanding.", "#documentation"),
])

pinned("093e7f299d5a4a42be6f9683", "1-getting-started-lessons/2-github-basics",
       "Local Git tracking, deliberate staging, descriptive commits, GitHub collaboration and pull requests.", [
    ("status", "github-local-tracking", 1, "Which command reports staged and unstaged changes in the local project?", "git status", ["git push", "git clone", "git remote add"], "Status helps identify work ready for a commit and work still unstaged.", "#code-management"),
    ("clone", "github-collaboration", 1, "Which operation creates a local copy of an existing repository?", "Clone", ["Star", "Watch", "Open an issue"], "Cloning copies a repository so you can work with it locally.", "#how-to-contribute-to-open-source"),
    ("request-review", "github-collaboration", 2, "Where are branch changes compared and discussed before a maintainer merges them?", "A pull request", ["A browser bookmark", "A local editor theme", "Only the repository's star count"], "A pull request supports review and discussion of proposed changes.", "#task-collaborate"),
    ("selective-stage", "github-local-tracking", 3, "You changed guide.md and an unrelated scratch.txt. Only the guide belongs in the next commit. What should you stage?", "git add guide.md", ["git add .", "git push guide.md", "git clone guide.md"], "Naming the file stages the intended change without including unrelated work.", "#task-make-a-repository-and-commit-code"),
    ("message-why", "github-commit-history", 3, "Which commit subject best helps a teammate understand a concrete change?", "Fix missing keyboard focus on menu links", ["Stuff", "More changes", "Final final"], "A descriptive subject communicates the change; the body can explain its motivation.", "#commit-messages"),
    ("publish-commits", "github-remote-work", 3, "A local commit is ready and origin is configured. Which action sends branch commits to the remote?", "git push", ["git status", "git add guide.md", "Change the local folder name"], "A commit records locally; push transfers commits to the remote.", "#task-make-a-repository-and-commit-code"),
], topic="git")

pinned("3f812fe641f4b86d2834366d", "1-getting-started-lessons/3-accessibility",
       "Semantic controls, descriptive links, image alternatives, headings and manual keyboard evaluation.", [
    ("native-control", "inclusive-html", 1, "Which element expresses a button action with appropriate native semantics?", "button", ["A span styled to look pressed", "A bold text element alone", "An image with no interaction semantics"], "Appropriate native HTML communicates the control's role.", "#use-the-correct-html"),
    ("decorative-image", "inclusive-images", 1, "What alternative text fits a purely decorative image?", "alt=''", ["Omit alt so its filename is read", "alt='Important information'", "alt='Click here'"], "An empty alternative prevents unnecessary announcement of decoration.", "#images"),
    ("headings", "inclusive-structure", 2, "What helps screen-reader users navigate a long article by its sections?", "Descriptive semantic headings", ["Only larger bold paragraphs", "A different background on every paragraph", "Removing headings from the HTML"], "Heading structure supports navigation as well as visual organization.", "#create-a-descriptive-heading-hierarchy"),
    ("link-context", "inclusive-links", 3, "Several links appear in a screen reader's link list. Which text makes a destination understandable?", "Read the volunteer schedule", ["Click here", "Here", "More"], "Destination-specific wording remains meaningful outside the surrounding sentence.", "#good-link-text"),
    ("automated-limit", "inclusive-evaluation", 3, "Lighthouse reports a perfect accessibility score. What should the team do next?", "Continue manual accessibility checks", ["Treat every assistive-technology flow as proven", "Remove keyboard testing", "Assume every disabled user has identical needs"], "The lesson recommends Lighthouse as a baseline, not the only evaluation.", "#lighthouse"),
    ("keyboard-reach", "inclusive-evaluation", 3, "A visually clear control cannot be reached while tabbing. What does that reveal?", "A keyboard accessibility barrier", ["Proof all users can use the control", "Only a spelling error", "A reason to remove visible focus everywhere"], "Interactive content must work for people who rely on keyboard navigation.", "#the-keyboard"),
])

pinned("45db1418a7051a3a68f47bc2", "2-js-basics/1-data-types",
       "JavaScript variables/constants, number arithmetic, strings, interpolation and booleans.", [
    ("let-binding", "js-bindings", 1, "Which statement creates a variable named seats with value 12?", "let seats = 12;", ["12 = let seats;", "let = seats 12;", "seats let 12;"], "let declares a named variable and = supplies its initial value.", "#variables"),
    ("boolean", "js-types", 1, "Which value is a JavaScript boolean?", "false", ["'false'", "42", "'yes'"], "The boolean values true and false are distinct from quoted strings.", "#booleans"),
    ("const-rebind", "js-bindings", 2, "After const LIMIT = 8, can LIMIT = 9 replace that binding's value?", "No; reassignment of the const binding fails", ["Yes, every const is reassigned freely", "Only if 9 is larger", "Only after console.log"], "const prevents reassigning the binding; it does not promise deep immutability of objects.", "#constants"),
    ("string-plus", "js-strings", 3, "What value results from '4' + 2?", "The string '42'", ["The number 6", "The number 42", "The string '6'"], "With a string operand, + joins these values as text.", "#strings"),
    ("interpolate", "js-strings", 3, "With let seats = 7, what does `Seats: ${seats}` produce?", "Seats: 7", ["Seats: ${seats}", "Seats: seats", "7: Seats"], "A template literal evaluates the expression inside ${...}.", "#formatting-strings"),
    ("remainder", "js-arithmetic", 3, "A group has 17 tickets and packs them in batches of 5. What is 17 % 5?", "2", ["3", "3.4", "5"], "The remainder operator gives the amount left after whole batches.", "#arithmetic-operators"),
])

pinned("177807d185220783a0478e05", "2-js-basics/2-functions-methods",
       "Reusable functions, parameters, defaults, returned values and callback references.", [
    ("invoke", "js-function-calls", 1, "Which expression invokes a function named showNotice?", "showNotice()", ["showNotice", "function = showNotice", "return showNotice"], "Parentheses invoke the function.", "#creating-and-calling-a-function"),
    ("parameter", "js-function-parameters", 1, "In function greet(name) { ... }, what is name?", "A parameter for information supplied by the caller", ["Always a global browser property", "The function's returned value", "A JavaScript keyword"], "Parameters make a function reusable with different inputs.", "#passing-information-to-a-function"),
    ("return", "js-function-return", 2, "Which keyword sends a calculated result back to a function's caller?", "return", ["console", "parameter", "setTimeout"], "Returning a value lets other code use the result.", "#return-values"),
    ("default", "js-function-parameters", 3, "function total(count = 3) { return count * 2; } What does total(0) return?", "0", ["6", "3", "undefined"], "An explicitly supplied zero is used; the default applies when no value or undefined is supplied.", "#default-values"),
    ("result", "js-function-return", 3, "function double(n) { return n * 2; } What is double(4) + 1?", "9", ["8", "10", "'81'"], "The call returns 8, which is then increased by 1.", "#return-values"),
    ("callback", "js-function-callbacks", 3, "notify should run after a timeout, rather than immediately. Which call passes it as a callback?", "setTimeout(notify, 1000)", ["setTimeout(notify(), 1000)", "notify(1000)", "setTimeout(1000, notify())"], "Passing the function reference lets the timer invoke it later.", "#functions-as-parameters-for-functions"),
])

pinned("f96bb81b0ba769e1e46268cc", "2-js-basics/3-making-decisions",
       "Comparisons, if/else, switch, boolean operators and ternary choices.", [
    ("comparison", "js-comparisons", 1, "What does 8 > 5 evaluate to?", "true", ["false", "8", "5"], "A comparison reports a boolean result.", "#comparison-operators-and-booleans"),
    ("else", "js-branching", 1, "When does the else block of an if..else run?", "When the if condition is false", ["Before every if block", "Only when the condition is true", "Only after a switch"], "else defines the alternative when the condition does not hold.", "#ifelse-statement"),
    ("negation", "js-boolean-logic", 2, "What does !true evaluate to?", "false", ["true", "null", "'true'"], "! negates the boolean value.", "#negation-operator"),
    ("both-required", "js-boolean-logic", 3, "const paid = true, hasSeat = false; What is paid && hasSeat?", "false", ["true", "'truefalse'", "undefined"], "Both boolean conditions must be true for && to return true.", "#logical-operators-and-booleans"),
    ("choice", "js-branching", 3, "With let score = 7, what is score >= 8 ? 'pass' : 'retry'?", "'retry'", ["'pass'", "7", "true"], "The false branch of the ternary is selected because 7 is below 8.", "#ternary-expressions"),
    ("switch-stop", "js-switch", 3, "A matching switch case ends with break. What does break prevent here?", "Continuing into the following case's statements", ["Evaluating the switch expression at all", "Calling any function later in the program", "Entering the matching case"], "break exits the switch after the selected case's work.", "#switch-statement"),
])

pinned("f816fe36c2142be298089ac3", "2-js-basics/4-arrays-loops",
       "Zero-based array access, length, counted loops, while conditions and traversal boundaries.", [
    ("first-index", "js-array-access", 1, "Which index selects the first element of a JavaScript array?", "0", ["1", "-1", "The array's length"], "Array indexing begins at zero.", "#arrays"),
    ("length", "js-array-access", 1, "What is ['red', 'blue', 'green'].length?", "3", ["2", "4", "0"], "length is the number of elements in this array.", "#arrays"),
    ("while", "js-loop-control", 2, "When does a while loop check its condition?", "Before each iteration", ["Only after the final iteration", "Only when the array is empty", "Never; it always runs once"], "A while loop enters its body only while its condition is true.", "#while-loop"),
    ("last-item", "js-array-access", 3, "const rooms = ['Hall', 'Lab', 'Studio']; Which expression selects Studio?", "rooms[2]", ["rooms[3]", "rooms[1]", "rooms[rooms.length]"], "The last valid index is length minus one.", "#arrays"),
    ("loop-boundary", "js-array-traversal", 3, "For an array items, which condition visits each valid index starting at i = 0?", "i < items.length", ["i <= items.length", "i > items.length", "i === items.length"], "A strict upper bound avoids visiting the out-of-range index equal to length.", "#loops-and-arrays"),
    ("sum-loop", "js-array-traversal", 3, "let total = 0; for (let i = 0; i < 3; i++) { total += [2, 4, 6][i]; } What is total?", "12", ["6", "18", "undefined"], "The three iterations add 2, 4 and 6 exactly once.", "#loops-and-arrays"),
])

pinned("5147d258bf81618cfbce5a2a", "3-terrarium/1-intro-to-html",
       "HTML document structure, head/body roles, plant image attributes, IDs/classes and semantics.", [
    ("doctype", "terrarium-document", 1, "Which declaration starts the lesson's HTML5 document?", "<!DOCTYPE html>", ["<doctype css>", "<html5=true>", "<!SCRIPT html>"], "The doctype declares the HTML document type.", "#the-doctype-and-html-tags"),
    ("tab-title", "terrarium-document", 1, "Where does the terrarium page's title element belong?", "Inside head", ["Inside every img", "Only in a CSS file", "Inside the doctype"], "head contains metadata such as the document title.", "#the-documents-head"),
    ("visible-plants", "terrarium-content", 2, "Which document section contains the visible plant images?", "body", ["title", "The doctype", "A stylesheet's selector"], "body contains the page's displayed content.", "#the-documents-body"),
    ("unique-plant", "terrarium-identifiers", 3, "JavaScript must later find one particular plant image. What should distinguish that element?", "A unique id such as plant7", ["The same id shared by every plant", "Only the class shared by all plants", "A source-code comment with no element attribute"], "The lesson assigns individual plant IDs for later DOM lookup.", "#images"),
    ("shared-style", "terrarium-identifiers", 3, "All plant images should share styling while keeping distinct IDs. What attribute groups them?", "class='plant'", ["id='plant' on every image", "title='head'", "doctype='plant'"], "A class can be shared across many elements; an ID identifies one element.", "#images"),
    ("semantic-navigation", "terrarium-semantics", 3, "A region contains site navigation. Which markup expresses that purpose more clearly than a generic div?", "nav", ["img", "title", "br"], "Semantic elements communicate the meaning of regions.", "#semantic-markup"),
])

pinned("b5bcddf9e8bafa4fdd75339f", "3-terrarium/2-intro-to-css",
       "Cascade, inherited typography, ID/class selectors and positioning the terrarium's containers.", [
    ("class-selector", "terrarium-css-selectors", 1, "Which selector targets elements with class plant-holder?", ".plant-holder", ["#plant-holder", "plant-holder()", "@plant-holder"], "A dot introduces a class selector.", "#classes"),
    ("id-selector", "terrarium-css-selectors", 1, "Which selector targets the element with id left-container?", "#left-container", [".left-container", "left-container[]", "*left-container"], "A hash introduces an ID selector.", "#ids"),
    ("inherited-font", "terrarium-css-inheritance", 2, "The heading has no font-family rule of its own. Why can it use the body's declared font?", "font-family can be inherited", ["Every CSS property is always inherited", "IDs automatically copy every sibling's style", "The heading's text becomes CSS"], "The lesson demonstrates a heading inheriting the body's typography.", "#inheritance"),
    ("cascade-order", "terrarium-css-cascade", 3, "Two equally specific .plant rules in the same stylesheet set width, with no important declarations. Which width wins?", "The later rule's width", ["The earlier rule always", "Their widths are added", "The browser chooses randomly"], "When other cascade priorities tie, later declarations take precedence.", "#the-cascade"),
    ("position-parent", "terrarium-css-positioning", 3, "A plant must be positioned inside its holder. Which holder setting establishes a positioning context for its absolute child?", "position: relative", ["font-style: italic", "color: green", "text-align: center"], "The terrarium uses a relatively positioned holder for absolutely positioned plants.", "#css-positioning"),
    ("shared-rule", "terrarium-css-selectors", 3, "Twelve holders need the same height. How can one rule apply to all of them?", "Give them a shared class and target that class", ["Give all twelve the same supposedly unique id", "Target one holder's unique id and expect its siblings to match too", "Put a class name in CSS but never on any holder"], "Class selectors let related elements share styling.", "#classes"),
])

pinned("5e6ca8a2d103dbc86238e618", "3-terrarium/3-intro-to-DOM-and-closures",
       "DOM lookup, nested-function state, pointer events, drag coordinate deltas and handler cleanup.", [
    ("lookup", "terrarium-dom", 1, "How does the lesson obtain the plant whose id is plant3?", "document.getElementById('plant3')", ["document.getClass('plant3')", "window.alt('plant3')", "document.title('plant3')"], "getElementById locates the element with that ID.", "#the-dom-elements"),
    ("closure-scope", "terrarium-closures", 1, "Why can elementDrag use position variables declared in the enclosing dragElement call?", "Its inner function retains access to that outer scope", ["Every local variable is automatically global", "CSS converts them to attributes", "Pointer events erase function scopes"], "The lesson uses this retained outer scope as a closure.", "#the-closure"),
    ("pointer-start", "terrarium-pointer-events", 2, "Which pointer event starts the lesson's drag interaction?", "pointerdown", ["pointerup only", "load only", "resize only"], "The plant's pointerdown handler begins tracking the drag.", "#the-pointerdrag-function"),
    ("horizontal-delta", "terrarium-drag-coordinates", 3, "Previous pointer X is 100, new X is 130 and plant offsetLeft is 40. With pos1 = oldX - newX, what is offsetLeft - pos1?", "70", ["10", "170", "-30"], "pos1 is -30, so subtracting it moves the plant right by 30.", "#the-elementdrag-and-stopelementdrag-functions"),
    ("cleanup", "terrarium-pointer-events", 3, "The pointer is released. Why set document.onpointermove and document.onpointerup to null?", "To stop the completed drag's document handlers", ["To remove the plant's pointerdown handler permanently", "To reset its position to the initial coordinates", "To stop every other unrelated event on the document"], "The stop handler releases the movement and release handlers after dragging.", "#the-elementdrag-and-stopelementdrag-functions"),
    ("independent-plants", "terrarium-closures", 3, "dragElement is called separately for two plants. What keeps each call's position tracking separate?", "Each call creates its own outer local variables", ["All calls automatically share one set of local variables", "An ID makes every JavaScript variable element-local", "The CSS class automatically stores the pointer coordinates"], "Separate invocations create separate closure state for their elements.", "#the-closure"),
])

pinned("e48d1a8b3020ba91c131475d", "4-typing-game/typing-game",
       "Event-driven typing input, quote-word state, completion checks, error feedback and elapsed time.", [
    ("listen", "typing-events", 1, "Which operation registers code to run when Start is clicked?", "addEventListener('click', handler)", ["handler() with no listener", "className = 'click'", "Date.now('click')"], "An event listener responds when the event happens.", "#event-driven-programming"),
    ("word-state", "typing-state", 1, "What does wordIndex track in the typing game?", "The current word's position in the quote array", ["Only elapsed seconds", "The stylesheet's line number", "The number of browser tabs"], "The quote is split into words and wordIndex identifies the current one.", "#add-the-constants"),
    ("input-event", "typing-events", 2, "Which event checks changes to the text field as the player types?", "input", ["load", "resize", "scroll"], "The input listener reads the typed value as it changes.", "#add-typing-logic"),
    ("final-word", "typing-completion", 3, "The quote has 4 words. At wordIndex 3 the typed value exactly matches the current word. What does the lesson's first condition detect?", "The quote is complete", ["Only the first word is complete", "An array index outside the quote", "A mandatory trailing space is still needed for that final check"], "Completion requires both an exact match and the last index, length minus one.", "#add-typing-logic"),
    ("elapsed", "typing-timing", 3, "The game starts at 12000ms and ends at 16750ms. What elapsed duration should it display in seconds?", "4.75", ["4750", "16.75", "28.75"], "Subtract start from end, then divide the millisecond difference by 1000.", "#add-typing-logic"),
    ("prefix-error", "typing-feedback", 3, "The current word is 'plant' and the field contains 'px'. Which feedback fits the lesson's prefix comparison?", "Show the input's error style", ["Advance to the next word", "Declare the quote complete", "Reset the timer on every character"], "px is not the beginning of plant, so the mismatch receives error feedback.", "#add-typing-logic"),
])

pinned("ccf09d85bb3979199f32a57b", "5-browser-extension/1-about-browsers",
       "Browser retrieval/rendering, caching, extension file roles and cross-browser testing.", [
    ("render-engine", "browser-rendering", 1, "Which browser component displays retrieved web content on the user's device?", "The rendering engine", ["A Git remote", "Only the operating system's file renamer", "A commit message"], "The lesson distinguishes retrieval of content from rendering it.", "#about-the-browser"),
    ("cache", "browser-storage", 1, "Why can a browser cache previously retrieved content?", "To avoid fetching it from the server every time", ["To ensure every request downloads more data", "To disable all page rendering", "To replace all source files with history entries"], "Cached content can be reused instead of retrieved again.", "#about-the-browser"),
    ("built-folder", "extension-structure", 2, "Which folder does the lesson load as the built unpacked extension?", "dist", ["Only the src folder", "The parent folder's .git directory", "The node_modules folder"], "The lesson builds the extension and loads its dist output.", "#installing-extensions"),
    ("test-contexts", "browser-testing", 3, "An extension's page works on one desktop browser. What adds useful evidence about its display?", "Check other browsers and viewport sizes", ["Assume all rendering engines behave identically", "Rename its folder without testing", "Check only the author's favorite window size"], "The lesson encourages investigating browser and device differences.", "#about-the-browser"),
    ("rebuild-extension", "extension-development", 3, "Source files changed, but the loaded unpacked extension still shows old behavior. What workflow should be checked?", "Build the updated files and reload the unpacked extension", ["Only save src/index.js and assume dist changed automatically", "Reload the old build without rebuilding changed source", "Build new output but keep the previously loaded extension running"], "The browser needs the current built extension files and a reload.", "#installing-extensions"),
    ("popup-html", "extension-structure", 3, "The extension needs a heading and a form in its popup. Which file type supplies that document structure?", "HTML", ["CSS declarations alone", "Only the built JavaScript file's package metadata", "Only the manifest's defaults"], "The lesson builds the extension interface with an HTML document.", "#build-the-html-for-the-extension"),
])

pinned("7f95b0704dd938c21b8c7d50", "5-browser-extension/2-forms-browsers-local-storage",
       "Form event handling, localStorage strings, missing values, asynchronous API loading and error recovery; API keys in browser storage are a learning-only pattern.", [
    ("stored-strings", "extension-local-storage", 1, "What data form does localStorage store under each key?", "Strings", ["Live DOM elements", "Unserialized function closures", "Only binary executable files"], "The lesson describes a string key/value store.", "#build-out-the-init-function-and-the-reset-function"),
    ("missing-key", "extension-local-storage", 1, "What does localStorage.getItem return when that key is absent?", "null", ["An empty array", "The key's name", "Always the previous API result"], "init checks whether the saved values exist before using them.", "#build-out-the-init-function-and-the-reset-function"),
    ("prevent-submit", "extension-form-events", 2, "Why does the submit handler call e.preventDefault()?", "To prevent the form's default navigation or reload", ["To encrypt the API key", "To erase every event listener", "To force the API to reply immediately"], "JavaScript handles the submission without the browser's normal form navigation.", "#handle-the-form-submission"),
    ("remove-region", "extension-local-storage", 3, "Reset removes only regionName. What does that operation do to the distinct apiKey storage entry?", "It leaves apiKey unchanged", ["It clears every storage key", "It encrypts apiKey", "It turns apiKey into a region name"], "removeItem targets the named entry rather than clearing the entire store.", "#build-out-the-init-function-and-the-reset-function"),
    ("request-failure", "extension-api-feedback", 3, "The API request fails while a loading indicator is visible. What response fits the lesson's catch path?", "Hide loading and show an error state", ["Leave loading forever with no explanation", "Declare the request successful", "Erase the whole extension source"], "Failure handling should resolve the loading state and explain that data was not obtained.", "#display-carbon-usage"),
    ("secret-storage", "extension-storage-limits", 3, "The tutorial stores an API key in browser storage. What conclusion should you draw for production secrets?", "This learning example does not make browser storage a secure secret vault", ["localStorage automatically encrypts all secrets", "Any script-readable key is server-only", "Persisting a key proves it cannot be stolen"], "The source explicitly cautions about this API-key storage pattern; persistence is not secret protection.", "#build-out-the-init-function-and-the-reset-function"),
])

pinned("91ebbdad08c0aa7018b889a2", "5-browser-extension/3-background-tasks-and-performance",
       "Measure scripting/rendering/painting before optimization; extension runtime messages and canvas icon updates. No reliance on the source's inaccurate inline-defer suggestion.", [
    ("profile-first", "web-performance-measurement", 1, "What is the lesson's first step in improving page performance?", "Gather performance data", ["Delete random scripts", "Choose a faster-sounding variable name", "Assume CSS is always the bottleneck"], "Profiling identifies where time is actually spent.", "#web-performance-basics"),
    ("timeline", "web-performance-measurement", 1, "Which browser developer-tool panel records scripting, rendering and painting activity?", "Performance", ["Only Bookmarks", "Only browser History", "Only the file download list"], "A Performance recording exposes activity along a timeline.", "#web-performance-basics"),
    ("send-message", "extension-background-messages", 2, "How does the popup request the background code's icon update in this lesson?", "chrome.runtime.sendMessage", ["git push", "document.title only", "localStorage.removeItem only"], "The runtime message carries the action and color value to the listener.", "#create-a-function-to-calculate-color"),
    ("measured-css", "web-performance-decisions", 3, "A profile suggests excessive DOM and style work. Which change follows the lesson's advice?", "Remove unnecessary elements and unused page styles, then measure again", ["Add hidden duplicate elements", "Copy all page-specific styles into every page", "Change all filenames without remeasuring"], "Reducing unnecessary DOM and CSS work is a targeted change whose effect should be checked.", "#profiling-checks"),
    ("action-dispatch", "extension-background-messages", 3, "The background listener receives {action: 'updateIcon', value: {color: '#123456'}}. What should its matching branch do?", "Pass the value to the icon-drawing routine", ["Pass only the action name as though it were the color value", "Read msg.color while ignoring that color is nested inside value", "Update only the popup's text and never draw the icon"], "The source checks the action before drawing the updated icon.", "#call-the-function-execute-the-call"),
    ("cold-start-measure", "web-performance-measurement", 3, "You want a startup profile without reused cached assets. What preparation does the lesson recommend?", "Clear the browser cache before the measurement", ["Warm the cache repeatedly and call it a cold start", "Stop recording before the page loads", "Record an unrelated tab instead"], "The cache can change startup timings; the measurement setup should match the intended condition.", "#web-performance-basics"),
])

pinned("a626753d5b4a2f04a087cf45", "6-space-game/1-introduction",
       "Game-object inheritance/composition and publish/subscribe event decoupling.", [
    ("inheritance", "game-inheritance", 1, "What does class Hero extends Movable express?", "Hero inherits from Movable", ["Movable becomes a CSS selector", "Hero cannot have properties", "Hero is a remote Git branch"], "extends connects the derived class to its parent class.", "#expressing-behavior"),
    ("composition", "game-composition", 1, "Which technique combines behaviors using {...gameObject, ...movable}?", "Object composition with spread", ["A network fetch", "An HTML template clone", "A timer cancellation"], "The example builds objects by combining properties from smaller objects.", "#expressing-behavior"),
    ("subscribe", "game-pubsub", 2, "What does the example EventEmitter.on(message, listener) register?", "A callback for that message", ["An image URL to download immediately", "A new CSS animation", "The game's final score"], "Subscribers register listeners that the emitter invokes for a matching message.", "#pubsub-pattern"),
    ("override-position", "game-composition", 3, "An object is built as {...{x: 0, y: 0}, x: 9, y: 4}. What are its coordinates?", "x = 9, y = 4", ["x = 0, y = 0", "x = 9, y = 0", "x = 0, y = 4"], "Properties written after the spread override the copied values.", "#expressing-behavior"),
    ("decoupling", "game-pubsub", 3, "Keyboard code should announce move-left without directly editing every game object. Which pattern fits?", "Publish a message that interested objects subscribe to", ["Put every object's behavior inside the keyboard handler", "Make the keyboard handler call every object's movement method directly", "Require every object to read a shared key variable on its own timer"], "Pub/sub separates the event's publisher from its listeners.", "#pubsub-pattern"),
    ("listener-count", "game-pubsub", 3, "Two callbacks subscribe to MOVE_LEFT. The example emitter emits it once. How many registered callbacks are invoked?", "2", ["0", "1", "4"], "emit iterates through the callbacks registered for that message.", "#pubsub-pattern"),
])

pinned("044151219efd503a941c1983", "6-space-game/2-drawing-to-canvas",
       "Canvas coordinates, 2D rectangles, asynchronous image loading and centered enemy grids.", [
    ("context", "canvas-basics", 1, "How does the lesson obtain the canvas's 2D drawing context?", "canvas.getContext('2d')", ["canvas.getElementById('2d')", "canvas.cloneNode('2d')", "canvas.fetch('2d')"], "Drawing methods are exposed through the 2D rendering context.", "#the-canvas"),
    ("origin", "canvas-coordinates", 1, "Where is coordinate (0, 0) on the canvas?", "The top-left corner", ["The center", "The bottom-right corner", "Always the hero's current position"], "Canvas X increases rightward and Y increases downward from the top left.", "#drawing-simple-geometry"),
    ("rectangle", "canvas-basics", 2, "In fillRect(10, 20, 30, 40), what does 30 represent?", "Rectangle width", ["Rectangle height", "The starting Y coordinate", "The number of enemies"], "fillRect takes x, y, width and height.", "#drawing-simple-geometry"),
    ("asset-ready", "canvas-assets", 3, "A hero image loads asynchronously. When should the initialization code draw it?", "After its load promise resolves", ["Before setting its source", "Only after closing the page", "Immediately, assuming the network has already finished"], "The source resolves loading before using the image in drawImage.", "#load-asset-pattern"),
    ("center-grid", "canvas-grid", 3, "A canvas is 800px wide and an enemy row totals 300px. Using (canvas.width - rowWidth) / 2, what is its start X?", "250", ["150", "400", "550"], "The remaining 500px is split into equal side margins.", "#add-code"),
    ("grid-count", "canvas-grid", 3, "A nested loop creates 5 columns and 5 enemies per column. How many enemies are drawn?", "25", ["5", "10", "50"], "Each of the five outer iterations creates five inner-loop enemies.", "#add-code"),
])

pinned("aabe132f4ffe9127fd7fc712", "6-space-game/3-moving-elements-around",
       "Keyboard events, default scrolling prevention, timer movement and clearing/redrawing game frames.", [
    ("keyup", "game-keyboard", 1, "Which event reports a key being released?", "keyup", ["resize", "pointerdown", "load"], "The lesson registers keyboard listeners for movement commands.", "#handle-keyboard-events"),
    ("repeat-timer", "game-timers", 1, "Which timer repeatedly invokes a callback at an interval?", "setInterval", ["clearInterval", "getElementById", "JSON.parse"], "setInterval schedules repeated callbacks until it is cleared.", "#game-induced-movement"),
    ("game-loop", "game-redrawing", 2, "What does the game loop repeatedly update on the canvas?", "The visible game scene", ["Only the repository's commit history", "Only the browser's bookmarks", "The HTML doctype"], "The loop draws the current game objects at regular intervals.", "#the-game-loop"),
    ("arrow-default", "game-keyboard", 3, "Arrow-key input moves the ship but also scrolls the page. What should the relevant key handler do?", "Call preventDefault for those game keys", ["Remove all keyboard support", "Clear the canvas's dimensions", "Add another scrolling handler"], "Suppressing the relevant default action keeps game input from also scrolling.", "#special-keys-a-caveat"),
    ("move-down", "game-coordinates", 3, "An enemy's Y starts at 20 and increases by 5 on each of three timer ticks. What is its new Y?", "35", ["5", "25", "60"], "Three additions of 5 move it downward by 15.", "#game-induced-movement"),
    ("old-frame", "game-redrawing", 3, "A moved ship leaves old copies on the canvas. Which game-loop step is missing?", "Clear or repaint the previous frame before drawing the current scene", ["Draw the current ship again without clearing old pixels", "Change the object's coordinates but never repaint the background", "Increase the timer frequency while retaining every old frame's pixels"], "Redrawing the background removes the previous frame's pixels.", "#the-game-loop"),
])

pinned("2c33319788e1916817c8f8f7", "6-space-game/4-collision-detection",
       "Axis-aligned rectangle overlap, dead-object filtering, upward lasers and cooldown gating.", [
    ("collision-shape", "game-collision", 1, "Which bounds does the lesson compare to detect collisions?", "Rectangles around game objects", ["Only image filenames", "Only the score text", "Only keyboard key names"], "The example checks whether two bounding rectangles intersect.", "#collision-detection"),
    ("dead-flag", "game-object-lifecycle", 1, "What does enemy.dead = true signal?", "The enemy should be removed from active rendering", ["The enemy automatically gains a life", "The entire browser must close", "The image is permanently deleted from disk"], "A dead flag lets the update loop filter destroyed objects out.", "#how-do-we-destroy-things"),
    ("cooldown-purpose", "game-fire-control", 2, "Why gate laser firing with a cooldown?", "To limit how frequently shots can be created", ["To increase every image's file size", "To prevent all keyboard events forever", "To store the score on a server"], "Cooldown avoids creating excessive shots in a short time.", "#cooldown-on-our-laser"),
    ("separate-rectangles", "game-collision", 3, "Rectangle A spans X 0–10 and B spans X 20–30, while their Y ranges overlap. Do they intersect?", "No; they are separated horizontally", ["Yes; any shared Y is sufficient", "Yes; both have positive coordinates", "Only if both have the same type"], "Rectangles need overlap on both axes; horizontal separation rules a hit out.", "#collision-detection"),
    ("laser-up", "game-laser-motion", 3, "A laser starts at Y 60 and uses y -= 15 on each tick. Where is it after two ticks?", "Y 30", ["Y 90", "Y 45", "Y -30"], "Decreasing Y moves upward; two ticks subtract 30.", "#add-code"),
    ("filter-destroyed", "game-object-lifecycle", 3, "Objects A and C have dead = true; B has dead = false. What remains after objects.filter(go => !go.dead)?", "Only B", ["Only A and C", "All three", "No objects"], "The predicate retains objects whose dead flag is false.", "#how-do-we-destroy-things"),
])

pinned("d4243ea043940885c2dc0588", "6-space-game/5-keeping-score",
       "Canvas text, lives, collision damage, enemy-hit score and rendering life icons.", [
    ("draw-text", "game-score-display", 1, "Which 2D context method draws score text?", "fillText", ["getElementById", "JSON.stringify", "setInterval"], "The lesson uses canvas text drawing for the points display.", "#draw-text-on-the-screen"),
    ("initial-lives", "game-lives", 1, "How many lives does this lesson give the hero initially?", "3", ["0", "1", "100"], "The Hero initialization sets life to 3 and points to 0.", "#add-code"),
    ("hit-points", "game-scoring", 2, "What score change does this implementation award for a laser hitting an enemy?", "Add 100 points", ["Subtract 100 points", "Add one life without changing points", "Reset points to zero"], "incrementPoints adds 100 for an enemy hit.", "#add-code"),
    ("two-enemies", "game-scoring", 3, "The hero has 200 points and destroys two more enemies at 100 points each. What is the new total?", "400", ["200", "300", "20000"], "Add two rewards of 100 to the existing score.", "#add-code"),
    ("damage-life", "game-lives", 3, "A hero with 2 lives takes one collision's damage. What life count should drawLife represent?", "1", ["0", "2", "3"], "The collision handler decrements life once.", "#add-code"),
    ("icon-loop", "game-score-display", 3, "drawLife uses for (let i = 0; i < hero.life; i++). With hero.life = 2, how many life icons does it draw?", "2", ["1", "3", "An unlimited number"], "The loop runs once for each remaining life.", "#add-code"),
])

pinned("e2ec4a1657965257b4205356", "6-space-game/6-end-condition",
       "Win/loss predicates, terminating the game loop, event cleanup and a fresh restart.", [
    ("loss", "game-end-predicates", 1, "Which condition does isHeroDead check?", "hero.life <= 0", ["hero.points === 0", "Every enemy has a nonempty name", "The canvas is wider than the hero"], "The hero loses when no lives remain.", "#add-code"),
    ("win", "game-end-predicates", 1, "What does isEnemiesDead test in this lesson?", "No living enemies remain", ["The hero has no lives", "The page has no images", "The score is exactly 1"], "The predicate filters for living enemies and checks that none remain.", "#add-code"),
    ("stop-loop", "game-end-lifecycle", 2, "What does clearInterval(gameLoopId) do when the game ends?", "Stops that repeating game-loop timer", ["Deletes every source file", "Starts a second loop", "Clears all browser storage"], "The ended game should stop its scheduled updates.", "#add-code"),
    ("reset-events", "game-restart", 3, "Each restart adds listeners without clearing earlier registrations. What can happen?", "One emitted message can trigger duplicate responses", ["All earlier listeners automatically disappear", "Only the most recently added listener runs by default", "Adding a listener automatically resets the hero's state"], "The lesson clears the emitter before initializing listeners for the next game.", "#add-code"),
    ("fresh-game", "game-restart", 3, "After losing, a restart must create a playable round. Which combination fits?", "Reset game objects and state, then start one fresh loop", ["Keep the dead hero and only repaint the loss text", "Start more loops without resetting state", "Only increment the old timer identifier"], "Restarting requires fresh state as well as a new game loop.", "#restarting"),
    ("loss-priority", "game-end-control", 3, "In the hero-collision handler, life reaches 0 and the last enemy is marked dead. Why return immediately after emitting loss?", "To avoid also emitting a win from the subsequent check", ["To reverse the life decrement automatically", "To stop only the win listener while continuing this handler", "To defer the same collision until the next loop tick"], "The early return makes the loss branch decisive for that collision.", "#add-code"),
])

pinned("db56078edbbfe68f42d8fa8e", "7-bank-project/1-template-route",
       "Inert HTML templates, cloned views, pathname routing, history navigation and popstate updates in a fictional banking sample.", [
    ("template-inert", "spa-templates", 1, "Does a template element's content display in the page automatically?", "No; it is instantiated with JavaScript", ["Yes, before all body content", "Only if its id equals head", "It is automatically sent to a server"], "Templates hold reusable markup that is not rendered as ordinary visible content.", "#html-templates"),
    ("clone-content", "spa-templates", 1, "Which expression makes a deep copy of a template's content?", "template.content.cloneNode(true)", ["template.content = false", "template.remove('true')", "JSON.parse(template)"], "Deep cloning copies the template's descendant nodes.", "#displaying-templates-with-javascript"),
    ("route-path", "spa-routing", 2, "Which browser value selects the route for /dashboard in the lesson?", "window.location.pathname", ["Only the page's text color", "The Git branch name", "The image width"], "The route map uses the current URL path.", "#creating-routes"),
    ("history-entry", "spa-navigation", 3, "Navigation should change the URL and add browser history without reloading the document. Which API fits?", "history.pushState", ["location.reload", "document.write of the whole page", "localStorage.clear"], "pushState adds a history entry while the application updates its own view.", "#adding-navigation"),
    ("back-view", "spa-navigation", 3, "The Back button changes the URL but leaves the old template visible. Which listener should update the route?", "popstate", ["Only pointermove", "Only beforeprint", "Only input on the username field"], "The lesson calls updateRoute when browser history traversal fires popstate.", "#handling-the-browsers-back-and-forward-buttons"),
    ("unknown-path", "spa-routing", 3, "A visitor opens a path absent from the route map. What avoids trying to read a missing route's templateId?", "Handle the missing route with a known fallback", ["Assume every string is a valid route", "Read templateId before checking whether the route exists", "Repeat updateRoute without changing or handling the invalid path"], "The lesson adds a fallback rather than dereferencing an undefined route.", "#adding-navigation"),
])

pinned("d7daf65e177e2c6618c243b4", "7-bank-project/2-forms",
       "Form controls, named values, JSON POST submission and complementary client/server validation in a fictional sample; not production identity architecture.", [
    ("label", "sample-form-controls", 1, "Which attribute of a label associates it with an input's id?", "for", ["method", "action", "placeholder"], "A matching label for and input id connect the label and control.", "#form-and-controls"),
    ("form-data", "sample-form-serialization", 1, "Which helper collects named form-control values into key/value pairs?", "FormData", ["Date.now", "setInterval", "getContext"], "The lesson creates FormData from the form before serializing the data.", "#submitting-data-without-reloading-the-page"),
    ("json-header", "sample-form-request", 2, "Which Content-Type describes a JSON request body?", "application/json", ["image/png", "text/css", "application/zip"], "The server needs to interpret the body as JSON.", "#submitting-data-without-reloading-the-page"),
    ("post-body", "sample-form-request", 3, "A form should create a sample account using JSON. Which request configuration fits?", "POST with JSON in the request body", ["GET with JSON only in a CSS property", "DELETE with no target", "A browser title change with no request"], "The source uses POST and a serialized JSON body to submit creation data.", "#submitting-data-without-reloading-the-page"),
    ("named-control", "sample-form-serialization", 3, "An input has id='displayName' but no name. Why is its value missing from FormData?", "Form submission keys come from named controls", ["FormData automatically uses the label text as the key instead", "id must equal the form's id to be collected", "A placeholder is required before any input can be collected"], "id supports DOM/label lookup; name identifies a submitted field.", "#form-and-controls"),
    ("server-validation", "sample-form-validation", 3, "Browser required-field validation passes. Can the server safely skip validating received values?", "No; server-side validation is still required", ["Yes; browser checks cannot be bypassed", "Yes; POST makes every value trustworthy", "Only if the form has a blue button"], "Client checks help users, but requests must still be validated on the server.", "#data-validation"),
])

pinned("8adb506835ad31efc908cf41", "7-bank-project/3-data",
       "Asynchronous Fetch/JSON, encoded route parameters, textContent updates and transaction table templates in a fictional sample.", [
    ("get-default", "sample-data-fetch", 1, "With no method override, which HTTP method does fetch(url) use?", "GET", ["POST", "DELETE", "PATCH"], "The lesson retrieves account data using Fetch's default GET request.", "#ajax-and-data-fetching"),
    ("json-await", "sample-data-fetch", 1, "How does the lesson parse a Fetch response's JSON body?", "await response.json()", ["response.style.json", "JSON.stringify(response) instead of reading its body", "response.getContext('json')"], "Reading and parsing the JSON body is asynchronous.", "#ajax-and-data-fetching"),
    ("text-content", "sample-data-dom", 2, "Which property replaces an element's content with plain text?", "textContent", ["pathname", "method", "localStorage"], "textContent updates the text rather than interpreting it as markup.", "#update-html-to-display-data"),
    ("encode-user", "sample-data-routes", 3, "A sample username contains a slash. Before appending it as one URL path component, what should the code use?", "encodeURIComponent(user)", ["Use the raw slash without considering its meaning", "JSON.stringify(user) as though JSON quoting were URL encoding", "Encode the entire URL with encodeURIComponent, including its path separators"], "Encoding prevents characters within the username from being treated as URL syntax.", "#ajax-and-data-fetching"),
    ("amount-format", "sample-data-rendering", 3, "A transaction amount is 7.5. What text does amount.toFixed(2) produce?", "'7.50'", ["'7.5'", "750", "'7.05'"], "toFixed(2) formats two digits after the decimal point.", "#create-table-rows-dynamically-with-html-templates"),
    ("replace-rows", "sample-data-dom", 3, "Refreshing transactions appends another copy below the previous rows. Which update step from the lesson prevents that?", "Clear the container before appending the newly built rows", ["Keep every previous row and append another complete snapshot", "Clone the template again without replacing existing rows", "Update only the balance text and leave stale transaction rows"], "The helper empties the element before adding the current content.", "#create-table-rows-dynamically-with-html-templates"),
])

pinned("f15bbbfc685089f0f0ef54c4", "7-bank-project/4-state-management",
       "Centralized state updates, shallow frozen object copies, JSON persistence, logout cleanup and refreshing stale sample data; not secure session storage guidance.", [
    ("central-state", "sample-state-structure", 1, "Why gather shared application data in one state object?", "To make data and its updates easier to track", ["To eliminate the need to render any UI", "To make every API result permanently correct", "To turn all variables into DOM elements"], "Centralized state helps manage data flow as the app grows.", "#rethink-state-management"),
    ("serialize", "sample-state-storage", 1, "What converts the lesson's plain account data to a JSON string for storage?", "JSON.stringify", ["JSON.parse", "Object.keys only", "setInterval"], "Storage accepts strings; serialization produces one from this data.", "#persist-the-state"),
    ("parse", "sample-state-storage", 2, "What reconstructs the saved plain data from its JSON string?", "JSON.parse", ["JSON.stringify again", "getContext", "history.pushState"], "Parsing recovers the data representation when restoring state.", "#persist-the-state"),
    ("copy-update", "sample-state-updates", 3, "The current state is frozen. How does updateState replace its account property?", "Create a new object by spreading the old state and overriding account", ["Assign directly to the frozen state's account property", "Freeze the same object again and expect that to change its data", "Replace state with only account and discard all other required fields"], "The lesson creates and freezes a new top-level state object.", "#track-data-changes"),
    ("logout-cleanup", "sample-state-updates", 3, "The app navigates to login on logout but keeps state.account populated. What state change is missing?", "Set account to null through the centralized update function", ["Only hide the dashboard's heading", "Only change the URL while retaining the account object", "Keep the account so reopening the dashboard reuses it without checking"], "Logout must clear the sample account state rather than only change the visible route.", "#track-data-changes"),
    ("stale-saved-data", "sample-state-freshness", 3, "A saved balance was restored, but the server has newer data. What should a refresh operation do?", "Fetch the current account data and update state before rendering it", ["Treat persisted data as permanently fresh", "Parse the same saved JSON again and assume it queries the server", "Repaint the same state repeatedly without fetching updated data"], "Persistence preserves a snapshot; the lesson separately refreshes it from the API.", "#refresh-the-data"),
])

pinned("f397d1eb20ac49a8093f3c1c", "7-bank-project/api",
       "The fictional sample API's documented route contract, resource parameters and explicitly volatile in-memory lifecycle; no claim of production authentication or durability.", [
    ("server-info", "sample-api-contract", 1, "Which documented request retrieves the sample server's information?", "GET /api/", ["POST /api/accounts/", "DELETE /api/accounts/:user", "POST /api/transactions/"], "The route table lists GET /api/ for server information.", "#api-details"),
    ("account-read", "sample-api-parameters", 1, "In GET /api/accounts/:user, what does :user stand for?", "The selected account's user identifier", ["An HTTP header name", "A fixed literal colon in every account name", "The frontend's port number"], "The parameter identifies which sample account's data to retrieve.", "#api-details"),
    ("volatile", "sample-api-lifecycle", 2, "Where does this sample API keep its entries?", "In memory, without persistence", ["In a documented durable cloud database", "In every visitor's browser history", "In the project's image files"], "The README explicitly says all data is lost when the server stops.", "#running-the-server"),
    ("add-transaction", "sample-api-contract", 3, "To add a transaction to the fictional account budgetA, which request matches the documented contract?", "POST /api/accounts/budgetA/transactions", ["GET /api/accounts/budgetA/transactions", "DELETE /api/accounts/budgetA", "POST /api/accounts/transactions/budgetA"], "Transactions are created under the selected account with POST.", "#api-details"),
    ("delete-one", "sample-api-parameters", 3, "Only transaction tx7 should be removed from budgetA. Which route targets that single transaction?", "DELETE /api/accounts/budgetA/transactions/tx7", ["DELETE /api/accounts/budgetA", "DELETE /api/accounts/tx7", "POST /api/accounts/budgetA/transactions"], "Both the account and transaction identifier are needed; deleting the account is broader.", "#api-details"),
    ("restart-loss", "sample-api-lifecycle", 3, "The frontend remains open while this API process stops and restarts. Can its earlier in-memory entries be assumed to survive?", "No; the sample explicitly loses them when stopped", ["Yes; an open frontend makes server RAM durable", "Yes; GET requests automatically back them up", "Only if the browser's font stays unchanged"], "The documented storage is volatile and separate from the still-open frontend.", "#running-the-server"),
])

pinned("71c0b9312980bb59f0bafe33", "8-code-editor/1-using-a-code-editor",
       "VSCode.dev repository editing, deliberate staging/commit messages and managing editor extensions.", [
    ("browser-editor", "web-editor-access", 1, "What is VSCode.dev in this lesson?", "A code editor usable in the browser", ["Only a production database", "Only a Git hosting protocol", "An image compression format"], "The lesson introduces editing a repository through the browser-based editor.", "#getting-started-with-vscodedev"),
    ("stage", "web-editor-changes", 1, "What does staging a changed file prepare it for?", "A commit", ["Automatic deletion", "An image resize", "A page zoom operation"], "The lesson stages selected changes before committing them.", "#2-edit-and-save-a-file-on-the-repository"),
    ("marketplace", "web-editor-extensions", 2, "Where does the lesson search for editor add-ons?", "The Extensions view's Marketplace search", ["The browser's page-history list", "The repository's image folder only", "The HTML title element"], "The Extensions view lists and describes available add-ons.", "#using-extensions"),
    ("temporary-disable", "web-editor-extensions", 3, "An installed extension is unneeded for a while, but should remain installed. Which management action fits?", "Disable it", ["Uninstall it", "Delete every source file", "Commit it as an HTML heading"], "Disable temporarily stops an extension without removing its installation.", "#3-manage-extensions"),
    ("setting-change", "web-editor-extensions", 3, "You need to adjust an installed extension's behavior. Which place does the lesson identify?", "Its gear menu's extension settings", ["The extension's star-rating control", "The repository's commit-message field", "The editor's New File action without opening settings"], "Installed extensions expose configuration through their settings.", "#2-customize-extensions"),
    ("review-message", "web-editor-changes", 3, "Two edited files are intentional and staged. Before committing, what information should the message provide?", "A description of the changes being committed", ["Only a list of files with no explanation of their change", "Only the word Updated for every commit", "Only the time at which the editor was opened"], "A useful message describes what the commit changes.", "#2-edit-and-save-a-file-on-the-repository"),
])


# These reviewed rows remain ungraded guides. Child IDs are only exact links in
# the reviewed page to instructional resources already present in the catalogue.
ORIENTATIONS = [
    {"resource_ids": ["voidfill-web-2"],
     "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
     "topics": ["web"], "reviewed_at": "2026-11-10",
     "reason": "The JavaScript Guide landing page introduces and links its chapters; it does not itself teach the chapter bodies. Those MDN chapter URLs are not separate catalogue resources, so this page has no fabricated checks or inferred child bindings.",
     "child_resource_ids": []},
    {"resource_ids": ["a5d95e41d8d2b56ad5b25460"],
     "url": PINNED + "1-getting-started-lessons/README.md",
     "topics": ["web"], "reviewed_at": "2026-11-10",
     "reason": "Curriculum introduction and three-link topic index with author credits; the instructional bodies are its linked lessons.",
     "child_resource_ids": ["21d6f7b742af5ef625aa9253", "093e7f299d5a4a42be6f9683", "3f812fe641f4b86d2834366d"]},
    {"resource_ids": ["4156f71c085df6857a4f85c9"],
     "url": PINNED + "2-js-basics/README.md",
     "topics": ["web"], "reviewed_at": "2026-11-10",
     "reason": "JavaScript module topic index and credits; variables, functions, decisions and loops are taught in the four linked lesson pages.",
     "child_resource_ids": ["45db1418a7051a3a68f47bc2", "177807d185220783a0478e05", "f96bb81b0ba769e1e46268cc", "f816fe36c2142be298089ac3"]},
    {"resource_ids": ["0c8090f1641fa0e354d7d6c1"],
     "url": PINNED + "3-terrarium/README.md",
     "topics": ["web"], "reviewed_at": "2026-11-10",
     "reason": "Terrarium project overview, lesson links, credits and Azure deployment setup. It is an orientation/setup guide rather than the HTML, CSS or DOM teaching bodies.",
     "child_resource_ids": ["5147d258bf81618cfbce5a2a", "b5bcddf9e8bafa4fdd75339f", "5e6ca8a2d103dbc86238e618"]},
    {"resource_ids": ["93ff58af448d4c3a22046ab6"],
     "url": PINNED + "4-typing-game/README.md",
     "topics": ["web"], "reviewed_at": "2026-11-10",
     "reason": "Typing-game introduction, prerequisites and a link to the actual event-driven programming lesson; the page does not teach that lesson's implementation.",
     "child_resource_ids": ["e48d1a8b3020ba91c131475d"]},
    {"resource_ids": ["04da0d2cfe28593dd774821a"],
     "url": PINNED + "5-browser-extension/README.md",
     "topics": ["web"], "reviewed_at": "2026-11-10",
     "reason": "Browser-extension project motivation, three lesson links and credits. Implementation objectives belong to the linked instructional pages.",
     "child_resource_ids": ["ccf09d85bb3979199f32a57b", "7f95b0704dd938c21b8c7d50", "91ebbdad08c0aa7018b889a2"]},
    {"resource_ids": ["d17ab6e6fc409dddc1c94d3a"],
     "url": PINNED + "5-browser-extension/start/README.md",
     "topics": ["web"], "reviewed_at": "2026-11-10",
     "reason": "Starter-code setup guide: install dependencies, build, load unpacked, obtain a service key and choose a region. It neither supplies the implementation lessons nor links their catalogue URLs. Service availability was not certified.",
     "child_resource_ids": []},
    {"resource_ids": ["d78c1f50cef12815d86705dc"],
     "url": PINNED + "6-space-game/README.md",
     "topics": ["web"], "reviewed_at": "2026-11-10",
     "reason": "Space-game learning overview and six lesson links; mechanics and code are taught in those linked pages.",
     "child_resource_ids": ["a626753d5b4a2f04a087cf45", "044151219efd503a941c1983", "aabe132f4ffe9127fd7fc712", "2c33319788e1916817c8f8f7", "d4243ea043940885c2dc0588", "e2ec4a1657965257b4205356"]},
    {"resource_ids": ["ccd785680686c59c2fe16932"],
     "url": PINNED + "7-bank-project/README.md",
     "topics": ["web"], "reviewed_at": "2026-11-10",
     "reason": "Fictional-bank project overview with four instructional lesson links and a link to its sample API reference. It does not itself teach the implementations.",
     "child_resource_ids": ["db56078edbbfe68f42d8fa8e", "d7daf65e177e2c6618c243b4", "8adb506835ad31efc908cf41", "f15bbbfc685089f0f0ef54c4", "f397d1eb20ac49a8093f3c1c"]},
]
