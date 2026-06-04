import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../react-component-filename-pascal-case.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "react-component-filename-pascal-case";

test("allows PascalCase filenames for component files", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    filename: "src/components/DashboardCard.tsx",
    code: `
      export function DashboardCard() {
        return <section>Ready</section>;
      }
    `
  });

  assert.equal(messages.length, 0);
});

test("reports lowercase filenames when they define PascalCase components", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    filename: "src/components/dashboard-card.tsx",
    code: `
      export function DashboardCard() {
        return <section>Ready</section>;
      }
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "notPascal");
});

test("ignores Next app route file conventions", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    filename: "src/app/dashboard/page.tsx",
    code: `
      export default function DashboardPage() {
        return <section>Ready</section>;
      }
    `
  });

  assert.equal(messages.length, 0);
});

test("ignores configured filenames", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    filename: "src/components/story.tsx",
    options: [{ ignore: ["story"] }],
    code: `
      export const StoryCard = () => <section>Ready</section>;
    `
  });

  assert.equal(messages.length, 0);
});
