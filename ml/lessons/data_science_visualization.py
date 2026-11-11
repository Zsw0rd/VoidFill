"""Source-bound checks for the data science and visualization catalogue.

Checks use original scenarios and small, fictional datasets. Pinned Microsoft
pages are reviewed at the catalogue commit. Installation-only pages and module
indexes remain ungraded. Historical cloud examples are read as case material.
"""

DS = "https://github.com/microsoft/Data-Science-For-Beginners/blob/0c7e46a0db1d6925982d6323b246299b3855ce32/"
REVIEWED_AT = "2026-11-11"
DATA_SCIENCE = "data-science"
VISUALIZATION = "visualization"
BANKS = []
ORIENTATIONS = []
SOURCE_FINDINGS = []
LEGACY_QUESTION_FINDINGS = []


def add(resource_id, path, topic, scope, questions):
    url = path if path.startswith("https://") else DS + path + "/README.md"
    BANKS.append({"resource_ids": [resource_id], "url": url, "topics": [topic],
                  "reviewed_at": REVIEWED_AT, "scope": scope, "questions": questions})


def guide(resource_id, path, topic, reason, children=(), kind="orientation"):
    ORIENTATIONS.append({"resource_ids": [resource_id], "url": DS + path + "/README.md",
                         "topics": [topic], "reviewed_at": REVIEWED_AT, "reason": reason,
                         "child_resource_ids": list(children), "kind": kind})


add("27d4e7f2501e411d385f5a88", "1-Introduction/01-defining-data-science", DATA_SCIENCE,
    "Turning observations into decisions, choosing data sources and distinguishing acquisition, storage and processing.", [
    ("actionable", "ds-purpose", 1, "What turns a pattern found in data into an actionable insight?", "It informs a practical decision", ["It has been saved in a second file", "It was computed from unstructured text", "It uses a more complex model"], "The lesson connects understanding a pattern with using it to guide an action.", "#what-is-data-science"),
    ("sensor-source", "ds-sources", 1, "Which data source can supply a room temperature reading every minute?", "An Internet-connected temperature sensor", ["A survey of comfort preferences", "A floor-plan image", "A list of thermostat vendors"], "Sensor observations directly measure the quantity and interval the analysis needs.", "#where-to-get-data"),
    ("structured-records", "ds-representations", 2, "Which collection is structured as described by the lesson?", "A table with the same timestamp, room and temperature columns in every row", ["Unlabeled audio recordings from the rooms", "Free-form written observations in separate files", "A collection of unindexed photographs"], "A consistent row-and-column layout gives these observations an explicit structure.", "#types-of-data"),
    ("survey-acquire", "ds-journey", 3, "A team needs to learn why customers abandon a booking. They plan to ask those customers a short question. Which step is this?", "Data acquisition", ["Model evaluation", "Schema migration", "Predictive inference"], "The new responses would be collected before storage and analysis.", "#what-you-can-do-with-data"),
    ("future-queries", "ds-journey", 3, "A service will regularly compare minute-level measurements by room and date. What should shape its storage design?", "The queries the team expects to run", ["The color scheme of its first presentation", "Only the size of a single sensor reading", "How often a chart legend changes"], "Knowing the expected access pattern helps choose a suitable data layout.", "#what-you-can-do-with-data"),
    ("feedback-insight", "ds-purpose", 3, "Open-ended support responses often describe confusion at the same booking step. Which next use of that finding fits the lesson?", "Prioritize reviewing the instructions at that step", ["Treat the responses as a random sample of all visitors", "Conclude that those instructions caused every failed booking", "Use the longest response as the only evidence"], "A recurring theme can identify a practical next investigation without establishing causation.", "#what-is-data-science"),
])

add("993db9cab0553748c936a092", "1-Introduction/02-ethics", DATA_SCIENCE,
    "Informed participation, representation, data quality and honest reporting, using fictional examples.", [
    ("consent", "ethics-consent", 1, "Before agreeing to join a study, what does informed consent help a person understand?", "Its purpose, risks and alternatives", ["Only how long the form takes", "Only the research team's job titles", "Only the number of records collected"], "Agreement should follow a clear explanation of what participation involves.", "#22-informed-consent"),
    ("representative", "ethics-representation", 1, "Which concern arises when a dataset underrepresents a group the analysis is meant to cover?", "Sampling bias", ["Unclear chart labeling", "Unbounded retention", "Duplicate column names"], "An unrepresentative sample can produce systematically less reliable conclusions for some groups.", "#26-dataset-bias"),
    ("quality", "ethics-quality", 2, "The lesson's data quality questions ask whether observations do what?", "Measure relevant features consistently", ["Include every field available from the source", "Use the same display colors in each report", "Arrive in the order the team expects"], "Quality depends on whether the recorded data meet the accuracy and consistency needs of the analysis.", "#27-data-quality"),
    ("weekday-sample", "ethics-representation", 3, "A service is open seven days. A team surveys only weekday customers and wants conclusions about everyone. What should it do first?", "Examine who is missing and extend recruitment to weekends", ["Count weekday replies twice to increase the sample size", "Include weekend footfall totals without collecting responses", "Ask weekday respondents for more detailed answers"], "Additional responses from the same slice do not repair the missing coverage.", "#26-dataset-bias"),
    ("selective-story", "ethics-reporting", 3, "A chart hides the only month in which service times fell. Which concern from the lesson is most directly involved?", "Misrepresentation through selective reporting", ["Excess detail about a small but relevant subgroup", "Inconsistent units between the source systems", "Excessive precision in rounding the y-axis"], "Leaving out a relevant period can change the story even when the visible numbers are correct.", "#29-misrepresentation"),
    ("checklist", "ethics-practice", 3, "A team wants its representation review to happen before every release. Which checklist item makes the commitment verifiable?", "Record subgroup coverage and reviewer approval", ["Tell the team to take bias seriously", "Save a copy of the design mockup", "Wait for users to report gaps after release"], "A named action with recorded evidence can be tracked in the release process.", "#2-ethics-checklists"),
])

add("009c0a5726487f0e2b0d295f", "1-Introduction/03-defining-data", DATA_SCIENCE,
    "Separating what values represent from how they are stored and collected.", [
    ("measurement", "data-measurement", 1, "Which recorded field is a quantitative measurement?", "Rainfall in millimeters", ["Station identifier", "Sensor manufacturer", "Weather condition label"], "Arithmetic on rainfall measurements has a meaningful interpretation.", "#quantitative-data"),
    ("structure", "data-structure", 1, "Every record in a table has the fields item, location and quantity. What describes this layout?", "Structured data", ["Free-form text", "An unstructured file collection", "Raw audio"], "The rows share a defined set of columns.", "#structured-data"),
    ("direct-source", "data-provenance", 2, "A library records its own checkout counts for an internal study. What kind of source are those observations for the library?", "Primary", ["Secondary", "An aggregate from another study", "A republished third-party dataset"], "The organization collected the observations directly for its analysis.", "#sources-of-data"),
    ("numeric-code", "data-measurement", 3, "A survey uses code 1 for bus, 2 for walking and 3 for bicycle. Which summary matches what the numbers mean?", "Counts by travel category", ["The mean of the numeric codes as average travel mode", "The total of all codes as total trips", "The largest code as longest travel distance"], "The numeric values are labels for categories and do not measure amount or distance.", "#qualitative-data"),
    ("document-keys", "data-structure", 3, "A set of JSON records has named properties, but some documents contain extra nested fields. Which description fits?", "Semi-structured documents", ["An unstructured recording with no named fields", "A fixed-column table with identical fields on every row", "A single numeric series"], "Named fields and nesting provide organization while allowing the layout to vary.", "#semi-structured"),
    ("two-sources", "data-provenance", 3, "A team counts new orders itself and also downloads a published regional report. How should it describe the two sources?", "Primary order counts and a secondary regional report", ["Both primary because the team stores both files", "Secondary order counts and a primary regional report", "Both secondary because they were eventually exported"], "Provenance follows how the observations were obtained, regardless of the saved format.", "#sources-of-data"),
])

add("acdab68f5b66b329d778b49b", "1-Introduction/04-stats-and-probability", DATA_SCIENCE,
    "Equal-outcome probability, central tendency, spread and careful interpretation of association.", [
    ("equiprobable", "stats-probability", 1, "A fair spinner has eight equal sectors and three are green. What is the probability of green?", "3/8", ["3/5", "5/8", "1/8"], "Three of the eight equally probable outcomes meet the condition.", "#probability-and-random-variables"),
    ("mode", "stats-center", 1, "Delivery options chosen today were desk, locker, desk, pickup and desk. What is the mode?", "Desk", ["Locker", "Pickup", "There is no mode"], "Desk occurs more frequently than any other category.", "#mode-median-and-quartiles"),
    ("mean", "stats-center", 2, "Four readings are 3, 5, 8 and 12. What is their arithmetic mean?", "7", ["6.5", "8", "28"], "The sum of 28 divided by four gives 7.", "#mean-variance-and-standard-deviation"),
    ("outlier-fence", "stats-spread", 3, "Q1 is 12 and Q3 is 20. Under the lesson's 1.5-IQR upper fence, which value would be flagged above the fence?", "34", ["30", "32", "22"], "The IQR is 8 and the upper fence is 32, so 34 lies beyond it.", "#mode-median-and-quartiles"),
    ("expectation", "stats-distribution", 3, "A machine outputs 2 units with probability 0.25 and 6 units with probability 0.75. What is the expected output?", "5 units", ["4 units", "4.5 units", "8 units"], "The probability-weighted sum is 2 × 0.25 + 6 × 0.75.", "#mean-variance-and-standard-deviation"),
    ("correlated-weather", "stats-association", 3, "Outdoor drink sales and shade rental rise together. Temperature could affect both. What can their correlation alone support?", "An association in the measured data", ["An effect of buying a drink on renting shade", "An estimate of the effect of changing temperature", "A conclusion that each person used both services"], "The association is compatible with a common influence and cannot distinguish causal explanations.", "#covariance-and-correlation"),
])

