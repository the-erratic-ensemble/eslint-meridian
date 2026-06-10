import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { spawnSync } from "node:child_process";

const PACKAGE_ROOT = path.resolve(import.meta.dirname, "../..");
const OXLINT_PLUGIN_PATH = path.resolve(
  PACKAGE_ROOT,
  "oxlint/meridian-local-plugin.js",
);

function runOxlintRule({
  code,
  filename = "fixture.tsx",
  ruleName,
  options = [],
}) {
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "meridian-oxlint-rule-"),
  );
  const filePath = path.join(tempDir, filename);
  const configPath = path.join(tempDir, ".oxlintrc.json");
  const relativePluginPath = path
    .relative(tempDir, OXLINT_PLUGIN_PATH)
    .replaceAll(path.sep, "/");

  fs.writeFileSync(filePath, code, "utf8");
  fs.writeFileSync(
    configPath,
    JSON.stringify(
      {
        jsPlugins: [relativePluginPath],
        rules: {
          [`meridian-local/${ruleName}`]: ["error", ...options],
        },
      },
      null,
      2,
    ),
    "utf8",
  );

  const result = spawnSync(
    "pnpm",
    ["exec", "oxlint", "--config", configPath, "--format", "json", filePath],
    {
      cwd: PACKAGE_ROOT,
      encoding: "utf8",
      env: process.env,
    },
  );

  try {
    if (![0, 1].includes(result.status ?? 0)) {
      throw new Error(`oxlint failed:\n${result.stdout}\n${result.stderr}`);
    }

    const parsed = JSON.parse(result.stdout);
    return parsed.diagnostics ?? [];
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function getRuleDiagnostics(diagnostics, ruleName) {
  return diagnostics.filter(
    (entry) => entry.code === `meridian-local(${ruleName})`,
  );
}

test("Oxlint JS plugin reports react19-no-forwardref", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "react19-no-forwardref",
      code: `
        import React, { forwardRef } from "react";
        export const Card = forwardRef(function Card(props, ref) {
          return <div ref={ref}>{props.children}</div>;
        });
      `,
    }),
    "react19-no-forwardref",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(diagnostics[0].message, /Avoid forwardRef/);
  assert.match(diagnostics[0].code, /meridian-local\(react19-no-forwardref\)/);
});

test("Oxlint JS plugin reports no-excessive-component-props", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-excessive-component-props",
      code: `
        function LoginPageFormCard({
          emailField,
          passwordField,
          rememberMeField,
          submitLabel,
          errorMessage,
          isHydrated,
          isLoading,
          onSubmit,
          onForgotPassword
        }: {
          emailField: string;
          passwordField: string;
          rememberMeField: boolean;
          submitLabel: string;
          errorMessage: string | null;
          isHydrated: boolean;
          isLoading: boolean;
          onSubmit: () => void;
          onForgotPassword: () => void;
        }) {
          return <form>{submitLabel}</form>;
        }
      `,
    }),
    "no-excessive-component-props",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(diagnostics[0].message, /top-level props/);
  assert.match(
    diagnostics[0].code,
    /meridian-local\(no-excessive-component-props\)/,
  );
});

test("Oxlint JS plugin reports no-prop-bags", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-prop-bags",
      code: `
        interface LoginFormFieldsProps {
          describedBy: {
            email: string;
            password: string;
          };
          ids: {
            emailDescription: string;
            emailError: string;
            passwordDescription: string;
            passwordError: string;
          };
          handlers: {
            handleEmailChange: () => void;
            handlePasswordChange: () => void;
            handleTogglePassword: () => void;
            handleRememberMeChange: () => void;
          };
        }
      `,
    }),
    "no-prop-bags",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(diagnostics[0].message, /nested prop bags/);
  assert.match(diagnostics[0].code, /meridian-local\(no-prop-bags\)/);
});

test("Oxlint JS plugin reports no-deep-control-flow-nesting", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-deep-control-flow-nesting",
      code: `
        function collect(groups) {
          for (const group of groups) {
            if (group.active) {
              for (const item of group.items) {
                keep(item);
              }
            }
          }
        }
      `,
    }),
    "no-deep-control-flow-nesting",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(diagnostics[0].message, /Control-flow nesting is too deep/);
  assert.match(
    diagnostics[0].code,
    /meridian-local\(no-deep-control-flow-nesting\)/,
  );
});

test("Oxlint JS plugin reports no-complex-boolean-assignments", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-complex-boolean-assignments",
      code: `
        const confirmButtonDisabled =
          !targetPlan ||
          isSubmitting ||
          (!checkoutError && (!quote || dialogState === "loading-quote" || !quoteMatchesCadence));
      `,
    }),
    "no-complex-boolean-assignments",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(diagnostics[0].message, /Boolean flag 'confirmButtonDisabled'/);
  assert.match(
    diagnostics[0].code,
    /meridian-local\(no-complex-boolean-assignments\)/,
  );
});

