"""Original, source-bound checks reviewed 10 November 2026.

Primary Markdown was read at the exact catalogue commits. Assignment-only
briefs and module indexes remain explicit ungraded guides. Numerical examples
are new; historical service availability and measured model scores are not
certified. Source mistakes are recorded separately, never silently endorsed.
"""
ML = "https://github.com/microsoft/ML-For-Beginners/blob/653bc95f0df772b6910c5aab8a7d9db351d454e5/"
AI = "https://github.com/microsoft/AI-For-Beginners/blob/49ab6e2e51bf1f80f442a74cefe0b68a5dcfc73e/"
BANKS = []
ORIENTATIONS = []


def add(rid, prefix, path, scope, questions):
    BANKS.append({"resource_ids": [rid], "url": prefix + path + "/README.md",
                  "topics": ["machine-learning"], "reviewed_at": "2026-11-10",
                  "scope": scope, "questions": questions})


def guide(rid, prefix, path, reason, children=(), kind="orientation"):
    ORIENTATIONS.append({"resource_ids": [rid], "url": prefix + path + "/README.md",
                         "topics": ["machine-learning"], "reviewed_at": "2026-11-10",
                         "reason": reason, "child_resource_ids": list(children), "kind": kind})


add("adbcf17f64d9f66e17f7ce82", ML, "1-Introduction/1-intro-to-ML",
    "Data-driven pattern learning, the relationship of ML to AI, and matching example applications to their prediction goals.", [
    ("patterns", "ml-data-learning", 1, "What does machine learning seek in observed data?", "Patterns useful for predictions or decisions", ["Only manually written rules", "A guarantee that every prediction is correct", "An exact copy of a human brain"], "The lesson describes algorithms finding meaningful patterns in data.", "#some-terminology"),
    ("ai-relation", "ml-ai-relationship", 1, "How does the lesson relate ML to artificial intelligence?", "ML is a subset of AI", ["AI is a subset of ML", "The terms describe only identical techniques", "ML excludes every AI application"], "AI is the broader field; ML is one approach within it.", "#some-terminology"),
    ("learned-system", "ml-data-learning", 2, "What distinguishes the lesson's data-driven system from a purely hand-coded rules engine?", "Its behavior uses patterns learned from examples", ["It never needs input data", "It always contains a physical robot", "Its predictions are automatically facts"], "A learned model can use patterns rather than requiring every decision rule to be written manually.", "#why-study-machine-learning"),
    ("weather-goal", "ml-application-goals", 3, "A team has past weather observations and wants to estimate future weather. Which use matches the lesson?", "Learn predictive patterns from weather data", ["Treat the historical average as proof of every future event", "Ignore the observations and rename the files", "Assume the model controls the weather"], "Weather prediction is an example of learning from relevant observations.", "#examples-of-applied-ml"),
    ("sentiment-goal", "ml-application-goals", 3, "A program estimates whether a message expresses a positive or negative opinion. Which application is this?", "Text sentiment analysis", ["Named entity recognition", "Topic classification into subject areas", "Translation into another language"], "The lesson lists understanding text sentiment as an ML application.", "#examples-of-applied-ml"),
    ("course-boundary", "ml-ai-relationship", 3, "A learner finishes this classical-ML introduction. What further study is still needed to claim coverage of deep neural networks?", "Dedicated neural-network and deep-learning material", ["No further study; all AI methods were covered here", "Only memorizing library names", "Only installing the course editor"], "The source explicitly places neural networks and deep learning outside this course's scope.", "#what-we-will-not-cover"),
])

add("593b1f33ca4b39211c8eccd6", ML, "1-Introduction/2-history-of-ML",
    "Historical roles of Turing, Dartmouth, microworlds and expert systems; limits of data, computation and early expectations.", [
    ("turing", "ml-history-foundations", 1, "Which researcher is associated with the Turing Test discussed in the lesson?", "Alan Turing", ["Frank Rosenblatt", "Andrey Markov", "Adrien-Marie Legendre"], "The test is part of Turing's exploration of machine intelligence.", "#1950-machines-that-think"),
    ("dartmouth", "ml-history-foundations", 1, "Which event helped establish artificial intelligence as a research field?", "The Dartmouth Summer Research Project", ["The launch of a particular modern phone", "The release of a plotting library", "The first course notebook installation"], "The lesson identifies Dartmouth as a foundational gathering.", "#1956-dartmouth-summer-research-project"),
    ("expert-parts", "ml-history-methods", 2, "What two components does the lesson associate with an expert system?", "Rules and an inference engine", ["Only raw images and a camera", "Only a random-number generator and a screen", "A browser cache and a stylesheet"], "Rules encode domain knowledge and inference derives conclusions.", "#1980s-expert-systems"),
    ("limited-world", "ml-history-methods", 3, "A system can stack blocks in a carefully restricted simulated world. What does that demonstrate in the historical examples?", "Success in a limited microworld", ["Proof of unrestricted human-level intelligence", "Evidence that real-world ambiguity has disappeared", "A guarantee of success in unrelated domains"], "Blocks world restricted the environment so researchers could study particular reasoning tasks.", "#1956---1974-the-golden-years"),
    ("winter-cause", "ml-history-limits", 3, "An ambitious system needs more data and computation than researchers have. Which historical lesson is relevant?", "Resource limits can make optimistic promises unattainable", ["Promises themselves create the missing data", "Compute capacity never affects feasibility", "A successful demo proves unlimited scale"], "The AI-winter discussion includes compute, data and complexity limitations.", "#1974---1980-ai-winter"),
    ("later-progress", "ml-history-limits", 3, "Why could later ML research revisit problems that earlier systems struggled with?", "More available data, compute and improved algorithms", ["Every earlier problem had already been solved perfectly", "Models no longer needed any observations", "All symbolic methods were legally prohibited"], "The lesson describes these interacting changes during later progress.", "#1993---2011"),
])

add("3f9470d7f955bac6fe97bdfb", ML, "1-Introduction/3-fairness",
    "Fairness harms, reliability, inclusive design, transparency and accountable impact assessment; no legal-compliance certification.", [
    ("harm", "responsible-fairness", 1, "What does unfairness concern in this lesson?", "Negative impacts on groups of people", ["Only an untidy notebook", "Only the duration of a training run", "Only the number of model layers"], "Fairness assessment considers harms such as unequal allocation or service quality.", "#fairness"),
    ("transparency", "responsible-transparency", 1, "Which principle emphasizes explaining AI behavior and limitations?", "Transparency", ["Keeping all limitations secret", "Maximizing file compression", "Replacing stakeholder questions with a score"], "Stakeholders need to understand how the system works and where it is limited.", "#transparency"),
    ("accountable", "responsible-accountability", 2, "Who remains accountable for how an AI system operates?", "The people and organizations designing and deploying it", ["Only the numerical output itself", "Nobody once training finishes", "Only the people affected by mistakes"], "Deploying a model does not remove human responsibility.", "#accountability"),
    ("service-gap", "responsible-fairness", 3, "A sensor works well for one skin-tone group but repeatedly fails for another. Which listed harm is most directly illustrated?", "Unequal quality of service", ["Denigration through an insulting output label", "Underrepresentation in a generated list of professions", "A purely aggregate error with no group disparity"], "Different service performance across groups can create fairness-related harm.", "#fairness"),
    ("unexpected-case", "responsible-reliability", 3, "An application works in ordinary conditions but has not been examined in unusual conditions. Which action follows the lesson?", "Investigate relevant outliers and unexpected scenarios", ["Treat common-case accuracy as proof of safety everywhere", "Delete every unusual observation without analysis", "Hide the untested conditions from documentation"], "Reliability and safety require considering a range of conditions.", "#reliability-and-safety"),
    ("aggregate-limit", "responsible-assessment", 3, "An overall score looks good while one cohort has many errors. What does the lesson recommend examining?", "Error distribution and performance across cohorts", ["Only the overall score again", "Only a global feature-importance average without subgroup checks", "Only whether training completed without exceptions"], "Aggregate metrics can conceal disparities and other responsible-AI issues.", "#debugging-with-responsible-ai"),
])

add("8665cbcb49e8235c073ea410", ML, "1-Introduction/4-techniques-of-ML",
    "Features/targets, train-validation-test roles, feature transformation and underfitting/overfitting.", [
    ("feature", "ml-feature-target", 1, "A model predicts pumpkin price using weight and variety. What are weight and variety?", "Input features", ["The price target", "The final error metric", "The held-out split itself"], "Features are measurable properties supplied as inputs.", "#features-and-target"),
    ("target", "ml-feature-target", 1, "For that price-prediction task, what does y represent?", "The price to predict", ["The complete feature matrix", "The number of training epochs", "Only the model's name"], "The target represents the answer the model is trained to predict.", "#features-and-target"),
    ("validation", "ml-evaluation-splits", 2, "Which independent split can guide hyperparameter tuning?", "Validation data", ["Only the final untouched test results used repeatedly", "Only the source-code comments", "Only a copy of the training labels renamed test"], "The lesson distinguishes validation for tuning from final testing.", "#split-your-dataset"),
    ("overfit", "ml-generalization", 3, "A model predicts training examples very well but performs poorly on unseen examples. Which problem fits?", "Overfitting", ["Proof of perfect generalization", "Guaranteed data independence", "A successful final evaluation"], "An overfit model can learn training details and noise that do not generalize.", "#evaluate-the-model"),
    ("selection-extraction", "ml-feature-engineering", 3, "A team replaces original measurements with new functions of those measurements. Which operation is this?", "Feature extraction", ["Selecting only an unchanged subset", "Testing without transforming inputs", "Renaming the target as a feature"], "Extraction creates new features; selection chooses a subset of existing ones.", "#selecting-your-feature-variable"),
    ("held-out", "ml-evaluation-splits", 3, "Before evaluating a fitted model, which property should the test examples have?", "They were not used to train that model", ["They are identical copies of the training examples", "Their labels were supplied as input features", "They were selected only because predictions were correct"], "Independent unseen examples provide evidence about generalization.", "#evaluate-the-model"),
])

add("89cd5bb2ed626c6062fa7c6a", ML, "2-Regression/2-Data",
    "Pumpkin data inspection, missing-value counts, price calculation, common units and grouped visualization.", [
    ("missing", "regression-data-quality", 1, "Which expression counts missing values in each DataFrame column?", "pumpkins.isnull().sum()", ["pumpkins.head()", "pumpkins.columns", "pumpkins.shape[0]"], "The boolean missing-value mask is summed by column.", "#first-check-for-missing-dates"),
    ("inspect", "regression-data-quality", 1, "What does pumpkins.head() show by default?", "The first five rows", ["Only the column count", "The last five rows", "Only the missing rows"], "head provides a small initial view of the table.", "#first-check-for-missing-dates"),
    ("average", "regression-price-features", 2, "A row has Low Price 12 and High Price 18. What price does the lesson's average formula give?", "15", ["6", "30", "18"], "The midpoint is (12 + 18) / 2.", "#second-determine-average-price-of-pumpkin"),
    ("half-bushel", "regression-unit-normalization", 3, "A half-bushel package costs 9. What is its equivalent price per whole bushel?", "18", ["4.5", "9", "1.8"], "Divide package price by its volume in bushels: 9 / 0.5.", "#but-wait-theres-one-more-thing-to-do"),
    ("mixed-units", "regression-unit-normalization", 3, "Some rows price pumpkins individually and others by bushel. Why not compare their raw prices as the same target?", "The prices refer to different units", ["Every numeric price already means one bushel", "Package text proves the prices are equal", "Averaging alone converts every unit"], "Unit meaning must be standardized or the comparison is misleading.", "#but-wait-theres-something-odd-here"),
    ("monthly-mean", "regression-data-visualization", 3, "Which operation produces one average price per month for the lesson's bar chart?", "groupby('Month')['Price'].mean()", ["head()['Price']", "groupby('Price')['Month'].sum()", "isnull().sum()"], "Grouping by month and averaging price summarizes the monthly values.", "#make-it-useful"),
])

add("2b19a333828f0415582f2cc5", ML, "2-Regression/3-Linear",
    "Linear prediction, input shape, polynomial features, categorical encoding and train/test roles. Source errors about residuals, correlation and reported metrics are excluded.", [
    ("slope", "linear-model-equation", 1, "In Y = a + bX, which coefficient is the slope?", "b", ["a", "Y", "The number of samples"], "b is the change in predicted Y per unit increase in X.", "#a-linear-regression-line"),
    ("matrix-shape", "linear-model-inputs", 1, "With N samples and one numeric feature, what input shape does the lesson use?", "N rows and 1 column", ["1 row and N columns", "Only a scalar", "N rows and no columns"], "Each row is a sample's feature vector.", "#simple-linear-regression"),
    ("polynomial", "linear-polynomial-features", 2, "What does a degree-2 polynomial transformation add for one input x?", "A squared x term", ["Only a text label", "Only the target's name", "A guarantee of zero test error"], "Polynomial features let a linear model fit a curved relationship in the original input.", "#polynomial-regression"),
    ("prediction", "linear-model-equation", 3, "For Y = 5 + 2X, what is the prediction when X = 4?", "13", ["11", "28", "8"], "Substitution gives 5 + 2*4 = 13.", "#a-linear-regression-line"),
    ("nominal-variety", "linear-categorical-features", 3, "Pumpkin varieties have no meaningful numeric order. Which representation avoids treating arbitrary variety IDs as amounts?", "One-hot indicator columns", ["Use arbitrary IDs as a single quantity", "Sort variety names and call the order a measured distance", "Put the target price into the variety ID"], "One-hot encoding gives each category an indicator rather than an artificial magnitude.", "#categorical-features"),
    ("pipeline-order", "linear-polynomial-features", 3, "The model should learn from squared input features. Which pipeline order matches the lesson?", "PolynomialFeatures followed by LinearRegression", ["Predict before fitting the feature transform", "LinearRegression followed only by a feature transformer", "Use the held-out target as an input feature"], "The feature transform supplies the expanded inputs to the regression estimator.", "#polynomial-regression"),
])

add("80fa4d18046d23b6fffe27dc", ML, "2-Regression/4-Logistic",
    "Binary/ordered classification, category encoding and correctly defined precision/recall. The source's swapped FP/FN prose and weak-correlation heuristic are excluded.", [
    ("binary", "logistic-task", 1, "Which target fits the lesson's binary classifier?", "White versus not-white pumpkin", ["Exact price per bushel", "A continuous temperature", "The total number of rows"], "Binary classification chooses between two label categories.", "#binary-classification"),
    ("ordinal", "logistic-encoding", 1, "Which feature has the ordering needed for the lesson's ordinal encoding?", "Sizes ordered small, medium, large", ["Unordered city names", "Arbitrary record IDs", "Unordered pumpkin varieties"], "Ordinal features have a meaningful category order.", "#data-pre-processing-feature-and-label-encoding"),
    ("one-hot", "logistic-encoding", 2, "How does one-hot encoding represent a nominal category?", "A binary indicator column for each category", ["A target price copied into every row", "One random value per prediction", "An ordinal ranking guaranteed by alphabetical order"], "The nominal encoder represents category membership without a natural order.", "#data-pre-processing-feature-and-label-encoding"),
    ("precision", "classification-metrics", 3, "A classifier has 18 true positives and 6 false positives. What is precision?", "0.75", ["0.25", "3", "0.6"], "Precision is TP/(TP+FP), so 18/24 = 0.75.", "#better-comprehension-via-a-confusion-matrix"),
    ("recall", "classification-metrics", 3, "There are 18 true positives and 12 false negatives. What is recall?", "0.6", ["0.4", "1.5", "0.75"], "Recall is TP/(TP+FN), so 18/30 = 0.6.", "#better-comprehension-via-a-confusion-matrix"),
    ("threshold", "logistic-decisions", 3, "Using the lesson's rule class 1 if probability exceeds 0.5, which label follows from 0.8?", "Class 1", ["Class 0", "Both classes simultaneously", "The numeric price 0.8"], "The probability is converted to a category using the stated threshold.", "#use-a-swarm-plot"),
])

add("44a5f55f2274d16ffaa8a4a8", ML, "3-Web-App/1-Web-App",
    "Saving a trusted trained Python model, serving inference with Flask and keeping prediction input shape/order consistent; excludes the source's integer coordinate-conversion bug.", [
    ("serialize", "ml-model-persistence", 1, "What does pickling a trained model do?", "Serializes its Python object structure", ["Retrains it on every future input", "Encrypts every prediction", "Converts all labels to images"], "Serialization saves the model representation for later loading.", "#tool"),
    ("framework", "ml-web-serving", 1, "What role does Flask play in the lesson?", "A Python web framework serving the application", ["The classification target", "The UFO dataset's label encoder", "The model's training loss"], "Flask handles routes and renders the web interface.", "#tool"),
    ("predict-route", "ml-web-serving", 2, "What does the /predict route do with submitted features?", "Calls the trained model and renders its prediction", ["Only renames the saved model", "Always creates a new training dataset", "Only changes the CSS file"], "The route gathers inputs, runs inference and displays the returned result.", "#exercise---build-a-flask-app"),
    ("input-order", "ml-inference-contract", 3, "Training used [Seconds, Latitude, Longitude]. What should a single inference row preserve?", "Those three features in the same order", ["The three numbers in any order", "Country first, then only longitude", "Only the largest number"], "The model interprets positions according to its training features.", "#exercise---build-your-model"),
    ("input-shape", "ml-inference-contract", 3, "A prediction needs one sample with those three features. Which array shape fits?", "1 row by 3 columns", ["3 rows by 1 column", "Only the country label", "No feature columns"], "The outer dimension represents samples and the inner dimension their features.", "#exercise---pickle-your-model"),
    ("untrusted-pickle", "ml-model-persistence", 3, "Someone uploads an unknown .pkl file. Does the tutorial justify blindly loading it?", "No; pickle is not intrinsically secure", ["Yes; .pkl means the file is trustworthy", "Yes; every serialized model is only harmless text", "Only if the filename includes model"], "The source explicitly warns about unpickling security.", "#tool"),
])

