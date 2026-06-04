import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../no-mixed-ui-and-domain-logic-in-component.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-mixed-ui-and-domain-logic-in-component";

test("ignores lowercase helpers even when they contain JSX and branching", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const dashboardCard = ({ user, orders }) => {
        if (user?.isArchived) {
          return <div>Archived</div>;
        }

        if (orders.length > 0) {
          return <div>Active</div>;
        }

        return <div>Empty</div>;
      };
    `
  });

  assert.equal(messages.length, 0);
});

test("reports PascalCase components with heavy inline control flow", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      function DashboardCard({ user, orders, flags, teams, retry }) {
        if (user?.isArchived) {
          return <div>Archived</div>;
        }

        if (orders.length > 10) {
          retry();
        }

        switch (user.plan) {
          case "pro":
            break;
          default:
            break;
        }

        for (const team of teams) {
          if (team.isPrimary) {
            retry();
          }
        }

        while (flags.pending) {
          retry();
          break;
        }

        const summary = flags.ready ? orders : teams;

        return <section>{summary.length}</section>;
      }
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "mixedUiDomainLogic");
});

test("respects custom complexity thresholds", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    options: [{ maxComplexityNodes: 1 }],
    code: `
      function DashboardCard({ user, orders }) {
        if (user?.isArchived) {
          return <div>Archived</div>;
        }

        const summary = orders.length > 0 ? "Loaded" : "Empty";

        return <section>{summary}</section>;
      }
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "mixedUiDomainLogic");
});