add("5b6039faba757e4d6dc1be12", "2-Working-With-Data/08-data-preparation", DATA_SCIENCE,
    "Inspecting DataFrames, recognizing missing entries, choosing a fill/drop rule and deduplicating at the intended grain.", [
    ("info", "prep-profiling", 1, "Which Pandas method prints a DataFrame summary with column types and non-null counts for a small table?", "df.info()", ["df.head()", "df.tail()", "df.dropna()"], "The summary helps identify types and missingness before inspecting individual rows.", "#exploring-dataframe-information"),
    ("missing-mask", "prep-missing", 1, "What does df.isnull() return?", "A Boolean mask marking missing cells", ["A version of the DataFrame with empty rows removed", "A single total of missing cells", "One default value for each data type"], "The returned mask has one Boolean value for each cell.", "#dealing-with-missing-data"),
    ("duplicate-mask", "prep-duplicates", 2, "Under Pandas defaults, rows 0 and 2 match in every column while row 1 is different. Which row does duplicated() mark as a duplicate?", "Row 2 only", ["Rows 0 and 2", "Row 0 only", "Row 1 only"], "With the default keep='first', the first appearance is retained and a later match is marked.", "#removing-duplicate-data"),
    ("threshold", "prep-missing", 3, "Rows A, B and C have 3, 1 and 2 present values, respectively. Which rows does dropna(thresh=2) keep?", "A and C", ["A only", "B and C", "All three"], "The threshold specifies the minimum number of present values.", "#dealing-with-missing-data"),
    ("forward", "prep-filling", 3, "In chronological order a series contains [missing, 4, missing, 7]. What does forward fill produce?", "[missing, 4, 4, 7]", ["[4, 4, 7, 7]", "[0, 4, 0, 7]", "[missing, 4, 7, 7]"], "Forward fill propagates a previous valid value. The leading entry has no previous value.", "#dealing-with-missing-data"),
    ("dedup-grain", "prep-duplicates", 3, "A log can contain multiple visits from the same customer. Each visit has a unique visit_id and only retries duplicate it. Which field should deduplication use?", "visit_id", ["customer_id, keeping only the earliest visit per person", "amount_paid, keeping one copy of each distinct amount", "visit_date, keeping one visit per day"], "Deduplicating at the visit grain removes retry copies while preserving distinct visits.", "#removing-duplicate-data"),
])

add("a0062ec3693c2d5f7902a84e", "4-Data-Science-Lifecycle/14-Introduction", DATA_SCIENCE,
    "Defining a measurable project, fitting data and methods to the goal, and maintaining usable data throughout the work.", [
    ("capture-purpose", "lifecycle-capture", 1, "What work accompanies data acquisition in the lesson's capture stage?", "Defining the problem and intended result", ["Measuring final model performance on unseen data", "Publishing the team's recommendations", "Archiving the completed project deliverables"], "The team identifies what it needs to answer before choosing what to collect.", "#capturing"),
    ("processing", "lifecycle-modeling", 1, "Which stage in this lesson uses classification, clustering or regression to find patterns and build models?", "Processing", ["Capturing", "Communication", "Maintaining"], "The lesson groups these statistical and modeling methods under processing.", "#processing"),
    ("continuous", "lifecycle-maintenance", 2, "When should the team consider storage, quality and access controls?", "Throughout the project", ["Only once at acquisition", "Only after reporting", "Only when the model stops working"], "The lesson describes maintenance as an ongoing responsibility.", "#maintaining"),
    ("measurable", "lifecycle-capture", 3, "A transit team wants a measurable goal for a queue analysis. Which result can it verify from wait-time observations?", "Reduce median morning wait from eight to six minutes", ["Make the waiting experience better wherever possible", "Investigate the queue and report noteworthy details", "Present a polished summary of the system"], "A numerical target and a defined time window make the result testable.", "#capturing"),
    ("storage", "lifecycle-storage", 3, "A team reads last week's events daily and retrieves old audit logs once a year. Which arrangement follows the lesson's storage tradeoff?", "Keep recent events hot and archive older logs in cold storage", ["Put all records in cold storage to optimize interactive reads", "Keep the annual audit logs hot and use cold storage for daily queries", "Use the same access tier because both sets contain events"], "Frequently queried data benefits from faster access. Rarely accessed records can tolerate slower retrieval.", "#storing-data"),
    ("new-batches", "lifecycle-maintenance", 3, "Earlier observations used Celsius, and a new source sends Fahrenheit. What should the recurring intake do?", "Convert batches to a common unit and check consistency", ["Append both units to the same measurement column without conversion", "Change the displayed unit label while preserving mixed values", "Reconcile units only when preparing the final slideshow"], "Applying the agreed transformation to incoming data preserves comparability.", "#managing-data"),
])

add("ea403329bb64b8f859715117", "4-Data-Science-Lifecycle/15-analyzing", DATA_SCIENCE,
    "Data profiling, random samples, predicate queries and investigating issues before modeling.", [
    ("eda", "eda-purpose", 1, "What is an immediate goal of exploratory data analysis?", "Find patterns and issues in the available data", ["Certify the finished model for production", "Determine the only possible cause of every pattern", "Rewrite every source system before collecting measurements"], "Exploration helps establish whether the available data can support the question.", "#exploratory-data-analysis"),
    ("describe", "eda-profile", 1, "Which Pandas method reports numerical counts, quartiles and the mean by default?", "describe()", ["sample()", "isna()", "query()"], "The descriptive summary reports count, spread and other statistics for numeric columns.", "#data-profiling-descriptive-statistics-and-pandas"),
    ("sample", "eda-selection", 2, "Which operation returns a random set of 20 observations for a quick first inspection?", "df.sample(n=20)", ["df.head(20)", "df.describe()", "df.query('amount > 20')"], "Sampling draws rows, while a predicate limits the result to rows meeting a specified condition.", "#sampling-and-querying"),
    ("profile-count", "eda-profile", 3, "A 50-row numeric DataFrame's describe() output shows count 44 for score. How many entries in score are missing?", "6", ["44", "0", "50"], "The summary's count excludes missing values, so 50 minus 44 are missing.", "#data-profiling-descriptive-statistics-and-pandas"),
    ("focus", "eda-selection", 3, "An analyst needs all rows with amount above 100 to investigate an anomaly. Which approach targets that slice?", "Query rows using amount > 100", ["Randomly sample 100 rows from the complete table", "Sort all rows by amount and leave every row in the result", "Compute the overall mean and use it as a row-level filter result"], "A predicate restricts the result to the relevant condition.", "#sampling-and-querying"),
    ("outage-missing", "eda-issues", 3, "Most missing readings occur while one sensor reports a fault. What should the analyst investigate before choosing a fill rule?", "How the fault interrupts measurement and which periods it affects", ["Whether the missing markers sort before negative values", "How many additional unaffected rows can hide the gap", "Whether drawing the chart without gaps looks cleaner"], "The source of missing values informs whether removal or replacement is appropriate.", "#exploring-to-identify-inconsistencies"),
])

add("9de0e1547939da2bcccf012d", "4-Data-Science-Lifecycle/16-communication", DATA_SCIENCE,
    "Matching the message to the audience, supporting two-way exchange and telling a precise story with evidence.", [
    ("two-way", "story-feedback", 1, "What makes a data briefing two-way?", "Attendees can ask questions and receive responses", ["The analyst sends the same slides twice", "The presenter uses both charts and tables", "Two analysts present without asking for feedback"], "Two-way communication lets each party send and receive information.", "#types-of-communication"),
    ("takeaway", "story-purpose", 1, "What should a presenter identify before building a data story?", "What the audience should take away", ["The exact animation duration of every slide", "The complete order of all source table columns", "Every possible question the audience might ask"], "A clear takeaway helps organize the evidence and message.", "#2-begin-with-the-end-in-mind"),
    ("context", "story-structure", 2, "Which part of a data story establishes the situation before describing the problem?", "Context", ["Climax", "Closure", "Conclusion"], "Context gives listeners the background needed to interpret the evidence.", "#3-approach-it-like-an-actual-story"),
    ("precision", "story-wording", 3, "Which sentence makes the queue finding most concrete?", "Median morning wait rose from 5 to 8 minutes across the two weeks", ["Queues were considerably worse in the most recent period", "Waiting had a noticeable impact on operations", "Morning delay was among the key concerns reported"], "The first sentence gives the measure, comparison, units and timeframe.", "#4-use-meaningful-words--phrases"),
    ("audience-decision", "story-audience", 3, "A manager must decide whether to test a new intake desk. Which briefing best fits that decision?", "Summarize the observed bottleneck, expected benefit and proposed trial", ["Lead with database column names and show every SQL query", "Read the entire dataset aloud in chronological order", "Present trend charts without identifying the decision at hand"], "An audience making a decision needs the significance of the result and relevant next steps.", "#1-understand-your-audience-your-channel--your-communication-method"),
    ("counterevidence", "story-purpose", 3, "A workflow sped up intake but increased rework. The presenter expected an overall improvement. How should the finding be communicated?", "Explain both effects and the uncertainty about overall benefit", ["Show intake time alone because that was the intended takeaway", "Hide the results until the audience endorses the plan", "Use only a quote from the fastest trial"], "A coherent story includes relevant evidence that complicates its initial conclusion.", "#2-begin-with-the-end-in-mind"),
])