test("Oxlint JS plugin reports no-complex-conditional-text-in-jsx", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-complex-conditional-text-in-jsx",
      code: `
        const view = (
          <p>
            {criticalFeatures.length > 0 || warningFeatures.length > 0
              ? \`\${criticalFeatures.length} critical · \${warningFeatures.length} warning\`
              : "No alerts"}
          </p>
        );
      `,
    }),
    "no-complex-conditional-text-in-jsx",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(diagnostics[0].message, /Do not inline complex conditional text in JSX/);
  assert.match(
    diagnostics[0].code,
    /meridian-local\(no-complex-conditional-text-in-jsx\)/,
  );
});

test("Oxlint JS plugin reports no-complex-array-callbacks for dense predicates", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-complex-array-callbacks",
      code: `
        const fallbackGroups = groups.filter(
          (group) =>
            !usedGroupKeys.has(group.key) &&
            !!group.nearestAmenityName &&
            !!group.nearestDistanceLabel &&
            (group.nearestDistanceMeters ?? 0) > 0
        );
      `,
    }),
    "no-complex-array-callbacks",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(diagnostics[0].message, /Keep filter callbacks simple/);
  assert.match(
    diagnostics[0].code,
    /meridian-local\(no-complex-array-callbacks\)/,
  );
});

test("Oxlint JS plugin reports no-nested-try", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-nested-try",
      code: `
        async function saveRecord() {
          try {
            await persist();
          } catch (error) {
            try {
              await rollback();
            } catch (rollbackError) {
              report(rollbackError);
            }
          }
        }
      `,
    }),
    "no-nested-try",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(
    diagnostics[0].message,
    /Do not nest try blocks inside catch blocks/,
  );
  assert.match(diagnostics[0].code, /meridian-local\(no-nested-try\)/);
});

test("Oxlint JS plugin reports no-long-collection-method-chains", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-long-collection-method-chains",
      code: `
        const itemsToShow = (items ?? [])
          .filter((item) => item.visible)
          .slice(0, 3)
          .map((item) => item.id);
      `,
    }),
    "no-long-collection-method-chains",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(diagnostics[0].message, /3 tracked methods/);
  assert.match(
    diagnostics[0].code,
    /meridian-local\(no-long-collection-method-chains\)/,
  );
});

test("Oxlint JS plugin reports no-long-inline-object-methods", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-long-inline-object-methods",
      code: `
        const store = {
          fetchAutocomplete: async (query, limit = 10) => {
            const validation = validateSearchQuery(query);
            if (!validation.isValid) {
              setError(validation.error);
              return;
            }
            clearError();
            setLoading(true);
          }
        };
      `,
    }),
    "no-long-inline-object-methods",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(diagnostics[0].message, /Inline object method/);
  assert.match(
    diagnostics[0].code,
    /meridian-local\(no-long-inline-object-methods\)/,
  );
});

test("Oxlint JS plugin reports no-complex-inline-object-methods", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-complex-inline-object-methods",
      code: `
        const store = {
          fetchSummary: () =>
            isReady && hasSelection
              ? items.map((item) => (item.active ? summarize(item) : null))
              : null
        };
      `,
    }),
    "no-complex-inline-object-methods",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(diagnostics[0].message, /too complex/);
  assert.match(
    diagnostics[0].code,
    /meridian-local\(no-complex-inline-object-methods\)/,
  );
});

test("Oxlint JS plugin reports no-collection-methods-in-ternaries", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-collection-methods-in-ternaries",
      code: `
        const values = hasValues ? valuesFromProps : rows.map((row) => row.id);
      `,
    }),
    "no-collection-methods-in-ternaries",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(
    diagnostics[0].message,
    /collection method work inside ternary branches/,
  );
  assert.equal(
    diagnostics[0].code,
    "meridian-local(no-collection-methods-in-ternaries)",
  );
});

test("Oxlint JS plugin reports no-collection-methods-on-spread-arrays", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-collection-methods-on-spread-arrays",
      code: `
        const points = [...(items ?? [])]
          .filter((item) => item.visible)
          .toSorted((left, right) => left.rank - right.rank)
          .slice(0, 5)
          .map((item) => item.id);
      `,
    }),
    "no-collection-methods-on-spread-arrays",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(
    diagnostics[0].message,
    /spread arrays inline just to run collection methods/,
  );
  assert.equal(
    diagnostics[0].code,
    "meridian-local(no-collection-methods-on-spread-arrays)",
  );
});

