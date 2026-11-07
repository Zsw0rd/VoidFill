import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { configure, root, python, requirePython, run, serviceArgs } from "./runtime.mjs";

try {
  const command = process.argv[2];
  configure({ createToken: command === "serve" });
  if (command === "setup") {
    if (!existsSync(python)) await run(process.env.ML_PYTHON || "python", ["-m", "venv", join(root, ".venv-ml")]);
    const cuda = spawnSync("nvidia-smi", ["--query-gpu=name", "--format=csv,noheader"], { windowsHide: true }).status === 0;
    await run(python, ["-m", "pip", "install", "torch==2.11.0", "--index-url", `https://download.pytorch.org/whl/${cuda ? "cu128" : "cpu"}`]);
    await run(python, ["-m", "pip", "install", "-r", existsSync(join(root, "ml/requirements.lock.txt")) ? "ml/requirements.lock.txt" : "ml/requirements.txt"]);
  } else {
    requirePython();
    if (command === "prepare") await run(python, ["-m", "ml.prepare_data"]);
    else if (command === "train") await run(python, ["-m", "ml.train", ...process.argv.slice(3)]);
    else if (command === "train-expanded") {
      await run(python, ["-m", "ml.train_expanded"]);
      await run(python, ["-m", "ml.train_passages"]);
    }
    else if (command === "train-large") {
      await run(python, ["-m", "ml.prepare_large"]);
      await run(python, ["-m", "ml.train_large"]);
    }
    else if (command === "activate-large") await run(python, ["-m", "ml.activate_large"]);
    else if (command === "export-cloud") {
      await run(python, ["-m", "pip", "install", "-r", "ml/requirements-export.txt"]);
      await run(python, ["-m", "ml.export_cloud"]);
      await run(python, ["-m", "ml.package_cloud"]);
    }
    else if (command === "test") {
      process.env.ML_BACKEND ||= "onnx";
      await run(python, ["-m", "pytest", "ml/tests", "-m", "not offline_training", "-q"]);
    }
    else if (command === "test-offline") await run(python, ["-m", "pytest", "ml/tests", "-m", "offline_training", "-q"]);
    else if (command === "serve") await run(python, serviceArgs());
    else throw new Error("Usage: node scripts/ml.mjs setup|prepare|train|train-expanded|train-large|activate-large|test|test-offline|serve");
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