add("a2d83fbecfe2497137ad34c8", "5-Data-Science-In-Cloud/17-Introduction", DATA_SCIENCE,
    "Service responsibilities, capacity changes and the roles of storage, integration and compute in a data pipeline.", [
    ("iaas", "cloud-service-models", 1, "A data team rents virtual machines and manages its own analysis software on them. Which service model fits the rented infrastructure?", "Infrastructure as a Service", ["Software as a Service", "A hosted visualization report", "An on-premises server owned by the team"], "The service supplies infrastructure such as virtual machines for the team to use.", "#what-is-the-cloud"),
    ("saas", "cloud-service-models", 1, "A team uses a finished reporting application through its browser. The vendor hosts and maintains it. Which service model is this?", "Software as a Service", ["Infrastructure as a Service", "Platform as a Service", "Self-managed infrastructure"], "The team consumes a ready-to-use application with the vendor operating its software and infrastructure.", "#what-is-the-cloud"),
    ("scalability", "cloud-capacity", 2, "Which cloud characteristic describes increasing processing resources during a busy period and reducing them afterward?", "Scalability", ["Data integration", "File retention", "Data labeling"], "Resources can be adjusted to changing demand.", "#why-choose-the-cloud-for-data-science"),
    ("integration", "cloud-pipeline", 3, "A retailer receives weekly exports from three systems. It needs to collect, standardize and combine them into one warehouse. Which task is that?", "Data integration", ["Visualizing only the final aggregate", "Running model inference on a single new record", "Choosing an application maintenance window"], "The integration stage brings source data together in a usable format for later analysis.", "#why-choose-the-cloud-for-data-science"),
    ("worker-capacity", "cloud-capacity", 3, "An archive has 400 independent report files to process. Which part of the paper-analysis example addresses throughput?", "Parallel processing across workers", ["Keeping all processing in the dashboard viewer", "Combining unprocessed results into one large chart", "Changing the query labels in the storage layer"], "Independent work can be distributed before the outputs are stored and explored.", "#scientific-papers-analysis"),
    ("stream-sink", "cloud-pipeline", 3, "A stream job computes counts from incoming messages. What role does its output sink play?", "Receives the processed counts", ["Produces the original incoming messages", "Defines the categories used to label historical training data", "Selects the VM size for every worker"], "The sink is where the job sends results after processing its input.", "#real-time-social-media-sentiment-analysis"),
])

add("c5989308d51c40fa4397c350", "5-Data-Science-In-Cloud/18-Low-Code", DATA_SCIENCE,
    "Reading the historical visual AutoML workflow: workspace, compute, training target, candidate review and inference. Examples use fictional non-medical labels.", [
    ("workspace", "cloud-workspace", 1, "What organizes datasets, experiments and compute in the lesson's project?", "The workspace", ["A single prediction response", "The label column", "The trained model's score"], "The workspace holds the assets needed for the workflow.", "#21-create-an-azure-ml-workspace"),
    ("training-compute", "cloud-compute-role", 1, "Which role does the lesson assign to a scalable compute cluster?", "Run training experiments", ["Name the prediction target", "Store an individual HTTP response", "Provide the final chart legend"], "The cluster supplies processing resources for experiment code.", "#22-compute-resources"),
    ("automation", "cloud-automl", 2, "What does AutoML automate in the training portion of this example?", "Trying and comparing candidate model runs", ["Deciding the project's business goal", "Removing the need for a label in supervised learning", "Replacing every candidate result with the deployment status"], "It runs iterative model development tasks after the team provides data and a task.", "#24-low-codeno-code-training-with-automl"),
    ("classification-target", "cloud-training-task", 3, "A fictional inspection table has measurements and a column named result with values pass or fail. What task and target fit the lesson's training form?", "Classification with result as the target", ["Regression with result as a numeric target", "Classification with the machine identifier as the target", "Forecasting with no target column"], "The desired prediction is a category stored in result.", "#24-low-codeno-code-training-with-automl"),
    ("candidate-review", "cloud-automl", 3, "After training produces several candidates, what should the team examine before choosing a model to serve?", "The run details and candidate results", ["Only whether the dataset uploaded successfully", "Only the alphabetic order of model names", "The endpoint status before any candidate has been deployed"], "The lesson separates inspecting and selecting a model from deploying it.", "#24-low-codeno-code-training-with-automl"),
    ("score-new", "cloud-inference", 3, "The chosen model is available as a prediction service. What does an application send for a new inspection?", "New feature values in the expected request format", ["The known target answer as a substitute for measurements", "All past training logs and model comparison charts", "The desired final accuracy instead of the observation"], "A scoring endpoint applies the trained model to supplied inputs.", "#32-endpoint-consumption"),
])

add("b599236b084e1d3583f503b7", "5-Data-Science-In-Cloud/19-Azure", DATA_SCIENCE,
    "Reading the historical SDK example: experiment configuration, the fitted artifact, and the model, scoring script and environment in deployment.", [
    ("training-target", "sdk-task-config", 1, "What does label_column_name identify in the lesson's experiment configuration?", "The column the model is trained to predict", ["The stored scoring script's name", "The compute cluster name", "The main evaluation metric"], "The label column holds the target for supervised training.", "#252-automl-configuration-and-training"),
    ("compute-target", "sdk-compute-config", 1, "What does compute_target designate in the historical configuration?", "Where the experiment runs", ["The feature selected for the x-axis", "The predicted category", "The amount of labeled data in a row"], "The compute target is the processing environment for the training job.", "#252-automl-configuration-and-training"),
    ("saved-run", "sdk-artifacts", 2, "What pair does get_output() retrieve in the lesson after the AutoML run?", "The best run and its fitted model", ["The raw dataset and the selected column names", "The endpoint address and its authentication setting", "The workspace name and billing account"], "The selected run has both execution details and the trained model artifact.", "#31-saving-the-best-model"),
    ("metric-choice", "sdk-task-config", 3, "A team wants candidate runs compared using its chosen evaluation measure. Which experiment setting expresses that preference?", "primary_metric", ["experiment_timeout_minutes", "max_concurrent_iterations", "label_column_name"], "The metric configures the optimization criterion, while the other settings govern time, concurrency or the target.", "#252-automl-configuration-and-training"),
    ("serving-assets", "sdk-serving", 3, "A saved model needs a custom preprocessing step when it receives new records. Besides the model artifact, which deployment assets matter in the example?", "The scoring script and its runtime environment", ["The spreadsheet listing the analysts' names", "The date the workspace was first created", "The chart colors from the training report"], "The entry script and dependencies determine how the model loads and handles prediction inputs.", "#32-model-deployment"),
    ("train-vs-score", "sdk-serving", 3, "A client submits an observation to the endpoint built from a fitted artifact. What work is the endpoint meant to perform?", "Return a prediction from the fitted model", ["Repeat the full AutoML search for each request", "Rewrite the original training target in storage", "Choose a new compute cluster by comparing candidate metrics"], "Serving a trained model is the inference stage of the demonstrated workflow.", "#33-endpoint-consumption"),
])

add("bb18a0136e645102f6afe82f", "6-Data-Science-In-Wild/20-Real-World-Examples", DATA_SCIENCE,
    "Recognizing application goals across operations, research, digital humanities and sustainability without treating historical results as current benchmarks.", [
    ("routing", "ds-industry", 1, "Which task fits the logistics use case described in the lesson?", "Choosing better delivery routes", ["Transcribing poems from handwritten scans", "Mapping species in a wetland", "Auditing a classifier for demographic disparities"], "The industry examples include using data to help plan deliveries.", "#data-science--industry"),
    ("humanities", "ds-humanities", 1, "Which approach illustrates digital humanities?", "Using text analysis to investigate historical letters", ["Choosing a GPU for a larger vision model", "Monitoring worker queues in a deployment", "Predicting parcel travel time"], "Digital humanities combines computational methods with a humanistic question.", "#data-science--humanities"),
    ("deployment-study", "ds-research", 2, "Which research goal fits the lesson's discussion of deployment challenges?", "Investigate who receives systematically worse results", ["Estimate how many servers to rent next month", "Refresh a dashboard's presentation styling", "Publish a changelog for a completed migration"], "Studying actual deployment can reveal unintended consequences and harms.", "#data-science--research"),
    ("prototype", "ds-research", 3, "A research group builds an early interface to see if users can explore maps in a new way. Which research purpose does this example illustrate?", "Prototyping an innovation and evaluating the experience", ["Measuring real-world harms from an already deployed system", "Publishing a final production service-level report", "Replicating a release without evaluating users"], "The lesson treats rapid prototypes and user experience testing as research into new possibilities.", "#data-science--research"),
    ("network-letters", "ds-humanities", 3, "Historians want to see which groups exchanged letters with one another. Which technique listed in the lesson best represents those ties?", "Network analysis of senders and recipients", ["Histogram of letter lengths", "Forecasting next year's number of archived letters", "Text frequency analysis with sender and recipient identities removed"], "A network expresses the relationships between correspondents as connections.", "#data-science--humanities"),
    ("map-observations", "ds-sustainability", 3, "A conservation team wants to locate areas that have lost vegetation cover over time. Which data approach fits the environmental use cases?", "Compare spatial observations of cover across dates", ["Average the entire region to a single value and drop locations", "Measure change only from the latest image", "Use the size of each image file as a proxy for vegetation"], "Spatial observations tied to time can reveal where the monitored change occurred.", "#data-science--sustainability"),
])

