"""Foundation edition 2: concise parallel answers and task-relevant misconceptions.

These are authored replacements, not length padding or automatically swapped keys.
The published prompt, identity, level and explanation are retained. Historical
sealed assessments contain their original options/keys and remain independently
gradable. See FOUNDATION_EDITORIAL.md for provenance and review limitations.
Each line is correct | misconception | misconception | misconception.
"""

import hashlib
import json

EDITION = "2026.11-foundation-editorial-2"
SOURCE_SHA256 = "5ffdbd101e4152c77293a8d218dfbb61e3a8b3badd8ad330cae0f961c030dcab"
OPTIONS = {}

def bank(topic, text):
    rows = [tuple(part.strip() for part in line.split("|")) for line in text.strip().splitlines()]
    if topic in OPTIONS or any(len(row) != 4 or len(set(row)) != 4 or any(not part for part in row) for row in rows):
        raise ValueError("Invalid editorial options: " + topic)
    OPTIONS[topic] = rows

bank("git", r'''
Edited files versus selected next-commit changes | Local commits versus remote commits | Current branch versus its upstream branch | Tracked files versus ignored files
git diff | git diff --staged | git log --oneline | git show HEAD
git diff --staged | git diff HEAD~1 HEAD | git log --stat | git diff --name-only HEAD~1
Keep one related change reviewable | Group all unfinished work by date | Reduce history to one permanent commit | Avoid describing the commit's purpose
Remove it; address any exposure | Add the file to ignore rules after committing | Replace the variable name before publishing | Delete the branch after pushing the commit
A local repository and remote configuration | A working directory without repository history | A new branch in the source repository | A synchronized copy of all unsaved remote edits
See staged, unstaged and untracked changes | Verify that the upstream has no newer commits | Check whether the application tests pass | Confirm the commit's business requirements
A name for a repository location | The checked-out branch in the working tree | A saved group of uncommitted edits | The branch's latest merge conflict
A verified combination of intended changes | The newest side whenever timestamps differ | The upstream side without local testing | Both versions with conflict markers retained
Others may depend on those commit identities | The remote automatically rejects all new commits | Uncommitted files are included in rewritten history | Rewriting preserves all prior commit hashes
''')
bank("algorithms", r'''
Sorted under the same comparison | Distinct under an equality comparison | Stored in a linked structure | Fixed at its original length
Stack | Queue | Heap | Set
Queue | Stack | Heap | Set
Linear growth in work | Fixed execution time | Logarithmic growth in work | Quadratic memory use
O(log n) | O(n) | O(n log n) | O(n squared)
The minimum is at the root | The maximum is at the root | Every array position is sorted | Every key has constant-time lookup
Check an input boundary | Estimate average runtime | Establish the maximum capacity | Verify the sorted-input precondition
O(n) | O(1) | O(log n) | O(n squared)
O(n squared) | O(n) | O(n log n) | O(log n)
Specify the expected result | Ensure constant-time searching | Remove the need to compare keys | Make the input automatically unique
''')
bank("spreadsheets", r'''
=SUM(A1:A5) | =SUM(A1-A5) | =COUNT(A1:A5) | =AVERAGE(A1:A5)
4 | 12 | 3 | 6
$A$1 | A1 | A$1 | $A1
Shifts with the formula's position | Keeps its original row and column | Changes only its displayed format | Converts itself to a named range
COUNT | COUNTA | COUNTBLANK | COUNTIF
COUNTA | COUNT | COUNTBLANK | SUM
15 | 10 | 30 | 20
10 | 15 | 30 | 0
Preserve each record's field relationships | Recalculate the formulas using sorted inputs | Convert text values into numeric values | Remove duplicate records during sorting
Hides nonmatching rows | Deletes nonmatching records | Sorts records by the filtered field | Replaces invalid values in place
Summarize by category | Restrict who can open cells | Match each row to a lookup key | Calculate each source row independently
Restrict or guide input values | Verify the truth of the source records | Authorize access to protected records | Reconcile imported totals automatically
=COUNTIF(B2:B20,"Paid") | =COUNTA(B2:B20) | =SUMIF(B2:B20,"Paid") | =COUNT(B2:B20)
Review | Pass | 10 | A1
Match the intended identifier | Accept the nearest available identifier | Return the first row in sorted order | Substitute the last known employee row
Define the zero-denominator result | Replace every denominator with one | Omit the row from every output silently | Treat a division error as a verified zero
Date interpretation and stored type | Displayed number of decimal places | Alphabetical order of month labels | Row height and cell alignment
Reconcile to an independent source | Reapply the same formula in another color | Confirm that the total exceeds each row | Hide source rows after summing them
20% | 120% | 16.67% | 2%
Preserve a consistent table structure | Make every source value a unique key | Force formulas to use absolute references | Keep filtered records in their initial order
''')
bank("communication", r'''
Audience needs and purpose | Writer's preferred terminology | Number of available attachments | Usual length of the team's messages
Review section 2 for factual errors by Friday 15:00 UTC | Review the report when your current project finishes | Send any thoughts about the project this week | Check the document before our next discussion
Summarize and check understanding | Repeat the statement without checking meaning | Prepare a rebuttal before hearing the details | Confirm agreement before clarifying the request
Decisions, actions, owners and dates | Speakers, speaking duration and seating order | The agenda without resulting decisions | All comments without assigned follow-up
Ask a specific clarifying question | Choose the most familiar interpretation silently | Forward it as an agreed requirement | Commit to a deadline before checking scope
Please add the missing dataset source and date | You need to be more professional about reports | This report is less useful than the previous one | Please improve the report in whatever way you think
Distinguish verified and unverified claims | Present a consistent level of confidence | Avoid documenting unresolved questions | Reduce the number of sources readers see
An explicit date and time zone | The sender's local time without its zone | A weekday without the calendar date | A relative phrase such as tomorrow morning
Two-way discussion with a decision record | A one-way broadcast without questions | A public thread containing private details | A sequence of separate undocumented calls
Confirm receipt and understanding | Repeat the same message in more channels | Assume agreement after successful delivery | End discussion when a message is sent
Decision, evidence and deadline | Detailed chronology before the request | All attachments before the decision | The author's preferred solution without evidence
Verify audience and permission | Remove its filename before distribution | Forward it to the largest internal list | Assume an internal address grants permission
The last two handoffs lacked an owner | The team is always careless with handoffs | Nobody here cares about delivery | The people doing handoffs are unreliable
Make the meaning understandable | Make all technical details unnecessary | Replace evidence with familiar expressions | Require every reader to use identical vocabulary
Ordered actions, prerequisites and completion checks | The same actions in a single long paragraph | Steps grouped by sentence length | Screenshots without the required actions
Current state, questions and next owner | The time spent without open decisions | The original plan without current blockers | Only the work already completed
Compare goal and evidence | Choose the interpretation from the senior person | Adopt whichever version was written first | Settle the wording without checking the goal
Explain impact early and propose a next step | Wait for the recipient to notice the delay | Promise the original date without new evidence | Report completion while work remains unfinished
Avoid acting on the wrong meaning | Transfer all responsibility to the sender | Guarantee the instruction is achievable | Avoid keeping a record of the decision
Knowledge of the tested concepts | Proven communication ability in every workplace | Verified performance in a real conflict | Certification of professional mentoring skill
''')
bank("analysis", r'''
Problem, affected users and intended outcome | Preferred feature, tool and delivery date | Solution architecture before user needs | Every stakeholder's requested screen
Export the chosen dates and five named columns | Make exports convenient for regular users | Improve overall report flexibility | Produce more professional-looking reports
Discover needs, constraints and decisions | Let the largest group approve every detail | Avoid observing existing work practices | Replace evidence with a stakeholder vote
Steps, handoffs and decisions | Individual productivity rankings | Guaranteed causes of every process delay | The final solution without current-state evidence
Case definitions and period boundaries | Chart colors and report titles | The number of columns in the export | The order in which cases are listed
An identity rule and documented handling | Identical display names alone | Whichever row appeared most recently in the file | The row with the longest customer name
A hypothesis needs evidence | A hypothesis has a detailed diagram | A cause is whichever explanation appears first | A cause must have only one affected user
Compare reported and actual practice | Replace consent with direct observation | Treat one observation as a population estimate | Confirm the proposed solution before seeing the task
Requirements, sources, decisions and checks | Team members and their calendar availability | File size and document formatting | Project cost and staff attendance alone
Which problem and success measure does it address? | Which interface color should it use? | Can we promise the launch date now? | Should we copy the competitor's implementation?
Change, reason, impact and approval | The new wording without its source | Only the person who typed the request | A delivery date without affected dependencies
A defined starting measurement | The best result found after implementation | A forecast with no observed values | The newest measurement regardless of scope
20% | 2% | 25% | 80%
An average can conceal variation | An average always equals the most common value | A distribution requires a different population | An average removes the effect of outliers
Reject invalid entries clearly without saving | Make validation easier to use | Reduce complaints about the form | Improve the overall entry experience
Value, risk, dependencies and effort | Submission order regardless of impact | The requester's preferred technology | Which wording makes the smallest document
Reconcile definitions, timing and records | Choose whichever report has the larger total | Average the totals without checking their scopes | Publish the newest file as automatically correct
No | Yes, whenever the correlation is positive | Yes, when both measures share a time axis | Yes, if the dataset contains enough columns
Make them testable and revisitable | Turn uncertain statements into verified facts | Avoid recording why a decision was made | Remove the need to examine changing conditions
Evidence, alternatives and an argued action | A polished slide containing one preferred answer | A recommendation supported by seniority alone | A confident conclusion without limitations
''')
bank("success", r'''
Customer outcome and first success steps | Full product configuration before discovering needs | Every available feature in a fixed sequence | An internal adoption target without customer context
Paraphrase and check the concern | Confirm a solution before hearing the problem | Repeat the policy without clarifying impact | Promise agreement with every requested remedy
Impact, reproduction, evidence and owner | A severity label without affected behavior | All customer records regardless of relevance | A screenshot without steps or expected behavior
Status, next action and update time | An unverified cause and guaranteed resolution time | The previous update without current changes | Internal speculation without an assigned action
First reply versus solved issue | First assignment versus first customer message | Agent work time versus calendar working hours | Last message versus first escalation
80% | 20% | 125% | 8%
5% | 10% | 95% | 20%
95% | 5% | 90% | 105%
No; usage is not the outcome | Yes; a login demonstrates the core workflow | Yes; frequent access proves delivered value | No; achieved outcomes cannot be investigated
Goals, commitments, status and next steps | Only the subscription value and renewal date | The last agent's opinion without case evidence | Product documentation without customer context
Explain the process and escalate | Approve it to avoid a negative survey | Reject it without explaining review options | Promise reimbursement before authorization
Make solutions reusable | Eliminate all need for customer questions | Replace investigation of changed conditions | Treat every symptom as the same incident
Symptoms, prerequisites, steps and checks | Feature names without the required actions | Internal abbreviations without explanation | A closing message without verification
Impact, urgency and agreed commitments | Arrival order regardless of customer impact | Customer persistence alone | The shortest expected handling time alone
State known facts and investigate | Publish the most likely cause as confirmed | Close the case until the customer proves a cause | Promise a fix before testing the hypothesis
First agreed useful workflow completed | First marketing email opened | First visit to the product's home page | First internal account-status label assigned
Minimize exposure and effort | Ensure the customer cannot reopen the case | Collect enough material for unrelated analysis | Replace authorization with more diagnostic fields
I will update you Tuesday by 14:00 UTC | Someone will be in touch sometime soon | We expect to provide an update eventually | Please check again when you have a moment
Investigate goals and obstacles | Offer a discount before checking the reason | Mark the account unsuccessful immediately | Assume the customer no longer needs the service
Process, documentation and recurrence prevention | Guarantee every future case has the same cause | Replace feedback with one aggregate score | Prove the last agent caused the issue
''')
bank("projects", r'''
Agreed work and boundaries | The sequence of staff leave dates | The list of tools the team prefers | Every idea raised by a stakeholder
An identifiable required output | A potential future threat | A reporting date without an output | The amount of effort already spent
A significant checkpoint | Any individual work instruction | The complete list of project risks | A recurring invoice payment
One task relies on another | Two tasks share a document format | Both tasks have equal estimates | Two people report to the same manager
7 days | 4 days | 3 days | 12 days
After 4 days | After 7 days | After 3 days | After 12 days
Possible event versus current problem | Cost problem versus scheduling problem | Internal problem versus external problem | Small problem versus large problem
Event, impact, response and owner | A risk label without an action | The most likely cause without uncertainty | A priority number without a responsible person
Assess impact and follow change control | Accept it if the requester is senior | Add it without revising effort or timing | Remove another deliverable without agreement
Observable acceptance conditions | The owner's confidence in the result | A list of tools used to produce it | A general desire to improve quality
The owner answerable for the outcome | Anyone asked for specialist input | Everyone who receives status updates | The person performing every task personally
Make follow-through explicit | Guarantee every estimate will be met | Remove the need to report blockers | Give every action the same priority
Progress, remaining work, risks and decisions | Hours spent without delivered outcomes | The original schedule without current changes | Optimistic completion labels without evidence
Record blocker, impact and resolution owner | Mark the task complete to preserve the plan | Reassign it without explaining the problem | Hide it until the next scheduled milestone
1,500 | 8,500 | 18,500 | 2,500
No; outcomes and constraints also matter | Yes; underspending proves all deliverables were accepted | Yes; financial performance replaces quality checks | No; cost information has no project relevance
Find improvements with follow-up actions | Rank colleagues by who caused the most issues | Rewrite past status reports to match the outcome | Approve the next project without reviewing evidence
Assumption changes affect forecasts | Estimates are commitments independent of inputs | Forecasts remain valid once a manager signs them | New information should never change a baseline
Affected people and decision participants | Only people with the largest job titles | Everyone who has opened a project file | The ordering of tasks in the work breakdown
Intended outcome and success measure | The names of all project contributors | The preferred tool and meeting schedule | A list of activities without a target outcome
''')
bank("accounting", r'''
Assets = liabilities + equity | Assets = liabilities - equity | Equity = assets + liabilities | Liabilities = assets + equity
55,000 | 125,000 | 35,000 | 90,000
Cash and equity increase by 5,000 | Cash and revenue increase by 5,000 | Cash increases and equity decreases by 5,000 | Cash and liabilities decrease by 5,000
Equipment rises and cash falls | Equipment rises and equity falls | Cash falls and an immediate 2,000 expense arises | Equipment rises and revenue rises
Total debits and total credits | Cash receipts and cash payments | Total assets and total expenses | Sales revenue and net profit
When earned under recognition conditions | Whenever the related cash first arrives | When the customer requests an invoice | At the end of every calendar year
An unearned-service liability | Revenue fully earned on receipt | An expense equal to the payment | An asset owed by the customer
100 | 1,200 | 12 | 1,100
Balance sheet | Income statement | Cash flow statement | Statement of changes in equity
Income statement | Balance sheet | Cash flow statement | Trial balance
Yes; profit and cash timing differ | No; recognized profit is immediately available cash | Yes; liabilities are excluded from accounting records | No; a profitable business never pays in advance
Bank-versus-book balance differences | Differences between assets and total sales | The forecasted profit for the next period | The cost of goods sold during the month
5,400 | 4,600 | 6,000 | 5,700
3,000 | 3,333.33 | 9,000 | 1,000
No; it allocates asset cost | Yes; it is a recurring supplier payment | Yes; it repays the equipment loan | No; it records an increase in market value
3,000 | 13,000 | 5,000 | 8,000
37.5% | 62.5% | 60% | 3.75%
Source documents and traceable adjustments | A summary total without source records | A spreadsheet with no change history | An unsigned explanation replacing the transaction record
Amounts owed by customers | Amounts owed to suppliers | Advance payments received for unearned services | Cash already deposited by the owner
Amounts owed to suppliers | Amounts due from customers | Owner contributions not yet withdrawn | Sales revenue recognized during the month
''')
bank("marketing", r'''
Qualified trial registrations | Total advertising impressions | Number of published social posts | Unqualified visits to the home page
Align message and channels with audience | Select whichever channel has the lowest unit cost | Maximize visibility before defining relevance | Use identical messages for every customer group
2% | 5% | 20% | 50%
5% | 20% | 0.05% | 40%
More trials versus using email | Using email versus using search ads | Higher awareness versus more trials | Search ads versus a landing page
Relevant benefit and customer value | The full list of internal product milestones | The company's preferred technical terminology | A benefit unsupported by the actual offering
Random assignment and a defined outcome | Different audiences and several simultaneous changes | Comparing this month's visitors with last year's | Stopping as soon as the preferred version leads
No; alternative causes remain | Yes; any earlier event caused a later increase | Yes; campaign launch dates establish a control group | No; campaign effects cannot be studied at all
Clarify the page's subject | Guarantee the first search ranking | Replace the need for useful page content | Hide the page from irrelevant audiences
Clarify the intended next step | Describe every available product feature | Replace information about the offer | Record the source of every visitor
Recorded visit campaign source | Verified causal contribution of each campaign | The identity of every anonymous visitor | Guaranteed revenue from an advertising impression
Learn to build your first monthly budget | A workshop for everyone about everything financial | Join a session with important information | Improve things with our new learning event
40% | 140% | 28.57% | 200%
Event, denominator and period | The report's colors and page size | The number of people who made the report | The order of campaigns in the export
Report sample, result and uncertainty | Declare the leading version a proven winner | Omit the sample because it is small | Treat an inconclusive result as evidence of no effect
Match the advertised expectation | Guarantee every visit becomes a registration | Avoid disclosing limitations of the offer | Make campaign tagging unnecessary
Separate new and returning audiences | Send one message to all available contacts | Rank every customer by name length | Combine every visit into a single anonymous total
Audience, objective, message, channel and measurement | Channel choice without a target outcome | Creative assets without audience context | A spending total without an evaluation method
Recorded preferences and approved process | The campaign's target number of recipients | The most permissive past preference for each person | A competitor's approach to sending messages
Observed friction and funnel evidence | The signup page's total word count alone | The number of messages the campaign sent | The designer's preferred layout without user evidence
''')
bank("recruiting", r'''
Work-related capabilities | Similarity to existing team members | The interviewer's personal interests | The candidate's social connections
Consistent questions and scoring criteria | Identical interview duration without a rubric | Informal discussion followed by a general impression | Different questions chosen after seeing each candidate
Agree the evidence for each criterion | Change criteria to match the strongest applicant | Make the interviewers reach identical opinions | Eliminate all need to record candidate evidence
Specific evidence against a criterion | A general statement that the candidate seems confident | An impression based on a shared hobby | A numerical score without supporting observations
Performance on a relevant task | Social similarity to the interviewer | Familiarity with the company's branding | Willingness to accept an immediate offer
Understand evidence before scoring | Give a stronger score for confident delivery | Fill gaps using the interviewer's assumptions | Replace the example with a personality label
Independent ratings before discussion | Ask the most senior reviewer to score first | Reach an overall impression before reviewing evidence | Share each candidate's ranking before individual scoring
Review its job relevance | Apply it because it was used previously | Replace the criterion with an unrelated proxy | Use it only for candidates from one source
Next step, timing and contact | A positive impression without process details | A request to wait without an expected update | The interviewer's private ranking of other applicants
Relevant capability under an appropriate arrangement | The same physical format regardless of access needs | A lower required capability for that applicant | Removal of all role-related evaluation criteria
No; combine relevant evidence | Yes; references replace work samples and interviews | Yes; one positive reference proves every capability | No; reference evidence must never be considered
Identify tasks and role requirements | Choose a sourcing channel before defining the work | Set scoring weights after meeting applicants | Copy another organization's job title without analysis
One third | Two thirds | One tenth | Three tenths
25% | 20% | 40% | 75%
Need-based access and defined retention | Full-team access without a stated purpose | Indefinite retention of every private detail | Public distribution after the vacancy closes
Sources of candidates meeting requirements | Which channel produces the most clicks regardless of fit | Which source has the lowest spelling-error rate | The most popular channel among existing employees
Evidence against the agreed rubric | Which reviewer has more seniority | Which candidate has the more polished presentation | The average of unrelated overall impressions
Evidence of a required capability | A topic the interviewer personally enjoys | A test of information unrelated to the work | A question about similarity to current employees
Status, evidence, next action and owner | Only the candidate's preferred start date | An unqualified recommendation without observations | Every private interview remark without relevance filtering
Answers to the assessed concepts | Proven ability to make fair hiring decisions | Professional authorization to perform all HR work | Validated performance on an actual recruitment case
''')
bank("sales", r'''
Understand needs and context | Present all product features immediately | Establish a discount before discussing needs | Get verbal agreement before identifying fit
How do you handle this task today? | Do you agree our tool is the best? | Would you like the cheaper package? | Is your current approach obviously ineffective?
Clarify the concern | Offer a discount before understanding it | Repeat the same feature demonstration | Treat it as a confirmed refusal
Clarify follow-up and ownership | Increase the reported probability automatically | Replace the customer's confirmation with internal notes | Mark the opportunity closed after the call
Explain verified capability and alternatives | Describe a proposed feature as already available | Promise a delivery date without product confirmation | Omit the limitation until after purchase
20% | 10% | 50% | 5%
Opportunities at defined stages | Total revenue already recognized | Every contact regardless of buying activity | A list of product development milestones
3,000 | 7,000 | 10,000 | 300
Need, fit and buying process | The prospect's willingness to hear a demo alone | The size of the company logo | Whether the salesperson prefers the account
You need X by Y; next we check Z | Our product has many impressive features | Your concerns are standard for this industry | We have decided which package you should buy
Verify with the responsible team | Give the answer most likely to close the sale | Present an estimate as a confirmed capability | Ask the buyer to rely on an untested assumption
Connect verified capability to need | Show every screen in a fixed order | Promise any feature the buyer requests | Replace discovery with a feature inventory
Understand people, criteria and steps | Bypass anyone who asks detailed questions | Assign one decision-maker without checking | Assume procurement begins after purchase approval
40 | 60 | 160 | 40%
30 | 40 | 60 | 90
Goals, commitments and implementation context | The contract value without promised outcomes | A feature list without the customer's situation | The salesperson's forecast probability alone
Confirmed summary and agreed action | A generic message unrelated to the discussion | A purchase deadline the buyer never accepted | A product brochure without the requested answers
Different evidence and buying stage | Leads are always smaller organizations | Opportunities have already paid invoices | Leads never become customers
Compare stages, cohorts and loss reasons | Count contacts without checking stage definitions | Attribute every loss to the product price | Raise all probabilities to match the target
Clarify timing and agree follow-up | Continue requesting an immediate signature | Assume every timing objection is false | Close the account permanently without clarification
''')
bank("api", r'''
GET | POST | PATCH | DELETE
201 Created | 200 OK | 202 Accepted | 204 No Content
401 Unauthorized | 403 Forbidden | 404 Not Found | 409 Conflict
Permission for that record | Whether the learner is signed in | Whether the record identifier is well formed | Whether the client hides the record link
At the server boundary | In the browser input widget alone | In the client's type annotations alone | After the unsupported value is saved
429 Too Many Requests | 408 Request Timeout | 409 Conflict | 503 Service Unavailable
Bound response size and work | Guarantee one snapshot across all page requests | Remove the need for authorization | Ensure every client receives identical ordering automatically
A server-enforced idempotency key | A new random order ID for every retry | A client-side button-disable flag alone | A longer client timeout without server tracking
PUT | POST | CONNECT | PATCH by definition
Transport confidentiality and integrity | Permission to read every resource | Accuracy of application database records | Protection from malicious endpoint behavior
5xx | 2xx | 3xx | 4xx
204 No Content | 201 Created | 304 Not Modified | 206 Partial Content
Authenticated server-side code | A public browser environment variable | A downloadable JavaScript configuration file | A URL query parameter in the learner's page
A documented format and time zone | The server's local display string without a zone | A locale-dependent day/month string | A number without specified units or epoch
A resource identifier or location | The database server's privileged connection string | An unrelated collection's cached response | The client's previous request body without an ID
307 Temporary Redirect | 303 See Other | 301 with an assumed GET conversion | 302 with an assumed GET conversion
Parameterized queries | Concatenated SQL with quote stripping | Client-side type checking alone | Base64 encoding the full SQL string
It may expose internals or secrets | It proves that every request was unauthorized | It prevents the client from retrying safely | It changes the original HTTP method
A database transaction | Two independent writes without recovery tracking | A client retry after each successful write | A delay between writes to allow synchronization
Ordering and next-page mechanism | Only the maximum field-name length | The client's preferred display font | An unspecified offset with unstable sorting
''')
bank("testing", r'''
Detect broken existing behavior | Measure every user's satisfaction | Prove the absence of every possible bug | Replace specification of expected behavior
Integration test | Unit test | Static type check | Visual design review
17, 18, 65, 66 | 18, 30, 45, 65 | 20, 30, 40, 50 | 1, 10, 100, 1,000
Steps, expected/actual result and environment | An issue title without reproduction details | A screenshot without the triggering action | A proposed fix without observed behavior
A small behavior or component | The complete production environment | Every browser and network connection | An entire customer workflow across systems
Check rejection and error behavior | Increase line counts without assertions | Make invalid values acceptable inputs | Prove the happy path without executing it
Set up, execute, check | Deploy, monitor, roll back | Compile, format, publish | Record, summarize, archive
Inject a controllable test clock | Retry until the real clock reaches that minute | Remove the assertion on time behavior | Run only on the developer's machine
Known setup data or resources | The final outcome of every test | A report listing product requirements | The production user's private account
A failing test result | An automatically accepted snapshot | A warning while reporting success | A retry that omits the failed assertion
Failure paths and integration checks | Only more successful mock responses | Validation of the mock's display name | Removal of tests for rejected payments
No; assertions and cases matter | Yes; every covered statement is correct | Yes; covered code cannot have edge cases | No; line coverage contains no useful information
Keyboard focus, containment and Escape | A screenshot of the closed modal alone | A check that its heading contains text | A click on the close icon without keyboard checks
Investigate behavior while learning | Execute a fixed script without adaptation | Change production records until an error occurs | Approve a release from its design mockup alone
One effective award after retries | A different award for each successful retry | A success toast without checking saved results | The number of button clicks recorded locally
Inspect evidence and reproduce conditions | Assume every failure is a product defect | Assume every intermittent failure is harmless | Delete the test before understanding the failure
An isolated disposable workspace | A real user's account with guessed values | The production administrator's private records | Shared customer data copied without consent
Server denial of another user's record | The absence of a link in the navigation | A hidden input containing the current user ID | A disabled button in the browser alone
Required versus observed behavior | Test setup versus source-file formatting | Expected runtime versus build duration | Number of inputs versus number of assertions
A regression reproducing the defect | A test of an unrelated successful workflow | A renamed test without changed assertions | A screenshot that never exercises the trigger
''')
bank("linux", r'''
pwd | cd | ls | whoami
ls | pwd | cat | mkdir
Move to the parent directory | Move to the home directory | Move to the filesystem root | Return to the previous working directory
mkdir | touch | mount | mktemp -u
cp | mv | ln -s | chmod
mv | cp | cat | chown
A path starting at filesystem root | A path relative to the current directory | A path relative to the user's home | A command available through PATH
Owner rw; group r; others r | Owner rwx; group r; others r | Owner rw; group rw; others r | Owner r; group rw; others rw
Traverse/search that directory | List all filenames without read permission | Delete any child regardless of write permission | Read every contained file automatically
Limit compromise and mistake impact | Make application code execute more quickly | Remove the need for file permissions | Give the application access to every system file
ps | pwd | ls | df
Graceful termination | Immediate uncatchable termination | Suspend until a continuation signal | Reload configuration by convention
grep | sort | wc | cut
Standard output to standard input | A command's source file to its executable | All errors directly to a network socket | Two commands' arguments into one shared list
tail | head | sort | wc
Successful completion | Permission denied | Command not found | Execution still in progress
Keep the filename one argument | Expand it into several matched paths | Change the file's permission bits | Make the command run with elevated privileges
Resolved path and intended scope | Whether the filename is short enough | Whether the folder icon looks correct | The most recent shell prompt alone
Protected server configuration or secret store | A world-readable repository configuration | A public issue used for deployment notes | A browser JavaScript bundle
Check status and relevant logs | Restart every service before collecting evidence | Grant broad permissions without a diagnosis | Delete the log directory to clear the failure
''')
bank("networking", r'''
Names to address records | MAC addresses to user passwords | Ports to encrypted application payloads | Private addresses to public addresses
Client network configuration | Application certificate issuance | Guaranteed packet delivery | User account permission assignment
Forward packets between networks | Resolve hostnames into addresses | Allocate application session tokens | Encrypt all local network traffic
Reach nonlocal destinations | Resolve the local device's hostname | Allocate addresses to local clients | Select an application encryption algorithm
TCP | UDP | IP | ICMP
UDP | TCP | A reliable application stream | An acknowledged ordered byte channel
192.168.1.24 | 192.168.1.300 | 192.168.1 | 2001:db8::24
256 | 254 | 255 | 24
254 | 256 | 255 | 252
Network versus host address bits | The service's listening port | Whether a password is correctly entered | The DNS record's expiration time
Communication delay | Data transferred per unit time | Maximum advertised link capacity | Number of packets lost per minute
Achieved transfer rate | The delay before a single response | The interface's nominal capacity alone | The number of configured routing entries
ICMP may be blocked; investigate further | The server is certainly powered off | Every application on that host is unavailable | DNS must be resolving to the wrong host
443 | 80 | 53 | 22
Permission for matching traffic | The truth of an application's returned data | Whether every request is correctly authenticated | The physical route of every Internet packet
Translate network addresses | Resolve hostnames into IP addresses | Encrypt data between application endpoints | Assign security roles to authenticated users
10.24.3.8 | 11.24.3.8 | 192.0.2.10 | 172.32.3.8
DNS resolution | DHCP lease allocation alone | The application's visual rendering | The client's file permissions alone
Encryption and peer-authentication mechanisms | Guaranteed correctness of application content | Automatic permission for every requested resource | Guaranteed delivery despite a network outage
Correlate symptoms and narrow causes | Prove that every host has the same problem | Replace the need for reproducible checks | Infer the root cause from one timestamp alone
''')
bank("cloud", r'''
IaaS | PaaS | SaaS | A managed end-user application
PaaS | IaaS | SaaS | A bare physical colocation service
SaaS | IaaS | PaaS | A virtual-machine image registry
Add service instances | Add resources to one instance | Move an instance to another region | Reduce the number of service replicas
Increase one instance's resources | Increase the number of instances | Add geographical replicas | Split traffic across existing instances
Reduce location-specific failure dependence | Guarantee all application bugs are prevented | Eliminate every inter-zone network charge | Make all stored data automatically recoverable
No; damaging changes can replicate | Yes; any replica retains every historical state | Yes; replication verifies the restoration procedure | No; replication never improves availability
A successful tested restoration | A successful copy operation without a restore | A green icon on the storage dashboard | The existence of a second live replica
Data access and app configuration | Every physical data-center security control | The provider's hardware replacement process | The cloud vendor's internal operating procedures
Reduce network delay | Eliminate the need for application authorization | Guarantee that all data queries use an index | Make every network request complete instantly
Initialization of a new runtime | Every slow request on a warm instance | A routine deployment status check | The first request observed in any log window
Public course metadata | Private learner reflections | User-specific session tokens | Unredacted private resume text
Requests can reach another instance | RAM is automatically a permanent database | One instance always handles the same learner | Deployed code can never restart
Ability to perform its basic function | Whether every business outcome is achieved | Whether all possible dependencies are fault-free | The count of files in the source repository
No; alerts and enforced limits differ | Yes; every alert automatically disables billing | Yes; email delivery cancels running requests | No; spending cannot be limited by any mechanism
Limit the effect of misuse | Guarantee that every response is accurate | Remove the need to rotate exposed secrets | Avoid all configuration review
The first write may have succeeded | A timeout proves that no write occurred | Every retry must use a new operation identity | The client can assume exactly-once processing
Apply purpose-based storage periods | Keep every record permanently by default | Replace authorization with automatic deletion | Guarantee that all copies disappear instantly
Tail latency such as P95 | Average source-file length | Total number of deployment comments | Fastest observed response alone
Versioned releases and tested rollback | A mutable artifact without a version | A deployment with no compatibility checks | Removal of all previous release artifacts
''')
bank("security", r'''
Only the access the task needs | The same permissions for all signed-in users | Permanent administrator access for convenience | Access based on a user-supplied role field
A password and hardware key | A password and security-question answer | Two different memorized passwords | A PIN and a memorized passphrase
Deception to obtain information or access | Authorized encryption of stored documents | Automated installation of supported patches | Routine verification through an established channel
Verify using an independent trusted channel | Use the link because the message is urgent | Reply with the password to confirm identity | Trust the request if the sender name is familiar
Unauthorized disclosure prevention | Unauthorized modification prevention | Timely authorized resource access | Assurance that every record is current
Unauthorized-change prevention or detection | Concealment of all stored information | Availability during a power failure | Identification of the authenticated caller alone
Authorized access when needed | Keeping all system details secret | Preventing every change to any record | Confirming the original author of a message
Identity versus permission | Encryption versus backup | Logging versus monitoring | Availability versus recovery
Separate data from SQL syntax | Make every database caller an administrator | Remove the need for record-level permission checks | Guarantee the query's business logic is correct
Context-aware encoding and safe rendering | Stripping spaces from the submitted text | Trusting HTML because it came from a database | Encoding the network connection alone
Restricted server-side secret storage | A browser-exposed configuration variable | A public repository's deployment example | A URL embedded in a public page
Contain and notify the security owner | Delete all investigation records immediately | Publish the user's private data as evidence | Continue access until the cause is completely proven
Support investigation and recovery | Guarantee that every logged event is malicious | Replace the need to protect the logs | Prove responsibility from timestamps alone
Address known vulnerabilities | Ensure no future vulnerability can exist | Replace authorization testing permanently | Make unsupported software safe indefinitely
Server permission checks on that record | Trust the new ID if its format is valid | Assume the hidden UI link prevents access | Check only that the caller has any account
Collect only purpose-needed information | Collect everything before defining its purpose | Make private data public after aggregation alone | Retain all raw records without a time limit
Invalidate or remove relevant auth state | Leave the session usable until the browser closes | Clear the page title without ending the session | Remove only the sign-out button
No; permission checks are still needed | Yes; encrypted records are readable by any caller | Yes; TLS proves ownership of every requested record | No; encryption provides no useful protection
Verify that recovery actually works | Prove every stored file has the same contents | Replace the need for access controls | Guarantee uninterrupted service during every incident
Trusted server/database enforcement | A more visually prominent disabled button | A second copy of the same client-side check | A hidden field containing the approved role
''')
bank("architecture", r'''
Behavior and operating constraints | The latest tool's popularity | The largest available server size | The architecture used by an unrelated company
Closely related responsibilities | Many unrelated features in one module | Direct access to every other component | Identical code copied between services
Fewer coordinated component changes | Every component shares the same internal schema | All services must deploy at the same moment | Each component can ignore its published contract
Specify the interaction contract | Expose all internal implementation details | Avoid agreeing on error behavior | Make dependencies depend on source-file layout
A modular monolith | A service for every database column | A distributed system without operational support | A shared global module with no boundaries
Context, options, decision and consequences | The chosen tool's name without a rationale | An implementation deadline without alternatives | An unchanged copy of a vendor's product page
Searches meet a stated latency target | Users can create a saved search | Users can rename a search collection | Users can export matching records
Its copy can outlive source changes | Cache entries are always updated transactionally | A cache necessarily reads the source on every hit | Cached data cannot be invalidated
Decoupling with delayed completion | Immediate atomic completion across all consumers | Elimination of all duplicate delivery | Removal of the need for failure handling
Bound dependency waiting time | Guarantee remote work is cancelled successfully | Make every dependency return correct data | Prevent retries from duplicating side effects
Pause calls to a failing dependency | Retry each failure continuously without delay | Route every request to the failing instance | Make a dependency's writes automatically atomic
Avoid duplicating side effects | Make all network failures impossible | Ensure every retry uses different input values | Remove the need for completion tracking
Allowed staleness and reconciliation | A requirement for immediate consistency everywhere | Only the report's visual refresh animation | A guarantee based on one successful test
Route requests without local session dependence | Make all database operations unnecessary | Store durable user records only in instance RAM | Require a learner to use one permanent instance
Different data shapes or scaling needs | Guarantee perfect consistency without coordination | Prevent either path from sharing business rules | Remove all need to authorize read requests
A reduced but useful service | Silently return fabricated successful results | Restart every healthy dependency at once | Reject every feature after one optional failure
Each protected server action and resource | Only the navigation menu's visible links | Only the public application's login button | Only the correctness of the supplied ID format
Tighter schema-change coordination | Complete independence between services | Automatic isolation from migration changes | Removal of shared-data ownership questions
Test assumptions against real targets | Prove the design from the diagram alone | Guarantee future workloads cannot differ | Replace operational monitoring after release
Boundaries, flows and trust assumptions | Every source file listed without relationships | Icons without labeled data movement | A vendor logo without system context
''')
bank("containers", r'''
Template versus runtime instance | Development file versus production source code | Virtual machine versus physical server | Running process versus its source repository
They are lost unless persisted elsewhere | They become part of the original image automatically | They remain available in every new replica | They move into the host's home directory
Repeatable image-building steps | A record of all live customer requests | A database of runtime session tokens | A list of manually installed host applications
Map host port to container port | Automatically open every upstream firewall | Grant application users administrator permissions | Encrypt all traffic to the published service
Exclude build tools from runtime | Run all build stages on every user request | Preserve every source secret in the final layer | Make image provenance unnecessary
Identify exact image content | Ensure a mutable tag never changes | Prove the application has no security bugs | Select whichever image was pushed most recently
Persist/share data outside writable layers | Increase the number of CPU cores automatically | Replace network authentication between services | Store every application secret in the image
Deployment secret mechanism | A committed Dockerfile build argument | A public image label | A checked-in example environment file
Startup is not readiness | Any running process proves requests will succeed | Port publishing guarantees the database is available | A successful image build proves service health
Checks on defined repository events | Production approvals from any public pull request | Private user sign-ins for every build | Changes to the developer's local files
Find behavioral failures before release | Guarantee all future production inputs succeed | Make rollback preparation unnecessary | Replace checking the built artifact's identity
Avoid differences from rebuilding | Guarantee environment configuration is identical | Remove the need to verify artifact provenance | Let each environment silently modify the artifact
Stop progression; investigate or roll back | Continue because the build itself succeeded | Disable the check permanently without review | Mark the release healthy without observing requests
Old code may not match the new schema | Application code always restores old database rows | Image rollback automatically undoes every migration | Database state is stored entirely inside the old image
Less unnecessary software exposure | Guaranteed absence of vulnerabilities | Automatic permission for all network requests | Elimination of every dependency update
Reduce process privileges | Make every application operation execute faster | Let the process bypass filesystem permissions | Remove the need to manage container secrets
Consumption of a constrained resource | The correctness of every application response | The number of approved release reviewers | Whether private data appears in source code
Avoid unintended copying and extra inputs | Guarantee every secret in the image is encrypted | Replace the need to inspect Dockerfile instructions | Ensure all excluded files exist in production
A versioned artifact with provenance | Recompile independently with unrecorded dependencies | Copy a developer's untracked output directory | Download an arbitrary artifact with a matching name
Release, relevant events and failure context | Full production secrets for easier debugging | Every learner's private request body | Only the deployment's decorative display label
''')
bank("data-engineering", r'''
Transform before versus after target loading | Extract before versus after source creation | Validate before versus after deleting the source | Stream processing versus scheduled batch processing
Define what one row represents | Choose the table's display order | Determine the database server's region | Make every column a unique identifier
Same final records without duplicate effects | A second independent copy for every rerun | A new identifier for every previously loaded row | Removal of valid earlier records on each run
Processed source position or change boundary | The total number of target database columns | The current size of the orchestration log | The count of all downstream report viewers
Handle late or corrected records | Avoid ever rereading source data | Guarantee that source timestamps are unique | Replace the need to track processed boundaries
Data origins and transformations | The current alphabetical order of table names | The total number of database connections | The user interface used to view a report
Required IDs are present and grain-unique | Every identifier contains the same number of letters | IDs are sorted without checking duplicates | The largest identifier matches the row count
Parsing, storage and downstream compatibility | Whether all old columns can be deleted immediately | The display color assigned to the new column | Whether the file can be renamed without review
A prerequisite task state | Two tasks having similar filenames | The person who opened the scheduler page | Every task starting at the same wall-clock time
Failure differs from valid absence | An empty result always proves extraction failed | Both states should overwrite history with zeros | A successful empty result must be retried indefinitely
Load/correct a historical range | Delete all records outside today's window | Change the schema without reading source data | Reorder the current dashboard's columns
Retain review context outside valid output | Silently accept it after changing its field names | Discard the whole batch without a trace | Convert every malformed value into a verified zero
Detect missing, duplicate or altered records | Prove that every source record is semantically true | Replace all checks of join cardinality | Guarantee that target data never becomes stale
Process a bounded collection | Respond to each event without a defined boundary | Edit source records directly from a dashboard | Generate one permanent table per input row
Duplicate, late and unordered events | A guarantee that delivery order equals event time | Automatic exactly-once effects in every consumer | The absence of any need for replay handling
Aggregates may be multiplied | Aggregates necessarily become smaller | Every duplicate dimension row is automatically ignored | The join guarantees one fact row per output row
Pruning and scoped maintenance | Automatic deduplication of every input event | Guaranteed correctness of all event timestamps | Removal of every downstream query filter
Delay until source changes are usable | Duration of the developer's latest code review | Total rows ever loaded into the database | Number of scheduled jobs regardless of completion
Intermediate copies can expose records | Raw storage is anonymous by definition | Internal pipelines do not need access controls | Encryption makes all downstream users authorized
Run, failing stage, input boundary and restart steps | A generic failure label without the processed range | The filename alone without the pipeline stage | A complete private payload in every log entry
''')
bank("cad", r'''
Keep dimensions at the intended scale | Make all imported files use identical layer names | Replace the need to specify tolerances | Ensure every view has the same orientation
Projection without perspective convergence | A camera view with converging parallel edges | A section showing only cut material | A rendered image without dimensional meaning
Organize geometry by purpose | Make every object share identical properties | Convert all geometry into one raster image | Set the physical scale independently per object
A geometric relationship | The printed drawing's paper size | The material's guaranteed manufacturing cost | A filename assigned to the sketch
A center relation to the plate | A fixed hole position unrelated to plate width | A manually adjusted dimension after every edit | A constraint tying the hole to the sheet border
Avoid overconstrained geometry | Guarantee that every part is manufacturable | Prevent the sketch from being edited by others | Make all dimensional tolerances equal
Indicate the axis or center | Mark the finished outside surface | Specify the permitted size variation | Show the material's grain direction by default
Distance through the circle's center | Distance from center to circumference | Length around the circumference | Distance between arbitrary points on the arc
16 mm | 8 mm | 4 mm | 64 mm
50 mm | 100 mm | 200 mm | 25 mm
Actual design size in specified units | The ruler reading from the reduced print | The ruler reading multiplied by paper thickness | Whichever size makes the annotation fit
Distinguish controlled versions | Guarantee that all old prints were destroyed | Replace the need to describe affected features | Prove the design satisfies every requirement
Permitted requirement variation | The nominal design value itself | The drawing's ratio of paper to actual size | The number of views on the drawing
20.1 mm | 19.7 mm | 20.3 mm | 20.5 mm
Use precise existing geometry | Make all line lengths identical | Ensure every endpoint lies on the page border | Replace the need for dimensional constraints
Units, scale, origin and object settings | Only the imported file's display name | Only whether the geometry fits the screen | The most recent print preview alone
One view may omit shape information | More views automatically tighten every tolerance | Multiple views remove the need for dimensions | Every hidden feature is visible in every projection
Keep reference guides out of part outlines | Make construction lines part of the finished cut profile | Prevent any dimensions from referencing the sketch | Turn all geometric relationships into text labels
Units, dimensions, revision and assumptions | The drafting application's preferred toolbar layout | Only the latest file modification time | A screenshot without unresolved design questions
Check positions, sizes and affected views | Check only whether the page prints without clipping | Increase the revision number without comparing geometry | Accept the hole count without reviewing location
''')
bank("manufacturing", r'''
Machining | Casting | Injection molding | Additive deposition
Casting | Milling | Turning | Laser cutting
Successive material addition | Removing excess material from a solid blank | Shaping a sheet through controlled bending | Joining already finished parts with fasteners
Tooling/unit-cost trade-offs change | The cheapest tooling always gives the lowest total cost | Production volume never changes the process choice | Every process has the same unit cost at all volumes
Feasible and consistent production | Maximum geometric complexity regardless of process | Elimination of every inspection activity | The highest possible material usage
More capable processing and inspection | Every tolerance can be achieved at identical cost | Tight tolerances remove all setup effort | Smaller variation always reduces machining time
Started but unfinished units | Finished goods already delivered | Raw materials not yet released to production | Equipment waiting for preventive maintenance
The step limiting achievable flow | The step with the newest equipment | The operation with the shortest cycle | The station producing the largest local inventory
6 units per hour | 8 units per hour | 10 units per hour | 24 units per hour
Preparation for the next run | Total delivery time to the customer | Time between two completed units only | The time a finished unit waits for dispatch
Earlier downstream transfer | Smaller batches eliminate all setup time | Every downstream machine becomes faster | Material no longer needs quality checks
Components and required quantities | The current sequence of customer complaints | The complete list of operator attendance records | A forecast of future sales without component detail
Identify affected inputs and outputs | Guarantee no supplier material can have defects | Replace every acceptance check at receipt | Prove all units share identical properties
Check a finished dimension against limits | Change the process to reduce variation | Redesign a fixture to prevent setup errors | Test a new method before wider adoption
Agreed safe method and key checks | A substitute for all required training and supervision | A record of yesterday's production totals only | Permission to ignore a newly observed hazard
Secure/stop per procedure and escalate | Continue because the document was previously approved | Remove the warning from the local copy | Change a safety-critical step without qualified review
Reduce deterioration and unexpected failure | Guarantee that equipment can never fail | Eliminate the need to monitor operating condition | Perform repairs only after production stops
Processing to make a nonconforming unit acceptable | Normal processing of a conforming unit | Disposing of a unit that cannot be repaired | Initial inspection before production begins
90% | 10% | 100% | 111.1%
Check quality, safety and flow effects | Infer success from one station's speed alone | Adopt the change when it looks simpler | Skip verification if the estimated cost is lower
''')
bank("financial-analysis", r'''
Balance sheet | Income statement | Cash flow statement | Statement of retained earnings
Income statement | Balance sheet | Cash flow statement | Inventory movement report
Accrual timing and noncash items | Revenue and profit are always identical to receipts | Every recognized expense is paid immediately | Operating cash flow excludes all customer receipts
80 | 120 | 200 | 320
40% | 60% | 66.67% | 80%
1.5 | 0.67 | 50 | 250
50 | 250 | 1.5 | 100
Models, periods and policies differ | One ratio value is ideal for every industry | Identical report titles guarantee comparability | The largest ratio always means the safest business
Net sales or revenue | Total assets | Total liabilities | Net operating cash flow
Total assets | Net sales | Net income | Total operating expenses
10% | 110% | 9.09% | 1%
Avoid seasonal and duration distortions | Make all accounting policies automatically identical | Guarantee the same customer mix across periods | Replace the need to inspect underlying records
15 over budget | 15 under budget | 115 over budget | 100 under budget
Signs differ by reporting convention | A positive number always means good performance | A negative number always means lower cost | The sign never depends on the formula used
Effect of changing a stated assumption | Proof that the chosen forecast will occur | Selection of the largest possible result | Replacement of all uncertain inputs with constants
It may not recur | All gains are operating cash receipts | One-off gains are excluded from every statement | It must be repeated in every future forecast
Cash may remain uncollected | Every additional sale has already generated cash | The business has necessarily stopped recognizing revenue | All receivables are immediately uncollectible
Liability sets and denominators can differ | Every debt ratio has one universal formula | A ratio's title guarantees identical inputs | The number of decimal places sets its definition
Inputs, formula, units, period and assumptions | A final figure without the source values | A chart copied without a reporting date | The analyst's confidence without supporting records
Investigate drivers before projecting a trend | Predict permanent decline from that quarter alone | Assume the quarter has no decision relevance | Guarantee a rebound without checking the causes
''')
bank("hr-operations", r'''
Coordinate actions, owners and dependencies | Replace all manager check-ins with a form | Store every private detail in one open document | Guarantee every new employee needs identical support
Reduce unnecessary handling and exposure | Allow unrestricted access to employee details | Eliminate the need for retention rules | Make every record suitable for public reporting
Authorized people with a work need | Everyone with an organization email address | Every manager regardless of responsibility | Anyone who can guess the record identifier
Verify, correct through process and record it | Overwrite every system without checking the source | Retain both dates without marking the discrepancy | Accept the newest message as authorized evidence
Request type, owner and status | A broad mailing list without responsibility | An informal message without a case reference | A fixed completion label regardless of actual work
Rules depend on jurisdiction and circumstances | One organization's policy is universal law | A general quiz certifies local legal expertise | Every employee's situation has identical requirements
Expectations, support and introductions | Only a list of installed applications | Only the employee's payroll identifier | A copied job title without any role context
Different teams own different actions | The HR operator controls every technical account | Equipment return automatically removes every permission | A resignation email alone completes all handovers
Changes, sources and authorized decisions | Every personal opinion expressed about an employee | A summary label without the underlying action | A replacement for access and retention controls
Prevent disclosure to the wrong person | Make every employee record publicly searchable | Avoid checking whether the request is authorized | Guarantee that all supplied information is correct
Investigate sources and data ownership | Choose the value from whichever screen opened first | Average the conflicting dates or identifiers | Overwrite both systems with an unverified guess
Define inclusion and reporting date | Ensure all report totals are permanently equal | Make duplicate identifiers irrelevant | Remove the need to specify worker populations
Unnecessary sensitive-data disclosure | Automatic authorization for every recipient | Guaranteed anonymity from using a mailing list | Confirmation that every recipient needs every detail
Route to the authorized qualified owner | Decide the issue using an unrelated past case | Promise an outcome before the owner reviews it | Expand personal access to complete it silently
Clarify next steps and ownership | Guarantee that all external approvals will arrive | Avoid explaining known dependencies | Replace status tracking with a reassuring phrase
Purpose, requirements and approved schedule | Permanent retention of all documents by default | Immediate destruction of every closed record | Deletion whenever storage space runs low
Check purpose, approval and handling controls | Assume a free tool is approved for employee data | Upload first and review permissions later | Remove the file's title while retaining all private fields
Prevent inflated or distorted counts | Make every row describe a different employee automatically | Guarantee source records are complete | Ensure payroll calculations have no errors
Role clarity, access and support | Whether the employee memorized every policy title | Whether all colleagues have identical opinions | Only the number of onboarding emails opened
Verified facts, actions and next owner | Speculation about private motives | Unrelated personal details copied from a colleague | A conclusion without the evidence or next action
''')
bank("learning-design", r'''
Classify a sample ticket using a stated rubric | Understand ticket handling thoroughly | Become familiar with the support process | Appreciate the importance of prioritization
Test the intended capability | Match assessment length to the slide count | Ensure every lesson uses the same question type | Reward attendance instead of demonstrated learning
A handoff work sample with relevant criteria | A quiz listing the trainer's presentation headings | Attendance at a handoff demonstration alone | A satisfaction rating after watching a video
Choose starting points and support | Assume every learner has the same experience | Avoid explaining task prerequisites | Replace practice with a fixed content duration
A specific gap and improvement step | A broad judgment about the learner's ability | A score without any criterion context | A comparison with an unnamed high performer
Develop the skill before judging it | Guarantee the final task will be identical to practice | Remove the need for assessment criteria | Make consequential outcomes independent of performance
Recall relevant knowledge | Repeatedly reread without attempting recall | Copy notes without interpreting them | Leave material visible during every response
Support retention through revisiting | Guarantee that all learners forget at the same rate | Replace the need to apply knowledge | Make longer intervals always better regardless of task
Criteria and quality levels | A list of attendance dates | The learner's personality ranking | The total number of slides shown
Apply learning in a new relevant situation | Recall the course's marketing description | Finish every page in the original lesson | Receive a completion badge automatically
Completion does not demonstrate task performance | Completed pages always prove workplace competence | Time spent is a direct measure of professional ability | A high satisfaction score proves every objective was met
An accurate informative text version | An unrelated diagram without the instruction | A louder audio file without text | A text label containing only the audio filename
Practice components before integration | Make the final integrated task unnecessary | Remove context from every component permanently | Assess only whichever component is easiest
Reasoning and steps for the task | The final answer without how it was reached | A polished example with all assumptions hidden | The instructor's biography instead of task decisions
Guide ongoing learning and feedback | Issue a final professional license | Rank applicants for an unrelated job | Measure only whether the room was comfortable
Applied troubleshooting reasoning | More definitions unrelated to the failure | A longer glossary of equipment names | Proof of attendance at the lesson
Check transfer into intended work | Replace workplace evidence with course ratings | Prove all performance change came from training alone | Assume successful classroom recall is enough
Satisfaction, learning and application | Treating attendance as identical to competence | Combining every measure into one unlabeled score | Using completion as proof of changed work behavior
Practice recognizing and recovering from problems | Encourage the same mistakes in real customer records | Guarantee that only taught problems can ever occur | Replace the correct procedure with a memorable error
Review item, instruction and misconception | Conclude every learner lacks the general ability | Remove the objective without investigating | Increase all scores without checking the item
''')
bank("inventory", r'''
A distinct stock item or variant | A single employee's warehouse shift | A supplier's overall delivery rating | A physical shelf regardless of stored items
110 units | 150 units | 90 units | 70 units
Units may represent different quantities | Every case always contains one piece | Units are interchangeable once labels are removed | A unit label proves the recorded count is accurate
Periodic counts of selected stock | A complete shutdown count of all stock every day | Counting only dispatched customer orders | Recalculating balances without observing physical stock
Investigate before an authorized adjustment | Immediately replace the record with the count | Hide the difference until the next annual count | Average physical and recorded balances without review
Order point to usable stock | Time spent writing the supplier's invoice | The period stock remains after sale | Time from customer payment to monthly reporting
40 units | 14 units | 2.5 units | 400 units
55 units | 40 units | 25 units | 600 units
Demand/supply uncertainty | Every possible warehouse failure without limits | Forecasted demand with no variation at all | The need to maintain inventory records
It may not be eligible for dispatch | It must always be written off immediately | It can replace available stock without review | It should count as unconditionally saleable inventory
Older receipts first where suitable | Earlier expiry first regardless of receipt date | Newer receipts first for every product | The most expensive units first in every case
Expiry order can differ from receipt order | FEFO always reduces every handling cost | Receipt dates never matter for any stock | All products have identical remaining shelf life
Identity, quantity, condition and documents | The buyer's forecast without received-item checks | Only the supplier's total invoice amount | Only the number of delivery vehicles
Consistent location, counting and movement | Automatic agreement of all physical and book balances | Removal of the need to verify picked items | Guaranteed absence of damaged stock
Match item and quantity to order | Confirm the order's marketing channel | Calculate the supplier's annual profit | Replace all checks at goods receipt
Order, items, quantities and shipment status | Only the driver's name without order context | The next month's demand forecast alone | The shelf's color and label font
Needed stock is unavailable | Recorded stock exceeds its target | All available stock has been counted | A supplier has confirmed a future delivery
Space, capital and obsolescence costs | Overstock guarantees higher service at zero cost | Extra inventory is always immediately saleable | More stock makes all demand uncertainty disappear
Reason, evidence, approval and affected stock | A new number without the cause | A deleted record without an adjustment reference | An unexplained total copied from another location
Facts, order, owner and next update | A promised delivery time without carrier evidence | A blame statement without current status | The original plan without identifying the affected shipment
''')
bank("supply-chain", r'''
Organizations and flows serving demand | Only one warehouse's shelving layout | Only the final customer's payment method | A company's internal staff reporting hierarchy
Match expected demand with feasible supply | Treat every forecast as a confirmed order | Optimize capacity without considering customer needs | Let every supplier choose unrelated planning assumptions
An assumption-based demand estimate | A guarantee of future customer purchases | The count of already delivered products | A binding order from every potential buyer
Understand bias and uncertainty | Guarantee the next forecast has no error | Replace all source data with the last prediction | Treat error direction as irrelevant
Amplified demand variability upstream | A steady reduction in variation at every supplier | The same order quantity at all supply stages | A warehouse's stock being physically damaged
Share demand signals and coordinate policies | Order larger emergency batches after every rumor | Hide customer demand from upstream planners | Let every stage independently add the same safety buffer
It changes replenishment uncertainty | Average lead time alone describes every arrival | Lead-time variation never affects stock availability | A purchase price determines all delivery timing
Time-bounded resource output limit | The total number of product descriptions | The size of the purchasing contact list | A desired sales target without resource evidence
20 units | 100 units | 120 units | 220 units
A defined demand-fulfillment expectation | A guarantee that every delivery is free | An unspecified statement that service is good | The total quantity ever purchased from suppliers
Include relevant delivery and acquisition costs | The lowest unit price always has the lowest landed cost | Freight is excluded from all purchasing decisions | Delivery terms never affect economic comparisons
Reduce single-source dependence | Guarantee every alternative supplier has spare capacity | Eliminate the need to qualify each supplier | Ensure all suppliers will fail independently
Reliable, coordinated flow and quality | No replenishment information and unlimited buffers | Identical order sizes regardless of actual need | Perfect forecasts without any process coordination
Both signals and movement affect delay | Information never affects physical replenishment | Only transport speed determines delivery performance | Material location makes planning assumptions irrelevant
Assess commitments, alternatives and communication | Promise unchanged delivery before checking stock | Accept every customer priority as simultaneously feasible | Hide the delay until the promised date passes
Shifted cost or service problems | Automatic improvement of total-chain performance | Guaranteed reduction in every site's workload | Removal of all inventory trade-offs
Triggers, alternatives, owners and recovery | A generic assurance that someone will respond | A plan without decision authority or a trigger | A list of past incidents without response steps
Different commitment and uncertainty | Forecasts are always more binding than orders | Every confirmed order is an unverified prediction | Neither source can affect supply planning
Returns and post-delivery recovery flows | Only first delivery from supplier to customer | Only production of new raw materials | Only initial customer demand forecasting
Cost, service, quality and resilience trade-offs | The cheapest option must maximize every outcome | One measure captures all supply-chain consequences | Higher inventory always improves every measure
''')
bank("visual-design", r'''
Priority of information and actions | The age of the underlying source files | Equal emphasis for every visible element | The internal order of component imports
Predictable relationships and rhythm | Identical spacing regardless of grouping | A different margin for every component | Automatic correction of unclear content
Nearby help with separation from other groups | Help beside an unrelated field with matching color | All help text in an unlinked footer | A tooltip reachable only after submission
Readable, consistent hierarchy | A different font role for every sentence | Identical prominence for titles and footnotes | Decoration independent of content structure
Weaker distinctions between actions and states | Guaranteed improvement in every user's comprehension | Removal of the need for text labels | Automatic contrast compliance on every background
Distinguish text from background | Make all users read at the same speed | Remove the need for understandable wording | Guarantee readability at every text size
Color differences may be inaccessible | Every user interprets colors identically | A colorful legend automatically labels each mark | Text labels always make charts less usable
Alignment and layout relationships | The order of database query execution | The exact amount of user attention | A fixed screen size for every device
Separate groups and reduce competition | Fill every unused area with another control | Increase visual priority equally for all elements | Replace labels with larger empty margins
Expose wrapping and alignment issues | Guarantee translations always have equal length | Confirm that short placeholders represent all real data | Avoid checking smaller-screen behavior
Adapt layout while keeping task priority | Hide all important actions to save space | Preserve desktop widths regardless of overflow | Remove all labels and rely on icons
Unclear primary next action | Guaranteed faster decision-making | Automatic keyboard focus management | More accurate underlying content
Explain state and unmet conditions | Indicate the state only by a subtle color change | Hide the reason until the user guesses it | Leave an active-looking control that silently ignores input
Support comparison of magnitudes and decimals | Make every value numerically identical | Replace units with visual alignment alone | Sort every measure in alphabetical order
A reusable named visual decision | A particular learner's private assessment result | A hard-coded exception without a defined role | A screenshot of one completed page
Preserve meaningful distinctions | Make every word equally prominent | Remove the need for heading structure | Guarantee that bold text is always the next action
Reinforce recognizable meaning | Replace every accessible control label | Make an unfamiliar symbol self-explanatory | Remove the need to test interpretation
Improve readability with clear hierarchy | Hide the metadata until after a choice is made | Reduce its contrast further to imply importance | Replace essential information with decorative graphics
Check continuity of shared visual roles | Guarantee every route uses identical content | Avoid reviewing transitions between tasks | Prove all isolated screens already work together
Better finding and interpreting task information | More accent colors regardless of performance | A larger screenshot without task evidence | A higher count of animated interface elements
''')
bank("content", r'''
Audience, task and intended result | The maximum number of paragraphs first | The writer's preferred internal terminology | Every topic related to the product
Support scanning for the task | Make every section sound equally promotional | Replace the need for accurate instructions | Increase page length without adding meaning
Select Save to keep your changes | Commit the relevant operation when appropriate | Apply whichever action seems most familiar | Complete the necessary process in the usual way
Avoid misleading instructions and claims | Guarantee all readers will agree with the message | Make future maintenance unnecessary | Ensure the page receives the most visits
Consistent language and conventions | A substitute for factual source checking | A requirement to use identical sentence lengths | A list of unrelated personal writing preferences
Help readers act efficiently | Ensure nobody can access background information | Make all optional details mandatory prerequisites | Replace the need for a clear task sequence
A record of content, ownership and status | The total number of words a writer can produce | A schedule of unrelated team meetings | A final draft with no source or owner information
Owners, review triggers and update/retirement process | Permanent publication without further review | Revision based only on a page's visual age | A list of URLs without responsible maintainers
Clarify the useful next step | Describe every possible next action equally | Replace essential eligibility information | Guarantee the reader chooses the preferred option
Readers may not know the terminology | Internal abbreviations always improve accuracy | Public audiences have identical background knowledge | Jargon removes the need for task context
Read the refund eligibility rules | Click here | More information | Learn more about things
Verify or explicitly qualify it | Remove uncertainty while retaining the unsupported claim | Treat a colleague's confidence as a primary source | Publish first and wait for a reader to challenge it
Review meaning as well as surface errors | Proofreading alone establishes factual accuracy | Substantive editing concerns only punctuation | Structural edits should never change reader understanding
Problem and recovery step | A generic invalid label without context | A blame statement without an action | A system code that has no explanation
Copies can become inconsistent | Every copy updates automatically when one changes | Duplication removes the need for content ownership | Multiple copies prove the policy is current
Readers perform the intended task | The writer reads it again without attempting the steps | Count headings without checking comprehension | Ask only whether the page looks attractive
Distinguish it in navigation and search | Guarantee that every search ranks it first | Replace all page-specific headings with one slogan | Make every page use the same browser title
Source, qualify or remove them | Round the number until it seems plausible | Keep the claim if its typography is clear | Infer a source from the size of the number
Wording affects task completion | Form labels are independent of interaction design | Feedback text cannot affect error recovery | Placeholder length proves a form is understandable
Changes, reasons and claim reviewers | Only the date the file was renamed | Only the number of corrected commas | The final page without revision context
''')
bank("seo", r'''
Retrieving content versus analyzing/storing it for search | Ranking a page versus buying advertising placement | Editing page text versus changing its domain name | Encrypting content versus authenticating visitors
No; position and traffic are not guaranteed | Yes; every indexed page receives equal traffic | Yes; inclusion establishes a permanent first position | No; indexed pages are excluded from all results
Describe the actual page clearly | Repeat every related keyword without context | Promise information that is absent from the page | Use the same generic title for every route
The purpose behind a search | The number of words in a search query | A site's preferred advertising budget | The technical size of an indexed page
Help discovery of related pages | Guarantee a top ranking for every linked page | Replace the need for useful destination content | Authorize access to confidential pages
Preferred representative for similar content | A guarantee that every duplicate is deleted | A command to authenticate all visitors | The highest-ranking page for every query
It guides crawlers, not access control | It encrypts content only for approved visitors | It prevents anyone from requesting the URL | It assigns record-level permissions to users
URL discovery and update information | Guaranteed indexing of every submitted URL | A substitute for all internal navigation links | Permission checks on private content
Low value and confusing duplication | More pages always guarantee better search quality | Keyword-only pages automatically satisfy every intent | Near-duplicates cannot compete with one another
A summary that may inform a snippet | A guaranteed ranking boost for every keyword | A password required before crawling the page | The only text a search engine can analyze
Relevant meaning in page context | Every keyword the site wants to rank for | The image's filename without its meaning | The same description for all decorative images
Accurately describe visible information | Advertise benefits absent from the actual page | Guarantee enhanced search presentation | Hide contradictory details from search systems
Queries, result presentation and context | Assume a technical indexing failure without checking | Remove every page with a low click rate | Treat impressions as completed user tasks
Relevant users reach useful guidance | Maximum impressions regardless of relevance | The highest possible keyword repetition count | The number of decorative images on the page
Restore intended navigation paths | Guarantee every repaired link improves rankings | Make all external links unnecessary | Replace the need to check destination content
Other factors also affect rankings | A ranking change always proves the edit caused it | Competitor activity cannot affect relative position | Search behavior remains constant over time
Correct outdated information and improve usefulness | Add keywords without changing obsolete instructions | Change the date while retaining inaccurate content | Duplicate the same paragraph under more headings
Redirects, internal links and canonical signals | Only the new page's visual header | Only whether the new filename is shorter | A temporary navigation label without redirect checks
Exclude the page from search results | Prevent all people from opening the page | Encrypt the page for authenticated visitors | Guarantee removal of every external cached copy
Test improvements without guaranteed rankings | Guarantee first position for every query | Promise permanent traffic from a single edit | Claim indexing validates every factual statement
''')
bank("research", r'''
Specific enough to guide evidence collection | Broad enough to fit any possible outcome | Written only after examining favorable results | Guaranteed to confirm the sponsor's preference
A testable explanation or prediction | A conclusion established before collecting evidence | An unmeasurable statement of personal preference | A summary of the sample's file format
How a concept is observed or measured | The name of the statistical software used | The final numerical result of the study | A synonym with no observation rule
A studied subset of a population | Every person who could ever use the service | The complete procedure for taking measurements | A predicted result before observations begin
Systematic inclusion/exclusion differences | Random variation from repeated measurement | A typographical error in one survey response | The decision to report a study's limitations
Confounding or reverse direction may explain it | Correlation establishes temporal order automatically | Every correlated pair has identical measurement units | A large coefficient excludes alternative explanations
Systematic group differences | Every possible measurement error | The need to define a suitable outcome | Guaranteed representativeness of the entire population
A factor related to cause and outcome | Any outcome that occurs after the intervention | A random label assigned to a participant | The number of questions printed on a form
Find wording and response problems | Guarantee that all future responses are truthful | Select only questions with favorable answers | Replace testing the final survey procedure
How satisfied are you with price and delivery speed? | How satisfied are you with the delivery speed? | What price did you pay for your last order? | How many days did your last delivery take?
Enable understanding and evaluation | Guarantee every later study has the same outcome | Remove the need to report missing data | Turn a convenience sample into a random sample
Explore meanings, experiences and context | Establish precise population prevalence from a few interviews | Guarantee causal effects without a comparison design | Replace all need to record supporting observations
Reachable people may be unrepresentative | Convenience always produces a randomly selected population | Larger convenience samples remove all selection bias | Every participant necessarily has irrelevant experience
Clarify the finding's boundaries | Make uncertain results appear statistically certain | Avoid describing alternative explanations | Guarantee replication in every population
Reproducibility under stated conditions | Proof that no future study can differ | Increasing the original sample count retroactively | Selecting only the strongest original results
Examine patterns and document handling | Replace every missing response with zero silently | Delete respondents without checking missingness | Treat blank answers as agreement by default
Expectation-driven assessment effects | Every difference between the study groups | The need to choose a valid measurement | Guaranteed prevention of all participant dropout
Inaccurate or inconsistent measurement | A clearly specified observation rule | A documented instrument calibration | An explicitly reported estimate of uncertainty
Check methods and report transparently | Remove the result because it contradicts expectations | Change the hypothesis without recording the change | Describe the unexpected value as impossible without review
Check the observed pattern further in context | The pattern proves the same effect in every industry | The study establishes a permanent universal rule | No further evidence could change the conclusion
''')
bank("quality", r'''
Requirements versus observed process behavior | Customer preferences versus supplier prices | Two interchangeable names for acceptance limits | The process mean versus the number of inspectors
Consistent observation recording | Proof of the root cause without investigation | Automatic approval of every inspected item | Replacement of measurement definitions with labels
Identify largest recorded categories or impacts | Prove the largest category has a single cause | Guarantee the smallest category can be ignored | Estimate all future defect rates without sampling
Possible causes of an effect | Confirmed causes without additional evidence | The final sequence of corrective-action approvals | Only the names of people present at a meeting
Consistent classification by observers | Ensure the process can never produce a defect | Make every unit's measured value identical | Remove the need for training on inspection criteria
Investigate a possible special cause | Change the specification to include the point | Delete the observation without checking its source | Assume the machine must be replaced immediately
Yes; stable variation can exceed requirements | No; stability guarantees every item meets specification | Yes; specifications are calculated from control limits | No; stable processes have zero variation
Limit immediate nonconformity exposure | Prove the final root cause | Permanently revise every design requirement | Complete all long-term corrective actions
Address causes to reduce recurrence | Relabel the same defective unit as acceptable | Inspect the same unit again without changing anything | Dispose of one unit without investigating recurrence
Check measurement-system effects | Ensure every operator obtains the preferred result | Replace all operator comparisons with one reading | Assume observed differences prove operator error
Affected batches, inputs or records | The final cause without testing hypotheses | Guaranteed conformity of all unexamined batches | The identity of every future customer automatically
4% | 8% | 25% | 0.04%
One unit can have several defects | Every defect necessarily identifies a different unit | Defect counts and unit counts are interchangeable | Defective-unit rates always exceed one hundred percent
Compare results with the objective | Implement a change without reviewing results | Establish the first hypothesis after final approval | Archive the plan before collecting any observations
Learn before expanding the change | Guarantee all larger deployments behave identically | Avoid specifying the trial's acceptance criteria | Replace qualified review of safety-critical changes
Other factors may explain the relationship | A positive association proves machine speed is the cause | Correlation removes the need for a comparison | Every defect has exactly one measurable cause
Item, method, result, time and decision | A total without its population or time window | An undocumented adjustment to match expectations | A reviewer name without the observed result
Maintain an effective agreed method | Prevent future evidence from changing the process | Make every task independent of operating context | Eliminate the need to train affected staff
Review recurrence and measures over time | Accept the action because it was completed on schedule | Count the number of meetings held about the issue | Treat one conforming unit as proof of permanent success
Comparable definitions, sampling and denominators | Only whether both rates use the same font | Only whether the percentages have equal decimal places | The total number of reports produced by each team
''')
bank("product", r'''
Fewer failed attempts at the intended task | Ten new features released this month | More design mockups created this week | A larger number of completed development tickets
Several solutions may meet the need | The first requested feature is always optimal | User problems cannot be investigated directly | A requested interface is itself proof of an outcome
Expected change, users and test evidence | A guaranteed delivery date without a user group | The chosen technology without the risky assumption | A target score without an observation method
Effect, frequency and affected users | The seniority of the first person reporting it alone | The size of the screenshot attached to the report | The number of comments without investigating impact
Detect harm alongside the main outcome | Guarantee every experiment produces an improvement | Replace the need to define the primary metric | Remove all uncertainty from small samples
Review clicks and unsubscribe harm together | Ignore unsubscribes because the primary metric rose | Claim every additional click represents customer value | Remove the guardrail after observing an unfavorable result
Direction, priorities and rationale | A permanent guarantee that every date is fixed | Every implementation detail for all future releases | The complete set of user records in production
Smallest suitable valid-learning experience | The smallest artifact regardless of what it can test | A full release of every planned capability | A deliberately unreliable version with no task checks
Other valuable work is delayed or excluded | Choosing one feature makes all alternatives free | Opportunity cost applies only to cash expenses | Every requested feature can be delivered simultaneously
Number of features released | Successful task completion rate | Rate of avoidable user errors | Customer time saved on the target workflow
Identify claims needing evidence | Turn all assumptions into verified facts | Prevent any later change to the product plan | Replace the need to compare alternatives
Observed change with uncertain cause | The feature necessarily caused the increase | Holidays cannot influence product behavior | A rising metric proves every user group benefited
Observable required behavior | The team's general enthusiasm for the feature | The chosen programming language alone | A list of stakeholder names without task conditions
Learn recurring problems and operating context | Replace direct user evidence with staff opinions alone | Prove all reported incidents have one root cause | Guarantee that a requested feature is feasible
Definition and a decision it informs | A large number without context | A measure that cannot affect any action | A complex formula without known input definitions
Revisit, change or stop the hypothesis | Exclude the contradictory data from all reports | Increase the target until the evidence looks positive | Continue solely because work has already started
Reveal subgroup barriers hidden by averages | Guarantee every segment has sufficient sample size | Establish causality from grouped percentages alone | Replace privacy review of small identifiable groups
Structured discussion of assumptions and trade-offs | Automatic proof of the correct decision | A guarantee that subjective weights are objective | A substitute for checking input evidence
Discover feasibility and interaction constraints | Ensure no user research is needed | Guarantee every idea can be implemented cheaply | Remove the need for later operational validation
Review outcomes and guardrails | Treat shipment as proof of user benefit | Stop gathering evidence after deployment | Count only the number of changed source files
''')
bank("customer-research", r'''
Questions and decisions to inform | The preferred solution to validate | The longest possible interview schedule | The presentation style of the final report
Tell me about your last appointment booking | Would our simpler booking screen make things easier? | Why is the current booking screen so frustrating? | Do you agree that one-click booking is best?
Their context addresses the question | Relevant experience guarantees a population estimate | Existing experts represent every future customer | Recruitment convenience establishes user relevance
Purpose, voluntariness and data/recording use | A promise that no participant may withdraw | A general product brochure without research context | Permission for any unrelated future use of private data
Keep evidence distinct from explanations | Remove every interpretation from analysis permanently | Treat the first interpretation as an observed fact | Ensure every observer reaches an identical opinion
Explore context and retain both sources | Discard the observation because the participant spoke first | Accuse the participant of deliberately misleading the team | Report only whichever source supports the hypothesis
Check clarity, timing and flow | Guarantee every final interview lasts exactly as planned | Choose only questions likely to generate praise | Eliminate all need for relevant follow-up
Can you describe a recent example? | Surely the new design would solve that problem? | Would you agree the task is easy once explained? | Can we mark that issue resolved now?
Missed barriers for new/infrequent users | Guaranteed representation of every potential customer | Complete absence of any useful task evidence | Random selection from the full target population
A recurring evidence-supported pattern | Any phrase used once in a positive comment | An assumption chosen before reviewing observations | A statistical prevalence estimate from one interview
Expose variation and challenge overgeneralization | Make every contradictory account cancel all other evidence | Guarantee that the main pattern is false | Replace analysis with whichever case seems most dramatic
Detailed insights and possible problems | Precise population prevalence from a few interviews | Universal proof of all users' preferences | Guaranteed financial return from the proposed redesign
When contextual behavior is hard to recall | Only after the team has decided the final solution | Whenever recording private data can replace consent | When observed behavior is irrelevant to the question
Topics, neutral starters and follow-up space | A rigid script forbidding clarification | The answers participants are expected to provide | The product team's preferred response for each question
Avoid unnecessary identifying detail | Make all research automatically anonymous | Eliminate every obligation to protect notes | Ensure quotes can be shared publicly without review
Favoring belief-confirming evidence | Recording evidence that challenges a preferred solution | Defining a question before collecting observations | Comparing different explanations against the same notes
Several sampled participants struggled with the date field | All people always fail every date field | The design causes failure in every industry | No participant could ever complete a date task
Reveal relevant access barriers | Assume one participant represents all disabled people | Replace keyboard checks with participant attendance | Guarantee every service becomes fully conformant
Observed problem, context and proposed response | A design preference without source observations | A recommendation based on participant counts alone | A solution copied from an unrelated product
Revisit method, participants and consent | Reuse all data for any new purpose automatically | Keep the original approach regardless of the new question | Rewrite the original notes to match the new objective
''')
bank("ux", r'''
Steps and decisions toward a goal | The order of source files in the repository | The visual style of every heading | A list of all possible product features
Test assumptions before full implementation | Guarantee the final design cannot have defects | Avoid checking the proposed task with users | Replace all functional requirements with screenshots
Find whether you can book next Tuesday | Click the blue Book button on the right | Use the easy calendar to choose Tuesday | Show us why this booking screen is clearer
Perceiving how an element can be used | The number of pixels in an exported image | The internal component's source-code size | The duration of the product's build process
Explain progress and reduce uncertain repeats | Guarantee the operation has already succeeded | Hide whether an action was received | Replace server-side duplicate-effect protection
State the problem and correction | Change the error text to a brighter red | Remove the entered data to simplify the form | Replace the message with an unexplained status code
Avoid repeating completed work | Guarantee every originally entered value is valid | Prevent the user from revising any earlier choice | Avoid validating data on the server
Organizing and labeling findable information | Choosing the fastest database driver | Maximizing decorative variation between routes | Setting every page to the same font size
Explore structure and task flow | Approve final color contrast from gray boxes | Measure production database performance | Certify the finished service's accessibility
Provide a route when the preference is unavailable | Guarantee all preferred appointments remain available | Show only states where every action succeeds | Hide alternative dates until the user leaves
Clear consequences and confirmation/recovery | An ambiguous button with immediate irreversible effects | A confirmation that conceals what will be removed | A recovery link that cannot restore the affected data
Hidden effort, errors or frustration | Completion rates already measure every usability dimension | A successful task proves all paths are accessible | Task completion always implies user satisfaction
Reuse learned interaction patterns | Ensure every page has identical information | Prevent any adaptation to a different task | Replace accessible labels with visual similarity alone
Behavior and context before inferred causes | The researcher's preferred explanation as fact | A permanent label about the participant's ability | The first redesign idea before noting the hesitation
Support navigation without a pointer | Make every prototype automatically conformant | Remove the need for focus indication | Guarantee touchscreen controls need no testing
Explain the space and a relevant first step | Show a blank panel without explanation | Present a permanent error before any action | Hide navigation until the learner guesses the next step
Reveal secondary detail when relevant | Hide required information until after submission | Remove all advanced actions from the service | Force every user through every optional explanation
Revise choices without unrelated progress loss | Guarantee navigation never changes any state | Treat every Back action as a complete restart | Remove error recovery to simplify the flow
Prioritize, revise and check the change | Ship the first visual alternative without testing | Remove the affected task from the report | Assume the issue is solved when the ticket closes
States, content, responsiveness and access | Only a single static successful screen | Only preferred colors and decorative assets | The deadline without interaction or error behavior
''')
bank("accessibility", r'''
No; manual/contextual checks are needed | Yes; a clean scan certifies every user journey | Yes; all requirements are mechanically detectable | No; automated findings never provide useful evidence
Identify the field's purpose | Make the field visually larger without semantics | Guarantee every entered value is correct | Replace all error feedback with a field name
It disappears and may lack a persistent name | A placeholder always becomes a permanent label | It guarantees an accessible description during entry | Its color alone establishes field semantics
The element receiving keyboard input | Every element the pointer has passed over | The control with the longest visible label | The first link in source-code order regardless of focus
Focus cannot leave by expected keyboard methods | Focus briefly enters a dialog intentionally | A keyboard shortcut moves to a labeled section | The pointer cannot drag an element
Another usable cue such as text or shape | A slightly different shade without another cue | A color name available only in a screenshot | A legend made of unlabeled colored squares
Relevant meaning or purpose in context | Every file property of the original image | A list of unrelated search keywords | The same generic label for all images
An empty alternative | A description of every decorative pixel | The image's storage filename | A mandatory focus stop for the decoration
Communicate structure and aid navigation | Make all text visually identical | Replace the need for meaningful content order | Guarantee that every heading must be the same level
Links may be encountered without context | All users read every preceding sentence first | Link destination is never relevant before activation | Vague labels automatically become meaningful to software
Place, contain and sensibly restore focus | Leave focus behind an interactive modal | Move focus randomly between page regions | Prevent keyboard exit even after the dialog closes
Help locate and correct the problem | Make the error available only on hover | Replace the error with an unrelated page title | Require users to infer which field failed
Text for speech and relevant sounds | A visual transcript containing only color names | A translation of the page title alone | An image description without any spoken content
Actual foreground/background contrast matters | A text color is accessible regardless of background | Contrast can be inferred from the font name alone | Increasing saturation always improves readability
Keep essential content and controls usable | Clip enlarged controls without a recovery path | Hide labels whenever text becomes larger | Force all enlarged text back to the original size
Preserve meaningful reading/focus sequences | Visual order always overrides every DOM relationship | Focus order need not follow an understandable task | CSS layout automatically corrects all reading order
An accessible action name | Only the icon's image filename | Only its CSS class | The symbol's color without its purpose
Find practical barriers beyond checklists | Guarantee every participant has identical needs | Replace all technical checks with one opinion | Certify conformance from attendance alone
Useful focus movement and understandable errors | Only whether the links are underlined | Only the number of items in the summary | Whether the summary matches the brand's accent color
Barrier, task, evidence and testable correction | A score without affected behavior | A screenshot without identifying the problem | A generic label with no reproduction steps
''')
bank("react", r'''
A UI description for its inputs | A direct database connection for every element | A permanently mutated copy of all props | A command to modify every DOM node immediately
Parent-to-component inputs | Direct mutation of the parent's local state | Persistent global storage across browser sessions | Scheduling network side effects during rendering
Predictable output without unrelated side effects | Make rendering the place to send every analytics event | Let rendering mutate shared data for convenience | Ensure every render produces a different result
A state value and update request function | A mutable value that never requests rendering | A permanent database record and transaction | A direct reference to the component's DOM element
setCount(previous => previous + 1) | setCount(count++) | setCount(() => 1) | setCount(count = 1)
Update without mutating the existing snapshot | Force every nested value to have a new random ID | Avoid ever passing arrays as component inputs | Make every change bypass React's update mechanism
Correspondence with existing list items | The item's visual position as its permanent identity | A guaranteed sort order for the data source | The total number of component renders
State can follow the wrong item | Index keys always prevent rendering any list | Reordering cannot change which item occupies an index | Index keys force every item to retain the right identity
Closest suitable common owner | Independent duplicated state in both siblings | A DOM query that reads the other control's text | A fixed default value that ignores both controls
External-system synchronization after rendering | Calculating every simple value derived from props | Performing unrelated side effects during ordinary rendering | Mutating a parent's props before returning JSX
Remove the old subscription | Preserve every subscription across all remounts | Trigger an unrelated state update on every cleanup | Guarantee that subscriptions can never emit events
Reactive values used by the effect | Only values the developer wants to ignore | An arbitrary fixed number of variable names | Every value in the entire application
Copies can become inconsistent | Derived values can never be computed while rendering | State automatically stays synchronized with changing props | Every prop must be copied into state before use
State-driven value with an update handler | A field whose value exists only in an unrelated label | A field permanently disabled for every user | A field updated only through direct DOM mutation
Preserve consistent hook ordering | Guarantee every hook runs in a separate thread | Remove the need for state cleanup | Make hooks callable from arbitrary nested conditions
A persistent mutable container without update-triggered renders | A state value that always rerenders on mutation | A copy that is recreated on every render | A database transaction for mutable server records
Stale responses replacing newer results | Every request returning in the original start order | A guarantee that cancelling UI code cancels server writes | Identical results for all different search terms
Expected interaction and accessibility semantics | Automatic permission to perform the action on the server | Elimination of every event handler | Guaranteed prevention of duplicate API effects
Its identity and position in the tree | Its source filename regardless of rendered identity | The browser's global URL history alone | Any variable with a matching component name
Test inputs, feedback and submission behavior | Assert only the presence of a CSS class | Check implementation variable names without using the form | Count renders without verifying any visible result
''')
bank("mobile", r'''
The OS can stop and recreate the process | Mobile processes always remain alive until logout | Background apps keep unlimited memory permanently | A successful launch proves lifecycle recovery
Available offline actions and data | A guarantee that all actions work without a server | The number of network bars without task context | A permanent empty screen after every disconnection
Explain permission in task context | Obtain unrelated permissions before explaining features | Avoid ever offering a denial path | Make a prompt's meaning independent of the user's goal
Explain impact and offer a suitable alternative | Repeat the request continuously until accepted | Claim that permission was granted despite denial | Stop all unrelated functionality without explanation
Keep input and rendering responsive | Guarantee faster execution for every network request | Make server authorization unnecessary | Avoid any need to manage task cancellation
Separate data access and presentation | Store every screen's data in unrelated duplicated records | Force each view to implement its own sync rules | Replace all validation with a visual loading state
A defined authoritative data state | Independent conflicting copies with no reconciliation | Whichever screen rendered most recently | A permanent cache that never reflects writes
Conflict policy and version detection | Silent overwriting without knowing which data changed | An assumption that offline edits cannot conflict | A guarantee based only on device screen size
Prevent duplicate booking effects | Make every failed connection prove no booking occurred | Assign a new operation identity to each retry | Replace the need to check the server's result
Pending work versus completed no matches | A permanent spinner for a valid empty result | The same success message for all failures | An empty list before any query has finished
Check layout and controls under variation | Guarantee every translated label has equal length | Test only the smallest default text setting | Infer usability from one developer's phone
Reliable activation without precision pointing | The smallest possible clickable area | Visual icon size without interactive hit-area checks | A hidden gesture without a labeled alternative
Exposed tokens can grant account access | Tokens are public because the app uses HTTPS | Local storage automatically removes every exposure risk | UI obscurity replaces appropriate credential protection
Predictable return without unintended loss | Reset every task whenever Back is pressed | Ignore platform navigation conventions | Treat navigation as permission to discard all drafts
Bounded retry, clear state and idempotency | Retry every failure forever without status | Use a new booking identity for every retry | Report success without checking the server response
Avoid battery, network and resource waste | Polling is always free when the screen is off | Every background task receives unlimited execution | More polling guarantees fresher server data
Name, focus order and assistive action | Only whether the icon looks familiar | Only the visible control's brand color | A tap with a pointer and no semantic inspection
Control local-data migration across updates | Make every schema update automatically backward compatible | Remove the need to validate existing records | Prove that all stored values are current
Saved locally and awaiting synchronization | Already saved to every server replica | Permanently lost despite a successful local save | Fully synchronized without contacting the server
Controlled interruption, restore and safe retry | Only a screenshot of the first launch screen | A happy-path request that never loses connectivity | A test that skips all background/foreground transitions
''')
bank("ml-operations", r'''
Reproduce code and data together | The algorithm alone reconstructs every original input | A model filename proves its source-data version | Versioning data replaces evaluation of the output
Artifacts, provenance and evaluation | Only the latest display name | Unrelated production user credentials | A mutable file with no release identity
Training/production processing differences | A delay downloading the model's documentation | The number of parameters in the model alone | A change only to the dashboard's color scheme
Avoid optimistic evaluation from repeated tuning | Guarantee every test example is harder than training | Use test results to choose every hyperparameter | Replace the need for a clearly defined task
Input-distribution change over time | Any failed HTTP request | Guaranteed deterioration of prediction quality | A new deployment label without input changes
Latency and usefulness measure different things | Every fast model necessarily gives correct predictions | Response time determines the ground-truth labels | Good uptime replaces predictive evaluation
Baseline, quality criteria and operating limits | Only the candidate's parameter count | Only the newest training-run timestamp | Only a favorable result selected after evaluation
Observe limited exposure before expansion | Guarantee no canary user can encounter a failure | Skip baseline comparison before deployment | Remove all need for a rollback mechanism
Restore a compatible serving package | Assume old weights match every new feature schema | Depend on a model display name without artifacts | Restore only the dashboard while retaining incompatible code
Validate schema and apply defined fallback/failure | Invent a confident prediction from absent required input | Treat every missing feature as verified zero silently | Assume a retraining schedule repairs live input contracts
Reveal weakness hidden by aggregates | Guarantee every small slice has precise estimates | Prove all subgroups will have identical results | Replace the need for a separate evaluation set
Intended use, evidence and limitations | Guaranteed unbiased behavior in every setting | A substitute for empirical testing | Only the compressed artifact's file size
Reproduce the execution conditions | Assume all dependency versions behave identically | Record only the architecture's marketing name | Treat random seeds as a complete environment specification
Unnecessary sensitive-data retention or exposure | Every log platform automatically anonymizes all values | Full raw requests are always required for monitoring | Internal logs can never reveal private information
Check actual predictive outcomes | Input drift alone proves each prediction is correct | Service uptime directly determines outcome quality | Training loss is the only measurable quality evidence
Signal, owner and response path | A notification for every individual prediction | A red chart with no threshold or context | A warning that no one is responsible for handling
See whether complexity adds value | Establish that simple models are always optimal | Remove all need for data preparation | Guarantee a larger model cannot improve the task
Fresh-data retraining can still regress | Fresher data guarantees every metric improves | A scheduled job establishes model suitability | Automatic training prevents all source-data quality issues
Inputs, processing, schedule, outputs and recovery | Only a dashboard title and a model nickname | Only a public endpoint without input contracts | Only one example response copied into a document
Metrics can diverge from intended outcomes | Any numerical score measures all business value | Training accuracy alone proves product usefulness | More input data eliminates the need for an objective
''')
bank("automation", r'''
Information about a physical condition | Energy that directly drives the controlled load | A command deciding the required output state | The entire program's state-transition policy
Convert a command to physical action | Measure a physical condition for the controller | Store the complete sequence of control instructions | Interpret every external fault without a controller
A received external or simulated signal | A command sent to an external actuator | A completed diagnostic report | An approved program revision identifier
A produced control signal | A measurement arriving from an external sensor | A permanent proof that the device responded | The complete set of possible operating states
Repeated logic evaluation under its execution model | Each instruction executes once at installation | Every input is physically continuous and fault-free | The program is evaluated only when an alarm is acknowledged
Define what each signal state means | Make every true signal mean safe operation | Remove the need to inspect wiring assumptions | Ensure every sensor has the same normal state
Block action unless conditions are satisfied | Guarantee every physical hazard is controlled | Confirm that a commanded motor is actually running | Replace all qualified safety-system review
Qualified design and verified safety provisions are needed | Any software condition automatically has a validated safety rating | A working simulation proves safe operation on real machinery | A generic PLC program replaces all safety validation
Measured information adjusting control action | A command assumed to equal the physical response | A fixed output that ignores measured conditions | A display label unrelated to the process measurement
Command versus confirmed response | Program name versus drawing revision | Sensor color versus display font | The command's presence as proof of motor motion
A defined delay or timed condition | A guarantee that all physical operations finish on time | An automatic substitute for checking sensor response | A permanent record of every operator decision
States, transitions and actions | Only the names of installed sensors | Only the current stock of spare components | Every unrelated maintenance document in one list
Investigate response to an input fault | Prove the real equipment has the same safety performance | Guarantee every possible sensor fault was simulated | Replace the need to define expected transitions
Condition, context and response path | A generic warning without an affected process | Every raw signal value without meaning | A repeating sound without an owned next step
Awareness is not resolution | Acknowledging an alarm repairs the physical fault | Every cleared display means the hazard is removed | Acknowledgment proves the system may restart safely
Traceable review of behavior-affecting changes | Make all future faults impossible | Allow undocumented changes whenever production is delayed | Guarantee identical behavior across different program versions
Initial state, inputs, transitions and results | Only a screenshot of the final display | A result without the tested input sequence | A pass label without expected behavior
Mechanical bounce can create rapid transitions | Debounce guarantees every safety function is validated | Filtering removes the need to understand signal timing | Every switch operation produces exactly one ideal edge
Follow site escalation to qualified personnel | Improvise a repair based on a quiz answer | Bypass an interlock to see whether production resumes | Modify live logic without authorized review
Bind evidence to the tested behavior | Prove every later version behaves identically | Remove the need to record input conditions | Guarantee that the observed fault cannot recur
''')
bank("electronics", r'''
Rate of charge flow | Electric potential difference | Opposition to current flow | Energy used per unit time
Potential difference between points | Charge passing a point per second | Opposition to current flow | Total energy stored in the circuit
Ohm | Ampere | Volt | Watt
0.05 A | 0.5 A | 5 A | 20 A
4 V | 0.0001 V | 10 V | 400 V
3 W | 12 W | 6.5 W | 0.083 W
300 ohms | 66.67 ohms | 150 ohms | 100 ohms
50 ohms | 200 ohms | 100 ohms | 25 ohms
Current | Voltage across each element | Resistance of each element | Power absorbed by each element
Voltage | Branch current | Branch resistance | Power in each branch
No continuous current in the open path | Infinite continuous current through the open path | Zero voltage across every component necessarily | A complete conducting connection across the gap
Low resistance can allow excessive current | Every short circuit automatically reduces the supply voltage safely | A short circuit guarantees zero energy transfer | Low resistance prevents components from heating
Symbolic electrical connections and functions | The exact physical spacing of every component | Guaranteed safe wiring for any supply voltage | A photograph of the assembled enclosure
Energy storage in an electric field | Energy storage only in a magnetic field | Permanent conversion of every voltage to current | Conduction in only one direction by definition
Preferential conduction in one direction | Identical conduction under both voltage polarities | A fixed current independent of the circuit | Perfect energy storage without any charge
Reverse polarity can malfunction or damage it | All polarized components are interchangeable in either direction | Reversal always improves the component's operating margin | A schematic symbol makes physical orientation irrelevant
Potential difference between specified nodes | A voltage at one point with no reference | Current flowing through an unrelated branch | Resistance measured while ignoring circuit conditions
Wrong instrument use can mislead or create hazards | A display reading proves every instrument connection is safe | All measurement modes have identical circuit effects | Measuring a live circuit never affects its behavior
Rated dissipated power under stated conditions | The current regardless of resistance or temperature | The voltage at which every circuit becomes safe | Total energy the entire power supply can deliver
6 Wh | 0.67 Wh | 5 Wh | 6 W
''')
bank("events", r'''
Purpose, audience, outcomes and constraints | The decoration palette before the event's purpose | Every supplier's preferred package | Only the date most convenient for the organizer
Timed activities, owners and dependencies | A list of attendees without operational timing | A substitute for checking shared-resource conflicts | A guarantee that no activity can overrun
Prevent and resolve missed handoffs | Make every task independent of all other teams | Remove the need for an escalation route | Guarantee that no owner needs backup support
Audience, access, capacity, activities and constraints | Only the lowest quoted hire price | Only the largest room's advertised floor area | The venue's promotional photographs alone
Capacity depends on approved operating conditions | Every room's largest advertised number applies to all layouts | Registration software determines physical safety limits | Seated and standing arrangements are always interchangeable
30 | 90 | 120 | 210
Coordinate support in advance | Assume one arrangement suits every participant | Replace consultation with a fixed label | Wait until arrival before checking available facilities
Scope, timing, outputs, contact and acceptance | Only the supplier's promotional description | A price without the required deliverables | A schedule without the responsible contact
Trigger, option, owner and communication | An assurance that staff will improvise | A plan with no decision authority | A list of old incidents without response steps
Different conditions need appropriate escalation | Every issue requires exactly the same emergency response | A minor delay proves the venue is unsafe | Emergencies can always wait for the next routine meeting
Roles, communications and qualified interfaces | Permission for learners to direct real emergency services | Replacement of the venue's approved procedures | A guarantee based only on the exercise attendance
Allow time for preparation and reset | Ensure every activity uses the same equipment | Remove the need to check venue access times | Assume attendee-facing duration includes every setup task
Resolve the resource conflict first | Confirm both sessions and leave the conflict undocumented | Assume one speaker will not need the equipment | Double the attendance estimate to compensate
Purpose-needed collection, access and retention | Full attendee details shared with every supplier | Permanent retention of all registration fields | Use of access needs for unrelated promotion
Avoid barriers from incorrect information | Guarantee everyone uses the same travel route | Replace the need for a contact or update channel | Make all late schedule changes impossible
Assess impact, activate an option and inform people | Keep the published program unchanged without explanation | Promise a replacement before checking availability | Remove the session without telling affected attendees
Future obligations reduce available budget | Only cash already paid can affect the budget | Approved commitments never become actual costs | Every future cost is automatically reimbursed
700 | 4,300 | 5,000 | 9,300
Results/evidence against objectives | Only the number of decorative assets produced | The organizer's preferred outcome without records | The budget total without the event's purpose
Make improvements owned and usable | Guarantee the next event has identical conditions | Avoid reviewing whether the action was effective | Treat documenting a lesson as implementation itself
''')
bank("hospitality", r'''
Agreed booking, requirements and status | The room's current inspected-ready state alone | Every guest's unrelated private history | Only the price advertised on a public website
Booked does not always mean ready | A reservation automatically confirms inspection completion | Every unavailable room can be assigned immediately | Room status and reservation commitments are interchangeable
Open issues, commitments, status and follow-up | Only the number of staff finishing the shift | Every private conversation regardless of relevance | Yesterday's occupancy without current exceptions
Protect guest security and privacy | Confirm that the guest selected the cheapest room | Replace the property's approved access process | Guarantee that everyone in the lobby is authorized
Protect details; use the approved contact process | Disclose the room number if the requester seems familiar | Share details whenever the caller knows a guest name | Confirm room occupancy publicly to speed the queue
Listen and clarify the problem | Promise a refund before checking authority | Dismiss the concern until the guest supplies a solution | Transfer the complaint without explaining the next step
Avoid unsupported commitments | Guarantee every guest receives the same remedy | Remove the need to explain escalation options | Make all service complaints disappear automatically
Clarify need and coordinate suitable support | Assume the same arrangement fits every access need | Collect unrelated medical details before offering help | Promise unavailable facilities without checking
80% | 20% | 40% | 125%
Period and availability rules affect the measure | Occupancy always uses the same denominator at every property | A percentage is meaningful without a time window | Unavailable rooms can never affect the calculation
Demand may exceed deliverable accommodation | Overbooking guarantees every confirmed guest is accommodated | A booking system creates additional physical rooms | Capacity plans become unnecessary when demand rises
Identify and manage the right area | Guarantee every maintenance issue has the same cause | Remove the need to record the room's current status | Treat the report as proof the area is already safe
Follow authorized protection and escalation procedures | Repair safety-critical equipment without qualification | Ignore it until a guest files a formal complaint | Remove the warning to prevent concern
Avoid unsafe assumptions about ingredients/preparation | Guess from the dish's usual appearance | Promise an allergen-free result without qualified confirmation | Treat all food preferences as identical conditions
Bookings, readiness, staffing, access and communication | Only the group's social-media promotion | Only the number of bags expected | A room list without readiness or ownership checks
Verify, explain feasible options and own updates | Promise an exact readiness time without evidence | Mark the room ready without required checks | Ask the guest to discover another option unaided
Cleaning may not complete release checks | Cleaning and inspection always mean the same state | The booking record alone overrides every room check | Inspection is unnecessary whenever a room was requested
Item, location, time and authorized handling | A public description identifying every claimant | An informal transfer without recording custody | Only the finder name without item or location
Preserve agreed follow-through across staff | Guarantee the promise is already fulfilled | Replace the need to check what can be delivered | Let later shifts infer commitments from memory
Complaints, operations and experience differences | Only the overall satisfaction average | Only the number of guests who left no comment | A single favorable testimonial without context
''')
bank("account-management", r'''
Customer outcomes, stakeholders, actions and risks | Only the seller's revenue target | A list of all product features regardless of relevance | Only the last meeting's calendar invitation
Roles and influence differ | Every contact can approve every purchasing decision | A friendly contact is always the budget owner | Job titles guarantee identical authority across organizations
Mutual next steps, owners and timing | Only the vendor's internal sales target | Actions assigned to the customer without agreement | A guaranteed renewal regardless of delivered outcomes
Customer outcomes can differ from internal activity | Internal login counts define success for every customer | The seller's revenue target is the customer's objective | Feature releases prove the customer achieved its goal
A definition and interpreting context | A score treated as direct proof of relationship quality | A color assigned without documented inputs | A guarantee of renewal from any positive signal
Investigate cause and customer context | Discount immediately without examining the blocker | Assume reduced usage proves the customer intends to leave | Increase activity targets without checking the desired outcome
Outcomes, evidence, blockers and next steps | Only how many emails the account team sent | Only the number of features released by the vendor | A renewal pitch without customer-result evidence
Allow time for reviews and purchasing steps | Guarantee the customer will renew automatically | Bypass all customer approval requirements | Avoid discussing unresolved service commitments
Loss of context or continuity | Guaranteed faster approvals for all decisions | Elimination of every conflicting stakeholder need | Proof that the contact represents all end users
Objectives, people, commitments, risks and history | Only the next invoice amount | The previous manager's opinion without supporting records | A product brochure without account-specific facts
Plans depend on evidence and agreement | Every expression of interest is a firm commitment | Forecast probabilities are contractual guarantees | A possible opportunity is already recognized revenue
Evidence, impact, owner and update path | A generic complaint without affected behavior | An unsupported promise of immediate repair | A blame statement without a responsible next step
Protect confidential or personal records | Assume all internal recipients are automatically authorized | Treat a forwarded email as permission for public sharing | Remove only the account's display name before sharing
Seek approval and explain the current limit | Promise the result to preserve the relationship | Change contract terms without the responsible owner | Present a possible exception as already approved
Desired features may not be available | Every request establishes a delivered capability | Customer interest guarantees technical feasibility | A roadmap date is always a binding product promise
Explore priorities, constraints or experience | Ask only questions that invite praise | Lead the customer toward a predetermined package | Avoid all discussion of blockers or alternatives
Verified need, fit, value and limits | The largest possible invoice regardless of suitability | A target quota without customer evidence | A discount offered before understanding the use case
Different aspects of the relationship | Higher revenue automatically proves better customer outcomes | Customer outcomes are identical to internal sales activity | Revenue contains all necessary adoption evidence
Decisions, questions, owners and agreed actions | A generic thank-you without the unresolved requests | A new commitment the customer never accepted | The sales forecast alone without meeting decisions
Defined signals improved; review future outcomes | Renewal and satisfaction are now guaranteed | The score establishes that every user has succeeded | No further customer conversation is necessary
''')
bank("procurement", r'''
Outcome, specification, quantity and acceptance | The preferred supplier before requirements are defined | A budget without the intended purchase outcome | Only the product's promotional description
Quality, risk, delivery and life-cycle cost matter | The lowest unit price is always the best value | Purchase price includes all future operating costs | Every supplier's offer has identical exclusions
Consistent and transparent comparison | Guarantee the cheapest offer automatically wins | Change the weights after seeing a preferred quote | Replace checks of whether suppliers can meet requirements
Offer B at 115 | Offer A at 100 | Offer A at 120 | Both offers cost 115
Authorized purchase instructions and terms | Proof that every ordered item has already arrived | A supplier's payment receipt by itself | Final acceptance of all delivered goods automatically
Order, receipt and invoice | Quote, advertisement and supplier logo | Budget, forecast and employee attendance | Purchase request, website visits and catalog count
Investigate through the exception process | Pay the invoice without checking receipt evidence | Change the received quantity to match the invoice | Reject all future orders from that supplier immediately
Verify ability to meet requirements and timing | A low quote guarantees reliable delivery | Supplier size alone proves suitable capability | A polished proposal removes the need for review
An interest that can improperly influence judgment | Any documented comparison of competing suppliers | A price difference between two valid offers | An approved question about delivery capability
Review criteria, approvals and decision evidence | Guarantee nobody can ever challenge the choice | Replace a written requirement with a supplier slogan | Make every procurement record publicly available
Continuity, capability, quality and contextual risks | Only the supplier's logo and presentation style | Only the cheapest currently advertised price | A universal score without evidence or defined inputs
A checkable basis for acceptance | Automatic approval of anything delivered | A substitute for checking the actual received goods | A way to change requirements after delivery silently
Assess impacts and obtain approval | Accept because the supplier proposed it | Ignore affected safety or performance assumptions | Change the purchase record without traceability
Preserve confidentiality and fairness | Confidential quotes are public once received | Sharing every offer is always authorized negotiation | Removing the file's title removes all confidentiality
Purchasing patterns by amount, category and supplier | Guaranteed proof of every supplier's profitability | Every employee's private financial position | The exact future purchase price of all items
Prevent duplicate payment | Prove all similarly priced invoices are invalid | Remove the need to reconcile supplier balances | Ensure every invoice has a different amount
Definition, period, source and target | A label such as good without a measurement | Only the provider's preferred score | A number without its denominator or time window
Retain accountability and relevant controls | Urgency automatically grants unlimited purchasing authority | An urgent request needs no source or approval record | All exception procedures may be ignored under pressure
Requirements, alternatives, constraints and authority | A promise to accept any proposed term | Disclosure of every competitor's confidential quote | A target discount without checking the requirement
Seek responsible qualified guidance | Infer requirements from an unrelated jurisdiction | Commit first and investigate authority later | Treat a general learning quiz as legal approval
''')
bank("technical-writing", r'''
Audience, task and assumed knowledge | The maximum word count before the task is known | The writer's preferred unexplained acronyms | Every product feature regardless of the reader's goal
Needed conditions and knowledge | Unrelated background about the author | The result of a later optional task | A list of marketing claims without setup conditions
Guided learning versus precise lookup | Tutorials and references have identical reader goals | Reference pages must repeat every tutorial step | Tutorials should omit explanation of necessary actions
Select Create project, then enter a name | Perform the appropriate project operation as usual | Complete the relevant setup in the standard manner | Make the necessary configuration where applicable
Recognize the same concept consistently | Give each mention a new synonym to avoid repetition | Hide the relation between interface and documentation labels | Replace every feature name with an internal code
Accurate, scoped and sufficiently contextualized | A plausible fragment with missing required inputs | A large example with untested dependencies | A sample that includes live private credentials
Avoid exposing or mistaking real secrets | Make all realistic-looking values safe by definition | Permit publishing production keys without access review | Replace the need to check example configuration
Symptom, checks and next step | A list of unrelated status codes | An unsupported cause presented as certain | A generic retry instruction for every failure
Find hidden assumptions and missing steps | Guarantee every audience has identical background | Replace the need for technical claim verification | Prove that a procedure is permanently current
Version and applicability limits | Only the publication date without product context | An assumption that every past version behaves identically | A universal compatibility claim without evidence
Missing guidance for differing conditions | Guaranteed success whenever the page is readable | Automatic handling of every failure by the product | Removal of the need to state prerequisites
Readers may not know the shorthand | Every acronym has the same meaning across domains | Shorter words always produce more accurate instructions | A glossary never needs task-specific context
An observable progress check | A vague statement that things should be fine | An internal variable name the reader cannot inspect | A promise unrelated to the action just performed
They may age or lack accessible information | Screenshots automatically update when products change | Every reader can interpret screenshot text | Visual appearance establishes all interaction behavior
Correctness and applicability | Only punctuation and sentence length | The number of images on each page | Whether the author prefers the chosen terminology
Show what a valid request must contain | Make every optional parameter mandatory silently | Avoid documenting the accepted input types | Guarantee all omitted values have the same default
Meaning and appropriate recovery/correction | Only the raw numeric status without interpretation | A success example relabeled as an error | The server's private credentials for debugging
Keep instructions current as products change | Make every old instruction permanently valid | Replace the need to test significant procedures | Transfer ownership to any anonymous reader
A labeled link to relevant detail | A generic click-here link to an unrelated page | A required reference hidden inside a screenshot | A circular link that never reaches the prerequisite
Changed behavior, affected users and action/limits | Only the number of source-code lines changed | Only the team's internal project nickname | A feature slogan without relevant compatibility context
''')
bank("brand", r'''
Audience-relevant value and distinction | The complete inventory of visual asset files | A guarantee that every audience prefers the offering | The internal order of the marketing team's tasks
Expressed identity versus experienced perception | Logo size versus advertising budget | Employee headcount versus website page count | Sales forecast versus production capacity
Messages depend on audience needs | One message is equally relevant to every audience | The brand team's preferences establish customer priorities | A large audience removes the need for positioning
Experience and evidence support it | Repetition makes any unsupported promise true | An attractive logo guarantees delivered value | A competitor's weakness proves every advertised benefit
Consistent identity and communication principles | Identical wording in every possible situation | A substitute for verifying comparative claims | A requirement to copy layouts without access checks
Experience, service and behavior also shape perception | A logo controls every customer's private opinion | All brand meaning is determined by its file format | Service quality cannot affect brand associations
A relevant supportable reason to prefer it | A difference that has no audience relevance | A claim based only on the seller's enthusiasm | An impossible benefit that nobody can test
Recognition or recall in a defined context | Guaranteed preference over every competitor | Measured customer trust in every claim | Proof of a completed customer purchase
Recognition can come from negative experience | Awareness automatically establishes positive trust | A familiar logo prevents all unfavorable associations | High visibility guarantees satisfied users
Strengthen favorable associations through useful experience | Make unsupported promises credible through repetition | Guarantee every audience interprets the experience identically | Replace reliable service with more frequent visual changes
Stable identity with situation-appropriate expression | Exactly the same emotional tone in every context | Different core values for every marketing channel | An unrelated visual system for every customer interaction
Associations may not support the new promise | Existing recognition guarantees fit in every category | The same logo proves equivalent delivery capability | A new product removes every prior association
Presuming agreement with the desired image | Asking about an actual recent experience | Exploring alternative perceptions neutrally | Checking how participants interpret a stated message
Avoid sampling/timing artifacts | Guarantee every observed change was caused by advertising | Make different audience populations interchangeable | Remove the need to specify the measurement definition
Improve experience or qualify the promise | Repeat the promise without investigating service failures | Remove all unfavorable feedback from the report | Claim the customer misunderstood without checking evidence
Preserve readable and usable expression | Treat visual distinctiveness as a substitute for access | Assume familiar colors are always high contrast | Remove text labels to protect a minimal appearance
Relevance, evidence and meaningful alternatives | Only the position statement's sentence length | Only the team's preference for the slogan | A claim that excludes all consideration of competition
Evidence and a defined comparison | An undefined statement that the brand is always best | A competitor rumor without a verifiable source | A numerical claim without population or period
Shared principles can adapt to channel formats | Consistency requires identical layouts on every device | Every channel must use a different audience promise | Reusing a logo automatically ensures clear communication
Audience problem, equity, intended change and effects | Only the selection of a new accent color | Only the cost of replacing the website's logo | A new name without investigating existing associations
''')
bank("payroll", r'''
Gross earnings adjusted by stated additions/deductions | Gross earnings before all stated adjustments | Employer contributions added to every employee payment | All business revenue divided equally among employees
600 currency units | 50 currency units | 300 currency units | 6,000 currency units
820 | 1,180 | 180 | 1,000
80 | 8 | 720 | 800
Local current rules and circumstances determine real rates | The example defines the statutory rate in every country | Any familiar percentage is legally valid for all workers | A fictional scenario authorizes actual payroll deductions
Employee, period, time and approval | Only the total number of names in a spreadsheet | An estimate with no period or reviewing authority | A copied prior-period total without current evidence
Define changes included in a run | Guarantee no correction can ever occur afterward | Remove the need to communicate late exceptions | Make every employee use identical hours
Use the authorized exception/next-run process | Edit the completed run without approval or a record | Discard the change without informing the employee | Promise immediate payment before checking authority
Independent detection of errors or unauthorized changes | Guarantee every prepared amount is correct without evidence | Give one person sole control of every payment stage | Remove the need to verify input records
Approved inputs, calculated totals and payment/accounting records | Only the appearance of the final payslip | Only the preparer's total hours worked | Unapproved estimates without the intended payment output
2,000 | 1,500 | 1,300 | 2,100
They affect different pay/cost components | Employer contributions always reduce employee net pay | Employee deductions and employer costs are interchangeable | Every contribution is paid directly to the employee
Fraud can divert payment | A bank-change email automatically proves identity | Every changed account belongs to the same employee | A new account number makes approval unnecessary
Issue, authorization, adjustment and period | Only the corrected final amount | A deleted original record without explanation | An undocumented overwrite in the payment file
An unsettled amount owed to a recipient | Every future budgeted employment cost | Only the company's received customer payments | An employee's personal bank account balance
Protect sensitive financial and personal details | Every colleague automatically needs every pay record | Internal files are public by definition | Removing a filename anonymizes the contents
Unexpected changes against an appropriate expectation | Only differences in spreadsheet formatting | Every change treated as confirmed fraud | Only whether the total is larger than last time
Avoid wrong or duplicated pay | Make all imported records automatically approved | Guarantee identical deductions for every employee | Replace reconciliation of input and output totals
Verify record and rule through authorized review | Remove the deduction solely because it was disputed | Dismiss the concern without checking the calculation | Apply a fictional learning rate to the real employee
Reviewed totals, exceptions, version and completion | Only a screenshot of an unchecked total | An approval label without the underlying run | A private bank-detail dump in the general system log
''')
bank("audit", r'''
Risk/objective/assertion and needed evidence | The easiest available document regardless of objective | The largest possible sample before defining the question | A preferred conclusion chosen before examining records
Control operation versus direct transaction/balance evidence | Historical periods versus future periods by definition | Physical records versus digital records in every case | Staff interviews versus management interviews only
Addresses the examined assertion or objective | Contains the largest possible number of pages | Always agrees with the preferred conclusion | Comes from the most recently opened file
Quantity cannot fix irrelevant/unreliable evidence | A large quantity always proves every assertion | Reliability depends only on the number of rows | Every internal record has identical evidential value
Questioning evidence and inconsistencies | Assuming every recorded transaction is fraudulent | Accepting explanations without examining contradictions | Rejecting all management-provided evidence automatically
Inquiry may need corroboration of actual operation | A confident explanation proves every approval occurred | Inquiry automatically covers every transaction in the period | A verbal claim replaces the need to define the control
Match the sample to the conclusion's population | Ensure the sample contains only easy-to-obtain records | Make any small subset represent every possible period | Replace the need to identify selection bias
Investigate nature, cause and test implications | Treat one exception as proof every record is invalid | Ignore exceptions whenever most items passed | Change the criteria after seeing the exception
Procedure/source linked to result/conclusion | A final rating without supporting work | A list of filenames without what was tested | A copied conclusion from an unrelated engagement
Different evidence can support different conclusions | A missing record always proves an action never occurred | An absent document always proves fraud | A control's existence proves it operated in every case
Required transactions/items are included | Every recorded amount has the correct calculation | Every asset has the expected physical condition | Every transaction has the same monetary value
Correct recorded values and calculations | Whether every required transaction is included | Whether the organization can meet future forecasts | The number of pages in the supporting report
Report logic/inputs can distort the population | System-generated reports are always complete and accurate | A professional-looking report guarantees reliable evidence | A large row count removes the need to inspect its scope
One person's ability to initiate, approve and conceal | Every possible mistake from any participant | The need to keep transaction records | All management review of delegated responsibilities
Clarify what the work established | Guarantee all unexamined areas are effective | Hide material exclusions from readers | Convert limited testing into an unrestricted opinion
Independence or objectivity | The numerical value of every transaction automatically | The number of source documents in a folder | The report's font size and page numbering
Condition, criterion, effect/risk and evidence | A general criticism without an applicable requirement | A preferred remedy without the observed condition | An unexplained score with no supporting records
Check evidence supports the conclusion | Guarantee no future reviewer can disagree | Replace all original procedure documentation | Approve the work solely because it was completed on time
Implementation and effect on the stated issue | Only whether an action owner attended a meeting | Only whether the plan's title was updated | An assumption that completed actions are automatically effective
No; professional authority is separate | Yes; passing authorizes every professional opinion | Yes; a quiz replaces all engagement requirements | No; introductory learning has no educational value
''')

