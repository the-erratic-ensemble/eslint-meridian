import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  meridianLocalPilotRuleProfile,
  meridianLocalRecommendedRuleProfile,
  meridianLocalStrictRuleProfile,
} from "../../rules/profile.js";

const PACKAGE_ROOT = path.resolve(import.meta.dirname, "../..");
const CANONICAL_OXLINT_PROFILE_PATH = path.resolve(
  PACKAGE_ROOT,
  "oxlint/meridian-local-rules.json",
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

test("recommended profile matches canonical oxlint rules", () => {
  const oxlintConfig = readJson(CANONICAL_OXLINT_PROFILE_PATH);

  assert.deepEqual(meridianLocalRecommendedRuleProfile, oxlintConfig.rules);
});

test("strict and pilot profiles remain additive over recommended", () => {
  assert.equal(
    meridianLocalStrictRuleProfile[
      "meridian-local/no-deep-optional-chaining-conditions"
    ],
    "warn",
  );
  assert.equal(
    meridianLocalStrictRuleProfile[
      "meridian-local/no-mixed-ui-and-domain-logic-in-component"
    ],
    "warn",
  );
  assert.equal(
    meridianLocalStrictRuleProfile[
      "meridian-local/no-excessive-component-props"
    ],
    "warn",
  );
  assert.equal(
    meridianLocalStrictRuleProfile["meridian-local/no-prop-bags"],
    "warn",
  );
  assert.equal(
    meridianLocalPilotRuleProfile[
      "meridian-local/no-inline-object-literals-in-jsx"
    ],
    "warn",
  );
  assert.equal(
    meridianLocalPilotRuleProfile[
      "meridian-local/no-pre-jsx-mark-builder-loops"
    ],
    "warn",
  );
  assert.equal(
    meridianLocalPilotRuleProfile[
      "meridian-local/no-mixed-chart-setup-and-markup-in-component"
    ],
    "warn",
  );
  assert.equal(
    meridianLocalPilotRuleProfile[
      "meridian-local/no-inline-formatting-in-svg-marks"
    ],
    "warn",
  );
  assert.equal(
    meridianLocalPilotRuleProfile[
      "meridian-local/no-manual-active-item-scan-before-render"
    ],
    "warn",
  );
  assert.equal(
    meridianLocalPilotRuleProfile[
      "meridian-local/no-multi-phase-render-components"
    ],
    "warn",
  );
  assert.equal(
    meridianLocalRecommendedRuleProfile[
      "meridian-local/no-inline-object-literals-in-jsx"
    ],
    "off",
  );
  assert.equal(
    meridianLocalRecommendedRuleProfile[
      "meridian-local/no-excessive-component-props"
    ],
    undefined,
  );
  assert.equal(
    meridianLocalRecommendedRuleProfile["meridian-local/no-prop-bags"],
    undefined,
  );
  assert.equal(
    meridianLocalRecommendedRuleProfile[
      "meridian-local/no-nested-ternary-in-jsx"
    ],
    "warn",
  );
  assert.equal(
    meridianLocalRecommendedRuleProfile[
      "meridian-local/no-collection-methods-in-ternaries"
    ],
    "warn",
  );
  assert.equal(
    meridianLocalRecommendedRuleProfile[
      "meridian-local/no-collection-methods-on-spread-arrays"
    ],
    "warn",
  );
  assert.equal(
    meridianLocalRecommendedRuleProfile[
      "meridian-local/no-collection-constructor-pipelines"
    ],
    "warn",
  );
  assert.equal(
    meridianLocalRecommendedRuleProfile[
      "meridian-local/no-conditional-expressions-in-collection-callbacks"
    ],
    "warn",
  );
  assert.equal(
    meridianLocalRecommendedRuleProfile[
      "meridian-local/no-flatmap-present-items"
    ],
    "warn",
  );
  assert.equal(
    meridianLocalRecommendedRuleProfile[
      "meridian-local/no-conditional-collection-initializers"
    ],
    "warn",
  );
  assert.equal(
    meridianLocalRecommendedRuleProfile[
      "meridian-local/no-repeated-collection-method-fallbacks"
    ],
    "warn",
  );
  assert.equal(
    meridianLocalRecommendedRuleProfile[
      "meridian-local/no-inline-collection-fallbacks"
    ],
    "warn",
  );
  assert.equal(
    meridianLocalRecommendedRuleProfile[
      "meridian-local/no-indexed-collection-pipeline-fallbacks"
    ],
    "warn",
  );
  assert.equal(
    meridianLocalRecommendedRuleProfile[
      "meridian-local/no-set-map-from-flatmap"
    ],
    "warn",
  );
  assert.equal(
    meridianLocalRecommendedRuleProfile["meridian-local/no-nested-try"],
    "warn",
  );
  assert.equal(
    meridianLocalRecommendedRuleProfile[
      "meridian-local/no-complex-boolean-assignments"
    ],
    "warn",
  );
  assert.equal(
    meridianLocalRecommendedRuleProfile[
      "meridian-local/no-complex-conditional-text-in-jsx"
    ],
    "warn",
  );
  assert.deepEqual(
    meridianLocalRecommendedRuleProfile[
      "meridian-local/no-long-collection-method-chains"
    ],
    [
      "warn",
      {
        maxChainLength: 2,
      },
    ],
  );
});