guide("59b7323b3873b9631e9b3e57", "1-Introduction", DATA_SCIENCE,
      "This module index introduces the four subjects and links to their teaching pages.",
      ["27d4e7f2501e411d385f5a88", "993db9cab0553748c936a092", "009c0a5726487f0e2b0d295f", "acdab68f5b66b329d778b49b"])
guide("1fcef905924496d4b2d1d551", "2-Working-With-Data", DATA_SCIENCE,
      "This topic list points to database, Python and preparation lessons with their own worked examples.",
      ["0ad4c1aac9788e7c692ef68b", "84473a87643db1c9873ef626", "c9b51ac25661fe54207ddcd9", "5b6039faba757e4d6dc1be12"])
guide("467e0d973c5c657c57833c4d", "4-Data-Science-Lifecycle", DATA_SCIENCE,
      "This short overview links to the separate lifecycle, analysis and communication lessons.",
      ["a0062ec3693c2d5f7902a84e", "ea403329bb64b8f859715117", "9de0e1547939da2bcccf012d"])
guide("0ec911c91765a7198cf26408", "5-Data-Science-In-Cloud", DATA_SCIENCE,
      "This overview provides project context and a topic list. The linked pages explain service roles and walk through the historical workflows.",
      ["a2d83fbecfe2497137ad34c8", "c5989308d51c40fa4397c350", "b599236b084e1d3583f503b7"])
guide("21035d5c49c6d63d09a4bf84", "6-Data-Science-In-Wild", DATA_SCIENCE,
      "This index has a one-line introduction and links to the case-study lesson.",
      ["bb18a0136e645102f6afe82f"])

add("36542555913dc6f317da49c8", "3-Data-Visualization/09-visualization-quantities", VISUALIZATION,
    "Using Python to inspect quantities, label unusual observations and compare category counts with horizontal bars.", [
    ("axis-selection", "py-quantities-encoding", 1, "A plot compares maximum leaf length across sample names. Which field supplies the vertical numeric values?", "Maximum leaf length", ["Sample name", "The number of axis labels", "The chart title"], "The measurement supplies y, while names identify the observations on x.", "#build-a-line-plot-about-bird-wingspan-values"),
    ("category-bars", "py-quantities-grouping", 1, "Which chart makes counts across a list of named categories easy to compare?", "A bar chart", ["A connected line in the file's original row order", "A density curve of the category names", "A scatterplot using the row number as the only measurement"], "Each bar can represent the count for one category.", "#explore-bar-charts"),
    ("spot-anomaly", "py-quantities-inspection", 2, "What can the initial plot help an analyst notice before cleaning the table?", "An unexpectedly extreme measurement", ["The original reason a data entry error occurred", "Whether the entire sample represents every population", "The correct value of an unverified measurement"], "An unusually distant point identifies a record worth checking.", "#build-a-line-plot-about-bird-wingspan-values"),
    ("labels-threshold", "py-quantities-encoding", 3, "An analyst wants to plot every reading but label only values strictly above 40. With readings 17, 40, 43 and 49, which points get labels?", "43 and 49", ["40, 43 and 49", "17 and 40", "49 only"], "The label condition applies only to values greater than 40. It does not filter the plotted points.", "#build-a-line-plot-about-bird-wingspan-values"),
    ("counts", "py-quantities-grouping", 3, "A record list has categories Rock, Moss, Rock, Sand and Rock. What horizontal bar widths should a chart of category counts use?", "Rock 3, Moss 1, Sand 1", ["Rock 3, Moss 2, Sand 1", "Rock 1, Moss 1, Sand 1", "Rock 5, Moss 1, Sand 1"], "Count observations by category before passing one value per category to a bar chart.", "#explore-bar-charts"),
    ("filter-verified", "py-quantities-inspection", 3, "Two records are confirmed unit-entry errors. You want a readable view of valid values without losing the original evidence. What approach fits the filtering exercise?", "Plot a filtered view and document the excluded records", ["Silently overwrite the original values with the median", "Remove the tallest valid reading to match the other bars", "Keep the errors and change only the unit in the axis title"], "Filtering a view isolates verified anomalies while retaining the source for review.", "#filter-your-data"),
])

add("55ab89f1e92450b866684121", "3-Data-Visualization/R/09-visualization-quantities", VISUALIZATION,
    "ggplot2 data, aesthetics and geometry, filtering and the use of precomputed category summaries.", [
    ("aes-mapping", "r-quantities-encoding", 1, "In ggplot(data=tbl, aes(x=sample, y=width)), what does aes() specify?", "How columns map to the plot's coordinates", ["How many rows to read from the source file", "Which theme names will be installed", "The aggregation applied to every column"], "An aesthetic maps a data variable to a visual property such as x or y.", "#observe-wingspan-with-ggplot2"),
    ("geometry", "r-quantities-geometry", 1, "Which geometry from the lesson draws an individual mark for each observation?", "geom_point()", ["geom_line()", "geom_text()", "coord_flip()"], "The point geometry draws the observations as separate marks.", "#build-a-line-plot-about-bird-wingspan-values"),
    ("flip", "r-quantities-layout", 2, "What does coord_flip() do to the lesson's otherwise vertical bars?", "Displays the bars horizontally", ["Sorts the data in descending frequency order", "Changes the group count to a percentage", "Replaces the bar chart with a point chart"], "The coordinate transformation swaps the displayed directions without changing the counts.", "#explore-bar-charts"),
    ("strict-subset", "r-quantities-filter", 3, "An R subset uses width < 50. The readings are 38, 50, 62 and 44. Which values remain?", "38 and 44", ["38, 50 and 44", "50 and 62", "38, 62 and 44"], "The strict comparison excludes 50 as well as larger values.", "#filter-your-data"),
    ("identity-height", "r-quantities-aggregation", 3, "A summary already has one row per category and n is the observed count. Which plot uses n directly for bar height in the lesson's approach?", "ggplot(counts, aes(category, n)) + geom_bar(stat='identity')", ["ggplot(counts, aes(category)) + geom_bar()", "ggplot(counts, aes(n)) + geom_histogram()", "ggplot(counts, aes(category, n)) + geom_point()"], "The identity statistic takes the supplied heights. Default geom_bar would count summary rows instead.", "#explore-bar-charts"),
    ("category-max", "r-quantities-aggregation", 3, "The lesson groups measurements by category and applies max() to an upper-length column. If group A has upper lengths 12, 15 and 11, what height represents A?", "15", ["12.67", "38", "3"], "The largest of the three upper measurements becomes the group's summary.", "#comparing-data"),
])

add("aedd432f9b1ab8a2e1192fa2", "3-Data-Visualization/10-visualization-distributions", VISUALIZATION,
    "Numeric histogram bins, filtered views, two-dimensional binning and the effect of KDE smoothing.", [
    ("bin-meaning", "py-distribution-bins", 1, "What does a bin in a histogram of delivery times represent?", "An interval of delivery times", ["A single order ID", "A category of shipping providers", "A fitted prediction for each shipment"], "The chart counts observations in numerical intervals.", "#working-with-histograms"),
    ("hist-axes", "py-distribution-bins", 1, "What is displayed by a count histogram of numeric weights?", "Intervals on x and their counts on y", ["The row order on x and the raw weight on y", "Category names on x and overall percentages on y", "Weights on both axes with color by row"], "The horizontal scale is the measured variable and the vertical scale is frequency.", "#working-with-histograms"),
    ("smooth-density", "py-distribution-smoothing", 2, "Which operation from the lesson produces a smooth estimate of a numeric distribution?", "sns.kdeplot(values)", ["values.plot(kind='hist', bins=10)", "ax.hist2d(x, y)", "values.value_counts()"], "A kernel density estimate uses smooth kernels rather than stepped bars.", "#density-plots"),
    ("bin-counts", "py-distribution-bins", 3, "Times in minutes are 1, 2, 4, 8 and 9. Using bins [0, 5) and [5, 10], what counts are shown?", "3 and 2", ["2 and 3", "4 and 1", "5 and 0"], "The first interval contains 1, 2 and 4. The second contains 8 and 9.", "#working-with-histograms"),
    ("grid-cell", "py-distribution-joint", 3, "A two-dimensional count histogram bins package width and weight. What does the color of one cell encode?", "How many observations fall in that pair of intervals", ["The average row ID among packages in the cell", "The marginal count for width summed across all weights", "The fitted slope of width against weight within the cell"], "A two-dimensional histogram counts observations satisfying both bin boundaries.", "#working-with-histograms"),
    ("bandwidth", "py-distribution-smoothing", 3, "A density curve looks very smooth. You lower bw_adjust while keeping the observations fixed. Which change should you expect?", "Less smoothing and more visible local variation", ["More smoothing and a broader kernel for each observation", "More observations because the sample has been duplicated", "A switch from density to raw counts per bin"], "Smaller bandwidth reduces smoothing and can reveal real detail or noise.", "#density-plots"),
])

