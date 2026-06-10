import assert from "node:assert/strict";
import test from "node:test";
import meridianLocalRulesPlugin from "../../rules/eslint-local-rules.js";
import { runPluginRule, tsParser } from "./rule-test-utilities.js";

test("react19-no-forwardref reports forwardRef usage", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "react19-no-forwardref",
    filename: "src/components/card.tsx",
    code: `
      import React, { forwardRef } from "react";
      export const Card = forwardRef(function Card(props, ref) {
        return <div ref={ref}>{props.children}</div>;
      });
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "avoidForwardRef");
});

test("react19-no-forwardref supports path allowlist", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "react19-no-forwardref",
    filename: "src/legacy/card.tsx",
    options: [{ allowPathIncludes: ["legacy"] }],
    code: `
      import { forwardRef } from "react";
      export const Card = forwardRef(function Card(props, ref) {
        return <div ref={ref}>{props.children}</div>;
      });
    `,
  });

  assert.equal(messages.length, 0);
});

test("no-excessive-component-props reports oversized component APIs", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-excessive-component-props",
    filename: "src/features/auth/LoginPage.tsx",
    parser: tsParser,
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
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "tooManyProps");
});

test("no-prop-bags reports nested component prop bags", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-prop-bags",
    filename: "src/features/auth/LoginFormFields.tsx",
    parser: tsParser,
    code: `
      interface LoginFormFieldsProps {
        formData: LoginFormData;
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
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "tooManyPropBags");
});

test("no-deep-control-flow-nesting reports third nested control-flow layer", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-deep-control-flow-nesting",
    filename: "src/features/example.ts",
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
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "tooDeep");
});

test("no-complex-boolean-assignments reports staged boolean flags with dense logical trees", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-complex-boolean-assignments",
    filename: "src/features/example.tsx",
    code: `
      const confirmButtonDisabled =
        !targetPlan ||
        isSubmitting ||
        (!checkoutError && (!quote || dialogState === "loading-quote" || !quoteMatchesCadence));
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "complexBooleanAssignment");
});

test("no-complex-conditional-text-in-jsx reports dense inline text branches", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-complex-conditional-text-in-jsx",
    filename: "src/features/example.tsx",
    code: `
      const view = (
        <p>
          {criticalFeatures.length > 0 || warningFeatures.length > 0
            ? \`\${criticalFeatures.length} critical · \${warningFeatures.length} warning\`
            : "No alerts"}
        </p>
      );
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "complexConditionalTextInJsx");
});

test("no-complex-array-callbacks reports dense predicate callbacks", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-complex-array-callbacks",
    filename: "src/features/example.ts",
    code: `
      const fallbackGroups = groups.filter(
        (group) =>
          !usedGroupKeys.has(group.key) &&
          !!group.nearestAmenityName &&
          !!group.nearestDistanceLabel &&
          (group.nearestDistanceMeters ?? 0) > 0
      );
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "complexCallback");
});

test("no-nested-try reports try blocks nested inside catch blocks", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-nested-try",
    filename: "src/features/example.ts",
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
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "nestedTry");
});

test("no-long-collection-method-chains reports three-step pipelines", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-long-collection-method-chains",
    filename: "src/features/example.ts",
    code: `
      const itemsToShow = (items ?? [])
        .filter((item) => item.visible)
        .slice(0, 3)
        .map((item) => item.id);
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "longCollectionMethodChain");
});

test("no-collection-methods-on-spread-arrays reports pure spread arrays with immediate collection work", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-collection-methods-on-spread-arrays",
    filename: "src/features/example.ts",
    code: `
      const points = [...(items ?? [])]
        .filter((item) => item.visible)
        .map((item) => item.id);
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "collectionMethodsOnSpreadArray");
});

test("no-long-inline-object-methods reports long object property methods", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-long-inline-object-methods",
    filename: "src/store/example.ts",
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
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "tooLong");
});