test("Oxlint JS plugin reports no-collection-constructor-pipelines", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-collection-constructor-pipelines",
      code: `
        const values = new Set(messages.map((message) => message.trim()).filter((message) => message.length > 0));
      `,
    }),
    "no-collection-constructor-pipelines",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(
    diagnostics[0].message,
    /construct Set instances from inline collection-shaping pipelines/,
  );
  assert.equal(
    diagnostics[0].code,
    "meridian-local(no-collection-constructor-pipelines)",
  );
});

test("Oxlint JS plugin reports no-inline-spread-collection-pipelines", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-inline-spread-collection-pipelines",
      code: `
        const nextItems = [selectedItem, ...items.filter((item) => item.id !== selectedItem.id)].slice(0, 5);
      `,
    }),
    "no-inline-spread-collection-pipelines",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(
    diagnostics[0].message,
    /inline array assembly with spread-driven collection pipeline work/,
  );
  assert.equal(
    diagnostics[0].code,
    "meridian-local(no-inline-spread-collection-pipelines)",
  );
});

test("Oxlint JS plugin reports no-conditional-expressions-in-collection-callbacks", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-conditional-expressions-in-collection-callbacks",
      code: `
        const values = items.map((item) => item.enabled ? { id: item.id } : { id: "fallback" });
      `,
    }),
    "no-conditional-expressions-in-collection-callbacks",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(
    diagnostics[0].message,
    /conditional expressions into map callbacks/,
  );
  assert.equal(
    diagnostics[0].code,
    "meridian-local(no-conditional-expressions-in-collection-callbacks)",
  );
});

test("Oxlint JS plugin reports no-flatmap-present-items", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-flatmap-present-items",
      code: `
        const values = items.flatMap((item) => item.enabled ? [item.id] : []);
      `,
    }),
    "no-flatmap-present-items",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(
    diagnostics[0].message,
    /Do not use flatMap as a compact present-items filter/,
  );
  assert.equal(diagnostics[0].code, "meridian-local(no-flatmap-present-items)");
});

test("Oxlint JS plugin reports no-conditional-collection-initializers", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-conditional-collection-initializers",
      code: `
        const nextItems = showAll ? items : items.filter((item) => item.active);
      `,
    }),
    "no-conditional-collection-initializers",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(
    diagnostics[0].message,
    /Do not initialize collections with ternary expressions/,
  );
  assert.equal(
    diagnostics[0].code,
    "meridian-local(no-conditional-collection-initializers)",
  );
});

test("Oxlint JS plugin reports no-repeated-collection-method-fallbacks", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-repeated-collection-method-fallbacks",
      code: `
        const selected =
          rows.find((row) => row.isPrimary) ??
          rows.filter((row) => row.hasScore) ??
          rows[0] ??
          null;
      `,
    }),
    "no-repeated-collection-method-fallbacks",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(diagnostics[0].message, /repeated collection-method calls/);
  assert.equal(
    diagnostics[0].code,
    "meridian-local(no-repeated-collection-method-fallbacks)",
  );
});

test("Oxlint JS plugin reports no-indexed-collection-pipeline-fallbacks", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-indexed-collection-pipeline-fallbacks",
      code: `
        const selected =
          rows.filter((row) => row.active).toSorted((left, right) => left.rank - right.rank)[0] ??
          null;
      `,
    }),
    "no-indexed-collection-pipeline-fallbacks",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(diagnostics[0].message, /first-item selection/);
  assert.equal(
    diagnostics[0].code,
    "meridian-local(no-indexed-collection-pipeline-fallbacks)",
  );
});

test("Oxlint JS plugin reports no-indexed-collection-pipeline-fallbacks for destructuring", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-indexed-collection-pipeline-fallbacks",
      code: `
        const [selected] = rows.filter((row) => row.active).toSorted((left, right) => left.rank - right.rank);
      `,
    }),
    "no-indexed-collection-pipeline-fallbacks",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(diagnostics[0].message, /first-item selection/);
  assert.equal(
    diagnostics[0].code,
    "meridian-local(no-indexed-collection-pipeline-fallbacks)",
  );
});

test("Oxlint JS plugin reports no-set-map-from-flatmap", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-set-map-from-flatmap",
      code: `
        const values = new Set(items.flatMap((item) => item.labels));
      `,
    }),
    "no-set-map-from-flatmap",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(
    diagnostics[0].message,
    /construct Set instances directly from flatMap expressions/,
  );
  assert.equal(diagnostics[0].code, "meridian-local(no-set-map-from-flatmap)");
});