add("8097fd9e97b247dce8439234", "3-Data-Visualization/R/10-visualization-distributions", VISUALIZATION,
    "ggplot2 count histograms and joint bins, grouping a numeric distribution by a category, and smoothing with geom_density.", [
    ("hist-geometry", "r-distribution-bins", 1, "Which geometry from this R lesson displays counts over intervals of a numeric x variable?", "geom_histogram()", ["geom_point()", "geom_line()", "geom_density()"], "The histogram geometry bins the continuous variable and counts observations per bin.", "#working-with-histograms"),
    ("joint-geometry", "r-distribution-joint", 1, "Which geometry bins x and y together into a count grid?", "geom_bin2d()", ["geom_histogram() with one x variable", "geom_point()", "geom_density() with one x variable"], "The grid preserves joint bin membership for both variables.", "#working-with-histograms"),
    ("density-geometry", "r-distribution-smoothing", 2, "A team wants a smooth distribution of particle sizes. Which geometry does this R lesson use?", "geom_density()", ["geom_bar(stat='identity')", "geom_histogram(bins=10)", "geom_bin2d()"], "The density geometry estimates a smooth curve over the numeric variable.", "#density-plots"),
    ("subset-coverage", "r-distribution-filter", 3, "An analyst plots only sizes with size > 1 and size < 60. What should the caption say about the histogram?", "It represents the filtered sample within those limits", ["It estimates the frequency of values outside those limits", "It represents every observation because geom_histogram restores them", "It displays exactly 59 observations because the interval width is 59"], "Filtering changes which observations contribute to the distribution.", "#working-with-histograms"),
    ("group-fill", "r-distribution-grouping", 3, "To overlay distributions of numeric delay by site, where do delay and site go in aes() as in this lesson?", "x=delay and fill=site", ["x=site and fill=delay", "x=delay and y=site with no grouping", "x=site and y=site"], "Delay supplies the numeric bins, while site identifies the groups by fill.", "#explore-the-dataset-for-distributions-using-text-data"),
    ("density-adjust", "r-distribution-smoothing", 3, "For the same measurements, changing geom_density(adjust=1) to adjust=0.2 has what effect?", "The smoothing bandwidth becomes smaller", ["The number of observations is divided by five", "The y-axis changes from density to category count", "The plot filters observations with values above 0.2"], "The parameter scales the bandwidth and leaves the underlying observations in place.", "#density-plots"),
])

add("77cfa91e79657e8c0c1eb0fc", "3-Data-Visualization/11-visualization-proportions", VISUALIZATION,
    "Preparing category counts, preserving label order and displaying part-to-whole shares with pie, donut and waffle charts in Python.", [
    ("pie-whole", "py-shares-part-whole", 1, "In a pie of ticket statuses, what does one wedge represent?", "One status's share of all included tickets", ["The mean waiting time for one status", "A raw observation plotted by its arrival time", "The change in total tickets between dates"], "A wedge's angle represents one group's fraction of the included whole.", "#pie"),
    ("donut", "py-shares-geometry", 1, "Which change does the lesson use to turn a pie into a donut?", "Overlay a circle at the center", ["Rotate the labels 90 degrees", "Connect the category values with a line", "Normalize each category separately"], "A center circle creates the hole while the outer wedges retain their shares.", "#donuts"),
    ("percent-label", "py-shares-labels", 2, "Which Matplotlib pie argument in the lesson supplies formatted percentage labels?", "autopct", ["pctdistance", "labels", "figsize"], "autopct controls how each percentage is formatted, while pctdistance changes its placement.", "#pie"),
    ("matched-order", "py-shares-labels", 3, "The counts are in the order Pending, Done, Deferred. A manually written label list is Done, Pending, Deferred. What should be fixed?", "Reorder labels to match the count sequence", ["Sort just the counts from largest to smallest", "Reorder labels alphabetically regardless of the data", "Remove the smallest category so the first two labels align"], "Each wedge must carry the label for the count at the same position.", "#pie"),
    ("share-calculation", "py-shares-part-whole", 3, "Three categories contain 9, 6 and 15 records. What percentage label belongs to the first category?", "30%", ["9%", "37.5%", "60%"], "The first count is 9 out of the total 30.", "#pie"),
    ("waffle-scale", "py-shares-geometry", 3, "A waffle has 100 cells and a category represents 24 of 120 records. How many cells should represent that category if the scale is exact?", "20", ["24", "29", "5"], "The category has a one-fifth share, so it occupies one-fifth of the grid.", "#waffles"),
])

add("1247afec55e65feff5947891", "3-Data-Visualization/R/11-visualization-proportions", VISUALIZATION,
    "Summarizing R category counts and retaining names and proportions when mapping them to pie, donut and waffle marks.", [
    ("group-summary", "r-shares-counting", 1, "After group_by(status), what does summarise(count=n()) produce?", "One record count per status", ["One mean per row", "An alphabetical list with no counts", "A separate count for each original column"], "n() counts the rows present in each group.", "#get-to-know-your-mushrooms-"),
    ("pie-sizes", "r-shares-part-whole", 1, "In pie(grouped$count, grouped$status), which input supplies the wedge sizes?", "grouped$count", ["grouped$status", "The number of columns in grouped", "The alphabetical position of each status"], "The first vector supplies the values used to calculate wedge shares.", "#pie"),
    ("named-waffle", "r-shares-labels", 2, "Why assign category names to the count vector before drawing the waffle example?", "So each grid group can retain its category label", ["So the counts automatically become their ranks", "So the chart creates an observation for each name", "So categories with equal counts merge into one color"], "Names associate the values passed to the plot with their categories.", "#waffles"),
    ("pie-angle", "r-shares-part-whole", 3, "A group count is 12 out of 40 total records. What angle does its share occupy in an exact pie?", "108 degrees", ["30 degrees", "120 degrees", "144 degrees"], "The group occupies 12/40 of a full 360-degree circle.", "#pie"),
    ("scaled-counts", "r-shares-counting", 3, "A waffle represents counts 30, 60 and 90 with 1 square per 10 records. How many squares go to the three groups?", "3, 6 and 9", ["30, 60 and 90", "1, 2 and 3", "6, 12 and 18"], "A common factor of ten reduces the grid size and preserves the groups' relative shares.", "#waffles"),
    ("label-consistency", "r-shares-labels", 3, "The summary rows were sorted by descending count. Which label vector keeps the legend aligned with the new value order?", "The status column from that same sorted summary", ["The status column from the unsorted summary", "The list of statuses sorted alphabetically by itself", "The list of all original status observations"], "Pair values and labels from the same ordered records.", "#pie"),
])

add("b9e1b048dcb1f2c56801144a", "3-Data-Visualization/12-visualization-relationships", VISUALIZATION,
    "Seaborn variable roles, line summaries, facets and separate scales for distinct measures.", [
    ("hue", "py-relation-encoding", 1, "What visual property changes with the variable assigned to hue in this scatterplot example?", "Point color", ["Point x coordinate", "Panel title", "Line thickness"], "A color mapping provides another way to distinguish observations while retaining x and y.", "#scatterplots"),
    ("kind", "py-relation-time", 1, "Which relplot setting does the lesson use to show a trend across years as a line?", "kind='line'", ["hue='line'", "style='line'", "col='line'"], "kind selects the plot form; the other parameters map variables to visual roles.", "#line-charts"),
    ("facet-variable", "py-relation-facets", 2, "What does col='year' do in the lesson's faceted relplot?", "Draws a separate panel for each year", ["Changes the x-axis to year in every panel", "Combines all years into one average year", "Changes only the legend title"], "Each panel shows the rows from one level of the faceting variable.", "#facet-grids"),
    ("line-aggregate", "py-relation-time", 3, "At one x value, three observations of a single group have y values 2, 5 and 8. Where is the default mean line centered at that x?", "5", ["15", "2", "8"], "The example aggregates repeated measurements at an x value by their mean.", "#line-charts"),
    ("size-year", "py-relation-encoding", 3, "A chart uses x=cost, y=branch and size=year. If a marker is larger, what variable should the reader use the size legend to interpret?", "Year", ["Cost", "Branch order", "The total count of rows at that x value"], "The size mapping depends on the named variable even when cost also changes across time.", "#scatterplots"),
    ("twin-scales", "py-relation-dual-scale", 3, "One curve tracks units sold and another tracks minutes per order across the same weeks. What does ax.twinx() add in the lesson's approach?", "A second y scale with the same x axis", ["A second x scale with the same y axis", "A common numeric y scale after converting minutes to units", "An independent chart with no alignment in x"], "The time positions are shared while each y variable keeps its own scale and label.", "#dual-line-plots"),
])