test("no-indexed-collection-pipeline-fallbacks reports indexed pipeline fallback usage", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-indexed-collection-pipeline-fallbacks",
    filename: "src/features/example.ts",
    code: `
      const selected =
        items.filter((item) => item.visible).toSorted((left, right) => left.rank - right.rank)[0] ??
        null;
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "indexedCollectionPipelineFallback");
});

test("no-indexed-collection-pipeline-fallbacks reports at(0) pipeline usage", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-indexed-collection-pipeline-fallbacks",
    filename: "src/features/example.ts",
    code: `
      const selected = items.filter((item) => item.visible).at(0);
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "indexedCollectionPipelineFallback");
});

test("no-inline-spread-collection-pipelines reports spread pipeline plus post-processing", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-inline-spread-collection-pipelines",
    filename: "src/features/example.ts",
    code: `
      const nextItems = [selectedItem, ...items.filter((item) => item.id !== selectedItem.id)].slice(0, 5);
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "inlineSpreadCollectionPipeline");
});

test("no-complex-inline-object-methods reports short but complex object property methods", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-complex-inline-object-methods",
    filename: "src/store/example.ts",
    code: `
      const store = {
        fetchSummary: () =>
          isReady && hasSelection
            ? items.map((item) => (item.active ? summarize(item) : null))
            : null
      };
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "tooComplex");
});

test("no-forbidden-declaration-names reports contains match case-insensitively", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-forbidden-declaration-names",
    filename: "src/features/example.tsx",
    options: [{ patterns: [{ contains: "derive", caseSensitive: false }] }],
    code: `
      const useDerivedSummary = () => "ok";
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "avoidForbiddenDeclarationName");
});

test("no-forbidden-declaration-names reports render contains match case-insensitively", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-forbidden-declaration-names",
    filename: "src/features/example.tsx",
    options: [{ patterns: [{ contains: "render", caseSensitive: false }] }],
    code: `
      function RenderBillingPanel() {
        return null;
      }
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "avoidForbiddenDeclarationName");
});

test("no-forbidden-declaration-names reports rendered variable names case-insensitively", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-forbidden-declaration-names",
    filename: "src/features/example.tsx",
    options: [{ patterns: [{ contains: "render", caseSensitive: false }] }],
    code: `
      const renderedSummary = null;
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "avoidForbiddenDeclarationName");
});

test("no-forbidden-declaration-names reports renderer interface names case-insensitively", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-forbidden-declaration-names",
    filename: "src/features/example.ts",
    parser: tsParser,
    options: [{ patterns: [{ contains: "render", caseSensitive: false }] }],
    code: `
      interface ReportingRenderer {
        id: string;
      }
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "avoidForbiddenDeclarationName");
});