add("9932de14f2896338373bd21c", ML, "4-Classification/1-Introduction",
    "Cuisine-classification targets, ingredient features, class counts and SMOTE's interpolation concept; no endorsement of resampling before a held-out split.", [
    ("multiclass", "cuisine-classification-task", 1, "Predicting one cuisine among five named cuisines is which task?", "Multiclass classification", ["Binary classification only", "Continuous-price regression", "Unsupervised grouping with no labels"], "The target has more than two discrete classes.", "#hello-classifier"),
    ("labels", "cuisine-features-labels", 1, "Which column supplies the supervised labels in this cuisine dataset?", "cuisine", ["The unnamed row index", "An individual ingredient column", "The CSV filename"], "Cuisine is the class to predict from the ingredient features.", "#discovering-ingredients"),
    ("counts", "cuisine-class-distribution", 2, "Which expression counts examples per cuisine?", "df.cuisine.value_counts()", ["df.cuisine.unique() alone", "df.head() alone", "df.columns"], "value_counts reports the class distribution, not only the set of classes.", "#exercise---learning-about-cuisines"),
    ("synthetic", "cuisine-resampling", 3, "What does the lesson's SMOTE method create by interpolation?", "Synthetic examples for minority classes", ["Only exact duplicates without interpolating features", "A guarantee that held-out accuracy improves", "New target classes rather than examples of existing classes"], "SMOTE generates feature-space examples; it does not prove generalization.", "#balance-the-dataset"),
    ("majority", "cuisine-class-distribution", 3, "One cuisine has 800 examples and another has 80. What does comparing these counts reveal?", "Class imbalance", ["That both classes have equal support", "That each recipe contains 800 ingredients", "That every classifier must be perfectly accurate"], "Unequal counts can affect how a classifier learns and is evaluated.", "#exercise---learning-about-cuisines"),
    ("exclude-target", "cuisine-features-labels", 3, "Why is cuisine dropped from the input feature table while kept separately as labels?", "It is the answer being predicted, not an ingredient input", ["It is necessarily missing in every row", "Every text column is always useless", "It determines the CSV file's row order only"], "Keeping the target separate prevents supplying the answer as an input.", "#discovering-ingredients"),
])

add("444dada88136c9d89d3748b1", ML, "4-Classification/2-Classifiers-1",
    "Cuisine inputs/labels, optimization solvers, held-out accuracy and mapping probability columns to class names; excludes the page's contradictory classifier-selection claims.", [
    ("solver", "classifier-optimization", 1, "What is a solver in the lesson's logistic-regression discussion?", "The algorithm used for the optimization problem", ["The target cuisine's name", "The CSV delimiter", "The number of ingredient columns"], "The solver determines how the model's optimization is performed.", "#using-scikit-learn"),
    ("features", "classifier-input-contract", 1, "After dropping cuisine and the unnamed index, what are the input columns?", "Ingredient features", ["Only the predicted labels", "Only the file path", "The classification-report headings"], "The model predicts cuisine from ingredient indicators.", "#exercise---predict-a-national-cuisine"),
    ("probability-names", "classifier-probabilities", 2, "Which fitted-model attribute names the classes corresponding to predict_proba columns?", "classes_", ["coef_names_only", "The CSV's row numbers", "The sorted ingredient names"], "The lesson uses model.classes_ to label probability columns.", "#exercise---apply-logistic-regression"),
    ("test-size", "classifier-evaluation", 3, "A 100-row dataset is split with test_size=0.3. How many rows go to the test split?", "30", ["3", "70", "100"], "Thirty percent of 100 is 30.", "#exercise---split-the-data"),
    ("top-class", "classifier-probabilities", 3, "Classes are [A, B, C] and their probability row is [0.2, 0.7, 0.1]. Which is the highest-probability class?", "B", ["A", "C", "The ingredient at column 1"], "The largest probability is the second entry, matched to class B.", "#exercise---apply-logistic-regression"),
    ("single-row", "classifier-input-contract", 3, "A single recipe has F ingredient features. What shape should its prediction input have?", "1 row and F columns", ["F rows and 1 column", "Only the cuisine label", "F+1 columns including the known answer"], "The example reshapes one feature vector into a one-sample matrix.", "#exercise---apply-logistic-regression"),
])

add("1ff66fd8a070f3eb629997a8", ML, "4-Classification/3-Classifiers-2",
    "Support-vector classification, forest ensembles, AdaBoost and interpreting evaluation code; excludes inaccurate clustering language about SVC/KNN.", [
    ("svc-role", "svc-classification", 1, "What is the SVC estimator used to predict in this lesson?", "Cuisine categories", ["Only unlabeled cluster centroids", "Continuous transaction amounts", "The number of CSV rows"], "Here SVC is a supervised support-vector classifier.", "#support-vector-classifier"),
    ("forest", "classifier-ensembles", 1, "What base estimators form the lesson's random forest?", "Decision trees", ["Only one manually written rule", "Only plotting axes", "Only class-name strings"], "The forest combines many decision trees.", "#ensemble-classifiers"),
    ("adaboost", "classifier-boosting", 2, "What does AdaBoost emphasize in successive fitting steps?", "Examples earlier estimators classified incorrectly", ["Only the alphabetically first class", "Only the examples with the shortest names", "Removing every error from evaluation"], "The weighting focuses subsequent learning on difficult examples.", "#ensemble-classifiers"),
    ("tree-count", "classifier-ensembles", 3, "RandomForestClassifier has n_estimators=80. How many trees are requested?", "80", ["8", "160", "The feature count instead of 80"], "n_estimators controls the forest's number of trees.", "#ensemble-classifiers"),
    ("metric-split", "classifier-code-evaluation", 3, "Code predicts on X_test and compares with y_test, but prints 'Accuracy (train)'. Which data is the metric actually using?", "The test split", ["The training split because of the printed label", "A separate validation split never passed to the metric", "Both splits automatically"], "The arrays passed to the metric determine its scope; the printed label is misleading.", "#exercise---apply-a-linear-svc"),
    ("comparison-limit", "classifier-code-evaluation", 3, "A forest scores best among these experiments. What conclusion is justified?", "It performed best in this reported comparison", ["It must outperform every classifier on every dataset", "Its training and test data must be identical", "It no longer needs evaluation on new data"], "A comparison on one dataset does not establish universal superiority.", "#ensemble-classifiers"),
])

add("9d409b7e327d6e85d596caa5", ML, "4-Classification/4-Applied",
    "ONNX conversion, model inspection, fixed ingredient-vector positions and browser inference contracts; offline use still requires available runtime/model assets.", [
    ("conversion", "onnx-export", 1, "Which package does the lesson use to convert its scikit-learn model to ONNX?", "skl2onnx", ["Only Matplotlib", "Only Flask's templating engine", "Only pandas.read_csv"], "The conversion produces an ONNX representation of the fitted estimator.", "#exercise---train-classification-model"),
    ("inspect", "onnx-inspection", 1, "What is Netron used for here?", "Inspecting the model graph and input structure", ["Generating new cuisine labels", "Guaranteeing model fairness", "Collecting new recipes automatically"], "The visual inspector helps verify the exported model's structure.", "#view-your-model"),
    ("inference", "onnx-runtime", 2, "What does running the saved model on a recipe's ingredients perform?", "Inference", ["A new model-training run by definition", "Only CSV serialization", "Only model-graph editing"], "Inference applies the learned model to supplied inputs.", "#build-a-recommender-web-application"),
    ("tensor-shape", "onnx-input-contract", 3, "The exported model expects 380 ingredient values per recipe. Which tensor shape represents one recipe?", "[1, 380]", ["[380, 1]", "[1, 379]", "[380] batches of empty rows"], "The leading dimension is sample count and the second is feature count.", "#build-a-recommender-web-application"),
    ("checkbox-index", "onnx-input-contract", 3, "A checkbox's value is 4. When checked, what does the lesson's zero-based ingredient vector change?", "The fifth entry becomes 1", ["The fourth entry becomes 4", "Every entry becomes 1", "The vector gains four extra columns"], "Index 4 selects the fifth feature, and checked means present.", "#build-a-recommender-web-application"),
    ("feed-name", "onnx-runtime", 3, "The exported input is named float_input. Which feeds object matches that model contract?", "{float_input: tensor}", ["{any_name: tensor} with no mapping", "{label: the expected cuisine}", "{380: the model filename}"], "The runtime feed key must match the model's input name.", "#build-a-recommender-web-application"),
])

add("64194972db5d31954d2eab14", ML, "5-Clustering/1-Visualize",
    "Unsupervised grouping, visual exploration, explicit missing-category filtering and correlation limits; excludes the source's density/noise and privacy shortcuts.", [
    ("unsupervised", "clustering-task", 1, "What does clustering discover when predefined output labels are absent?", "Groups based on patterns in the inputs", ["The supplied correct class for every example", "Only a continuous target value", "A guarantee of personal-data anonymity"], "Clustering explores group structure without requiring known output labels.", ""),
    ("scatter", "clustering-exploration", 1, "Which chart shows individual songs by popularity and danceability?", "A scatterplot", ["Only a count of column names", "Only a serialized model file", "Only the import statements"], "Two numeric axes expose individual points and possible group patterns.", "#exercise---data-distribution"),
    ("null-count", "clustering-data-quality", 2, "Which check counts actual nulls per column?", "df.isnull().sum()", ["df.head() alone", "df.columns alone", "A class-name legend alone"], "The source uses this check before exploring the song data.", "#exercise---cluster-your-data"),
    ("missing-string", "clustering-data-quality", 3, "A genre cell contains the literal text Missing. Why might a null-count check still report zero?", "A non-null string is not automatically a null value", ["Every word beginning with M is a null", "Null counts always inspect external databases", "The column's name makes it a supervised label"], "The lesson separately filters the explicit Missing category.", "#exercise---cluster-your-data"),
    ("causation", "clustering-interpretation", 3, "A heatmap shows energy and loudness are correlated. What can this alone establish?", "An association in the observed data", ["That changing energy necessarily causes loudness", "That no other variables can matter", "That every song must belong to one cluster"], "The source explicitly distinguishes correlation from causation.", "#exercise---cluster-your-data"),
    ("overlap", "clustering-exploration", 3, "The genre-colored points overlap strongly on a two-feature plot. What does that suggest for clustering using only those axes?", "Separation may be difficult on those features", ["Choosing k equal to the genre count proves recovery", "The color labels force an unsupervised model to separate the genres", "The remaining feature columns cannot contain information"], "Visual overlap warns against assuming clearly separated groups.", "#exercise---data-distribution"),
])

add("68f07271e7cd3852c7c9b888", ML, "5-Clustering/2-K-Means",
    "K-means assignment/centroid updates, choosing k, silhouette interpretation and elbow exploration; excludes arbitrary cluster-ID accuracy and source scaling claims.", [
    ("k", "kmeans-parameters", 1, "What does k specify in k-means?", "The number of clusters", ["The number of target labels required for training", "The number of CSV files", "The test accuracy"], "The number of centroids must be chosen for the fit.", "#introduction"),
    ("assignment", "kmeans-iteration", 1, "During an assignment step, which centroid receives a sample?", "Its nearest centroid", ["Always the centroid with index zero", "Always the farthest centroid", "A centroid chosen by the sample's filename"], "K-means alternates nearest-centroid assignment and center recomputation.", "#introduction"),
    ("silhouette", "kmeans-evaluation", 2, "Which silhouette value suggests better separated clusters, all else equal?", "A value closer to 1", ["A value closer to -1", "Any value above 100", "The string name of the largest cluster"], "The score ranges from -1 to 1; higher scores indicate greater separation.", "#silhouette-score"),
    ("new-centroid", "kmeans-iteration", 3, "A one-dimensional cluster contains 2, 4 and 9. What is its recomputed mean centroid?", "5", ["4", "9", "15"], "The centroid is (2 + 4 + 9) / 3.", "#introduction"),
    ("elbow", "kmeans-evaluation", 3, "Why plot inertia for several k values instead of assuming known music genres determine k?", "To explore where additional clusters give diminishing reduction in inertia", ["To prove one genre always equals one cluster", "To make every larger k automatically invalid", "To replace all feature measurements with class names"], "The elbow is an exploratory guide to a useful cluster count, not a semantic-label guarantee.", "#elbow-method"),
    ("reproducible", "kmeans-parameters", 3, "Which source parameter controls random centroid initialization for repeatable experiments?", "random_state", ["Only the legend's font size", "The CSV file's display title", "The silhouette score's decimal formatting"], "A fixed random state controls the initialization randomness.", "#exercise---build-a-model"),
])

add("415aa9bf5153db2f959b7f41", ML, "6-NLP/1-Introduction-to-NLP",
    "Language processing, parsing versus meaning, ELIZA's pattern responses and a deliberately limited conversational loop.", [
    ("natural", "nlp-language", 1, "What does natural language refer to here?", "Human spoken or written language", ["Only Python syntax", "Only numeric matrices", "Only a network protocol"], "NLP processes language people use to communicate.", "#computational-linguistics"),
    ("eliza", "nlp-pattern-bots", 1, "How did the described ELIZA produce many replies?", "Patterns, substitutions and keywords", ["By proving every user's statement true", "By personally experiencing the user's emotions", "By storing a complete human mind"], "A plausible response did not imply semantic understanding.", "#developing-eliza"),
    ("exit", "nlp-bot-control", 2, "In the planned bot loop, what happens when the user's exit command is recognized?", "The conversation loop ends", ["A random normal reply is mandatory before checking exit", "The exit command becomes a training label", "The bot must restart itself"], "The plan checks for exit before choosing a response.", "#the-plan"),
    ("random-limit", "nlp-pattern-bots", 3, "A bot returns a fluent random generic reply. What can this demonstrate?", "A conversational-looking response without proof of understanding", ["That the bot understood every earlier sentence", "That its response is factually reliable", "That a random choice is a semantic parser"], "The exercise explicitly separates an appearance of understanding from evidence of it.", "#exercise---coding-a-basic-conversational-bot"),
    ("sarcasm", "nlp-meaning-limits", 3, "A sentence's grammar is parsed correctly but its sarcasm is missed. What distinction does this illustrate?", "Recognizing structure differs from interpreting intended meaning", ["Parsing guarantees perfect emotion detection", "Sarcasm changes the file encoding", "All grammatical sentences have positive sentiment"], "The introduction identifies humor and sarcasm as difficult meaning problems.", "#how-is-this-technology-made-possible"),
    ("dictation", "nlp-language", 3, "A phone turns speech into text and then processes the command. Which two stages are described?", "Speech conversion followed by text processing", ["Text generation followed only by spelling correction", "Language translation followed by image classification", "Random response selection with no speech conversion"], "The dictation example separates conversion from subsequent parsing and response.", "#example---phone-dictation"),
])

add("7d7d7e40def35e4fbc555ad2", ML, "6-NLP/2-Tasks",
    "Tokenization, part-of-speech tags, lemmatization, frequencies and contiguous n-grams; distinguishes polarity from subjectivity.", [
    ("tokenize", "nlp-tokenization", 1, "What does tokenization do?", "Divides text into tokens", ["Assigns a guaranteed true sentiment", "Translates every language automatically", "Deletes every repeated word by definition"], "Tokens are units used for subsequent language processing.", "#tokenization"),
    ("pos", "nlp-structure", 1, "A tag identifies a token as a noun or verb. What information is this?", "Part of speech", ["Only its byte offset", "Its sentiment probability", "Its document's file size"], "POS tagging assigns grammatical categories.", "#parsing--part-of-speech-tagging"),
    ("lemma", "nlp-normalization", 2, "Which term describes reducing related inflected forms to a dictionary headword?", "Lemmatization", ["One-hot encoding a whole document", "Random sampling", "Sorting sentences by length"], "A lemma represents a word's dictionary form.", "#lemmatization"),
    ("bigrams", "nlp-ngrams", 3, "How many contiguous word bigrams are in 'bright stars guide sailors'?", "3", ["2", "4", "6"], "The sliding pairs are bright stars, stars guide and guide sailors.", "#n-grams"),
    ("frequency", "nlp-term-frequency", 3, "Ignoring case, how many times does blue occur in 'Blue sky blue sea'?", "2", ["1", "3", "4"], "The repeated term is counted twice after consistent case normalization.", "#word-and-phrase-frequencies"),
    ("trigram", "nlp-ngrams", 3, "Which is a contiguous trigram of 'small birds cross the river'?", "birds cross the", ["small cross river", "birds the river", "small birds"], "A trigram consists of three adjacent tokens.", "#n-grams"),
])

add("77ed081e085b28907dec5676", ML, "6-NLP/3-Translation-Sentiment",
    "Translation requires meaning/structure, parallel corpora, sentiment polarity/subjectivity and limitations of literal or word-list analysis; no claim that legacy TextBlob translation APIs still operate.", [
    ("parallel", "nlp-translation-data", 1, "What kind of material can expose translation patterns between two languages?", "Corresponding texts and human translations", ["Only unrelated random numbers", "Only one language's file extensions", "Only a list of image widths"], "Paired language material helps reveal translated phrases and structures.", "#machine-learning-approaches"),
    ("polarity", "nlp-sentiment-scales", 1, "On the described polarity scale, which value is most negative?", "-1", ["0", "1", "10"], "Polarity runs from -1 to 1.", "#exercise---sentimental-sentences"),
    ("subjectivity", "nlp-sentiment-scales", 2, "What does the described 0-to-1 subjectivity score measure?", "Objective versus subjective wording", ["The same quantity as negative-to-positive polarity", "Guaranteed factual correctness", "The number of words"], "Subjectivity is a separate scale from sentiment polarity.", "#exercise---sentimental-sentences"),
    ("word-order", "nlp-translation-meaning", 3, "Why can replacing each word while keeping the source language's order yield a poor translation?", "Languages can express the same meaning with different structures", ["Every language uses exactly the same word order", "A translated sentence must keep the same character count", "Meaning is determined only by the file's encoding"], "Translation must account for structure and idiomatic meaning.", "#translation"),
    ("sarcastic-praise", "nlp-sentiment-limits", 3, "A complaint says 'Wonderful, the lift failed again.' Why might a simple positive-word counter misread it?", "The positive word can be used sarcastically", ["Wonderful can never appear in a complaint", "Counting characters resolves sarcasm", "A word list has direct access to the author's intent"], "Context can reverse the implication of apparently positive wording.", "#sentiment-analysis"),
    ("held-out-messages", "nlp-sentiment-evaluation", 3, "After training on labeled opinion messages, which examples provide a useful evaluation?", "Messages not used in that training", ["Only the same messages with filenames changed", "Only the label names printed again", "Only messages selected because the model already got them right"], "The lesson proposes checking predictions against previously unused messages.", "#ml-approaches"),
])