add("2b797a4603316f7bed637de5", "3-Data-Visualization/R/12-visualization-relationships", VISUALIZATION,
    "Mapping continuous color and size in ggplot2, reading a fitted trend and comparing subsets with facet_wrap.", [
    ("point-map", "r-relation-encoding", 1, "In aes(x=price, y=site, color=year), which column controls the colors of points?", "year", ["site", "price", "The row count"], "The color aesthetic maps the year variable while x and y map the positions.", "#scatterplots"),
    ("size-legend", "r-relation-encoding", 1, "Which aesthetic does the lesson change to show another variable through larger or smaller points?", "size", ["group", "x", "y"], "The size aesthetic maps a variable to marker size.", "#scatterplots"),
    ("smooth-trend", "r-relation-trend", 2, "What does the smoothed curve in the lesson's R time plot summarize?", "The fitted trend across years", ["The exact sequence of every original observation in file order", "A count of records for each value on the y-axis", "One categorical color level for each year"], "A fitted smooth describes the relationship while allowing variation around it.", "#line-charts"),
    ("facet-count", "r-relation-facets", 3, "A table contains four observed seasons. How many panels does facet_wrap(vars(season)) create for the same measurement mapping?", "4", ["1", "2", "One per row, regardless of season"], "Each observed level of the faceting variable gets a panel.", "#facet-grids"),
    ("faceted-compare", "r-relation-facets", 3, "An analyst wants to compare speed versus output within each machine type without mixing types in one panel. Which code fits the lesson's layout?", "ggplot(tbl, aes(speed, output)) + geom_point() + facet_wrap(vars(type))", ["ggplot(tbl, aes(speed, output)) + geom_point()", "ggplot(tbl, aes(type, output)) + geom_point()", "ggplot(tbl, aes(speed, output, color=type)) + geom_point()"], "Faceting keeps the measurement mappings and separates the observations into panels by type.", "#facet-grids"),
    ("units-second-axis", "r-relation-dual-scale", 3, "An overlaid plot uses a second y scale for yield. What should its second axis label describe?", "Yield and its own unit", ["The units of the first y-axis again", "The order in which points were loaded", "The values of the shared x-axis"], "Separate vertical scales need clear labels so the curves are not read using the wrong units.", "#dual-line-plots"),
])

add("a0f8e58d4753682edd5c341b", "3-Data-Visualization/13-meaningful-visualizations", VISUALIZATION,
    "Chart choice, truthful scales, readable labels and the role of a network view for connected records.", [
    ("long-labels", "py-chart-readability", 1, "Why might a chart place many long place names on its vertical axis?", "To make the labels readable without excessive horizontal space", ["To make every measured amount larger", "To change the ranking of places automatically", "To remove the need for measurement units"], "Orientation can provide usable space for category names.", "#styling-your-charts-for-readability"),
    ("axis-direction", "py-chart-honesty", 1, "Which design choice can cause an increasing series to look as though it falls from left to right?", "Present the dates from newest to oldest", ["Add a title naming the series", "Keep the dates increasing and label their units", "Show a legend describing the color"], "Direction matters because readers commonly interpret time as increasing from left to right.", "#avoid-deception"),
    ("network-data", "py-chart-network", 2, "What relationship is the animated network project intended to show?", "Connections between entities", ["Only a frequency distribution of one number", "The missing-value count for each table column", "The unweighted average of all label lengths"], "Network nodes represent entities and links represent their relationships.", "#project-build-a-chart-to-show-a-network-using-d3js"),
    ("bar-task", "py-chart-choice", 3, "A report compares current incident counts across five named teams. Which chart type supports a direct comparison of these quantities?", "Bars with one value per team", ["A time line connecting the teams in alphabetical order", "A histogram treating team labels as numeric intervals", "A network chart with an edge between every pair of teams"], "Bars show each team's count on the same scale.", "#choose-the-right-chart-type"),
    ("color-access", "py-chart-color", 3, "Two lines differ only by red and green. A reader cannot reliably distinguish the colors. Which change best preserves the groups?", "Use distinct line styles and retain clear labels", ["Increase both lines' saturation while leaving them the same style", "Remove the legend because the lines are close together", "Add a third line with a similar shade"], "A non-color cue preserves the distinction for readers who cannot use the colors.", "#color"),
    ("units", "py-chart-readability", 3, "A plot's y-axis says Distance but readers can't tell whether values are meters or kilometers. Which edit resolves that ambiguity?", "Label the y-axis with the actual unit", ["Widen the chart without changing the text", "Round every value to the nearest integer", "Use a darker color for high values"], "Units make the reported amounts interpretable.", "#styling-your-charts-for-readability"),
])

add("e3b30b99d28cfb42530d10b4", "3-Data-Visualization/R/13-meaningful-vizualizations", VISUALIZATION,
    "Choosing representations, preserving chart direction and ensuring legends and labels explain the data.", [
    ("legend-role", "r-chart-readability", 1, "What should the legend explain when color identifies delivery methods?", "Which color corresponds to each method", ["How the data source was authenticated", "The chart's width in pixels", "How to recalculate every recorded amount"], "Readers need a mapping from visual encodings to the categories they mean.", "#styling-your-charts-for-readability"),
    ("order-read", "r-chart-honesty", 1, "What should a reader inspect before interpreting direction in a line chart?", "The order and values on the axes", ["The file's compression ratio", "The total number of presentation slides", "The order of colors in the software theme menu"], "Axis ordering can reverse the visual impression of the underlying change.", "#avoid-deception"),
    ("shape-purpose", "r-chart-choice", 2, "What should determine the type of chart?", "The data's structure and the question the chart answers", ["The plotting package's first gallery example", "The chart that permits the most animations", "The number of words in the figure's title"], "A chart type should support the comparison or relationship the audience needs to see.", "#choose-the-right-chart-type"),
    ("reversed-range", "r-chart-honesty", 3, "Monthly measurements rise from 20 to 35, yet the line slopes downward because the y-axis is inverted. Which edit makes the increase easier to read in an ordinary trend chart?", "Use a y-axis whose values increase upward", ["Change the line color but keep the inverted scale", "Remove all tick labels from the inverted axis", "Reverse the chronological order as well"], "An increasing vertical scale aligns visual height with larger measured values.", "#avoid-deception"),
    ("many-categories", "r-chart-readability", 3, "A report has 18 long category names and needs a static figure that fits a narrow page. Which change helps preserve all labels?", "Use horizontal bars and give the labels vertical space", ["Keep vertical bars and omit every other label", "Assign every category a similar color and remove its name", "Keep an unreadably wide layout and shrink it to page width"], "Putting the categories along the vertical axis gives long names room without wide scrolling.", "#styling-your-charts-for-readability"),
    ("category-distinction", "r-chart-color", 3, "A chart uses two similar colors for different inventory categories. What revision helps readers who cannot distinguish the shades?", "Add a distinguishable pattern or direct category label", ["Use the same two shades with finer grid lines", "Remove the category mapping and retain only the colors", "Add more decimal places to the counts"], "Patterns or labels preserve the category meaning when color differences are hard to see.", "#color"),
])

add("voidfill-visualization-0", "https://matplotlib.org/stable/users/getting_started/", VISUALIZATION,
    "Reading and adapting the first Matplotlib line plot: paired data, the figure and axes, drawing and displaying.", [
    ("subplot-objects", "mpl-first-objects", 1, "In the first plot example, what are fig and ax returned by plt.subplots()?", "The figure and one axes", ["The x and y data arrays", "Two independent figures", "The plot title and x-axis label"], "The figure contains the plotting area represented by the axes.", "#draw-a-first-plot"),
    ("draw-line", "mpl-first-draw", 1, "Which call in the example adds the line to its axes?", "ax.plot(x, y)", ["plt.subplots()", "np.sin(x)", "plt.show()"], "The plot call adds a line from the paired coordinates.", "#draw-a-first-plot"),
    ("show-figure", "mpl-first-display", 2, "Which call in the documented script asks Matplotlib to display the figure?", "plt.show()", ["plt.subplots()", "np.linspace()", "ax.plot(x, y)"], "The example calls show after adding data to the axes.", "#draw-a-first-plot"),
    ("coordinate-pair", "mpl-first-data", 3, "You adapt the example to x=[0, 2, 4] and y=[3, 1, 7]. Which coordinate is the second point on the line?", "(2, 1)", ["(1, 2)", "(2, 7)", "(4, 1)"], "The second x value pairs with the second y value.", "#draw-a-first-plot"),
    ("line-substitution", "mpl-first-data", 3, "You want to keep the existing horizontal positions but display different measurements. Which part of ax.plot(x, y) changes?", "The y values", ["The x values alone", "The call to plt.show()", "The variable name for the figure"], "The first argument supplies x positions and the second supplies their measured values.", "#draw-a-first-plot"),
    ("empty-axes", "mpl-first-draw", 3, "A script creates fig, ax, calculates x and y and calls plt.show(), but there is no data line. Which omitted step would add it?", "Call ax.plot with the two arrays before showing the figure", ["Recalculate x and y after showing the figure", "Create another empty figure with plt.subplots()", "Replace the axes with the numeric array"], "Calculating the coordinates does not add a line to the figure. The axes plot call does.", "#draw-a-first-plot"),
])

