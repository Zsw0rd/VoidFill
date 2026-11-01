"""Small CPU-only serving runtime; no PyTorch/Transformers import at inference."""
import os
import threading
from pathlib import Path

import numpy as np


class OnnxEncoder:
    def __init__(self, directory):
        self.directory = Path(directory)
        self.session = None
        self.load_lock = threading.Lock()
        self.max_seq_length = 256
        self.device = "cpu"

    def _load(self):
        if self.session is not None:
            return
        with self.load_lock:
            if self.session is None:
                self._initialize()

    def _initialize(self):
        import onnxruntime as ort
        from tokenizers import Tokenizer
        directory = self.directory
        options = ort.SessionOptions()
        options.intra_op_num_threads = max(1, int(os.getenv("ML_CPU_THREADS", "1")))
        options.inter_op_num_threads = 1
        options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        self.session = ort.InferenceSession(str(directory / "model.onnx"), options, providers=["CPUExecutionProvider"])
        self.inputs = {item.name for item in self.session.get_inputs()}
        self.tokenizer = Tokenizer.from_file(str(directory / "tokenizer.json"))
        self.tokenizer.enable_truncation(max_length=256)
        self.tokenizer.enable_padding(pad_id=0, pad_token="[PAD]")

    def encode(self, texts, batch_size=16, **_):
        self._load()
        outputs = []
        for start in range(0, len(texts), batch_size):
            encoded = self.tokenizer.encode_batch(texts[start:start + batch_size])
            values = {
                "input_ids": np.asarray([item.ids for item in encoded], dtype=np.int64),
                "attention_mask": np.asarray([item.attention_mask for item in encoded], dtype=np.int64),
                "token_type_ids": np.asarray([item.type_ids for item in encoded], dtype=np.int64),
            }
            outputs.append(self.session.run(None, {key: value for key, value in values.items() if key in self.inputs})[0])
        return np.concatenate(outputs, axis=0) if outputs else np.empty((0, 768), dtype=np.float32)

    def get_embedding_dimension(self):
        return 768