add("4514033c9679049ba71da6f1", ML, "6-NLP/4-Hotel-Reviews-1",
    "Hotel-review data provenance/limitations, row versus aggregate scores, missing-text sentinels and grouped exploratory analysis; no stereotyping or sentiment inference from column names alone.", [
    ("row-score", "hotel-score-grain", 1, "What does Reviewer_Score describe?", "The score of that individual review", ["Always the mean of every hotel in the world", "A guaranteed sentiment-model output", "The number of words in the address"], "The source distinguishes review-level scores from hotel aggregates.", "#dataset"),
    ("sentinel", "hotel-missing-text", 1, "What does No Negative mean in the described dataset?", "The reviewer supplied no negative-review text", ["The hotel is proven flawless", "The review has a measured polarity of -1", "There are no reviews of the hotel"], "It is a missing-text placeholder, not evidence of perfect service.", "#dataset"),
    ("shape", "hotel-data-inspection", 2, "Which DataFrame property reports row and column counts?", "shape", ["Only the first value in Hotel_Name", "Only the average Reviewer_Score", "Only the CSV's filename"], "shape is the table's dimensional size.", "#dataframe-operations"),
    ("column-meaning", "hotel-sentiment-limits", 3, "A Positive_Review cell says 'Avoid this place.' Why must its actual text still be examined by the analysis?", "The field name does not guarantee the text's sentiment", ["The word Positive makes every sentence favorable", "A short review always expresses a neutral opinion", "A hotel's average score overrides the wording of every review"], "The source notes that reviewers can put negative content in the positive field and vice versa.", "#dataset"),
    ("average-scope", "hotel-score-grain", 3, "A provided hotel average differs from the mean of this dataset's review rows. What should an analyst investigate?", "Whether the two numbers summarize different underlying reviews", ["Assume their scopes must be identical", "Treat either number as a count of rooms", "Silently claim the provided average is independently verified"], "Different coverage and unavailable records can explain aggregate discrepancies.", "#average-hotel-score"),
    ("tag-order", "hotel-data-inspection", 3, "Tag lists vary in length and order. Can the first tag always be treated as the guest-group type?", "No; field meaning cannot be assumed from that position", ["Yes; the first item is standardized in every row", "Yes; every tag is a guest's nationality", "Only if the hotel score exceeds 8"], "The source explicitly warns that missing options shift tag positions.", "#tags"),
])

add("1fcb47b0e456d979ca226530", ML, "6-NLP/5-Hotel-Reviews-2",
    "Hotel tag indicators, grouped review means, sentiment placeholders and checking model/text disagreement; excludes claims that removing all stop words preserves sentiment.", [
    ("indicator", "hotel-tag-features", 1, "How is the Business_trip feature represented in the lesson?", "1 if that tag is present, otherwise 0", ["The hotel's price in euros", "Always the review's word count", "A random number for every run"], "The text tag is converted into a binary feature.", "#filtering-tags"),
    ("mean-by-hotel", "hotel-aggregate-features", 1, "Which grouping is needed to calculate a mean review score for each hotel?", "Group by Hotel_Name and average Reviewer_Score", ["Group by each character of the address", "Average the text review filenames", "Count the number of import statements"], "The aggregation must respect the hotel-level grouping.", "#exercise-a-bit-more-data-processing"),
    ("compound", "hotel-sentiment-values", 2, "Which VADER output does the shown calc_sentiment function store?", "compound", ["Only the row number", "Only the hotel ID", "Only the tag count"], "The function selects the compound sentiment value.", "#performing-sentiment-analysis"),
    ("missing-zero", "hotel-sentiment-values", 3, "For the exact placeholder No Positive, what value does the lesson's calc_sentiment explicitly return?", "0", ["1", "-1", "The current hotel average"], "This is the function's explicit placeholder convention, not proof that missing text is a neutral opinion.", "#performing-sentiment-analysis"),
    ("tag-match", "hotel-tag-features", 3, "A tag string contains Business trip but not With a pet. What are those two indicator values?", "Business_trip = 1, With_a_pet = 0", ["Business_trip = 0, With_a_pet = 1", "Both are 1", "Both are 0"], "Each indicator tests whether its own phrase is present.", "#filtering-tags"),
    ("sentiment-disagreement", "hotel-sentiment-evaluation", 3, "The sentiment analyzer rates a sarcastic complaint positively, while the reviewer gives a low score. What is appropriate?", "Investigate the mismatch and the analyzer's limits", ["Declare the reviewer's experience invalid automatically", "Assume every positive model output is correct", "Delete every low review score without examination"], "The lesson acknowledges that sarcasm and other mismatches can defeat the sentiment analyzer.", "#performing-sentiment-analysis"),
])

add("ca35af5340dc07e76eca1c36", ML, "7-TimeSeries/1-Introduction",
    "Time-ordered observations, univariate forecasts, trends, seasonal patterns and limited forecast horizons.", [
    ("ordered", "time-series-order", 1, "What organizes the observations in a time series?", "Their time order", ["Only alphabetical filenames", "Only predicted class names", "Only their rank after sorting by value"], "A time index preserves when observations occurred.", "#some-definitions"),
    ("univariate", "time-series-variables", 1, "A series tracks only electricity load over time. What kind of series is that?", "Univariate", ["A multiclass label set", "A collection with no measured variable", "A guaranteed causal model"], "Univariate forecasting focuses on one changing variable.", "#some-definitions"),
    ("trend", "time-series-patterns", 2, "A sustained increase in usage over several years illustrates what?", "A trend", ["Only one isolated outlier", "A categorical label", "A CSV delimiter"], "Trends describe measurable longer-term increases or decreases.", "#time-series-data-characteristics-to-consider"),
    ("seasonal", "time-series-patterns", 3, "Demand rises around the same holiday every year. Which characteristic is this?", "Seasonality", ["Random file ordering", "Proof there are no other influences", "A single nonrepeating typo"], "Seasonality is a repeating pattern at a regular period.", "#time-series-data-characteristics-to-consider"),
    ("future-input", "time-series-order", 3, "An application estimates tomorrow's load from observations available today. What task is this?", "Time series forecasting", ["Describing only an already observed value", "Randomly assigning every timestamp to a class", "Sorting the historical values without their dates"], "Forecasting predicts future values using earlier observations.", "#some-definitions"),
    ("hour-step", "time-series-horizon", 3, "For equally spaced hourly readings, one time step ahead means which time?", "The next hour", ["Always the next year", "The previous hour", "The largest recorded value regardless of time"], "The time-step unit comes from the series' sampling interval.", "#introduction"),
])

add("6e480609fa7263de12f2354d", ML, "7-TimeSeries/2-ARIMA",
    "Differencing, ARIMA orders, chronological splits, train-only scaling and walk-forward evaluation; excludes the source's inconsistent dates and forecast alignment.", [
    ("difference", "arima-differencing", 1, "What is first differencing of a sequence?", "Subtract each previous value from the current value", ["Sort all values and discard time order", "Multiply every timestamp by the mean", "Replace every value by its row number"], "Differencing examines changes between successive observations.", "#general-concepts"),
    ("d-order", "arima-parameters", 1, "What does d control in the ARIMA order (p, d, q)?", "The amount of differencing", ["The number of input CSV files", "The displayed decimal precision", "The number of forecast plots"], "d is associated with the integrated part.", "#implement-arima"),
    ("forecast-horizon", "arima-forecasting", 2, "For hourly data, forecast(steps=3) requests how many future time steps?", "3", ["1", "24", "The number of training rows"], "The horizon is the number of steps forecast ahead.", "#implement-arima"),
    ("difference-values", "arima-differencing", 3, "What are the first differences of [10, 13, 18]?", "[3, 5]", ["[10, 3, 5]", "[23, 31]", "[-3, -5]"], "Compute 13-10 and 18-13.", "#general-concepts"),
    ("chronological", "arima-evaluation", 3, "To imitate forecasting, where should the held-out test period lie relative to training?", "Later in time", ["Mixed into the training period with future information", "Only before all training observations", "At randomly renamed timestamps"], "The source explicitly guards against gaining information from future periods.", "#create-training-and-testing-datasets"),
    ("scaler-fit", "arima-preprocessing", 3, "After fitting MinMaxScaler on training load, how should the test load be scaled?", "Transform it with that fitted scaler", ["Fit a new scaler on the complete future test period", "Use the future test minimum to refit training", "Replace all test values by training labels"], "The shown sequence fits on training and reuses the resulting transformation.", "#prepare-the-data-for-training"),
])

add("d5aabaecb172aa8ce7253ddb", ML, "7-TimeSeries/3-SVR",
    "Continuous SVR targets, lag windows, chronological evaluation and inverse scaling; no claim that tuning on the test split is unbiased final testing.", [
    ("continuous", "svr-task", 1, "What type of output does SVR predict in this lesson?", "A continuous electricity-load value", ["Only a cuisine class", "Only a cluster ID", "Only an image filename"], "SVR is used for regression on load observations.", "#introduction"),
    ("rbf", "svr-kernel", 1, "Which kernel is configured in the displayed SVR model?", "rbf", ["The CSV's delimiter", "The target's column name", "The plotting palette"], "The estimator is instantiated with kernel='rbf'.", "#implement-svr-1"),
    ("inverse", "svr-scaling", 2, "Which scaler operation returns scaled predictions to original load units?", "inverse_transform", ["fit_transform on all test labels", "Only sorting predicted values", "Changing their string formatting"], "Inverse scaling makes predictions comparable in the original units.", "#evaluate-your-model-1"),
    ("window-target", "svr-lag-windows", 3, "With timesteps=5, the lesson uses the first four values of each window as inputs. Which value is its target?", "The fifth value", ["The first input repeated", "The average timestamp", "The dataset's filename"], "The final position follows the four preceding observations.", "#create-data-with-time-steps-1"),
    ("window-count", "svr-lag-windows", 3, "How many overlapping length-5 windows can be made from 8 successive observations?", "4", ["3", "5", "8"], "The valid starts are 0 through 3: 8-5+1 windows.", "#create-data-with-time-steps-1"),
    ("target-timestamps", "svr-time-alignment", 3, "A length-5 window begins at 09:00 with hourly samples. Which timestamp belongs to its fifth-value target?", "13:00", ["09:00", "12:00", "14:00"], "Four hourly steps separate the first observation from the fifth.", "#check-model-performance-on-training-and-testing-data-1"),
])

add("0131853a327944e9e99b399d", ML, "8-Reinforcement/1-QLearning",
    "States/actions, reward-driven policy, Q-table dimensions, exploration and a nonterminal Q update; avoids source terminal-update and obsolete NumPy defects.", [
    ("policy", "qlearning-policy", 1, "What does a policy determine for a given state?", "An action to take", ["Only the code editor's font", "Only the dataset's license", "A guarantee of winning every episode"], "The policy maps the current situation to behavior.", "#actions-and-policy"),
    ("reward", "qlearning-reward", 1, "What communicates the agent's goal numerically?", "The reward function", ["Only the action's spelling", "Only the board's image size", "The Python filename"], "Rewards guide learning toward desirable outcomes.", "#reward-function"),
    ("q-entry", "qlearning-values", 2, "What does one Q-table entry correspond to?", "A state-action pair's learned value", ["Only a state's filename", "A required probability that must always stay between 0 and 1", "The number of unrelated training datasets"], "Q values estimate action desirability in a state, not necessarily probabilities.", "#q-learning"),
    ("table-size", "qlearning-values", 3, "A board has 6 by 5 positions and 4 actions per position. How many Q entries are needed?", "120", ["30", "60", "15"], "Multiply positions by actions: 6*5*4.", "#q-learning"),
    ("exploration", "qlearning-policy", 3, "Why sometimes try actions other than the currently highest-valued one?", "To discover potentially better actions and states", ["To prove the current table is already optimal", "To eliminate all learning from experience", "To make every reward identical"], "Exploration balances exploitation of what is already known.", "#exploit-vs-explore"),
    ("nonterminal-update", "qlearning-update", 3, "For a nonterminal step, old Q=2, alpha=0.5, reward=1, gamma=0.9 and max next Q=4. What is the updated Q?", "3.3", ["4.6", "2.3", "5.3"], "(1-0.5)*2 + 0.5*(1+0.9*4) = 3.3.", "#learning-algorithm"),
])

add("e510c3148513e66df9d9e6d8", ML, "8-Reinforcement/2-Gym",
    "CartPole observations/actions, discretization, dictionary Q values and running averages. Legacy Gym API and stated solved thresholds are not certified.", [
    ("actions", "cartpole-contract", 1, "What are the two discrete actions in the described CartPole task?", "Move left or right", ["Choose any of five cuisine classes", "Set any real-valued image width", "Select an arbitrary text token"], "The cart moves in one of two directions to balance the pole.", "#exercise---initialize-a-cartpole-environment"),
    ("observation", "cartpole-contract", 1, "Which is part of the four-value observation?", "Pole angle", ["A cuisine label", "The model's Git branch", "The image's alt text"], "The vector includes cart position/velocity and pole angle/rotation rate.", "#exercise---initialize-a-cartpole-environment"),
    ("discretize", "cartpole-discretization", 2, "Why discretize continuous observations for a tabular Q method?", "To map measurements to discrete state keys", ["To change actions into human-written labels", "To remove the need for any reward", "To guarantee every possible state was visited"], "Discretization lets tabular values index approximate states.", "#state-discretization"),
    ("missing-entry", "cartpole-values", 3, "The helper uses Q.get((state, action), 0). What value is returned for an unseen pair?", "0", ["1", "The maximum value in every other state", "A mandatory exception"], "The second argument is the dictionary lookup's default.", "#the-q-table-structure"),
    ("state-count", "cartpole-discretization", 3, "Four observation dimensions have 3, 4, 2 and 5 bins. With 2 actions, how many entries would a full Q table have?", "240", ["120", "28", "480"], "There are 3*4*2*5 states, each with two action values.", "#the-q-table-structure"),
    ("running-mean", "cartpole-progress", 3, "Rewards [10, 20, 30, 40] are smoothed with a valid length-2 running mean. What results?", "[15, 25, 35]", ["[10, 20, 30, 40]", "[30, 50, 70]", "[25]"], "Each adjacent pair contributes its mean; valid mode excludes incomplete windows.", "#plotting-training-progress"),
])

add("55d0840db6a74d586bfd327f", ML, "8-Reinforcement",
    "Reinforcement learning's environment, actions, reward and delayed-outcome distinction; does not claim that all rewards occur only at episode end.", [
    ("agent", "rl-system", 1, "What learns how to act in reinforcement learning?", "An agent interacting with an environment", ["Only a static filename", "Only a fixed list of ground-truth actions", "Only a plotted axis"], "The learner experiments with actions and observes their effects.", "#reinforcement-learning"),
    ("environment", "rl-system", 1, "Why is a game simulator useful for this kind of learning?", "It permits repeated interactions under defined rules", ["It supplies a guaranteed best action for every possible state", "It removes the concept of state", "It guarantees that exploration cannot fail"], "The simulator defines states, actions and game dynamics.", "#example---computer-game"),
    ("reward-goal", "rl-objective", 2, "What tells the agent how its behavior is doing?", "A reward function", ["Only a shuffled list of filenames", "Only the display's color palette", "Only the number of installed packages"], "The reward encodes the goal used in learning.", "#example---computer-game"),
    ("not-action-labels", "rl-learning-distinction", 3, "A game has many states but no supplied correct-action dataset. Which approach does this introduction propose?", "Learn by playing and observing outcomes", ["Assume unseen states already have ground-truth action labels", "Use a file extension as the optimal action", "Treat any first move as universally correct"], "RL can learn behavior from interaction rather than a fixed labeled action table.", "#example---computer-game"),
    ("delayed-outcome", "rl-objective", 3, "A move gives no immediate win, but can enable a later victory. Why is considering later outcomes useful?", "A useful action may have delayed benefits", ["Only immediate visual changes can matter", "Every non-winning move is automatically a mistake", "A future outcome can never depend on an earlier action"], "The lesson motivates learning under delayed and uncertain outcomes.", "#example---computer-game"),
    ("supervised-comparison", "rl-learning-distinction", 3, "How does the described supervised-learning setup differ from the game-learning example?", "It supplies example inputs with corresponding target outputs", ["It never uses any data", "It necessarily has a simulator and reward instead of labels", "It always controls a physical robot"], "The introduction contrasts labeled supervised examples with interaction-driven learning.", "#reinforcement-learning"),
])

add("f73cafa52d6650012359482a", ML, "9-Real-World/1-Applications",
    "Matching the lesson's real-world application goals to anomaly detection, regression, NLP, forecasting and segmentation; no investment/medical advice or certified case-study outcomes.", [
    ("outlier", "ml-application-anomalies", 1, "What makes a credit-card transaction an anomaly candidate in the described example?", "Deviation from typical observed patterns", ["Its membership in any cluster proves fraud", "Its row number is odd", "A model's name contains fraud"], "An unusual transaction merits investigation; outlier status alone is not proof of fraud.", "#credit-card-fraud-detection"),
    ("energy", "ml-application-forecasting", 1, "Which task matches forecasting future energy use from smart-meter history?", "Time series forecasting", ["Only a file-format conversion", "Only translating article titles", "Only sorting images by filename"], "The energy example uses time-indexed observations for future demand.", "#-energy-management"),
    ("segments", "ml-application-grouping", 2, "Which method is discussed for finding customer groups used in differentiated marketing?", "Clustering", ["Only serializing a Python object", "Only drawing bounding boxes", "Only changing a web template"], "Segmentation groups customers by patterns relevant to the task.", "#customer-segmentation"),
    ("text-pipeline", "ml-application-nlp", 3, "A news-analysis system extracts text features before classifying articles. Which two stages are combined?", "NLP feature processing and supervised classification", ["Image resizing and pole balancing", "Only a model export and no prediction", "Only alphabetical sorting of filenames"], "The example combines language-derived features with classifiers.", "#fake-news-detection"),
    ("benchmark", "ml-application-regression", 3, "A study models a fund's measured performance relative to benchmark values. Which discussed approach fits that relationship?", "Statistical regression", ["Only a class-name dictionary", "Only browser caching", "Only next-word generation"], "The wealth-management example uses regression to study relationships; it does not guarantee future returns.", "#wealth-management"),
    ("intent", "ml-application-nlp", 3, "An online shop wants to interpret product-search queries. Which lesson example is most relevant?", "A query-intent engine using NLP", ["Only drawing an image's edges", "Only balancing a simulated pole", "Only calculating a CSV checksum"], "Language processing can help relate a customer's query to suitable results.", "#personalizing-the-customer-journey"),
])

add("93b2318d79f963858dd400fc", ML, "9-Real-World/2-Debugging-ML-Models",
    "Error/cohort analysis, data representation and local versus global feature explanations; explanations do not establish causal or legal compliance guarantees.", [
    ("error-analysis", "rai-error-distribution", 1, "Which component locates where model failures concentrate?", "Error Analysis", ["Only a file exporter", "Only a model download button", "Only a plot title"], "Error analysis examines failure patterns across data regions.", "#error-analysis"),
    ("cohort", "rai-cohort-comparison", 1, "What is a cohort in this debugging context?", "A subgroup of data selected for analysis", ["Always the full population of all future users", "Only the number of weights", "Only a random filename"], "Cohorts support comparisons among meaningful subsets.", "#model-overview"),
    ("local", "rai-model-explanations", 2, "What does a local feature explanation focus on?", "One particular prediction", ["Only the whole dataset's average behavior", "Only training duration", "Only the package version"], "The source contrasts an individual-case explanation with a global summary.", "#model-interpretability"),
    ("hidden-errors", "rai-cohort-comparison", 3, "Overall accuracy is high but a small cohort has a high error rate. What should the team examine?", "That cohort's performance and data distribution", ["Only repeat the global score", "Assume every subgroup has the same errors", "Hide the cohort because it is small"], "Aggregate scores can conceal concentrated failures.", "#model-overview"),
    ("underrepresented", "rai-data-representation", 3, "A rarely represented input group has many errors. Which action can data analysis help assess?", "Whether more suitable data should be collected for that group", ["Whether the group's records should always be erased", "Whether the model filename should be shorter", "Whether higher global accuracy proves adequate representation"], "The source connects representation analysis with targeted data collection.", "#data-analysis"),
    ("global", "rai-model-explanations", 3, "A reviewer asks which features most influence model behavior across the dataset. Which explanation scope fits?", "Global", ["Only one arbitrarily selected local case", "Only the final example's explanation treated as universal", "Only the selected subgroup's error count with no feature analysis"], "Global explanations summarize the model's broader feature influences.", "#model-interpretability"),
])

