import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { config, branchForAction } from "./core/config.mjs";

const workflows = ["daily.yml", "telegram.yml", "news-scan.yml", "research.yml"];
for (const name of workflows) {
  const source = readFileSync(`.github/workflows/${name}`, "utf8");
  const directWorkers = [...source.matchAll(/node\s+([\w./-]+\.mjs)/g)]
    .map((match) => match[1])
    .filter((worker) => worker !== "core/orchestrator.mjs" && worker !== "cloud-listen.mjs");
  assert.deepEqual(directWorkers, [], `${name} bypasses the orchestrator: ${directWorkers.join(", ")}`);
}
for (const action of Object.keys(config.actions)) assert.notEqual(branchForAction(action), "unclassified", `${action} must belong to a governed branch`);
assert.equal(branchForAction("build-tiktok"), "production");
assert.equal(branchForAction("content-search-live"), "editorial");
console.log("all executable workflow branches are governed by the orchestrator");