test("Oxlint JS plugin reports no-forbidden-declaration-names with contains matcher", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-forbidden-declaration-names",
      options: [{ patterns: [{ contains: "derive", caseSensitive: false }] }],
      code: `
        const derivedSummary = "ok";
      `,
    }),
    "no-forbidden-declaration-names",
  );

  assert.ok(diagnostics.length >= 1);
  assert.ok(
    diagnostics.some((entry) =>
      /violates the shared forbidden naming policy/.test(entry.message),
    ),
  );
  assert.ok(
    diagnostics.some((entry) =>
      /meridian-local\(no-forbidden-declaration-names\)/.test(entry.code),
    ),
  );
});

test("Oxlint JS plugin reports no-forbidden-declaration-names with render contains matcher", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-forbidden-declaration-names",
      options: [{ patterns: [{ contains: "render", caseSensitive: false }] }],
      code: `
        function RenderBillingPanel() {
          return null;
        }
      `,
    }),
    "no-forbidden-declaration-names",
  );

  assert.ok(diagnostics.length >= 1);
  assert.ok(
    diagnostics.some((entry) =>
      /violates the shared forbidden naming policy/.test(entry.message),
    ),
  );
  assert.ok(
    diagnostics.some((entry) =>
      /meridian-local\(no-forbidden-declaration-names\)/.test(entry.code),
    ),
  );
});

test("Oxlint JS plugin reports no-forbidden-declaration-names for rendered variable names", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-forbidden-declaration-names",
      options: [{ patterns: [{ contains: "render", caseSensitive: false }] }],
      code: `
        const renderedSummary = null;
      `,
    }),
    "no-forbidden-declaration-names",
  );

  assert.ok(diagnostics.length >= 1);
  assert.ok(
    diagnostics.some((entry) =>
      /violates the shared forbidden naming policy/.test(entry.message),
    ),
  );
  assert.ok(
    diagnostics.some((entry) =>
      /meridian-local\(no-forbidden-declaration-names\)/.test(entry.code),
    ),
  );
});

test("Oxlint JS plugin reports no-forbidden-declaration-names for renderer interface names", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-forbidden-declaration-names",
      options: [{ patterns: [{ contains: "render", caseSensitive: false }] }],
      filename: "fixture.ts",
      code: `
        interface ReportingRenderer {
          id: string;
        }
      `,
    }),
    "no-forbidden-declaration-names",
  );

  assert.ok(diagnostics.length >= 1);
  assert.ok(
    diagnostics.some((entry) =>
      /violates the shared forbidden naming policy/.test(entry.message),
    ),
  );
  assert.ok(
    diagnostics.some((entry) =>
      /meridian-local\(no-forbidden-declaration-names\)/.test(entry.code),
    ),
  );
});

test("Oxlint JS plugin reports no-forbidden-declaration-names for renderer interface property names", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-forbidden-declaration-names",
      options: [{ patterns: [{ contains: "render", caseSensitive: false }] }],
      filename: "fixture.ts",
      code: `
        interface ReportingHealth {
          renderer?: string;
        }
      `,
    }),
    "no-forbidden-declaration-names",
  );

  assert.ok(diagnostics.length >= 1);
  assert.ok(
    diagnostics.some((entry) =>
      /violates the shared forbidden naming policy/.test(entry.message),
    ),
  );
  assert.ok(
    diagnostics.some((entry) =>
      /meridian-local\(no-forbidden-declaration-names\)/.test(entry.code),
    ),
  );
});

test("Oxlint JS plugin allows exact approved names for no-forbidden-declaration-names", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-forbidden-declaration-names",
      options: [
        {
          allowNames: ["buildingFabricScore"],
          patterns: [{ startsWith: "build", caseSensitive: true }],
        },
      ],
      filename: "fixture.ts",
      code: `
        interface ReferenceSummary {
          buildingFabricScore?: number | null;
        }
      `,
    }),
    "no-forbidden-declaration-names",
  );

  assert.equal(diagnostics.length, 0);
});

test("Oxlint JS plugin allows resolve as a Promise executor parameter passed to setTimeout", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-forbidden-declaration-names",
      options: [{ patterns: [{ contains: "resolve", caseSensitive: false }] }],
      filename: "fixture.ts",
      code: `
        const waitForValue = (t, val) =>
          new Promise((resolve) => setTimeout(resolve, t, val));
      `,
    }),
    "no-forbidden-declaration-names",
  );

  assert.equal(diagnostics.length, 0);
});

test("Oxlint JS plugin allows resolve as a Promise executor parameter inside a setTimeout callback", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-forbidden-declaration-names",
      options: [{ patterns: [{ contains: "resolve", caseSensitive: false }] }],
      filename: "fixture.ts",
      code: `
        const timeoutPromise = new Promise((resolve) => {
          timeoutId = setTimeout(() => resolve(FACT_SHEET_TIMEOUT), timeoutMs);
        });
      `,
    }),
    "no-forbidden-declaration-names",
  );

  assert.equal(diagnostics.length, 0);
});