test("no-forbidden-declaration-names reports renderer interface property names case-insensitively", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-forbidden-declaration-names",
    filename: "src/features/example.ts",
    parser: tsParser,
    options: [{ patterns: [{ contains: "render", caseSensitive: false }] }],
    code: `
      interface ReportingHealth {
        renderer?: string;
      }
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "avoidForbiddenDeclarationName");
});

test("no-forbidden-declaration-names allowNames bypasses approved contract-bound names", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-forbidden-declaration-names",
    filename: "src/features/example.ts",
    parser: tsParser,
    options: [
      {
        allowNames: ["buildingFabricScore"],
        patterns: [{ startsWith: "build", caseSensitive: true }],
      },
    ],
    code: `
      interface ReferenceSummary {
        buildingFabricScore?: number | null;
      }
    `,
  });

  assert.equal(messages.length, 0);
});

test("no-forbidden-declaration-names allows resolve as a Promise executor parameter passed to setTimeout", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-forbidden-declaration-names",
    filename: "src/features/example.ts",
    parser: tsParser,
    options: [{ patterns: [{ contains: "resolve", caseSensitive: false }] }],
    code: `
      const waitForValue = (t: number, val: string) =>
        new Promise((resolve) => setTimeout(resolve, t, val));
    `,
  });

  assert.equal(messages.length, 0);
});

test("no-forbidden-declaration-names allows resolve as a Promise executor parameter inside a setTimeout callback", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-forbidden-declaration-names",
    filename: "src/features/example.ts",
    parser: tsParser,
    options: [{ patterns: [{ contains: "resolve", caseSensitive: false }] }],
    code: `
      const timeoutPromise = new Promise<typeof FACT_SHEET_TIMEOUT>((resolve) => {
        timeoutId = setTimeout(() => resolve(FACT_SHEET_TIMEOUT), timeoutMs);
      });
    `,
  });

  assert.equal(messages.length, 0);
});

test("no-forbidden-declaration-names allows error boundary lifecycle member names", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-forbidden-declaration-names",
    filename: "src/features/example.tsx",
    parser: tsParser,
    options: [
      {
        patterns: [
          { contains: "render", caseSensitive: false },
          { contains: "derive", caseSensitive: false },
        ],
      },
    ],
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
  });

  assert.equal(messages.length, 0);
});

test("no-forbidden-declaration-names still reports render on non-error-boundary class members", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-forbidden-declaration-names",
    filename: "src/features/example.tsx",
    parser: tsParser,
    options: [{ patterns: [{ contains: "render", caseSensitive: false }] }],
    code: `
      class ReportRenderer {
        render() {
          return null;
        }
      }
    `,
  });

  assert.equal(messages.length, 2);
  assert.ok(
    messages.every(
      (message) => message.messageId === "avoidForbiddenDeclarationName",
    ),
  );
});

test("no-forbidden-declaration-names reports renderer object property names case-insensitively", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-forbidden-declaration-names",
    filename: "src/features/example.ts",
    options: [{ patterns: [{ contains: "render", caseSensitive: false }] }],
    code: `
      const reportingHealth = {
        renderer: "pdf",
      };
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "avoidForbiddenDeclarationName");
});

test("no-forbidden-declaration-names reports rendered class field names case-insensitively", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-forbidden-declaration-names",
    filename: "src/features/example.ts",
    parser: tsParser,
    options: [{ patterns: [{ contains: "render", caseSensitive: false }] }],
    code: `
      class PreviewState {
        renderedSummary = "";
      }
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "avoidForbiddenDeclarationName");
});

test("no-forbidden-declaration-names reports renderer parameter names case-insensitively", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-forbidden-declaration-names",
    filename: "src/features/example.ts",
    options: [{ patterns: [{ contains: "render", caseSensitive: false }] }],
    code: `
      function reportStatus(renderer) {
        return renderer;
      }
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "avoidForbiddenDeclarationName");
});

test("no-forbidden-declaration-names supports startsWith matching", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-forbidden-declaration-names",
    filename: "src/features/example.ts",
    options: [{ patterns: [{ startsWith: "legacy", caseSensitive: true }] }],
    code: `
      function legacyTransform() {
        return true;
      }
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "avoidForbiddenDeclarationName");
});

test("no-forbidden-declaration-names supports endsWith matching", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-forbidden-declaration-names",
    filename: "src/features/example.tsx",
    options: [{ patterns: [{ endsWith: "Factory", caseSensitive: true }] }],
    code: `
      const reportFactory = () => null;
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "avoidForbiddenDeclarationName");
});

test("no-forbidden-declaration-names reports ClassName-suffixed function names", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-forbidden-declaration-names",
    filename: "src/features/example.tsx",
    options: [{ patterns: [{ endsWith: "ClassName", caseSensitive: true }] }],
    code: `
      function buttonClassName() {
        return "btn";
      }
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "avoidForbiddenDeclarationName");
});

test("no-forbidden-declaration-names reports View-suffixed function names", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-forbidden-declaration-names",
    filename: "src/features/example.tsx",
    options: [{ patterns: [{ endsWith: "View", caseSensitive: true }] }],
    code: `
      function accountSummaryView() {
        return null;
      }
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "avoidForbiddenDeclarationName");
});

test("no-forbidden-declaration-names respects case sensitivity", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-forbidden-declaration-names",
    filename: "src/features/example.ts",
    options: [{ patterns: [{ contains: "derive", caseSensitive: true }] }],
    code: `
      const useDerivedSummary = () => "ok";
    `,
  });

  assert.equal(messages.length, 0);
});