add("voidfill-visualization-1", "https://seaborn.pydata.org/tutorial/introduction.html", VISUALIZATION,
    "Seaborn's variable mappings and choices among relationship, distribution and multivariate summaries.", [
    ("facet-role", "sns-mapping", 1, "In a relplot call, what does assigning region to col do?", "Creates a panel for each region", ["Uses region as the y measurement", "Replaces the dataset with region labels", "Changes the value of the plot's width"], "The col parameter facets the data across panels based on a variable.", ""),
    ("hist-family", "sns-distributions", 1, "Which function family in the introduction includes histograms and empirical cumulative distribution plots?", "displot()", ["relplot()", "lmplot()", "catplot()"], "displot groups several approaches to showing a distribution.", "#distributional-representations"),
    ("theme-scope", "sns-customization", 2, "What can set_theme() change in the introduction's example?", "Matplotlib-wide plot appearance settings", ["The raw values in the DataFrame", "The unit conversions in all numeric columns", "The aggregation weights of future reports"], "Seaborn themes use Matplotlib's configuration and can affect subsequent Matplotlib plots.", ""),
    ("paired-overview", "sns-multivariate", 3, "An analyst has several numeric variables and wants an overview of every pair and each marginal distribution. Which function is most suitable?", "pairplot()", ["jointplot() for a single pair", "relplot(kind='line') for a time trend", "catplot(kind='bar') for category estimates"], "pairplot provides a matrix of pairwise relationships and individual distributions.", "#multivariate-views-on-complex-datasets"),
    ("kind-time", "sns-mapping", 3, "You want a connected time trend with the same grouping roles as a relplot scatterplot. What can you change without rewriting the variable mapping?", "Set kind='line'", ["Set x='line'", "Set hue='line'", "Replace the group column with a constant"], "The plot form changes while the named x, y and grouping variables remain available.", "#a-high-level-api-for-statistical-graphics"),
    ("estimated-band", "sns-estimation", 3, "A default line plot summarizes repeated readings at a timepoint and draws an interval around its estimate. What does the interval convey in the lesson's example?", "Uncertainty around the estimated mean", ["The full range of every possible reading", "The interval between consecutive x-axis ticks", "How many rows were removed during data cleaning"], "The example uses confidence intervals around its estimated values.", "#statistical-estimation"),
])

guide("6f2bb4eb8760256dfae8fc0f", "3-Data-Visualization", VISUALIZATION,
      "This module index describes the goals and sources and links to the worked visualization lessons. Some of its R links are empty, so only its actual catalogue links are listed.",
      ["36542555913dc6f317da49c8", "55ab89f1e92450b866684121", "aedd432f9b1ab8a2e1192fa2", "8097fd9e97b247dce8439234", "77cfa91e79657e8c0c1eb0fc", "b9e1b048dcb1f2c56801144a", "a0f8e58d4753682edd5c341b"])
guide("03f16408cfdc2cd68cadc2ff", "3-Data-Visualization/13-meaningful-visualizations/starter", VISUALIZATION,
      "This starter README lists dependency setup, development, build and lint commands. The chart-design teaching is on the parent lesson page.",
      ["a0f8e58d4753682edd5c341b"], "setup-guide")


def source_finding(resource_id, section, detail, warning, references, severity="error"):
    resource = next(row for row in [*BANKS, *ORIENTATIONS] if resource_id in row["resource_ids"])
    SOURCE_FINDINGS.append({"resource_id": resource_id, "url": resource["url"], "reviewed_at": REVIEWED_AT,
                            "section": section, "severity": severity, "detail": detail,
                            "warning": warning, "correct_primary_urls": references})


def legacy_finding(question_id, resource_id, prompt, keyed_answer, reason, references):
    resource = next(row for row in BANKS if resource_id in row["resource_ids"])
    LEGACY_QUESTION_FINDINGS.append({"question_id": question_id, "resource_id": resource_id,
                                    "url": resource["url"], "prompt": prompt,
                                    "current_keyed_answer": keyed_answer, "reason": reason,
                                    "primary_references": references, "suggested_action": "quarantine"})


STATS = "acdab68f5b66b329d778b49b"
NIST_CI = "https://www.itl.nist.gov/div898/handbook/eda/section3/eda352.htm"
NIST_TTEST = "https://www.itl.nist.gov/div898/handbook/eda/section3/eda353.htm"
NIST_NORMAL = "https://www.itl.nist.gov/div898/handbook/eda/section3/eda3661.htm"
MIT_LIMITS = "https://ocw.mit.edu/courses/res-6-012-introduction-to-probability-spring-2018/pages/part-ii-inference-limit-theorems/"
PEARSON = "https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.pearsonr.html"
AUTO_ML = "https://learn.microsoft.com/en-us/azure/machine-learning/concept-automated-ml?view=azureml-api-2"
AZURE_MIGRATION = "https://learn.microsoft.com/en-us/azure/machine-learning/how-to-migrate-from-v1?view=azureml-api-2"
AZURE_ENDPOINTS = "https://learn.microsoft.com/en-us/azure/machine-learning/migrate-to-v2-managed-online-endpoints?view=azureml-api-2"
HEART_FAILURE_PAPER = "https://link.springer.com/article/10.1186/s12911-020-1023-5"
R_HISTOGRAM = "https://ggplot2.tidyverse.org/reference/geom_histogram.html"
R_POINTS = "https://ggplot2.tidyverse.org/reference/geom_point.html"
COLOR_ACCESS = "https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html"

source_finding("27d4e7f2501e411d385f5a88", "#other-related-fields",
    "The Artificial Intelligence entry reverses the conventional AI and ML relationship, and its human-thought analogy overgeneralizes AI techniques.",
    "Machine learning is one approach within the broader field of artificial intelligence.",
    ["https://github.com/microsoft/ML-For-Beginners/blob/653bc95f0df772b6910c5aab8a7d9db351d454e5/1-Introduction/1-intro-to-ML/README.md#some-terminology"])
source_finding(STATS, "#confidence-intervals",
    "The displayed probability is phrased as a measured sample mean falling inside the interval. Frequentist coverage concerns the random intervals produced by repeated sampling containing a fixed population mean. Student's t applies to a standardized statistic under the relevant assumptions.",
    "Read confidence as the long-run coverage of the interval procedure. Use the population mean as the fixed target and the sample-based limits as the varying quantities.", [NIST_CI])
source_finding(STATS, "#hypothesis-testing",
    "The prose claims proof from nonoverlapping individual intervals, then the displayed t-test compares First_Baseman with Designated_Hitter despite describing Second_Baseman. The printed example therefore answers a different group comparison.",
    "Check that the code selects the intended groups. Use a test or confidence interval for their difference under the relevant assumptions, and report evidence with uncertainty.", [NIST_TTEST])
source_finding(STATS, "#law-of-large-numbers-and-central-limit-theorem",
    "The central limit theorem description drops the identical-distribution and finite-variance conditions of the classical version and treats finite sample means as exactly normal. The weak law concerns being within any fixed positive tolerance of the mean, rather than exact equality.",
    "For independent, identically distributed observations with finite nonzero variance, the standardized sample mean approaches normality as sample size grows. The weak law concerns closeness to the population mean.", [MIT_LIMITS, NIST_NORMAL])
source_finding(STATS, "#covariance-and-correlation",
    "The lesson equates zero correlation with independence. A symmetric X and Y=X squared can have zero Pearson correlation although Y is determined by X. Correlation is also undefined when a variable has zero variance.",
    "Pearson correlation measures linear association. A value of zero leaves nonlinear dependence possible. Check for constant variables before interpreting a correlation matrix.", [PEARSON])
source_finding("5b6039faba757e4d6dc1be12", "#dealing-with-missing-data",
    "The source describes only NaN and None, and its fillna(method=...) calls fail under the Pandas 3.1 review runtime. Current Pandas also represents missing values with dtype-specific markers such as NaT and pd.NA.",
    "Use isna() to detect missing entries across types. In current Pandas, use ffill() and bfill() for the lesson's directional fill examples.",
    ["https://pandas.pydata.org/docs/user_guide/missing_data.html", "https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.ffill.html"])
source_finding("ea403329bb64b8f859715117", "#sampling-and-querying",
    "The paragraph says DataFrame.query selects columns. The shown API evaluates a Boolean expression over columns to select rows. Choosing output columns is a separate operation.",
    "Use query() for row predicates and a column selection afterward when you need fewer output fields.",
    ["https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.query.html"])
source_finding("c5989308d51c40fa4397c350", "#32-endpoint-consumption",
    "The example describes a true response as predicting heart failure. Its DEATH_EVENT label is death during follow-up in a cohort already diagnosed with heart failure. The all-zero payload and example response provide no clinical validation.",
    "Read DEATH_EVENT as a follow-up outcome among people who already had heart failure. The example illustrates a request and response, and clinical use would require separate validation.", [HEART_FAILURE_PAPER])
source_finding("c5989308d51c40fa4397c350", "#31-model-deployment",
    "The visual walkthrough shows a legacy Azure Container Instances endpoint and subsequently places an API key in a script targeting a plaintext HTTP address. Current Azure guidance uses authenticated managed online endpoints protected by TLS.",
    "Treat the shown interface and URL as historical. Follow current endpoint documentation and use authenticated HTTPS for requests that carry credentials.", [AZURE_ENDPOINTS], "caution")
source_finding("b599236b084e1d3583f503b7", "#32-model-deployment",
    "The walkthrough imports azureml-core v1 classes such as AciWebservice and InferenceConfig. Microsoft lists June 30, 2026 as the SDK v1 end-of-support date and documents the v2 deployment path.",
    "Use the SDK code to study the historical workflow. Consult SDK v2 and current endpoint documentation for implementation.", [AZURE_MIGRATION, AZURE_ENDPOINTS], "caution")