test("Oxlint JS plugin allows error boundary lifecycle member names", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-forbidden-declaration-names",
      options: [
        {
          patterns: [
            { contains: "render", caseSensitive: false },
            { contains: "derive", caseSensitive: false },
          ],
        },
      ],
      filename: "fixture.tsx",
      code: `
        import { Component } from "react";

        class SubscriptionPanelErrorBoundary extends Component {
          static getDerivedStateFromError() {
            return { hasError: true };
          }

          componentDidCatch() {}

          render() {
            return null;
          }
        }
      `,
    }),
    "no-forbidden-declaration-names",
  );

  assert.equal(diagnostics.length, 0);
});

test("Oxlint JS plugin still reports render on non-error-boundary class members", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-forbidden-declaration-names",
      options: [{ patterns: [{ contains: "render", caseSensitive: false }] }],
      filename: "fixture.tsx",
      code: `
        class ReportRenderer {
          render() {
            return null;
          }
        }
      `,
    }),
    "no-forbidden-declaration-names",
  );

  assert.ok(diagnostics.length >= 1);
});

test("Oxlint JS plugin reports no-forbidden-declaration-names for renderer object property names", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-forbidden-declaration-names",
      options: [{ patterns: [{ contains: "render", caseSensitive: false }] }],
      code: `
        const reportingHealth = {
          renderer: "pdf",
        };
      `,
    }),
    "no-forbidden-declaration-names",
  );

  assert.ok(diagnostics.length >= 1);
  assert.ok(
    diagnostics.some((entry) =>
      /violates the shared forbidden naming policy/.test(entry.message),
    ),
  );
  assert.ok(
    diagnostics.some((entry) =>
      /meridian-local\(no-forbidden-declaration-names\)/.test(entry.code),
    ),
  );
});

test("Oxlint JS plugin reports no-forbidden-declaration-names for rendered class field names", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-forbidden-declaration-names",
      options: [{ patterns: [{ contains: "render", caseSensitive: false }] }],
      filename: "fixture.ts",
      code: `
        class PreviewState {
          renderedSummary = "";
        }
      `,
    }),
    "no-forbidden-declaration-names",
  );

  assert.ok(diagnostics.length >= 1);
  assert.ok(
    diagnostics.some((entry) =>
      /violates the shared forbidden naming policy/.test(entry.message),
    ),
  );
  assert.ok(
    diagnostics.some((entry) =>
      /meridian-local\(no-forbidden-declaration-names\)/.test(entry.code),
    ),
  );
});

test("Oxlint JS plugin reports no-forbidden-declaration-names for renderer parameter names", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-forbidden-declaration-names",
      options: [{ patterns: [{ contains: "render", caseSensitive: false }] }],
      code: `
        function reportStatus(renderer) {
          return renderer;
        }
      `,
    }),
    "no-forbidden-declaration-names",
  );

  assert.ok(diagnostics.length >= 1);
  assert.ok(
    diagnostics.some((entry) =>
      /violates the shared forbidden naming policy/.test(entry.message),
    ),
  );
  assert.ok(
    diagnostics.some((entry) =>
      /meridian-local\(no-forbidden-declaration-names\)/.test(entry.code),
    ),
  );
});

test("Oxlint JS plugin reports no-forbidden-declaration-names with ClassName suffix matcher", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-forbidden-declaration-names",
      options: [{ patterns: [{ endsWith: "ClassName", caseSensitive: true }] }],
      code: `
        function cardClassName() {
          return "card";
        }
      `,
    }),
    "no-forbidden-declaration-names",
  );

  assert.ok(diagnostics.length >= 1);
  assert.ok(
    diagnostics.some((entry) =>
      /violates the shared forbidden naming policy/.test(entry.message),
    ),
  );
  assert.ok(
    diagnostics.some((entry) =>
      /meridian-local\(no-forbidden-declaration-names\)/.test(entry.code),
    ),
  );
});

test("Oxlint JS plugin reports no-forbidden-declaration-names with View suffix matcher", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-forbidden-declaration-names",
      options: [{ patterns: [{ endsWith: "View", caseSensitive: true }] }],
      code: `
        function accountSummaryView() {
          return null;
        }
      `,
    }),
    "no-forbidden-declaration-names",
  );

  assert.ok(diagnostics.length >= 1);
  assert.ok(
    diagnostics.some((entry) =>
      /violates the shared forbidden naming policy/.test(entry.message),
    ),
  );
  assert.ok(
    diagnostics.some((entry) =>
      /meridian-local\(no-forbidden-declaration-names\)/.test(entry.code),
    ),
  );
});

