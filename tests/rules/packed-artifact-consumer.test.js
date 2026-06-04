import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { spawnSync } from "node:child_process";

const PACKAGE_DIR = path.resolve(import.meta.dirname, "../..");
let cachedPackedConsumerProbe;

function runCommand(command, args, options) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    ...options
  });

  if (result.status !== 0) {
    throw new Error(
      [
        `Command failed: ${command} ${args.join(" ")}`,
        result.stdout,
        result.stderr
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  return result;
}

function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function runPackedConsumerProbe() {
  const packDir = fs.mkdtempSync(path.join(os.tmpdir(), "meridian-eslint-rules-pack-"));
  const consumerDir = fs.mkdtempSync(path.join(os.tmpdir(), "meridian-eslint-rules-consumer-"));

  try {
    runCommand("pnpm", ["pack", "--pack-destination", packDir], {
      cwd: PACKAGE_DIR,
      env: process.env
    });

    const tarballName = fs.readdirSync(packDir).find((entry) => entry.endsWith(".tgz"));

    assert.ok(tarballName, "pnpm pack did not produce a tarball");

    writeJsonFile(path.join(consumerDir, "package.json"), {
      name: "packed-eslint-rules-consumer",
      private: true,
      type: "module"
    });

    runCommand("pnpm", ["add", path.join(packDir, tarballName)], {
      cwd: consumerDir,
      env: process.env
    });

    const probePath = path.join(consumerDir, "probe.mjs");
    fs.writeFileSync(
      probePath,
      `
        import plugin from "eslint-meridian";
        import * as configs from "eslint-meridian/configs";
        import * as rules from "eslint-meridian/rules";

        const pluginConfigFragment = {
          plugins: {
            "meridian-local": plugin
          },
          rules: {
            "meridian-local/react-component-filename-pascal-case": "warn"
          }
        };

        console.log(
          JSON.stringify({
            pluginMetaName: plugin.meta?.name ?? null,
            pluginRuleCount: Object.keys(plugin.rules ?? {}).length,
            hasReactComponentFilenamePascalCaseRule:
              typeof plugin.rules?.["react-component-filename-pascal-case"] === "object",
            recommendedConfigUsesPlugin:
              configs.meridianLocalRecommendedConfig.plugins["meridian-local"] === plugin,
            hasRecommendedConfig:
              typeof configs.meridianLocalRecommendedConfig === "object",
            hasRuleNamespaceExport:
              typeof rules.reactComponentFilenamePascalCaseRule === "object",
            configLikeConsumerUsesPlugin:
              pluginConfigFragment.plugins["meridian-local"] === plugin,
            configLikeConsumerHasRule:
              pluginConfigFragment.rules["meridian-local/react-component-filename-pascal-case"] === "warn"
          })
        );
      `,
      "utf8"
    );

    const probeResult = runCommand("node", [probePath], {
      cwd: consumerDir,
      env: process.env
    });

    return JSON.parse(probeResult.stdout.trim());
  } finally {
    fs.rmSync(packDir, { recursive: true, force: true });
    fs.rmSync(consumerDir, { recursive: true, force: true });
  }
}

function getPackedConsumerProbe() {
  cachedPackedConsumerProbe ??= runPackedConsumerProbe();
  return cachedPackedConsumerProbe;
}

test("packed artifact exposes documented configs and rules entrypoints to consumers", () => {
  const probe = getPackedConsumerProbe();

  assert.equal(probe.pluginMetaName, "eslint-meridian");
  assert.equal(probe.recommendedConfigUsesPlugin, true);
  assert.equal(probe.hasRecommendedConfig, true);
  assert.equal(probe.hasRuleNamespaceExport, true);
  assert.ok(probe.pluginRuleCount > 0);
});

test("packed artifact preserves the root plugin shape used by direct dependents", () => {
  const probe = getPackedConsumerProbe();

  assert.equal(probe.hasReactComponentFilenamePascalCaseRule, true);
  assert.equal(probe.configLikeConsumerUsesPlugin, true);
  assert.equal(probe.configLikeConsumerHasRule, true);
});