guide("650d1633208ac3bc22ff70dd", ML, "1-Introduction",
      "Module introduction, photographs, author credits and links to four substantive lessons. The teaching bodies are the linked pages, not this navigation page.",
      ["adbcf17f64d9f66e17f7ce82", "593b1f33ca4b39211c8eccd6", "3f9470d7f955bac6fe97bdfb", "8665cbcb49e8235c073ea410"])
guide("e0150a6104439992b3fd91fc", ML, "2-Regression",
      "Pumpkin-project/module overview with short motivation, videos and four lesson links. It does not contain the data-preparation or regression implementation bodies.",
      ["d4efc35e0bb394adf9e02a90", "89cd5bb2ed626c6062fa7c6a", "2b19a333828f0415582f2cc5", "80fa4d18046d23b6fffe27dc"])
guide("9ad1b600e41c8b66e609173a", ML, "3-Web-App",
      "Applied-ML project motivation, dataset attribution and a link to its actual Flask/model-serving lesson; not a separate instruction body.",
      ["44a5f55f2274d16ffaa8a4a8"])
guide("1121a67935e8f40c613b313b", ML, "4-Classification",
      "Cuisine project overview and four lesson links with credits. Classification implementation and evaluation are taught in the linked pages.",
      ["9932de14f2896338373bd21c", "444dada88136c9d89d3748b1", "1ff66fd8a070f3eb629997a8", "9d409b7e327d6e85d596caa5"])
guide("853f6cd5e85370015f2aa173", ML, "5-Clustering",
      "Music-clustering module introduction and dataset context followed by two instructional links. The clustering exploration and algorithm lessons have their own checks.",
      ["64194972db5d31954d2eab14", "68f07271e7cd3852c7c9b888"])
guide("dfdd34fd544e6f7c7b928edf", ML, "6-NLP",
      "NLP module overview with short field motivation and five lesson links; does not itself teach the linked bot, translation or review-analysis implementations.",
      ["415aa9bf5153db2f959b7f41", "7d7d7e40def35e4fbc555ad2", "77ed081e085b28907dec5676", "4514033c9679049ba71da6f1", "1fcb47b0e456d979ca226530"])
guide("d125ff2ef9ffefcf1f97be09", ML, "7-TimeSeries",
      "Electricity-forecasting module overview and three lesson links. Its instructional definitions, ARIMA and SVR bodies are separate resources.",
      ["ca35af5340dc07e76eca1c36", "6e480609fa7263de12f2354d", "d5aabaecb172aa8ce7253ddb"])
guide("0768f09431d653c0e0085fd7", ML, "9-Real-World",
      "Postscript module overview and two substantive lesson links; no independent experiment or implementation is taught on this index.",
      ["f73cafa52d6650012359482a", "93b2318d79f963858dd400fc"])

add("0c51048245d19180862ad9f3", AI, "lessons/1-Intro",
    "Task-specific AI, symbolic versus example-driven approaches, the Turing-test setup and hybrid systems. No assertions about present-day AGI status or consciousness.", [
    ("narrow", "ai-task-scope", 1, "What is task-specific or narrow AI designed for?", "A particular task or limited set of tasks", ["Every intellectual task by definition", "Only arithmetic with no other applications", "A guarantee of consciousness"], "The lesson distinguishes specialized systems from the broader general-intelligence idea.", "#weak-ai-vs-strong-ai"),
    ("symbolic", "ai-approaches", 1, "Which approach represents explicit knowledge and reasoning rules?", "The top-down symbolic approach", ["Only a raw image array", "Only random output selection", "Only physical hardware replacement"], "Symbolic reasoning encodes knowledge for explicit inference.", "#the-top-down-approach"),
    ("examples", "ai-approaches", 2, "What trains the neural-network approach described here?", "Examples supplied as training data", ["Only a manually specified rule for every input", "Only changing the model's filename", "A required human brain connected to each prediction"], "The bottom-up approach learns parameters from examples.", "#bottom-up-approach"),
    ("turing-scope", "ai-evaluation-limits", 3, "In the described Turing-test setup, which interaction does the interrogator assess?", "Text-based dialogue with a person and a computer", ["Only the machine's weight", "Only a GPU benchmark", "Only a list of network layer names"], "The test concerns whether dialogue responses can be distinguished in that setup.", "#the-definition-of-intelligence-and-the-turing-test"),
    ("hybrid", "ai-approaches", 3, "A voice assistant uses a neural model for speech and explicit logic to carry out commands. Which description fits?", "A hybrid of learned and explicit components", ["Proof that it contains no algorithms", "Purely random responses", "A system with no data processing"], "The lesson gives assistants as examples that combine approaches.", "#a-brief-history-of-ai"),
    ("demo-limit", "ai-task-scope", 3, "A program performs one image task extremely well. What further claim is not established by that result alone?", "That it can perform every unrelated intellectual task", ["That it achieved a result on that image task", "That the evaluated task has outputs", "That a task-specific system can be useful"], "Success in one domain does not demonstrate unrestricted general ability.", "#weak-ai-vs-strong-ai"),
])

add("d499068082f3cfa97d683053", AI, "lessons/2-Symbolic",
    "Machine-readable knowledge, OAV triplets, rule-engine components, forward/backward inference and ontologies; excludes inaccurate Python typing and URI examples.", [
    ("triplet", "symbolic-representation", 1, "Which structure represents an object, an attribute and a value?", "An OAV triplet", ["Only an image's width", "Only a random scalar", "Only an unstructured file suffix"], "The lesson uses triplets to represent relationships.", "#classifying-computer-knowledge-representations"),
    ("engine", "symbolic-system-parts", 1, "What applies suitable rules to the current facts?", "An inference engine", ["Only the knowledge-base filename", "Only the screen renderer", "Only the training-set row index"], "The engine orchestrates reasoning with the stored knowledge.", "#expert-systems"),
    ("ontology", "symbolic-ontology", 2, "What does an ontology formally describe?", "A problem domain's concepts and relationships", ["Only the model's serialized byte count", "Only a random list of examples", "Only a browser's color theme"], "Ontologies specify domain knowledge in a structured form.", "#ontologies-and-the-semantic-web"),
    ("forward", "symbolic-inference", 3, "Facts say rain is present; a rule says IF rain THEN use_cover. Starting from the facts to derive use_cover is what?", "Forward inference", ["Backward inference from a goal only", "Gradient descent", "Random resampling"], "Forward inference applies satisfied rules to known facts.", "#forward-vs-backward-inference"),
    ("backward", "symbolic-inference", 3, "A system begins with the goal use_cover and asks whether the conditions of rules proving it hold. Which method is this?", "Backward inference", ["Only sorting known facts alphabetically", "Only matrix multiplication", "Forward inference without considering a goal"], "Backward inference works from the desired conclusion toward supporting conditions.", "#forward-vs-backward-inference"),
    ("separation", "symbolic-system-parts", 3, "Why separate a knowledge base from its inference mechanism?", "Domain rules can change without rewriting the reasoning machinery", ["Every domain change must then be embedded in the engine's code", "The same rules must be copied into each interface handler", "Domain experts no longer need to specify any knowledge"], "The lesson emphasizes keeping domain knowledge separate from inference.", "#implementing-expert-systems"),
])

add("46a7e6a77b4dbc77f76db48a", AI, "lessons/3-NeuralNetworks/03-Perceptron",
    "Binary threshold models, feature/weight vectors, learning rate and the page's mathematical perceptron update; its broken Python snippet is explicitly excluded.", [
    ("binary", "perceptron-model", 1, "How many classes does the basic perceptron in this page distinguish?", "2", ["Exactly 10 in every use", "Only one fixed class", "An unlimited number with one binary output"], "The described model is a binary classifier.", "#perceptron-model"),
    ("threshold", "perceptron-model", 1, "Which activation is used in the page's basic model?", "A step or threshold function", ["Only a random-word generator", "A file-compression function", "Only a sorting algorithm"], "The weighted input is mapped to one of two outputs by a threshold.", "#perceptron-model"),
    ("learning-rate", "perceptron-training", 2, "What does eta represent in the stated update formula?", "The learning rate", ["The target's filename", "Only the number of pixels", "The final accuracy by definition"], "The learning rate scales the parameter update.", "#training-the-perceptron"),
    ("dot-output", "perceptron-computation", 3, "Weights are [2, -1] and input is [3, 4]. With output +1 for nonnegative dot product, what is the output?", "+1", ["-1", "6", "4"], "The dot product is 2*3-1*4=2, so the threshold gives +1.", "#perceptron-model"),
    ("update", "perceptron-training", 3, "Using w_new=w+eta*x*t for a misclassified example, w=[0,0], eta=0.5, x=[2,-4], t=+1. What is w_new?", "[1, -2]", ["[0, 0]", "[-1, 2]", "[2, 2]"], "Scale the input by 0.5*1 and add it to the old weights.", "#training-the-perceptron"),
    ("feature-length", "perceptron-computation", 3, "An input has four features. How many matching feature weights are needed for its dot product, excluding a separately handled bias?", "4", ["1", "2", "16"], "Each input feature contributes through its corresponding weight.", "#perceptron-model"),
])

add("911ffe1c58b8af2e5ba63de4", AI, "lessons/3-NeuralNetworks/03-Perceptron/lab",
    "The lab's taught one-versus-rest digit strategy, batched score computation and argmax selection; no invented accuracy or probability calibration.", [
    ("one-rest", "digit-one-vs-rest", 1, "What does the digit-3 binary classifier distinguish in the lab's strategy?", "Digit 3 versus all other digits", ["Only digit 3 versus digit 4", "Only handwritten versus printed text", "Every digit simultaneously with one binary label"], "One-versus-rest makes a binary target for each chosen digit.", "#hints"),
    ("classifier-count", "digit-one-vs-rest", 1, "How many binary perceptrons does the proposed strategy use for digits 0 through 9?", "10", ["2", "9", "100"], "There is one classifier for each of the ten digit classes.", "#hints"),
    ("argmax", "digit-score-selection", 2, "Which operation finds the index of the largest class score?", "argmax", ["sum", "mean", "The file's byte length"], "The hint uses argmax on the combined outputs.", "#hints"),
    ("scores", "digit-score-selection", 3, "Class scores for [0,1,2,3] are [-0.4, 0.2, 1.5, 0.6]. Which digit does argmax select?", "2", ["0", "1", "3"], "The maximum score, 1.5, belongs to digit 2.", "#hints"),
    ("matrix-output", "digit-matrix-contract", 3, "One image has F features and weights for 10 class scores. How many score values should the combined multiplication produce?", "10", ["F squared", "Only the single input image's ID", "No outputs until a confusion matrix is printed"], "The combined weights compute one score per digit classifier.", "#hints"),
    ("evaluation", "digit-evaluation", 3, "The lab asks for training and test accuracy plus a confusion matrix. Which report would omit essential requested evidence?", "Training accuracy alone", ["Both accuracies and the confusion matrix", "A matrix showing actual versus predicted classes", "A separate held-out accuracy result"], "The task requests evidence beyond how well the model fits training data.", "#task"),
])

add("ff54a82ff50edcbd568943b3", AI, "lessons/3-NeuralNetworks/04-OwnFramework",
    "Loss minimization, parameters, gradient descent, nonlinear layers and chain-rule backpropagation; distinguishes loss from accuracy.", [
    ("parameters", "mlp-parameters", 1, "Which values are varied during the shown neural-network optimization?", "Weights and biases", ["Only the file's extension", "Only the training labels' spelling", "Only the plot's axis names"], "The learnable parameters are the weights and biases.", "#formalization-of-machine-learning"),
    ("loss", "mlp-objective", 1, "What is the stated optimization goal?", "Minimize the loss by changing parameters", ["Maximize every error deliberately", "Keep all parameters fixed regardless of data", "Replace all labels by filenames"], "Loss measures prediction error for optimization.", "#formalization-of-machine-learning"),
    ("chain-rule", "mlp-gradients", 2, "What calculus rule underlies backpropagation through several layers?", "The chain rule", ["Only alphabetical ordering", "Only a majority vote", "Only random shuffling"], "The chain rule links derivatives through composed operations.", "#multi-layered-perceptrons-and-backpropagation"),
    ("gradient-step", "mlp-gradients", 3, "A weight is 3, the loss gradient is 4 and learning rate is 0.1. What does w_new=w-eta*gradient give?", "2.6", ["3.4", "0.4", "7"], "Gradient descent subtracts 0.1*4 from 3.", "#gradient-descent-optimization"),
    ("absolute-error", "mlp-objective", 3, "Predictions [2,5] have targets [1,7]. What is the sum of absolute errors?", "3", ["1", "5", "15"], "The absolute differences are 1 and 2.", "#formalization-of-machine-learning"),
    ("nonlinear", "mlp-composition", 3, "Which component between the shown linear layers enables a nonlinear input-output relationship?", "A nonlinear activation", ["Only a different variable name", "Only multiplying two linear layers without activation", "Only printing the weights"], "The model composes weighted transformations with a nonlinear activation.", "#multi-layered-perceptrons-and-backpropagation"),
])

add("297db38e16102576c4858f03", AI, "lessons/3-NeuralNetworks/05-Frameworks",
    "Tensor operations, automatic gradients, high/low-level API roles and detecting/mitigating overfitting; no framework popularity or universal fit-API claim.", [
    ("gradients", "nn-frameworks", 1, "Beyond tensor arithmetic, what capability does a neural-network framework provide for optimization?", "Computing gradients", ["Only changing fonts", "Only creating labels by hand", "A guarantee of zero validation error"], "Gradient computation supports parameter optimization.", ""),
    ("high-level", "nn-api-levels", 1, "What advantage does the described high-level API offer?", "Convenient construction from network layers", ["A guarantee that data preparation is unnecessary", "Only a file-renaming tool", "A ban on custom components"], "High-level APIs reduce routine network-construction work.", ""),
    ("overfit-signal", "nn-generalization", 2, "Which error pattern is a warning sign of overfitting?", "Low training error with high validation error", ["Both errors measured only on the same examples", "No evaluation at all", "A short model filename"], "A training-validation gap can reveal poor generalization.", "#how-to-detect-overfitting"),
    ("custom-loop", "nn-api-levels", 3, "A researcher needs unusual control over training while reusing standard layers. What combination does the lesson permit?", "High-level layers with a custom low-level training loop", ["Only one API level can ever be used in a project", "A standard fit call is mandatory even when it cannot express the needed control", "Every standard layer must be rewritten before any custom loop can be used"], "The APIs share underlying concepts and can be combined.", ""),
    ("stop-snapshot", "nn-generalization", 3, "Training error keeps falling while validation error begins rising. Which response fits the lesson?", "Consider stopping or preserving an earlier model snapshot", ["Declare the latest model best based only on training error", "Delete validation data to hide the rise", "Increase complexity without checking the result"], "Validation deterioration warns that continued fitting may harm generalization.", "#how-to-detect-overfitting"),
    ("reduce-complexity", "nn-regularization", 3, "A very flexible model fits a small noisy training set exactly but generalizes poorly. Which proposed response is reasonable to investigate?", "Reduce complexity, add suitable data or use regularization", ["Assume zero training error proves success", "Remove every held-out check", "Treat all noise as a rule to memorize"], "The source lists these as possible overfitting mitigations, not guaranteed fixes.", "#how-to-prevent-overfitting"),
])

add("1bd3c2667139203537686631", AI, "lessons/3-NeuralNetworks",
    "Supervised features/labels, classification/regression, tensor shape and weighted artificial-neuron computation; excludes the page's reversed biological axon/dendrite wording.", [
    ("features", "nn-input-output", 1, "What are measurable properties supplied in input examples called?", "Features", ["Only the predicted labels", "Only model losses", "Only output class names"], "The page represents each example as a feature vector.", "#machine-learning"),
    ("labels", "nn-input-output", 1, "What does Y hold in the described supervised setup?", "Corresponding target outputs", ["Only the input feature names", "Only random initialization seeds", "Only notebook filenames"], "Labels are the outputs used with the training examples.", "#machine-learning"),
    ("regression", "nn-task-types", 2, "Which task predicts a numeric amount rather than one of several classes?", "Regression", ["Classification by definition", "Only feature naming", "Only file compression"], "The lesson contrasts numerical regression with classification.", "#machine-learning"),
    ("input-matrix", "nn-tensor-shape", 3, "There are 12 samples and 4 features per sample. What is the input matrix shape?", "12 by 4", ["4 by 12", "12 by 12", "4 by 4"], "Rows are samples and columns are features.", "#machine-learning"),
    ("weighted-sum", "nn-neuron-model", 3, "An artificial neuron has inputs [1,3] and weights [2,4]. What sum reaches the activation before any bias?", "14", ["10", "24", "4"], "The sum is 1*2 + 3*4.", "#a-model-of-a-neuron"),
    ("image-class", "nn-task-types", 3, "A network chooses cat, dog or bird for an image. Which task type is this?", "Classification", ["Continuous-value regression", "Only reconstructing a timestamp", "Only computing an input checksum"], "The output is a discrete class among alternatives.", "#machine-learning"),
])

add("c7c56a433efa2ea3052c0a04", AI, "lessons/4-ComputerVision/06-IntroCV",
    "Image array dimensions, OpenCV color order, preprocessing and dense/sparse optical flow.", [
    ("array", "cv-image-representation", 1, "How can a grayscale image be represented in NumPy?", "A two-dimensional array of pixel values", ["Only one class-name string", "Only a list of folder names", "A scalar with no spatial information"], "Rows and columns represent the image's spatial dimensions.", "#loading-images"),
    ("color-order", "cv-color-conversion", 1, "What channel order does the lesson identify for ordinary OpenCV color loading?", "BGR", ["RGB in every case", "Only a grayscale channel", "Class-label order"], "OpenCV's BGR convention can differ from RGB display tools.", "#loading-images"),
    ("dense-flow", "cv-motion", 2, "Which optical-flow variant estimates a movement field for each pixel?", "Dense optical flow", ["Only sparse selected-feature tracking", "A histogram of filenames", "A single image's class label"], "The lesson contrasts per-pixel dense flow with sparse feature trajectories.", "#examples-of-using-computer-vision"),
    ("shape", "cv-image-representation", 3, "A color image is 80 pixels wide, 50 high and has 3 channels. What array shape follows the lesson's convention?", "(50, 80, 3)", ["(80, 50, 3)", "(3, 80, 50) under that convention", "(4000,) with no channels"], "The array orders height, width and channels.", "#loading-images"),
    ("channel-swap", "cv-color-conversion", 3, "An OpenCV BGR pixel is [10, 20, 30]. What is the same pixel in RGB order?", "[30, 20, 10]", ["[10, 20, 30]", "[20, 10, 30]", "[30, 10, 20]"], "Swap the blue and red channel positions.", "#loading-images"),
    ("document-perspective", "cv-preprocessing", 3, "A rectangular page was photographed at an angle, and four corner correspondences are known. Which described transform is appropriate?", "A perspective transformation", ["Only blurring while keeping the same geometry", "Only swapping BGR and RGB channels", "Only thresholding dark pixels without changing their positions"], "The lesson gives an angled document as an example of perspective correction.", "#image-processing"),
])