test("Oxlint JS plugin reports no-jsx-in-variables for ternary-wrapped JSX", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-jsx-in-variables",
      options: [{ allowNamePattern: "^$" }],
      code: `
        const detailMetrics = showDetails ? (
          <section>Metrics</section>
        ) : null;
      `,
    }),
    "no-jsx-in-variables",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(
    diagnostics[0].message,
    /Do not assign JSX to variable detailMetrics/,
  );
  assert.match(diagnostics[0].code, /meridian-local\(no-jsx-in-variables\)/);
});

test("Oxlint JS plugin reports no-jsx-iife inside JSX map callbacks", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-jsx-iife",
      code: `
        function Example({ modules }: { modules: Array<{ id: string; title: string }> }): JSX.Element {
          return (
            <div>
              {modules.map((module) =>
                (() => {
                  const bodyContent = moduleBodyContent(module);

                  return <article key={module.id}>{bodyContent}</article>;
                })(),
              )}
            </div>
          );
        }
      `,
    }),
    "no-jsx-iife",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(diagnostics[0].message, /Do not use IIFEs inside JSX/);
  assert.match(diagnostics[0].code, /meridian-local\(no-jsx-iife\)/);
});

test("Oxlint JS plugin reports no-jsx-in-variables for logical JSX", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-jsx-in-variables",
      options: [{ allowNamePattern: "^$" }],
      code: `
        const detailMetrics = showDetails && <section>Metrics</section>;
      `,
    }),
    "no-jsx-in-variables",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(
    diagnostics[0].message,
    /Do not assign JSX to variable detailMetrics/,
  );
  assert.match(diagnostics[0].code, /meridian-local\(no-jsx-in-variables\)/);
});

test("Oxlint JS plugin reports no-jsx-in-variables for JSX reassignment inside switch branches", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-jsx-in-variables",
      options: [{ allowNamePattern: "^$" }],
      code: `
        let content: JSX.Element | null = null;

        switch (activeTab) {
          case "billing":
            if (!canReadProtectedSubscriptionData) {
              content = <BillingPreviewCard />;
              break;
            }

            content = <BillingPanel />;
            break;
          default:
            content = null;
        }
      `,
    }),
    "no-jsx-in-variables",
  );

  assert.equal(diagnostics.length, 2);
  assert.ok(
    diagnostics.every((entry) =>
      /Do not assign JSX to variable content/.test(entry.message),
    ),
  );
  assert.ok(
    diagnostics.every((entry) =>
      /meridian-local\(no-jsx-in-variables\)/.test(entry.code),
    ),
  );
});

test("Oxlint JS plugin reports no-jsx-in-variables for local JSX helper call assignments", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-jsx-in-variables",
      options: [{ allowNamePattern: "^$" }],
      code: `
        function availabilityDisclosureNode(model: { hasAvailability: boolean }): JSX.Element | null {
          if (!model.hasAvailability) {
            return null;
          }

          return <AvailabilityDisclosure model={model} />;
        }

        const availabilityDisclosure = availabilityDisclosureNode(model);
      `,
    }),
    "no-jsx-in-variables",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(
    diagnostics[0].message,
    /Do not assign local JSX helper result availabilityDisclosureNode\(\.\.\.\) to variable availabilityDisclosure/,
  );
  assert.match(diagnostics[0].code, /meridian-local\(no-jsx-in-variables\)/);
});

test("Oxlint JS plugin reports no-jsx-in-variables for conditional local JSX helper call assignments", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-jsx-in-variables",
      options: [{ allowNamePattern: "^$" }],
      code: `
        function errorCard(result: { kind: string }): JSX.Element {
          return <ErrorCard result={result} />;
        }

        const errorContent = result.kind === "ok" ? null : errorCard(result);
      `,
    }),
    "no-jsx-in-variables",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(
    diagnostics[0].message,
    /Do not assign local JSX helper result errorCard\(\.\.\.\) to variable errorContent/,
  );
  assert.match(diagnostics[0].code, /meridian-local\(no-jsx-in-variables\)/);
});

test("Oxlint JS plugin reports no-jsx-in-variables for object literals that store JSX values", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-jsx-in-variables",
      options: [{ allowNamePattern: "^$" }],
      code: `
        const sectionsMap = {
          overview: <section>Overview</section>,
          settings: <section>Settings</section>
        };
      `,
    }),
    "no-jsx-in-variables",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(
    diagnostics[0].message,
    /Do not assign JSX to variable sectionsMap/,
  );
  assert.match(diagnostics[0].code, /meridian-local\(no-jsx-in-variables\)/);
});

