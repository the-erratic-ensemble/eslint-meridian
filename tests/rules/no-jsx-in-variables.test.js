import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../rules/no-jsx-in-variables.js";
import { runRule, tsParser } from "./rule-test-utilities.js";

const RULE_NAME = "no-jsx-in-variables";

test("reports direct JSX variable assignments", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const rowView = <Row />;
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "noJsxVariable");
});

test("allows names that match the configured allow pattern", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    options: [{ allowNamePattern: "View$" }],
    code: `
      const summaryView = <SummaryCard />;
    `
  });

  assert.equal(messages.length, 0);
});

test("reports object literals that store JSX values", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const accessPanels = {
        unavailable: <UpgradePanel />,
        active: <ActivePanel />
      };
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "noJsxVariable");
});

test("reports array literals that store JSX values", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const panels = [<UpgradePanel />, <ActivePanel />];
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "noJsxVariable");
});

test("reports local JSX helper call assignments", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    parser: tsParser,
    code: `
      function availabilityDisclosureNode(model): JSX.Element | null {
        if (!model.hasAvailability) {
          return null;
        }

        return <AvailabilityDisclosure model={model} />;
      }

      const availabilityDisclosure = availabilityDisclosureNode(model);
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "noStoredJsxHelperResult");
});

test("reports conditional local JSX helper call assignments with the helper-specific message", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    parser: tsParser,
    code: `
      function errorCard(result): JSX.Element {
        return <ErrorCard result={result} />;
      }

      const errorContent = result.kind === "ok" ? null : errorCard(result);
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "noStoredJsxHelperResult");
});

test("reports JSX reassignment after the variable declaration", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    parser: tsParser,
    code: `
      let content: JSX.Element | null = null;

      if (showOverview) {
        content = <OverviewPanel />;
      }
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "noJsxVariable");
});

test("reports local JSX helper reassignment inside switch branches", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    parser: tsParser,
    code: `
      function billingPanel(): JSX.Element {
        return <BillingPanel />;
      }

      let content: JSX.Element | null = null;

      switch (activeTab) {
        case "billing":
          content = billingPanel();
          break;
        default:
          content = null;
      }
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "noStoredJsxHelperResult");
});

test("allows config objects that include JSX in nested fields", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const areaAction = {
        label: "Area",
        description: "Open the area overview.",
        icon: <MapPin />
      };
    `
  });

  assert.equal(messages.length, 0);
});

test("allows arrays of config objects that include JSX in nested fields", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const tourSteps = [
        { id: "search", icon: <Search /> },
        { id: "usage", icon: <TrendingUp /> }
      ];
    `
  });

  assert.equal(messages.length, 0);
});