source_finding("b599236b084e1d3583f503b7", "#12-heart-failure-prediction-project-and-dataset-introduction",
    "The project framing describes prediction of heart failure itself, but the training configuration identifies DEATH_EVENT, a follow-up outcome in patients already diagnosed with heart failure.",
    "Read the example as a historical follow-up outcome classification exercise. Its target and dataset population determine what its predictions can mean.", [HEART_FAILURE_PAPER])
source_finding("0ec911c91765a7198cf26408", "#data-science-in-the-cloud",
    "The overview describes assessing whether someone will have heart failure. Its example dataset consists of patients with heart failure and uses a follow-up death outcome.",
    "The cloud case study uses a follow-up outcome from patients with heart failure. The linked lessons teach the stages of an ML workflow.", [HEART_FAILURE_PAPER])
source_finding("36542555913dc6f317da49c8", "#explore-bar-charts",
    "The prose says vertically, while plot.barh() draws horizontal bars. The array-based category count works in the reviewed runtime, and counting the category Series directly expresses the one-column operation more clearly.",
    "Read plot.barh() as horizontal bars. birds['Category'].value_counts() directly counts the values in the category column.",
    ["https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.value_counts.html", "https://pandas.pydata.org/docs/reference/api/pandas.Series.value_counts.html"])
source_finding("55ab89f1e92450b866684121", "#build-a-line-plot-about-bird-wingspan-values",
    "The first scatter-with-labels example breaks the ggplot2 expression after theme() and ends the final ggtitle() with an unpaired plus sign.",
    "Connect each label or theme layer to the ggplot expression with + and finish the final layer without a trailing operator.",
    ["https://ggplot2.tidyverse.org/reference/ggplot.html"])
source_finding("55ab89f1e92450b866684121", "#comparing-data",
    "The field labeled MinLength is summarized with max(MinLength). It is the largest lower measurement in the group. The overlaid bars can therefore be mistaken for the full range between the category minimum and maximum.",
    "Check what each endpoint summarizes. To display the full category range, compute its smallest lower measurement and largest upper measurement, then plot both clearly.",
    ["https://dplyr.tidyverse.org/reference/summarise.html"], "caution")
source_finding("aedd432f9b1ab8a2e1192fa2", "#explore-the-dataset-for-distributions-using-text-data",
    "The overlay uses plt.hist with MinWingspan as the measured variable and default count heights, but sets Min Wingspan as the vertical label. Separately inferred bin edges may also differ between groups.",
    "Label the horizontal axis with the measured variable and the vertical axis with count. Use shared bin edges when comparing groups.",
    ["https://matplotlib.org/stable/api/_as_gen/matplotlib.pyplot.hist.html"])
source_finding("8097fd9e97b247dce8439234", "#explore-the-dataset-for-distributions-using-text-data",
    "The example recodes six statuses into x1 through x6, then supplies four unnamed colors and labels. The mapping depends on which levels survive filtering and can be misleading or fail when more than four levels remain.",
    "Match colors and labels explicitly to observed status levels, using named values and matching breaks where appropriate.",
    ["https://ggplot2.tidyverse.org/reference/scale_manual.html"], "caution")
source_finding("77cfa91e79657e8c0c1eb0fc", "#get-to-know-your-mushrooms-",
    "The examples select only object columns to find strings and use groupby().count() on a selected column as a group size. Pandas 3 can infer a separate string dtype and count() excludes missing values in that column.",
    "Inspect the actual text dtypes. For an intended count of every row in a category, use a group size instead of a non-null count in another field.",
    ["https://pandas.pydata.org/docs/user_guide/migration-3-strings.html", "https://pandas.pydata.org/docs/reference/api/pandas.core.groupby.DataFrameGroupBy.size.html"], "caution")
source_finding("b9e1b048dcb1f2c56801144a", "#scatterplots",
    "The prose says the larger dots encode price, but the code keeps price on the x-axis and maps size to year.",
    "Read marker size using the year legend. Read price from the horizontal coordinate.",
    ["https://seaborn.pydata.org/generated/seaborn.scatterplot.html"])
source_finding("b9e1b048dcb1f2c56801144a", "#line-charts",
    "The source proposes ci=None. Seaborn deprecated ci in 0.12. Setting errorbar=None suppresses uncertainty bars while the default estimator still aggregates repeated x observations.",
    "Use errorbar=None to hide the interval in current Seaborn. Set estimator separately if the desired plot should use individual observations.",
    ["https://seaborn.pydata.org/generated/seaborn.lineplot.html"], "caution")
source_finding("2b797a4603316f7bed637de5", "#scatterplots",
    "The text says marker size encodes price, whereas the R code uses aes(size=year) and retains price on the horizontal coordinate.",
    "Marker size encodes year in this example. Read price from the x-axis.", [R_POINTS])
source_finding("2b797a4603316f7bed637de5", "#line-charts",
    "The lesson uses deprecated ggplot2 qplot() and marks one R code block as Python. Its smoothed trend remains a valid concept.",
    "Use ggplot() with a smoothing layer for the R trend example. Both displayed snippets are written in R.",
    ["https://ggplot2.tidyverse.org/reference/qplot.html", "https://ggplot2.tidyverse.org/reference/geom_smooth.html"], "caution")
source_finding("2b797a4603316f7bed637de5", "#dual-line-plots",
    "The right-axis code calculates ticks from y2, which is undefined in the shown example. The second curve instead uses honey$yieldpercol.",
    "Use the plotted second series for the right-axis ticks and label that scale with its own units.",
    ["https://stat.ethz.ch/R-manual/R-devel/library/graphics/html/axis.html"])

legacy_finding("7b1662e98103dd39df223194", STATS,
    "We want to prove that basketball players are taller than average people. We have collected heights of 20 people from both groups. What do we need to do?", "use t-test",
    "A sample size alone does not establish representativeness, independence or the correct test. Even a correctly applied t-test supplies statistical evidence about a defined population contrast, rather than proof.", [NIST_TTEST])
legacy_finding("99f4d908e584d6b2c53395f7", STATS,
    "How can we demonstrate that income of a person is dependent on the level of education?", "compute correlation coefficient",
    "The stem does not define a dependence measure, the education coding or the population assumptions. A sample Pearson coefficient by itself summarizes linear association. It cannot settle general dependence or a causal claim.", [PEARSON])
legacy_finding("d6ce2e1a8fe610d9988568f4", STATS,
    "We throw the dice 100 times and compute the average value. What would be the distribution of the result?", "normal",
    "The 100-roll average has a finite discrete support. A normal distribution can approximate its shape under standard assumptions. The question omits the approximation qualifier even though it offers a choice of none of the above.", [NIST_NORMAL, MIT_LIMITS])
legacy_finding("43acb266277b20000d15b5e8", "8097fd9e97b247dce8439234",
    "Histograms are overall more sophisticated types of chart than scatterplots", "True",
    "The cited lesson describes different purposes for the two displays. Overall sophistication is undefined and has no objectively correct rank.", [R_HISTOGRAM, R_POINTS])
legacy_finding("17b8004f30d4b9e73bf7627c", "8097fd9e97b247dce8439234",
    "You can visualize distributions using this type of chart:", "scatterplot",
    "The stem does not say which distribution is needed. A scatterplot can show two-variable observations, while column and pie charts can both show categorical distributions. Several choices can be valid.", [R_HISTOGRAM, R_POINTS, "https://ggplot2.tidyverse.org/reference/geom_bar.html"])
legacy_finding("177d0c96c3156a3ce40f0e9e", "2b797a4603316f7bed637de5",
    "By editing a scatterplot's hue, you can:", "display a dataset's distribution",
    "A hue mapping assigns point colors using a named variable. The offered item-colors choice fits that mechanism, while the generic distribution choice leaves the encoded variable and intended display undefined.", [R_POINTS, "https://seaborn.pydata.org/generated/seaborn.scatterplot.html"])
legacy_finding("0c7fb21a8d501a6bf5ac047a", "2b797a4603316f7bed637de5",
    "A more accessible way to display distribution is:", "Using either of the above",
    "Shape or size can supply a non-color cue, but their effectiveness depends on what the marks encode, how well the cue is distinguishable and what readers need to access. The stem lacks that context.", [COLOR_ACCESS])
legacy_finding("2bbd43132b6deefa9b801167", "c5989308d51c40fa4397c350",
    "In which case do you need GPU over CPU?", "When you do Deep Learning",
    "GPU acceleration can improve performance on suitable workloads, but its necessity depends on the specific model, computation, memory and throughput. Deep learning can also execute on a CPU.",
    ["https://docs.pytorch.org/tutorials/beginner/basics/quickstart_tutorial.html"])
legacy_finding("c6d0391aac43d96762f16ad8", "b599236b084e1d3583f503b7",
    "Which of these would be affected by increasing the cluster size?", "Model performance",
    "A larger cluster can change resource cost, concurrency or training duration. The question specifies no workload, search budget or definition of performance to establish a unique answer about model quality.",
    ["https://learn.microsoft.com/en-us/azure/machine-learning/how-to-create-attach-compute-cluster?view=azureml-api-2", AUTO_ML])
legacy_finding("f257ade925a780c722e327c5", "b599236b084e1d3583f503b7",
    "What is AutoML?", "A tool for automating the deployment of models",
    "The lesson describes iterating over models and hyperparameters during training. Deployment comes after a candidate is selected. The keyed definition conflates the two stages.", [AUTO_ML])