test("Oxlint JS plugin reports no-jsx-in-variables for array literals that store JSX values", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-jsx-in-variables",
      options: [{ allowNamePattern: "^$" }],
      code: `
        const sectionList = [
          <section key="overview">Overview</section>,
          <section key="settings">Settings</section>
        ];
      `,
    }),
    "no-jsx-in-variables",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(
    diagnostics[0].message,
    /Do not assign JSX to variable sectionList/,
  );
  assert.match(diagnostics[0].code, /meridian-local\(no-jsx-in-variables\)/);
});

test("Oxlint JS plugin reports no-local-jsx-helper-calls for argument-taking JSX helpers", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-local-jsx-helper-calls",
      filename: "fixture.tsx",
      code: `
        function optionalTextBlock(text: string | undefined, className: string): JSX.Element | null {
          if (!text) {
            return null;
          }

          return <div className={className}>{text}</div>;
        }

        function Example({ item }: { item: { detail?: string } }) {
          return <div>{optionalTextBlock(item.detail, "text-muted")}</div>;
        }
      `,
    }),
    "no-local-jsx-helper-calls",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(
    diagnostics[0].message,
    /Do not call local JSX helper optionalTextBlock inside JSX/,
  );
  assert.match(
    diagnostics[0].code,
    /meridian-local\(no-local-jsx-helper-calls\)/,
  );
});

test("Oxlint JS plugin reports no-complex-jsx-collection-callback inside JSX conditionals", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-complex-jsx-collection-callback",
      code: `
        const view = (
          <>
            {ready ? rows.map((row) => {
              const label = row.label.trim();
              return <span>{label}</span>;
            }) : null}
          </>
        );
      `,
    }),
    "no-complex-jsx-collection-callback",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(diagnostics[0].message, /Keep JSX map callbacks simple/);
  assert.match(
    diagnostics[0].code,
    /meridian-local\(no-complex-jsx-collection-callback\)/,
  );
});

test("Oxlint JS plugin reports no-staged-conditional-class-tokens", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-staged-conditional-class-tokens",
      code: `
        function Card({ active }) {
          const statusClass = active ? "bg-brand-300" : "text-white/60";
          return <div className={\`rounded \${statusClass}\`} />;
        }
      `,
    }),
    "no-staged-conditional-class-tokens",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(diagnostics[0].message, /Do not stage conditional class token/);
  assert.match(
    diagnostics[0].code,
    /meridian-local\(no-staged-conditional-class-tokens\)/,
  );
});

test("Oxlint JS plugin reports no-render-time-date-in-jsx", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-render-time-date-in-jsx",
      code: `
        function Footer() {
          return <footer>{new Date().getFullYear()}</footer>;
        }
      `,
    }),
    "no-render-time-date-in-jsx",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(
    diagnostics[0].message,
    /Do not construct Date values inside JSX/,
  );
  assert.match(
    diagnostics[0].code,
    /meridian-local\(no-render-time-date-in-jsx\)/,
  );
});

test("Oxlint JS plugin reports no-pre-jsx-mark-builder-loops", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-pre-jsx-mark-builder-loops",
      code: `
        function PriceChart({ points }) {
          const pointMarks = [];

          for (const point of points) {
            pointMarks.push(<circle key={point.id} cx={point.x} cy={point.y} />);
          }

          return <svg>{pointMarks}</svg>;
        }
      `,
    }),
    "no-pre-jsx-mark-builder-loops",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(
    diagnostics[0].code,
    /meridian-local\(no-pre-jsx-mark-builder-loops\)/,
  );
});

test("Oxlint JS plugin reports no-mixed-chart-setup-and-markup-in-component", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-mixed-chart-setup-and-markup-in-component",
      code: `
        import { scaleLinear, line } from "d3";

        function PropertyPriceChartContent({ points, yTicks, yearTicks }) {
          const xScale = scaleLinear().domain([0, 10]).range([0, 100]);
          const yScale = scaleLinear().domain([0, 10]).range([100, 0]);
          const path = line().x((point) => xScale(point.x)).y((point) => yScale(point.y))(points);
          const pointMarks = [];

          for (const point of points) {
            pointMarks.push(<circle key={point.id} cx={xScale(point.x)} cy={yScale(point.y)} />);
          }

          return (
            <svg>
              {yTicks.map((tick) => <text key={tick}>{tick}</text>)}
              {yearTicks.map((tick) => <text key={tick}>{tick}</text>)}
              {path ? <path d={path} /> : null}
              {pointMarks}
              <title>{points.length}</title>
            </svg>
          );
        }
      `,
    }),
    "no-mixed-chart-setup-and-markup-in-component",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(
    diagnostics[0].code,
    /meridian-local\(no-mixed-chart-setup-and-markup-in-component\)/,
  );
});