add("525ec3a4405c46204b09761b", AI, "lessons/4-ComputerVision/07-ConvNets",
    "Sliding local filters, learned feature hierarchies and the described CNN pyramid; excludes universal architecture or exact-accuracy claims.", [
    ("kernel", "cnn-local-filters", 1, "What is a convolutional kernel in this lesson?", "A small weight matrix applied across local image neighborhoods", ["Only the final cuisine label", "Only a whole-dataset average", "A different image filename at every location"], "A local filter slides across the image to detect patterns.", ""),
    ("edges", "cnn-local-filters", 1, "What low-level pattern can a suitable filter emphasize?", "An image edge", ["A guaranteed object's legal identity", "The author's intended caption", "The dataset's license text"], "The source illustrates horizontal and vertical edge filters.", ""),
    ("learned", "cnn-learned-features", 2, "Must every CNN filter be designed manually?", "No; filters can be learned during training", ["Yes; training cannot alter filters", "Yes; every filter must be a fixed caption", "Only if images are already classified perfectly"], "Learning useful filters is a central idea of CNNs.", "#main-ideas-behind-cnn"),
    ("hierarchy", "cnn-learned-features", 3, "Early filters respond to edges and later layers combine such features into parts. What does this illustrate?", "Hierarchical feature extraction", ["That all layers must see identical raw outputs only", "That later layers cannot combine information", "That every filter represents an entire object already"], "Higher-level patterns can be built from simpler earlier features.", "#main-ideas-behind-cnn"),
    ("pyramid", "cnn-architecture", 3, "In the described pyramid, spatial dimensions decrease toward the classifier. What generally happens to filter count?", "It increases in the described pattern", ["It must become zero after one layer", "It equals the filename length", "It is always exactly one in every CNN"], "The page describes shrinking spatial maps with richer feature channels.", "#pyramid-architecture"),
    ("location", "cnn-local-filters", 3, "Why apply a pattern detector across the image rather than at only one fixed coordinate?", "The same useful local pattern can occur at different locations", ["Every object always occupies the same pixel", "Image coordinates never matter to any task", "Every filter needs a new class name at each pixel"], "The introduction motivates recognizing patterns without fixing their absolute location.", ""),
])

add("e4fca6cf26190fda47db287a", AI, "lessons/4-ComputerVision/08-TransferLearning",
    "Reusing pretrained visual features, adding a task-specific classifier, resource-aware architecture choices and adversarial-image limits; no certified accuracy or domain-transfer guarantee.", [
    ("pretrained", "transfer-learning", 1, "What does this transfer-learning approach begin with?", "A model already trained on another dataset", ["Only a model filename with random unchanged weights", "A guarantee of perfect target labels", "A target dataset with no images"], "Previously learned representations provide a starting point.", ""),
    ("features", "transfer-feature-extraction", 1, "What can a pretrained CNN supply to a new classifier?", "Extracted image features", ["Only the source dataset's URL", "Guaranteed correct labels for all unseen domains", "Only a random sequence of class names"], "The new task can use representations learned from prior images.", "#pre-trained-models-as-feature-extractors"),
    ("mobile", "transfer-resource-choice", 2, "Which family is described as reduced in size for constrained/mobile settings?", "MobileNet", ["Only the largest possible VGG variant", "A CSV parser", "A sentiment lexicon"], "The page identifies model size and resource tradeoffs.", "#pre-trained-models-as-feature-extractors"),
    ("new-head", "transfer-feature-extraction", 3, "A pretrained feature extractor is reused for new animal categories. What task-specific component is added in the described approach?", "A classifier on the extracted features", ["Only a renamed image folder", "The old labels copied as guaranteed new predictions", "A rule that disables all feature computation"], "The page describes adapting the representation with a new classifier.", ""),
    ("domain-shift", "transfer-learning", 3, "A model learned from common photographs is tried on very different images. What should be checked?", "Whether the learned features transfer adequately to the new domain", ["Assume all image domains are identical", "Treat successful source training as proof of target accuracy", "Skip target evaluation because weights were pretrained"], "The challenge asks learners to examine transfer on dissimilar images.", "#-challenge"),
    ("adversarial", "transfer-model-limits", 3, "An optimized image strongly activates a cat prediction but looks like noise. What does that show?", "A high model score need not match a human-recognizable cat", ["The image is proven to depict a real cat", "All model outputs are random by definition", "Every cat image must look like noise"], "The source explains that many inputs can trigger a class without visually meaningful content.", "#visualizing-adversarial-cat"),
])

add("7d9a34064faa6f490016c776", AI, "lessons/4-ComputerVision/09-Autoencoders",
    "Encoder/decoder reconstruction, denoising pairs, super-resolution and VAE latent distributions; no universal superiority to PCA or perfect reconstruction claim.", [
    ("encoder", "autoencoder-structure", 1, "What does the encoder produce?", "A latent representation of the input", ["Only a random class name", "Always an exact pixel-for-pixel output image", "Only the target filename"], "The decoder uses this representation to reconstruct the input.", ""),
    ("decoder", "autoencoder-structure", 1, "What is the decoder trained to reconstruct in a basic autoencoder?", "The original input image", ["Only the image's filename", "An unrelated target label", "Only the training-loop counter"], "The input also supplies the reconstruction target.", ""),
    ("vae", "vae-latent-model", 2, "What does a VAE encoder predict in the described approach?", "Parameters of a latent probability distribution", ["Only a single hard class ID", "The exact training image's filename", "A guarantee of lossless compression"], "A latent vector is sampled from the predicted distribution.", "#variational-autoencoders-vae"),
    ("denoising", "autoencoder-applications", 3, "Which input-target pairing trains the denoising example?", "Noisy image as input, original clean image as target", ["Clean image as input, unrelated class name as target", "Only a filename as both input and target", "A noisy image with no reconstruction objective"], "The intended reconstruction removes artificially added noise.", "#scenarios-for-using-autoencoders"),
    ("super-resolution", "autoencoder-applications", 3, "Which pairing matches the described super-resolution training?", "Lower-resolution input and corresponding higher-resolution target", ["A high-resolution image and an unrelated sentiment label", "Two random unrelated images", "Only increasing the filename's character count"], "The model learns to reconstruct a higher-resolution version.", "#scenarios-for-using-autoencoders"),
    ("lossy", "autoencoder-limits", 3, "A compressed latent representation reconstructs a similar image with some detail lost. Is that necessarily a contradiction?", "No; the described representation can be lossy", ["Yes; every autoencoder guarantees bit-exact recovery", "Yes; images cannot have reconstruction errors", "Only if the decoder has no parameters"], "The page explicitly describes autoencoders as lossy and data-specific.", "#properties-of-autoencoders"),
])

add("3725a6a92e7b2dd17bc20532", AI, "lessons/4-ComputerVision/10-GANs",
    "Generator/discriminator roles, alternating updates, mode collapse and distinct content/style objectives; no guarantee that adversarial training converges.", [
    ("generator", "gan-roles", 1, "What does the generator take as input in the described basic GAN?", "A random latent vector", ["Only a true/fake label with no other input", "Only the discriminator's filename", "A required human-written rule per pixel"], "The generator maps latent input to a generated image.", ""),
    ("discriminator", "gan-roles", 1, "What task is given to the discriminator?", "Distinguish real training images from generated images", ["Always reconstruct the latent vector exactly", "Only count image filenames", "Generate every training label manually"], "It acts as a classifier in the adversarial setup.", ""),
    ("collapse", "gan-training-limits", 2, "What is mode collapse?", "Generating a narrow set of outputs instead of diverse examples", ["Perfect coverage of all output modes", "Only shrinking an image's display size", "Only converting a model to ONNX"], "The source describes a generator repeatedly producing a successful limited output.", "#problems-with-gan-training"),
    ("generator-step", "gan-training", 3, "During the shown generator update, which network's parameters are held fixed?", "The discriminator's", ["Both networks must stay fixed", "Only the random input filename", "The generator's while only the discriminator learns"], "Gradients guide the generator while discriminator parameters are not updated in that stage.", "#training-the-gan"),
    ("real-fake", "gan-training", 3, "The described discriminator convention uses 1 for real and 0 for generated. What target accompanies a generated training image for this stage?", "0", ["1", "Its pixel width", "A cuisine label"], "The discriminator is trained to recognize that generated example as fake.", "#training-the-gan"),
    ("style-content", "gan-style-transfer", 3, "In the separate style-transfer discussion, what distinguishes the two reference images?", "One supplies content and the other supplies style", ["Both must be the same file", "One is always a class-label CSV", "Both are discarded before defining any loss"], "The optimization balances content and style objectives, with smoothing as another term.", "#style-transfer"),
])

add("d78317785ba7cee2add3cbeb", AI, "lessons/4-ComputerVision/11-ObjectDetection",
    "Detection versus whole-image classification, box localization, IoU and model-family distinctions; no universal AP protocol claim.", [
    ("localization", "detection-task", 1, "What does object detection add to identifying an object's class?", "Its location in the image", ["Only a longer class name", "Only an image filename", "A guarantee that all pixels share the class"], "Detection predicts locations such as bounding boxes.", ""),
    ("iou", "detection-overlap", 1, "What ratio defines IoU for two regions?", "Intersection area divided by union area", ["Union divided by intersection", "Only the sum of their widths", "The number of predicted classes"], "IoU quantifies how much the regions overlap.", "#intersection-over-union"),
    ("identical", "detection-overlap", 2, "What is IoU for two identical nonempty boxes?", "1", ["0", "2", "The box's area in pixels"], "Their intersection and union have equal area.", "#intersection-over-union"),
    ("iou-number", "detection-overlap", 3, "Two boxes each have area 20 and their intersection has area 10. What is IoU?", "1/3", ["1/2", "2/3", "1"], "Union is 20+20-10=30, so IoU is 10/30.", "#intersection-over-union"),
    ("mean-ap", "detection-evaluation", 3, "AP values for two classes are 0.6 and 0.8 under the same protocol. What is their simple mean AP?", "0.7", ["1.4", "0.2", "0.48"], "Average the comparable class AP values: (0.6+0.8)/2.", "#mean-average-precision---map"),
    ("one-stage", "detection-approaches", 3, "Which family does the page describe as predicting classes and locations in one pass?", "YOLO, SSD and RetinaNet", ["Only a whole-image classifier with no localization", "Only the original per-tile naive search", "Only a class-name dictionary"], "These are contrasted with region-proposal approaches.", "#different-object-detection-approaches"),
])

add("b3c2877b36e14c3bc41e623f", AI, "lessons/4-ComputerVision/11-ObjectDetection/lab",
    "The Hollywood Heads annotation contract: XML objects, head boxes and multiple instances; no invented trained-model results.", [
    ("single-class", "head-detection-labels", 1, "What object class is annotated in the described dataset?", "head", ["A separate class for every person's name", "The entire movie's genre", "The camera's brand"], "Each annotated object is a head, even when several occur in one frame.", "#the-dataset"),
    ("format", "head-annotation-format", 1, "What accompanies each image in the shown PASCAL VOC-style format?", "An XML annotation description", ["Only a plaintext sentiment label", "Only a random action ID", "Only a model-weight file"], "The XML stores image metadata and object annotations.", "#the-dataset"),
    ("box-fields", "head-box-coordinates", 2, "Which fields specify the head's bounding box?", "xmin, ymin, xmax, ymax", ["Only width and depth of the whole image", "Only folder and database names", "Only a true/fake score"], "The bndbox element contains the location coordinates.", "#the-dataset"),
    ("two-objects", "head-detection-instances", 3, "An image annotation contains two object entries, both named head, with distinct boxes. What does it describe?", "Two head instances of the same class", ["Two different required object classes", "Only one head because the names match", "Two separate source datasets by definition"], "Object instances are distinguished by their entries and locations, not only class names.", "#the-dataset"),
    ("minimum-x", "head-box-coordinates", 3, "A box has xmin=12 and xmax=47. Which field identifies its left boundary in this annotation convention?", "xmin = 12", ["xmax = 47", "The image's depth", "The object's class name"], "The minimum X coordinate is the left side of the box.", "#the-dataset"),
    ("classification-limit", "head-detection-instances", 3, "A model reports only 'head present' for a frame with several heads. What required information is still missing for this detection task?", "The separate head locations", ["Only a higher confidence in the same image-level label", "Only another spelling of the head class", "Only the image's dimensions, with no object boxes"], "Counting and locating heads requires object detections, not just image-level presence.", "#task"),
])

add("8912ef2a4435e94decd28e50", AI, "lessons/4-ComputerVision/12-Segmentation",
    "Pixel classification, semantic/instance distinctions, mask outputs and class-oriented losses; not medical diagnosis or validated clinical performance.", [
    ("pixel", "segmentation-task", 1, "What prediction granularity distinguishes segmentation from bounding-box detection?", "A class for each pixel", ["Only a filename per image", "Only a single enclosing rectangle", "Only the total number of images"], "The output locates regions at pixel level.", ""),
    ("semantic", "segmentation-types", 1, "Does semantic segmentation distinguish two separate sheep as different instances?", "No; both can share the sheep class", ["Yes; every pixel must have a unique object identity", "Only if their filenames differ", "It never labels animal pixels"], "Instance segmentation adds distinctions among separate objects of the same class.", ""),
    ("decoder", "segmentation-network", 2, "What does the segmentation decoder produce from extracted features?", "A mask describing pixel classes", ["Only a random latent filename", "Only a whole-dataset row count", "A guarantee of clinical diagnosis"], "The mask encodes the predicted regions/classes.", ""),
    ("instance", "segmentation-types", 3, "An application must keep two people separate even where both have the person class. Which task fits?", "Instance segmentation", ["Semantic labeling alone with no instance identities", "Only whole-image person-present classification", "Only a single box enclosing both people without masks"], "Distinct objects of the same class require instance-level separation.", ""),
    ("mask-size", "segmentation-output", 3, "An output mask labels every pixel of a 64-by-48 image. How many pixel positions must receive labels?", "3072", ["112", "4096", "2304"], "There are 64*48 spatial positions.", ""),
    ("loss", "segmentation-loss", 3, "The output assigns one of several classes per pixel. Which loss family does the page use?", "Classification cross-entropy across pixels", ["Only error in the image's filename", "Only a contrast score unrelated to target masks", "Only a count of installed packages"], "The target is a pixel class rather than a reconstructed color value.", ""),
])

guide("5271c4919333ec50a98efba8", AI, "lessons/3-NeuralNetworks/04-OwnFramework/lab",
      "Practice assignment to compare MNIST networks of different depths and inspect training behavior. It poses empirical questions without supplying answers; the linked notebook is not a separately stored resource. No experimental outcomes or proficiency checks are invented.", kind="practice-guide")
guide("9ee3a81370b41cd4740ae735", AI, "lessons/3-NeuralNetworks/05-Frameworks/lab",
      "Practice brief assigning Iris and MNIST classification with different architectures. It points to a notebook but does not teach the implementations or establish their outcomes on this page.", kind="practice-guide")
guide("d210658de51d5920ed3d5b78", AI, "lessons/4-ComputerVision/06-IntroCV/lab",
      "Optical-flow practice brief with a video, movement-detection goal, optional tracking links and a notebook. It does not teach the flow algorithms on this page; the parent computer-vision lesson supplies instructional coverage.", kind="practice-guide")
guide("b5fab1e2354cb85bd0cbc30b", AI, "lessons/4-ComputerVision/07-ConvNets/lab",
      "Pet-face classification practice assignment, dataset download commands and a notebook link. Training implementation and results are not taught here. Its asserted breed count is not endorsed; no knowledge check is based on that potentially inaccurate metadata.", kind="practice-guide")
guide("d15644edf9b9b956e6618b9d", AI, "lessons/4-ComputerVision/08-TransferLearning/lab",
      "Oxford Pets transfer-learning practice brief and dataset-download instructions. The substantive transfer lesson is separately stored; this brief does not teach the classifier implementation or prove an accuracy result. Its asserted breed count is not endorsed.", kind="practice-guide")
guide("6086f4e27678b379699d4285", AI, "lessons/4-ComputerVision/12-Segmentation/lab",
      "Human-body-segmentation assignment, dataset link and starting notebook. It specifies a goal and related topics but does not teach a model implementation or demonstrate a trained outcome on this page.", kind="practice-guide")
guide("b91bb3ec6942f71f236cca82", AI, "lessons/4-ComputerVision",
      "Computer-vision module index containing links to seven substantive lessons and a sketchnote. Navigation is not assessed as computer-vision proficiency.",
      ["c7c56a433efa2ea3052c0a04", "525ec3a4405c46204b09761b", "e4fca6cf26190fda47db287a", "7d9a34064faa6f490016c776", "3725a6a92e7b2dd17bc20532", "d78317785ba7cee2add3cbeb", "8912ef2a4435e94decd28e50"])
guide("5926ac09c5ed8e719c452a6c", AI, "lessons/5-NLP/15-LanguageModeling/lab",
      "Skip-gram practice assignment with corpus-download code and open-ended questions about embeddings. It asks the learner to modify a linked notebook; it does not provide results or a self-contained model-training explanation to assess here.", kind="practice-guide")
guide("ecb8ebc1b6fdb12650dbefd3", AI, "lessons/5-NLP/17-GenerativeNetworks/lab",
      "Very short practice brief asking for a word-level generator trained on a book. It contains a corpus link but no instructional algorithm, worked code or results; generating six knowledge checks from it would overstate its content.", kind="practice-guide")