def revise_banks(original):
    """Apply the reviewed edition only to its exact historical source contracts.

    Both the original full and new concise key phrases express the same answer.
    A fixed content identity chooses their phrasing independently of lengths. This
    avoids imposing a single terse-key style while never padding any option.
    All three competing interpretations are explicit authored strings above.
    Surface-cue statistics remain diagnostics, not educational validation.
    """
    digest = hashlib.sha256(json.dumps(original, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    if digest != SOURCE_SHA256 or set(original) != set(OPTIONS):
        raise ValueError("Foundation source changed; review the editorial edition before rebuilding")
    result = {}
    for topic, rows in original.items():
        if len(rows) != len(OPTIONS[topic]):
            raise ValueError("Editorial item count changed: " + topic)
        revised = []
        for old, choices in zip(rows, OPTIONS[topic]):
            prompt, full, _, explanation, level = old
            use_full = int(hashlib.sha256(("foundation-key-form:" + topic + ":" + prompt).encode()).hexdigest()[:8], 16) % 2 == 0
            answer = full if use_full else choices[0]
            options = [answer, *choices[1:]]
            if len(set(options)) != 4:
                raise ValueError("Editorial duplicate options: " + prompt)
            revised.append((prompt, answer, "|".join(choices[1:]), explanation, level))
        result[topic] = revised
    return result
