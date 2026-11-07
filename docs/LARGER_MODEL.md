# Larger retrieval model experiment

This workflow evaluates a larger local embedding model for the learning features.
It does not add a generative LLM or change the Gemini mentor chatbot.

## Completed result

The selected checkpoint is the **larger pretrained BGE base**, not the weights
fine-tuned in this experiment. One full pass over 70,072 technical QA pairs and
six curriculum epochs ran on the RTX 3060. Every trained checkpoint had lower
lesson validation MRR than the pretrained BGE baseline. It would be misleading
to attribute the selected model's improvement to that fine-tuning.

The larger base improves the application's existing lesson-retrieval benchmark:

| Metric on 87 lesson test queries | Previous fine-tuned MiniLM v2 | Selected BGE-base v3 |
| --- | ---: | ---: |
| Recall@1 | 68.97% (60/87) | **74.71% (65/87)** |
| Recall@5 | 87.36% | **91.95%** |
| MRR | 0.7799 | **0.8231** |
| Validation MRR, 81 queries | 0.8139 | **0.8567** |

Results are not uniformly better. On the separate fixed 1,000-answer technical
QA test pool, MiniLM v2 scores Recall@1 63.3%, Recall@5 83.8%, MRR 0.7276; BGE
scores 63.0%, 81.1%, 0.7092. The selected model is promoted using lesson validation
MRR, not by inspecting these test results. The primary measured gain is five
additional first-ranked source lessons on a small existing regression test.

Training took 1,930.3 seconds after preparation/mining, with peak allocated GPU
memory about 6.08 GiB. The model grows from 22,713,216 to 109,482,240 parameters
(4.82 times). The previous fine-tuned model and metrics are retained for rollback.
Since the selected weights are the unchanged pretrained BGE base, its MIT model
license is separate from the noncommercial dataset used in the unsuccessful
fine-tuning experiment.

## Architecture and data

The candidate uses [BAAI/bge-base-en-v1.5](https://huggingface.co/BAAI/bge-base-en-v1.5)
at revision `a5beb1e3e68b9ab74eb54cfd186867f64f240e1a`: 109,482,240 parameters,
12 transformer layers and 768-dimensional embeddings. The previous MiniLM model
has 22,713,216 parameters and 384-dimensional embeddings. Exact counts are measured
from the loaded models. Sequence length is 256 tokens during training and serving.

The new [technical question/answer dataset](https://huggingface.co/datasets/flax-sentence-embeddings/stackexchange_title_best_voted_answer_jsonl)
is pinned at revision `88957a0e825f49aeb2a7bfd828cb46b79010b286`. Seven communities
cover databases, statistics, computer science, data science, software engineering,
web development and AI. Cleaning, length checks and global text deduplication
produce 73,000 selected pairs:

| Partition | Pairs |
| --- | ---: |
| Training | 70,072 |
| Validation | 1,448 |
| Test | 1,480 |

Normalized question hashes assign the 96/2/2 split deterministically. Full
normalized titles and answer texts are checked for overlap between partitions.
Every query from the frozen curriculum benchmark is excluded from external
training. `ml/data/large_manifest.json` records source hashes, counts, filtering
and prepared-file checksums. Raw records remain under ignored `ml/data/raw/`.

Curriculum adaptation includes 1,966 distinct source examples across 114 training
lessons: 644 headings, 939 excerpts and 383 author quiz links. Repeating the quiz
examples gives 2,732 adaptation rows. The original 28 validation/test lessons are
excluded from all adaptation examples and hard-negative mining. An unfine-tuned
frozen BGE model chooses passages within source-linked lessons and mines competing
passages from other training lessons. These passage choices and heading/excerpt
labels are weak supervision, not new human relevance judgements.

## Training and selection

Training runs locally on the RTX 3060 using CUDA fp16 autocast, fp32 parameters,
AdamW and gradient clipping. Technical QA runs for one epoch with batch 24 and
learning rate 0.000001. Every fourth batch rehearses a curriculum batch with a
mined hard negative. Six subsequent curriculum epochs use batch 16 and learning
rate 0.000005. Multiple Negatives Ranking Loss supplies the contrastive objective.

Checkpoints are compared using the original 81-query lesson validation set. The
unfine-tuned larger base is included as an honest baseline, so extra training is
not assumed to help. Only after selection is fixed are the original 87 test
questions and a fixed 1,000-answer external test pool evaluated. The external
validation partition is reserved and not used to choose epochs in this run.

`ml/evaluation-v3.json` records the completed run: original v2, larger pretrained
base and selected candidate metrics; selected stage; actual weight changes;
parameter counts; hyperparameters; runtime and peak GPU memory. If the pretrained
base wins, the report explicitly marks `fine_tuned_weights_selected: false`.

The 87-question test is an already-reported regression benchmark, not a new blind
test. External test rows are disjoint from this run's fitting data, but their
presence in either model's original pretraining cannot be excluded. These metrics
measure linked-lesson/answer retrieval, not learner mastery, answer correctness,
resume parsing or career suitability. The assessment bank remains 611 MCQs; the
new QA examples are training data, not new assessment questions.

## Reproduce and activate

After the original v2 artifacts and source data have been prepared:

```bash
npm run ml:train-large
```

The trainer backs up v2 and writes a separate `retriever-v3-candidate` directory.
It never overwrites the active model. After training finishes, stop the local ML
service and run:

```bash
npm run ml:activate-large
npm run dev
```

Activation requires a recorded validation-MRR improvement over v2. All copy/rename
targets are verified inside `ml/artifacts`. A staging copy is prepared first, and
the previous active directory is preserved for rollback. Stop serving while
activating so model files and metadata cannot be read halfway through replacement.

The larger model's short-query retrieval instruction is applied only to queries,
not indexed documents. Semantic topic/role matching uses ordinary unprefixed
embeddings. Promotion selects `inference_device: auto`: CUDA when available, CPU
otherwise. Set server-only `ML_DEVICE=cpu` or `ML_DEVICE=cuda` to override it.

Public catalogue, question and topic embeddings are cached under ignored
`ml/artifacts/catalogue-cache`. Cache keys include checkpoint weights/configuration,
catalogue/question contents, retrieval-window code and sequence length. Updating
any of these rebuilds the index. Cached arrays load without pickle. Resume and
guest inputs never enter this disk cache. A cold CPU startup for the larger model
can take substantially longer than a GPU or cached startup.

## Dataset rights

The new export's dataset card specifies **CC-BY-NC-SA-4.0**. This experiment is for
local noncommercial academic use. The source export lacks per-post author and URL
attribution; resolve applicable rights and attribution before commercial use or
redistribution of the data or derived weights. The exact dataset card is retained
under `ml/licenses/Technical-QA-dataset-card.md`. BGE's base model has a separate
MIT license; that does not override training-data restrictions.