test("no-jsx-in-variables reports direct JSX assignment", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-jsx-in-variables",
    filename: "src/features/example.tsx",
    parser: tsParser,
    code: `
      const detailMetrics = <section>Metrics</section>;
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "noJsxVariable");
});

test("no-jsx-iife reports IIFEs nested inside JSX map callbacks", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-jsx-iife",
    filename: "src/features/example.tsx",
    parser: tsParser,
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
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "noJsxIife");
});

test("no-jsx-in-variables reports ternary-wrapped JSX assignment", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-jsx-in-variables",
    filename: "src/features/example.tsx",
    parser: tsParser,
    code: `
      const detailMetrics = showDetails ? (
        <section>Metrics</section>
      ) : null;
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "noJsxVariable");
});

test("no-jsx-in-variables reports logical JSX assignment", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-jsx-in-variables",
    filename: "src/features/example.tsx",
    parser: tsParser,
    code: `
      const detailMetrics = showDetails && <section>Metrics</section>;
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "noJsxVariable");
});

test("no-jsx-in-variables reports JSX reassignment inside control flow", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-jsx-in-variables",
    filename: "src/features/example.tsx",
    parser: tsParser,
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
  });

  assert.equal(messages.length, 2);
  assert.ok(messages.every((message) => message.messageId === "noJsxVariable"));
});

test("no-jsx-in-variables respects allowNamePattern", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-jsx-in-variables",
    filename: "src/features/example.tsx",
    parser: tsParser,
    options: [{ allowNamePattern: "^allowedJsx$" }],
    code: `
      const allowedJsx = showDetails ? <section>Metrics</section> : null;
    `,
  });

  assert.equal(messages.length, 0);
});

test("no-jsx-in-variables ignores non-JSX helper call assignments", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-jsx-in-variables",
    filename: "src/features/example.tsx",
    parser: tsParser,
    code: `
      const detailMetrics = showDetails ? buildMetricsPanel() : null;
    `,
  });

  assert.equal(messages.length, 0);
});

test("no-jsx-in-variables reports local JSX helper call assignments", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-jsx-in-variables",
    filename: "src/features/example.tsx",
    parser: tsParser,
    code: `
      function availabilityDisclosureNode(model: { hasAvailability: boolean }): JSX.Element | null {
        if (!model.hasAvailability) {
          return null;
        }

        return <AvailabilityDisclosure model={model} />;
      }

      const availabilityDisclosure = availabilityDisclosureNode(model);
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "noStoredJsxHelperResult");
});

test("no-jsx-in-variables reports conditional local JSX helper call assignments with the helper-specific message", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-jsx-in-variables",
    filename: "src/features/example.tsx",
    parser: tsParser,
    code: `
      function errorCard(result: { kind: string }): JSX.Element {
        return <ErrorCard result={result} />;
      }

      const errorContent = result.kind === "ok" ? null : errorCard(result);
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "noStoredJsxHelperResult");
});

test("no-jsx-in-variables reports object literals that store JSX values", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-jsx-in-variables",
    filename: "src/features/example.tsx",
    parser: tsParser,
    code: `
      const accessPanels = {
        unavailable: <section>Upgrade</section>,
        active: <section>Enabled</section>
      };
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "noJsxVariable");
});

test("no-jsx-in-variables allows config objects that carry JSX in nested fields", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-jsx-in-variables",
    filename: "src/features/example.tsx",
    parser: tsParser,
    code: `
      const areaAction = {
        label: "Area",
        description: "Open the area overview.",
        icon: <MapPin size={14} />
      };
    `,
  });

  assert.equal(messages.length, 0);
});

test("no-local-jsx-helper-calls reports argument-taking JSX helpers inside JSX", () => {
  const messages = runPluginRule({
    plugin: meridianLocalRulesPlugin,
    ruleName: "no-local-jsx-helper-calls",
    filename: "src/features/example.tsx",
    parser: tsParser,
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
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "localJsxHelperCall");
});