test("Oxlint JS plugin reports no-inline-formatting-in-svg-marks", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-inline-formatting-in-svg-marks",
      code: `
        function PriceChart({ point, tick }) {
          return (
            <svg>
              <text>{tick}</text>
              <title>{point.price.toLocaleString("en-GB")}</title>
            </svg>
          );
        }
      `,
    }),
    "no-inline-formatting-in-svg-marks",
  );

  assert.equal(diagnostics.length, 1);
  assert.ok(
    diagnostics.every((entry) =>
      /meridian-local\(no-inline-formatting-in-svg-marks\)/.test(entry.code),
    ),
  );
});

test("Oxlint JS plugin reports no-manual-active-item-scan-before-render", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-manual-active-item-scan-before-render",
      code: `
        function PriceChart({ points, activeKey }) {
          let activePoint = null;

          for (const point of points) {
            if (point.year === activeKey) {
              activePoint = point;
              break;
            }
          }

          return <svg>{activePoint ? <circle cx={activePoint.x} cy={activePoint.y} /> : null}</svg>;
        }
      `,
    }),
    "no-manual-active-item-scan-before-render",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(
    diagnostics[0].code,
    /meridian-local\(no-manual-active-item-scan-before-render\)/,
  );
});

test("Oxlint JS plugin reports no-multi-phase-render-components", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-multi-phase-render-components",
      code: `
        import { scaleLinear, line } from "d3";

        function PropertyPriceChartContent({ data, activeKey }) {
          const points = data.map((point) => ({ ...point, yearValue: Number(point.year) }));
          const yTicks = [0, 1, 2, 3];
          const yearTicks = points.map((point) => point.yearValue);
          const xScale = scaleLinear().domain([0, 10]).range([0, 100]);
          const yScale = scaleLinear().domain([0, 10]).range([100, 0]);
          const path = line().x((point) => xScale(point.yearValue)).y((point) => yScale(point.price))(points);
          let activePoint = null;

          for (const point of points) {
            if (point.year === activeKey) {
              activePoint = point;
              break;
            }
          }

          const pointMarks = [];
          for (const point of points) {
            pointMarks.push(<circle key={point.year} cx={xScale(point.yearValue)} cy={yScale(point.price)} />);
          }

          return (
            <svg>
              {yTicks.map((tick) => <text key={tick}>{tick}</text>)}
              {yearTicks.map((tick) => <text key={tick}>{tick}</text>)}
              {path ? <path d={path} /> : null}
              {activePoint ? <line x1={0} y1={0} x2={10} y2={10} /> : null}
              {pointMarks}
            </svg>
          );
        }
      `,
    }),
    "no-multi-phase-render-components",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(
    diagnostics[0].code,
    /meridian-local\(no-multi-phase-render-components\)/,
  );
});

test("Oxlint JS plugin does not report no-jsx-in-variables for config objects with nested JSX fields", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-jsx-in-variables",
      options: [{ allowNamePattern: "^$" }],
      code: `
        const menuAction = {
          label: "Area",
          description: "Open the area overview.",
          icon: <MapPin size={14} />
        };
      `,
    }),
    "no-jsx-in-variables",
  );

  assert.equal(diagnostics.length, 0);
});

test("Oxlint JS plugin does not report no-jsx-in-variables for helper calls", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-jsx-in-variables",
      options: [{ allowNamePattern: "^$" }],
      code: `
        const detailMetrics = showDetails ? buildMetricsPanel() : null;
      `,
    }),
    "no-jsx-in-variables",
  );

  assert.equal(diagnostics.length, 0);
});

test("Oxlint JS plugin reports no-nested-ternary-in-jsx", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "no-nested-ternary-in-jsx",
      code: `
        export function Example({ isPrimary, isLocked }) {
          return <section>{isPrimary ? (isLocked ? <strong>Preview</strong> : <em>Full</em>) : null}</section>;
        }
      `,
    }),
    "no-nested-ternary-in-jsx",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(
    diagnostics[0].message,
    /Do not nest ternary expressions directly in JSX render paths/,
  );
  assert.match(
    diagnostics[0].code,
    /meridian-local\(no-nested-ternary-in-jsx\)/,
  );
});

test("Oxlint JS plugin reports jsx-no-leaked-render", () => {
  const diagnostics = getRuleDiagnostics(
    runOxlintRule({
      ruleName: "jsx-no-leaked-render",
      code: `
        export function Example({ showCompareAction }) {
          return <section>{showCompareAction && <button type="button">Compare</button>}</section>;
        }
      `,
    }),
    "jsx-no-leaked-render",
  );

  assert.equal(diagnostics.length, 1);
  assert.match(diagnostics[0].message, /Potential leaked value/);
  assert.match(diagnostics[0].code, /meridian-local\(jsx-no-leaked-render\)/);
});