add("08c8de199e82fb31fc61c6c4", AI, "lessons/5-NLP/13-TextRep",
    "Vocabulary/token IDs, one-hot dimensions, bag-of-words counts, TF-IDF motivation and order loss.", [
    ("vocabulary", "text-token-vocabulary", 1, "What maps text tokens to numeric IDs in the described representation?", "A vocabulary", ["Only the output class name", "Only the font's color", "Only the number of articles"], "The vocabulary associates tokens with numerical indices.", "#representing-text"),
    ("one-hot", "text-one-hot", 1, "With a vocabulary of 6 tokens, how long is one token's one-hot vector?", "6", ["1", "36", "Its number of letters"], "There is one coordinate for each vocabulary entry.", "#representing-text"),
    ("bow", "text-bag-of-words", 2, "What does summing token one-hot vectors represent?", "Token occurrence counts", ["The exact original token order", "A guaranteed semantic interpretation", "Only the article's date"], "The resulting vector counts vocabulary tokens in the text.", "#bag-of-words-and-tfidf"),
    ("count-vector", "text-bag-of-words", 3, "Vocabulary order is [red, blue, green]. What bag-of-words vector represents 'red blue red'?", "[2, 1, 0]", ["[1, 1, 1]", "[1, 2, 0]", "[0, 1, 2]"], "Count each token in the specified vocabulary order.", "#bag-of-words-and-tfidf"),
    ("order-loss", "text-representation-limits", 3, "Do 'dogs chase cats' and 'cats chase dogs' have the same simple bag-of-words counts?", "Yes; the counts omit word order", ["No; counts encode every grammatical relationship", "No; one-hot summation preserves all positions", "Only if both strings have the same filename"], "The same tokens can convey different meaning when reordered.", "#conclusion"),
    ("common-terms", "text-tfidf", 3, "Why reduce the weight of a word that occurs in nearly every document?", "It may carry little information for distinguishing documents", ["Every common word is always a spelling mistake", "It proves every document has the same meaning", "Its frequency guarantees it is the target label"], "TF-IDF adjusts term importance using collection-wide document frequency.", "#bag-of-words-and-tfidf"),
])

add("e4c6fcd7da2e00369091132a", AI, "lessons/5-NLP/14-Embeddings",
    "Dense token embeddings, lookup dimensions, aggregation and static/contextual limitations. The page's reversed skip-gram sentence is excluded and flagged.", [
    ("dense", "embedding-representation", 1, "What representation does an embedding layer produce for a token ID?", "A dense vector of the configured size", ["Only its original spelling", "A one-hot vector that must be vocabulary-sized", "A guaranteed true class label"], "Embeddings map token IDs into learned vector representations.", ""),
    ("size", "embedding-representation", 1, "An embedding layer has embedding_size=8. How many components does one token's output vector have?", "8", ["The token's letter count", "Always the full vocabulary size", "64"], "The configured embedding size determines its vector dimension.", ""),
    ("aggregate", "embedding-aggregation", 2, "Which operation is mentioned for combining token embeddings into one text vector?", "An aggregate such as sum or average", ["Only renaming the document", "Only choosing the final class label manually", "Always adding a new vocabulary entry per character"], "The embedding-bag model aggregates token vectors.", ""),
    ("mean-vector", "embedding-aggregation", 3, "Two embeddings are [2,4] and [4,8]. What is their componentwise average?", "[3, 6]", ["[6, 12]", "[2, 2]", "[4, 8]"], "Average corresponding coordinates: (2+4)/2 and (4+8)/2.", ""),
    ("polysemy", "embedding-context", 3, "A static embedding gives bank one vector for both a river bank and a financial bank. What limitation does this illustrate?", "Different word senses share the same static representation", ["Every context automatically receives a separate vector", "The word cannot be represented numerically", "One-hot IDs guarantee semantic disambiguation"], "The page motivates contextual embeddings with this kind of ambiguity.", "#contextual-embeddings"),
    ("vocabulary-match", "embedding-pretraining", 3, "Pretrained vectors and an application's vocabulary differ. What must integration account for?", "Matching token identities and handling missing vocabulary entries", ["Assume every vocabulary uses identical numeric IDs", "Treat any vector row as the correct word", "Discard all input text because a pretrained model exists"], "The source warns that pretrained and task vocabularies may differ.", "#semantic-embeddings-word2vec"),
])

add("41ba0936bb2829fd45bbcaac", AI, "lessons/5-NLP/15-LanguageModeling",
    "Self-derived token-prediction targets, CBoW/skip-gram directions and preceding-token language modeling; no training or quality claims.", [
    ("mask-target", "language-model-targets", 1, "When a word is masked from existing text, what supplies its prediction target?", "The original word before masking", ["Only a random unrelated class name", "The text file's creation date", "A human must invent an unrelated target"], "The text itself supplies the missing-token target.", ""),
    ("cbow", "word2vec-directions", 1, "What does CBoW predict from surrounding words?", "The middle word", ["Only the text's filename", "The alphabet size", "The document's byte count"], "The context supplies the inputs and the center token is the target.", "#training-embeddings"),
    ("skipgram", "word2vec-directions", 2, "What does the page's skip-gram description predict from a center token?", "Neighboring context tokens", ["The center token from all its neighbors", "Only the number of paragraphs", "Only the model's layer count"], "Skip-gram reverses the CBoW input-target direction.", "#training-embeddings"),
    ("cbow-example", "word2vec-directions", 3, "In the window [calm, blue, sea], sea and calm are context for a center-token CBoW task. Which target is being predicted?", "blue", ["calm", "sea", "The whole file's title"], "The middle position is blue.", "#training-embeddings"),
    ("skip-example", "word2vec-directions", 3, "For the same three-token window, which input-target direction is skip-gram?", "Input blue, targets calm and sea", ["Inputs calm and sea, target blue", "Input the file path, target all model weights", "Input a class label, target its row index"], "The center predicts neighbors in the described skip-gram task.", "#training-embeddings"),
    ("preceding", "language-model-context", 3, "A model predicts the next token from the previous three tokens. Which context is available for that prediction?", "The three preceding tokens", ["Only the future answer token itself", "Every future token as though already observed", "Only the document's font name"], "The source's preceding-token model uses earlier context to predict what follows.", "#training-embeddings"),
])

add("cb2e525fedcd48a5178d3997", AI, "lessons/5-NLP/16-RNN",
    "Sequential hidden state, shared recurrent weights, bidirectionality and long-range gradient difficulty; excludes incorrect LSTM output-state and GRU-expansion wording.", [
    ("state", "rnn-sequence-state", 1, "What is passed onward with the next input token in the described recurrent model?", "A hidden/state vector", ["Only a filename", "Only the final class-name dictionary", "An unrelated image's dimensions"], "State carries information from earlier sequence positions.", ""),
    ("shared", "rnn-parameters", 1, "Do the unrolled time-step blocks use independent parameter sets by default in this RNN?", "No; the recurrent weights are shared across steps", ["Yes; each token always creates a separate trained network", "Only the first step has weights", "The file's line number selects all weights"], "The same recurrent cell is applied through the sequence.", ""),
    ("bidirectional", "rnn-directions", 2, "What does a bidirectional recurrent network process?", "The input sequence in both directions", ["Only two unrelated files", "Only a single scalar without sequence context", "Only alternating class names"], "The two directions capture information from opposite ends of the available sequence.", "#bidirectional-and-multilayer-rnns"),
    ("scalar-cell", "rnn-cell-computation", 3, "Before activation, a scalar cell computes W*x + H*s + b. With W=2, x=3, H=4, s=1 and b=-1, what is the value?", "9", ["10", "5", "24"], "2*3 + 4*1 - 1 = 9.", "#anatomy-of-an-rnn-cell"),
    ("long-range", "rnn-gradient-limits", 3, "Why can vanishing gradients hinder a basic RNN learning relationships between distant tokens?", "Error signals can become too small across many recurrent steps", ["Every distant token is necessarily irrelevant", "The vocabulary can contain only one token", "It guarantees that all gradients grow without bound"], "The source introduces gated architectures to help with long-range dependencies.", "#long-short-term-memory-lstm"),
    ("stacked", "rnn-composition", 3, "In a multilayer recurrent network, what can feed a later recurrent layer?", "Outputs from the preceding recurrent layer", ["Only the filename's characters", "Only a separate manually written class answer", "Only the final loss after training has ended"], "Stacking layers can combine lower-level sequence patterns into richer ones.", "#bidirectional-and-multilayer-rnns"),
])

add("9fd2c134937e8547b0a1c9c0", AI, "lessons/5-NLP/17-GenerativeNetworks",
    "Sequence input/output patterns, prompt-conditioned recurrent generation, sampling and repetition limits.", [
    ("one-many", "generation-sequence-shapes", 1, "An image supplies one input and a model generates a caption's word sequence. Which pattern fits?", "One-to-many", ["Many-to-one", "One-to-one only", "No-input/no-output"], "A single image representation conditions a sequence of outputs.", ""),
    ("many-one", "generation-sequence-shapes", 1, "A sentence is processed to return one category. Which pattern fits?", "Many-to-one", ["One-to-many", "One-to-one for the entire token stream", "A sequence with no output"], "Several input tokens contribute to a single classification result.", ""),
    ("prompt", "generation-context", 2, "What initializes the recurrent generation context during the described inference?", "A prompt passed through the recurrent cells", ["Only the model filename's extension", "Only an arbitrary target-class ID", "Only a count of installed libraries"], "The prompt builds an intermediate state before new characters are generated.", ""),
    ("feedback", "generation-context", 3, "After generating one character, what is used to continue the described recurrent process?", "The generated character and updated state", ["Only the first character forever with no state updates", "The true future target unavailable at inference", "Only the text file's creation date"], "Generated output and recurrent state support the next step.", ""),
    ("greedy-limit", "generation-sampling", 3, "Always choosing the highest-probability character produces repeated cycles. What alternative does the lesson discuss?", "Sample from the model's character distribution", ["Assume argmax guarantees meaningful text", "Discard all context and report a training label", "Treat every probability as identical without a sampling rule"], "Sampling can introduce alternatives; it does not guarantee quality.", "#soft-text-generation-and-temperature"),
    ("temperature", "generation-sampling", 3, "What does temperature adjust in the described sampling process?", "How peaked or flat the probability distribution is", ["The physical GPU temperature directly", "Only the text's font size", "The number of source-code comments"], "Changing the distribution alters the amount of randomness in selection.", "#soft-text-generation-and-temperature"),
])

add("07e15a8774b6359d837912eb", AI, "lessons/5-NLP/18-Transformers",
    "Attention weighting, positional information, self-attention/multiple heads and transfer from pretrained BERT; no universal count of attention sublayers.", [
    ("attention", "transformer-attention", 1, "What does attention vary when generating an output?", "The contributions of available contextual vectors", ["Only the filename's capitalization", "The true label after prediction is complete", "Only the file's byte encoding"], "Attention weights contextual information relevant to an output.", ""),
    ("positions", "transformer-position", 1, "Why add positional information to token representations?", "So their places in the sequence are represented", ["To make every token's meaning independent of order", "To replace all token identities with one constant", "To remove every attention operation"], "Position information complements the token embeddings.", "#positional-encodingembedding"),
    ("self", "transformer-attention", 2, "What does self-attention relate in the described text model?", "Positions within the same sequence", ["Only two unrelated model filenames", "Only an image's width and height", "Only output labels after training has ended"], "Tokens can use context from other positions of that sequence.", "#multi-head-self-attention"),
    ("weighted-context", "transformer-attention", 3, "Context vectors [2,0] and [0,4] receive weights 0.25 and 0.75. What is their weighted sum?", "[0.5, 3]", ["[2, 4]", "[1.5, 1]", "[0.25, 0.75]"], "Multiply each vector by its weight and add componentwise.", ""),
    ("multiple-heads", "transformer-multihead", 3, "Why use several attention heads instead of assuming one relationship type is sufficient?", "Different heads can learn different dependencies", ["Each head must represent a different output filename", "All heads are forced to have identical attention weights", "One head per token guarantees factual correctness"], "The lesson gives several kinds of relationships as motivation for multiple heads.", "#multi-head-self-attention"),
    ("bert-transfer", "transformer-pretraining", 3, "BERT is pretrained using text-derived objectives, then adapted using task data. Which idea connects the stages?", "Transfer learning", ["Training every task only from random weights by definition", "Treating all future task labels as pretraining inputs", "Only serializing a filename"], "Pretraining representations can be specialized for downstream tasks.", "#bert"),
])

add("c7731f3e10ba22ac11b6fbc7", AI, "lessons/5-NLP/19-NER",
    "Named spans, intent versus entity parameters and BIO token labels for multi-token entities.", [
    ("entity", "ner-task", 1, "What can NER identify within a sentence?", "A location, person, date or other named entity", ["Only the whole document's byte count", "Only a random model ID", "Only its positive/negative score"], "NER locates and types entity spans in text.", ""),
    ("token", "ner-token-classification", 1, "At what level does the described NER model assign BIO labels?", "Tokens", ["Only entire files", "Only one label for the whole vocabulary", "Only neural-network layers"], "The page formulates NER as token classification.", "#ner-as-token-classification"),
    ("outside", "ner-bio", 2, "What does O mean in the described BIO scheme?", "Outside the entity spans", ["The first token of every entity", "The last token of every sentence", "Only an unknown file type"], "B marks beginnings, I continuations and O other tokens.", "#ner-as-token-classification"),
    ("two-token-place", "ner-bio", 3, "New Harbor is one location entity spanning two tokens. Which BIO tags fit?", "B-LOC, I-LOC", ["I-LOC, B-LOC", "B-LOC, O", "O, O"], "The first token begins the entity and the second continues it.", "#ner-as-token-classification"),
    ("adjacent", "ner-bio", 3, "Two adjacent tokens are separate one-token person entities. Which tags preserve the boundary?", "B-PER, B-PER", ["B-PER, I-PER", "I-PER, I-PER", "O, I-PER"], "Each new entity begins with B even when it touches another entity of the same type.", "#ner-as-token-classification"),
    ("intent-slot", "ner-task", 3, "A request asks for weather in Harbor City. Intent classification selects weather. What does NER contribute?", "The location parameter Harbor City", ["Only a duplicate copy of the weather intent", "A single sentiment label for the whole request", "A translation of the complete request with no extracted parameter"], "The lesson distinguishes the action/intent from entity values filling its parameters.", "#example-of-using-ner"),
])

add("7c8a05902f3cd828d79eedda", AI, "lessons/5-NLP/19-NER/lab",
    "The medical-entity annotation contract: character spans, entity/ontology types, BIO class counts and subword alignment; no medical interpretation or runtime endorsement of the shown loading call.", [
    ("types", "medical-ner-labels", 1, "Which entity types are described for BC5CDR in the lab?", "Diseases and chemicals", ["Only document filenames", "Only hotel ratings", "Only image bounding boxes"], "The dataset annotations identify those two kinds of text entities.", "#the-dataset"),
    ("offsets", "medical-ner-spans", 1, "What do an entity's beginning and end positions identify?", "Its character span in the combined text", ["Only the model's parameter count", "Only its row's predicted probability", "Only the article's publication year"], "The source describes offsets within the title-plus-abstract text.", "#the-dataset"),
    ("ontology", "medical-ner-identifiers", 2, "What additional information does the annotation's ontology ID supply?", "An identifier for the entity in a domain ontology", ["A guaranteed medical recommendation", "The token's vector dimension", "Only the source file's extension"], "The ID links the recognized mention to a structured concept system.", "#the-dataset"),
    ("bio-count", "medical-ner-labels", 3, "With two entity types and B/I labels for each plus O, how many token classes are needed?", "5", ["2", "3", "4"], "There are 2*2+1 BIO classes.", "#the-network"),
    ("token-alignment", "medical-ner-spans", 3, "A tokenizer splits one annotated word into multiple subword tokens. What must the training conversion handle?", "Alignment between the annotated span and the resulting token labels", ["Assume every word always produces exactly one token", "Discard every entity with multiple characters", "Use the filename as each token's gold label"], "The lab explicitly requires taking model tokenization into account when constructing BIO labels.", "#the-network"),
    ("domain-pretraining", "medical-ner-model-choice", 3, "Why does the lab consider a biomedical-text pretrained encoder?", "Its pretraining domain is relevant to the target text", ["It guarantees every downstream prediction is clinically correct", "It eliminates the need for labeled NER data", "It turns every task into image classification"], "Domain relevance is a model-selection rationale, not a performance guarantee.", "#the-network"),
])

add("45e7b6b08a82e12efed49d33", AI, "lessons/5-NLP/20-LangModels",
    "Conditional next-token prediction, zero/few-shot examples, prompt instructions and perplexity. The unsupported GPT-4 parameter-count table is excluded and flagged.", [
    ("conditional", "llm-generation", 1, "What conditions the described next-token probability?", "The preceding token context", ["Only the future token supplied as the answer", "Only the text file's suffix", "A guarantee that every statement is true"], "The language model predicts what follows given earlier tokens.", "#text-generation-and-perplexity"),
    ("prompt", "llm-prompts", 1, "What is a prompt in the described workflow?", "Input instructions or context supplied to the model", ["Only the final hidden parameter file", "Only a measured accuracy score", "A guarantee of successful task completion"], "Prompts describe or demonstrate the desired task.", "#prompt-engineering"),
    ("perplexity", "llm-evaluation", 2, "All else equal on the same tokenized test corpus, which perplexity is preferable?", "Lower perplexity", ["Higher perplexity in every comparison", "A longer filename", "More output capitalization"], "Lower perplexity reflects higher likelihood of that evaluation text under the model.", "#text-generation-and-perplexity"),
    ("zero-shot", "llm-task-examples", 3, "A prompt gives an instruction but no labeled demonstrations of the task. Which setting is this?", "Zero-shot", ["Few-shot with two examples", "Supervised fine-tuning by definition", "A guarantee of perfect generalization"], "Zero-shot use does not provide task demonstrations in the prompt.", "#conclusion"),
    ("few-shot", "llm-task-examples", 3, "A prompt shows three labeled input-output examples before a new input. What is this use called?", "Few-shot prompting", ["Zero-shot prompting", "Necessarily updating all model weights", "A final held-out metric by itself"], "Examples in the prompt demonstrate the desired mapping without necessarily changing weights.", "#conclusion"),
    ("perplexity-number", "llm-evaluation", 3, "For a two-token test sequence with joint probability 0.25, what is perplexity using (1/P)^(1/N)?", "2", ["4", "0.5", "0.25"], "The square root of 1/0.25 is 2.", "#text-generation-and-perplexity"),
])

add("60ee3f7735dc148a75646c04", AI, "lessons/5-NLP",
    "NLP task distinctions, aspect-level sentiment, entity extraction, variable-length sequence context and summarization; sentiment can be classification or regression depending on its target.", [
    ("intent", "nlp-task-selection", 1, "Which task identifies what action a user's request is asking for?", "Intent classification", ["Only counting image pixels", "Only serializing weights", "Only listing file extensions"], "The overview describes intent as a classification target for requests.", ""),
    ("summary", "nlp-task-selection", 1, "Which task condenses a long text into a shorter account?", "Text summarization", ["Only optical flow", "Only bounding-box regression", "Only checking a CSV delimiter"], "Summarization represents important content in fewer words.", ""),
    ("entity", "nlp-task-selection", 2, "A system extracts a city and a date from a travel request. Which task fits?", "Named entity recognition", ["Only whole-document sentiment", "Only image reconstruction", "Only model compression"], "NER identifies typed spans such as locations and dates.", ""),
    ("aspects", "nlp-aspect-sentiment", 3, "A review praises food but criticizes service. Which analysis preserves both judgments by subject?", "Aspect-based sentiment analysis", ["A single score assumed to describe every aspect equally", "Only identifying the restaurant's name", "Only classifying the review's overall topic as restaurants"], "The overview distinguishes sentiment about parts/aspects from one whole-text judgment.", ""),
    ("sequence-length", "nlp-sequence-data", 3, "Why should text preprocessing account for sequence length?", "Sentences can contain different numbers of tokens", ["Every sentence necessarily contains exactly ten words", "Text has no ordering", "A token's ID is always its sentence's length"], "The source contrasts variable-length text with fixed-shape image inputs.", ""),
    ("negation-context", "nlp-sequence-context", 3, "Not and like are separated by several descriptive words. What capability can help interpret the sentence?", "Modeling dependencies across separated sequence positions", ["Assuming only adjacent words can relate", "Discarding every negation without checking its effect", "Sorting words alphabetically before every interpretation"], "The source motivates sequence models with relationships spanning multiple words.", ""),
])

add("719503d74361a99df21f8afb", AI, "lessons/6-Other/21-GeneticAlgorithms",
    "Candidate encodings, fitness, crossover/mutation and the page's explicitly minimizing example; no guarantee of global optimality.", [
    ("gene", "ga-representation", 1, "What does a gene encode in the described optimization?", "A candidate solution", ["Only a final test metric", "Only a plot's color", "A mandatory natural-language sentence"], "The representation must describe a valid candidate for the problem.", ""),
    ("fitness", "ga-selection", 1, "What evaluates how good a candidate is for the chosen objective?", "A fitness function", ["Only its filename's length", "Only a random display title", "Only the source-code indentation"], "Fitness guides selection among candidates.", ""),
    ("crossover", "ga-variation", 2, "What does crossover combine in this description?", "Two parent candidate encodings", ["Only a score and a plot title", "Every dataset without an encoding", "Only one fixed random seed"], "A valid crossover operation combines encoded solutions.", ""),
    ("minimizing", "ga-selection", 3, "The page's example defines smaller fitness as better. Between fitness values 3 and 8, which candidate is preferred under that convention?", "The candidate with fitness 3", ["The candidate with fitness 8", "Both must have identical fitness", "Neither can be compared numerically"], "This example minimizes its objective; other formulations may use different conventions.", ""),
    ("mutation", "ga-variation", 3, "A population keeps producing very similar candidates. What role can mutation play?", "Introduce changes that explore other candidate solutions", ["Guarantee the current solution is globally optimal", "Make the fitness function unnecessary", "Prevent every future candidate from changing"], "The source motivates mutation as a way to diversify the search.", ""),
    ("integer-candidate", "ga-representation", 3, "For a+2b+3c+4d=30, does candidate [a,b,c,d]=[2,2,4,3] satisfy the equation?", "Yes; its weighted sum is 30", ["No; its weighted sum is 20", "No; its weighted sum is 32", "It cannot be checked without training a model"], "Substitution gives 2+4+12+12=30.", "#assignment-diophantine-equation"),
])

add("22a7bac053135218fc65a910", AI, "lessons/6-Other/22-DeepRL",
    "Interaction, policy probabilities, exploration and actor/critic roles; excludes obsolete Gym calls and the source's misleading reward-discount wording.", [
    ("policy", "deep-rl-policy", 1, "What does the modeled policy determine?", "Which action to take, possibly through action probabilities", ["Only the file extension", "Only the true next-state label supplied in advance", "The number of installed notebooks"], "The policy chooses behavior from the current state.", "#cartpole-balancing"),
    ("actor", "deep-rl-actor-critic", 1, "Which actor-critic component represents the policy?", "Actor", ["Critic", "Only the replay filename", "Only the environment's display window"], "The actor proposes actions.", "#actor-critic-algorithm"),
    ("critic", "deep-rl-actor-critic", 2, "What does the critic estimate in the described state-value setup?", "Expected return from the current state", ["The reward function's definition itself", "Only the next action's spelling", "Only the count of CSV rows"], "The source describes an estimate of total reward expected from a state.", "#actor-critic-algorithm"),
    ("explore", "deep-rl-exploration", 3, "Why try a different action from the currently favored one during learning?", "To obtain evidence about other possibilities", ["To prove the current policy already explored everything", "To eliminate every reward signal", "To force all states to be identical"], "The page balances exploration with exploitation of the current strategy.", ""),
    ("probability", "deep-rl-policy", 3, "A policy assigns probabilities [0.25,0.75] to [left,right]. Which action is more likely under sampling?", "right", ["left", "Both have equal probability", "Neither can ever be chosen"], "The second action has the greater assigned probability.", "#policy-gradients-algorithm"),
    ("no-action-label", "deep-rl-learning", 3, "How does the policy-gradient setup differ from an ordinary labeled action-classification dataset?", "The desired action at each step is not supplied as a gold label", ["Every best action is known in advance", "The environment returns no observations", "The network cannot have parameters"], "The agent learns from interaction and returns rather than fixed correct-action labels.", "#policy-gradients-algorithm"),
])

add("0b8817c3d2ac15166fe4cc81", AI, "lessons/6-Other/22-DeepRL/lab",
    "The taught MountainCar contract: position/velocity observations, three discrete controls and reaching the flag; no simulated experiment outcomes.", [
    ("goal", "mountaincar-objective", 1, "What is the stated MountainCar goal?", "Escape the valley and reach the flag", ["Keep a pole vertical on a cart", "Classify a pet photograph", "Generate a sentence"], "The lab describes a car in a valley that must reach a goal.", "#the-environment"),
    ("observations", "mountaincar-observations", 1, "Which two measurements does the lab describe as observable?", "Position and velocity", ["Only the next optimal action", "Only a text sentiment score", "Only image width and height"], "These measurements describe the car's current motion state.", "#the-environment"),
    ("actions", "mountaincar-actions", 2, "How many discrete actions are listed?", "3", ["2", "4", "An unrestricted real-valued steering angle"], "The listed controls are left acceleration, right acceleration and no acceleration.", "#the-environment"),
    ("same-position", "mountaincar-observations", 3, "Two cars have the same position but opposite velocities. Are their described observations identical?", "No; velocity is also part of the observation", ["Yes; position is the only measurement", "Yes; all states in the valley are identical", "Only the filename distinguishes states"], "The observation includes both position and velocity.", "#the-environment"),
    ("zero-action", "mountaincar-actions", 3, "The agent selects the listed do-nothing control. What is it choosing in this contract?", "No left or right acceleration action", ["A command that guarantees zero velocity immediately", "A guaranteed terminal state", "A change in the number of observation features"], "Choosing no acceleration does not itself establish that an already-moving car stops.", "#the-environment"),
    ("adapt-contract", "mountaincar-algorithm-interface", 3, "When moving a reusable RL algorithm to this environment, what must still be respected?", "Its action and observation contracts", ["Assume every environment has CartPole's exact dimensions", "Keep an incompatible action count without checking", "Use image-class labels as the car's controls"], "The lab motivates a common interface while each environment still defines its spaces.", "#takeaway"),
])

add("3077eb9ec19688e5bdc3b680", AI, "lessons/6-Other/23-MultiagentSystems",
    "Emergent behavior, reactive/deliberative agents, flocking rules and communication ontologies; no claim that NetLogo ask executes agents on parallel threads.", [
    ("agent", "multiagent-entities", 1, "What can an agent do in the lesson's definition?", "Perceive and act in an environment", ["Only exist as a static filename", "Only supply a class label with no interaction", "Guarantee the whole system's optimality"], "Agents interact with their surrounding environment.", ""),
    ("reactive", "multiagent-reasoning", 1, "Which agent type primarily follows simple stimulus-response behavior?", "Reactive", ["Deliberative by definition", "Only an ontology identifier", "Only a global training loss"], "The source contrasts reactive responses with planning/reasoning.", ""),
    ("alignment", "multiagent-flocking", 2, "Which flocking rule steers toward neighbors' average heading?", "Alignment", ["Separation", "Cohesion", "Only changing the simulation's title"], "Alignment concerns heading; cohesion concerns position and separation avoids crowding.", "#flocking"),
    ("separation", "multiagent-flocking", 3, "A bird gets too close to its neighbors and steers away. Which rule is acting?", "Separation", ["Cohesion", "Only matching the average heading", "Only creating another agent"], "Separation is the short-range repulsion rule.", "#flocking"),
    ("emergence", "multiagent-system-behavior", 3, "A coordinated flock arises from local rules used by individual birds. What idea does this illustrate?", "Emergent collective behavior", ["A requirement for one bird to know every global trajectory", "Proof that individual interactions cannot matter", "A single fixed class prediction with no agents"], "System-level patterns can arise from interactions among simpler agents.", "#flocking"),
    ("shared-ontology", "multiagent-communication", 3, "Two planning agents exchange a concept name but interpret it differently. What listed requirement addresses this?", "A common ontology defining shared meanings", ["Only matching message syntax with no agreement about meaning", "Only faster transmission of the same ambiguous term", "Independent concept dictionaries assumed compatible without mapping"], "Meaningful communication needs shared concepts as well as message protocols.", "#deliberative-agents"),
])

add("020e28d47dc073e3e17b14ab", AI, "lessons/7-Ethics",
    "Responsible-AI fairness, transparency, inclusiveness, accountability and checking consequential errors; excludes the source's incorrect implication that model training increases privacy.", [
    ("fairness", "ai-ethics-principles", 1, "Which principle directly concerns harmful model biases between groups?", "Fairness", ["Only model compression", "Only download speed", "Only plot formatting"], "The source links fairness with biased data and outcomes.", "#principles-of-responsible-ai"),
    ("transparent", "ai-ethics-transparency", 1, "What should users be told clearly in the transparency discussion?", "That AI is being used", ["Only the author's favorite editor", "A guarantee that no mistake is possible", "Only the model's filename"], "Transparency includes being clear about AI use and understanding its behavior.", "#principles-of-responsible-ai"),
    ("accountable", "ai-ethics-accountability", 2, "What must be established for important AI-assisted decisions?", "Who is responsible and how people remain accountable", ["That nobody can ever question the result", "That the numerical output itself bears responsibility", "That training removes all human obligations"], "The lesson calls for accountable people in important decisions.", "#principles-of-responsible-ai"),
    ("inclusion", "ai-ethics-inclusion", 3, "A system works for its developers but excludes an underrepresented user group. Which action aligns with inclusiveness?", "Investigate and address that group's barriers and representation", ["Assume developers represent every user", "Delete the group's error reports", "Treat exclusion as evidence the model is accurate"], "The principle emphasizes including people who could otherwise be overlooked.", "#principles-of-responsible-ai"),
    ("reliability", "ai-ethics-safety", 3, "A prediction may cause harm when wrong. What does the reliability/safety principle require considering?", "Errors and their consequences before relying on the prediction", ["Only whether the result is confidently worded", "Only whether the training script finished", "A guarantee that all model scores are facts"], "Models can make mistakes; consequential uses need attention to those limits.", "#principles-of-responsible-ai"),
    ("tool-limits", "ai-ethics-tools", 3, "A team uses a fairness dashboard. What claim would go beyond that action's evidence alone?", "That every responsible-AI requirement is now guaranteed satisfied", ["That the team used an assessment tool", "That cohort comparisons may support investigation", "That findings still need interpretation"], "Tools aid assessment; running one does not certify every aspect of a system.", "#tools-for-responsible-ai"),
])

add("6cacd4c63fd96fb1f367587e", AI, "lessons/X-Extras/X1-MultiModal",
    "CLIP's image/text matching, contrastive pair structure, prompt-based classification/search and separate generator guidance; excludes universal generation guarantees and historical product availability.", [
    ("modalities", "multimodal-representations", 1, "Which two kinds of input are compared by the described CLIP model?", "Images and text", ["Only two CSV delimiters", "Only model filenames", "Only two reward counters"], "CLIP represents image and text information for comparison.", "#contrastive-image-pre-training-clip"),
    ("positive-pair", "clip-contrastive-learning", 1, "What is a matching positive pair in the described training batch?", "An image and its corresponding caption", ["An image and every unrelated caption equally", "Only two random filenames", "A caption with no associated input representation"], "The training objective favors representations of corresponding pairs.", "#contrastive-image-pre-training-clip"),
    ("search", "clip-applications", 2, "What can a text prompt retrieve from a collection of images in the described use?", "Images with high prompt-image similarity", ["A guarantee that every retrieved image is factually authentic", "Only the longest filename", "Only a new training dataset by definition"], "Text-based image search ranks the collection by correspondence to the prompt.", "#contrastive-image-pre-training-clip"),
    ("prompt-class", "clip-applications", 3, "Scores for prompts [cat,dog,bird] are [0.1,0.7,0.2]. Which class does the described maximum-score rule select?", "dog", ["cat", "bird", "All three equally"], "The largest score corresponds to dog.", "#contrastive-image-pre-training-clip"),
    ("batch-pairs", "clip-contrastive-learning", 3, "A batch has 4 images and their 4 corresponding captions. Of the 16 image-caption comparisons, how many are designated matching pairs?", "4", ["16", "12", "1"], "There is one paired caption per image; other batch comparisons are mismatches for this objective.", "#contrastive-image-pre-training-clip"),
    ("guidance", "clip-generation-guidance", 3, "In the VQGAN-plus-CLIP example, which component actually generates the image from an encoding vector?", "VQGAN", ["CLIP alone with no generator", "Only the text file's name", "Only a cosine-similarity scalar"], "The generator makes the image; CLIP supplies a text-image matching signal used for guidance.", "#image-generation-with-vqgan-clip"),
])


# Findings preserve the reviewed source/old quiz facts for integration. They do
# not rewrite old rows, alter historical grades or silently treat a warning as
# learner/expert validation.
SOURCE_FINDINGS = []
LEGACY_QUESTION_FINDINGS = []


def source_finding(rid, section, detail, warning, references, severity="error"):
    record = next(r for r in [*BANKS, *ORIENTATIONS] if rid in r["resource_ids"])
    SOURCE_FINDINGS.append({"resource_id": rid, "url": record["url"],
                            "section": section, "severity": severity,
                            "detail": detail, "warning": warning,
                            "correct_primary_urls": references,
                            "reviewed_at": "2026-11-10"})


def legacy_finding(qid, rid, prompt, keyed_answer, reason, references):
    record = next(r for r in [*BANKS, *ORIENTATIONS] if rid in r["resource_ids"])
    LEGACY_QUESTION_FINDINGS.append({"question_id": qid, "resource_id": rid,
                                    "url": record["url"], "prompt": prompt,
                                    "current_keyed_answer": keyed_answer,
                                    "reason": reason, "primary_references": references,
                                    "suggested_action": "quarantine",
                                    "reviewed_at": "2026-11-10"})


SKLEARN_LINEAR = "https://scikit-learn.org/stable/modules/linear_model.html"
SKLEARN_METRICS = "https://scikit-learn.org/stable/modules/model_evaluation.html"
SKLEARN_CLUSTERING = "https://scikit-learn.org/stable/modules/clustering.html"
SVC_DOC = "https://scikit-learn.org/stable/modules/generated/sklearn.svm.SVC.html"
SVR_DOC = "https://scikit-learn.org/stable/modules/generated/sklearn.svm.SVR.html"
KNN_DOC = "https://scikit-learn.org/stable/modules/generated/sklearn.neighbors.KNeighborsClassifier.html"
VADER_SOURCE = "https://www.nltk.org/_modules/nltk/sentiment/vader.html"
TEXTBLOB_CHANGELOG = "https://textblob.readthedocs.io/en/dev/changelog.html"
TRANSFORMER_PAPER = "https://arxiv.org/abs/1706.03762"
GYM_MIGRATION = "https://gymnasium.farama.org/introduction/migration_guide/"

source_finding("2b19a333828f0415582f2cc5", "#a-linear-regression-line",
    "The page says data points are squared for least squares; squared residuals are the objective. Its price-prediction explanation also reverses X and Y, while the later code correctly uses date as X and price as y.",
    "Use date as input and price as target for price prediction. Least squares minimizes squared prediction errors, not squared data points.", [SKLEARN_LINEAR + "#ordinary-least-squares"])
source_finding("2b19a333828f0415582f2cc5", "#correlation",
    "The claim that a good fit requires correlation nearer +1 excludes strong negative relationships. The later code itself models a negative slope.",
    "A strong negative linear relationship can also be fitted well. Signed correlation alone is not a general model-quality score.", [SKLEARN_LINEAR + "#ordinary-least-squares"])
source_finding("2b19a333828f0415582f2cc5", "#simple-linear-regression",
    "The variable named mse takes sqrt(mean_squared_error), which is RMSE. Reported determination is scored on training data, and R-squared can be negative; zero is not a worst possible predictor.",
    "The shown square-root error is RMSE. Training R-squared is not held-out accuracy, and R-squared can be negative.",
    ["https://scikit-learn.org/stable/modules/generated/sklearn.metrics.root_mean_squared_error.html", "https://scikit-learn.org/stable/modules/generated/sklearn.metrics.r2_score.html"])
source_finding("80fa4d18046d23b6fffe27dc", "#better-comprehension-via-a-confusion-matrix",
    "Two prose bullets exchange false positive and false negative, although the displayed matrix layout and precision/recall formulas are correct.",
    "False positive means predicted positive but actually negative. False negative means predicted negative but actually positive. Follow the correct matrix layout and formulas.",
    ["https://scikit-learn.org/stable/modules/generated/sklearn.metrics.confusion_matrix.html"])
source_finding("80fa4d18046d23b6fffe27dc", "#variables-do-not-have-to-correlate",
    "Weak feature correlations alone do not make logistic regression the best method, nor is logistic regression the opposite of linear regression on that criterion.",
    "Choose classification for a categorical target. Weak correlations alone do not establish that logistic regression is best.", [SKLEARN_LINEAR + "#logistic-regression"])
for _rid, _section in [
    ("9932de14f2896338373bd21c", "#balance-the-dataset"),
    ("444dada88136c9d89d3748b1", "#preparation"),
    ("1ff66fd8a070f3eb629997a8", "#prerequisite"),
    ("9d409b7e327d6e85d596caa5", "#exercise---train-classification-model"),
]:
    source_finding(_rid, _section,
        "The cuisine workflow saves an entirely SMOTE-resampled dataset before later train/test splitting. Descendant lessons reuse that file, which can contaminate held-out evaluation and change its distribution.",
        "Split before resampling. Apply SMOTE only within training data/folds and evaluate on untouched data; the tutorial's reported scores are not independent proof.",
        ["https://imbalanced-learn.org/stable/common_pitfalls.html#data-leakage"])
source_finding("444dada88136c9d89d3748b1", "#reasoning",
    "The page rules out one-versus-all because the target is multiclass, then implements one-versus-rest for that same target. It also broadly dismisses boosted multiclass trees as only suitable for rankings.",
    "One-versus-rest is a valid multiclass strategy. The page's blanket classifier exclusions conflict with its own implementation.", ["https://scikit-learn.org/stable/modules/multiclass.html"])
source_finding("1ff66fd8a070f3eb629997a8", "#linear-svc-classifier",
    "SVC is expanded as support-vector clustering, and the neighbor discussion conflates classifiers with the wider supervised/unsupervised neighbor-method family. Evaluation on X_test is printed as training accuracy.",
    "SVC and KNeighborsClassifier are supervised classifiers. Regression and unsupervised neighbor tasks use different estimators. Read the metric's arrays, not its misleading printed label.", [SVC_DOC, KNN_DOC])
source_finding("68f07271e7cd3852c7c9b888", "#exercise---display-the-clusters",
    "The code counts y == labels even though cluster IDs are arbitrary permutations, and includes encoded genre in the input while interpreting recovered genres. This does not validate unsupervised genre discovery.",
    "Cluster IDs are arbitrary. Do not score raw cluster IDs as class labels or claim independent genre recovery from an input containing encoded genre.", [SKLEARN_CLUSTERING + "#clustering-performance-evaluation"])
source_finding("64194972db5d31954d2eab14", "#getting-started-with-clustering",
    "The density paragraph equates noise with density, and an earlier suggestion that a cluster ID preserves privacy is not a privacy guarantee. Column headers are also confused with output labels later in the page.",
    "Density and noise are different concepts. Removing names or substituting cluster IDs does not establish anonymity; output labels differ from column headings.", [SKLEARN_CLUSTERING + "#dbscan"], "caution")
source_finding("77ed081e085b28907dec5676", "#exercise---translation",
    "TextBlob.translate and detect_language were removed in TextBlob 0.18. The historical translation exercise cannot be treated as a current local API capability.",
    "TextBlob's translation methods were removed in 0.18. This is a historical example, not a currently supported local translation feature.", [TEXTBLOB_CHANGELOG])
source_finding("1fcb47b0e456d979ca226530", "#removing-stop-words",
    "The page claims stop words do not affect sentiment and can be removed without accuracy loss. Negators such as not directly influence VADER; removal can invert polarity.",
    "Do not assume stop-word removal preserves sentiment. Negation, punctuation and emphasis may change the result; compare preprocessing on suitable validation examples.", [VADER_SOURCE])
source_finding("6e480609fa7263de12f2354d", "#arima-in-the-context-of-time-series",
    "The MA description refers to past observed lags rather than past forecast errors/innovations, obscuring its distinction from the AR component.",
    "AR uses lagged series values; the MA component models lagged errors/innovations. They are different components.", ["https://www.statsmodels.org/stable/generated/statsmodels.tsa.arima.model.ARIMA.html"])
for _rid in ["6e480609fa7263de12f2354d", "d5aabaecb172aa8ce7253ddb"]:
    source_finding(_rid, "#create-training-and-testing-datasets",
        "The prose describes September/October training and November/December testing, but the code boundaries are November 1 and December 30. Follow actual timestamps when interpreting the exercise.",
        "The described date ranges disagree with the code. Inspect the actual timestamp masks before interpreting any reported forecast score.", [], "caution")
source_finding("d5aabaecb172aa8ce7253ddb", "#svr-in-the-context-of-time-series-1",
    "SVR is described as finding a hyperplane containing a maximum number of points. Epsilon-insensitive regression instead uses a regularized loss; that description is not its optimization objective.",
    "SVR is not defined by putting the most points on a hyperplane. Consult its epsilon-insensitive regression objective.", [SVR_DOC])
source_finding("0131853a327944e9e99b399d", "#python-implementation",
    "The loop breaks before updating on end_reward, does not terminate when the apple goal reward occurs, and uses removed np.float. It should not be copied as a complete modern episodic Q-learning implementation.",
    "The training loop needs terminal-state handling and terminal updates, plus current NumPy types. The mathematical nonterminal update is separate from those snippet defects.", ["https://gymnasium.farama.org/tutorials/gymnasium_basics/handling_time_limits/", "https://numpy.org/doc/stable/release/1.24.0-notes.html"])
source_finding("e510c3148513e66df9d9e6d8", "#lets-start-q-learning",
    "Qbest = Q aliases the same mutable dictionary rather than preserving its best state. The lesson also uses legacy Gym return signatures and np.int; its stated success criterion must not be transferred blindly between environment versions.",
    "Copy a mutable Q table when saving a snapshot. This lesson's Gym/NumPy calls and success threshold are version-specific historical examples.", [GYM_MIGRATION, "https://docs.python.org/3/library/copy.html"])
source_finding("46a7e6a77b4dbc77f76db48a", "#training-the-perceptron",
    "The Python block initializes weights as a list, then uses weights.shape and adds eta*weights.shape instead of an example-derived vector. This contradicts the preceding correct mathematical update and is not executable as written.",
    "The perceptron Python snippet is broken. For misclassified examples, use the input/label-based update stated in the formula, not weights.shape.", ["https://scikit-learn.org/stable/modules/linear_model.html#perceptron"])
source_finding("ff54a82ff50edcbd568943b3", "#formalization-of-machine-learning",
    "The page calls 0-1 loss essentially accuracy. Mean 0-1 loss is the error rate, equal to one minus accuracy, with opposite optimization direction.",
    "Mean 0-1 loss is the fraction of wrong predictions, not accuracy. Minimize error; maximize accuracy.", ["https://scikit-learn.org/stable/modules/generated/sklearn.metrics.zero_one_loss.html"])
source_finding("d499068082f3cfa97d683053", "#classifying-computer-knowledge-representations",
    "The illustrative knowledge table calls Python untyped. Python objects have types and Python is dynamically typed; that example should not teach Python's type system.",
    "The illustrative Python-is-untyped assertion is incorrect. Python objects have types; the language uses dynamic typing.", ["https://docs.python.org/3/reference/datamodel.html#objects-values-and-types"])
source_finding("e4c6fcd7da2e00369091132a", "#semantic-embeddings-word2vec",
    "The skip-gram bullet says it predicts the current word from context, repeating the CBoW direction. The next Language Modeling lesson correctly states center-to-neighbors.",
    "CBoW predicts the center from context; skip-gram predicts neighboring context from the center. This page's skip-gram sentence reverses that direction.", [AI + "lessons/5-NLP/15-LanguageModeling/README.md#training-embeddings", "https://arxiv.org/abs/1301.3781"])
source_finding("cb2e525fedcd48a5178d3997", "#long-short-term-memory-lstm",
    "GRU is incorrectly expanded as Gated Relay Unit. The output-gate description confuses cell state C with hidden output H; an LSTM's hidden output is gated tanh(cell state).",
    "GRU means Gated Recurrent Unit. Keep LSTM cell state and hidden output distinct; the output gate controls hidden output from the cell state.", ["https://docs.pytorch.org/docs/stable/generated/torch.nn.LSTM.html"])
source_finding("07e15a8774b6359d837912eb", "#encoder-decoder-attention",
    "The page lists two attention placements and omits masked decoder self-attention from the original encoder-decoder architecture. A universal count of two is not correct across transformer architectures.",
    "Attention placement depends on architecture. The original encoder-decoder transformer also has masked decoder self-attention; do not memorize a universal count of two.", [TRANSFORMER_PAPER])
source_finding("7c8a05902f3cd828d79eedda", "#the-network",
    "The example passes classes as a second positional argument to from_pretrained rather than configuring the token-classification head with num_labels. It is not a validated modern loading recipe.",
    "Configure the token-classification label count using the library's supported model configuration, such as num_labels; do not copy the shown positional classes argument.", ["https://huggingface.co/docs/transformers/tasks/token_classification"])
source_finding("45e7b6b08a82e12efed49d33", "#gpt-is-a-family",
    "The table states GPT-4 has 100T parameters. The GPT-4 technical report explicitly withholds model size, so that number is unsupported.",
    "The GPT-4 parameter count in this table is unsupported. The technical report does not disclose model size.", ["https://cdn.openai.com/papers/gpt-4.pdf"])
source_finding("22a7bac053135218fc65a910", "#policy-gradients-algorithm",
    "Reward discounting is described as diminishing earlier rewards, while return-from-state discounting weights more distant future rewards. Legacy Gym APIs are also used.",
    "Discount future rewards relative to the current decision when computing returns. The displayed Gym calls use an older API.", ["https://spinningup.openai.com/en/latest/spinningup/rl_intro.html", GYM_MIGRATION])
source_finding("3077eb9ec19688e5bdc3b680", "#main-principles",
    "The prose says ask executes all agents simultaneously in parallel. Standard NetLogo ask processes agents one at a time in random order; modeled concurrency is not parallel-thread execution.",
    "NetLogo's ordinary ask is sequential in random agent order. A simulated group acting together does not imply parallel execution threads.", ["https://docs.netlogo.org/dict/ask.html"])
source_finding("020e28d47dc073e3e17b14ab", "#principles-of-responsible-ai",
    "The privacy paragraph implies integrating data into a model increases privacy/security. Training is not a privacy safeguard; models can expose training data through memorization/extraction.",
    "Training a model does not automatically protect training-data privacy. Data governance and privacy/security safeguards remain necessary.", ["https://arxiv.org/abs/2012.07805"])
source_finding("d15644edf9b9b956e6618b9d", "#the-dataset",
    "The lab calls the original Oxford-IIIT Pet dataset a 35-breed dataset; its publisher documents 37 categories. The separate derived Pet Faces dataset must not be assumed identical without inspecting its own files.",
    "The original Oxford-IIIT Pet dataset has 37 categories. Do not carry the page's 35-breed count into model output dimensions.", ["https://www.robots.ox.ac.uk/~vgg/data/pets/"])

legacy_finding("a7a706f1747be2da6f6e8318", "adbcf17f64d9f66e17f7ce82",
    "Machine learning algorithms are meant to simulate", "the human brain",
    "ML generally learns patterns from data; it need not simulate a brain. The source only makes a loose motivational analogy, so the categorical keyed statement overclaims.",
    [ML + "1-Introduction/1-intro-to-ML/README.md#why-study-machine-learning", "https://scikit-learn.org/stable/supervised_learning.html"])
legacy_finding("4478a1e34e0931dad7504a35", "2b19a333828f0415582f2cc5",
    "A good Linear Regression model has a ___ Correlation Coefficient", "high",
    "The unqualified signed-correlation criterion rejects perfect negative linear relationships. A simple y=-x example has correlation -1 and zero linear prediction error.", [SKLEARN_LINEAR + "#ordinary-least-squares"])
legacy_finding("c8cc1a4896842f146826686e", "2b19a333828f0415582f2cc5",
    "Least-Squares Regression means that all the datapoints surrounding the regression line are:", "squared and then added up",
    "Least squares squares residuals between targets and predictions, not the data points themselves. None of this wording identifies the correct error objective.", [SKLEARN_LINEAR + "#ordinary-least-squares"])
legacy_finding("ac54a3d9d081577597a6dc3a", "80fa4d18046d23b6fffe27dc",
    "Your data has weak correlations. The best type of Regression to use is:", "Logistic",
    "Weak correlations do not determine the best estimator. Logistic regression is classification for a categorical target; target type and other assumptions must be specified.", [SKLEARN_LINEAR + "#logistic-regression"])
legacy_finding("fdb3d56d3bc2bded5a5f553f", "1ff66fd8a070f3eb629997a8",
    "K-Neighbors classifier can be used for:", "both of these",
    "The listed alternatives are supervised and unsupervised learning. KNeighborsClassifier uses labeled targets; the wider neighbors family also contains separate unsupervised estimators.", [KNN_DOC])
legacy_finding("5f205c7c2a7f251a5557e4df", "1ff66fd8a070f3eb629997a8",
    "Support-Vector classifiers can be used for", "both of these",
    "The options are classification and regression. An SVC is a classifier; SVR is the separate regression estimator. The question conflates a classifier with the wider SVM family.", [SVC_DOC, SVR_DOC])
legacy_finding("5238bef55b4b1618f4747a69", "1fcb47b0e456d979ca226530",
    "What are stop words?", "both of the above",
    "One included assertion says stop words do not change sentiment. Negation such as not affects VADER, so blanket safe removal is false.", [VADER_SOURCE])
legacy_finding("1c0859df589ea5def8850a69", "ca35af5340dc07e76eca1c36",
    "A time series is a sequence taken at:", "successive equally spaced points in time",
    "Equal spacing is common but not required for the general definition. The source itself says most commonly; irregularly sampled time series also exist.",
    [ML + "7-TimeSeries/1-Introduction/README.md#some-definitions", "https://pandas.pydata.org/docs/user_guide/timeseries.html"])
legacy_finding("33dd0221ac512c6b5a3fab9d", "ca35af5340dc07e76eca1c36",
    "Time Series Forecasting is most useful for", "Econometrics",
    "The page lists many valid industries and does not establish a universally most useful field. This subjective superlative has no defensible single correct answer.", [ML + "7-TimeSeries/1-Introduction/README.md"])
legacy_finding("17fe25168cae5e524a00f84d", "6e480609fa7263de12f2354d",
    "Differencing", "eliminates trend and seasonality",
    "Differencing must use suitable orders/lags and does not universally remove every trend or seasonal structure. The key states a guarantee instead of a conditional technique.",
    ["https://www.statsmodels.org/stable/generated/statsmodels.tsa.statespace.tools.diff.html"])
legacy_finding("911402b4575557fc2e9ef20f", "d5aabaecb172aa8ce7253ddb",
    "By which of these methods does an SVR learn?", "Finding the best fit hyperplane that has the maximum number of data points",
    "SVR uses an epsilon-insensitive regularized regression objective; maximizing the number of points on a hyperplane is not its definition.", [SVR_DOC])
legacy_finding("bc12e351257de1a230d87208", "d78317785ba7cee2add3cbeb",
    "How many objects can an object detection model detect?", "any number",
    "A detector can handle multiple objects, but any number implies no architecture/output limits. Many detectors have finite proposals, queries or output caps; no model is specified.",
    ["https://arxiv.org/abs/2005.12872", AI + "lessons/4-ComputerVision/11-ObjectDetection/README.md"])
legacy_finding("7d43580f65d0353f5efdd696", "8912ef2a4435e94decd28e50",
    "How many segmentation algorithm are there?", "2",
    "Semantic and instance segmentation are task categories discussed by the page, not the total number of segmentation algorithms. The source also points to panoptic segmentation.",
    [AI + "lessons/4-ComputerVision/12-Segmentation/README.md", "https://arxiv.org/abs/1801.00868"])
legacy_finding("a2e4a1337651e5b823c39bfb", "08c8de199e82fb31fc61c6c4",
    "Text can be represented using _____ approaches", "2",
    "Character and word representations are examples, not an exhaustive count. The same source explicitly mentions part-of-word tokens.", [AI + "lessons/5-NLP/13-TextRep/README.md#representing-text"])
legacy_finding("3601cdf6cd430898de932492", "41ba0936bb2829fd45bbcaac",
    "Which of the following can be considered a language model?", "Word2Vec embeddings",
    "Embedding vectors alone are representations, not a model assigning sequence/conditional token probabilities. The source describes semantic embeddings as a first step toward language modeling; the options conflate artifacts and models.",
    [AI + "lessons/5-NLP/15-LanguageModeling/README.md", "https://arxiv.org/abs/1301.3781"])
legacy_finding("110dfe285b0e163140a81328", "9fd2c134937e8547b0a1c9c0",
    "Output encoder converts hidden state into _____ output", "one-hot-encoded",
    "The generation page describes the cell output as a probability distribution. A distribution is not a one-hot choice; sampling or argmax chooses a token afterward.",
    [AI + "lessons/5-NLP/17-GenerativeNetworks/README.md#soft-text-generation-and-temperature"])
legacy_finding("fc173215596db4a606d1f517", "07e15a8774b6359d837912eb",
    "In positional encoding the relative position of the token is represented by number of steps", "true",
    "The source attributes implicit step-position information to RNNs, then introduces explicit positional representations for transformers. The quiz confuses those explanations.",
    [AI + "lessons/5-NLP/18-Transformers/README.md#positional-encodingembedding", TRANSFORMER_PAPER])
legacy_finding("70be64bb79408bdaa0630d5b", "07e15a8774b6359d837912eb",
    "In transformers attention is used in _____ instances", "2",
    "No architecture or counting unit is specified. Original encoder-decoder transformers also include masked decoder self-attention; a universal two-instance key is unsupported.", [TRANSFORMER_PAPER])
legacy_finding("036dd550539f168f6ae14931", "45e7b6b08a82e12efed49d33",
    "What is zero-shot learning?", "Getting an answer from pre-trained network",
    "This omits the defining absence of task demonstrations/examples and also describes few-shot inference. The options provide no precise zero-shot definition.",
    [AI + "lessons/5-NLP/20-LangModels/README.md#conclusion", "https://arxiv.org/abs/2005.14165"])
legacy_finding("46b88337ce4f936f1cd6f624", "22a7bac053135218fc65a910",
    "In Actor-Critic model, critic predicts", "Reward function",
    "The described critic estimates expected total return/value from the state, not the definition of the reward function. The source's actor-critic section gives the correct role.",
    [AI + "lessons/6-Other/22-DeepRL/README.md#actor-critic-algorithm", "https://spinningup.openai.com/en/latest/algorithms/vpg.html"])
legacy_finding("3fdc8a2fd5955758afadcb06", "ff54a82ff50edcbd568943b3",
    "All but one is a type of classification loss function", "binary loss",
    "Binary loss is undefined here and can refer to real binary-classification losses. A vague name cannot serve as an unambiguous non-classification distractor.",
    ["https://scikit-learn.org/stable/modules/generated/sklearn.metrics.log_loss.html"])
legacy_finding("dae59a100e158339bea6ef64", "7d9a34064faa6f490016c776",
    "VAE is short for?", "Variation auto-encoder",
    "The correct name is Variational Autoencoder. None of the supplied choices gives that name accurately.",
    [AI + "lessons/4-ComputerVision/09-Autoencoders/README.md#variational-autoencoders-vae", "https://arxiv.org/abs/1312.6114"])
legacy_finding("954406425ba97bf269c0252e", "77ed081e085b28907dec5676",
    "Underlying TextBlob's translation library is:", "Google Translate",
    "This is a historical API statement without a version qualifier; TextBlob removed translation in 0.18. Presenting it as an active current feature is unsupported.", [TEXTBLOB_CHANGELOG])
legacy_finding("1d2504e11667234785e53fe9", "77ed081e085b28907dec5676",
    "To use `blob.translate` you need:", "an internet connection",
    "The method itself was removed in TextBlob 0.18. Internet access alone cannot make the current API work; the versionless quiz describes a removed feature.", [TEXTBLOB_CHANGELOG])
